'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface Wall {
  id: string
  title: string
  status: string
  messageCount: number
  likeCount: number
}

export default function AdminPage() {
  const [walls, setWalls] = useState<Wall[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchWalls()
  }, [])

  async function fetchWalls() {
    const res = await fetch('/api/walls')
    if (res.ok) {
      const data = await res.json()
      setWalls(data)
    }
    setLoading(false)
  }

  async function createWall() {
    const title = prompt('墙标题：')
    if (!title) return
    const description = prompt('墙描述：') || ''
    const slug = Math.random().toString(36).substring(2, 10)
    
    const res = await fetch('/api/walls', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        description,
        slug,
        themeColor: '#FF6B6B',
        status: 'open'
      })
    })
    
    if (res.ok) {
      fetchWalls()
    }
  }

  async function toggleStatus(id: string, currentStatus: string) {
    const _newStatus = currentStatus === 'open' ? 'closed' : 'open'
    fetchWalls()
  }

  if (loading) return <div className="p-8 text-center">加载中...</div>

  return (
    <div className="min-h-screen p-4 bg-orange-50">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-stone-800">管理面板</h1>
          <button 
            onClick={createWall}
            className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
          >
            创建新墙
          </button>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="border-b bg-stone-50">
              <tr className="text-left text-stone-500">
                <th className="p-4">标题</th>
                <th className="p-4">状态</th>
                <th className="p-4">留言数</th>
                <th className="p-4">点赞数</th>
                <th className="p-4">操作</th>
              </tr>
            </thead>
            <tbody>
              {walls.map((wall) => (
                <tr key={wall.id} className="border-b last:border-0">
                  <td className="p-4">{wall.title}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-xs ${
                      wall.status === 'open' ? 'bg-green-100 text-green-600' :
                      wall.status === 'closed' ? 'bg-stone-100 text-stone-500' :
                      'bg-gray-100 text-gray-500'
                    }`}>
                      {wall.status === 'open' ? '开放' : wall.status === 'closed' ? '已关闭' : '隐藏'}
                    </span>
                  </td>
                  <td className="p-4">{wall.messageCount}</td>
                  <td className="p-4">{wall.likeCount}</td>
                  <td className="p-4">
                    <button 
                      onClick={() => toggleStatus(wall.id, wall.status)}
                      className="text-orange-500 hover:underline"
                    >
                      {wall.status === 'open' ? '关闭' : '开放'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
