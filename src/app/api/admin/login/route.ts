import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import crypto from 'crypto'

// 管理员登录
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { username, password } = body

    // 从环境变量验证
    const adminUsername = process.env.ADMIN_USERNAME
    const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH

    if (!adminUsername || !adminPasswordHash) {
      return NextResponse.json({ error: '管理员未配置' }, { status: 500 })
    }

    // 验证用户名
    if (username !== adminUsername) {
      return NextResponse.json({ error: '用户名或密码错误' }, { status: 401 })
    }

    // 验证密码（SHA256）
    const inputHash = crypto.createHash('sha256').update(password).digest('hex')
    if (inputHash !== adminPasswordHash) {
      return NextResponse.json({ error: '用户名或密码错误' }, { status: 401 })
    }

    // 设置登录 cookie
    const cookieStore = await cookies()
    cookieStore.set('admin_session', crypto.randomUUID(), {
      maxAge: 60 * 60 * 24, // 1天
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production'
    })

    return NextResponse.json({ success: true })
  } catch (_error) {
    return NextResponse.json({ error: '登录失败' }, { status: 500 })
  }
}
