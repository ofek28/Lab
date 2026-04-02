// ============================================================
// Investment Notebook Types
// ============================================================

export type Rating = 'strong_buy' | 'buy' | 'hold' | 'sell' | 'strong_sell'

export interface Note {
  id: string
  ticker: string
  company_name: string | null
  thesis: string | null
  risks: string | null
  target_price: number | null
  conviction: number | null  // 1–5
  rating: Rating | null
  created_at: string
  updated_at: string
}

export interface NoteVersion {
  id: string
  note_id: string
  ticker: string
  thesis: string | null
  risks: string | null
  target_price: number | null
  conviction: number | null
  rating: Rating | null
  created_at: string
}

export interface NoteWithHistory extends Note {
  note_versions: NoteVersion[]
}

export interface NoteFormData {
  ticker: string
  company_name?: string
  thesis?: string
  risks?: string
  target_price?: number | null
  conviction?: number | null
  rating?: Rating | null
}

export const RATING_LABELS: Record<Rating, string> = {
  strong_buy: 'Strong Buy',
  buy: 'Buy',
  hold: 'Hold',
  sell: 'Sell',
  strong_sell: 'Strong Sell',
}

export const RATING_COLORS: Record<Rating, string> = {
  strong_buy: 'bg-emerald-100 text-emerald-800',
  buy: 'bg-green-100 text-green-800',
  hold: 'bg-yellow-100 text-yellow-800',
  sell: 'bg-orange-100 text-orange-800',
  strong_sell: 'bg-red-100 text-red-800',
}
