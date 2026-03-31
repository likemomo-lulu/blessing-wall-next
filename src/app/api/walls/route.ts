import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAdminToken } from '@/lib/auth'

export const dynamic = 'force-dynamic'

/** 获取墙列表（默认过滤 hidden，admin=true 时返回全部） */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const isAdmin = searchParams.get('admin') === 'true'

    const walls = await prisma.wall.findMany({
      ...(isAdmin ? {} : { where: { status: { not: 'hidden' } } }),
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(walls)
  } catch (error) {
    console.error('[GET /api/walls] 获取失败:', error)
    return NextResponse.json({ error: '获取失败' }, { status: 500 })
  }
}

/** 创建墙（需管理员鉴权） */
export async function POST(request: NextRequest) {
  try {
    if (!verifyAdminToken(request)) {
      return NextResponse.json({ error: '未授权' }, { status: 401 })
    }

    const body = await request.json()
    const { title, description, protagonist, themeColor, slug, status } = body

    if (!title || !slug) {
      return NextResponse.json({ error: '标题和 slug 不能为空' }, { status: 400 })
    }

    const wall = await prisma.wall.create({
      data: {
        title,
        description: description || '',
        protagonist: protagonist || '',
        themeColor: themeColor || '#f49442',
        slug,
        status: status || 'open',
      },
    })

    return NextResponse.json(wall)
  } catch (error) {
    console.error('[POST /api/walls] 创建失败:', error)
    return NextResponse.json({ error: '创建失败' }, { status: 500 })
  }
}

/** 删除墙（需管理员鉴权） */
export async function DELETE(request: NextRequest) {
  try {
    if (!verifyAdminToken(request)) {
      return NextResponse.json({ error: '未授权' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) {
      return NextResponse.json({ error: '缺少墙ID' }, { status: 400 })
    }

    await prisma.wall.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[DELETE /api/walls] 删除失败:', error)
    return NextResponse.json({ error: '删除失败' }, { status: 500 })
  }
}

/** 切换墙状态（需管理员鉴权） */
export async function PATCH(request: NextRequest) {
  try {
    if (!verifyAdminToken(request)) {
      return NextResponse.json({ error: '未授权' }, { status: 401 })
    }

    const body = await request.json()
    const { id, status } = body
    if (!id || !status) {
      return NextResponse.json({ error: '缺少参数' }, { status: 400 })
    }
    if (!['open', 'closed', 'hidden'].includes(status)) {
      return NextResponse.json({ error: '无效状态' }, { status: 400 })
    }

    const wall = await prisma.wall.update({
      where: { id },
      data: { status },
    })

    return NextResponse.json(wall)
  } catch (error) {
    console.error('[PATCH /api/walls] 状态切换失败:', error)
    return NextResponse.json({ error: '操作失败' }, { status: 500 })
  }
}
