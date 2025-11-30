import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
  }).format(amount)
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat("es-CO", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(date))
}

export function formatDateTime(date: string | Date): string {
  return new Intl.DateTimeFormat("es-CO", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date))
}

export function formatHours(hours: number): string {
  const wholeHours = Math.floor(hours)
  const minutes = Math.round((hours - wholeHours) * 60)
  if (minutes === 0) {
    return `${wholeHours}h`
  }
  return `${wholeHours}h ${minutes}m`
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    UNASSIGNED: "bg-red-100 text-red-800",
    SCHEDULED: "bg-yellow-100 text-yellow-800",
    IN_PROGRESS: "bg-blue-100 text-blue-800",
    DONE: "bg-green-100 text-green-800",
    VERIFIED: "bg-emerald-100 text-emerald-800",
    INVOICED: "bg-gray-100 text-gray-800",
    ACTIVE: "bg-green-100 text-green-800",
    CLOSED: "bg-gray-100 text-gray-800",
    DRAFT: "bg-yellow-100 text-yellow-800",
    SENT: "bg-blue-100 text-blue-800",
    PAID: "bg-green-100 text-green-800",
  }
  return colors[status] || "bg-gray-100 text-gray-800"
}
