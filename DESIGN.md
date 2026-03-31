# BlessingWall - 祝福墙平台方案设计文档

> 最后更新：2026-03-31

## 1. 项目概述

### 1.1 项目背景

校园/公司举办活动时（毕业季、情人节、节日庆祝、员工生日等），需要一个线上平台让大家留下祝福和表白。BlessingWall 提供一个轻量、免费、国内可稳定访问的多墙祝福平台。

### 1.2 核心功能

- **多墙模式**：每个活动创建一面独立的祝福墙，通过唯一链接访问
- **留言互动**：参与者无需注册，直接浏览、留言、点赞
- **管理后台**：管理员创建/管理墙、审核内容、控制状态
- **卡片下载**：留言可生成精美贺卡图片保存到本地

### 1.3 用户角色

| 角色 | 说明 | 权限 |
|------|------|------|
| 管理员 | 活动组织者 | 创建/删除墙、管理留言、切换状态 |
| 参与者 | 活动参与者 | 浏览墙、发布留言、点赞、下载卡片 |
| 访客 | 未登录用户 | 浏览公开墙列表 |

---

## 2. 技术选型

| 层 | 选型 | 版本 | 说明 |
|---|---|---|---|
| 前端框架 | Next.js (App Router) | 14.2.5 | SSR + API Routes，一站式方案 |
| 语言 | TypeScript | 5.4.5 | 类型安全 |
| UI 样式 | Tailwind CSS | 3.4.4 | 原子化 CSS，快速出活 |
| ORM | Prisma | 5.22.0 | 类型安全的数据库操作 |
| 数据库 | PostgreSQL (Neon) | - | 免费托管，Serverless |
| 部署 | Vercel | - | 自动构建部署，全球 CDN |
| 字体图标 | Font Awesome | - | 管理面板图标 |
| 卡片生成 | Canvas 2D API | - | 浏览器原生，无需依赖 |

### 2.1 为什么选 Next.js + Prisma 而非 LeanCloud

原方案使用 LeanCloud，实际实现改用 Next.js + Prisma，原因：

| 维度 | LeanCloud | Next.js + Prisma |
|------|-----------|------------------|
| 数据库控制 | 受限于 LeanCloud 数据模型 | 完全自由，标准 SQL |
| 部署 | 需 LeanCloud CLI 或手动上传 | `git push` 自动部署 |
| 路由 | 需 SPA 路由处理 | 服务端原生路由 |
| SEO | SPA 不利于 SEO | SSR 天然支持 |
| API | 云函数（需单独部署） | API Routes（同一项目） |
| 成本 | 免费 3 万次/天 | Vercel + Neon 免费层够用 |

---

## 3. 系统架构

### 3.1 整体架构图

```
┌─────────────────────────────────────────────────────┐
│                    Vercel CDN                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────┐  │
│  │ 首页 SSR │  │ 墙详情   │  │ 管理面板 CSR     │  │
│  └────┬─────┘  └────┬─────┘  └───────┬──────────┘  │
│       │             │                │              │
│  ┌────┴─────────────┴────────────────┴──────────┐   │
│  │           Next.js API Routes                 │   │
│  │  ┌────────┐ ┌──────────┐ ┌──────┐ ┌───────┐  │   │
│  │  │/walls  │ │/messages │ │/likes│ │/admin │  │   │
│  │  └───┬────┘ └────┬─────┘ └──┬───┘ └───┬───┘  │   │
│  └──────┼───────────┼──────────┼─────────┼──────┘   │
│         │           │          │         │          │
└─────────┼───────────┼──────────┼─────────┼──────────┘
          │           │          │         │
     ┌────┴───────────┴──────────┴─────────┴────┐
     │         Prisma Client                     │
     └──────────────────┬───────────────────────┘
                        │
     ┌──────────────────┴───────────────────────┐
     │      Neon PostgreSQL (Serverless)         │
     │  ┌──────┐ ┌─────────┐ ┌──────┐          │
     │  │ Wall │ │ Message │ │ Like │          │
     │  └──────┘ └─────────┘ └──────┘          │
     └──────────────────────────────────────────┘
```

### 3.2 请求流程

**浏览首页：**
```
用户访问 / → Next.js SSR → Prisma 查询 Wall 列表 → 渲染 HTML → 返回
```

**发布留言：**
```
用户点击发布 → POST /api/messages → 校验墙状态 → Prisma 创建 Message
→ 递增 Wall.messageCount → 返回新留言 → 前端刷新列表
```

**管理员操作：**
```
登录 → POST /api/admin/login → 验证账密 → 生成 Token
→ 前端存 localStorage → 后续请求带 Authorization: Bearer <token>
→ API 验证 Token → 执行管理操作
```

---

## 4. 数据库设计

### 4.1 ER 关系

```
Wall 1 ──→ * Message
                │
Message 1 ──→ * Like
```

### 4.2 表结构

#### Wall（祝福墙）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | String | PK, cuid() | 唯一标识 |
| title | String | NOT NULL | 墙标题 |
| description | String | NOT NULL | 墙描述 |
| protagonist | String? | - | 祝福送给谁，空则取 title |
| themeColor | String | DEFAULT '#FF6B6B' | 主题色 hex |
| slug | String | UNIQUE | URL 标识，如 `graduation-2026` |
| status | String | DEFAULT 'open' | open / closed / hidden |
| likeCount | Int | DEFAULT 0 | 总点赞数（冗余） |
| messageCount | Int | DEFAULT 0 | 留言总数（冗余） |
| createdAt | DateTime | DEFAULT now() | 创建时间 |
| updatedAt | DateTime | @updatedAt | 更新时间 |

#### Message（留言）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | String | PK, cuid() | 唯一标识 |
| wallId | String | FK → Wall.id | 所属墙 |
| nickname | String | DEFAULT '匿名' | 昵称 |
| content | Text | NOT NULL | 祝福内容，≤1000字 |
| likeCount | Int | DEFAULT 0 | 点赞数 |
| createdAt | DateTime | DEFAULT now() | 发布时间 |

#### Like（点赞）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | String | PK, cuid() | 唯一标识 |
| messageId | String | FK → Message.id | 所属留言 |
| fingerprint | String | - | 访客标识 |
| createdAt | DateTime | DEFAULT now() | 点赞时间 |

**联合唯一约束**：`(messageId, fingerprint)` — 同一用户对同一条留言只能点一次赞

**索引**：`fingerprint` — 用于查询某用户的所有点赞

### 4.3 墙状态机

```
                    ┌──────────┐
           ┌──────→│   open   │←──────┐
           │       └──────────┘       │
      恢复 │              │ 关闭/隐藏  │ 恢复
           │              ↓           │
           │       ┌──────────┐       │
           └───────│  closed  │───────┘
                   └──────────┘

           ┌──────────┐
           │  hidden  │←──→ open
           └──────────┘
```

| 状态 | 首页列表 | 通过链接访问 | 留言 | 说明 |
|------|---------|------------|------|------|
| open | ✅ 显示 | ✅ 正常 | ✅ 可留言 | 正常状态 |
| closed | ✅ 显示 | ✅ 正常 + 提示 | ❌ 不可留言 | 活动结束 |
| hidden | ❌ 不显示 | ✅ 正常 | ✅ 可留言 | 不在首页展示 |

### 4.4 Prisma Schema

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Wall {
  id            String    @id @default(cuid())
  title         String
  description   String
  protagonist   String?
  themeColor    String    @default("#FF6B6B")
  slug          String    @unique
  status        String    @default("open")
  likeCount     Int       @default(0)
  messageCount  Int       @default(0)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  messages      Message[]
}

model Message {
  id          String   @id @default(cuid())
  wallId      String
  wall        Wall     @relation(fields: [wallId], references: [id], onDelete: Cascade)
  nickname    String   @default("匿名")
  content     String   @db.Text
  likeCount   Int      @default(0)
  createdAt   DateTime @default(now())
  likes       Like[]
}

model Like {
  id            String   @id @default(cuid())
  messageId     String
  message       Message  @relation(fields: [messageId], references: [id], onDelete: Cascade)
  fingerprint   String
  createdAt     DateTime @default(now())

  @@unique([messageId, fingerprint])
  @@index([fingerprint])
}
```

---

## 5. API 设计

### 5.1 接口总览

| 方法 | 路径 | 鉴权 | 说明 |
|------|------|------|------|
| POST | /api/admin/login | ❌ | 管理员登录 |
| GET | /api/walls | ❌ | 获取墙列表（过滤 hidden） |
| GET | /api/walls?admin=true | ✅ | 获取全部墙（含 hidden） |
| POST | /api/walls | ✅ | 创建墙 |
| PATCH | /api/walls | ✅ | 更新墙状态 |
| DELETE | /api/walls?id=xxx | ✅ | 删除墙 |
| GET | /api/walls/[slug] | ❌ | 获取单个墙详情 |
| GET | /api/messages?wallId=xxx | ❌ | 获取留言列表 |
| POST | /api/messages | ❌ | 发布留言 |
| DELETE | /api/messages?id=xxx | ✅ | 删除留言 |
| POST | /api/likes | ❌ | 点赞/取消点赞 |

### 5.2 认证机制

**方案**：无状态 Token（密码哈希派生）

```
登录：SHA256(密码) → 比对 ADMIN_PASSWORD_HASH → 成功则返回 SHA256(ADMIN_PASSWORD_HASH + ":session")
验证：请求 Header → Authorization: Bearer <token> → SHA256(ADMIN_PASSWORD_HASH + ":session") → 比对
```

**特点**：
- 无需数据库存储 session
- 相同密码始终生成相同 token
- 密码修改后旧 token 自动失效
- 适合单管理员场景

**存储**：前端 `localStorage.setItem('admin_token', token)`

### 5.3 接口详细设计

#### POST /api/admin/login — 管理员登录

```
Request:
  POST /api/admin/login
  Content-Type: application/json
  {
    "username": "admin",
    "password": "password"
  }

Response 200:
  { "success": true, "token": "5e884898da..." }

Response 401:
  { "error": "用户名或密码错误" }

Response 500:
  { "error": "管理员未配置" }
```

#### GET /api/walls — 获取墙列表

```
Request:
  GET /api/walls
  GET /api/walls?admin=true  （管理员查看全部）

Response 200:
  [
    {
      "id": "clxxx",
      "title": "2026 毕业季祝福墙",
      "description": "写给即将各奔东西的你们",
      "slug": "graduation-2026",
      "status": "open",
      "themeColor": "#FF6B6B",
      "likeCount": 128,
      "messageCount": 47,
      "createdAt": "2026-03-30T10:00:00.000Z"
    }
  ]
```

#### POST /api/walls — 创建墙

```
Request:
  POST /api/walls
  Authorization: Bearer <token>
  {
    "title": "生日快乐",
    "description": "祝小明生日快乐",
    "protagonist": "小明",
    "themeColor": "#4ECDC4",
    "slug": "xiaoming-birthday",
    "status": "open"
  }

Response 200:
  { "id": "clxxx", "title": "生日快乐", ... }
```

#### PATCH /api/walls — 更新墙状态

```
Request:
  PATCH /api/walls
  Authorization: Bearer <token>
  { "id": "clxxx", "status": "closed" }

Response 200:
  { "id": "clxxx", "status": "closed", ... }
```

#### DELETE /api/walls — 删除墙

```
Request:
  DELETE /api/walls?id=clxxx
  Authorization: Bearer <token>

Response 200:
  { "success": true }
```

> 级联删除：删除墙时自动删除所有留言和点赞（Prisma `onDelete: Cascade`）

#### POST /api/messages — 发布留言

```
Request:
  POST /api/messages
  {
    "wallId": "clxxx",
    "nickname": "老同学",
    "content": "毕业快乐！前程似锦！"
  }

Response 200:
  { "id": "clxxx", "nickname": "老同学", ... }

Response 400:
  { "error": "内容不能为空" }
  { "error": "内容不能超过1000字" }

Response 403:
  { "error": "该墙已关闭留言" }
```

#### POST /api/likes — 点赞/取消点赞

```
Request:
  POST /api/likes
  x-fingerprint: <浏览器指纹>
  { "messageId": "clxxx" }

Response 200 (点赞成功):
  { "liked": true, "likeCount": 13 }

Response 200 (取消点赞):
  { "liked": false, "likeCount": 12 }
```

---

## 6. 前端设计

### 6.1 页面路由

| 路由 | 页面 | 渲染方式 | 说明 |
|------|------|---------|------|
| / | 首页 | SSR | 公开墙列表，>20 个时显示搜索框 |
| /login | 管理员登录 | CSR | 已登录自动跳转 /admin |
| /admin | 管理面板 | CSR | 创建/管理墙，需登录 |
| /w/[slug] | 墙详情 | CSR | 留言卡片网格 + 发布 + 下载 |

### 6.2 页面设计

#### 首页

```
┌──────────────────────────────────────┐
│  💌 BlessingWall        管理员登录   │
├──────────────────────────────────────┤
│                                      │
│     每一面墙，都是一份心意            │
│     创建属于你的祝福墙，让美好传递    │
│                                      │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐│
│  │ 🌈      │ │ 🌈      │ │ 🌈      ││
│  │ 毕业季  │ │ 生日快乐│ │ 情人节  ││
│  │ 💬 47   │ │ 💬 23   │ │ 💬 12   ││
│  │ ❤️ 128  │ │ ❤️ 56   │ │ ❤️ 34   ││
│  └─────────┘ └─────────┘ └─────────┘│
│                                      │
│          [ 搜索框，>20 时显示 ]       │
└──────────────────────────────────────┘
```

- 暖色渐变背景
- 响应式网格：手机 1 列，平板 2 列，桌面 3 列
- 卡片悬停上浮 + 阴影效果
- 已关闭的墙显示「已关闭」标签

#### 墙详情页

```
┌──────────────────────────────────────┐
│  ← 返回    2026 毕业季祝福墙          │
├──────────────────────────────────────┤
│  写给即将各奔东西的你们              │
│                                      │
│  ┌──────────────┐ ┌──────────────┐  │
│  │ 祝福内容...   │ │ 祝福内容...   │  │
│  │ 老同学        │ │ 匿名          │  │
│  │ 3月30日 ❤️12  │ │ 3月30日 ❤️8   │  │
│  │     [下载]    │ │     [下载]    │  │
│  └──────────────┘ └──────────────┘  │
│                                      │
│  ┌──────────────┐ ┌──────────────┐  │
│  │ ...          │ │ ...          │  │
│  └──────────────┘ └──────────────┘  │
│                                      │
│                    [ ✏️ 写祝福 FAB ]  │
└──────────────────────────────────────┘
```

- 等高卡片网格：手机 1 列，平板 2 列，桌面 3-4 列
- 卡片颜色/装饰跟随墙的主题色
- 每张卡片：祝福内容 + 昵称 + 发布时间 + 点赞 + 下载按钮
- 右下角 FAB 按钮发布留言
- 墙关闭时顶部显示「已关闭」提示

#### 管理面板

```
┌──────────────────────────────────────┐
│  首页  管理面板          [创建新墙]   │
├──────────────────────────────────────┤
│  ┌──────────────────────────────────┐│
│  │ 毕业季祝福墙  开放  💬47  ❤️128  ││
│  │ 3月30日 │ 开放 关闭 隐藏 │ 删除  ││
│  ├──────────────────────────────────┤│
│  │ 生日快乐    已关闭 💬23  ❤️56    ││
│  │ 3月29日 │ 开放 关闭 隐藏 │ 删除  ││
│  └──────────────────────────────────┘│
└──────────────────────────────────────┘
```

- 墙卡片列表（非表格）
- 每面墙显示：标题、状态标签、统计数据、操作按钮
- 三态切换：open → closed → hidden
- 删除操作需二次确认弹窗
- 展开可查看该墙的留言列表（支持删除留言）

#### 下载卡片弹窗

```
┌──────────────────────────────────────┐
│  下载祝福卡片                   ✕    │
├──────────────────────────────────────┤
│              │                       │
│  [模板选择]  │    [实时预览]          │
│  ┌───┬───┐   │                       │
│  │ 🌸│🎨│   │   ┌─────────────┐    │
│  ├───┼───┤   │   │             │    │
│  │ 🌙│💌│   │   │  收件人：小明 │    │
│  ├───┼───┤   │   │             │    │
│  │ 🎂│🧸│   │   │  祝福内容... │    │
│  ├───┼───┤   │   │             │    │
│  │ 📜│    │   │   │  —— 老同学  │    │
│  └───┴───┘   │   │  2026.3.30  │    │
│              │   └─────────────┘    │
│              │                       │
│              │      [📥 下载 PNG]    │
└──────────────────────────────────────┘
```

- 左侧：8 个模板缩略图（3 列网格）
- 右侧：Canvas 实时预览
- 收件人自动取自墙的 `protagonist` 字段
- 下载为 800×1120 高清 PNG

### 6.3 卡片模板设计

| 模板名 | 风格 | 配色 |
|--------|------|------|
| 温馨花卉 | 粉色花瓣边框 + 绿叶装饰 | 粉色系 |
| 极简文艺 | 大量留白 + 细线边框 | 米色/灰色 |
| 星空许愿 | 深蓝星空背景 + 星星点缀 | 深蓝色系 |
| 月夜情书 | 米色手绘风格 + 月亮元素 | 暖米色 |
| 丝带信笺 | 丝带装饰 + 信纸质感 | 奶白色 |
| 生日派对 | 彩旗 + 气球 + 蛋糕元素 | 彩色 |
| 童趣可爱 | 圆角 + 手绘贴纸风格 | 马卡龙色 |
| 复古生日 | 复古纸张纹理 + 花体字 | 棕色系 |

每个模板使用 Canvas 2D API 绘制，实现 `draw(ctx, data)` 方法。

---

## 7. 安全设计

### 7.1 威胁与对策

| 威胁 | 对策 | 实现 |
|------|------|------|
| 未授权管理操作 | Token 鉴权 | Bearer Token + 密码哈希派生 |
| 重复点赞 | 联合唯一约束 | `(messageId, fingerprint)` 数据库唯一约束 |
| XSS | React 自动转义 | 纯文本 + emoji，无富文本 |
| 刷留言 | 内容校验 | 非空 + ≤1000字 |
| 数据库凭据泄露 | 环境变量 | `.env` 文件不入 git（.gitignore） |
| 密码明文存储 | SHA-256 哈希 | 只存储哈希值，永远不存明文 |

### 7.2 管理员认证流程

```
1. 用户提交用户名 + 密码
2. 服务端用 SHA-256 哈希密码
3. 比对环境变量中的 ADMIN_PASSWORD_HASH
4. 匹配 → 生成 Token = SHA256(ADMIN_PASSWORD_HASH + ":session")
5. 返回 Token → 前端存 localStorage
6. 后续管理请求 → Header: Authorization: Bearer <token>
7. 服务端用相同算法生成 Token → 比对
```

**安全性分析**：
- ✅ 密码不明文传输/存储
- ✅ Token 不可伪造（需要知道密码哈希）
- ✅ 无状态，不需要 session 存储
- ⚠️ Token 不过期（可接受，单管理员场景）
- ⚠️ Token 在 localStorage 可被 JS 读取（可改用 HttpOnly Cookie 加强）

---

## 8. 项目结构

```
blessing-wall-next/
├── .env                    # 环境变量（不提交）
├── .env.example            # 环境变量示例
├── .npmrc                  # npm 源配置
├── package.json            # 项目配置
├── tsconfig.json           # TypeScript 配置
├── tailwind.config.ts      # Tailwind 配置
├── next.config.mjs         # Next.js 配置
├── DEPLOY.md               # 部署操作文档
│
├── prisma/
│   └── schema.prisma       # 数据库模型定义
│
├── src/
│   ├── app/
│   │   ├── layout.tsx      # 全局布局（字体、meta）
│   │   ├── globals.css     # 全局样式（Tailwind）
│   │   ├── page.tsx        # 首页（SSR，墙列表）
│   │   ├── login/
│   │   │   └── page.tsx    # 管理员登录页
│   │   ├── admin/
│   │   │   └── page.tsx    # 管理面板（CSR）
│   │   ├── w/
│   │   │   └── [slug]/
│   │   │       └── page.tsx # 墙详情页
│   │   └── api/
│   │       ├── admin/
│   │       │   └── login/
│   │       │       └── route.ts  # 登录接口
│   │       ├── walls/
│   │       │   ├── route.ts      # 墙 CRUD
│   │       │   └── [slug]/
│   │       │       └── route.ts  # 单墙详情
│   │       ├── messages/
│   │       │   └── route.ts      # 留言 CRUD
│   │       └── likes/
│   │           └── route.ts      # 点赞
│   │
│   └── lib/
│       ├── prisma.ts        # Prisma 客户端（防热重载多实例）
│       └── auth.ts          # 管理员 Token 验证
│
└── public/                  # 静态资源
```

### 8.1 关键文件说明

| 文件 | 作用 |
|------|------|
| `prisma/schema.prisma` | 数据库模型定义，Prisma 根据此生成客户端和迁移 |
| `src/lib/prisma.ts` | Prisma 客户端单例，开发环境防止热重载创建多个连接 |
| `src/lib/auth.ts` | Token 验证函数，所有管理 API 调用 |
| `src/app/page.tsx` | 首页，Server Component，直接用 Prisma 查询（`force-dynamic`） |
| `src/app/api/*/route.ts` | API Routes，Next.js App Router 的后端接口 |

---

## 9. 部署架构

### 9.1 部署拓扑

```
GitHub (代码仓库)
    │
    │ git push
    ↓
Vercel (CI/CD)
    │
    ├─→ npm install
    ├─→ prisma generate
    ├─→ next build (SSR + SSG)
    └─→ Deploy (Edge Functions + CDN)
         │
         ├─→ Serverless Functions (API Routes)
         └─→ Static Assets (CDN)
              │
              └─→ Neon PostgreSQL (Serverless DB)
```

### 9.2 环境变量

| 变量 | 位置 | 说明 |
|------|------|------|
| DATABASE_URL | .env + Vercel | PostgreSQL 连接字符串 |
| ADMIN_USERNAME | .env + Vercel | 管理员用户名 |
| ADMIN_PASSWORD_HASH | .env + Vercel | 密码 SHA256 哈希 |

### 9.3 成本估算

| 服务 | 免费额度 | 预计用量 | 超出成本 |
|------|---------|---------|---------|
| Vercel | 100GB 带宽/月 | 几 GB | $20/100GB |
| Neon | 0.5GB 存储 | < 100MB | 按需计费 |
| 域名 | - | $10/年 | - |

**结论**：中小型活动（几百面墙、几千条留言）完全在免费额度内。

---

## 10. 后续迭代方向（v2+）

| 功能 | 优先级 | 说明 |
|------|--------|------|
| 图片/视频上传 | P1 | 七牛/阿里云 OSS |
| 留言分页/无限滚动 | P1 | 游标分页，性能优化 |
| 敏感词过滤 | P1 | 正则 + 第三方 API |
| 留言排序切换 | P2 | 最新/最热/最早 |
| AI 辅助写祝福 | P2 | LLM 生成祝福文案 |
| 定时揭晓 | P2 | 预约时间开放留言 |
| 留言评论/回复 | P3 | 嵌套评论 |
| 二维码生成 | P3 | 墙链接生成二维码 |
| 数据导出 | P3 | Excel/CSV 导出 |
| 多语言 | P4 | 中英文切换 |
| 访问密码保护 | P4 | 墙级别密码 |
| 消息通知 | P4 | 微信/邮件通知 |
| 自定义主题模板 | P4 | 更多卡片模板 |
