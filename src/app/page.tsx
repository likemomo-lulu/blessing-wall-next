import Link from 'next/link'

async function getWalls(): Promise<Array<{id: string; title: string; description: string; slug: string; status: string; themeColor: string; messageCount: number; likeCount: number; createdAt: string}>> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/walls`, {
    cache: 'no-store'
  })
  if (!res.ok) return []
  return res.json()
}

export default async function HomePage() {
  const walls = await getWalls()

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-stone-100">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-white/70 border-b border-stone-200/50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-lg bg-gradient-to-br from-orange-400 to-orange-600">
              💌
            </div>
            <h1 className="text-xl font-bold text-stone-800" style={{ fontFamily: '"Noto Serif SC", serif' }}>
              BlessingWall
            </h1>
          </Link>
          <Link 
            href="/login" 
            className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-gradient-to-r from-orange-400 to-orange-600 hover:from-orange-500 hover:to-orange-700"
          >
            管理员登录
          </Link>
        </div>
      </header>

      {/* Hero */}
      <div className="max-w-6xl mx-auto px-4 py-12 text-center">
        <h2 className="text-3xl font-bold mb-3 text-stone-800" style={{ fontFamily: '"Noto Serif SC", serif' }}>
          每一面墙，都是一份心意
        </h2>
        <p className="text-stone-500">创建属于你的祝福墙，让美好传递</p>
      </div>

      {/* Wall Grid */}
      <div className="max-w-6xl mx-auto px-4 pb-12">
        {walls.length === 0 ? (
          <div className="text-center py-12 text-stone-400">暂无祝福墙</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {walls.map((wall) => (
              <Link
                key={wall.id}
                href={`/w/${wall.slug}`}
                className="group p-5 rounded-2xl border border-stone-100 bg-white/80 hover:bg-white transition-all hover:shadow-lg hover:-translate-y-1"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">🌈</span>
                    <div>
                      <h3 className="font-bold text-stone-800 group-hover:text-orange-600 transition-colors">
                        {wall.title}
                      </h3>
                      <p className="text-xs text-stone-400">
                        {new Date(wall.createdAt).toLocaleDateString('zh-CN')}
                      </p>
                    </div>
                  </div>
                  {wall.status === 'closed' && (
                    <span className="px-2 py-1 rounded text-xs bg-stone-100 text-stone-500">已关闭</span>
                  )}
                </div>
                <p className="text-sm text-stone-500 line-clamp-2 mb-3">{wall.description}</p>
                <div className="flex items-center gap-4 text-xs text-stone-400">
                  <span>💬 {wall.messageCount}</span>
                  <span>❤️ {wall.likeCount}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
