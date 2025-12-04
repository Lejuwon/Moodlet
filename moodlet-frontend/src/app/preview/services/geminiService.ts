import { GoogleGenAI, Modality } from "@google/genai";
import { ImageFile } from "../types";

// Fix: Support Next.js client-side environment variables (NEXT_PUBLIC_API_KEY)
// while maintaining fallback for standard Node.js environments.
const apiKey = process.env.NEXT_PUBLIC_API_KEY || process.env.API_KEY;

if (!apiKey) {
  console.error("API Key is missing. Make sure NEXT_PUBLIC_API_KEY is set in your .env file.");
}

const ai = new GoogleGenAI({ apiKey: apiKey || "" });

type GenerateParams = {
  baseImageWithMarkerBase64: string;
  insertImage?: ImageFile;
  prompt?: string;
};

export const generateInteriorScene = async ({
  baseImageWithMarkerBase64,
  insertImage,
  prompt,
}: GenerateParams): Promise<string> => {
  try {
    const parts: any[] = [
      {
        inlineData: {
          data: baseImageWithMarkerBase64.split(",")[1],
          mimeType: "image/jpeg",
        },
      },
    ];

    if (insertImage) {
      parts.push({
        inlineData: {
          data: insertImage.base64.split(",")[1],
          mimeType: insertImage.file.type,
        },
      });
      parts.push({
        text: "You are an expert interior designer. In the first image (a room), there is a red quadrilateral area. In the second image, there is a furniture item or texture. Your task is to seamlessly replace the red area in the room with the item from the second image. Ensure the perspective (vanishing points), lighting, shadows, and scale match the room perfectly to create a photorealistic interior design visualization. The final output should be only the modified room image, without any red visible.",
      });
    } else if (prompt) {
      parts.push({
        text: `You are an expert interior designer. In the image, there is a red quadrilateral area. Your task is to seamlessly replace that red area with: "${prompt}". Ensure the perspective, lighting, and shadows match the existing room perfectly to create a photorealistic interior design visualization. The final output should be only the modified image, without any red visible.`,
      });
    } else {
      throw new Error("Either an insert image or a prompt must be provided.");
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      // JS SDK에서는 parts 배열 자체를 contents로 넘기는 패턴을 사용합니다.
      contents: parts,
      config: {
        responseModalities: [Modality.IMAGE],
      },
    });

    const generatedParts = response.candidates?.[0]?.content?.parts;

    if (generatedParts) {
      for (const part of generatedParts) {
        if (part.inlineData) {
          return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
      }
    }
    
    throw new Error("No image was generated.");
  } catch (error) {
    console.error("Error generating interior scene:", error);
    // Fix: Adhering to Gemini API guidelines. The application must not ask the user about the API key.
    throw new Error("Failed to generate image. Please try again.");
  }
};