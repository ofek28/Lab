import type { Metadata } from 'next'
import './globals.css'
import { Sidebar } from '@/components/layout/Sidebar'

export const metadata: Metadata = {
  title: 'StockAnalyst — Professional Investment Research',
  description: 'AI-powered stock analysis platform for investment professionals',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="ml-64 flex-1 min-h-screen bg-slate-50">
            {children}
          </main>
        </div>
      </body>
    </html>
  )
}
