import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const truncateText = (text: string, maxLength: number = 10) => {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}...`;
};
