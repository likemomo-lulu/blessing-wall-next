import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'

// 点赞/取消点赞
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { messageId } = body
    
    // 从 cookie 获取 fingerprint
    const cookieStore = cookies()
    let fingerprint = cookieStore.get('bw_fp')?.value
    
    if (!fingerprint) {
      fingerprint = Math.random().toString(36).substring(2, 15)
      cookieStore.set('bw_fp', fingerprint, { maxAge: 60 * 60 * 24 * 365 })
    }

    // 检查是否已点赞
    const existingLike = await prisma.like.findUnique({
      where: {
        messageId_fingerprint: {
          messageId,
          fingerprint
        }
      }
    })

    if (existingLike) {
      // 取消点赞
      await prisma.like.delete({
        where: { id: existingLike.id }
      })
      
      // 递减留言点赞数
      const message = await prisma.message.update({
        where: { id: messageId },
        data: { likeCount: { decrement: 1 } }
      })

      return NextResponse.json({ liked: false, likeCount: message.likeCount })
    } else {
      // 添加点赞
      const message = await prisma.message.findUnique({
        where: { id: messageId }
      })
      
      if (!message) {
        return NextResponse.json({ error: '留言不存在' }, { status: 404 })
      }

      await prisma.like.create({
        data: {
          messageId,
          fingerprint
        }
      })

      // 递增留言点赞数
      const updated = await prisma.message.update({
        where: { id: messageId },
        data: { likeCount: { increment: 1 } }
      })

      // 递增墙点赞数
      await prisma.wall.update({
        where: { id: message.wallId },
        data: { likeCount: { increment: 1 } }
      })

      return NextResponse.json({ liked: true, likeCount: updated.likeCount })
    }
  } catch (_error) {
    return NextResponse.json({ error: '操作失败' }, { status: 500 })
  }
}
