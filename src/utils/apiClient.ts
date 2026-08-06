import axios from 'axios';
import type { ChatResponse, ExplainResponse, ChatMessage, WordInfo, KnowledgePlacement, TreeNode, GraphProposal } from '@/types';

const api = axios.create({
  baseURL: '/api',
  timeout: 60000,
});

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

const mockChatData: Record<string, Omit<ChatResponse, 'words'>> = {
  '什么是机器学习': {
    id: 'mock-chat-1',
    sessionId: 'mock-session-1',
    content: '【机器学习】是人工智能的一个分支，它让计算机能够从【数据】中学习并做出预测或决策，而无需被明确编程。简单来说，就像教小孩认猫一样——给它看很多猫的图片，它就能学会识别猫。这其中涉及到【算法】的使用，比如【神经网络】和【监督学习】等方法。',
    definition: '机器学习是人工智能的一个子领域，它使计算机系统能够从数据中自动学习和改进，而无需进行明确的编程。',
    examples: ['推荐系统使用机器学习来为用户推荐电影', '垃圾邮件过滤器通过机器学习识别垃圾邮件'],
    relatedTerms: ['人工智能', '深度学习', '神经网络'],
  },
  '什么是人工智能': {
    id: 'mock-chat-2',
    sessionId: 'mock-session-2',
    content: '【人工智能】是计算机科学的一个领域，旨在创建能够模拟人类智能行为的系统。它包括【机器学习】、【深度学习】、【自然语言处理】和【计算机视觉】等多个子领域。人工智能的目标是让机器能够【感知】、【推理】、【学习】和【决策】。',
    definition: '人工智能是计算机科学的一个领域，旨在创建能够模拟人类智能行为的系统。',
    examples: ['聊天机器人是人工智能的应用', '自动驾驶汽车使用人工智能技术'],
    relatedTerms: ['机器学习', '深度学习', '机器人'],
  },
  '什么是编程': {
    id: 'mock-chat-3',
    sessionId: 'mock-session-3',
    content: '【编程】是指编写【计算机程序】的过程，即用特定的【编程语言】来告诉计算机要做什么。编程涉及【算法设计】、【数据结构】、【逻辑思维】和【问题解决】能力。常见的编程语言包括【Python】、【JavaScript】、【Java】和【C++】等。',
    definition: '编程是指编写计算机程序的过程，即用特定的编程语言来告诉计算机要做什么。',
    examples: ['使用Python编写数据分析脚本', '使用JavaScript开发网页交互功能'],
    relatedTerms: ['软件开发', '计算机科学', '算法'],
  },
};

const mockExplainData: Record<string, Omit<ExplainResponse, 'words'>> = {
  '机器学习': {
    word: '机器学习',
    definition: '机器学习是人工智能的一个子领域，它使计算机系统能够从数据中自动学习和改进，而无需进行明确的编程。',
    content: '【机器学习】是人工智能的一个子领域，它使计算机系统能够从【数据】中自动学习和改进，而无需进行明确的编程。它使用【算法】来分析数据、学习模式，并基于这些模式做出预测或决策。',
    examples: ['推荐系统使用机器学习来为用户推荐电影', '垃圾邮件过滤器通过机器学习识别垃圾邮件'],
    relatedTerms: ['人工智能', '深度学习', '神经网络'],
  },
  '数据': {
    word: '数据',
    definition: '数据是指对事实、概念或指令的可量化表示，可以是数字、文字、图像、声音等形式。',
    content: '【数据】是指对事实、概念或指令的可量化表示，可以是数字、文字、图像、声音等形式。在【计算机科学】中，数据是程序处理的基本单位。数据可以分为【结构化数据】和【非结构化数据】。',
    examples: ['用户的购买记录是数据', '传感器采集的温度值是数据'],
    relatedTerms: ['信息', '数据库', '大数据'],
  },
  '算法': {
    word: '算法',
    definition: '算法是一组明确的、有限的步骤，用于解决特定问题或执行特定任务。',
    content: '【算法】是一组明确的、有限的步骤，用于解决特定问题或执行特定任务。在【计算机科学】中，算法是程序的核心，决定了程序的【效率】和【正确性】。常见的算法包括【排序算法】、【搜索算法】和【图算法】等。',
    examples: ['快速排序是一种高效的排序算法', '二分查找是一种快速的搜索算法'],
    relatedTerms: ['数据结构', '复杂度分析', '编程'],
  },
  '神经网络': {
    word: '神经网络',
    definition: '神经网络是一种模仿人脑神经元连接方式的计算模型，由大量相互连接的节点组成。',
    content: '【神经网络】是一种模仿人脑神经元连接方式的计算模型，由大量相互连接的【节点】组成。它通过【训练】过程调整连接【权重】，从而学习从输入到输出的映射关系。【深度学习】就是基于深层神经网络的机器学习方法。',
    examples: ['卷积神经网络用于图像识别', '循环神经网络用于自然语言处理'],
    relatedTerms: ['深度学习', '人工智能', '机器学习'],
  },
  '监督学习': {
    word: '监督学习',
    definition: '监督学习是一种机器学习方法，使用带有标签的数据来训练模型，使其能够预测新数据的标签。',
    content: '【监督学习】是一种机器学习方法，使用带有【标签】的数据来训练模型，使其能够预测新数据的标签。它分为【分类】和【回归】两种主要类型。【分类】用于预测离散的类别，【回归】用于预测连续的数值。',
    examples: ['使用监督学习识别图片中的猫和狗', '使用监督学习预测房价'],
    relatedTerms: ['机器学习', '无监督学习', '半监督学习'],
  },
  '人工智能': {
    word: '人工智能',
    definition: '人工智能是计算机科学的一个领域，旨在创建能够模拟人类智能行为的系统。',
    content: '【人工智能】是计算机科学的一个领域，旨在创建能够模拟人类智能行为的系统。它包括【机器学习】、【深度学习】、【自然语言处理】和【计算机视觉】等多个子领域。人工智能的目标是让机器能够【感知】、【推理】、【学习】和【决策】。',
    examples: ['聊天机器人是人工智能的应用', '自动驾驶汽车使用人工智能技术'],
    relatedTerms: ['机器学习', '深度学习', '机器人'],
  },
  '深度学习': {
    word: '深度学习',
    definition: '深度学习是一种基于多层神经网络的机器学习方法，能够自动学习数据的分层特征表示。',
    content: '【深度学习】是一种基于多层【神经网络】的机器学习方法，能够自动学习数据的分层【特征】表示。它在【图像识别】、【语音识别】和【自然语言处理】等领域取得了突破性进展。深度学习需要大量的【数据】和强大的【计算资源】来训练模型。',
    examples: ['AlphaGo使用深度学习击败围棋世界冠军', 'GPT是基于深度学习的大型语言模型'],
    relatedTerms: ['机器学习', '神经网络', '人工智能'],
  },
  '自然语言处理': {
    word: '自然语言处理',
    definition: '自然语言处理是人工智能的一个子领域，旨在使计算机能够理解、分析和生成人类语言。',
    content: '【自然语言处理】是人工智能的一个子领域，旨在使计算机能够理解、分析和生成人类【语言】。它包括【文本分类】、【情感分析】、【机器翻译】和【问答系统】等任务。【深度学习】的发展极大推动了自然语言处理的进步。',
    examples: ['智能助手如Siri使用自然语言处理', 'Google翻译是机器翻译的应用'],
    relatedTerms: ['人工智能', '机器学习', '深度学习'],
  },
  '计算机视觉': {
    word: '计算机视觉',
    definition: '计算机视觉是人工智能的一个子领域，旨在使计算机能够理解和解释图像和视频内容。',
    content: '【计算机视觉】是人工智能的一个子领域，旨在使计算机能够理解和解释【图像】和【视频】内容。它包括【图像识别】、【目标检测】、【图像分割】和【图像生成】等任务。【卷积神经网络】是计算机视觉中最常用的模型架构。',
    examples: ['人脸识别系统使用计算机视觉', '自动驾驶汽车需要计算机视觉来感知环境'],
    relatedTerms: ['人工智能', '机器学习', '深度学习'],
  },
  '编程': {
    word: '编程',
    definition: '编程是指编写计算机程序的过程，即用特定的编程语言来告诉计算机要做什么。',
    content: '【编程】是指编写【计算机程序】的过程，即用特定的【编程语言】来告诉计算机要做什么。编程涉及【算法设计】、【数据结构】、【逻辑思维】和【问题解决】能力。常见的编程语言包括【Python】、【JavaScript】、【Java】和【C++】等。',
    examples: ['使用Python编写数据分析脚本', '使用JavaScript开发网页交互功能'],
    relatedTerms: ['软件开发', '计算机科学', '算法'],
  },
  'Python': {
    word: 'Python',
    definition: 'Python是一种高级、通用、解释型的编程语言，以其简洁的语法和丰富的库生态系统而闻名。',
    content: '【Python】是一种高级、通用、解释型的【编程语言】，以其简洁的语法和丰富的【库】生态系统而闻名。它广泛用于【数据分析】、【机器学习】、【Web开发】和【自动化脚本】等领域。Python的设计哲学强调【代码可读性】和【开发效率】。',
    examples: ['NumPy和Pandas是Python中常用的数据处理库', 'TensorFlow和PyTorch是Python中常用的机器学习框架'],
    relatedTerms: ['编程', 'JavaScript', 'Java'],
  },
  'JavaScript': {
    word: 'JavaScript',
    definition: 'JavaScript是一种脚本编程语言，主要用于Web开发，为网页添加交互功能。',
    content: '【JavaScript】是一种脚本【编程语言】，主要用于【Web开发】，为网页添加交互功能。它可以在浏览器中运行，也可以通过【Node.js】在服务器端运行。JavaScript是【前端开发】的核心语言，配合【HTML】和【CSS】构建现代化网页应用。',
    examples: ['使用JavaScript实现表单验证', '使用React和Vue等框架构建单页应用'],
    relatedTerms: ['编程', 'Python', 'TypeScript'],
  },
  '计算机科学': {
    word: '计算机科学',
    definition: '计算机科学是研究计算机系统、软件和计算理论的学科，包括算法、数据结构、人工智能等多个领域。',
    content: '【计算机科学】是研究计算机系统、【软件】和计算【理论】的学科，包括【算法】、【数据结构】、【人工智能】等多个领域。它涵盖了【计算机体系结构】、【操作系统】、【编程语言】和【数据库】等核心内容。计算机科学的目标是理解和设计高效的计算系统。',
    examples: ['计算机科学专业学习编程、算法和数据结构', '计算机科学研究推动了互联网和人工智能的发展'],
    relatedTerms: ['编程', '软件工程', '信息技术'],
  },
  '结构化数据': {
    word: '结构化数据',
    definition: '结构化数据是指具有固定格式和组织的数据，可以方便地存储在数据库表中，如表格数据。',
    content: '【结构化数据】是指具有固定【格式】和组织的数据，可以方便地存储在【数据库】表中，如表格数据。它通常以【行】和【列】的形式组织，每个字段都有明确的【数据类型】。结构化数据便于进行【查询】、【分析】和【处理】。',
    examples: ['Excel表格中的数据是结构化数据', '关系型数据库中的表是结构化数据'],
    relatedTerms: ['数据', '非结构化数据', '数据库'],
  },
  '非结构化数据': {
    word: '非结构化数据',
    definition: '非结构化数据是指没有固定格式或组织的数据，如文本、图像、音频和视频等。',
    content: '【非结构化数据】是指没有固定【格式】或组织的数据，如【文本】、【图像】、【音频】和【视频】等。它占数据总量的大部分，处理起来更加复杂。【机器学习】和【深度学习】技术在非结构化数据的【分析】和【理解】方面取得了显著进展。',
    examples: ['社交媒体帖子是非结构化数据', '照片和视频是非结构化数据'],
    relatedTerms: ['数据', '结构化数据', '大数据'],
  },
};

function getMockChatResponse(message: string, context?: string): ChatResponse {
  const lowerMessage = message.toLowerCase().trim();
  
  for (const [key, response] of Object.entries(mockChatData)) {
    if (lowerMessage.includes(key.toLowerCase())) {
      const { cleanedContent, words } = parseMarkedContent(response.content);
      return { ...response, content: cleanedContent, words };
    }
  }
  
  const contextPrefix = context ? `基于上下文"${context}"，` : '';
  const content = `${contextPrefix}关于"${message}"的解释：这是一个有趣的话题。学习新【知识】需要掌握正确的【方法】，通过不断【实践】来加深理解。现代【技术】为我们提供了更多的学习途径和工具。`;
  const { cleanedContent, words } = parseMarkedContent(content);
  
  return {
    id: 'mock-chat-default',
    sessionId: 'mock-session-default',
    content: cleanedContent,
    words,
    definition: `${message}是一个重要的学习内容，理解它有助于扩展知识视野。`,
    examples: [`${message}在日常生活中有很多应用场景`, `学习${message}可以提升专业能力`],
    relatedTerms: ['学习方法', '知识体系', '实践技巧'],
  };
}

function getMockExplainResponse(word: string): ExplainResponse {
  const lowerWord = word.toLowerCase().trim();
  
  for (const [key, response] of Object.entries(mockExplainData)) {
    if (lowerWord === key.toLowerCase()) {
      const { cleanedContent, words } = parseMarkedContent(response.content);
      return { ...response, content: cleanedContent, words };
    }
  }
  
  const content = `【${word}】是一个重要的【概念】，在多个【领域】都有应用。深入理解它需要结合具体的【上下文】和【实践】经验。通过不断【学习】和【探索】，可以逐步掌握其核心【原理】和【应用场景】。`;
  const { cleanedContent, words } = parseMarkedContent(content);
  
  return {
    word,
    definition: `${word}是一个重要的概念，在多个领域都有应用。深入理解它需要结合具体的上下文和实践经验。`,
    content: cleanedContent,
    words,
    examples: [`${word}在日常生活中有很多应用`, `掌握${word}有助于提升专业能力`],
    relatedTerms: ['相关概念1', '相关概念2', '相关概念3'],
  };
}

export const chatApi = {
  async sendMessage(message: string, sessionId?: string, context?: string): Promise<ChatResponse> {
    try {
      const response = await api.post('/chat', {
        message,
        sessionId,
        context,
      });
      return response.data;
    } catch {
      return { ...getMockChatResponse(message, context), provider: '本地 Mock', isFallback: true };
    }
  },

  async explainWord(word: string, context?: string): Promise<ExplainResponse> {
    try {
      const response = await api.post('/explain', {
        word,
        context,
      });
      return response.data;
    } catch {
      return { ...getMockExplainResponse(word), provider: '本地 Mock', isFallback: true };
    }
  },

  async getHistory(sessionId: string): Promise<ChatMessage[]> {
    try {
      const response = await api.get(`/history/${sessionId}`);
      return response.data;
    } catch {
      return [];
    }
  },

  async organizeKnowledge(
    title: string,
    content: string,
    nodes: Record<string, TreeNode>,
    preferredParentId?: string | null
  ): Promise<KnowledgePlacement | null> {
    try {
      const response = await api.post('/knowledge/organize', {
        title,
        content,
        preferredParentId,
        nodes: Object.values(nodes).map(({ id, parentId, title: nodeTitle, content: nodeContent, tags }) => ({
          id,
          parentId,
          title: nodeTitle,
          content: nodeContent,
          tags,
        })),
      });
      return response.data;
    } catch {
      return null;
    }
  },

  async analyzeGraph(nodes: Record<string, TreeNode>, signal?: AbortSignal): Promise<GraphProposal> {
    const payload = { nodes: Object.values(nodes).map(({ id, parentId, title, content, tags }) => ({ id, parentId, title, content, tags })) };
    let lastError: unknown;
    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        const response = await api.post('/knowledge/analyze-graph', payload, { signal, timeout: 90000 });
        return response.data;
      } catch (error) {
        lastError = error;
        if (signal?.aborted || attempt === 1) break;
        await new Promise((resolve) => setTimeout(resolve, 600));
      }
    }
    throw lastError;
  },
};

export default api;
