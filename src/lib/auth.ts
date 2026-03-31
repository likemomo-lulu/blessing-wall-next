import { NextRequest } from 'next/server'

/**
 * 验证管理员 token
 * 前端登录后获得 token，后续管理请求需在 Authorization header 中携带
 */
export function verifyAdminToken(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) return false

  const token = authHeader.slice(7)
  // 简单实现：token 由登录 API 生成并存储在内存/环境变量中
  // 生产环境应使用 JWT 或数据库存储
  if (!process.env.ADMIN_TOKEN) return false
  return token === process.env.ADMIN_TOKEN
}
