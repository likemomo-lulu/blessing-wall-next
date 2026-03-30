# BlessingWall

> 多墙祝福平台 - Next.js + Prisma + PlanetScale

## 技术栈

- **框架**: Next.js 14 (App Router)
- **数据库**: Prisma + PlanetScale (MySQL)
- **样式**: Tailwind CSS
- **部署**: Vercel

## 本地开发

```bash
# 安装依赖
npm install

# 配置环境变量
cp .env.example .env
# 编辑 .env 添加数据库连接

# 生成 Prisma Client
npx prisma generate

# 运行开发服务器
npm run dev
```

## 部署

### 1. PlanetScale 数据库

```bash
# 安装 CLI
brew install planetscale/tap/pscale

# 登录
pscale auth login

# 创建数据库
pscale database create blessing-wall --region aws-ap-southeast-1

# 获取连接字符串
pscale connect blessing-wall
```

### 2. Vercel 部署

```bash
# 安装 Vercel CLI
npm i -g vercel

# 部署
vercel --prod
```

### 3. 环境变量

在 Vercel Dashboard 配置：
- `DATABASE_URL` - PlanetScale 连接字符串
- `ADMIN_USERNAME` - 管理员用户名
- `ADMIN_PASSWORD_HASH` - SHA256 哈希后的密码

## 功能

- 多墙管理
- 匿名留言
- 点赞互动
- 管理员后台
