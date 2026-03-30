'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'

interface Wall {
  id: string
  title: string
  description: string
  themeColor: string
  status: string
}

interface Message {
  id: string
  nickname: string
  content: string
  likeCount: number
  createdAt: string
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

  useEffect(() => {
    fetchWall()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug])

  async function fetchWall() {
    const res = await fetch(`/api/walls/${slug}`)
    if (res.ok) {
      const data = await res.json()
      setWall(data)
    }
    setLoading(false)
  }

  async function fetchMessages() {
    if (!wall?.id) return
    const res = await fetch(`/api/messages?wallId=${wall.id}`)
    if (res.ok) {
      const data = await res.json()
      setMessages(data)
    }
  }

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
        fetchMessages()
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
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messageId })
    })
    if (res.ok) {
      fetchMessages()
    }
  }

  if (loading) return <div className="p-8 text-center">加载中...</div>
  if (!wall) return <div className="p-8 text-center">墙不存在</div>

  return (
    <div className="min-h-screen p-4" style={{ background: wall.themeColor + '10' }}>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-2">{wall.title}</h1>
        <p className="text-stone-500 mb-6">{wall.description}</p>
        
        {wall.status === 'open' && (
          <button 
            onClick={() => setShowPublish(true)}
            className="mb-6 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
          >
            写祝福
          </button>
        )}

        {showPublish && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-xl w-full max-w-md">
              <h3 className="font-bold mb-4">写下你的祝福</h3>
              <input
                type="text"
                placeholder="昵称（可选）"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                className="w-full p-3 border rounded-lg mb-3"
              />
              <textarea
                placeholder="写下你的祝福..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={4}
                className="w-full p-3 border rounded-lg mb-4"
              />
              <div className="flex gap-3">
                <button onClick={() => setShowPublish(false)} className="flex-1 py-2 border rounded-lg">取消</button>
                <button 
                  onClick={handlePublish} 
                  disabled={publishing}
                  className="flex-1 py-2 bg-orange-500 text-white rounded-lg disabled:opacity-50"
                >
                  {publishing ? '发布中...' : '发布'}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="grid gap-4">
          {messages.length === 0 ? (
            <div className="text-center py-8 text-stone-400">还没有留言，来写第一条吧</div>
          ) : (
            messages.map((msg) => (
              <div key={msg.id} className="p-4 bg-white rounded-xl shadow-sm">
                <p className="mb-2">{msg.content}</p>
                <div className="flex justify-between text-sm text-stone-400">
                  <span>{msg.nickname}</span>
                  <button 
                    onClick={() => handleLike(msg.id)}
                    className="hover:text-orange-500"
                  >
                    ❤️ {msg.likeCount}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
