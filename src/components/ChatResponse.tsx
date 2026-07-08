import { useRef } from 'react';
import { Bot } from 'lucide-react';
import { WordButton } from './WordButton';
import type { ChatMessage } from '@/types';

interface ChatResponseProps {
  message: ChatMessage;
  onWordClick: (word: string, position: { x: number; y: number }) => void;
}

export function ChatResponse({ message, onWordClick }: ChatResponseProps) {
  const contentRef = useRef<HTMLDivElement>(null);

  const renderContent = () => {
    if (!message.words || message.words.length === 0) {
      return <span className="text-gray-700">{message.content}</span>;
    }

    const parts: JSX.Element[] = [];
    let lastIndex = 0;

    const sortedWords = [...message.words].sort((a, b) => a.start - b.start);

    for (const wordInfo of sortedWords) {
      if (wordInfo.start > lastIndex) {
        parts.push(
          <span key={`text-${lastIndex}`} className="text-gray-700">
            {message.content.slice(lastIndex, wordInfo.start)}
          </span>
        );
      }

      parts.push(
          <WordButton
            key={`word-${wordInfo.start}`}
            word={wordInfo.word}
            onClick={(word) => onWordClick(word, { x: 0, y: 0 })}
          />
        );

      lastIndex = wordInfo.end;
    }

    if (lastIndex < message.content.length) {
      parts.push(
        <span key={`text-${lastIndex}`} className="text-gray-700">
          {message.content.slice(lastIndex)}
        </span>
      );
    }

    return parts;
  };

  return (
    <div
      ref={contentRef}
      className="flex gap-4 animate-fade-in"
      style={{
        animation: 'fadeIn 0.3s ease-out',
      }}
    >
      <div className="flex-shrink-0 w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
        <Bot className="w-5 h-5 text-primary" />
      </div>
      <div className="flex-1 bg-white rounded-2xl rounded-tl-none p-5 shadow-sm border border-gray-100">
        <div className="prose prose-sm max-w-none">
          <p className="text-gray-800 leading-relaxed">{renderContent()}</p>
        </div>
        <div className="mt-3 flex items-center gap-2 text-xs text-gray-400">
          <span>AI 助手</span>
          <span>·</span>
          <span>{message.createdAt.toLocaleTimeString('zh-CN')}</span>
        </div>
      </div>
    </div>
  );
}