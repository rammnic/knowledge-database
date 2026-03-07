import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function formatDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString("ru-RU", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function getMaturityEmoji(maturity: string): string {
  switch (maturity) {
    case "SEED":
      return "🌱";
    case "SAPLING":
      return "🌿";
    case "EVERGREEN":
      return "🌳";
    default:
      return "📝";
  }
}

export function getMaturityColor(maturity: string): string {
  switch (maturity) {
    case "SEED":
      return "text-green-400";
    case "SAPLING":
      return "text-lime-400";
    case "EVERGREEN":
      return "text-cyan-400";
    default:
      return "text-gray-400";
  }
}