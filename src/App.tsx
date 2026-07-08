import { Waves, Sparkles } from 'lucide-react';
import { ChatInput } from '@/components/ChatInput';
import { TreeNavigator } from '@/components/TreeNavigator';
import { DetailPanel, EmptyPanel } from '@/components/DetailPanel';
import { useChat } from '@/hooks/useChat';

function App() {
  const { nodes, activeNodeId, isLoading, sendMessage, explainWord } = useChat();
  const activeNode = activeNodeId ? nodes[activeNodeId] : null;

  const handleWordClick = (word: string) => {
    if (activeNodeId) {
      explainWord(word, activeNodeId);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-orange-50 flex flex-col">
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-orange-400 rounded-xl flex items-center justify-center shadow-lg">
            <Waves className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-secondary">KnowFlow</h1>
            <p className="text-xs text-gray-500">AI 交互式学习助手</p>
          </div>
          </div>
          <div className="flex items-center gap-2 text-primary text-sm font-medium">
            <Sparkles className="w-4 h-4" />
            <span>点击橙色词语深入了解</span>
          </div>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        <div className="w-80 flex-shrink-0 bg-white border-r border-gray-200 flex flex-col">
          <TreeNavigator />
        </div>

        <div className="flex-1 flex flex-col overflow-hidden">
          {isLoading ? (
            <div className="h-full flex flex-col items-center justify-center">
              <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4" />
              <p className="text-gray-500">AI 正在思考中...</p>
            </div>
          ) : activeNode ? (
            <DetailPanel node={activeNode} onWordClick={handleWordClick} />
          ) : (
            <EmptyPanel />
          )}
        </div>
      </main>

      <ChatInput onSend={sendMessage} isLoading={isLoading} activeNode={activeNode} />
    </div>
  );
}

export default App;
