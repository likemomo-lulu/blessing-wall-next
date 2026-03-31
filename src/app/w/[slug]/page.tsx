'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

interface Wall {
  id: string
  title: string
  description: string
  themeColor: string
  status: string
  protagonist?: string
  messageCount: number
  likeCount: number
}

interface Message {
  id: string
  nickname: string
  content: string
  likeCount: number
  createdAt: string
  liked?: boolean
}

/** 获取浏览器指纹 */
async function getFingerprint(): Promise<string> {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (ctx) {
    ctx.textBaseline = 'top'
    ctx.font = '14px Arial'
    ctx.fillText('fingerprint', 2, 2)
  }
  const data = canvas.toDataURL()
  const nav = navigator.userAgent + navigator.language + screen.width + screen.height
  const raw = data + nav
  let hash = 0
  for (let i = 0; i < raw.length; i++) {
    const char = raw.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash |= 0
  }
  return Math.abs(hash).toString(36)
}

const EMOJIS = ['🎂', '🎉', '❤️', '🌟', '💪', '🤗', '🎈', '🧡', '🌻']

/** 格式化时间 */
function formatTime(dateStr: string): string {
  const d = new Date(dateStr)
  const now = new Date()
  const isSameYear = d.getFullYear() === now.getFullYear()
  const month = d.getMonth() + 1
  const day = d.getDate()
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  if (isSameYear) return `${month}月${day}日 ${hours}:${minutes}`
  return `${d.getFullYear()}年${month}月${day}日`
}

export default function WallPage() {
  const params = useParams()
  const slug = params.slug as string

  const [wall, setWall] = useState<Wall | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [showPublish, setShowPublish] = useState(false)
  const [nickname, setNickname] = useState('')
  const [content, setContent] = useState('')
  const [publishing, setPublishing] = useState(false)
  const [downloading, setDownloading] = useState<{ message: Message; templateIdx: number } | null>(null)
  const fingerprintRef = useRef<string>('')
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    getFingerprint().then(f => { fingerprintRef.current = f })
  }, [])

  const fetchMessages = useCallback(async (wallId: string) => {
    const res = await fetch(`/api/messages?wallId=${wallId}`)
    if (res.ok) {
      const data = await res.json()
      setMessages(data)
    }
  }, [])

  useEffect(() => {
    async function init() {
      const res = await fetch(`/api/walls/${slug}`)
      if (res.ok) {
        const data = await res.json()
        setWall(data)
        await fetchMessages(data.id)
      }
      setLoading(false)
    }
    init()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, fetchMessages])

  async function handlePublish() {
    if (!content.trim() || !wall?.id) return
    setPublishing(true)
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallId: wall.id, nickname, content })
      })
      if (res.ok) {
        setShowPublish(false)
        setNickname('')
        setContent('')
        await fetchMessages(wall.id)
      } else {
        const err = await res.json()
        alert(err.error || '发布失败')
      }
    } finally {
      setPublishing(false)
    }
  }

  async function handleLike(messageId: string) {
    const res = await fetch('/api/likes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-fingerprint': fingerprintRef.current,
      },
      body: JSON.stringify({ messageId })
    })
    if (res.ok && wall) {
      await fetchMessages(wall.id)
    }
  }

  function insertEmoji(emoji: string) {
    setContent(prev => prev + emoji)
  }

  if (loading) return <div className="p-8 text-center" style={{ color: '#9a8a7a' }}>加载中...</div>
  if (!wall) return <div className="p-8 text-center" style={{ color: '#9a8a7a' }}>墙不存在</div>

  const isClosed = wall.status === 'closed'

  return (
    <div className="min-h-screen" style={{ background: wall.themeColor + '10' }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Back */}
        <Link href="/" className="flex items-center gap-2 text-sm mb-6 inline-block" style={{ color: '#e26010' }}>
          <i className="fa-solid fa-arrow-left" /> 返回所有墙
        </Link>

        {/* Wall Header */}
        <div className="rounded-2xl p-6 sm:p-8 mb-8 bg-white relative overflow-hidden" style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.04)' }}>
          {isClosed && (
            <div className="px-4 py-3 rounded-lg mb-5" style={{ background: 'linear-gradient(135deg, #f5efe8, #ede4d8)', border: '1px solid rgba(180,160,140,0.3)' }}>
              <div className="flex items-center gap-2">
                <i className="fa-solid fa-lock" style={{ color: '#8a7a6a' }} />
                <span className="text-sm" style={{ color: '#6a5a4a' }}>此墙已关闭，无法发布新留言</span>
              </div>
            </div>
          )}
          <div className="flex items-start gap-4">
            <div className="w-2 h-16 rounded-full flex-shrink-0" style={{ background: wall.themeColor }} />
            <div className="flex-1">
              <h2 className="text-2xl sm:text-3xl font-bold mb-2" style={{ fontFamily: '"Noto Serif SC", serif', color: '#3a2a1a' }}>
                {wall.title}
              </h2>
              <p className="mb-4" style={{ color: '#8a7a6a' }}>{wall.description}</p>
              <div className="flex items-center gap-6 text-sm" style={{ color: '#9a8a7a' }}>
                <span><i className="fa-solid fa-message mr-1.5" style={{ color: wall.themeColor }} />{wall.messageCount} 条留言</span>
                <span><i className="fa-solid fa-heart mr-1.5" style={{ color: '#e8456b' }} />{wall.likeCount} 次点赞</span>
              </div>
            </div>
          </div>
        </div>

        {/* Blessing Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {messages.length === 0 ? (
            <div className="col-span-full text-center py-16">
              <div className="text-5xl mb-4">📝</div>
              <p style={{ color: '#9a8a7a' }}>还没有留言，来写第一条吧</p>
            </div>
          ) : (
            messages.map((msg) => (
              <div key={msg.id} className="p-5 bg-white rounded-2xl relative transition-all hover:-translate-y-0.5 hover:shadow-[0_12px_32px_rgba(0,0,0,0.06)]" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
                {/* Avatar + name + time */}
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs text-white font-bold" style={{ background: wall.themeColor }}>
                    {msg.nickname === '匿名' ? '匿' : msg.nickname[0]}
                  </div>
                  <div>
                    <span className="text-sm font-medium" style={{ color: '#4a3a2a' }}>{msg.nickname}</span>
                    <span className="text-xs ml-2" style={{ color: '#bba' }}>{formatTime(msg.createdAt)}</span>
                  </div>
                </div>

                {/* Content */}
                <p className="text-sm leading-relaxed mb-4" style={{ color: '#5a4a3a' }}>{msg.content}</p>

                {/* Actions */}
                <div className="flex items-center justify-between pt-3" style={{ borderTop: '1px solid rgba(0,0,0,0.04)' }}>
                  <button
                    onClick={() => handleLike(msg.id)}
                    className="flex items-center gap-1.5 text-xs transition-transform active:scale-125"
                    style={{ background: 'none', border: 'none', color: '#bba', cursor: 'pointer' }}
                  >
                    <i className="fa-regular fa-heart" />
                    <span>{msg.likeCount}</span>
                  </button>
                  <button
                    onClick={() => setDownloading({ message: msg, templateIdx: 0 })}
                    className="flex items-center gap-1 text-xs"
                    style={{ background: 'none', border: 'none', color: '#bba', cursor: 'pointer' }}
                  >
                    <i className="fa-solid fa-download" /> 下载
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* FAB - 发布祝福 */}
        {!isClosed && (
          <button
            onClick={() => setShowPublish(true)}
            className="fixed bottom-8 right-8 w-15 h-15 rounded-full flex items-center justify-center text-white text-2xl z-50 border-none cursor-pointer transition-all hover:scale-110 hover:rotate-90"
            style={{
              width: 60, height: 60,
              background: 'linear-gradient(135deg, #f17a1a, #e8725a)',
              boxShadow: '0 8px 24px rgba(241,122,26,0.35)',
            }}
            title="发布祝福"
          >
            <i className="fa-solid fa-plus" />
          </button>
        )}
      </div>

      {/* Publish Modal */}
      {showPublish && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(30,20,10,0.4)', backdropFilter: 'blur(8px)' }} onClick={() => setShowPublish(false)}>
          <div className="rounded-2xl p-6 sm:p-8 w-full max-w-md bg-white" onClick={(e) => e.stopPropagation()} style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.04)' }}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold" style={{ fontFamily: '"Noto Serif SC", serif', color: '#3a2a1a' }}>发布祝福 ✍️</h3>
              <button onClick={() => setShowPublish(false)} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.04)', border: 'none', color: '#9a8a7a', cursor: 'pointer', fontSize: 16 }}>
                <i className="fa-solid fa-xmark" />
              </button>
            </div>
            <div className="mb-5">
              <label className="block text-sm font-medium mb-2" style={{ color: '#6a5a4a' }}>你的名字</label>
              <input type="text" value={nickname} onChange={(e) => setNickname(e.target.value)} placeholder="留空将以「匿名」发布"
                className="w-full px-4 py-3 rounded-xl border border-black/[0.08] outline-none transition-all focus:border-orange-400 focus:shadow-[0_0_0_3px_rgba(241,122,26,0.1)]" style={{ fontSize: 15 }} />
            </div>
            <div className="mb-5">
              <label className="block text-sm font-medium mb-2" style={{ color: '#6a5a4a' }}>祝福内容</label>
              <textarea value={content} onChange={(e) => setContent(e.target.value)} rows={4} placeholder="写下你的祝福吧... 💕"
                className="w-full px-4 py-3 rounded-xl border border-black/[0.08] outline-none transition-all focus:border-orange-400 focus:shadow-[0_0_0_3px_rgba(241,122,26,0.1)]" style={{ fontSize: 15, resize: 'vertical', minHeight: 100 }} />
              <div className="flex gap-2 mt-2 flex-wrap">
                {EMOJIS.map((emoji) => (
                  <button key={emoji} onClick={() => insertEmoji(emoji)} className="text-xl cursor-pointer hover:scale-125 transition-transform" style={{ background: 'none', border: 'none' }}>
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={handlePublish} disabled={publishing} className="flex-1 py-3 rounded-xl font-medium text-white border-none cursor-pointer transition-all" style={{ background: 'linear-gradient(135deg, #f49442, #f17a1a)' }}>
                {publishing ? '发布中...' : '发布祝福'}
              </button>
              <button onClick={() => setShowPublish(false)} className="flex-1 py-3 rounded-xl font-medium cursor-pointer border border-black/[0.12] transition-all hover:border-orange-400" style={{ background: 'transparent', color: '#555' }}>
                取消
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Download Template Modal */}
      {downloading && <DownloadModal message={downloading.message} initialIdx={downloading.templateIdx} wall={wall} onClose={() => setDownloading(null)} />}
    </div>
  )
}

/** 下载模板弹窗 */
const TEMPLATES = [
  { name: '星空许愿', desc: '深蓝星空 · 浪漫', bg: '#0f0c29', emoji: '🌙' },
  { name: '月夜情书', desc: '米色纸张 · 手绘', bg: '#f5f0e6', emoji: '🌙✨' },
  { name: '温馨信纸', desc: '横线信纸 · 温暖', bg: '#fffef8', emoji: '💌' },
  { name: '生日派对', desc: '彩色缤纷 · 欢乐', bg: '#fff0f5', emoji: '🎂' },
  { name: '极简文艺', desc: '简约黑白 · 高级', bg: '#f8f8f8', emoji: '🌿' },
  { name: '丝带信笺', desc: '蕾丝缎带 · 优雅', bg: '#fef6f0', emoji: '🎀' },
  { name: '童趣可爱', desc: '手绘涂鸦 · 可爱', bg: '#f0f8ff', emoji: '🌈' },
  { name: '复古生日', desc: '复古色调 · 怀旧', bg: '#f5efe8', emoji: '🎈' },
]

function DownloadModal({ message, initialIdx, wall, onClose }: {
  message: Message
  initialIdx: number
  wall: Wall
  onClose: () => void
}) {
  const [templateIdx, setTemplateIdx] = useState(initialIdx)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const recipient = wall.protagonist || wall.title

  useEffect(() => {
    renderPreview()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [templateIdx])

  function renderPreview() {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const W = 800, H = 1000
    canvas.width = W * 2
    canvas.height = H * 2
    canvas.style.width = '100%'
    canvas.style.height = 'auto'
    canvas.style.maxHeight = '400px'
    canvas.style.display = 'block'
    ctx.scale(2, 2)

    const content = message.content
    const sender = message.nickname
    const time = formatTime(message.createdAt)
    const color = wall.themeColor

    // Auto-size font
    const contentFont = content.length <= 30 ? 36 : content.length <= 60 ? 30 : content.length <= 120 ? 27 : 24
    const contentLineHeight = contentFont + 18

    // Helper: wrap text
    const wrapText = (text: string, x: number, y: number, maxWidth: number, lh: number, font: string) => {
      ctx.font = font
      let line = ''
      let cy = y
      for (let i = 0; i < text.length; i++) {
        const test = line + text[i]
        if (ctx.measureText(test).width > maxWidth && line) {
          ctx.fillText(line, x, cy)
          line = text[i]
          cy += lh
        } else {
          line = test
        }
      }
      ctx.fillText(line, x, cy)
    }

    if (templateIdx === 0) {
      // 星空许愿
      const grad = ctx.createLinearGradient(0, 0, W * 0.3, H)
      grad.addColorStop(0, '#0f0c29')
      grad.addColorStop(0.5, '#1a1a4e')
      grad.addColorStop(1, '#24243e')
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, W, H)

      // Stars
      const rng = (seed: number) => { let s = seed; return () => { s = (s * 9301 + 49297) % 233280; return s / 233280 } }
      const rand = rng(42)
      for (let i = 0; i < 80; i++) {
        ctx.fillStyle = `rgba(255,255,255,${rand() * 0.6 + 0.2})`
        ctx.beginPath()
        ctx.arc(rand() * W, rand() * H, rand() * 2.5 + 0.3, 0, Math.PI * 2)
        ctx.fill()
      }

      const glow = ctx.createRadialGradient(W / 2, 200, 0, W / 2, 200, 300)
      glow.addColorStop(0, color + '30')
      glow.addColorStop(1, 'transparent')
      ctx.fillStyle = glow
      ctx.fillRect(0, 0, W, H)

      ctx.fillStyle = '#fff'
      ctx.globalAlpha = 0.6
      ctx.font = '13px "Noto Sans SC", sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('✦  致  ✦', W / 2, 200)
      ctx.globalAlpha = 1
      ctx.font = 'bold 30px "Noto Serif SC", serif'
      ctx.fillText(recipient, W / 2, 245)

      ctx.fillStyle = 'rgba(255,255,255,0.88)'
      wrapText(content, W / 2, 340, 520, contentLineHeight, contentFont + 'px "Noto Serif SC", serif')

      ctx.textAlign = 'right'
      ctx.fillStyle = 'rgba(255,255,255,0.5)'
      ctx.font = '33px "Noto Sans SC", sans-serif'
      ctx.fillText(sender, W - 80, H - 120)
      ctx.fillStyle = 'rgba(255,255,255,0.35)'
      ctx.font = '24px "Noto Sans SC", sans-serif'
      ctx.fillText(time, W - 80, H - 85)
    } else if (templateIdx === 1) {
      // 月夜情书
      ctx.fillStyle = '#f5f0e6'
      ctx.fillRect(0, 0, W, H)

      ctx.strokeStyle = '#4a4a4a'
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.arc(680, 130, 40, -Math.PI * 0.6, Math.PI * 0.6, false)
      ctx.arc(660, 130, 32, Math.PI * 0.5, -Math.PI * 0.5, true)
      ctx.closePath()
      ctx.stroke()

      ctx.fillStyle = '#6b5a4a'
      ctx.textAlign = 'center'
      ctx.font = 'bold 26px "Noto Serif SC", serif'
      ctx.fillText('致 ' + recipient, W / 2, 280)

      wrapText(content, W / 2, 340, 520, contentLineHeight, contentFont + 'px "Noto Serif SC", serif')

      ctx.textAlign = 'right'
      ctx.fillStyle = '#8a7a6a'
      ctx.font = '33px "Noto Sans SC", sans-serif'
      ctx.fillText(sender, W - 80, H - 120)
      ctx.fillStyle = '#a89a8a'
      ctx.font = '24px "Noto Sans SC", sans-serif'
      ctx.fillText(time, W - 80, H - 85)
    } else if (templateIdx === 2) {
      // 温馨信纸
      ctx.fillStyle = '#fffef8'
      ctx.fillRect(0, 0, W, H)

      ctx.strokeStyle = '#e8e0d0'
      ctx.lineWidth = 1
      ctx.setLineDash([8, 6])
      for (let y = 260; y < H - 100; y += 84) {
        ctx.beginPath()
        ctx.moveTo(80, y)
        ctx.lineTo(W - 80, y)
        ctx.stroke()
      }
      ctx.setLineDash([])

      ctx.fillStyle = color
      ctx.globalAlpha = 0.08
      ctx.fillRect(0, 0, W, 130)
      ctx.globalAlpha = 1

      ctx.fillStyle = color
      ctx.globalAlpha = 0.7
      ctx.font = '16px "Noto Sans SC", sans-serif'
      ctx.textAlign = 'left'
      ctx.fillText('To:', 80, 190)
      ctx.globalAlpha = 1
      ctx.fillStyle = '#3a2a1a'
      ctx.font = 'bold 30px "Noto Serif SC", serif'
      ctx.fillText(recipient, 120, 193)

      ctx.fillStyle = '#4a3a2a'
      ctx.textAlign = 'left'
      wrapText(content, 80, 310, W - 160, 84, contentFont + 'px "Noto Serif SC", serif')

      ctx.textAlign = 'right'
      ctx.fillStyle = '#8a7a6a'
      ctx.font = '33px "Noto Sans SC", sans-serif'
      ctx.fillText(sender, W - 80, H - 120)
      ctx.fillStyle = '#a89a8a'
      ctx.font = '24px "Noto Sans SC", sans-serif'
      ctx.fillText(time, W - 80, H - 85)
    } else if (templateIdx === 3) {
      // 生日派对
      const grad = ctx.createLinearGradient(0, 0, W, H)
      grad.addColorStop(0, '#fff0f5')
      grad.addColorStop(1, '#f0f0ff')
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, W, H)

      // Confetti circles
      const colors = ['#ff6b9d', '#ffd93d', '#6bcb77', '#4d96ff', '#ff6b6b', '#c084fc']
      const rng = (seed: number) => { let s = seed; return () => { s = (s * 9301 + 49297) % 233280; return s / 233280 } }
      const rand = rng(99)
      for (let i = 0; i < 30; i++) {
        ctx.fillStyle = colors[Math.floor(rand() * colors.length)]
        ctx.globalAlpha = rand() * 0.4 + 0.1
        ctx.beginPath()
        ctx.arc(rand() * W, rand() * H, rand() * 15 + 5, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.globalAlpha = 1

      ctx.fillStyle = '#e8456b'
      ctx.textAlign = 'center'
      ctx.font = 'bold 32px "Noto Serif SC", serif'
      ctx.fillText('🎂 Happy Birthday! 🎂', W / 2, 200)
      ctx.font = '24px "Noto Sans SC", sans-serif'
      ctx.fillStyle = '#8a5a6a'
      ctx.fillText(recipient, W / 2, 245)

      ctx.fillStyle = '#4a3a4a'
      wrapText(content, W / 2, 320, 520, contentLineHeight, contentFont + 'px "Noto Serif SC", serif')

      ctx.textAlign = 'right'
      ctx.fillStyle = '#8a7a8a'
      ctx.font = '33px "Noto Sans SC", sans-serif'
      ctx.fillText(sender, W - 80, H - 120)
      ctx.fillStyle = '#aaa'
      ctx.font = '24px "Noto Sans SC", sans-serif'
      ctx.fillText(time, W - 80, H - 85)
    } else if (templateIdx === 4) {
      // 极简文艺
      ctx.fillStyle = '#f8f8f8'
      ctx.fillRect(0, 0, W, H)

      // Thin top border
      ctx.fillStyle = '#333'
      ctx.fillRect(80, 160, W - 160, 1.5)

      ctx.fillStyle = '#333'
      ctx.textAlign = 'center'
      ctx.font = '18px "Noto Sans SC", sans-serif'
      ctx.fillText('致  ' + recipient, W / 2, 220)

      ctx.fillStyle = '#555'
      wrapText(content, W / 2, 300, 520, contentLineHeight, contentFont + 'px "Noto Serif SC", serif')

      // Bottom border
      ctx.fillRect(80, H - 170, W - 160, 1.5)

      ctx.textAlign = 'right'
      ctx.fillStyle = '#888'
      ctx.font = '33px "Noto Sans SC", sans-serif'
      ctx.fillText(sender, W - 80, H - 120)
      ctx.fillStyle = '#aaa'
      ctx.font = '24px "Noto Sans SC", sans-serif'
      ctx.fillText(time, W - 80, H - 85)
    } else if (templateIdx === 5) {
      // 丝带信笺
      ctx.fillStyle = '#fef6f0'
      ctx.fillRect(0, 0, W, H)

      // Ribbon
      ctx.fillStyle = color + '40'
      ctx.fillRect(0, 0, 60, H)
      ctx.fillRect(W - 60, 0, 60, H)

      // Corner decoration
      ctx.strokeStyle = color
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(80, 180)
      ctx.lineTo(120, 180)
      ctx.moveTo(80, 180)
      ctx.lineTo(80, 220)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(W - 80, 180)
      ctx.lineTo(W - 120, 180)
      ctx.moveTo(W - 80, 180)
      ctx.lineTo(W - 80, 220)
      ctx.stroke()

      ctx.fillStyle = color
      ctx.textAlign = 'center'
      ctx.font = 'bold 26px "Noto Serif SC", serif'
      ctx.fillText('致 ' + recipient, W / 2, 230)

      ctx.fillStyle = '#4a3a2a'
      wrapText(content, W / 2, 320, 480, contentLineHeight, contentFont + 'px "Noto Serif SC", serif')

      ctx.textAlign = 'right'
      ctx.fillStyle = '#8a7a6a'
      ctx.font = '33px "Noto Sans SC", sans-serif'
      ctx.fillText(sender, W - 100, H - 120)
      ctx.fillStyle = '#a89a8a'
      ctx.font = '24px "Noto Sans SC", sans-serif'
      ctx.fillText(time, W - 100, H - 85)
    } else if (templateIdx === 6) {
      // 童趣可爱
      ctx.fillStyle = '#f0f8ff'
      ctx.fillRect(0, 0, W, H)

      // Rainbow top bar
      const rainbow = ['#ff6b6b', '#ffa500', '#ffd93d', '#6bcb77', '#4d96ff', '#c084fc']
      const barH = 20
      rainbow.forEach((c, i) => {
        ctx.fillStyle = c
        ctx.fillRect(0, 100 + i * barH, W, barH)
      })

      ctx.fillStyle = '#e8456b'
      ctx.textAlign = 'center'
      ctx.font = 'bold 30px "Noto Serif SC", serif'
      ctx.fillText('🌈 ' + recipient + ' 🌈', W / 2, 290)

      ctx.fillStyle = '#4a3a5a'
      wrapText(content, W / 2, 350, 520, contentLineHeight, contentFont + 'px "Noto Serif SC", serif')

      ctx.textAlign = 'right'
      ctx.fillStyle = '#7a7a9a'
      ctx.font = '33px "Noto Sans SC", sans-serif'
      ctx.fillText('✨ ' + sender, W - 80, H - 120)
      ctx.fillStyle = '#aaa'
      ctx.font = '24px "Noto Sans SC", sans-serif'
      ctx.fillText(time, W - 80, H - 85)
    } else {
      // 复古生日
      ctx.fillStyle = '#f5efe8'
      ctx.fillRect(0, 0, W, H)

      // Stamp decoration
      ctx.strokeStyle = color
      ctx.lineWidth = 3
      ctx.globalAlpha = 0.15
      ctx.beginPath()
      ctx.arc(W / 2, 180, 60, 0, Math.PI * 2)
      ctx.stroke()
      ctx.globalAlpha = 1

      ctx.fillStyle = '#5a4a3a'
      ctx.textAlign = 'center'
      ctx.font = 'bold 28px "Noto Serif SC", serif'
      ctx.fillText(recipient, W / 2, 188)

      ctx.fillStyle = '#6a5a4a'
      ctx.font = '14px "Noto Sans SC", sans-serif'
      ctx.fillText('— 谨以此卡，祝您快乐 —', W / 2, 230)

      ctx.fillStyle = '#4a3a2a'
      wrapText(content, W / 2, 310, 520, contentLineHeight, contentFont + 'px "Noto Serif SC", serif')

      ctx.textAlign = 'right'
      ctx.fillStyle = '#8a7a6a'
      ctx.font = '33px "Noto Sans SC", sans-serif'
      ctx.fillText(sender, W - 80, H - 120)
      ctx.fillStyle = '#a89a8a'
      ctx.font = '24px "Noto Sans SC", sans-serif'
      ctx.fillText(time, W - 80, H - 85)
    }
  }

  function handleDownload() {
    const canvas = canvasRef.current
    if (!canvas) return
    const link = document.createElement('a')
    link.download = `祝福卡片_${Date.now()}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(30,20,10,0.4)', backdropFilter: 'blur(8px)' }} onClick={onClose}>
      <div className="rounded-2xl p-6 sm:p-8 w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold" style={{ fontFamily: '"Noto Serif SC", serif', color: '#3a2a1a' }}>下载祝福卡片</h3>
          <button onClick={onClose} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.04)', border: 'none', color: '#9a8a7a', cursor: 'pointer', fontSize: 16 }}>✕</button>
        </div>
        <div className="flex flex-col sm:flex-row gap-6">
          {/* Left: Template selector */}
          <div className="flex-1">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
              {TEMPLATES.map((tpl, idx) => (
                <button
                  key={idx}
                  onClick={() => setTemplateIdx(idx)}
                  className="rounded-xl p-3 cursor-pointer border-2 transition-all text-center"
                  style={{
                    background: tpl.bg,
                    borderColor: idx === templateIdx ? '#f17a1a' : 'transparent',
                  }}
                >
                  <div className="w-full h-16 rounded-lg mb-1.5 flex items-center justify-center text-xl" style={{ background: tpl.bg }}>
                    {tpl.emoji}
                  </div>
                  <p className="text-xs font-medium" style={{ color: '#4a3a2a' }}>{tpl.name}</p>
                  <p className="text-[10px]" style={{ color: '#bba' }}>{tpl.desc}</p>
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <button onClick={onClose} className="flex-1 py-3 rounded-xl font-medium cursor-pointer border border-black/[0.12]" style={{ background: 'transparent', color: '#555' }}>取消</button>
              <button onClick={handleDownload} className="flex-1 py-3 rounded-xl font-medium text-white cursor-pointer border-none" style={{ background: 'linear-gradient(135deg, #f49442, #f17a1a)' }}>
                <i className="fa-solid fa-download mr-1.5" />确认下载
              </button>
            </div>
          </div>
          {/* Right: Preview */}
          <div className="w-full sm:w-80 flex-shrink-0 flex flex-col">
            <p className="text-sm mb-2" style={{ color: '#6a5a4a' }}>预览：</p>
            <div className="rounded-xl overflow-hidden flex-1 flex items-center justify-center" style={{ background: '#f5f0eb', minHeight: 400 }}>
              <canvas ref={canvasRef} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
