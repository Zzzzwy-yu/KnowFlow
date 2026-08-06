import { Waves, Sparkles, PanelLeftClose, PanelLeftOpen, X, AlertTriangle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { ChatInput } from '@/components/ChatInput';
import { TreeNavigator } from '@/components/TreeNavigator';
import { DetailPanel, EmptyPanel } from '@/components/DetailPanel';
import { useChat } from '@/hooks/useChat';
import { useTreeStore } from '@/store/chatStore';
import { KnowledgeGraph } from '@/components/KnowledgeGraph';
import { MaterialImportModal } from '@/components/MaterialImportModal';

function App() {
  const [treeOpen, setTreeOpen] = useState(() => window.innerWidth >= 1024);
  const [viewMode, setViewMode] = useState<'detail' | 'graph'>('detail');
  const [materialOpen, setMaterialOpen] = useState(false);
  const [importNotice, setImportNotice] = useState<string | null>(null);
  const { nodes, activeNodeId, isLoading, sendMessage, explainWord, error, clearError, answerDepth, setAnswerDepth, stopGeneration, regenerate, queueMessage, queuedCount } = useChat();
  const activeNode = activeNodeId ? nodes[activeNodeId] : null;
  const { updateNode, deleteNode, moveNode, undo, redo } = useTreeStore();

  useEffect(() => {
    const handleHistoryShortcut = (event: KeyboardEvent) => {
      if (!(event.ctrlKey || event.metaKey) || event.key.toLowerCase() !== 'z') return;
      const target = event.target as HTMLElement | null;
      if (target?.closest('input, textarea, [contenteditable="true"]')) return;
      event.preventDefault();
      if (event.shiftKey) redo(); else undo();
    };
    window.addEventListener('keydown', handleHistoryShortcut);
    return () => window.removeEventListener('keydown', handleHistoryShortcut);
  }, [redo, undo]);

  const handleWordClick = (word: string) => {
    if (activeNodeId) {
      explainWord(word, activeNodeId);
    }
  };

  return (
    <div className="h-screen min-h-0 bg-gradient-to-br from-gray-50 to-orange-50 flex flex-col overflow-hidden">
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-2 py-2.5 sm:px-4 sm:py-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <button onClick={() => setTreeOpen((open) => !open)} className="p-2 rounded-lg hover:bg-gray-100" aria-label="切换知识树" title={treeOpen ? '收起知识树' : '展开知识树'}>{treeOpen ? <PanelLeftClose className="w-5 h-5" /> : <PanelLeftOpen className="w-5 h-5" />}</button>
            <div className="hidden h-9 w-9 sm:flex sm:h-10 sm:w-10 bg-gradient-to-br from-primary to-orange-400 rounded-xl items-center justify-center shadow-lg">
            <Waves className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-base sm:text-xl font-bold text-secondary">KnowFlow</h1>
            <p className="hidden text-xs text-gray-500 sm:block">AI 交互式学习助手</p>
          </div>
          </div>
          <div className="flex items-center gap-2 text-primary text-sm font-medium">
            <div className="flex rounded-lg bg-gray-100 p-1"><button onClick={() => setViewMode('detail')} className={`rounded px-2 py-1 text-xs sm:px-3 ${viewMode === 'detail' ? 'bg-white shadow text-primary' : 'text-gray-500'}`}>详情</button><button onClick={() => setViewMode('graph')} className={`rounded px-2 py-1 text-xs sm:px-3 ${viewMode === 'graph' ? 'bg-white shadow text-primary' : 'text-gray-500'}`}>图谱</button></div>
            <Sparkles className="hidden w-4 h-4 xl:block" />
            <span className="hidden xl:inline">点击橙色词语深入了解</span>
          </div>
        </div>
      </header>

      <main className="relative min-h-0 flex-1 flex overflow-hidden">
        {treeOpen && <button className="absolute inset-0 z-20 bg-black/30 lg:hidden" onClick={() => setTreeOpen(false)} aria-label="关闭知识树" />}
        <div className={`${treeOpen ? 'flex' : 'hidden'} absolute inset-y-0 left-0 z-30 w-[88vw] max-w-80 lg:static lg:w-80 flex-shrink-0 bg-white border-r border-gray-200 flex-col shadow-xl lg:shadow-none`}>
          <TreeNavigator onImportMaterial={() => setMaterialOpen(true)} />
        </div>

        <div className="relative flex-1 flex flex-col overflow-hidden">
          {viewMode === 'graph' ? <KnowledgeGraph /> : activeNode ? (
            <DetailPanel node={activeNode} nodes={nodes} onWordClick={handleWordClick} onUpdate={updateNode} onDelete={deleteNode} onMove={moveNode} onRegenerate={regenerate} isLoading={isLoading} />
          ) : isLoading ? (
            <div className="h-full flex flex-col items-center justify-center">
              <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4" />
              <p className="text-gray-500">AI 正在思考中...</p>
            </div>
          ) : (
            <EmptyPanel onImportMaterial={() => setMaterialOpen(true)} />
          )}
          {isLoading && activeNode && <div className="absolute left-2 right-2 top-2 z-20 flex items-center justify-center gap-2 rounded-full bg-white/95 px-3 py-2 text-xs text-gray-600 shadow sm:left-auto sm:right-4 sm:top-4"><span className="h-3 w-3 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />正在生成新知识点，当前内容仍可浏览</div>}
        </div>
      </main>

      <ChatInput onSend={sendMessage} isLoading={isLoading} activeNode={activeNode} answerDepth={answerDepth} onDepthChange={setAnswerDepth} onStop={stopGeneration} onQueue={queueMessage} queuedCount={queuedCount} compact={viewMode === 'graph'} />
      {error && <div className="fixed left-3 right-3 top-16 z-[70] flex max-w-md items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 shadow-lg sm:left-auto sm:right-4 sm:top-20"><AlertTriangle className="w-5 h-5 shrink-0" /><span className="flex-1">{error}</span><button onClick={clearError} aria-label="关闭提示"><X className="w-4 h-4" /></button></div>}
      <MaterialImportModal open={materialOpen} onClose={() => setMaterialOpen(false)} onSuccess={(count) => { setImportNotice(`资料导入成功，已生成 ${count} 个知识点。`); window.setTimeout(() => setImportNotice(null), 4000); }} />
      {importNotice && <div className="fixed bottom-28 left-1/2 z-[100] -translate-x-1/2 rounded-xl bg-green-600 px-4 py-3 text-sm text-white shadow-xl sm:bottom-32">{importNotice}</div>}
    </div>
  );
}

export default App;
