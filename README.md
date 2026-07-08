# KnowFlow

AI 驱动的交互式学习助手，帮助用户通过逐层深入的方式理解复杂概念。

## 🌟 核心功能

- **智能问答**：输入问题即可获得 AI 生成的详细解答
- **点击探索**：回答中的关键词可点击，一键深入了解相关概念
- **知识树导航**：左侧树形导航展示知识层级结构，支持无限层级嵌套
- **详情面板**：右侧面板展示选中节点的完整内容，支持 Markdown 渲染
- **多模型支持**：支持 OpenAI、DeepSeek、智谱AI、阿里云通义千问等多种 AI 提供商

## 🛠️ 技术栈

### 前端
- React 18 + TypeScript
- Vite 5
- TailwindCSS 3
- Zustand（状态管理，含 localStorage 持久化）
- Lucide React（图标库）
- Axios（HTTP 请求）
- Marked（Markdown 渲染）

### 后端
- Express + TypeScript
- tsx（开发时运行）
- dotenv（环境变量）
- cors（跨域支持）

## 🚀 快速开始

### 前置要求
- Node.js >= 18
- npm >= 9

### 安装依赖

```bash
# 安装前端依赖
npm install

# 安装后端依赖
cd api
npm install
cd ..
```

### 开发模式

**方式一：仅前端（DEMO模式，使用 mock 数据）**

```bash
npm run dev
```

访问 http://localhost:5173

**方式二：前端 + 后端（使用真实 AI 模型）**

启动后端服务：
```bash
npm run server
```

启动前端：
```bash
npm run dev
```

### 配置 AI 模型

在 `api` 目录下创建 `.env` 文件：

```bash
cd api
cp .env.example .env
```

编辑 `.env` 文件，配置 AI 提供商和 API Key：

```env
AI_PROVIDER=openai

OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4o
```

支持的 AI 提供商：
- `openai` - OpenAI
- `deepseek` - DeepSeek
- `zhipu` - 智谱AI
- `dashscope` - 阿里云通义千问

### 构建

```bash
# 前端构建
npm run build

# 后端构建
cd api
npm run build
```

## 📁 项目结构

```
.
├── api/                    # 后端服务
│   ├── src/
│   │   ├── controllers/    # 控制器
│   │   ├── routes/         # 路由
│   │   ├── services/       # 业务逻辑（LLM服务）
│   │   ├── types/          # 类型定义
│   │   └── server.ts       # 服务器入口
│   ├── .env                # 环境变量
│   └── .env.example        # 环境变量模板
├── src/                    # 前端代码
│   ├── components/         # UI 组件
│   │   ├── ChatInput.tsx   # 输入框组件
│   │   ├── ChatResponse.tsx # 聊天响应组件
│   │   ├── DetailPanel.tsx # 详情面板
│   │   ├── TreeNavigator.tsx # 知识树导航
│   │   ├── UserMessage.tsx # 用户消息组件
│   │   └── WordButton.tsx  # 可点击词语按钮
│   ├── hooks/
│   │   └── useChat.ts      # 聊天逻辑 Hook
│   ├── store/
│   │   └── chatStore.ts    # Zustand 状态管理
│   ├── types/
│   │   └── index.ts        # TypeScript 类型定义
│   ├── utils/
│   │   └── apiClient.ts    # API 客户端（含 mock 数据）
│   ├── App.tsx             # 主应用组件
│   ├── main.tsx            # 应用入口
│   └── index.css           # 全局样式
├── index.html              # HTML 模板
├── package.json            # 前端依赖
├── vite.config.ts          # Vite 配置
└── tailwind.config.js      # TailwindCSS 配置
```

## 📖 使用说明

1. **输入问题**：在底部输入框中输入您想了解的问题，按回车键或点击发送按钮
2. **查看回答**：AI 会生成详细的解答，关键词会以橙色高亮显示
3. **深入探索**：点击橙色关键词，会在知识树中创建新的解释节点
4. **导航知识树**：点击左侧导航树的节点可以切换查看不同层级的内容
5. **展开/折叠**：点击节点前的箭头可以展开或折叠子节点

## 🎨 设计特色

- **主色调**：温暖的橙色 (#FF6B35) 搭配深蓝色 (#1E3A5F)
- **布局**：双栏布局，左侧知识树导航，右侧内容详情
- **响应式**：支持桌面端优先设计

## 📝 状态管理

知识树状态（`useTreeStore`）通过 Zustand 的 `persist` middleware 持久化到 localStorage（存储键名：`foolproof-tutorial-tree`），刷新页面后数据不会丢失。

## ⚠️ 注意事项

- 如果未配置 API Key，系统会自动进入 DEMO 模式，使用预设的 mock 数据
- 后端服务默认运行在 http://localhost:3001
- 前端默认运行在 http://localhost:5173

## 📄 许可证

MIT License