import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "50mb" })); // Increase limit for base64 images

  // API constraints check
  if (!process.env.GEMINI_API_KEY) {
    console.warn("WARNING: GEMINI_API_KEY is not set.");
  }

  // API Routes
  app.post("/api/transform", async (req, res) => {
    try {
      const { imageParams, base64ImageContext } = req.body;
      const { 
        promptContext,
        mode,
        aesthetic,
        colourGrade,
        cameraType,
        resolutionLabel, // Used to construct prompt logic but maybe not actually applied in gemini call since gemini-2.5-flash-image configs are different
        filterTexture,
        ambience
      } = imageParams;

      // Extract the mime type and data from data:image/jpeg;base64,...
      const match = base64ImageContext.match(/^data:(image\/[a-zA-Z]+);base64,(.+)$/);
      if (!match) {
        return res.status(400).json({ error: "Invalid base64 image format." });
      }
      const mimeType = match[1];
      const base64Data = match[2];

      const ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      const fullPrompt = `Transform the uploaded photo into a ${mode || 'photorealistic'} image with a ${aesthetic || 'natural'} look. Apply ${colourGrade || 'natural'} colour grading, simulate a ${cameraType || 'natural'} camera, add ${filterTexture || 'clean'} texture, and change the ambience to ${ambience || 'original'}. Preserve the original subject identity, pose, composition, clothing structure, facial details, object placement, and image quality. Maintain high sharpness, natural lighting coherence, realistic depth, and clean detail. Avoid artifacts, distortion, extra limbs, warped facial features, unreadable text, or excessive stylization unless explicitly selected.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            {
              inlineData: {
                data: base64Data,
                mimeType: mimeType,
              },
            },
            {
              text: fullPrompt,
            },
          ],
        },
      });

      let generatedImageUrl = null;
      if (response.candidates && response.candidates[0].content.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
            generatedImageUrl = `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
            break;
          }
        }
      }

      if (generatedImageUrl) {
        res.json({ imageUrl: generatedImageUrl, prompt: fullPrompt });
      } else {
        console.error('No image returned from Gemini', response);
        res.status(500).json({ error: "No image received from AI model." });
      }

    } catch (error: any) {
      console.error("Error transforming image:", error);
      res.status(500).json({ error: error.message || "Failed to transform image" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
