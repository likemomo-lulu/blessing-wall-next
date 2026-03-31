import { NextRequest } from 'next/server'
import crypto from 'crypto'

/**
 * 验证管理员 token
 * token 由密码哈希派生，相同密码始终生成相同 token，无需存储状态
 */
export function verifyAdminToken(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) return false

  const token = authHeader.slice(7)
  if (!process.env.ADMIN_PASSWORD_HASH) return false

  const expectedToken = crypto
    .createHash('sha256')
    .update(`${process.env.ADMIN_PASSWORD_HASH}:session`)
    .digest('hex')

  return token === expectedToken
}
