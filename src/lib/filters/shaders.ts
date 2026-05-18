// GLSL shader sources for the local filter pipeline. Each pass is a
// simple fullscreen quad with a sampler and a uniform block.

export const VERTEX_SHADER = `#version 300 es
in vec2 a_pos;
in vec2 a_uv;
out vec2 v_uv;
void main() {
  v_uv = a_uv;
  gl_Position = vec4(a_pos, 0.0, 1.0);
}
`;

// Pass 1: tone, colour grade, ambience.
// All colour manipulation is folded into one shader to minimise draw calls.
export const TONE_SHADER = `#version 300 es
precision highp float;
in vec2 v_uv;
out vec4 outColor;
uniform sampler2D u_image;
uniform float u_exposure;      // -1.0 .. +1.0
uniform float u_contrast;      //  0.5 .. 1.5
uniform float u_saturation;    //  0.0 .. 2.0
uniform vec3  u_tintShadow;    //  shadow tint colour
uniform vec3  u_tintHighlight; //  highlight tint colour
uniform float u_tintAmount;    //  0.0 .. 1.0  split-tone strength
uniform float u_temperature;   // -1.0 .. +1.0  (- cool, + warm)
uniform float u_tintGreenMagenta; // -1.0 .. +1.0 (- green, + magenta)
uniform float u_monoMix;       // 0.0 .. 1.0 mix toward luminance

vec3 luma(vec3 c) {
  float l = dot(c, vec3(0.2126, 0.7152, 0.0722));
  return vec3(l);
}

void main() {
  vec3 c = texture(u_image, v_uv).rgb;

  // Exposure (linear gain in stops, fudged in sRGB for speed).
  c *= pow(2.0, u_exposure);

  // White balance: shift R/B against each other for temperature,
  // shift G against M for tint.
  c.r += u_temperature * 0.08;
  c.b -= u_temperature * 0.08;
  c.g += u_tintGreenMagenta * 0.06;

  // Contrast around mid grey.
  c = (c - 0.5) * u_contrast + 0.5;

  // Saturation.
  vec3 l = luma(c);
  c = mix(l, c, u_saturation);

  // Split-toning: lerp shadows toward u_tintShadow, highlights toward u_tintHighlight.
  float lum = clamp(luma(c).r, 0.0, 1.0);
  vec3 shadowTinted    = mix(c, u_tintShadow,    (1.0 - lum) * u_tintAmount);
  vec3 highlightTinted = mix(shadowTinted, u_tintHighlight, lum * u_tintAmount);
  c = highlightTinted;

  // Optional monochrome blend (used for B/W and high-contrast looks).
  c = mix(c, luma(c), u_monoMix);

  outColor = vec4(clamp(c, 0.0, 1.0), 1.0);
}
`;

// Pass 2: vignette + grain + halation.
// Combined so we only do one extra fullscreen pass.
export const TEXTURE_SHADER = `#version 300 es
precision highp float;
in vec2 v_uv;
out vec4 outColor;
uniform sampler2D u_image;
uniform float u_vignette;      // 0.0 .. 1.0
uniform float u_grain;         // 0.0 .. 0.3
uniform float u_halation;      // 0.0 .. 0.5
uniform float u_seed;          // random seed for grain noise

// Cheap pseudo-random for film grain.
float rand(vec2 co) {
  return fract(sin(dot(co, vec2(12.9898, 78.233)) + u_seed) * 43758.5453);
}

void main() {
  vec3 c = texture(u_image, v_uv).rgb;

  // Halation: bright red channel bleeds outward. Sample neighbours for the red.
  if (u_halation > 0.0) {
    vec2 off = vec2(0.004, 0.004);
    float r0 = texture(u_image, v_uv).r;
    float rL = texture(u_image, v_uv - off).r;
    float rR = texture(u_image, v_uv + off).r;
    float bloom = max(0.0, (r0 + rL + rR) / 3.0 - 0.7);
    c.r += bloom * u_halation * 1.5;
    c.g += bloom * u_halation * 0.3;
  }

  // Vignette: radial darkening from the centre.
  vec2 d = v_uv - vec2(0.5);
  float dist = length(d) * 1.4;
  float vig = smoothstep(0.5, 1.1, dist);
  c *= 1.0 - vig * u_vignette;

  // Film grain: monochromatic noise overlay (additive then clamped).
  if (u_grain > 0.0) {
    float n = rand(v_uv * vec2(800.0, 800.0)) - 0.5;
    c += vec3(n) * u_grain;
  }

  outColor = vec4(clamp(c, 0.0, 1.0), 1.0);
}
`;
