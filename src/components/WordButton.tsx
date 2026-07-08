import { HelpCircle } from 'lucide-react';

interface WordButtonProps {
  word: string;
  onClick: (word: string) => void;
}

export function WordButton({ word, onClick }: WordButtonProps) {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onClick(word);
  };

  return (
    <button
      onClick={handleClick}
      className="group relative inline-flex items-center ml-1 p-1 rounded-lg hover:bg-primary/10 transition-all duration-200"
      title="点击了解更多"
    >
      <span className="relative z-10 text-primary font-medium">
        {word}
      </span>
      <span className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <HelpCircle className="w-4 h-4 text-primary" />
      </span>
      <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-secondary text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none z-40">
        点击了解更多
      </span>
    </button>
  );
}