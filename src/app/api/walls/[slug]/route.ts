import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { mockWalls, isMock } from '@/lib/mock'

export const dynamic = 'force-dynamic'

// 获取单个墙
export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    if (isMock()) {
      const wall = mockWalls.find(w => w.slug === params.slug)
      if (!wall) {
        return NextResponse.json({ error: '墙不存在' }, { status: 404 })
      }
      return NextResponse.json(wall)
    }
    
    const wall = await prisma.wall.findUnique({
      where: { slug: params.slug }
    })
    
    if (!wall) {
      return NextResponse.json({ error: '墙不存在' }, { status: 404 })
    }
    
    return NextResponse.json(wall)
  } catch (_error) {
    return NextResponse.json({ error: '获取失败' }, { status: 500 })
  }
}
