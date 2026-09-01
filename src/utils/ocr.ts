import {
  createWorker,
  type Worker,
} from "tesseract.js";

export async function createExpiryOcrWorker(): Promise<Worker> {
  return createWorker("eng");
}

export async function extractTextFromImage(
  worker: Worker,
  image: HTMLCanvasElement,
): Promise<string> {
  const result = await worker.recognize(image);

  return result.data.text.trim();
}