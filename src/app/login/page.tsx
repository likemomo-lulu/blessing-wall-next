'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })

      if (res.ok) {
        const data = await res.json()
        localStorage.setItem('admin_token', data.token)
        router.push('/admin')
      } else {
        const data = await res.json()
        setError(data.error || '登录失败')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'linear-gradient(180deg, #fef7ee 0%, #fdf6f0 100%)' }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl text-white mx-auto mb-5" style={{ background: 'linear-gradient(135deg, #f49442, #e8725a)' }}>
            <i className="fa-solid fa-shield-halved" />
          </div>
          <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: '"Noto Serif SC", serif', color: '#3a2a1a' }}>管理员登录</h2>
          <p className="text-sm" style={{ color: '#9a8a7a' }}>登录后可创建和管理祝福墙</p>
        </div>
        <div className="rounded-2xl p-8 bg-white" style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.04)' }}>
          {error && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#6a5a4a' }}>用户名</label>
              <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} required className="w-full px-4 py-3 rounded-xl border border-black/[0.08] outline-none focus:border-orange-400 focus:shadow-[0_0_0_3px_rgba(241,122,26,0.1)]" style={{ fontSize: 15 }} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#6a5a4a' }}>密码</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full px-4 py-3 rounded-xl border border-black/[0.08] outline-none focus:border-orange-400 focus:shadow-[0_0_0_3px_rgba(241,122,26,0.1)]" style={{ fontSize: 15 }} />
            </div>
            <button type="submit" disabled={loading} className="w-full py-3 rounded-xl font-medium text-white border-none cursor-pointer transition-all" style={{ background: 'linear-gradient(135deg, #f49442, #f17a1a)' }}>
              {loading ? '登录中...' : '登录'}
            </button>
          </form>
        </div>
        <button onClick={() => router.push('/')} className="w-full mt-3 py-3 rounded-xl font-medium cursor-pointer border border-black/[0.12]" style={{ background: 'transparent', color: '#555' }}>返回首页</button>
      </div>
    </div>
  )
}
