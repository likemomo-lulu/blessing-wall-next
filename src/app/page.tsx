import Link from 'next/link'
import { PrismaClient } from '@prisma/client'

export const dynamic = 'force-dynamic'

const prisma = new PrismaClient()

async function getWalls() {
  try {
    return await prisma.wall.findMany({
      where: { status: { not: 'hidden' } },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        description: true,
        slug: true,
        status: true,
        themeColor: true,
        messageCount: true,
        likeCount: true,
        createdAt: true,
      },
    })
  } catch (error) {
    console.error('[HomePage] getWalls error:', error)
    return []
  }
}

export default async function HomePage() {
  const walls = await getWalls()
  const showSearch = walls.length > 20

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(180deg, #fef7ee 0%, #fdf6f0 100%)' }}>
      {/* Floating decorations */}
      <div className="fixed rounded-full pointer-events-none opacity-[0.12] animate-pulse" style={{ width: 300, height: 300, background: '#f8b877', top: -50, left: -80 }} />
      <div className="fixed rounded-full pointer-events-none opacity-[0.12] animate-pulse" style={{ width: 200, height: 200, background: '#e8456b', top: '30%', right: -40 }} />
      <div className="fixed rounded-full pointer-events-none opacity-[0.12] animate-pulse" style={{ width: 250, height: 250, background: '#9b7ec8', bottom: '10%', left: '10%' }} />

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-black/[0.04]" style={{ background: 'rgba(254,247,238,0.85)', backdropFilter: 'blur(16px)' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-lg" style={{ background: 'linear-gradient(135deg, #f49442, #e8725a)' }}>
              <i className="fa-solid fa-heart" />
            </div>
            <div>
              <h1 className="text-xl font-bold leading-tight" style={{ fontFamily: '"Noto Serif SC", serif', color: '#3a2a1a' }}>
                BlessingWall
              </h1>
              <p className="text-xs leading-none mt-0.5" style={{ color: '#bba' }}>祝福不止于言</p>
            </div>
          </Link>
          <Link
            href="/login"
            className="px-4 py-2 rounded-xl text-sm font-medium border border-black/[0.12] text-stone-600 hover:border-orange-400 hover:text-orange-600 hover:bg-orange-50/50 transition-all"
          >
            <i className="fa-solid fa-shield-halved mr-1.5" />
            管理员
          </Link>
        </div>
      </header>

      {/* Hero */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 text-center relative z-10">
        <h2 className="text-3xl sm:text-4xl font-black mb-3" style={{ fontFamily: '"Noto Serif SC", serif', color: '#3a2a1a' }}>
          每一面墙，都藏着温暖 ✨
        </h2>
        <p className="text-base" style={{ color: '#8a7a6a', maxWidth: 480, margin: '0 auto' }}>
          在这里留下你的祝福，让每一份心意都被看见
        </p>
      </div>

      {/* Search (only when >20 walls) */}
      {showSearch && (
        <div className="max-w-lg mx-auto px-4 mb-10 relative z-10">
          <div className="flex items-center gap-3 rounded-2xl px-5 py-3 border border-black/[0.06] transition-all focus-within:border-orange-400 focus-within:shadow-[0_0_0_3px_rgba(241,122,26,0.1)]" style={{ background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(12px)' }}>
            <i className="fa-solid fa-magnifying-glass" style={{ color: '#bba' }} />
            <input
              type="text"
              id="wallSearch"
              placeholder="搜索祝福墙..."
              className="bg-transparent outline-none flex-1 text-sm"
              style={{ color: '#555' }}
              onInput={(e: React.FormEvent<HTMLInputElement>) => {
                const q = (e.target as HTMLInputElement).value.toLowerCase()
                document.querySelectorAll('.wall-card-item').forEach((card) => {
                  const el = card as HTMLElement
                  const title = el.getAttribute('data-title') || ''
                  const desc = el.getAttribute('data-desc') || ''
                  el.style.display = (!q || title.includes(q) || desc.includes(q)) ? '' : 'none'
                })
              }}
            />
          </div>
        </div>
      )}

      {/* Wall Grid */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-12 relative z-10">
        {walls.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">🏠</div>
            <p style={{ color: '#9a8a7a' }}>暂无祝福墙</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {walls.map((wall, i) => (
              <Link
                key={wall.id}
                href={`/w/${wall.slug}`}
                className="wall-card-item group p-6 rounded-2xl bg-white transition-all hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(0,0,0,0.08),0_8px_16px_rgba(0,0,0,0.04)] relative overflow-hidden"
                data-title={wall.title.toLowerCase()}
                data-desc={wall.description.toLowerCase()}
                style={{
                  boxShadow: '0 2px 12px rgba(0,0,0,0.03)',
                  animationDelay: `${i * 0.05}s`,
                }}
              >
                {/* Top accent bar on hover */}
                <div className="absolute top-0 left-0 right-0 h-1 origin-left scale-x-0 group-hover:scale-x-100 transition-transform" style={{ background: wall.themeColor }} />

                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xl">🌈</span>
                  <h3 className="text-lg font-bold leading-snug group-hover:text-orange-600 transition-colors" style={{ fontFamily: '"Noto Serif SC", serif', color: '#3a2a1a' }}>
                    {wall.title}
                  </h3>
                </div>
                <p className="text-sm mb-4 leading-relaxed line-clamp-2" style={{ color: '#9a8a7a' }}>
                  {wall.description}
                </p>
                <div className="flex items-center gap-4 text-xs" style={{ color: '#bba' }}>
                  <span><i className="fa-solid fa-message mr-1" />{wall.messageCount}</span>
                  <span><i className="fa-regular fa-calendar mr-1" />{new Date(wall.createdAt).toLocaleDateString('zh-CN')}</span>
                  {wall.status === 'closed' && (
                    <span className="px-2 py-0.5 rounded-full text-xs" style={{ background: 'rgba(180,160,140,0.15)', color: '#8a7a6a' }}>已关闭</span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
