import { NextResponse } from 'next/server'
import crypto from 'crypto'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { username, password } = body

    const adminUsername = process.env.ADMIN_USERNAME
    const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH

    if (!adminUsername || !adminPasswordHash) {
      console.error('[Admin Login] 管理员未配置')
      return NextResponse.json({ error: '管理员未配置' }, { status: 500 })
    }

    if (username !== adminUsername) {
      return NextResponse.json({ error: '用户名或密码错误' }, { status: 401 })
    }

    const inputHash = crypto.createHash('sha256').update(password).digest('hex')
    if (inputHash !== adminPasswordHash) {
      return NextResponse.json({ error: '用户名或密码错误' }, { status: 401 })
    }

    // 生成 token 并写入环境（运行时生效）
    const token = crypto.randomUUID()
    process.env.ADMIN_TOKEN = token

    return NextResponse.json({ success: true, token })
  } catch (error) {
    console.error('[Admin Login] 登录失败:', error)
    return NextResponse.json({ error: '登录失败' }, { status: 500 })
  }
}
