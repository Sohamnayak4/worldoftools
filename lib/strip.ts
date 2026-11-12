import { formatBytes } from "./format";
import { limits } from "./limits";
import type { Tool } from "./tools";

// The three short tiles under each tool: privacy, the key number, and what
// comes out. Built from the registry so every page gets its own.
export type StripTile = { title: string; detail: string };

function sizeTile(tool: Tool): StripTile {
  const preset = tool.preset;
  if (preset.kind === "target-size") {
    const limit = preset.limitId ? limits[preset.limitId] : undefined;
    return {
      title: `${formatBytes(preset.targetBytes)} target`,
      detail: limit
        ? `From ${limit.platform}'s own help page`
        : "Type any size you need",
    };
  }
  if (tool.input) {
    return {
      title: `Up to ${formatBytes(tool.input.maxBytes)}`,
      detail: tool.input.multiple ? "Per file, on a computer" : "On a computer",
    };
  }
  return { title: "Works as you type", detail: "No file needed" };
}

function outputTile(tool: Tool): StripTile {
  const preset = tool.preset;
  switch (preset.kind) {
    case "target-size":
      return tool.engine === "image"
        ? { title: "JPG out", detail: "Checked under the target" }
        : { title: "MP4 out", detail: "H.264 video, AAC sound" };
    case "convert":
      return {
        title: `${preset.outputFormat.toUpperCase()} out`,
        detail: "Ready to download",
      };
    case "trim":
      return { title: "Same format out", detail: "Cut without re-encoding when it can" };
    case "mute":
      return { title: "MP4 out", detail: "Picture copied unchanged" };
    case "compress-gif":
      return { title: "GIF out", detail: "Same speed, smaller file" };
    case "resize":
    case "crop":
      return preset.kind === "crop" && preset.specs
        ? { title: "JPG out", detail: "At the exact size you chose" }
        : { title: "Same format out", detail: "JPG, PNG and WebP stay as they are" };
    case "pdf":
      return preset.operation === "merge"
        ? { title: "One PDF out", detail: "Pages copied as they are" }
        : preset.operation === "split"
          ? { title: "PDF or ZIP out", detail: "Pages copied as they are" }
          : preset.operation === "to-jpg"
            ? { title: "JPG or ZIP out", detail: "One picture per page" }
            : { title: "PDF out", detail: "One image per page" };
    case "strip-metadata":
      return { title: "Same file, cleaned", detail: "Picture left as it was" };
    case "favicon":
      return { title: "ZIP of icons", detail: "With the HTML tags" };
    case "utility":
      return { title: "Copy or download", detail: "Nothing is saved" };
  }
}

export function stripFor(tool: Tool): StripTile[] {
  return [
    {
      title: "Stays on your device",
      detail: tool.input ? "Your file is never uploaded" : "Nothing you type is sent",
    },
    sizeTile(tool),
    outputTile(tool),
  ];
}
