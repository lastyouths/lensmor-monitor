# OneKunDay · 历史快照时光机

Reddit 评论历史快照浏览工具。

## 技术栈与基础设施

- **前端框架**：Next.js 15 (App Router) + TypeScript + Tailwind CSS v4
- **网页内容提取**：[Jina AI](https://jina.ai/)
- **站点部署**：[Vercel](https://vercel.com/)
- **代码托管**：[GitHub](https://github.com/)
- **数据源/网页快照**：[Wayback Machine](https://web.archive.org/)
- **数据库/后端服务**：[Supabase](https://supabase.com/)
- **Reddit 社媒数据抓取**：[Thordata](https://www.thordata.com/)

## 开发

```bash
npm install
cp .env.example .env.local   # 填入相关 API 凭证
npm run dev                  # http://localhost:3001
```

## 脚本

| 命令 | 说明 |
| --- | --- |
| `npm run dev` | 本地开发 |
| `npm run build` | 生产构建 |
| `npm run lint` | ESLint 检查 |
| `npm run typecheck` | TypeScript 类型检查 |
