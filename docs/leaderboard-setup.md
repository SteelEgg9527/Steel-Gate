# 公共排行榜接入步骤

项目：`gvvhyosjwasyeuqrlmmy`

## 1. 建表

打开 Supabase Dashboard → SQL Editor → New query，粘贴并运行：

```text
sql/leaderboard.sql
```

运行成功后会得到 `public.steel_runs` 表。

## 2. 取密钥

Supabase Dashboard → Project Settings → API：

- Project URL
- anon public key
- service_role key

`service_role` 只能放在服务端环境变量中，不能写进 `js/`、HTML 或提交到 GitHub。

## 3. 本地环境变量

在项目根目录创建 `.env.local`：

```text
SUPABASE_URL=https://gvvhyosjwasyeuqrlmmy.supabase.co
SUPABASE_SERVICE_ROLE_KEY=你的 service_role key
LEADERBOARD_SALT=换成一串随机字符
```

`.env.local` 已在 `.gitignore` 中，不会提交。

## 4. Vercel 环境变量

Vercel → 项目 → Settings → Environment Variables，添加：

```text
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
LEADERBOARD_SALT
```

然后重新部署。

## 5. 后续代码

服务端接口：

- `POST /api/submit`
- `GET /api/leaderboard?mode=...&difficulty=...`
- `GET /api/profile?playerId=...`

前端结算页和排行榜弹窗接入这些接口。
