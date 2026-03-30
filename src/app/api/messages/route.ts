import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { mockMessages, isMock } from '@/lib/mock'

export const dynamic = 'force-dynamic'

// 获取墙的留言
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const wallId = searchParams.get('wallId')
    
    if (!wallId) {
      return NextResponse.json({ error: '缺少墙ID' }, { status: 400 })
    }

    if (isMock()) {
      const messages = mockMessages.filter(m => m.wallId === wallId)
      return NextResponse.json(messages)
    }

    const messages = await prisma.message.findMany({
      where: { wallId },
      orderBy: { createdAt: 'desc' }
    })
    
    return NextResponse.json(messages)
  } catch (_error) {
    return NextResponse.json({ error: '获取失败' }, { status: 500 })
  }
}

// 发布留言
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { wallId, nickname, content } = body

    // 检查墙状态
    const wall = await prisma.wall.findUnique({
      where: { id: wallId }
    })
    
    if (!wall || wall.status !== 'open') {
      return NextResponse.json({ error: '该墙已关闭留言' }, { status: 403 })
    }

    // 校验内容
    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: '内容不能为空' }, { status: 400 })
    }
    if (content.length > 1000) {
      return NextResponse.json({ error: '内容不能超过1000字' }, { status: 400 })
    }

    // 创建留言
    const message = await prisma.message.create({
      data: {
        wallId,
        nickname: nickname || '匿名',
        content
      }
    })

    // 递增墙留言数
    await prisma.wall.update({
      where: { id: wallId },
      data: { messageCount: { increment: 1 } }
    })

    return NextResponse.json(message)
  } catch (_error) {
    return NextResponse.json({ error: '发布失败' }, { status: 500 })
  }
}
