$content = @"
import OpenAI from 'openai';
import axios from 'axios';
import type { WordInfo, ExplainResponse } from '../types';

type Message = { role: 'system' | 'user' | 'assistant'; content: string };

interface LLMProvider {
  chat(messages: Message[]): Promise<string>;
  name: string;
}

class OpenAIProvider implements LLMProvider {
  name = 'OpenAI';
  private client: OpenAI;
  private model: string;

  constructor() {
    this.model = process.env.OPENAI_MODEL || 'gpt-4o';
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || '',
    });
  }

  async chat(messages: Message[]): Promise<string> {
    const completion = await this.client.chat.completions.create({
      model: this.model,
      messages,
      temperature: 0.7,
    });
    return completion.choices[0]?.message?.content || '';
  }
}

class DeepSeekProvider implements LLMProvider {
  name = 'DeepSeek';
  private apiKey: string;
  private model: string;

  constructor() {
    this.apiKey = process.env.DEEPSEEK_API_KEY || '';
    this.model = process.env.DEEPSEEK_MODEL || 'deepseek-chat';
  }

  async chat(messages: Message[]): Promise<string> {
    const response = await axios.post(
      'https://api.deepseek.com/v1/chat/completions',
      {
        model: this.model,
        messages,
        temperature: 0.7,
      },
      {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );
    return response.data.choices[0]?.message?.content || '';
  }
}

class ZhipuProvider implements LLMProvider {
  name = 'Zhipu';
  private apiKey: string;
  private model: string;

  constructor() {
    this.apiKey = process.env.ZHIPU_API_KEY || '';
    this.model = process.env.ZHIPU_MODEL || 'glm-4';
  }

  async chat(messages: Message[]): Promise<string> {
    const response = await axios.post(
      'https://open.bigmodel.cn/api/paas/v4/chat/completions',
      {
        model: this.model,
        messages,
        temperature: 0.7,
      },
      {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );
    return response.data.choices[0]?.message?.content || '';
  }
}

class DashScopeProvider implements LLMProvider {
  name = 'DashScope';
  private apiKey: string;
  private model: string;

  constructor() {
    this.apiKey = process.env.DASHSCOPE_API_KEY || '';
    this.model = process.env.DASHSCOPE_MODEL || 'qwen2-7b-chat';
  }

  async chat(messages: Message[]): Promise<string> {
    const response = await axios.post(
      'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation',
      {
        model: this.model,
        input: { messages },
        parameters: {
          temperature: 0.7,
        },
      },
      {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );
    return response.data.output?.text || '';
  }
}

const getProvider = (): LLMProvider | null => {
  const provider = process.env.AI_PROVIDER?.toLowerCase();

  if (!process.env.OPENAI_API_KEY && !process.env.DEEPSEEK_API_KEY && !process.env.ZHIPU_API_KEY && !process.env.DASHSCOPE_API_KEY) {
    return null;
  }

  switch (provider) {
    case 'deepseek':
      if (process.env.DEEPSEEK_API_KEY) {
        return new DeepSeekProvider();
      }
      break;
    case 'zhipu':
      if (process.env.ZHIPU_API_KEY) {
        return new ZhipuProvider();
      }
      break;
    case 'dashscope':
    case 'qwen':
      if (process.env.DASHSCOPE_API_KEY) {
        return new DashScopeProvider();
      }
      break;
    case 'openai':
    default:
      if (process.env.OPENAI_API_KEY) {
        return new OpenAIProvider();
      }
      break;
  }

  if (process.env.DEEPSEEK_API_KEY) return new DeepSeekProvider();
  if (process.env.ZHIPU_API_KEY) return new ZhipuProvider();
  if (process.env.DASHSCOPE_API_KEY) return new DashScopeProvider();
  if (process.env.OPENAI_API_KEY) return new OpenAIProvider();

  return null;
};

const generateSessionId = () => {
  return `session-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
};

const mockResponses: Record<string, { content: string; words: string[] }> = {
  '什么是机器学习？': {
    content: '机器学习是人工智能的一个分支，它让计算机能够从数据中学习并做出预测或决策，而无需被明确编程。简单来说，就像教小孩认猫一样——给它看很多猫的图片，它就能学会识别猫。这其中涉及到算法的使用，比如神经网络和监督学习等方法。',
    words: ['机器学习', '数据', '算法', '神经网络', '监督学习'],
  },
  '如何学习编程？': {
    content: '学习编程需要掌握编程语言（如Python、JavaScript）、数据结构和算法。建议从简单的变量和函数开始，然后逐步学习面向对象编程。最重要的是多练习，通过写代码来巩固知识。',
    words: ['编程语言', '数据结构', '算法', '变量', '函数', '面向对象编程', '代码'],
  },
  '解释量子计算': {
    content: '量子计算是一种利用量子力学原理进行计算的新型计算方式。与传统计算机使用比特不同，量子计算机使用量子比特，它可以同时处于多个状态。这使得量子计算机在解决某些特定问题（如大数分解）时比传统计算机快得多。',
    words: ['量子计算', '量子力学', '比特', '量子比特', '大数分解'],
  },
};

interface DetailedExplainResponse extends ExplainResponse {
  content: string;
  words: WordInfo[];
}

const mockExplain = (word: string): DetailedExplainResponse => {
  const explanations: Record<string, DetailedExplainResponse> = {
    '机器学习': {
      word: '机器学习',
      definition: '机器学习是人工智能的一个子领域，它使计算机系统能够从数据中自动学习和改进，而无需进行明确的编程。它使用算法来分析数据、学习模式，并基于这些模式做出预测或决策。',
      content: '机器学习是人工智能的一个子领域，它使计算机系统能够从数据中自动学习和改进，而无需进行明确的编程。它使用算法来分析数据、学习模式，并基于这些模式做出预测或决策。',
      words: [],
      examples: ['推荐系统使用机器学习来为用户推荐电影', '垃圾邮件过滤器通过机器学习识别垃圾邮件'],
      relatedTerms: ['人工智能', '深度学习', '神经网络'],
    },
    '数据': {
      word: '数据',
      definition: '数据是指对事实、概念或指令的可量化表示，可以是数字、文字、图像、声音等形式。在计算机科学中，数据是程序处理的基本单位。数据可以分为结构化数据和非结构化数据。',
      content: '数据是指对事实、概念或指令的可量化表示，可以是数字、文字、图像、声音等形式。在计算机科学中，数据是程序处理的基本单位。数据可以分为结构化数据和非结构化数据。',
      words: [],
      examples: ['温度传感器收集的温度数据', '用户在网站上的点击行为数据'],
      relatedTerms: ['大数据', '数据库', '数据分析'],
    },
    '算法': {
      word: '算法',
      definition: '算法是一系列用于解决特定问题或执行特定任务的精确指令或步骤。它是计算机程序的核心，描述了如何将输入转换为输出。算法的效率通常用时间复杂度和空间复杂度来衡量。',
      content: '算法是一系列用于解决特定问题或执行特定任务的精确指令或步骤。它是计算机程序的核心，描述了如何将输入转换为输出。算法的效率通常用时间复杂度和空间复杂度来衡量。',
      words: [],
      examples: ['排序算法用于将列表按顺序排列', '搜索算法用于在数据中查找特定项目'],
      relatedTerms: ['复杂度', '数据结构', '伪代码'],
    },
    '神经网络': {
      word: '神经网络',
      definition: '神经网络是一种模仿人脑神经元连接方式的计算模型。它由多层相互连接的节点组成，能够学习复杂的模式和关系。神经网络是深度学习的核心技术。',
      content: '神经网络是一种模仿人脑神经元连接方式的计算模型。它由多层相互连接的节点组成，能够学习复杂的模式和关系。神经网络是深度学习的核心技术。',
      words: [],
      examples: ['卷积神经网络用于图像识别', '循环神经网络用于自然语言处理'],
      relatedTerms: ['深度学习', '感知器', '反向传播'],
    },
    '监督学习': {
      word: '监督学习',
      definition: '监督学习是机器学习的一种类型，其中模型从带有标签的训练数据中学习。每个数据样本都有对应的正确输出，模型通过学习输入和输出之间的映射关系来进行预测。',
      content: '监督学习是机器学习的一种类型，其中模型从带有标签的训练数据中学习。每个数据样本都有对应的正确输出，模型通过学习输入和输出之间的映射关系来进行预测。',
      words: [],
      examples: ['分类任务：判断邮件是否为垃圾邮件', '回归任务：预测房屋价格'],
      relatedTerms: ['无监督学习', '半监督学习', '强化学习'],
    },
    '人工智能': {
      word: '人工智能',
      definition: '人工智能是计算机科学的一个分支，致力于创建能够模拟人类智能行为的机器。人工智能包括机器学习、自然语言处理和计算机视觉等领域。',
      content: '人工智能是计算机科学的一个分支，致力于创建能够模拟人类智能行为的机器。人工智能包括机器学习、自然语言处理和计算机视觉等领域。',
      words: [],
      examples: ['AI聊天机器人可以与人对话', '自动驾驶汽车使用AI感知周围环境'],
      relatedTerms: ['机器学习', '深度学习', '神经网络'],
    },
    '深度学习': {
      word: '深度学习',
      definition: '深度学习是机器学习的一个子领域，使用多层神经网络来学习数据的复杂表示。它在图像识别、语音识别和自然语言处理等任务中取得了突破性成果。',
      content: '深度学习是机器学习的一个子领域，使用多层神经网络来学习数据的复杂表示。它在图像识别、语音识别和自然语言处理等任务中取得了突破性成果。',
      words: [],
      examples: ['AlphaGo使用深度学习击败围棋世界冠军', '深度学习用于生成逼真的图像'],
      relatedTerms: ['神经网络', '机器学习', '卷积神经网络'],
    },
    '编程': {
      word: '编程',
      definition: '编程是指编写计算机程序的过程，即用特定的编程语言来告诉计算机要做什么。编程涉及算法设计、数据结构、逻辑思维和问题解决能力。',
      content: '编程是指编写计算机程序的过程，即用特定的编程语言来告诉计算机要做什么。编程涉及算法设计、数据结构、逻辑思维和问题解决能力。',
      words: [],
      examples: ['使用Python编写数据分析脚本', '使用JavaScript开发网页交互功能'],
      relatedTerms: ['软件开发', '计算机科学', '算法'],
    },
    'Python': {
      word: 'Python',
      definition: 'Python是一种高级、通用、解释型的编程语言，以其简洁的语法和丰富的库生态系统而闻名。它广泛用于数据分析、机器学习、Web开发和自动化脚本等领域。',
      content: 'Python是一种高级、通用、解释型的编程语言，以其简洁的语法和丰富的库生态系统而闻名。它广泛用于数据分析、机器学习、Web开发和自动化脚本等领域。',
      words: [],
      examples: ['NumPy和Pandas是Python中常用的数据处理库', 'TensorFlow和PyTorch是Python中常用的机器学习框架'],
      relatedTerms: ['编程', 'JavaScript', 'Java'],
    },
    'JavaScript': {
      word: 'JavaScript',
      definition: 'JavaScript是一种脚本编程语言，主要用于Web开发，为网页添加交互功能。它可以在浏览器中运行，也可以通过Node.js在服务器端运行。',
      content: 'JavaScript是一种脚本编程语言，主要用于Web开发，为网页添加交互功能。它可以在浏览器中运行，也可以通过Node.js在服务器端运行。',
      words: [],
      examples: ['使用JavaScript实现表单验证', '使用React和Vue等框架构建单页应用'],
      relatedTerms: ['编程', 'Python', 'TypeScript'],
    },
    '计算机科学': {
      word: '计算机科学',
      definition: '计算机科学是研究计算理论、算法设计、数据结构和程序设计的学科。它涵盖了从理论基础到实际应用的广泛领域。',
      content: '计算机科学是研究计算理论、算法设计、数据结构和程序设计的学科。它涵盖了从理论基础到实际应用的广泛领域。',
      words: [],
      examples: ['计算机科学研究如何高效地解决问题', '算法分析是计算机科学的核心内容'],
      relatedTerms: ['软件工程', '人工智能', '数据科学'],
    },
  };

  const base = explanations[word];
  if (!base) {
    return {
      word,
      definition: `${word}是一个需要了解的重要概念。它在相关领域中有着广泛的应用。`,
      content: `${word}是一个需要了解的重要概念。它在相关领域中有着广泛的应用。`,
      words: [],
      examples: [`这是${word}的一个示例。`, `另一个${word}的应用场景。`],
      relatedTerms: ['相关概念1', '相关概念2'],
    };
  }

  const { cleanedContent, words } = parseMarkedContent(base.content);
  return {
    ...base,
    content: cleanedContent,
    words,
  };
};

const parseMarkedContent = (content: string): { cleanedContent: string; words: WordInfo[] } => {
  const words: WordInfo[] = [];
  const markerRegex = /【([^】]+)】/g;
  let cleanedContent = '';
  let lastIndex = 0;
  let match;

  while ((match = markerRegex.exec(content)) !== null) {
    cleanedContent += content.slice(lastIndex, match.index);
    const word = match[1];
    words.push({
      word,
      start: cleanedContent.length,
      end: cleanedContent.length + word.length,
    });
    cleanedContent += word;
    lastIndex = match.index + match[0].length;
  }

  cleanedContent += content.slice(lastIndex);

  return { cleanedContent, words };
};

export const llmService = {
  async getChatResponse(message: string, sessionId?: string): Promise<{ content: string; words: WordInfo[]; sessionId: string; provider: string }> {
    const currentSessionId = sessionId || generateSessionId();
    const currentProvider = getProvider();
    const DEMO_MODE = !currentProvider;

    if (DEMO_MODE) {
      const lowerMessage = message.toLowerCase();
      let response = mockResponses[lowerMessage];

      if (!response) {
        const keys = Object.keys(mockResponses);
        const randomKey = keys[Math.floor(Math.random() * keys.length)];
        response = mockResponses[randomKey];
      }

      const { cleanedContent, words } = parseMarkedContent(response.content);

      return {
        content: cleanedContent,
        words,
        sessionId: currentSessionId,
        provider: 'DEMO',
      };
    }

    const systemPrompt = `你是一个耐心的"傻瓜教程"AI助手。请用通俗易懂的语言回答用户的问题。
    你的回答应该包含一些专业术语或概念，但要用简单的语言解释。
    在回答中，请使用【关键词】的格式标记出3-5个可能需要进一步解释的关键词语。
    请直接返回回答内容，不需要额外的JSON格式。
    示例：【机器学习】是人工智能的一个分支，它让计算机能够从【数据】中学习。`;

    try {
      const responseContent = await currentProvider!.chat([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message },
      ]);

      const { cleanedContent, words } = parseMarkedContent(responseContent);

      return {
        content: cleanedContent,
        words,
        sessionId: currentSessionId,
        provider: currentProvider!.name,
      };
    } catch (error) {
      console.error('LLM Error:', error);
      return {
        content: '抱歉，我暂时无法回答这个问题。请检查API Key配置是否正确。',
        words: [],
        sessionId: currentSessionId,
        provider: currentProvider!.name,
      };
    }
  },

  async getWordExplanation(word: string, context?: string): Promise<ExplainResponse & { content: string; words: WordInfo[]; provider: string }> {
    const currentProvider = getProvider();
    const DEMO_MODE = !currentProvider;

    if (DEMO_MODE) {
      const result = mockExplain(word);
      return { ...result, provider: 'DEMO' };
    }

    const systemPrompt = `你是一个专业的词语解释助手。请用通俗易懂的语言解释以下词语。
    在解释中，请使用【关键词】的格式标记出3-5个可能需要进一步解释的关键词语。
    返回JSON格式：
    {
      "definition": "词语的定义和解释（包含【关键词】标记）",
      "content": "与definition相同的内容",
      "examples": ["示例句子1", "示例句子2"],
      "relatedTerms": ["相关术语1", "相关术语2"]
    }`;

    try {
      const responseContent = await currentProvider!.chat([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `请解释词语：${word}${context ? `，上下文：${context}` : ''}` },
      ]);

      let parsedResponse;

      try {
        parsedResponse = JSON.parse(responseContent);
      } catch {
        parsedResponse = {
          definition: responseContent,
          content: responseContent,
          examples: [],
          relatedTerms: [],
        };
      }

      const { cleanedContent, words } = parseMarkedContent(parsedResponse.content || parsedResponse.definition || responseContent);

      return {
        word,
        definition: parsedResponse.definition || responseContent,
        content: cleanedContent,
        words,
        examples: parsedResponse.examples || [],
        relatedTerms: parsedResponse.relatedTerms || [],
        provider: currentProvider!.name,
      };
    } catch (error) {
      console.error('LLM Error:', error);
      return {
        word,
        definition: `抱歉，无法获取"${word}"的解释。请检查API Key配置是否正确。`,
        content: `抱歉，无法获取"${word}"的解释。请检查API Key配置是否正确。`,
        words: [],
        examples: [],
        relatedTerms: [],
        provider: currentProvider!.name,
      };
    }
  },
};
"@
$content | Set-Content -Path "api/src/services/llmService.ts" -Encoding UTF8