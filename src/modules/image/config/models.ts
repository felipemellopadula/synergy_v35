import type { ImageModel } from "../types";

export const MODELS: ImageModel[] = [
  { id: "google:4@2", label: "Google Nano Banana 2 Pro", maxImages: 14, supportsMoodboard: true },
  { id: "google:4@1", label: "Google Nano Banana", maxImages: 2, supportsMoodboard: false },
  { id: "openai:4@1", label: "GPT Image 1.5", maxImages: 6, supportsMoodboard: false },
  { id: "ideogram:4@1", label: "Ideogram 3.0", maxImages: 1, supportsMoodboard: false },
  { id: "runware:108@1", label: "Qwen-Image", maxImages: 0, supportsMoodboard: false },
  { id: "bfl:3@1", label: "FLUX.1 Kontext [max]", maxImages: 1, supportsMoodboard: false },
  { id: "bfl:4@1", label: "FLUX.2 [pro]", maxImages: 10, supportsMoodboard: true },
  { id: "bytedance:seedream@4.5", label: "Seedream 4.5", maxImages: 2, supportsMoodboard: true },
];

export const MAX_IMAGES_TO_FETCH = 10;
