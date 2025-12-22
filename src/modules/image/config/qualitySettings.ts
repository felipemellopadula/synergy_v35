import type { QualitySetting } from "../types";

export const QUALITY_SETTINGS: QualitySetting[] = [
  { id: "standard", label: "Padrão (1024x1024)", width: 1024, height: 1024, steps: 15 },
  { id: "landscape", label: "Paisagem (1536x1024)", width: 1536, height: 1024, steps: 15 },
  { id: "portrait", label: "Retrato (1024x1536)", width: 1024, height: 1536, steps: 15 },
  { id: "fast", label: "Rápido (512x512)", width: 512, height: 512, steps: 10 },
];

export const KONTEXT_QUALITY_SETTINGS: QualitySetting[] = [
  { id: "1:1", label: "1:1 (Square)", width: 1024, height: 1024, steps: 15 },
  { id: "21:9", label: "21:9 (Ultra-Wide / Landscape)", width: 1568, height: 672, steps: 15 },
  { id: "16:9", label: "16:9 (Wide / Landscape)", width: 1392, height: 752, steps: 15 },
  { id: "4:3", label: "4:3 (Standard / Landscape)", width: 1184, height: 880, steps: 15 },
  { id: "3:2", label: "3:2 (Classic / Landscape)", width: 1248, height: 832, steps: 15 },
  { id: "2:3", label: "2:3 (Classic / Portrait)", width: 832, height: 1248, steps: 15 },
  { id: "3:4", label: "3:4 (Standard / Portrait)", width: 880, height: 1184, steps: 15 },
  { id: "9:16", label: "9:16 (Tall / Portrait)", width: 752, height: 1392, steps: 15 },
  { id: "9:21", label: "9:21 (Ultra-Tall / Portrait)", width: 672, height: 1568, steps: 15 },
];

export const SEEDREAM_QUALITY_SETTINGS: QualitySetting[] = [
  { id: "1:1-2k", label: "1:1 (2K / Square)", width: 2048, height: 2048, steps: 15 },
  { id: "1:1-4k", label: "1:1 (4K / Square)", width: 4096, height: 4096, steps: 15 },
  { id: "4:3-2k", label: "4:3 (2K / Landscape)", width: 2304, height: 1728, steps: 15 },
  { id: "4:3-4k", label: "4:3 (4K / Landscape)", width: 4096, height: 3072, steps: 15 },
  { id: "16:9-2k", label: "16:9 (2K / Landscape)", width: 2560, height: 1440, steps: 15 },
  { id: "16:9-4k", label: "16:9 (4K / Landscape)", width: 4096, height: 2304, steps: 15 },
  { id: "3:2-2k", label: "3:2 (2K / Landscape)", width: 2496, height: 1664, steps: 15 },
  { id: "3:2-4k", label: "3:2 (4K / Landscape)", width: 4096, height: 2730, steps: 15 },
  { id: "21:9-2k", label: "21:9 (2K / Landscape)", width: 3024, height: 1296, steps: 15 },
  { id: "21:9-4k", label: "21:9 (4K / Landscape)", width: 4096, height: 1755, steps: 15 },
  { id: "3:4-2k", label: "3:4 (2K / Portrait)", width: 1728, height: 2304, steps: 15 },
  { id: "3:4-4k", label: "3:4 (4K / Portrait)", width: 3072, height: 4096, steps: 15 },
  { id: "9:16-2k", label: "9:16 (2K / Portrait)", width: 1440, height: 2560, steps: 15 },
  { id: "9:16-4k", label: "9:16 (4K / Portrait)", width: 2304, height: 4096, steps: 15 },
  { id: "2:3-2k", label: "2:3 (2K / Portrait)", width: 1664, height: 2496, steps: 15 },
  { id: "2:3-4k", label: "2:3 (4K / Portrait)", width: 2730, height: 4096, steps: 15 },
];

export const IDEOGRAM_QUALITY_SETTINGS: QualitySetting[] = [
  { id: "1:1", label: "1:1 (Square)", width: 1024, height: 1024, steps: 15 },
  { id: "21:10", label: "21:10 (Ultra-Wide / Landscape)", width: 1600, height: 762, steps: 15 },
  { id: "16:13", label: "16:13 (Wide / Landscape)", width: 1024, height: 832, steps: 15 },
  { id: "4:3", label: "4:3 (Standard / Landscape)", width: 1024, height: 768, steps: 15 },
  { id: "3:2", label: "3:2 (Classic / Landscape)", width: 1536, height: 1024, steps: 15 },
  { id: "2:3", label: "2:3 (Classic / Portrait)", width: 1024, height: 1536, steps: 15 },
  { id: "3:4", label: "3:4 (Standard / Portrait)", width: 768, height: 1024, steps: 15 },
  { id: "13:16", label: "13:16 (Tall / Portrait)", width: 1040, height: 1280, steps: 15 },
  { id: "10:21", label: "10:21 (Ultra-Tall / Portrait)", width: 762, height: 1600, steps: 15 },
];

export const GEMINI_QUALITY_SETTINGS: QualitySetting[] = [
  { id: "auto", label: "Auto", width: 1024, height: 1024, steps: 15 },
  { id: "1:1", label: "1:1 (Square)", width: 1024, height: 1024, steps: 15 },
  { id: "3:2", label: "3:2 (Classic / Landscape)", width: 1536, height: 1024, steps: 15 },
  { id: "2:3", label: "2:3 (Classic / Portrait)", width: 1024, height: 1536, steps: 15 },
  { id: "4:3", label: "4:3 (Standard / Landscape)", width: 1365, height: 1024, steps: 15 },
  { id: "3:4", label: "3:4 (Standard / Portrait)", width: 1024, height: 1365, steps: 15 },
  { id: "4:5", label: "4:5 (Portrait)", width: 1024, height: 1280, steps: 15 },
  { id: "5:4", label: "5:4 (Landscape)", width: 1280, height: 1024, steps: 15 },
  { id: "9:16", label: "9:16 (Tall / Portrait)", width: 576, height: 1024, steps: 15 },
  { id: "16:9", label: "16:9 (Wide / Landscape)", width: 1820, height: 1024, steps: 15 },
  { id: "21:9", label: "21:9 (Ultra-Wide / Landscape)", width: 2389, height: 1024, steps: 15 },
];

export const NANO_BANANA_PRO_QUALITY_SETTINGS: QualitySetting[] = [
  { id: "1:1-1k", label: "1:1 (1K / Square)", width: 1024, height: 1024, steps: 15 },
  { id: "1:1-2k", label: "1:1 (2K / Square)", width: 2048, height: 2048, steps: 15 },
  { id: "1:1-4k", label: "1:1 (4K / Square)", width: 4096, height: 4096, steps: 15 },
  { id: "3:2-1k", label: "3:2 (1K / Landscape)", width: 1264, height: 848, steps: 15 },
  { id: "3:2-2k", label: "3:2 (2K / Landscape)", width: 2528, height: 1696, steps: 15 },
  { id: "3:2-4k", label: "3:2 (4K / Landscape)", width: 5056, height: 3392, steps: 15 },
  { id: "2:3-1k", label: "2:3 (1K / Portrait)", width: 848, height: 1264, steps: 15 },
  { id: "2:3-2k", label: "2:3 (2K / Portrait)", width: 1696, height: 2528, steps: 15 },
  { id: "2:3-4k", label: "2:3 (4K / Portrait)", width: 3392, height: 5056, steps: 15 },
  { id: "4:3-1k", label: "4:3 (1K / Landscape)", width: 1200, height: 896, steps: 15 },
  { id: "4:3-2k", label: "4:3 (2K / Landscape)", width: 2400, height: 1792, steps: 15 },
  { id: "4:3-4k", label: "4:3 (4K / Landscape)", width: 4800, height: 3584, steps: 15 },
  { id: "3:4-1k", label: "3:4 (1K / Portrait)", width: 896, height: 1200, steps: 15 },
  { id: "3:4-2k", label: "3:4 (2K / Portrait)", width: 1792, height: 2400, steps: 15 },
  { id: "3:4-4k", label: "3:4 (4K / Portrait)", width: 3584, height: 4800, steps: 15 },
  { id: "4:5-1k", label: "4:5 (1K / Portrait)", width: 928, height: 1152, steps: 15 },
  { id: "4:5-2k", label: "4:5 (2K / Portrait)", width: 1856, height: 2304, steps: 15 },
  { id: "4:5-4k", label: "4:5 (4K / Portrait)", width: 3712, height: 4608, steps: 15 },
  { id: "5:4-1k", label: "5:4 (1K / Landscape)", width: 1152, height: 928, steps: 15 },
  { id: "5:4-2k", label: "5:4 (2K / Landscape)", width: 2304, height: 1856, steps: 15 },
  { id: "5:4-4k", label: "5:4 (4K / Landscape)", width: 4608, height: 3712, steps: 15 },
  { id: "9:16-1k", label: "9:16 (1K / Portrait)", width: 768, height: 1376, steps: 15 },
  { id: "9:16-2k", label: "9:16 (2K / Portrait)", width: 1536, height: 2752, steps: 15 },
  { id: "9:16-4k", label: "9:16 (4K / Portrait)", width: 3072, height: 5504, steps: 15 },
  { id: "16:9-1k", label: "16:9 (1K / Landscape)", width: 1376, height: 768, steps: 15 },
  { id: "16:9-2k", label: "16:9 (2K / Landscape)", width: 2752, height: 1536, steps: 15 },
  { id: "16:9-4k", label: "16:9 (4K / Landscape)", width: 5504, height: 3072, steps: 15 },
  { id: "21:9-1k", label: "21:9 (1K / Landscape)", width: 1584, height: 672, steps: 15 },
  { id: "21:9-2k", label: "21:9 (2K / Landscape)", width: 3168, height: 1344, steps: 15 },
  { id: "21:9-4k", label: "21:9 (4K / Landscape)", width: 6336, height: 2688, steps: 15 },
];

export const QWEN_QUALITY_SETTINGS: QualitySetting[] = [
  { id: "1:1", label: "1:1 (Square)", width: 1024, height: 1024, steps: 15 },
  { id: "16:9", label: "16:9 (Landscape)", width: 1344, height: 768, steps: 15 },
  { id: "3:2", label: "3:2 (Photo)", width: 1024, height: 640, steps: 15 },
];

export const FLUX2_PRO_QUALITY_SETTINGS: QualitySetting[] = [
  { id: "1:1", label: "1:1 (Square)", width: 1024, height: 1024, steps: 15 },
  { id: "21:9", label: "21:9 (Ultra-Wide / Landscape)", width: 1568, height: 672, steps: 15 },
  { id: "16:9", label: "16:9 (Wide / Landscape)", width: 1392, height: 784, steps: 15 },
  { id: "4:3", label: "4:3 (Standard / Landscape)", width: 1184, height: 888, steps: 15 },
  { id: "3:2", label: "3:2 (Classic / Landscape)", width: 1248, height: 832, steps: 15 },
  { id: "2:3", label: "2:3 (Classic / Portrait)", width: 832, height: 1248, steps: 15 },
  { id: "3:4", label: "3:4 (Standard / Portrait)", width: 888, height: 1184, steps: 15 },
  { id: "9:16", label: "9:16 (Tall / Portrait)", width: 784, height: 1392, steps: 15 },
  { id: "9:21", label: "9:21 (Ultra-Tall / Portrait)", width: 672, height: 1568, steps: 15 },
];

export const GPT_IMAGE_15_QUALITY_SETTINGS: QualitySetting[] = [
  { id: "1:1", label: "1:1 (Square)", width: 1024, height: 1024, steps: 15 },
  { id: "3:2", label: "3:2 (Landscape)", width: 1536, height: 1024, steps: 15 },
  { id: "2:3", label: "2:3 (Portrait)", width: 1024, height: 1536, steps: 15 },
];

/**
 * Returns the appropriate quality settings array for a given model ID
 */
export function getQualitySettingsForModel(modelId: string): QualitySetting[] {
  switch (modelId) {
    case "bfl:3@1":
      return KONTEXT_QUALITY_SETTINGS;
    case "bfl:4@1":
      return FLUX2_PRO_QUALITY_SETTINGS;
    case "ideogram:4@1":
      return IDEOGRAM_QUALITY_SETTINGS;
    case "google:4@1":
      return GEMINI_QUALITY_SETTINGS;
    case "google:4@2":
      return NANO_BANANA_PRO_QUALITY_SETTINGS;
    case "bytedance:seedream@4.5":
      return SEEDREAM_QUALITY_SETTINGS;
    case "runware:108@1":
      return QWEN_QUALITY_SETTINGS;
    case "openai:4@1":
      return GPT_IMAGE_15_QUALITY_SETTINGS;
    default:
      return QUALITY_SETTINGS;
  }
}
