import { User } from 'lucide-react';
import type { ChatMessage } from '@/types';

interface UserMessageProps {
  message: ChatMessage;
}

export function UserMessage({ message }: UserMessageProps) {
  return (
    <div className="flex gap-4 flex-row-reverse animate-fade-in" style={{
      animation: 'fadeIn 0.3s ease-out',
    }}>
      <div className="flex-shrink-0 w-10 h-10 bg-secondary/10 rounded-full flex items-center justify-center">
        <User className="w-5 h-5 text-secondary" />
      </div>
      <div className="flex-1 bg-secondary text-white rounded-2xl rounded-tr-none p-5 shadow-sm max-w-[80%]">
        <p className="text-gray-100 leading-relaxed whitespace-pre-wrap">{message.content}</p>
        <div className="mt-3 flex items-center gap-2 text-xs text-gray-400 justify-end">
          <span>你</span>
          <span>·</span>
          <span>{message.createdAt.toLocaleTimeString('zh-CN')}</span>
        </div>
      </div>
    </div>
  );
}