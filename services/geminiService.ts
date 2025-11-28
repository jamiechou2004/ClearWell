import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Sends an image to Gemini 2.5 Flash Image model to remove watermarks.
 * @param base64Data The base64 string of the image (without the data URL prefix).
 * @param mimeType The MIME type of the image.
 * @param customInstruction Optional custom instruction.
 * @returns The base64 string of the processed image.
 */
export const removeWatermark = async (
  base64Data: string, 
  mimeType: string,
  customInstruction?: string
): Promise<string> => {
  try {
    const prompt = customInstruction || "Remove all watermarks, text overlays, logos, and copyright stamps from this image. Reconstruct the background behind the removed elements seamlessly to look natural. Return only the cleaned image.";
    
    // Clean base64 if it comes with prefix (though we try to pass raw base64)
    const cleanBase64 = base64Data.includes(',') ? base64Data.split(',')[1] : base64Data;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              data: cleanBase64,
              mimeType: mimeType,
            },
          },
          {
            text: prompt,
          },
        ],
      },
    });

    // Iterate through parts to find the image
    const candidates = response.candidates;
    if (candidates && candidates.length > 0) {
      const parts = candidates[0].content.parts;
      for (const part of parts) {
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
