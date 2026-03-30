import { NextResponse } from 'next/server'
import { mockWalls, isMock } from '@/lib/mock'

export const dynamic = 'force-dynamic'

// 获取公开墙列表
export async function GET() {
  try {
    if (isMock()) {
      return NextResponse.json(mockWalls)
    }
    
    // 非 mock 模式才加载 Prisma
    const { prisma } = await import('@/lib/prisma')
    const walls = await prisma.wall.findMany({
      where: {
        status: {
          not: 'hidden'
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
    return NextResponse.json(walls)
  } catch (_error) {
    return NextResponse.json({ error: '获取失败' }, { status: 500 })
  }
}

// 创建墙（管理员）
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { title, description, protagonist, themeColor, slug, status } = body

    if (isMock()) {
      const newWall = {
        id: Math.random().toString(36).substring(2),
        title,
        description,
        protagonist,
        themeColor,
        slug,
        status: status || 'open',
        messageCount: 0,
        likeCount: 0,
        createdAt: new Date().toISOString()
      }
      mockWalls.push(newWall)
      return NextResponse.json(newWall)
    }

    const { prisma } = await import('@/lib/prisma')
    const wall = await prisma.wall.create({
      data: {
        title,
        description,
        protagonist,
        themeColor,
        slug,
        status: status || 'open'
      }
    })

    return NextResponse.json(wall)
  } catch (_error) {
    return NextResponse.json({ error: '创建失败' }, { status: 500 })
  }
}
