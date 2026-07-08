import { useEffect, useRef } from 'react';
import { X, BookOpen, Lightbulb, Link2 } from 'lucide-react';
import { useMiniWindowStore } from '@/store/chatStore';

export function MiniExplanation() {
  const { isOpen, word, definition, examples, relatedTerms, position, close } = useMiniWindowStore();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        close();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, close]);

  if (!isOpen) return null;

  const calculatePosition = () => {
    let x = position.x;
    let y = position.y;

    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    const popupWidth = 360;
    const popupHeight = 400;

    if (x + popupWidth > windowWidth) {
      x = windowWidth - popupWidth - 20;
    }
    if (y + popupHeight > windowHeight) {
      y = windowHeight - popupHeight - 20;
    }

    return { x, y };
  };

  const pos = calculatePosition();

  return (
    <div
      className="fixed z-50 w-[360px] max-h-[400px] bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden"
      style={{
        left: pos.x,
        top: pos.y,
        animation: 'slideUp 0.2s ease-out',
      }}
    >
      <div ref={containerRef}>
        <div className="bg-gradient-to-r from-primary to-primary/80 px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BookOpen className="w-5 h-5 text-white" />
            <h3 className="text-white font-bold text-lg">{word}</h3>
          </div>
          <button
            onClick={close}
            className="p-1 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto max-h-[300px]">
          {definition ? (
            <>
              <div className="mb-4">
                <div className="flex items-center gap-2 text-gray-500 text-sm mb-2">
                  <Lightbulb className="w-4 h-4" />
                  <span>释义</span>
                </div>
                <p className="text-gray-700 leading-relaxed">{definition}</p>
              </div>

              {examples && examples.length > 0 && (
                <div className="mb-4">
                  <div className="flex items-center gap-2 text-gray-500 text-sm mb-2">
                    <span>💡</span>
                    <span>示例</span>
                  </div>
                  <ul className="space-y-2">
                    {examples.map((example, index) => (
                      <li key={index} className="text-gray-600 text-sm bg-gray-50 px-3 py-2 rounded-lg">
                        {example}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {relatedTerms && relatedTerms.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 text-gray-500 text-sm mb-2">
                    <Link2 className="w-4 h-4" />
                    <span>相关术语</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {relatedTerms.map((term, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-primary/10 text-primary text-sm rounded-full"
                      >
                        {term}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-gray-400">
              <div className="w-12 h-12 border-2 border-gray-200 border-t-primary rounded-full animate-spin mb-3" />
              <p>正在获取解释...</p>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}