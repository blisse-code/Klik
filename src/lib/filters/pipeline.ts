// Two-pass WebGL2 filter pipeline. Pass 1 = tone/colour/grade; Pass 2 =
// vignette + grain + halation. After GL, an optional Canvas2D step draws
// a camera-specific frame overlay (polaroid border, 35mm sprockets, etc.)
// before encoding back to a PNG data URL.

import { VERTEX_SHADER, TONE_SHADER, TEXTURE_SHADER } from './shaders';
import { paramsToSettings, type FrameOverlay } from './mapping';
import type { ImageParams } from '../providers';

function compile(gl: WebGL2RenderingContext, type: number, src: string): WebGLShader {
  const sh = gl.createShader(type);
  if (!sh) throw new Error('createShader failed');
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    const info = gl.getShaderInfoLog(sh);
    gl.deleteShader(sh);
    throw new Error(`Shader compile failed: ${info}`);
  }
  return sh;
}

function link(gl: WebGL2RenderingContext, vs: WebGLShader, fs: WebGLShader): WebGLProgram {
  const program = gl.createProgram();
  if (!program) throw new Error('createProgram failed');
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const info = gl.getProgramInfoLog(program);
    gl.deleteProgram(program);
    throw new Error(`Program link failed: ${info}`);
  }
  return program;
}

function setupFullscreenQuad(gl: WebGL2RenderingContext, program: WebGLProgram) {
  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  // Two triangles covering NDC, with UVs in the second pair.
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([
      -1, -1, 0, 0,
       1, -1, 1, 0,
      -1,  1, 0, 1,
      -1,  1, 0, 1,
       1, -1, 1, 0,
       1,  1, 1, 1,
    ]),
    gl.STATIC_DRAW
  );
  const aPos = gl.getAttribLocation(program, 'a_pos');
  const aUv = gl.getAttribLocation(program, 'a_uv');
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 16, 0);
  gl.enableVertexAttribArray(aUv);
  gl.vertexAttribPointer(aUv, 2, gl.FLOAT, false, 16, 8);
  return vao;
}

function texFromImage(gl: WebGL2RenderingContext, img: HTMLImageElement): WebGLTexture {
  const tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  return tex!;
}

function emptyTex(gl: WebGL2RenderingContext, w: number, h: number): WebGLTexture {
  const tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  return tex!;
}

function loadImage(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Could not decode source image.'));
    img.crossOrigin = 'anonymous';
    img.src = dataUrl;
  });
}

function drawFrame(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  frame: FrameOverlay
) {
  if (frame.kind === 'polaroid') {
    const border = Math.round(Math.min(w, h) * 0.05);
    const bottom = Math.round(Math.min(w, h) * 0.18);
    ctx.fillStyle = '#f7f4ea';
    ctx.fillRect(0, 0, w, border);
    ctx.fillRect(0, h - bottom, w, bottom);
    ctx.fillRect(0, 0, border, h);
    ctx.fillRect(w - border, 0, border, h);
    return;
  }
  if (frame.kind === 'film35mm') {
    const stripH = Math.round(h * 0.08);
    ctx.fillStyle = '#0d0d0d';
    ctx.fillRect(0, 0, w, stripH);
    ctx.fillRect(0, h - stripH, w, stripH);
    const holeCount = 14;
    const holeW = w / holeCount;
    ctx.fillStyle = '#1a1a1a';
    for (let i = 0; i < holeCount; i++) {
      const cx = i * holeW + holeW / 2;
      const holeSize = Math.min(holeW * 0.4, stripH * 0.55);
      const top = stripH / 2 - holeSize / 2;
      const bot = h - stripH / 2 - holeSize / 2;
      ctx.fillRect(cx - holeSize / 2, top, holeSize, holeSize);
      ctx.fillRect(cx - holeSize / 2, bot, holeSize, holeSize);
    }
    return;
  }
  if (frame.kind === 'disposable') {
    // Cheap date stamp in the corner.
    ctx.fillStyle = '#ff8a00';
    ctx.font = `bold ${Math.round(h * 0.025)}px monospace`;
    const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, ' ');
    const text = stamp;
    const pad = Math.round(h * 0.03);
    ctx.fillText(text, w - ctx.measureText(text).width - pad, h - pad);
  }
}

export async function applyFilters(
  imageDataUrl: string,
  params: ImageParams
): Promise<string> {
  const img = await loadImage(imageDataUrl);
  const w = img.naturalWidth;
  const h = img.naturalHeight;

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const gl = canvas.getContext('webgl2', { preserveDrawingBuffer: true });
  if (!gl) throw new Error('WebGL2 not supported in this browser.');

  const { tone, texture, frame } = paramsToSettings(params);

  const vs = compile(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
  const fsTone = compile(gl, gl.FRAGMENT_SHADER, TONE_SHADER);
  const fsTex = compile(gl, gl.FRAGMENT_SHADER, TEXTURE_SHADER);
  const toneProg = link(gl, vs, fsTone);
  const texProg = link(gl, vs, fsTex);

  const sourceTex = texFromImage(gl, img);
  const interTex = emptyTex(gl, w, h);
  const fbo = gl.createFramebuffer();

  // Pass 1: tone shader → interTex
  gl.useProgram(toneProg);
  setupFullscreenQuad(gl, toneProg);
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
  gl.framebufferTexture2D(
    gl.FRAMEBUFFER,
    gl.COLOR_ATTACHMENT0,
    gl.TEXTURE_2D,
    interTex,
    0
  );
  gl.viewport(0, 0, w, h);
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, sourceTex);
  gl.uniform1i(gl.getUniformLocation(toneProg, 'u_image'), 0);
  gl.uniform1f(gl.getUniformLocation(toneProg, 'u_exposure'), tone.exposure);
  gl.uniform1f(gl.getUniformLocation(toneProg, 'u_contrast'), tone.contrast);
  gl.uniform1f(gl.getUniformLocation(toneProg, 'u_saturation'), tone.saturation);
  gl.uniform3fv(gl.getUniformLocation(toneProg, 'u_tintShadow'), tone.tintShadow);
  gl.uniform3fv(gl.getUniformLocation(toneProg, 'u_tintHighlight'), tone.tintHighlight);
  gl.uniform1f(gl.getUniformLocation(toneProg, 'u_tintAmount'), tone.tintAmount);
  gl.uniform1f(gl.getUniformLocation(toneProg, 'u_temperature'), tone.temperature);
  gl.uniform1f(
    gl.getUniformLocation(toneProg, 'u_tintGreenMagenta'),
    tone.tintGreenMagenta
  );
  gl.uniform1f(gl.getUniformLocation(toneProg, 'u_monoMix'), tone.monoMix);
  gl.drawArrays(gl.TRIANGLES, 0, 6);

  // Pass 2: texture shader on interTex → default framebuffer (canvas).
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  gl.useProgram(texProg);
  setupFullscreenQuad(gl, texProg);
  gl.viewport(0, 0, w, h);
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, interTex);
  gl.uniform1i(gl.getUniformLocation(texProg, 'u_image'), 0);
  gl.uniform1f(gl.getUniformLocation(texProg, 'u_vignette'), texture.vignette);
  gl.uniform1f(gl.getUniformLocation(texProg, 'u_grain'), texture.grain);
  gl.uniform1f(gl.getUniformLocation(texProg, 'u_halation'), texture.halation);
  gl.uniform1f(gl.getUniformLocation(texProg, 'u_seed'), Math.random() * 1000);
  gl.drawArrays(gl.TRIANGLES, 0, 6);
  gl.finish();

  // Copy GL canvas onto a 2D canvas, then draw frame overlay (cheaper to
  // do borders/stamps in 2D than another shader pass).
  const out = document.createElement('canvas');
  out.width = w;
  out.height = h;
  const ctx = out.getContext('2d')!;
  ctx.drawImage(canvas, 0, 0);
  if (frame.kind !== 'none') drawFrame(ctx, w, h, frame);

  return out.toDataURL('image/png');
}
