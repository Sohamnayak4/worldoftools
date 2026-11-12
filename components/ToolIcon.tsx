import {
  AppWindow,
  ArrowDownToLine,
  AudioLines,
  AudioWaveform,
  Binary,
  Braces,
  Camera,
  CaseSensitive,
  Clapperboard,
  Crop,
  FileCode,
  FileDown,
  FileImage,
  FileMusic,
  FileStack,
  FileText,
  FileVideoCamera,
  Film,
  FoldVertical,
  Hash,
  IdCard,
  Image,
  ImageDown,
  ImagePlus,
  Images,
  KeyRound,
  Mail,
  MapPinOff,
  MessageCircle,
  MessageSquare,
  Minimize2,
  Percent,
  QrCode,
  Scaling,
  Scissors,
  Send,
  Shrink,
  Signature,
  Smartphone,
  Split,
  TextCursorInput,
  Video,
  VolumeX,
  WholeWord,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import type { Category } from "@/lib/tools";

// One outline icon per tool and per category. Picked to show what the tool
// does. A tool without an entry falls back to its category icon.
const TOOL_ICONS: Record<string, LucideIcon> = {
  "compress-video-to-size": Minimize2,
  "trim-video": Scissors,
  "mov-to-mp4": FileVideoCamera,
  "webm-to-mp4": Video,
  "mute-video": VolumeX,
  "compress-video-for-discord": MessageCircle,
  "compress-video-for-whatsapp": MessageSquare,
  "compress-video-for-email": Mail,
  "compress-video-for-instagram": Camera,
  "compress-video-for-telegram": Send,
  "compress-video-for-slack": Hash,
  "mp4-to-mp3": FileMusic,
  "wav-to-mp3": AudioWaveform,
  "m4a-to-mp3": AudioLines,
  "compress-mp3": Shrink,
  "trim-audio": Scissors,
  "video-to-gif": Clapperboard,
  "compress-gif": FoldVertical,
  "gif-to-mp4": Film,
  "compress-image-to-20kb": ImageDown,
  "compress-image-to-50kb": ImageDown,
  "compress-image-to-100kb": ImageDown,
  "compress-image-to-200kb": ArrowDownToLine,
  "png-to-jpg": Image,
  "jpg-to-png": ImagePlus,
  "webp-to-jpg": Images,
  "image-to-webp": FileImage,
  "svg-to-png": FileCode,
  "resize-image": Scaling,
  "remove-exif": MapPinOff,
  "heic-to-jpg": Smartphone,
  "crop-image": Crop,
  "image-to-pdf": FileDown,
  "favicon-generator": AppWindow,
  "resize-photo-for-passport": IdCard,
  "resize-photo-and-signature": Signature,
  "merge-pdf": FileStack,
  "split-pdf": Split,
  "pdf-to-jpg": FileImage,
  "word-counter": WholeWord,
  "case-converter": CaseSensitive,
  "qr-code-generator": QrCode,
  "password-generator": KeyRound,
  "json-formatter": Braces,
  "base64-encode-decode": Binary,
  "percentage-calculator": Percent,
};

const CATEGORY_ICONS: Record<Category, LucideIcon> = {
  video: Video,
  audio: AudioLines,
  image: Image,
  pdf: FileText,
  text: TextCursorInput,
  utility: Wrench,
};

export function CategoryIcon({ id, size = 16 }: { id: Category; size?: number }) {
  const Icon = CATEGORY_ICONS[id];
  return <Icon size={size} strokeWidth={1.75} aria-hidden="true" />;
}

export function ToolIcon({
  slug,
  category,
  size = 16,
}: {
  slug: string;
  category?: Category;
  size?: number;
}) {
  const Icon = TOOL_ICONS[slug] ?? (category ? CATEGORY_ICONS[category] : Wrench);
  return <Icon size={size} strokeWidth={1.75} aria-hidden="true" />;
}
