# BlessingWall 部署操作文档

## 目录

1. [环境准备](#1-环境准备)
2. [创建 PostgreSQL 数据库](#2-创建-postgresql-数据库)
3. [项目初始化](#3-项目初始化)
4. [数据库建表](#4-数据库建表)
5. [本地开发](#5-本地开发)
6. [推送到 GitHub](#6-推送到-github)
7. [Vercel 部署](#7-vercel-部署)
8. [Vercel 环境变量配置](#8-vercel-环境变量配置)
9. [部署验证](#9-部署验证)
10. [常见问题排查](#10-常见问题排查)

---

## 1. 环境准备

### 需要安装的工具

| 工具 | 版本要求 | 用途 | 安装命令 |
|------|---------|------|---------|
| Node.js | 20.x | 运行环境 | `nvm install 20` 或 [官网下载](https://nodejs.org) |
| npm | >= 9.0.0 | 包管理器 | Node 20 自带 |
| Git | 最新版 | 版本控制 | `brew install git` |

### 验证安装

```bash
node -v    # 应显示 v20.x.x
npm -v     # 应显示 9.x.x 或更高
git --version
```

> ⚠️ **如果 npm 版本低于 9**：执行 `npm install -g npm@latest` 升级

---

## 2. 创建 PostgreSQL 数据库

本项目使用 [Neon](https://neon.tech) 免费数据库（也可用其他 PostgreSQL 服务）。

### 步骤

1. 打开 https://neon.tech ，注册/登录
2. 点击 **Create Project**
3. 填写项目名称（如 `blessing-wall`），选择区域（建议选离用户近的，如 Singapore）
4. 创建完成后，在 Dashboard 找到 **Connection String**，格式如下：
   ```
   postgresql://neondb_owner:密码@ep-xxx.region.aws.neon.tech/neondb?sslmode=require
   ```
5. 复制这个连接字符串，后面会用到

### 数据库说明

- **免费额度**：0.5 GB 存储，足够几百面墙和几千条留言
- **连接字符串**：包含数据库地址、用户名、密码，不要泄露

---

## 3. 项目初始化

### 克隆代码

```bash
git clone https://github.com/likemomo-lulu/blessing-wall-next.git
cd blessing-wall-next
```

### 安装依赖

```bash
npm install
```

> **作用**：下载 `package.json` 中声明的所有依赖包到 `node_modules/` 目录

### 创建环境变量文件

在项目根目录创建 `.env` 文件：

```bash
# 数据库连接字符串（从 Neon 复制，替换下面的值）
DATABASE_URL="postgresql://neondb_owner:你的密码@ep-xxx.aws.neon.tech/neondb?sslmode=require"

# 管理员账号
ADMIN_USERNAME=admin

# 管理员密码的 SHA256 哈希（"password" 的哈希值，见下方说明）
ADMIN_PASSWORD_HASH=5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8
```

#### 如何修改管理员密码

默认密码是 `password`，如果想改成自己的密码：

```bash
# 在终端生成密码的 SHA256 哈希
echo -n "你的新密码" | shasum -a 256
```

把输出的哈希值（32位十六进制字符串）替换 `ADMIN_PASSWORD_HASH` 的值。

#### `.env` 文件说明

| 变量 | 必填 | 说明 |
|------|------|------|
| `DATABASE_URL` | ✅ | PostgreSQL 连接字符串 |
| `ADMIN_USERNAME` | ✅ | 管理员用户名 |
| `ADMIN_PASSWORD_HASH` | ✅ | 管理员密码的 SHA256 哈希 |

### 创建 `.npmrc` 文件

项目根目录需要 `.npmrc` 文件，指定使用公共 npm 源（防止使用公司内部源导致部署失败）：

```bash
echo 'registry=https://registry.npmjs.org/' > .npmrc
```

> **作用**：确保安装依赖时使用公共 npm 源，而不是公司/本地私有源

---

## 4. 数据库建表

### 一键建表

```bash
npx prisma db push
```

> **作用**：读取 `prisma/schema.prisma` 文件中定义的数据模型，在数据库中创建对应的表

### 预期输出

```
🚀 Your database is now in sync with your Prisma schema.
```

### 验证建表

```bash
npx prisma studio
```

> **作用**：打开数据库可视化工具（浏览器），可以查看表和数据

浏览器会打开 http://localhost:5555 ，应该能看到 `Wall`、`Message`、`Like` 三张表。

### 数据模型说明

```
Wall（祝福墙）
├── id           唯一ID
├── title        标题
├── description  描述
├── protagonist  祝福送给谁（可选）
├── themeColor   主题色
├── slug         URL标识（唯一，如 graduation-2026）
├── status       状态：open / closed / hidden
├── likeCount    总点赞数
├── messageCount 留言总数
├── createdAt    创建时间
└── updatedAt    更新时间

Message（留言）
├── id          唯一ID
├── wallId      所属墙ID
├── nickname    昵称（默认"匿名"）
├── content     祝福内容
├── likeCount   点赞数
└── createdAt   发布时间

Like（点赞）
├── messageId   所属留言ID
├── fingerprint 访客标识
└── createdAt   点赞时间
```

---

## 5. 本地开发

### 启动开发服务器

```bash
npm run dev
```

> **作用**：启动 Next.js 开发服务器，支持热更新

浏览器打开 http://localhost:3000

### 常用开发命令

| 命令 | 作用 |
|------|------|
| `npm run dev` | 启动开发服务器 |
| `npm run build` | 构建生产版本 |
| `npm run start` | 运行生产版本 |
| `npx prisma studio` | 数据库可视化管理 |
| `npx prisma db push` | 同步数据库结构 |
| `npx tsc --noEmit` | TypeScript 类型检查 |

---

## 6. 推送到 GitHub

### 创建 GitHub 仓库

1. 打开 https://github.com/new
2. 仓库名：`blessing-wall-next`
3. 设为 Private 或 Public（均可）
4. 不要初始化 README（项目已有代码）

### 推送代码

```bash
git remote add origin https://github.com/你的用户名/blessing-wall-next.git
git branch -M main
git push -u origin main
```

> **作用**：将本地代码推送到 GitHub，Vercel 会从 GitHub 拉取代码部署

---

## 7. Vercel 部署

### 步骤

1. 打开 https://vercel.com ，注册/登录（建议用 GitHub 账号登录）
2. 点击 **Add New** → **Project**
3. 在 **Import Git Repository** 中找到 `blessing-wall-next`，点击 **Import**
4. **Build Configuration** 保持默认：
   - Framework Preset: Next.js（自动检测）
   - Build Command: `npm run build`（默认）
   - Output Directory: 默认
5. 点击 **Deploy**
6. 等待构建完成（约 1-2 分钟）

部署成功后，Vercel 会分配一个预览地址：
```
https://blessing-wall-next-xxx.vercel.app
```

---

## 8. Vercel 环境变量配置

部署成功后，**必须**在 Vercel 配置环境变量，否则功能异常。

### 配置步骤

1. 进入 Vercel 项目 → **Settings** → **Environment Variables**
2. 添加以下三个变量（逐个添加）：

| Key | Value |
|-----|-------|
| `DATABASE_URL` | 你的 PostgreSQL 连接字符串 |
| `ADMIN_USERNAME` | admin（或你自定义的用户名） |
| `ADMIN_PASSWORD_HASH` | 密码的 SHA256 哈希 |

3. Environment 选择 **Production**、**Preview**、**Development** 全选
4. 点击 **Save**

### ⚠️ 重要：重新部署

添加环境变量后，需要重新部署才能生效：

1. 进入 **Deployments** 页面
2. 点击最新一次部署右边的 **三个点** → **Redeploy**
3. 点击 **Redeploy** 确认

---

## 9. 部署验证

部署完成后，逐项验证：

### 9.1 首页

- 访问你的域名，应看到空白的祝福墙列表页面
- 如果之前创建了墙，应该能看到墙的卡片

### 9.2 管理员登录

- 点击右上角「管理员登录」
- 输入用户名 `admin` 和密码 `password`
- 应跳转到管理面板

### 9.3 创建墙

- 在管理面板点击「创建新墙」
- 填写标题、描述，点击创建
- 返回首页应能看到新创建的墙

### 9.4 访问墙详情

- 点击墙卡片进入详情页
- 应显示留言卡片网格布局
- 点击「写祝福」按钮应弹出发布弹窗

---

## 10. 常见问题排查

### Q1: `npm install` 报错 `ENOTSUP Unsupported engine`

**原因**：npm 版本太低（< 9.0.0）

**解决**：
```bash
npm install -g npm@latest
npm -v  # 确认版本 >= 9
```

---

### Q2: Vercel 构建报错 `EHOSTUNREACH npm.dev.casstime.com`

**原因**：项目使用了公司内部 npm 源，Vercel 无法访问

**解决**：确保项目根目录有 `.npmrc` 文件，内容为：
```
registry=https://registry.npmjs.org/
```
不要使用 `pnpm-lock.yaml`（如果有的话删掉，让 Vercel 用 npm）。

---

### Q3: Vercel 构建报错 `npm error Exit handler never called!`

**原因**：Node.js 版本不兼容（Vercel 使用了 24.x）

**解决**：在 `package.json` 中锁定 Node 版本：
```json
"engines": {
  "node": "20.x",
  "npm": ">=9.0.0"
}
```

---

### Q4: Vercel 构建报错 `sessionStorage is not defined`

**原因**：在 Server Component 或 SSR 预渲染时使用了浏览器 API（sessionStorage、localStorage、window）

**解决**：访问浏览器 API 前加判断：
```javascript
if (typeof window !== 'undefined') {
  // 使用 sessionStorage / localStorage
}
```
或确保页面组件有 `'use client'` 指令。

---

### Q5: 页面显示 `Application error: a server-side exception has occurred`

**原因**：服务端渲染出错，通常是数据库连接失败或 API 调用问题

**排查步骤**：
1. 打开 Vercel Dashboard → Deployments → 最新部署 → **Runtime Logs**
2. 查看具体错误信息
3. 常见原因：
   - `DATABASE_URL` 未配置或错误
   - `ADMIN_USERNAME` / `ADMIN_PASSWORD_HASH` 未配置
   - 数据库表未创建（运行 `npx prisma db push`）

---

### Q6: 管理员登录提示「管理员未配置」

**原因**：Vercel 环境变量中缺少 `ADMIN_USERNAME` 或 `ADMIN_PASSWORD_HASH`

**解决**：参考 [第8节](#8-vercel-环境变量配置) 配置环境变量，然后 Redeploy

---

### Q7: 登录成功后创建墙报 401

**原因**：Token 验证逻辑不匹配（如代码修改了 token 生成方式但浏览器缓存了旧 token）

**解决**：在浏览器控制台执行：
```javascript
localStorage.removeItem('admin_token')
```
然后重新登录。

---

### Q8: 新建墙后首页看不到

**原因**：首页被 Vercel 静态缓存

**解决**：确保 `src/app/page.tsx` 中有：
```javascript
export const dynamic = 'force-dynamic'
```

---

### Q9: 数据库连接失败 `P1001: Can't reach database server`

**原因**：数据库连接字符串错误或数据库服务未启动

**排查**：
1. 检查 `.env` 中的 `DATABASE_URL` 是否正确
2. 在 Neon Dashboard 确认数据库状态为 Active
3. 尝试在本地连接：
```bash
npx prisma db pull
```

---

### Q10: 如何重置数据库

```bash
# 清空所有数据并重建表（⚠️ 会删除所有数据）
npx prisma db push --force-reset

# 查看数据库当前状态
npx prisma studio
```

---

### Q11: 如何修改域名

1. Vercel 项目 → **Settings** → **Domains**
2. 添加你的自定义域名（需要域名已备案或有 DNS 控制权）
3. 按提示配置 DNS 记录（通常是 CNAME 指向 `cname.vercel-dns.com`）

### Q12: 如何查看 Vercel 构建日志

1. Vercel Dashboard → 项目 → **Deployments**
2. 点击某次部署查看详情
3. **Build Logs**：构建过程的日志
4. **Runtime Logs**：运行时错误日志（函数调用报错）

---

## 附录：项目结构

```
blessing-wall-next/
├── .env                    # 环境变量（不提交到 git）
├── .env.example            # 环境变量示例
├── .npmrc                  # npm 源配置
├── package.json            # 项目配置和依赖
├── prisma/
│   └── schema.prisma       # 数据库模型定义
├── src/
│   ├── app/
│   │   ├── page.tsx        # 首页（墙列表）
│   │   ├── layout.tsx      # 全局布局
│   │   ├── globals.css     # 全局样式
│   │   ├── login/          # 管理员登录页
│   │   ├── admin/          # 管理面板
│   │   ├── w/[slug]/       # 墙详情页
│   │   └── api/            # API 接口
│   │       ├── admin/login/  # 登录接口
│   │       ├── walls/        # 墙 CRUD
│   │       ├── messages/     # 留言
│   │       └── likes/        # 点赞
│   └── lib/
│       ├── prisma.ts       # Prisma 客户端
│       └── auth.ts         # 管理员鉴权
└── public/                 # 静态资源
```
