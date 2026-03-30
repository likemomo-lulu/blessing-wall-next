import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// 获取公开墙列表
export async function GET() {
  try {
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
