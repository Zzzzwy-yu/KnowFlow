import { WordButton } from './WordButton';
import type { TreeNode, WordInfo } from '@/types';
import { Circle, BookOpen, Lightbulb, List, Link2, ChevronRight } from 'lucide-react';
import { marked, Tokens } from 'marked';

interface DetailPanelProps {
  node: TreeNode;
  onWordClick: (word: string) => void;
}

function renderTokensWithKeywords(tokens: Tokens.Generic[], words: WordInfo[], onWordClick: (word: string) => void, textOffset: number = 0): JSX.Element[] {
  const parts: JSX.Element[] = [];
  let globalOffset = textOffset;

  for (const token of tokens) {
    if (token.type === 'text') {
      const text = token.raw;
      const wordMatches: { wordInfo: WordInfo; localStart: number; localEnd: number }[] = [];

      for (const wordInfo of words) {
        if (wordInfo.start >= globalOffset && wordInfo.end <= globalOffset + text.length) {
          wordMatches.push({
            wordInfo,
            localStart: wordInfo.start - globalOffset,
            localEnd: wordInfo.end - globalOffset,
          });
        }
      }

      wordMatches.sort((a, b) => a.localStart - b.localStart);

      let lastLocalIndex = 0;

      for (const match of wordMatches) {
        if (match.localStart > lastLocalIndex) {
          const textPart = text.slice(lastLocalIndex, match.localStart);
          parts.push(<span key={`text-${globalOffset + lastLocalIndex}`} className="text-gray-700">{textPart}</span>);
        }

        parts.push(
          <WordButton
            key={`word-${match.wordInfo.start}`}
            word={match.wordInfo.word}
            onClick={(word) => onWordClick(word)}
          />
        );

        lastLocalIndex = match.localEnd;
      }

      if (lastLocalIndex < text.length) {
        const textPart = text.slice(lastLocalIndex);
        parts.push(<span key={`text-${globalOffset + lastLocalIndex}`} className="text-gray-700">{textPart}</span>);
      }

      globalOffset += text.length;
    } else if (token.type === 'strong') {
      const children = renderTokensWithKeywords(token.tokens || [], words, onWordClick, globalOffset);
      const contentLength = token.raw.length;
      parts.push(<strong key={`strong-${globalOffset}`}>{children}</strong>);
      globalOffset += contentLength;
    } else if (token.type === 'em') {
      const children = renderTokensWithKeywords(token.tokens || [], words, onWordClick, globalOffset);
      const contentLength = token.raw.length;
      parts.push(<em key={`em-${globalOffset}`}>{children}</em>);
      globalOffset += contentLength;
    } else if (token.type === 'br') {
      parts.push(<br key={`br-${globalOffset}`} />);
      globalOffset += 2;
    } else if (token.type === 'paragraph') {
      const children = renderTokensWithKeywords(token.tokens || [], words, onWordClick, globalOffset);
      const contentLength = token.raw.length;
      parts.push(<p key={`p-${globalOffset}`} className="mb-2">{children}</p>);
      globalOffset += contentLength;
    } else if (token.type === 'list') {
      const listItems: JSX.Element[] = [];
      for (const item of token.items) {
        const itemChildren = renderTokensWithKeywords(item.tokens || [], words, onWordClick, globalOffset);
        listItems.push(<li key={`li-${globalOffset}`} className="ml-4 mb-1">{itemChildren}</li>);
        globalOffset += item.raw.length;
      }
      parts.push(<ul key={`ul-${globalOffset}`} className="mb-2">{listItems}</ul>);
    } else if (token.type === 'heading') {
      const children = renderTokensWithKeywords(token.tokens || [], words, onWordClick, globalOffset);
      const contentLength = token.raw.length;
      const HeadingTag = `h${token.depth}` as keyof JSX.IntrinsicElements;
      parts.push(<HeadingTag key={`h${token.depth}-${globalOffset}`} className={`font-bold mb-2 ${token.depth === 1 ? 'text-xl' : token.depth === 2 ? 'text-lg' : 'text-base'}`}>{children}</HeadingTag>);
      globalOffset += contentLength;
    } else if (token.type === 'code') {
      parts.push(<code key={`code-${globalOffset}`} className="bg-gray-100 px-1 rounded text-sm">{token.text}</code>);
      globalOffset += token.raw.length;
    } else if (token.type === 'blockquote') {
      const children = renderTokensWithKeywords(token.tokens || [], words, onWordClick, globalOffset);
      const contentLength = token.raw.length;
      parts.push(<blockquote key={`bq-${globalOffset}`} className="border-l-2 border-primary pl-3 italic text-gray-600 mb-2">{children}</blockquote>);
      globalOffset += contentLength;
    } else {
      const textContent = token.raw || '';
      parts.push(<span key={`other-${globalOffset}`} className="text-gray-700">{textContent}</span>);
      globalOffset += textContent.length;
    }
  }

  return parts;
}

function renderMarkdownWithKeywords(content: string, words: WordInfo[], onWordClick: (word: string) => void): JSX.Element[] {
  if (!words || words.length === 0) {
    return [<span key="md-content" dangerouslySetInnerHTML={{ __html: marked.parse(content) as string }} />];
  }

  const tokens = marked.Lexer.lex(content);
  return renderTokensWithKeywords(tokens, words, onWordClick);
}

function ContentCard({ content, words, onWordClick }: { content: string; words?: WordInfo[]; onWordClick: (word: string) => void }) {
  return (
    <div className="bg-gradient-to-r from-primary/5 to-orange-50 border border-primary/10 rounded-xl p-4 mb-6">
      <div className="flex items-center gap-2 mb-2">
        <Lightbulb className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-semibold text-primary">定义</h3>
      </div>
      <div className="text-gray-700 text-sm leading-relaxed">
        {renderMarkdownWithKeywords(content, words || [], onWordClick)}
      </div>
    </div>
  );
}

function ExamplesSection({ examples }: { examples: string[] }) {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <List className="w-4 h-4 text-green-500" />
        <h3 className="text-sm font-semibold text-green-500">示例</h3>
      </div>
      <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
        {examples.map((example, index) => (
          <div
            key={index}
            className={`flex items-start gap-3 p-4 ${index !== examples.length - 1 ? 'border-b border-gray-50' : ''}`}
          >
            <span className="flex-shrink-0 w-5 h-5 rounded-full bg-green-100 text-green-600 text-xs flex items-center justify-center font-medium">
              {index + 1}
            </span>
            <p className="text-gray-600 text-sm" dangerouslySetInnerHTML={{ __html: marked.parse(example) as string }} />
          </div>
        ))}
      </div>
    </div>
  );
}

function RelatedTermsSection({ relatedTerms, onWordClick }: { relatedTerms: string[]; onWordClick: (word: string) => void }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Link2 className="w-4 h-4 text-blue-500" />
        <h3 className="text-sm font-semibold text-blue-500">相关术语</h3>
      </div>
      <div className="flex flex-wrap gap-2">
        {relatedTerms.map((term) => (
          <button
            key={term}
            onClick={() => onWordClick(term)}
            className="group inline-flex items-center gap-1 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg text-sm hover:bg-blue-100 transition-colors duration-200"
          >
            <span>{term}</span>
            <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
        ))}
      </div>
    </div>
  );
}

export function DetailPanel({ node, onWordClick }: DetailPanelProps) {
  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 bg-white">
        {node.type === 'question' ? (
          <Circle className="w-6 h-6 text-primary" />
        ) : (
          <BookOpen className="w-6 h-6 text-secondary" />
        )}
        <h2 className="text-lg font-bold text-gray-800">{node.title}</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-6 pb-48 bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="max-w-3xl mx-auto space-y-4">
          <ContentCard content={node.content} words={node.words} onWordClick={onWordClick} />

          {node.examples && node.examples.length > 0 && (
            <ExamplesSection examples={node.examples} />
          )}

          {node.relatedTerms && node.relatedTerms.length > 0 && (
            <RelatedTermsSection relatedTerms={node.relatedTerms} onWordClick={onWordClick} />
          )}
        </div>
      </div>
    </div>
  );
}

export function EmptyPanel() {
  return (
    <div className="h-full flex flex-col items-center justify-center text-gray-400">
      <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
        <BookOpen className="w-12 h-12" />
      </div>
      <h3 className="text-xl font-semibold text-gray-500 mb-2">开始你的学习之旅</h3>
      <p className="text-sm text-gray-400 max-w-md text-center">
        在底部输入框中输入问题，AI会为你解答。点击回答中的橙色词语可以深入了解，知识树会自动生成。
      </p>
    </div>
  );
}
