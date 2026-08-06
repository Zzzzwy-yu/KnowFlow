# KnowFlow

AI 驱动的交互式学习助手，帮助用户通过逐层深入的方式理解复杂概念。

## 🌟 核心功能

### 智能知识结构

- 新问题生成回答后，由 AI 根据概念的包含、前置、细化、实例、比较和关联关系选择合理父节点，而不是简单按提问时间挂载
- 每个节点保存关系类型、归类理由和语义标签；模型不可用时使用本地关键词相似度降级
- 左侧知识树的闪光按钮可以重新分析并重组整棵树，重组过程会检测并阻止循环引用
- 支持多个独立根主题；无法确认上位概念时不会强行归类
- 支持树视图与知识图谱视图切换，图谱额外展示前置、依赖、实例、比较和关联等横向关系
- 整棵图谱使用单次批量分析，先显示变更预览，确认后才应用，并支持撤销
- 撤销智能整理后支持重做，避免误操作导致整理结果丢失
- 自动检测疑似重复知识点，可由用户确认后合并
- 图谱落盘前会再次校验节点 ID、关系类型和循环依赖，避免异常模型输出破坏数据
- 图谱页面内置使用指南，解释颜色、实线、虚线、箭头方向和置信度线宽

### 知识管理

- 支持按标题、正文和标签搜索节点
- 支持编辑和删除节点，删除父节点时会同时删除其子树并要求确认
- 支持将完整知识树导出为 JSON，以及从 KnowFlow JSON 备份恢复
- 支持导出适合笔记软件和文档系统使用的 Markdown
- 支持手动调整节点的上位知识点，并阻止形成循环引用
- 节点会显示实际模型来源；后端不可用而降级到本地 Mock 时会明确标注“离线内容”
- AI 请求支持超时、取消和有限重试；生成期间仍可继续浏览当前节点
- 手机和平板使用抽屉式知识树、紧凑头部和安全区输入框，桌面端保持固定双栏布局

### 测试

```bash
npm test
```

当前自动化测试覆盖知识树循环检测和父节点关系清洗；生产构建仍可使用 `npm run build` 验证。
- Markdown 使用受控 React 节点渲染，不直接注入模型生成的 HTML

- **智能问答**：输入问题即可获得 AI 生成的详细解答，关键词以橙色高亮显示
- **点击探索**：回答中的关键词可点击，一键深入了解相关概念，自动创建知识树节点
- **知识树导航**：左侧树形导航展示知识层级结构，支持无限层级嵌套和展开/折叠
- **详情面板**：右侧面板展示选中节点的完整内容，支持 Markdown 渲染
- **迷你讲解窗口**：弹出式词语解释，包含定义、示例和相关术语
- **多模型支持**：支持 OpenAI、DeepSeek、智谱AI、阿里云通义千问等多种 AI 提供商
- **数据持久化**：知识树状态自动保存到 localStorage，刷新页面不丢失

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

支持的 AI 提供商及配置项：

| 提供商 | 环境变量 | 默认模型 |
|--------|----------|----------|
| OpenAI | `AI_PROVIDER=openai` | `gpt-4o` |
| DeepSeek | `AI_PROVIDER=deepseek` | `deepseek-chat` |
| 智谱AI | `AI_PROVIDER=zhipu` | `glm-4` |
| 阿里云通义千问 | `AI_PROVIDER=dashscope` | `qwen2-7b-chat` |

> **注意**：如果未配置任何 API Key，系统会自动进入 DEMO 模式，使用预设的 mock 数据。

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
│   │   │   └── llmController.ts
│   │   ├── routes/         # 路由
│   │   │   └── index.ts
│   │   ├── services/       # 业务逻辑（LLM服务）
│   │   │   └── llmService.ts
│   │   ├── types/          # 类型定义
│   │   │   └── index.ts
│   │   └── server.ts       # 服务器入口
│   ├── .env                # 环境变量
│   ├── .env.example        # 环境变量模板
│   ├── package.json        # 后端依赖
│   └── tsconfig.json       # TypeScript 配置
├── src/                    # 前端代码
│   ├── components/         # UI 组件
│   │   ├── ChatInput.tsx   # 聊天输入框
│   │   ├── ChatResponse.tsx # AI回答展示
│   │   ├── DetailPanel.tsx # 详情面板
│   │   ├── MiniExplanation.tsx # 迷你讲解窗口
│   │   ├── TreeNavigator.tsx # 知识树导航
│   │   ├── UserMessage.tsx # 用户消息组件
│   │   └── WordButton.tsx  # 可点击词语按钮
│   ├── hooks/
│   │   └── useChat.ts      # 聊天逻辑 Hook
│   ├── store/
│   │   └── chatStore.ts    # Zustand 状态管理（三个 store）
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
├── tailwind.config.js      # TailwindCSS 配置
└── tsconfig.json           # TypeScript 配置
```

## 📖 使用说明

1. **输入问题**：在底部输入框中输入您想了解的问题，按回车键或点击发送按钮
2. **查看回答**：AI 会生成详细的解答，关键词会以橙色高亮显示
3. **深入探索**：点击橙色关键词，会在知识树中创建新的解释节点，并在详情面板中显示
4. **导航知识树**：点击左侧导航树的节点可以切换查看不同层级的内容
5. **展开/折叠**：点击节点前的箭头可以展开或折叠子节点
6. **迷你讲解**：点击词语旁的问号图标，弹出迷你窗口查看词语解释

## 🎨 设计特色

- **主色调**：温暖的橙色 (#FF6B35) 搭配深蓝色 (#1E3A5F)
- **布局**：双栏布局，左侧知识树导航，右侧内容详情
- **响应式**：桌面端优先设计

## 📝 状态管理

项目使用 Zustand 进行状态管理，包含三个 store：

1. **`useTreeStore`**：知识树状态，通过 `persist` middleware 持久化到 localStorage（存储键名：`foolproof-tutorial-tree`）
2. **`useChatStore`**：聊天消息状态
3. **`useMiniWindowStore`**：迷你讲解窗口状态

## 🔌 API 端点

### POST /api/chat

获取 AI 回答

**请求体**：
```json
{
  "message": "用户问题",
  "sessionId": "可选的会话ID",
  "context": "可选的上下文信息"
}
```

**响应体**：
```json
{
  "content": "AI回答内容",
  "words": [
    { "word": "关键词", "start": 0, "end": 4 }
  ],
  "sessionId": "会话ID",
  "provider": "AI提供商名称"
}
```

### POST /api/explain

获取词语解释

**请求体**：
```json
{
  "word": "要解释的词语",
  "context": "可选的上下文信息"
}
```

**响应体**：
```json
{
  "word": "词语",
  "definition": "词语定义",
  "content": "解释内容",
  "words": [],
  "examples": ["示例1", "示例2"],
  "relatedTerms": ["相关术语1", "相关术语2"],
  "provider": "AI提供商名称"
}
```

## ⚠️ 注意事项

- 如果未配置 API Key，系统会自动进入 DEMO 模式，使用预设的 mock 数据
- 后端服务默认运行在 http://localhost:3001
- 前端默认运行在 http://localhost:5173
- 知识树数据会自动保存到浏览器 localStorage，清除浏览器数据会导致知识树丢失

## 📄 许可证

MIT License
