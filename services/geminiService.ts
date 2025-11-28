import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Sends an image to Gemini 2.5 Flash Image model to remove watermarks.
 * @param base64Data The base64 string of the image (without the data URL prefix).
 * @param mimeType The MIME type of the image.
 * @param maskBase64 Optional base64 string of the image with the watermark highlighted (visual guide).
 * @returns The base64 string of the processed image.
 */
export const removeWatermark = async (
  base64Data: string, 
  mimeType: string,
  maskBase64?: string
): Promise<string> => {
  try {
    let prompt = "Remove all watermarks, text overlays, logos, and copyright stamps from this image. Reconstruct the background behind the removed elements seamlessly to look natural. Return only the cleaned image.";
    const parts: any[] = [];

    // Clean base64 if it comes with prefix
    const cleanOriginal = base64Data.includes(',') ? base64Data.split(',')[1] : base64Data;

    // 1. Add the Original Image
    parts.push({
      inlineData: {
        data: cleanOriginal,
        mimeType: mimeType,
      },
    });

    // 2. Add the Mask Guide if provided
    if (maskBase64) {
      const cleanMask = maskBase64.includes(',') ? maskBase64.split(',')[1] : maskBase64;
      parts.push({
        inlineData: {
          data: cleanMask,
          mimeType: 'image/png', // Masks from canvas are usually PNG
        },
      });
      prompt = "The second image provided is a guide where the specific watermarks to be removed are highlighted in red. Using this guide, remove those specific elements from the first image. Reconstruct the background seamlessly. Return only the cleaned first image.";
    }

    // 3. Add the Prompt
    parts.push({
      text: prompt,
    });

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: parts,
      },
    });

    // Iterate through parts to find the image
    const candidates = response.candidates;
    if (candidates && candidates.length > 0) {
      const responseParts = candidates[0].content.parts;
      for (const part of responseParts) {
        if (part.inlineData && part.inlineData.data) {
          return part.inlineData.data;
        }
      }
    }

    throw new Error("No image data received from Gemini.");

  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};
