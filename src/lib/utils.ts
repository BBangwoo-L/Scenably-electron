import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getRandomId(prefix: string = '') {
  return `${prefix}_${Math.random().toString(36).substr(2, 9)}_${Date.now()}`
}
