import { WordButton } from './WordButton';
import type { TreeNode, WordInfo } from '@/types';
import { Circle, BookOpen, Lightbulb, List, Link2, ChevronRight, Pencil, Trash2, Check, X } from 'lucide-react';
import { marked, Tokens } from 'marked';
import { useEffect, useState } from 'react';

interface DetailPanelProps {
  node: TreeNode;
  nodes: Record<string, TreeNode>;
  onWordClick: (word: string) => void;
  onUpdate: (nodeId: string, updates: Partial<Pick<TreeNode, 'title' | 'content' | 'tags'>>) => void;
  onDelete: (nodeId: string) => void;
  onMove: (nodeId: string, parentId: string | null) => boolean;
  onRegenerate: (nodeId: string) => void;
  isLoading: boolean;
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
  const tokens = marked.Lexer.lex(content);
  return renderTokensWithKeywords(tokens, words || [], onWordClick);
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
            <p className="text-gray-600 text-sm whitespace-pre-wrap">{example}</p>
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

export function DetailPanel({ node, nodes, onWordClick, onUpdate, onDelete, onMove, onRegenerate, isLoading }: DetailPanelProps) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(node.title);
  const [content, setContent] = useState(node.content);
  const [tags, setTags] = useState((node.tags || []).join(', '));
  useEffect(() => {
    setEditing(false);
    setTitle(node.title);
    setContent(node.content);
    setTags((node.tags || []).join(', '));
  }, [node.id, node.title, node.content]);
  const save = () => {
    if (!title.trim() || !content.trim()) return;
    onUpdate(node.id, { title: title.trim(), content: content.trim(), tags: tags.split(/[,，]/).map((tag) => tag.trim()).filter(Boolean).slice(0, 12) });
    setEditing(false);
  };
  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-2 px-3 py-3 border-b border-gray-100 bg-white sm:gap-3 sm:px-6 sm:py-4">
        {node.type === 'question' ? (
          <Circle className="w-6 h-6 text-primary" />
        ) : (
          <BookOpen className="w-6 h-6 text-secondary" />
        )}
        {editing ? <input value={title} onChange={(event) => setTitle(event.target.value)} className="min-w-0 flex-1 border rounded-lg px-2 py-1.5 text-base font-bold sm:px-3 sm:text-lg" /> : <h2 className="min-w-0 flex-1 truncate text-base font-bold text-gray-800 sm:text-lg">{node.title}</h2>}
        <div className="flex gap-1">
          {editing ? <><button title="保存" onClick={save} className="p-2 text-green-600 hover:bg-green-50 rounded-lg"><Check className="w-4 h-4" /></button><button title="取消" onClick={() => { setEditing(false); setTitle(node.title); setContent(node.content); }} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"><X className="w-4 h-4" /></button></> : <button title="编辑" onClick={() => setEditing(true)} className="p-2 text-gray-500 hover:text-primary hover:bg-orange-50 rounded-lg"><Pencil className="w-4 h-4" /></button>}
          <button title="删除节点及其子节点" onClick={() => window.confirm(`确定删除“${node.title}”及其全部子节点吗？`) && onDelete(node.id)} className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
          {node.originalPrompt && <button disabled={isLoading} title="重新生成回答" onClick={() => onRegenerate(node.id)} className="rounded-lg px-2 py-1 text-xs text-primary hover:bg-orange-50 disabled:opacity-30">重新生成</button>}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 pb-6 bg-gradient-to-br from-gray-50 to-gray-100 sm:p-6">
        <div className="max-w-3xl mx-auto space-y-4">
          <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
            <span className="px-2 py-1 rounded-full bg-blue-50 text-blue-600">{node.relationType || 'root'}</span>
            {node.provider && <span className={`px-2 py-1 rounded-full ${node.isFallback ? 'bg-amber-100 text-amber-700' : 'bg-green-50 text-green-700'}`}>{node.isFallback ? '离线内容' : node.provider}</span>}
            {node.answerDepth && <span className="rounded-full bg-purple-50 px-2 py-1 text-purple-600">{({ brief: '一句话', beginner: '入门', professional: '专业', academic: '论文级' } as const)[node.answerDepth]}</span>}
            {typeof node.durationMs === 'number' && <span>{node.durationMs === 0 ? '缓存命中' : `${(node.durationMs / 1000).toFixed(1)} 秒`}</span>}
            {node.estimatedTokens && <span>约 {node.estimatedTokens} tokens</span>}
            {node.relationReason && <span>{node.relationReason}</span>}
            {!editing && node.tags?.map((tag) => <span key={tag} className="px-2 py-1 rounded-full bg-gray-200">#{tag}</span>)}
          </div>
          {node.source && <details className="rounded-xl border border-indigo-100 bg-indigo-50/70 p-3 text-sm"><summary className="cursor-pointer font-medium text-indigo-700">来源：{node.source.name}</summary>{node.source.excerpt && <blockquote className="mt-2 border-l-2 border-indigo-300 pl-3 text-xs leading-relaxed text-gray-600">{node.source.excerpt}</blockquote>}</details>}
          <div className="flex flex-col gap-2 rounded-xl border border-gray-200 bg-white p-3 text-sm sm:flex-row sm:items-center">
            <label className="text-gray-500 shrink-0">上位知识点</label>
            <select value={node.parentId || ''} onChange={(event) => { if (!onMove(node.id, event.target.value || null)) window.alert('不能将节点移动到自身或其子节点下。'); }} className="min-w-0 flex-1 bg-transparent outline-none text-gray-700">
              <option value="">独立根主题</option>
              {Object.values(nodes).filter((item) => item.id !== node.id).map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
            </select>
          </div>
          {editing ? <div className="space-y-3"><textarea value={content} onChange={(event) => setContent(event.target.value)} rows={12} className="w-full border rounded-xl p-4 text-sm leading-relaxed" /><input value={tags} onChange={(event) => setTags(event.target.value)} placeholder="标签，用逗号分隔" className="w-full border rounded-xl px-4 py-3 text-sm" /></div> : <ContentCard content={node.content} words={node.words} onWordClick={onWordClick} />}

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

export function EmptyPanel({ onImportMaterial }: { onImportMaterial: () => void }) {
  return (
    <div className="h-full flex flex-col items-center justify-center text-gray-400">
      <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
        <BookOpen className="w-12 h-12" />
      </div>
      <h3 className="text-xl font-semibold text-gray-500 mb-2">开始你的学习之旅</h3>
      <p className="text-sm text-gray-400 max-w-md text-center">
        在底部输入框中输入问题，AI会为你解答。点击回答中的橙色词语可以深入了解，知识树会自动生成。
      </p>
      <button onClick={onImportMaterial} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-white shadow-md hover:bg-primary/90">上传 Markdown / TXT 资料</button>
    </div>
  );
}
