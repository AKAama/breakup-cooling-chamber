# 分手冷静室

> 深夜想发的消息，先放这里。AI 军师陪你冷静 3 分钟，想清楚再决定发不发。

TRAE AI 创造力大赛参赛作品 · 生活娱乐赛道。

## 产品简介

"分手冷静室"是一个情绪拦截工具。当用户在分手/吵架后深夜冲动想发消息时，AI 军师会：

1. **情绪检测** — 分析消息的情绪强度（1-10 分），高分触发预警
2. **三个反思** — 步进式问题引导用户看清意图、后果、替代方案
3. **军师建议** — 流式输出有温度的分析，不替你做决定
4. **最终决定** — 不发了 / 改改再发 / 还是想发 / 再想想

整个冷静过程以**时间轴旅程**形式呈现，5 个站点逐步推进，有仪式感而非冷冰冰的对话。

## 技术栈

| 层 | 技术 |
|---|---|
| 前端 | React 19 + TypeScript + Vite + Ant Design + Zustand |
| 后端 | Go + Gin + PostgreSQL + Zap |
| AI | DeepSeek API（结构化 JSON + 流式文本双模式） |
| Markdown | react-markdown + remark-gfm |

## 项目结构

```
breakup-cooling-chamber/
├── backend/
│   ├── cmd/server/          # 入口
│   ├── internal/
│   │   ├── config/          # 配置
│   │   ├── core/            # 日志
│   │   ├── handler/         # HTTP handler
│   │   ├── model/           # 数据模型
│   │   ├── repository/      # 数据库操作
│   │   └── service/         # 业务逻辑
│   ├── migrations/          # SQL 迁移
│   └── pkg/deepseek/        # DeepSeek API 客户端
├── frontend/
│   └── src/
│       ├── core/            # API、路由、状态管理
│       ├── features/        # 页面组件
│       │   ├── home/        # 首页（暖色主题落地页）
│       │   ├── intercept/   # 拦截页（时间轴旅程）
│       │   ├── decide/      # 决策辅助
│       │   ├── history/     # 历史记录
│       │   ├── insight/     # 盲区分析
│       │   ├── journal/     # 情绪日记
│       │   └── report/      # 7天报告
│       ├── shared/          # 公共组件
│       └── types/           # 类型定义
├── DEV_DOC.md               # 开发文档
└── README.md
```

## 快速开始

### 前置要求

- Go 1.21+
- Node.js 18+
- PostgreSQL 14+
- DeepSeek API Key

### 后端

```bash
cd backend

# 配置环境变量
cp .env.example .env
# 编辑 .env 填入 DEEPSEEK_KEY 和数据库信息

# 初始化数据库
psql -U postgres -f migrations/001_init.sql

# 启动
go run cmd/server/main.go
```

服务运行在 `http://localhost:8080`

### 前端

```bash
cd frontend
npm install
npm run dev
```

前端运行在 `http://localhost:5173`

## 环境变量

| 变量 | 说明 | 默认值 |
|---|---|---|
| PORT | 后端端口 | 8080 |
| DB_HOST | 数据库地址 | localhost |
| DB_PORT | 数据库端口 | 5432 |
| DB_USER | 数据库用户 | postgres |
| DB_PASSWORD | 数据库密码 | postgres |
| DB_NAME | 数据库名 | cooling_chamber |
| DEEPSEEK_KEY | DeepSeek API 密钥 | - |
| ALLOWED_ORIGINS | CORS 白名单 | http://localhost:5173 |

## API 接口

| 方法 | 路径 | 说明 |
|---|---|---|
| POST | /api/intercept/chat | 流式军师分析（SSE） |
| POST | /api/intercept/answer | 流式继续对话（SSE） |
| GET | /api/records | 历史记录 |
| POST | /api/journal | 写日记 |
| GET | /api/journals | 日记列表 |
| GET | /api/insight | 盲区分析 |
| GET | /api/report | 7 天报告 |
| POST | /api/decide | 决策辅助 |

## License

MIT
