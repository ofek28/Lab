import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(
  value: number | null | undefined,
  options?: { decimals?: number; compact?: boolean }
): string {
  if (value == null) return 'N/A'
  const { decimals = 2, compact = false } = options ?? {}

  if (compact) {
    const abs = Math.abs(value)
    if (abs >= 1e12) return `$${(value / 1e12).toFixed(2)}T`
    if (abs >= 1e9) return `$${(value / 1e9).toFixed(2)}B`
    if (abs >= 1e6) return `$${(value / 1e6).toFixed(2)}M`
    if (abs >= 1e3) return `$${(value / 1e3).toFixed(2)}K`
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value)
}

export function formatNumber(
  value: number | null | undefined,
  options?: { decimals?: number; compact?: boolean }
): string {
  if (value == null) return 'N/A'
  const { decimals = 2, compact = false } = options ?? {}

  if (compact) {
    const abs = Math.abs(value)
    if (abs >= 1e12) return `${(value / 1e12).toFixed(2)}T`
    if (abs >= 1e9) return `${(value / 1e9).toFixed(2)}B`
    if (abs >= 1e6) return `${(value / 1e6).toFixed(2)}M`
    if (abs >= 1e3) return `${(value / 1e3).toFixed(2)}K`
  }

  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value)
}

export function formatPercent(
  value: number | null | undefined,
  options?: { decimals?: number; multiply?: boolean }
): string {
  if (value == null) return 'N/A'
  const { decimals = 2, multiply = false } = options ?? {}
  const pct = multiply ? value * 100 : value
  return `${pct >= 0 ? '+' : ''}${pct.toFixed(decimals)}%`
}

export function formatMultiple(value: number | null | undefined, suffix = 'x'): string {
  if (value == null) return 'N/A'
  return `${value.toFixed(2)}${suffix}`
}

export function colorForChange(value: number | null | undefined): string {
  if (value == null) return 'text-slate-500'
  if (value > 0) return 'text-emerald-600'
  if (value < 0) return 'text-red-500'
  return 'text-slate-500'
}

export function colorForScore(score: number): string {
  if (score >= 7) return 'text-emerald-600'
  if (score >= 5) return 'text-yellow-600'
  return 'text-red-500'
}

export function bgForScore(score: number): string {
  if (score >= 7) return 'bg-emerald-50 border-emerald-200'
  if (score >= 5) return 'bg-yellow-50 border-yellow-200'
  return 'bg-red-50 border-red-200'
}
