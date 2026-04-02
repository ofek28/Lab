'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BarChart2, BookOpen, Search, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/analyze', label: 'Analyze', icon: Search },
  { href: '/notebook', label: 'Notebook', icon: BookOpen },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-slate-900 text-white">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-slate-700 px-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500">
          <TrendingUp className="h-5 w-5 text-white" />
        </div>
        <div>
          <div className="text-sm font-bold tracking-tight">StockAnalyst</div>
          <div className="text-xs text-slate-400">Investment Research</div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                active
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-slate-700 px-4 py-3">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <BarChart2 className="h-3 w-3" />
          <span>Data: Yahoo Finance (free)</span>
        </div>
        <div className="mt-1 text-xs text-slate-500">AI: Claude claude-sonnet-4-6</div>
      </div>
    </aside>
  )
}
