import { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { FileText, Upload, X } from 'lucide-react';
import { chatApi } from '@/utils/apiClient';
import { useTreeStore } from '@/store/chatStore';
import type { TreeNode } from '@/types';

interface Props { open: boolean; onClose: () => void; onSuccess?: (count: number) => void; }

export function MaterialImportModal({ open, onClose, onSuccess }: Props) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [kind, setKind] = useState<NonNullable<TreeNode['source']>['kind']>('paste');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const importMaterial = useTreeStore((state) => state.importMaterial);

  if (!open) return null;
  const pickFile = async (file?: File) => {
    if (!file) return;
    if (file.size > 100_000) { setError('当前单个资料最大支持 100 KB。'); return; }
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (!['md', 'markdown', 'txt'].includes(extension || '')) { setError('目前支持 Markdown 和 TXT 文件。'); return; }
    try {
      const text = await file.text();
      if (!text.trim()) throw new Error('文件内容为空。');
      setTitle(file.name.replace(/\.[^.]+$/, ''));
      setKind(extension === 'txt' ? 'text' : 'markdown');
      setContent(text);
      setError(null);
    } catch (reason) { setError(reason instanceof Error ? reason.message : '文件读取失败。'); }
  };
  const submit = async () => {
    if (!title.trim() || !content.trim() || loading) return;
    setLoading(true); setError(null); abortRef.current = new AbortController();
    try {
      const result = await chatApi.importMaterial(title.trim(), content.trim(), abortRef.current.signal);
      const count = importMaterial(result, { name: title.trim(), kind });
      if (!count) throw new Error('没有从资料中提取到有效知识点。');
      setTitle(''); setContent(''); onSuccess?.(count); onClose();
    } catch (reason) {
      if (!abortRef.current.signal.aborted) setError(reason instanceof Error ? reason.message : '资料提取失败，请稍后重试。');
    } finally { setLoading(false); abortRef.current = null; }
  };
  return createPortal(<div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/40 p-3 sm:p-5" onClick={() => !loading && onClose()}><div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl" onClick={(event) => event.stopPropagation()}><div className="flex items-center justify-between border-b px-4 py-3 sm:px-6 sm:py-4"><div><h3 className="font-bold text-gray-800">从资料生成知识图谱</h3><p className="text-xs text-gray-500">支持 Markdown、TXT 或直接粘贴长文本</p></div><button disabled={loading} onClick={onClose} className="disabled:opacity-30"><X className="h-5 w-5" /></button></div><div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-6"><label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-200 p-5 text-sm text-gray-500 hover:border-primary hover:text-primary"><Upload className="h-5 w-5" />选择 Markdown 或 TXT<input type="file" accept=".md,.markdown,.txt,text/plain,text/markdown" className="hidden" onChange={(event) => pickFile(event.target.files?.[0])} /></label>{content && <div className="rounded-lg bg-green-50 px-3 py-2 text-xs text-green-700">已读取资料：{title || '未命名'}（{content.length} 字符）</div>}<label className="block"><span className="mb-1 block text-sm font-medium">资料名称</span><input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="例如：机器学习课程第一章" maxLength={200} className="w-full rounded-xl border px-3 py-2 outline-none focus:border-primary" /></label><label className="block"><span className="mb-1 flex items-center gap-1 text-sm font-medium"><FileText className="h-4 w-4" />资料正文</span><textarea value={content} onChange={(event) => { setContent(event.target.value.slice(0, 100000)); setKind('paste'); }} rows={12} placeholder="粘贴需要整理的文章、课堂笔记或学习资料……" className="w-full resize-y rounded-xl border p-3 text-sm leading-relaxed outline-none focus:border-primary" /><span className="block text-right text-xs text-gray-400">{content.length}/100000</span></label>{loading && <div className="flex items-center gap-3 rounded-lg bg-blue-50 p-3 text-sm text-blue-700"><span className="h-4 w-4 animate-spin rounded-full border-2 border-blue-200 border-t-blue-600" />正在读取资料结构并生成知识图谱，通常需要数秒……</div>}{error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>}</div><div className="flex justify-end gap-3 border-t px-4 py-3 sm:px-6 sm:py-4">{loading ? <button onClick={() => abortRef.current?.abort()} className="rounded-lg border border-red-200 px-4 py-2 text-red-600">停止提取</button> : <button onClick={onClose} className="rounded-lg border px-4 py-2">取消</button>}<button onClick={submit} disabled={loading || !title.trim() || !content.trim()} className="rounded-lg bg-primary px-4 py-2 text-white disabled:opacity-40">{loading ? 'AI 正在提取…' : '生成知识图谱'}</button></div></div></div>, document.body);
}
