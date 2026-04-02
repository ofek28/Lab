'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Loader2 } from 'lucide-react'
import type { SearchResult } from '@/types/stock'
import { cn } from '@/lib/utils'

interface Props {
  placeholder?: string
  className?: string
}

export function TickerSearch({ placeholder = 'Search ticker or company name...', className }: Props) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const search = useCallback(async (q: string) => {
    if (q.length < 1) {
      setResults([])
      setOpen(false)
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`/api/stock/search?q=${encodeURIComponent(q)}`)
      const data = await res.json()
      setResults(data)
      setOpen(data.length > 0)
    } catch {
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => search(query), 300)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query, search])

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open || results.length === 0) {
      if (e.key === 'Enter' && query.trim()) {
        router.push(`/analyze/${query.trim().toUpperCase()}`)
        setOpen(false)
      }
      return
    }
    if (e.key === 'ArrowDown') {
      setSelected((s) => Math.min(s + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      setSelected((s) => Math.max(s - 1, -1))
    } else if (e.key === 'Enter') {
      if (selected >= 0) {
        navigate(results[selected])
      } else if (query.trim()) {
        router.push(`/analyze/${query.trim().toUpperCase()}`)
        setOpen(false)
      }
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  function navigate(result: SearchResult) {
    router.push(`/analyze/${result.ticker}`)
    setQuery('')
    setOpen(false)
    setResults([])
  }

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <div className="relative flex items-center">
        {loading ? (
          <Loader2 className="absolute left-3.5 h-4 w-4 animate-spin text-slate-400" />
        ) : (
          <Search className="absolute left-3.5 h-4 w-4 text-slate-400" />
        )}
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder={placeholder}
          className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm shadow-sm outline-none ring-0 transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          autoComplete="off"
        />
      </div>

      {/* Dropdown */}
      {open && results.length > 0 && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-72 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-xl">
          {results.map((result, i) => (
            <button
              key={result.ticker}
              onMouseDown={() => navigate(result)}
              onMouseEnter={() => setSelected(i)}
              className={cn(
                'flex w-full items-center gap-3 px-4 py-3 text-left transition',
                selected === i ? 'bg-blue-50' : 'hover:bg-slate-50'
              )}
            >
              <span className="w-16 shrink-0 font-mono text-sm font-semibold text-blue-600">
                {result.ticker}
              </span>
              <span className="truncate text-sm text-slate-700">{result.shortName}</span>
              <span className="ml-auto shrink-0 rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-500">
                {result.exchange}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
