// Mock 数据模式（本地调试用）
const USE_MOCK = process.env.USE_MOCK === 'true'

export const mockWalls = [
  {
    id: '1',
    title: '2026 毕业季祝福墙',
    description: '写给即将各奔东西的你们，愿前路繁花似锦',
    slug: 'graduation-2026',
    status: 'open',
    themeColor: '#FF6B6B',
    messageCount: 47,
    likeCount: 128,
    createdAt: new Date().toISOString()
  },
  {
    id: '2',
    title: '生日快乐，小明！',
    description: '祝小明生日快乐，天天开心',
    slug: 'xiaoming-birthday',
    status: 'open',
    themeColor: '#4ECDC4',
    messageCount: 23,
    likeCount: 56,
    createdAt: new Date().toISOString()
  }
]

export const mockMessages = [
  {
    id: '1',
    wallId: '1',
    nickname: '匿名',
    content: '毕业快乐！前程似锦！',
    likeCount: 12,
    createdAt: new Date().toISOString()
  },
  {
    id: '2',
    wallId: '1',
    nickname: '老同学',
    content: '四年时光转瞬即逝，祝大家都能找到理想的工作！',
    likeCount: 8,
    createdAt: new Date().toISOString()
  }
]

export function isMock() {
  return USE_MOCK
}
