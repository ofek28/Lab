import { NextRequest, NextResponse } from 'next/server'
import { searchTickers } from '@/lib/finnhub/client'

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('q') ?? ''

  if (query.length < 1) {
    return NextResponse.json([])
  }

  try {
    const results = await searchTickers(query)
    return NextResponse.json(results)
  } catch (err) {
    console.error('[search]', err)
    return NextResponse.json([])
  }
}
