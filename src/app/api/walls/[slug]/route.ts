import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAdminToken } from '@/lib/auth'

export const dynamic = 'force-dynamic'

/** 获取单个墙（所有状态均可通过链接访问） */
export async function GET(
  _request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const wall = await prisma.wall.findUnique({
      where: { slug: params.slug },
    })

    if (!wall) {
      return NextResponse.json({ error: '墙不存在' }, { status: 404 })
    }

    return NextResponse.json(wall)
  } catch (error) {
    console.error('[GET /api/walls/slug] 获取失败:', error)
    return NextResponse.json({ error: '获取失败' }, { status: 500 })
  }
}

/** 删除墙下某条留言（需管理员鉴权） */
export async function DELETE(request: NextRequest) {
  try {
    if (!verifyAdminToken(request)) {
      return NextResponse.json({ error: '未授权' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const messageId = searchParams.get('messageId')
    if (!messageId) {
      return NextResponse.json({ error: '缺少留言ID' }, { status: 400 })
    }

    const message = await prisma.message.findUnique({
      where: { id: messageId },
      select: { wallId: true, likeCount: true },
    })

    if (!message) {
      return NextResponse.json({ error: '留言不存在' }, { status: 404 })
    }

    await prisma.message.delete({ where: { id: messageId } })

    // 递减墙留言数和点赞数
    await prisma.wall.update({
      where: { id: message.wallId },
      data: {
        messageCount: { decrement: 1 },
        likeCount: { decrement: message.likeCount },
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[DELETE /api/walls/slug] 删除留言失败:', error)
    return NextResponse.json({ error: '删除失败' }, { status: 500 })
  }
}
