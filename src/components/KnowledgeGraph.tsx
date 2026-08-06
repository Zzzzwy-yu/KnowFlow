import { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTreeStore } from '@/store/chatStore';
import { HelpCircle, X } from 'lucide-react';

const colors: Record<string, string> = {
  prerequisite: '#8b5cf6', contains: '#f97316', detail: '#0ea5e9', example: '#22c55e', comparison: '#ef4444', related: '#64748b',
};

export function KnowledgeGraph() {
  const [guideOpen, setGuideOpen] = useState(false);
  const { nodes, edges, activeNodeId, setActiveNode } = useTreeStore();
  const layout = useMemo(() => {
    const values = Object.values(nodes);
    const levels = new Map<string, number>();
    const getLevel = (id: string, seen = new Set<string>()): number => {
      if (levels.has(id)) return levels.get(id)!;
      if (seen.has(id)) return 0;
      seen.add(id);
      const parentId = nodes[id]?.parentId;
      const level = parentId && nodes[parentId] ? getLevel(parentId, seen) + 1 : 0;
      levels.set(id, level);
      return level;
    };
    values.forEach((node) => getLevel(node.id));
    const groups = new Map<number, typeof values>();
    values.forEach((node) => groups.set(levels.get(node.id) || 0, [...(groups.get(levels.get(node.id) || 0) || []), node]));
    const width = Math.max(900, ...[...groups.values()].map((group) => group.length * 230));
    const positions = new Map<string, { x: number; y: number }>();
    groups.forEach((group, level) => group.forEach((node, index) => positions.set(node.id, { x: ((index + 1) * width) / (group.length + 1), y: 90 + level * 170 })));
    return { width, height: Math.max(500, (Math.max(0, ...levels.values()) + 1) * 170 + 100), positions };
  }, [nodes]);

  const allEdges = [
    ...Object.values(nodes).filter((node) => node.parentId).map((node) => ({ id: `parent-${node.id}`, sourceId: node.parentId!, targetId: node.id, type: node.relationType || 'contains', reason: node.relationReason || '层级关系', confidence: 1 })),
    ...edges,
  ];

  if (Object.keys(nodes).length === 0) return <div className="h-full flex items-center justify-center text-gray-400">创建知识点后可查看图谱</div>;
  return <div className="h-full overflow-auto bg-slate-50 p-2 sm:p-4">
    <div className="sticky left-0 mb-3 flex max-w-[calc(100vw-1rem)] flex-wrap items-center gap-2 text-xs sm:gap-3">{Object.entries(colors).map(([type, color]) => <span key={type} className="flex items-center gap-1"><i className="h-2 w-4 rounded" style={{ background: color }} />{type}</span>)}<button onClick={() => setGuideOpen(true)} className="ml-auto flex items-center gap-1 rounded-lg border bg-white px-2.5 py-1.5 text-blue-600 shadow-sm"><HelpCircle className="h-4 w-4" />使用指南</button></div>
    <svg width={layout.width} height={layout.height} className="rounded-xl bg-white shadow-sm">
      <defs><marker id="arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="#94a3b8" /></marker></defs>
      {allEdges.map((edge) => {
        const source = layout.positions.get(edge.sourceId); const target = layout.positions.get(edge.targetId); if (!source || !target) return null;
        return <g key={edge.id}><line x1={source.x} y1={source.y + 24} x2={target.x} y2={target.y - 24} stroke={colors[edge.type] || '#94a3b8'} strokeWidth={edge.confidence > 0.8 ? 2.5 : 1.5} strokeDasharray={edge.id.startsWith('parent-') ? undefined : '6 4'} markerEnd="url(#arrow)" /><title>{edge.type}: {edge.reason}</title></g>;
      })}
      {Object.values(nodes).map((node) => { const point = layout.positions.get(node.id)!; const active = activeNodeId === node.id; return <g key={node.id} onClick={() => setActiveNode(node.id)} className="cursor-pointer"><rect x={point.x - 88} y={point.y - 27} width="176" height="54" rx="14" fill={active ? '#fff7ed' : '#fff'} stroke={active ? '#f97316' : '#cbd5e1'} strokeWidth={active ? 3 : 1.5} /><text x={point.x} y={point.y + 4} textAnchor="middle" fontSize="13" fill="#334155">{node.title.length > 18 ? `${node.title.slice(0, 18)}…` : node.title}</text><title>{node.title}</title></g>; })}
    </svg>
    {guideOpen && createPortal(<div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/40 p-4" onClick={() => setGuideOpen(false)}><div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-2xl sm:p-6" onClick={(event) => event.stopPropagation()}><div className="flex items-center justify-between"><h3 className="text-lg font-bold text-gray-800">知识图谱使用指南</h3><button onClick={() => setGuideOpen(false)} className="rounded-lg p-2 hover:bg-gray-100"><X className="h-5 w-5" /></button></div><div className="mt-4 space-y-4 text-sm text-gray-600"><section><h4 className="font-semibold text-gray-800">连线样式</h4><p className="mt-1">实线表示知识树中的父子层级；虚线表示不改变层级的横向语义关系。箭头从关联源指向目标知识点，线条越粗表示 AI 判断的置信度越高。</p></section><section><h4 className="font-semibold text-gray-800">颜色含义</h4><div className="mt-2 grid grid-cols-2 gap-2">{Object.entries(colors).map(([type, color]) => <span key={type} className="flex items-center gap-2"><i className="h-1.5 w-6 rounded" style={{ background: color }} /><b>{type}</b></span>)}</div><ul className="mt-2 list-disc space-y-1 pl-5"><li><b>prerequisite：</b>学习目标概念前应先掌握</li><li><b>contains：</b>上位概念包含下位概念</li><li><b>detail：</b>对某个概念的进一步细化</li><li><b>example：</b>概念的实例或应用</li><li><b>comparison：</b>可对照分析的概念</li><li><b>related：</b>其他语义关联</li></ul></section><section><h4 className="font-semibold text-gray-800">操作方式</h4><p className="mt-1">点击节点可将其设为当前知识点；鼠标悬停在线条或节点上可查看完整说明。画布较大时可横向和纵向滚动。</p></section></div><div className="mt-5 text-right"><button onClick={() => setGuideOpen(false)} className="rounded-lg bg-primary px-4 py-2 text-white">知道了</button></div></div></div>, document.body)}
  </div>;
}
