import { useState, KeyboardEvent } from 'react';
import { Send, MessageSquarePlus, X, ArrowRight } from 'lucide-react';
import type { TreeNode } from '@/types';

interface ChatInputProps {
  onSend: (message: string, parentNodeId?: string | null) => void;
  isLoading: boolean;
  activeNode?: TreeNode | null;
}

export function ChatInput({ onSend, isLoading, activeNode }: ChatInputProps) {
  const [input, setInput] = useState('');
  const [contextMode, setContextMode] = useState(false);

  const handleSubmit = () => {
    if (!input.trim() || isLoading) return;
    
    const parentId = contextMode && activeNode ? activeNode.id : null;
    onSend(input, parentId);
    setInput('');
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const toggleContextMode = () => {
    if (!activeNode) return;
    setContextMode(!contextMode);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 p-4 shadow-lg">
      <div className="max-w-4xl mx-auto">
        {activeNode && (
          <div className="mb-3 flex items-center justify-between">
            <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
              contextMode ? 'bg-primary/10 text-primary' : 'bg-gray-100 text-gray-500'
            }`}>
              <span className="truncate max-w-xs">
                {activeNode.type === 'question' ? '当前问题：' : '当前解释：'}
                {activeNode.title}
              </span>
              <button
                onClick={toggleContextMode}
                className="flex items-center gap-1 px-2 py-1 rounded hover:bg-white/50 transition-colors"
              >
                <ArrowRight className="w-4 h-4" />
                {contextMode ? '在此节点下提问' : '关联提问'}
              </button>
            </div>
            <button
              onClick={() => setContextMode(false)}
              disabled={!contextMode}
              className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        
        <div className="relative flex gap-3">
          <div className="flex-1 relative">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={contextMode ? '在此节点下继续提问...' : '输入你想问的问题...'}
              disabled={isLoading}
              className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary resize-none transition-all duration-200 bg-gray-50 hover:bg-white text-gray-800 placeholder-gray-400"
              rows={2}
              style={{ minHeight: '60px', maxHeight: '180px' }}
            />
            <div className="absolute right-3 bottom-3 flex items-center gap-2">
              <button
                type="button"
                disabled={isLoading || !activeNode}
                onClick={toggleContextMode}
                className={`p-2 rounded-lg transition-all duration-200 ${
                  contextMode 
                    ? 'bg-primary/10 text-primary' 
                    : 'text-gray-400 hover:text-primary hover:bg-primary/5 disabled:opacity-30'
                }`}
              >
                <MessageSquarePlus className="w-5 h-5" />
              </button>
            </div>
          </div>
          <button
            onClick={handleSubmit}
            disabled={!input.trim() || isLoading}
            className="px-6 py-3 bg-primary text-white rounded-2xl font-medium hover:bg-primary/90 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-2 hover:scale-105 active:scale-95 shadow-md"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
            <span className="hidden sm:inline">发送</span>
          </button>
        </div>
      </div>
    </div>
  );
}