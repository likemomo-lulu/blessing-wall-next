# BlessingWall 部署指南（Vercel Postgres 版）

## 方案：Vercel + Vercel Postgres

比 PlanetScale 更简单，无需 CLI，直接在 Vercel Dashboard 操作。

## 步骤

### 1. 推送代码到 GitHub
已推送至：https://github.com/likemomo-lulu/blessing-wall-next

### 2. Vercel 导入项目

1. 访问 https://vercel.com
2. 点击 "Add New Project"
3. 导入 GitHub 仓库 `blessing-wall-next`
4. 配置 Framework Preset：Next.js

### 3. 创建 Vercel Postgres 数据库

1. 在 Vercel Dashboard，点击 "Storage"
2. 点击 "Create Database"
3. 选择 "Vercel Postgres"
4. 选择区域（建议 Singapore 或 Tokyo，离中国近）
5. 创建后，点击 "Connect" 关联到项目

### 4. 配置环境变量

Vercel 会自动添加 Postgres 环境变量：
- `POSTGRES_URL`
- `POSTGRES_PRISMA_URL`

额外添加：
- `ADMIN_USERNAME` = admin
- `ADMIN_PASSWORD_HASH` = 5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8
  （这是 "password" 的 SHA256 哈希）

### 5. 修改数据库配置

由于 Vercel Postgres 是 PostgreSQL，需要修改 `prisma/schema.prisma`：

```prisma
datasource db {
  provider = "postgresql"  // 改为 postgresql
  url      = env("POSTGRES_PRISMA_URL")
}
```

### 6. 部署

点击 "Deploy"

### 7. 初始化数据库

在 Vercel Dashboard → Functions → 找到项目 → Console，运行：

```bash
npx prisma db push
```

或在本地：
```bash
vercel env pull .env
npx prisma db push
```

## 完成！

访问 Vercel 提供的域名即可使用。
