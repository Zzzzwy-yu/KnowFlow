import { useState, KeyboardEvent } from 'react';
import { Send, MessageSquarePlus, X, ArrowRight } from 'lucide-react';
import type { AnswerDepth, TreeNode } from '@/types';

interface ChatInputProps {
  onSend: (message: string, parentNodeId?: string | null) => void;
  isLoading: boolean;
  activeNode?: TreeNode | null;
  answerDepth: AnswerDepth;
  onDepthChange: (depth: AnswerDepth) => void;
  onStop: () => void;
  onQueue: (message: string, parentNodeId?: string | null) => void;
  queuedCount: number;
  compact?: boolean;
}

export function ChatInput({ onSend, isLoading, activeNode, answerDepth, onDepthChange, onStop, onQueue, queuedCount, compact = false }: ChatInputProps) {
  const [input, setInput] = useState('');
  const [contextMode, setContextMode] = useState(false);

  const handleSubmit = () => {
    if (!input.trim()) return;
    
    const parentId = contextMode && activeNode ? activeNode.id : null;
    if (isLoading) onQueue(input, parentId); else onSend(input, parentId);
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
    <div className="relative z-50 flex-shrink-0 bg-white border-t border-gray-200 p-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] shadow-[0_-4px_14px_rgba(0,0,0,0.05)] sm:px-4">
      <div className={`${compact ? 'max-w-6xl' : 'max-w-4xl'} mx-auto`}>
        {!compact && (
          <div className={`mb-2 flex min-w-0 gap-2 ${activeNode ? 'flex-col sm:flex-row sm:items-center' : 'justify-end'}`}>
            {activeNode && <>
            <div className={`flex min-w-0 flex-1 items-center gap-1 px-2 py-1.5 rounded-lg text-xs transition-all duration-200 sm:gap-2 sm:px-3 sm:py-2 sm:text-sm ${
              contextMode ? 'bg-primary/10 text-primary' : 'bg-gray-100 text-gray-500'
            }`}>
              <span className="min-w-0 flex-1 truncate sm:max-w-xs">
                {activeNode.type === 'question' ? '当前问题：' : '当前解释：'}
                {activeNode.title}
              </span>
              <button
                onClick={toggleContextMode}
                className="flex shrink-0 items-center gap-1 px-1.5 py-1 rounded hover:bg-white/50 transition-colors sm:px-2"
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
            </>}
            <div className="flex shrink-0 items-center justify-end gap-2 text-xs text-gray-500"><span>回答深度</span><select aria-label="回答深度" value={answerDepth} disabled={isLoading} onChange={(event) => onDepthChange(event.target.value as AnswerDepth)} className="h-9 rounded-lg border bg-gray-50 px-2 outline-none"><option value="brief">一句话</option><option value="beginner">入门</option><option value="professional">专业</option><option value="academic">论文级</option></select></div>
          </div>
        )}
        
        <div className="relative flex items-stretch gap-2 sm:gap-3">
          {compact && <select aria-label="回答深度" value={answerDepth} disabled={isLoading} onChange={(event) => onDepthChange(event.target.value as AnswerDepth)} className="w-20 rounded-xl border bg-gray-50 px-2 text-xs outline-none sm:w-24"><option value="brief">一句话</option><option value="beginner">入门</option><option value="professional">专业</option><option value="academic">论文级</option></select>}
          <div className="flex-1 relative">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={contextMode ? '在此节点下继续提问...' : '输入你想问的问题...'}
              className="w-full px-3 py-2 pr-11 text-sm border border-gray-300 rounded-xl sm:rounded-2xl sm:px-4 sm:py-3 sm:pr-12 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary resize-none transition-all duration-200 bg-gray-50 hover:bg-white text-gray-800 placeholder-gray-400"
              rows={1}
              style={{ minHeight: compact ? '44px' : '48px', maxHeight: compact ? '88px' : '120px' }}
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
          {isLoading && <button onClick={onStop} title="停止当前生成" className="rounded-xl bg-red-500 px-3 py-2 text-white shadow hover:bg-red-600"><div className="h-4 w-4 rounded-sm bg-white" /></button>}
          <button
            onClick={handleSubmit}
            disabled={!input.trim()}
            className="px-3 py-2 text-white rounded-xl font-medium sm:rounded-2xl sm:px-6 sm:py-3 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-2 hover:scale-105 active:scale-95 shadow-md bg-primary hover:bg-primary/90"
          >
            <Send className="w-5 h-5" />
            <span className="hidden sm:inline">{isLoading ? '加入队列' : '发送'}</span>
            {queuedCount > 0 && <span className="rounded-full bg-white/20 px-1.5 text-xs">{queuedCount}</span>}
          </button>
        </div>
      </div>
    </div>
  );
}
