import { useTreeStore } from '@/store/chatStore';
import type { GraphProposal, TreeNode } from '@/types';
import { ChevronRight, ChevronDown, Circle, Download, Search, Upload, Sparkles, FileText, Undo2, Redo2, X } from 'lucide-react';
import { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { chatApi } from '@/utils/apiClient';

function TreeNodeItem({ node, depth }: { node: TreeNode; depth: number }) {
  const { setActiveNode, toggleExpand, getChildren, activeNodeId } = useTreeStore();
  const children = getChildren(node.id);
  const hasChildren = children.length > 0;
  const isActive = activeNodeId === node.id;

  const handleToggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleExpand(node.id);
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveNode(node.id);
  };

  const indentSize = 24;
  const leftPadding = 12;

  return (
    <div className="relative">
      <div
        className={`flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-200 hover:bg-gray-50 ${
          isActive ? 'bg-primary/10' : ''
        }`}
        onClick={handleClick}
        style={{ paddingLeft: `${depth * indentSize + leftPadding}px` }}
      >
        <span className="flex-shrink-0 relative">
          <Circle className={`w-4 h-4 ${isActive ? 'text-primary' : 'text-gray-400'} transition-colors`} />
          {isActive && (
            <Circle className="w-2 h-2 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          )}
        </span>
        
        <span
          className={`flex-1 text-sm truncate ${
            isActive ? 'text-primary font-medium' : 'text-gray-700'
          }`}
        >
          {node.title}
        </span>
        
        {hasChildren && (
          <button
            onClick={handleToggleExpand}
            className="flex-shrink-0 w-6 h-6 flex items-center justify-center hover:bg-gray-200 rounded-full transition-colors"
          >
            {node.isExpanded ? (
              <ChevronDown className="w-4 h-4 text-gray-400" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-400" />
            )}
          </button>
        )}
      </div>
      
      {hasChildren && node.isExpanded && (
        <div className="relative">
          {children.map((child) => (
            <TreeNodeItem key={child.id} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export function TreeNavigator() {
  const { nodes, edges, clearTree, replaceTree, setActiveNode, applyGraphProposal, undoGraphChange, redoGraphChange, previousGraph, nextGraph, mergeNodes } = useTreeStore();
  const [query, setQuery] = useState('');
  const [organizing, setOrganizing] = useState(false);
  const [proposal, setProposal] = useState<GraphProposal | null>(null);
  const [organizeError, setOrganizeError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const rootNodes = Object.values(nodes).filter((node) => node.parentId === null);
  const matches = query.trim() ? Object.values(nodes).filter((node) =>
    `${node.title} ${node.content} ${(node.tags || []).join(' ')}`.toLowerCase().includes(query.trim().toLowerCase())
  ) : [];

  const exportTree = () => {
    const blob = new Blob([JSON.stringify({ version: 2, exportedAt: new Date().toISOString(), nodes, edges }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `knowflow-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportMarkdown = () => {
    const renderNode = (node: TreeNode, depth: number): string => {
      const tags = node.tags?.length ? `\n\n标签：${node.tags.map((tag) => `#${tag}`).join(' ')}` : '';
      const relation = node.relationReason ? `\n\n> 关系：${node.relationType || '关联'} — ${node.relationReason}` : '';
      const children = node.children.map((id) => nodes[id]).filter(Boolean).map((child) => renderNode(child, Math.min(depth + 1, 6))).join('\n\n');
      return `${'#'.repeat(depth)} ${node.title}\n\n${node.content}${tags}${relation}${children ? `\n\n${children}` : ''}`;
    };
    const markdown = rootNodes.map((root) => renderNode(root, 1)).join('\n\n---\n\n');
    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `knowflow-${new Date().toISOString().slice(0, 10)}.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const importTree = async (file?: File) => {
    if (!file) return;
    try {
      const data = JSON.parse(await file.text()) as { nodes?: Record<string, TreeNode>; edges?: GraphProposal['edges'] };
      if (!data.nodes || Object.values(data.nodes).some((node) => !node.id || !Array.isArray(node.children) || typeof node.title !== 'string')) throw new Error('invalid');
      replaceTree(data.nodes, Array.isArray(data.edges) ? data.edges : []);
    } catch {
      window.alert('导入失败：请选择由 KnowFlow 导出的有效 JSON 文件。');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const organizeTree = async () => {
    if (Object.keys(nodes).length < 2 || organizing) return;
    setOrganizing(true);
    setOrganizeError(null);
    abortRef.current = new AbortController();
    try {
      setProposal(await chatApi.analyzeGraph(nodes, abortRef.current.signal));
    } catch (error) {
      if (!abortRef.current.signal.aborted) setOrganizeError(error instanceof Error ? error.message : '智能分析失败，请稍后重试。');
    } finally {
      setOrganizing(false);
      abortRef.current = null;
    }
  };

  if (rootNodes.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-gray-400">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <Circle className="w-8 h-8" />
        </div>
        <p className="text-sm">开始提问以创建知识树</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <h2 className="text-sm font-semibold text-gray-700">知识树</h2>
        <div className="flex items-center gap-1">
          <button title="AI 智能重组整棵知识树" disabled={organizing || Object.keys(nodes).length < 2} onClick={organizeTree} className="p-1.5 text-primary hover:bg-orange-50 rounded disabled:opacity-30"><Sparkles className={`w-4 h-4 ${organizing ? 'animate-spin' : ''}`} /></button>
          {organizing && <button title="取消分析" onClick={() => abortRef.current?.abort()} className="p-1.5 text-red-500"><X className="w-4 h-4" /></button>}
          {previousGraph && <button title="撤销上次图谱整理" onClick={undoGraphChange} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded"><Undo2 className="w-4 h-4" /></button>}
          {nextGraph && <button title="重做图谱整理" onClick={redoGraphChange} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded"><Redo2 className="w-4 h-4" /></button>}
          <button title="导出 Markdown" onClick={exportMarkdown} className="p-1.5 text-gray-400 hover:text-primary"><FileText className="w-4 h-4" /></button>
          <button title="导入" onClick={() => fileInputRef.current?.click()} className="p-1.5 text-gray-400 hover:text-primary"><Upload className="w-4 h-4" /></button>
          <button title="导出" onClick={exportTree} className="p-1.5 text-gray-400 hover:text-primary"><Download className="w-4 h-4" /></button>
          <button onClick={() => window.confirm('确定清空整棵知识树吗？此操作不可撤销。') && clearTree()} className="text-xs text-gray-400 hover:text-red-500 transition-colors">清空</button>
          <input ref={fileInputRef} type="file" accept="application/json,.json" className="hidden" onChange={(event) => importTree(event.target.files?.[0])} />
        </div>
      </div>
      <div className="px-3 py-2 border-b border-gray-100">
        <label className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 border border-gray-200 focus-within:border-primary">
          <Search className="w-4 h-4 text-gray-400" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索标题、内容或标签" className="w-full bg-transparent text-sm outline-none" />
        </label>
      </div>
      <div className="flex-1 overflow-y-auto">
        {query.trim() ? <div className="p-2 space-y-1">
          {matches.map((node) => <button key={node.id} onClick={() => setActiveNode(node.id)} className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50 text-sm"><span className="block truncate text-gray-700">{node.title}</span><span className="text-xs text-gray-400">{node.tags?.join(' · ') || '未标记'}</span></button>)}
          {matches.length === 0 && <p className="p-4 text-center text-sm text-gray-400">没有匹配的知识点</p>}
        </div> : rootNodes.map((rootNode) => <TreeNodeItem key={rootNode.id} node={rootNode} depth={0} />)}
      </div>
      {organizeError && <div className="m-3 rounded-lg bg-red-50 p-3 text-xs text-red-600">{organizeError}</div>}
      {proposal && createPortal(<div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/30 p-4 pb-24 sm:pb-4">
        <div className="flex w-full max-w-2xl max-h-[calc(100vh-2rem)] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
          <div className="flex-1 overflow-y-auto p-6 pb-3">
          <div className="flex items-center justify-between"><h3 className="text-lg font-bold">智能整理预览</h3><button onClick={() => setProposal(null)}><X className="w-5 h-5" /></button></div>
          <p className="mt-2 text-sm text-gray-500">将调整 {Object.entries(proposal.placements).filter(([id, item]) => item.parentId !== nodes[id]?.parentId).length} 个层级，新增 {proposal.edges.length} 条横向关系，发现 {proposal.duplicates.length} 组疑似重复。</p>
          <div className="mt-4 space-y-2">{Object.entries(proposal.placements).map(([id, item]) => <div key={id} className="rounded-lg border p-3 text-sm"><span className="font-medium">{nodes[id]?.title}</span><span className="mx-2 text-gray-400">→</span><span>{item.parentId ? nodes[item.parentId]?.title || '未知节点' : '独立根主题'}</span><p className="mt-1 text-xs text-gray-500">{item.relationType} · {item.reason} · {Math.round(item.confidence * 100)}%</p></div>)}</div>
          {proposal.duplicates.length > 0 && <div className="mt-5"><h4 className="font-semibold">疑似重复节点</h4>{proposal.duplicates.map((item) => <div key={item.nodeIds.join('-')} className="mt-2 flex items-center gap-2 rounded-lg bg-amber-50 p-3 text-sm"><span className="flex-1">{nodes[item.nodeIds[0]]?.title} / {nodes[item.nodeIds[1]]?.title}（{Math.round(item.confidence * 100)}%）</span><button onClick={() => { mergeNodes(item.nodeIds[0], item.nodeIds[1]); setProposal((current) => current ? { ...current, duplicates: current.duplicates.filter((entry) => entry !== item) } : null); }} className="rounded bg-amber-600 px-3 py-1 text-white">合并</button></div>)}</div>}
          </div>
          <div className="flex flex-shrink-0 justify-end gap-3 border-t bg-white px-6 py-4"><button onClick={() => setProposal(null)} className="rounded-lg border px-4 py-2">取消</button><button onClick={() => { applyGraphProposal(proposal); setProposal(null); }} className="rounded-lg bg-primary px-4 py-2 text-white">确认应用</button></div>
        </div>
      </div>, document.body)}
    </div>
  );
}
