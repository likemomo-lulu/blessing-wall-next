import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/** 点赞/取消点赞 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { messageId } = body

    // 必须从 header 获取 fingerprint
    const fingerprint = request.headers.get('x-fingerprint')
    if (!fingerprint) {
      return NextResponse.json({ error: '缺少指纹标识' }, { status: 400 })
    }

    // 检查是否已点赞
    const existingLike = await prisma.like.findUnique({
      where: { messageId_fingerprint: { messageId, fingerprint } },
    })

    if (existingLike) {
      await prisma.like.delete({ where: { id: existingLike.id } })

      const message = await prisma.message.update({
        where: { id: messageId },
        data: { likeCount: { decrement: 1 } },
      })

      // 递减墙点赞数
      const msg = await prisma.message.findUnique({
        where: { id: messageId },
        select: { wallId: true },
      })
      if (msg) {
        await prisma.wall.update({
          where: { id: msg.wallId },
          data: { likeCount: { decrement: 1 } },
        })
      }

      return NextResponse.json({ liked: false, likeCount: message.likeCount })
    } else {
      const message = await prisma.message.findUnique({ where: { id: messageId } })
      if (!message) {
        return NextResponse.json({ error: '留言不存在' }, { status: 404 })
      }

      await prisma.like.create({ data: { messageId, fingerprint } })

      const updated = await prisma.message.update({
        where: { id: messageId },
        data: { likeCount: { increment: 1 } },
      })

      await prisma.wall.update({
        where: { id: message.wallId },
        data: { likeCount: { increment: 1 } },
      })

      return NextResponse.json({ liked: true, likeCount: updated.likeCount })
    }
  } catch (error) {
    console.error('[POST /api/likes] 点赞失败:', error)
    return NextResponse.json({ error: '操作失败' }, { status: 500 })
  }
}
