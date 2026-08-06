import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTreeStore } from '@/store/chatStore';
import { ChevronDown, Expand, Focus, HelpCircle, Maximize2, Minimize2, Minus, Plus, RotateCcw, X } from 'lucide-react';
import { calculateLayeredLayout } from '@/utils/graph';
import type { KnowledgeRelation, TreeNode } from '@/types';

const colors: Record<string, string> = { prerequisite: '#8b5cf6', contains: '#f97316', detail: '#0ea5e9', example: '#22c55e', comparison: '#ef4444', related: '#64748b' };
const relationTypes = Object.keys(colors) as Array<Exclude<KnowledgeRelation, 'root'>>;
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

export function KnowledgeGraph() {
  const { nodes, edges, activeNodeId, setActiveNode } = useTreeStore();
  const viewportRef = useRef<HTMLDivElement>(null);
  const panRef = useRef<{ pointerId: number; startX: number; startY: number; originX: number; originY: number } | null>(null);
  const fitViewRef = useRef<() => void>(() => undefined);
  const [guideOpen, setGuideOpen] = useState(false);
  const [fullScreen, setFullScreen] = useState(false);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [localOnly, setLocalOnly] = useState(false);
  const [showAllRelations, setShowAllRelations] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [enabledTypes, setEnabledTypes] = useState<Set<string>>(new Set(relationTypes));
  const [minConfidence, setMinConfidence] = useState(0);
  const [viewportSize, setViewportSize] = useState({ width: 1000, height: 600 });
  const [transform, setTransform] = useState({ x: 20, y: 20, scale: 1 });

  useEffect(() => {
    if (!fullScreen) return;
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') setFullScreen(false); };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [fullScreen]);


  const visibleIds = useMemo(() => {
    const ids = new Set<string>();
    const visit = (id: string) => { if (ids.has(id) || !nodes[id]) return; ids.add(id); if (!collapsed.has(id)) nodes[id].children.forEach(visit); };
    Object.values(nodes).filter((node) => node.parentId === null || !nodes[node.parentId]).forEach((node) => visit(node.id));
    if (!localOnly || !activeNodeId || !nodes[activeNodeId]) return ids;
    const local = new Set<string>([activeNodeId]);
    let parentId = nodes[activeNodeId].parentId;
    while (parentId && nodes[parentId]) { local.add(parentId); parentId = nodes[parentId].parentId; }
    const addDescendants = (id: string, depth: number) => { if (depth <= 0) return; nodes[id]?.children.forEach((childId) => { local.add(childId); addDescendants(childId, depth - 1); }); };
    addDescendants(activeNodeId, 2);
    edges.forEach((edge) => { if (edge.sourceId === activeNodeId) local.add(edge.targetId); if (edge.targetId === activeNodeId) local.add(edge.sourceId); });
    return new Set([...ids].filter((id) => local.has(id)));
  }, [activeNodeId, collapsed, edges, localOnly, nodes]);

  const visibleNodes = useMemo(() => Object.fromEntries([...visibleIds].map((id) => [id, { ...nodes[id], parentId: nodes[id].parentId && visibleIds.has(nodes[id].parentId!) ? nodes[id].parentId : null, children: nodes[id].children.filter((child) => visibleIds.has(child)) }])), [nodes, visibleIds]);
  const layout = useMemo(() => calculateLayeredLayout(visibleNodes, Math.max(320, viewportSize.width - 24)), [viewportSize.width, visibleNodes]);
  const contentBounds = useMemo(() => {
    const points = [...layout.positions.values()];
    if (!points.length) return { minX: 0, minY: 0, width: layout.width, height: layout.height };
    const minX = Math.min(...points.map((point) => point.x)) - 110;
    const maxX = Math.max(...points.map((point) => point.x)) + 110;
    const minY = Math.min(...points.map((point) => point.y)) - 55;
    const maxY = Math.max(...points.map((point) => point.y)) + 55;
    return { minX, minY, width: Math.max(220, maxX - minX), height: Math.max(110, maxY - minY) };
  }, [layout]);
  const allEdges = useMemo(() => [
    ...Object.values(visibleNodes).filter((node) => node.parentId).map((node) => ({ id: `parent-${node.id}`, sourceId: node.parentId!, targetId: node.id, type: !node.relationType || node.relationType === 'root' ? 'contains' : node.relationType, reason: node.relationReason || '层级关系', confidence: 1 })),
    ...edges.filter((edge) => visibleIds.has(edge.sourceId) && visibleIds.has(edge.targetId) && (showAllRelations || Boolean(activeNodeId && (edge.sourceId === activeNodeId || edge.targetId === activeNodeId)))),
  ].filter((edge) => enabledTypes.has(edge.type) && edge.confidence >= minConfidence), [activeNodeId, edges, enabledTypes, minConfidence, showAllRelations, visibleIds, visibleNodes]);

  const fitView = useCallback(() => {
    const viewport = viewportRef.current; if (!viewport) return;
    const padding = viewport.clientWidth < 640 ? 16 : 36;
    const scale = clamp(Math.min((viewport.clientWidth - padding * 2) / contentBounds.width, (viewport.clientHeight - padding * 2) / contentBounds.height), 0.2, 1.6);
    setTransform({ scale, x: (viewport.clientWidth - contentBounds.width * scale) / 2 - contentBounds.minX * scale, y: (viewport.clientHeight - contentBounds.height * scale) / 2 - contentBounds.minY * scale });
  }, [contentBounds]);
  fitViewRef.current = fitView;
  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const observer = new ResizeObserver(([entry]) => {
      const width = Math.round(entry.contentRect.width); const height = Math.round(entry.contentRect.height);
      setViewportSize((current) => current.width === width && current.height === height ? current : { width, height });
      window.requestAnimationFrame(() => window.requestAnimationFrame(() => fitViewRef.current()));
    });
    observer.observe(viewport);
    return () => observer.disconnect();
  }, [fullScreen]);
  useLayoutEffect(() => {
    const first = window.requestAnimationFrame(() => {
      fitViewRef.current();
      window.setTimeout(() => fitViewRef.current(), 120);
    });
    return () => window.cancelAnimationFrame(first);
  }, [fullScreen, localOnly, layout.positions]);
  const zoomAtCenter = (factor: number) => { const viewport = viewportRef.current; if (!viewport) return; const cx = viewport.clientWidth / 2; const cy = viewport.clientHeight / 2; setTransform((current) => { const scale = clamp(current.scale * factor, 0.2, 3); return { scale, x: cx - (cx - current.x) * (scale / current.scale), y: cy - (cy - current.y) * (scale / current.scale) }; }); };
  const centerNode = (id: string) => { const point = layout.positions.get(id); const viewport = viewportRef.current; if (!point || !viewport) return; setTransform((current) => ({ ...current, x: viewport.clientWidth / 2 - point.x * current.scale, y: viewport.clientHeight / 2 - point.y * current.scale })); };
  const toggleCollapsed = (id: string) => setCollapsed((current) => { const next = new Set(current); if (next.has(id)) next.delete(id); else next.add(id); return next; });

  if (!Object.keys(nodes).length) return <div className="h-full flex items-center justify-center text-gray-400">创建知识点后可查看图谱</div>;
  return <div className={`${fullScreen ? 'fixed inset-0 z-[90] h-screen w-screen' : 'h-full w-full'} flex min-h-0 flex-col overflow-hidden bg-slate-50`}>
    <div className="z-10 flex flex-wrap items-center gap-1.5 border-b bg-white/95 p-2 text-xs shadow-sm sm:gap-2">
      <button onClick={() => zoomAtCenter(1.2)} title="放大" className="rounded-lg border p-2"><Plus className="h-4 w-4" /></button><button onClick={() => zoomAtCenter(1 / 1.2)} title="缩小" className="rounded-lg border p-2"><Minus className="h-4 w-4" /></button><button onClick={fitView} title="适应窗口" className="rounded-lg border p-2"><Expand className="h-4 w-4" /></button><button onClick={() => setTransform({ x: 20, y: 20, scale: 1 })} title="恢复 100%" className="rounded-lg border p-2"><RotateCcw className="h-4 w-4" /></button>
      <span className="min-w-12 text-center text-gray-500">{Math.round(transform.scale * 100)}%</span>
      <button disabled={!activeNodeId} onClick={() => activeNodeId && centerNode(activeNodeId)} title="定位当前节点" className="rounded-lg border p-2 disabled:opacity-30"><Focus className="h-4 w-4" /></button><button onClick={() => setLocalOnly((value) => !value)} className={`rounded-lg border px-2.5 py-2 ${localOnly ? 'border-primary bg-orange-50 text-primary' : ''}`}>局部视图</button>
      <button onClick={() => setShowAllRelations((value) => !value)} className={`rounded-lg border px-2.5 py-2 ${showAllRelations ? 'border-primary bg-orange-50 text-primary' : ''}`} title="切换语义关系显示范围">{showAllRelations ? '全部关系' : '聚焦关系'}</button>
      <div className="relative"><button onClick={() => setFiltersOpen((value) => !value)} className="flex items-center gap-1 rounded-lg border px-2.5 py-2">筛选<ChevronDown className="h-3.5 w-3.5" /></button>{filtersOpen && <div className="absolute left-0 top-10 z-30 w-64 rounded-xl border bg-white p-3 shadow-xl"><p className="mb-2 font-semibold">关系类型</p><div className="grid grid-cols-2 gap-2">{relationTypes.map((type) => <label key={type} className="flex items-center gap-2"><input type="checkbox" checked={enabledTypes.has(type)} onChange={() => setEnabledTypes((current) => { const next = new Set(current); if (next.has(type)) next.delete(type); else next.add(type); return next; })} /><i className="h-1.5 w-4 rounded" style={{ background: colors[type] }} />{type}</label>)}</div><label className="mt-4 block"><span className="flex justify-between"><b>最低置信度</b><span>{Math.round(minConfidence * 100)}%</span></span><input type="range" min="0" max="0.95" step="0.05" value={minConfidence} onChange={(event) => setMinConfidence(Number(event.target.value))} className="mt-2 w-full" /></label></div>}</div>
      <button onClick={() => setGuideOpen(true)} className="ml-auto flex items-center gap-1 rounded-lg border px-2.5 py-2 text-blue-600"><HelpCircle className="h-4 w-4" /><span className="hidden sm:inline">使用指南</span></button><button onClick={() => { setFullScreen((value) => !value); window.setTimeout(() => fitViewRef.current(), 180); }} title={fullScreen ? '退出全屏' : '全屏'} className="rounded-lg border p-2">{fullScreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}</button>
    </div>
    <div ref={viewportRef} className="relative min-h-0 flex-1 touch-none overflow-hidden bg-slate-100 cursor-grab active:cursor-grabbing" onWheel={(event) => { event.preventDefault(); const rect = event.currentTarget.getBoundingClientRect(); const px = event.clientX - rect.left; const py = event.clientY - rect.top; setTransform((current) => { const scale = clamp(current.scale * (event.deltaY < 0 ? 1.1 : 0.9), 0.2, 3); return { scale, x: px - (px - current.x) * (scale / current.scale), y: py - (py - current.y) * (scale / current.scale) }; }); }} onPointerDown={(event) => { if ((event.target as Element).closest('[data-node]')) return; event.currentTarget.setPointerCapture(event.pointerId); panRef.current = { pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, originX: transform.x, originY: transform.y }; }} onPointerMove={(event) => { const pan = panRef.current; if (pan?.pointerId === event.pointerId) setTransform((current) => ({ ...current, x: pan.originX + event.clientX - pan.startX, y: pan.originY + event.clientY - pan.startY })); }} onPointerUp={(event) => { if (panRef.current?.pointerId === event.pointerId) panRef.current = null; }}>
      <svg width="100%" height="100%" className="select-none"><defs><marker id="arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="#94a3b8" /></marker></defs><g transform={`translate(${transform.x} ${transform.y}) scale(${transform.scale})`}>
        {allEdges.map((edge) => { const source = layout.positions.get(edge.sourceId); const target = layout.positions.get(edge.targetId); if (!source || !target) return null; const hierarchical = edge.id.startsWith('parent-'); const middleY = source.y + (target.y - source.y) / 2; return <g key={edge.id}><path d={`M ${source.x} ${source.y + 27} C ${source.x} ${middleY}, ${target.x} ${middleY}, ${target.x} ${target.y - 29}`} fill="none" stroke={colors[edge.type] || '#94a3b8'} strokeWidth={hierarchical ? 2 : edge.confidence > 0.8 ? 1.8 : 1.25} strokeDasharray={hierarchical ? undefined : '6 5'} markerEnd="url(#arrow)" opacity={hierarchical ? 0.78 : 0.62} /><title>{edge.type}: {edge.reason}（{Math.round(edge.confidence * 100)}%）</title></g>; })}
        {Object.values(visibleNodes).map((node: TreeNode) => { const point = layout.positions.get(node.id); if (!point) return null; const active = activeNodeId === node.id; const hasChildren = node.children.length > 0 || nodes[node.id].children.length > 0; return <g key={node.id} data-node="true" onClick={() => { setActiveNode(node.id); centerNode(node.id); }} className="cursor-pointer"><rect x={point.x - 88} y={point.y - 27} width="176" height="54" rx="14" fill={active ? '#fff7ed' : '#fff'} stroke={active ? '#f97316' : '#cbd5e1'} strokeWidth={active ? 3 : 1.5} /><text x={point.x} y={point.y + 4} textAnchor="middle" fontSize="13" fill="#334155">{node.title.length > 18 ? `${node.title.slice(0, 18)}…` : node.title}</text>{hasChildren && <g onClick={(event) => { event.stopPropagation(); toggleCollapsed(node.id); }}><circle cx={point.x + 76} cy={point.y + 20} r="10" fill={collapsed.has(node.id) ? '#f97316' : '#e2e8f0'} /><text x={point.x + 76} y={point.y + 24} textAnchor="middle" fontSize="14" fill={collapsed.has(node.id) ? '#fff' : '#475569'}>{collapsed.has(node.id) ? '+' : '−'}</text></g>}<title>{node.title}；点击定位，右下角按钮折叠/展开子树</title></g>; })}
      </g></svg>
      <div className="pointer-events-none absolute bottom-3 left-3 rounded-lg bg-white/90 px-3 py-2 text-xs text-gray-500 shadow">拖动空白处移动 · 滚轮缩放 · 点击节点居中</div>
    </div>
    {guideOpen && createPortal(<div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/40 p-4" onClick={() => setGuideOpen(false)}><div className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl sm:p-6" onClick={(event) => event.stopPropagation()}><div className="flex items-center justify-between"><h3 className="text-lg font-bold">知识图谱使用指南</h3><button onClick={() => setGuideOpen(false)}><X className="h-5 w-5" /></button></div><div className="mt-4 space-y-4 text-sm text-gray-600"><p><b>浏览：</b>滚轮缩放，拖动空白处平移；点击节点会选中并自动居中。“适应窗口”展示全部内容，“恢复100%”回到原始比例。</p><p><b>范围：</b>节点右下角的 ± 可折叠或展开子树；“局部视图”只显示当前节点的祖先、两层后代和直接横向关系。</p><p><b>筛选：</b>可按关系类型开关连线，并设置最低置信度。实线是父子层级，虚线是横向关系，线条越粗置信度越高。</p><div className="grid grid-cols-2 gap-2">{relationTypes.map((type) => <span key={type} className="flex items-center gap-2"><i className="h-1.5 w-6 rounded" style={{ background: colors[type] }} /><b>{type}</b></span>)}</div><p><b>全屏：</b>右上角按钮进入或退出全屏图谱，手机和平板同样支持拖动和缩放按钮。</p></div><div className="mt-5 text-right"><button onClick={() => setGuideOpen(false)} className="rounded-lg bg-primary px-4 py-2 text-white">知道了</button></div></div></div>, document.body)}
  </div>;
}
