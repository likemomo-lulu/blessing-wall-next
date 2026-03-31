'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'

interface Wall {
  id: string
  title: string
  description: string
  slug: string
  status: string
  themeColor: string
  protagonist?: string
  messageCount: number
  likeCount: number
  createdAt: string
}

interface Message {
  id: string
  nickname: string
  content: string
  likeCount: number
  createdAt: string
}

const COLORS = ['#f49442', '#e8456b', '#5b9bd5', '#6b9e7d', '#9b7ec8', '#5bc4a0', '#e8725a', '#f0a830']

const STATUS_LABELS: Record<string, { label: string; style: React.CSSProperties }> = {
  open: { label: '开放', style: { background: 'rgba(107,158,125,0.12)', color: '#4a8c60' } },
  closed: { label: '已关闭', style: { background: 'rgba(180,160,140,0.15)', color: '#8a7a6a' } },
  hidden: { label: '隐藏', style: { background: 'rgba(200,190,180,0.15)', color: '#9a8a7a' } },
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('zh-CN')
}

export default function AdminPage() {
  const [token, setToken] = useState('')
  const [walls, setWalls] = useState<Wall[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [showStatus, setShowStatus] = useState<string | null>(null)
  const [confirmAction, setConfirmAction] = useState<{ type: 'wall' | 'message'; id: string; desc: string } | null>(null)
  const [expandedWall, setExpandedWall] = useState<string | null>(null)
  const [wallMessages, setWallMessages] = useState<Message[]>([])

  // Create wall form
  const [form, setForm] = useState({ title: '', description: '', protagonist: '', themeColor: '#f49442', slug: '' })

  useEffect(() => {
    const t = sessionStorage.getItem('admin_token')
    if (t) {
      setToken(t)
      fetchWalls(t)
    } else {
      setLoading(false)
    }
  }, [])

  const fetchWalls = useCallback(async (t: string) => {
    const res = await fetch('/api/walls', {
      headers: t ? { Authorization: `Bearer ${t}` } : {},
    })
    if (res.status === 401) {
      sessionStorage.removeItem('admin_token')
      window.location.href = '/login'
      return
    }
    // Admin sees all walls including hidden
    if (res.ok) {
      const allRes = await fetch('/api/walls?admin=true')
      if (allRes.ok) setWalls(await allRes.json())
    }
    setLoading(false)
  }, [])

  async function authHeaders(): Promise<HeadersInit> {
    // Ensure we have the token
    if (!token) {
      const t = sessionStorage.getItem('admin_token')
      if (t) setToken(t)
      return t ? { Authorization: `Bearer ${t}` } : {}
    }
    return { Authorization: `Bearer ${token}` }
  }

  async function createWall() {
    if (!form.title.trim() || !form.slug.trim()) {
      alert('标题和 slug 不能为空')
      return
    }
    const headers = await authHeaders()
    const res = await fetch('/api/walls', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify(form),
    })
    if (res.ok) {
      setShowCreate(false)
      setForm({ title: '', description: '', protagonist: '', themeColor: '#f49442', slug: '' })
      fetchWalls(token)
    } else {
      const err = await res.json()
      alert(err.error || '创建失败')
    }
  }

  async function changeStatus(wallId: string, newStatus: string) {
    const headers = await authHeaders()
    const res = await fetch('/api/walls', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify({ id: wallId, status: newStatus }),
    })
    if (res.ok) {
      setShowStatus(null)
      fetchWalls(token)
    }
  }

  async function deleteWall(wallId: string) {
    const headers = await authHeaders()
    const res = await fetch(`/api/walls?id=${wallId}`, {
      method: 'DELETE',
      headers,
    })
    if (res.ok) {
      setConfirmAction(null)
      setExpandedWall(null)
      fetchWalls(token)
    }
  }

  async function deleteMessage(wallSlug: string, messageId: string) {
    const headers = await authHeaders()
    const res = await fetch(`/api/walls/${wallSlug}?messageId=${messageId}`, {
      method: 'DELETE',
      headers,
    })
    if (res.ok) {
      setConfirmAction(null)
      // Reload messages
      await loadMessages(wallSlug)
      fetchWalls(token)
    }
  }

  async function loadMessages(wallSlug: string) {
    // Find wall by slug to get its id
    const wall = walls.find(w => w.slug === wallSlug)
    if (!wall) return
    const res = await fetch(`/api/messages?wallId=${wall.id}`)
    if (res.ok) {
      setWallMessages(await res.json())
    }
  }

  function toggleExpand(wall: Wall) {
    if (expandedWall === wall.slug) {
      setExpandedWall(null)
    } else {
      setExpandedWall(wall.slug)
      loadMessages(wall.slug)
    }
  }

  if (!token && typeof window !== 'undefined' && !sessionStorage.getItem('admin_token')) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="mb-4" style={{ color: '#9a8a7a' }}>请先登录</p>
          <Link href="/login" className="px-4 py-2 rounded-xl text-white" style={{ background: 'linear-gradient(135deg, #f49442, #f17a1a)' }}>去登录</Link>
        </div>
      </div>
    )
  }

  if (loading) return <div className="p-8 text-center" style={{ color: '#9a8a7a' }}>加载中...</div>

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(180deg, #fef7ee 0%, #fdf6f0 100%)' }}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div>
            <h2 className="text-2xl font-bold" style={{ fontFamily: '"Noto Serif SC", serif', color: '#3a2a1a' }}>管理面板</h2>
            <p className="text-sm mt-1" style={{ color: '#9a8a7a' }}>管理你的所有祝福墙</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowCreate(true)}
              className="px-5 py-2.5 rounded-xl text-white font-medium border-none cursor-pointer"
              style={{ background: 'linear-gradient(135deg, #f49442, #f17a1a)' }}
            >
              <i className="fa-solid fa-plus mr-2" />创建新墙
            </button>
            <button
              onClick={() => { sessionStorage.removeItem('admin_token'); window.location.href = '/login' }}
              className="px-4 py-2.5 rounded-xl border border-black/[0.12] text-stone-600 cursor-pointer"
              style={{ background: 'transparent' }}
            >
              <i className="fa-solid fa-right-from-bracket mr-1.5" />退出
            </button>
          </div>
        </div>

        {/* Walls Table */}
        <div className="rounded-2xl overflow-hidden bg-white" style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.04)' }}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ background: 'rgba(249,180,119,0.08)' }}>
                  <th className="text-left px-6 py-4 font-semibold text-xs uppercase tracking-wide" style={{ color: '#8a7a6a' }}>墙名称</th>
                  <th className="text-left px-6 py-4 font-semibold text-xs uppercase tracking-wide" style={{ color: '#8a7a6a' }}>状态</th>
                  <th className="text-left px-6 py-4 font-semibold text-xs uppercase tracking-wide" style={{ color: '#8a7a6a' }}>留言数</th>
                  <th className="text-left px-6 py-4 font-semibold text-xs uppercase tracking-wide" style={{ color: '#8a7a6a' }}>创建时间</th>
                  <th className="text-right px-6 py-4 font-semibold text-xs uppercase tracking-wide" style={{ color: '#8a7a6a' }}>操作</th>
                </tr>
              </thead>
              <tbody>
                {walls.map((wall) => (
                  <>
                    <tr key={wall.id} className="hover:bg-orange-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: wall.themeColor }} />
                          <div>
                            <div className="text-sm font-medium" style={{ color: '#3a2a1a' }}>{wall.title}</div>
                            <div className="text-xs mt-0.5" style={{ color: '#bba' }}>{wall.description.slice(0, 30)}{wall.description.length > 30 ? '...' : ''}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium" style={STATUS_LABELS[wall.status]?.style}>
                          {STATUS_LABELS[wall.status]?.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm" style={{ color: '#6a5a4a' }}>{wall.messageCount}</td>
                      <td className="px-6 py-4 text-sm" style={{ color: '#9a8a7a' }}>{formatTime(wall.createdAt)}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => toggleExpand(wall)} className="text-xs px-3 py-1.5 rounded-lg cursor-pointer border border-black/[0.08] transition-all hover:bg-gray-50" style={{ background: 'transparent', color: '#6a5a4a' }}>
                            <i className="fa-solid fa-message mr-1" />留言
                          </button>
                          <button onClick={() => setShowStatus(wall.id)} className="text-xs px-3 py-1.5 rounded-lg cursor-pointer border border-black/[0.08] transition-all hover:bg-gray-50" style={{ background: 'transparent', color: '#6a5a4a' }}>
                            <i className="fa-solid fa-pen-to-square mr-1" />状态
                          </button>
                          <button onClick={() => setConfirmAction({ type: 'wall', id: wall.id, desc: `确定删除墙「${wall.title}」？此操作不可撤销，墙上的所有留言也将被删除。` })} className="text-xs px-3 py-1.5 rounded-lg cursor-pointer transition-all hover:bg-red-50" style={{ background: 'transparent', border: '1px solid rgba(232,69,107,0.2)', color: '#e8456b' }}>
                            <i className="fa-solid fa-trash-can mr-1" />删除
                          </button>
                        </div>
                      </td>
                    </tr>
                    {/* Expanded messages */}
                    {expandedWall === wall.slug && (
                      <tr key={wall.id + '-msg'}>
                        <td colSpan={5} className="px-6 py-4" style={{ background: '#fdfaf5' }}>
                          <div className="space-y-3 max-h-80 overflow-y-auto">
                            {wallMessages.length === 0 ? (
                              <p className="text-sm text-center py-4" style={{ color: '#bba' }}>暂无留言</p>
                            ) : (
                              wallMessages.map((msg) => (
                                <div key={msg.id} className="flex items-start gap-3 p-3 bg-white rounded-xl" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.03)' }}>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <span className="text-sm font-medium" style={{ color: '#4a3a2a' }}>{msg.nickname}</span>
                                      <span className="text-xs" style={{ color: '#bba' }}>{formatTime(msg.createdAt)}</span>
                                    </div>
                                    <p className="text-sm mt-1 line-clamp-2" style={{ color: '#5a4a3a' }}>{msg.content}</p>
                                  </div>
                                  <button
                                    onClick={() => setConfirmAction({ type: 'message', id: msg.id, desc: `确定删除这条留言？` })}
                                    className="text-xs px-2 py-1 rounded cursor-pointer flex-shrink-0"
                                    style={{ background: 'transparent', border: '1px solid rgba(232,69,107,0.2)', color: '#e8456b' }}
                                  >
                                    <i className="fa-solid fa-trash-can" />
                                  </button>
                                </div>
                              ))
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Create Wall Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(30,20,10,0.4)', backdropFilter: 'blur(8px)' }} onClick={() => setShowCreate(false)}>
          <div className="rounded-2xl p-6 sm:p-8 w-full max-w-md bg-white" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold" style={{ fontFamily: '"Noto Serif SC", serif', color: '#3a2a1a' }}>创建祝福墙 🌈</h3>
              <button onClick={() => setShowCreate(false)} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.04)', border: 'none', color: '#9a8a7a', cursor: 'pointer' }}>✕</button>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2" style={{ color: '#6a5a4a' }}>主角 <span style={{ color: '#bba', fontWeight: 400 }}>(祝福送给谁)</span></label>
              <input type="text" value={form.protagonist} onChange={(e) => setForm(f => ({ ...f, protagonist: e.target.value }))} placeholder="例如：张小明" className="w-full px-4 py-3 rounded-xl border border-black/[0.08] outline-none focus:border-orange-400 focus:shadow-[0_0_0_3px_rgba(241,122,26,0.1)]" style={{ fontSize: 15 }} />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2" style={{ color: '#6a5a4a' }}>墙标题</label>
              <input type="text" value={form.title} onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))} placeholder="例如：2026 毕业季祝福墙" className="w-full px-4 py-3 rounded-xl border border-black/[0.08] outline-none focus:border-orange-400 focus:shadow-[0_0_0_3px_rgba(241,122,26,0.1)]" style={{ fontSize: 15 }} />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2" style={{ color: '#6a5a4a' }}>墙描述</label>
              <textarea value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} rows={2} placeholder="简单描述一下这面墙的用途..." className="w-full px-4 py-3 rounded-xl border border-black/[0.08] outline-none focus:border-orange-400 focus:shadow-[0_0_0_3px_rgba(241,122,26,0.1)]" style={{ fontSize: 15, resize: 'vertical' }} />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2" style={{ color: '#6a5a4a' }}>URL 标识 (slug)</label>
              <input type="text" value={form.slug} onChange={(e) => setForm(f => ({ ...f, slug: e.target.value }))} placeholder="例如：graduation-2026" className="w-full px-4 py-3 rounded-xl border border-black/[0.08] outline-none focus:border-orange-400 focus:shadow-[0_0_0_3px_rgba(241,122,26,0.1)]" style={{ fontSize: 15 }} />
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium mb-3" style={{ color: '#6a5a4a' }}>主题色</label>
              <div className="flex gap-3 flex-wrap">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setForm(f => ({ ...f, themeColor: c }))}
                    className="w-9 h-9 rounded-full cursor-pointer transition-all hover:scale-110"
                    style={{ background: c, border: form.themeColor === c ? '3px solid #333' : '3px solid transparent' }}
                  />
                ))}
                <label className="w-9 h-9 rounded-full cursor-pointer relative" style={{ background: 'conic-gradient(red,yellow,lime,aqua,blue,magenta,red)' }}>
                  <input type="color" value={form.themeColor} onChange={(e) => setForm(f => ({ ...f, themeColor: e.target.value }))} className="opacity-0 absolute inset-0 w-0 h-0" />
                </label>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={createWall} className="flex-1 py-3 rounded-xl font-medium text-white cursor-pointer border-none" style={{ background: 'linear-gradient(135deg, #f49442, #f17a1a)' }}>创建</button>
              <button onClick={() => setShowCreate(false)} className="flex-1 py-3 rounded-xl font-medium cursor-pointer border border-black/[0.12]" style={{ background: 'transparent', color: '#555' }}>取消</button>
            </div>
          </div>
        </div>
      )}

      {/* Status Modal */}
      {showStatus && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(30,20,10,0.4)', backdropFilter: 'blur(8px)' }} onClick={() => setShowStatus(null)}>
          <div className="rounded-2xl p-6 sm:p-8 w-full max-w-sm bg-white" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-4" style={{ fontFamily: '"Noto Serif SC", serif', color: '#3a2a1a' }}>修改状态</h3>
            <div className="flex flex-col gap-3">
              {(['open', 'closed', 'hidden'] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => changeStatus(showStatus, status)}
                  className="flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all hover:bg-gray-50"
                  style={{ border: '1.5px solid rgba(0,0,0,0.06)', background: 'none', fontSize: 14, textAlign: 'left' }}
                >
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium" style={STATUS_LABELS[status]?.style}>
                    {status === 'open' && <i className="fa-solid fa-lock-open text-xs" />}
                    {status === 'closed' && <i className="fa-solid fa-lock text-xs" />}
                    {status === 'hidden' && <i className="fa-solid fa-eye-slash text-xs" />}
                    {STATUS_LABELS[status]?.label}
                  </span>
                  <span style={{ color: '#9a8a7a' }}>
                    {status === 'open' && '允许所有人发布留言'}
                    {status === 'closed' && '可浏览，不可发布'}
                    {status === 'hidden' && '不在首页展示'}
                  </span>
                </button>
              ))}
            </div>
            <button onClick={() => setShowStatus(null)} className="w-full py-3 mt-5 rounded-xl font-medium cursor-pointer border border-black/[0.12]" style={{ background: 'transparent', color: '#555' }}>取消</button>
          </div>
        </div>
      )}

      {/* Confirm Modal */}
      {confirmAction && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" style={{ background: 'rgba(30,20,10,0.4)', backdropFilter: 'blur(8px)' }} onClick={() => setConfirmAction(null)}>
          <div className="rounded-2xl p-6 sm:p-8 w-full max-w-sm text-center bg-white" onClick={(e) => e.stopPropagation()}>
            <div className="text-4xl mb-4">⚠️</div>
            <h3 className="text-lg font-bold mb-2" style={{ fontFamily: '"Noto Serif SC", serif', color: '#3a2a1a' }}>确认删除?</h3>
            <p className="text-sm mb-6" style={{ color: '#9a8a7a' }}>{confirmAction.desc}</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmAction(null)} className="flex-1 py-3 rounded-xl font-medium cursor-pointer border border-black/[0.12]" style={{ background: 'transparent', color: '#555' }}>取消</button>
              <button
                onClick={() => {
                  if (confirmAction.type === 'wall') {
                    deleteWall(confirmAction.id)
                  } else {
                    deleteMessage(expandedWall!, confirmAction.id)
                  }
                }}
                className="flex-1 py-3 rounded-xl font-medium cursor-pointer text-white border-none"
                style={{ background: '#e8456b' }}
              >
                确认删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
