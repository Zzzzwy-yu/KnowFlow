# KnowFlow

KnowFlow 是一个 AI 驱动的交互式学习助手。它可以把问题或学习材料整理成可探索的知识树，并通过知识图谱、节点详情和多轮问答帮助用户逐层理解复杂概念。

## 核心功能

- AI 问答：支持一句话、入门、专业和论文级四种回答深度。
- 知识树：从问答和导入材料中提取知识点、层级和横向关系。
- 知识图谱：支持树视图和图谱视图切换、缩放、拖拽、全屏、局部视图及关系筛选。
- 知识管理：编辑、删除、移动、合并、搜索和手动调整父节点，并检测循环引用。
- 材料导入：支持 Markdown、TXT 和直接粘贴文本；单次最多提取 60 个知识点、180 条横向关系。
- 数据导入导出：支持 KnowFlow JSON 备份恢复和 Markdown 导出。
- 操作历史：编辑、删除、移动、合并、导入和智能整理等操作支持撤销/重做，最多保留 30 次。
- 持久化：知识树状态自动保存到浏览器 `localStorage`。
- Demo 模式：未配置 API Key 时自动使用内置 mock 数据。

当前轻量版本暂不包含 PDF 解析和扫描件 OCR。

## 技术栈

### 前端

- React 18、TypeScript、Vite 6
- Tailwind CSS、Zustand、Lucide React
- Axios、Marked

### 后端

- Express、TypeScript、tsx、dotenv、cors
- OpenAI SDK，用于对接多个 AI 提供商

## 快速开始

### 环境要求

- Node.js 18 或更高版本
- npm 9 或更高版本

### 安装依赖

在项目根目录执行：

```bash
npm install
cd api
npm install
cd ..
```

### 仅启动前端（Demo 模式）

```bash
npm run dev
```

访问 <http://localhost:5173>。

### 启动前后端

先启动后端：

```bash
npm run server
```

后端默认运行在 <http://localhost:3001>。另开一个终端启动前端：

```bash
npm run dev
```

Vite 已配置 `/api` 代理，前端会将请求转发到 `http://localhost:3001`。

## AI 配置

复制环境变量模板并填写 API Key：

```bash
cd api
cp .env.example .env
```

Windows PowerShell 也可以使用：

```powershell
Copy-Item .env.example .env
```

`.env` 支持以下配置：

```env
AI_PROVIDER=openai
CORS_ORIGINS=http://localhost:5173

OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4o
DEEPSEEK_API_KEY=your_deepseek_api_key_here
DEEPSEEK_MODEL=deepseek-chat
ZHIPU_API_KEY=your_zhipu_api_key_here
ZHIPU_MODEL=glm-4
DASHSCOPE_API_KEY=your_dashscope_api_key_here
DASHSCOPE_MODEL=qwen2-7b-chat
```

支持 OpenAI、DeepSeek、智谱 AI 和阿里云 DashScope。后端会根据已配置的 Key 选择可用提供商；未配置任何 Key 时，前端使用 Demo 数据。

## 常用命令

```bash
npm run dev       # 启动前端开发服务器
npm run server    # 启动后端服务器
npm run build     # 类型检查并构建前端
npm run preview   # 预览前端构建产物
npm test          # 运行图结构测试
```

后端单独构建：

```bash
cd api
npm run build
```

## API

后端基础地址为 `http://localhost:3001/api`。

| 方法 | 路径 | 用途 |
| --- | --- | --- |
| GET | `/health` | 健康检查 |
| POST | `/chat` | 获取 AI 问答 |
| POST | `/explain` | 获取词语解释 |
| POST | `/knowledge/organize` | 智能整理知识树 |
| POST | `/knowledge/analyze-graph` | 分析知识图谱 |
| POST | `/knowledge/import-material` | 从材料导入知识树 |

后端默认启用 CORS、JSON 请求体大小限制（1 MB）和每个 IP 每分钟 60 次请求的限流。

## 项目结构

```text
.
├── api/                 # Express 后端与 LLM 服务
│   └── src/
│       ├── controllers/
│       ├── routes/
│       ├── services/
│       └── server.ts
├── src/                 # React 前端
│   ├── components/
│   ├── hooks/
│   ├── store/
│   ├── types/
│   └── utils/
├── tests/               # Node 原生测试
├── vite.config.ts
└── package.json
```

## 测试与构建

当前测试覆盖循环引用检测、父节点关系清洗和宽层级图谱布局。提交前建议运行：

```bash
npm test
npm run build
```

## 许可证

MIT License
