'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Save, Play, Upload, Send, Maximize2, Minimize2, FileText, Trash2,
  ArrowLeft, AlertTriangle, CheckCircle2, Loader2
} from 'lucide-react';

type ReportFile = { id: string; fileName: string; url: string };

const TABS = [
  { key: 'html', label: 'index.html' },
  { key: 'css', label: 'style.css' },
  { key: 'js', label: 'script.js' }
] as const;

type TabKey = (typeof TABS)[number]['key'];

export default function WorkspaceClient({
  laboratoryId,
  laboratoryTitle,
  submissionId,
  submissionStatus,
  isLocked,
  isDeadlinePassed,
  initialHtml,
  initialCss,
  initialJs,
  reportFiles: initialReportFiles
}: {
  laboratoryId: string;
  laboratoryTitle: string;
  submissionId: string | null;
  submissionStatus: string;
  isLocked: boolean;
  isDeadlinePassed: boolean;
  initialHtml: string;
  initialCss: string;
  initialJs: string;
  reportFiles: ReportFile[];
}) {
  const router = useRouter();
  const [html, setHtml] = useState(initialHtml);
  const [css, setCss] = useState(initialCss);
  const [js, setJs] = useState(initialJs);
  const [activeTab, setActiveTab] = useState<TabKey>('html');
  const [mobileView, setMobileView] = useState<'code' | 'preview'>('code');
  const [fullscreen, setFullscreen] = useState(false);
  const [previewKey, setPreviewKey] = useState(0);
  const [reportFiles, setReportFiles] = useState(initialReportFiles);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingReport, setUploadingReport] = useState(false);
  const [message, setMessage] = useState<{ type: 'ok' | 'error'; text: string } | null>(null);
  const disabled = isLocked;

  const editorValue = { html, css, js }[activeTab];
  const setEditorValue = { html: setHtml, css: setCss, js: setJs }[activeTab];

  // Live preview — tahrirlanayotgan kod darhol, serverga so'rov jo'natmasdan ko'rsatiladi.
  const srcDoc = useMemo(() => {
    const safeHtml = html.replace(/<link[^>]+stylesheet[^>]*>/gi, '').replace(/<script[^>]+src=["']script\.js["'][^>]*>\s*<\/script>/gi, '');
    const doc = safeHtml.includes('</head>')
      ? safeHtml.replace('</head>', `<style>${css}</style></head>`)
      : `<style>${css}</style>${safeHtml}`;
    return doc.includes('</body>') ? doc.replace('</body>', `<script>${js}<\/script></body>`) : `${doc}<script>${js}<\/script>`;
  }, [html, css, js]);

  async function uploadFile(fileName: string, content: string, mime: string, kind: 'web' | 'report') {
    const blob = new Blob([content], { type: mime });
    const formData = new FormData();
    formData.append('file', blob, fileName);
    formData.append('kind', kind);
    formData.append('path', fileName);
    const res = await fetch(`/api/student/laboratories/${laboratoryId}/upload`, { method: 'POST', body: formData });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    return data;
  }

  async function handleSave() {
    setSaving(true);
    setMessage(null);
    try {
      await uploadFile('index.html', html, 'text/html', 'web');
      await uploadFile('style.css', css, 'text/css', 'web');
      await uploadFile('script.js', js, 'application/javascript', 'web');
      setMessage({ type: 'ok', text: 'Loyiha saqlandi.' });
      router.refresh();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Saqlashda xatolik.' });
    } finally {
      setSaving(false);
    }
  }

  async function handleTest() {
    await handleSave();
    setPreviewKey((k) => k + 1);
    setMobileView('preview');
  }

  async function handleReportUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingReport(true);
    setMessage(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('kind', 'report');
      formData.append('path', file.name);
      const res = await fetch(`/api/student/laboratories/${laboratoryId}/upload`, { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setReportFiles((prev) => [...prev, { id: data.id, fileName: file.name, url: data.url }]);
      router.refresh();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Hisobot yuklashda xatolik.' });
    } finally {
      setUploadingReport(false);
      e.target.value = '';
    }
  }

  async function handleDeleteReport(id: string) {
    await fetch(`/api/student/files/${id}?kind=report`, { method: 'DELETE' });
    setReportFiles((prev) => prev.filter((f) => f.id !== id));
  }

  async function handleSubmit() {
    if (!confirm("Laboratoriyani topshirishni tasdiqlaysizmi? Topshirgandan keyin o'zgartirib bo'lmaydi.")) return;
    setSubmitting(true);
    setMessage(null);
    try {
      await handleSave();
      const res = await fetch(`/api/student/laboratories/${laboratoryId}/submit`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMessage({ type: 'ok', text: 'Laboratoriya muvaffaqiyatli topshirildi!' });
      router.refresh();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Topshirishda xatolik.' });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={fullscreen ? 'fixed inset-0 z-50 flex flex-col bg-white dark:bg-slate-950' : 'flex h-[calc(100vh-0px)] flex-col'}>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-3">
          {!fullscreen && (
            <Link href={`/student/laboratories/${laboratoryId}`} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
              <ArrowLeft size={18} />
            </Link>
          )}
          <span className="text-sm font-semibold">{laboratoryTitle}</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setFullscreen((f) => !f)} className="btn-secondary !px-3 !py-2">
            {fullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
          </button>
        </div>
      </div>

      {isLocked && (
        <div className="flex items-center gap-2 bg-emerald-50 px-4 py-2 text-sm text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
          <CheckCircle2 size={16} /> Bu laboratoriya topshirilgan ({submissionStatus === 'REVIEWED' ? 'tekshirilgan' : 'topshirilgan'}) — tahrirlash yopilgan.
        </div>
      )}
      {isDeadlinePassed && !isLocked && (
        <div className="flex items-center gap-2 bg-red-50 px-4 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
          <AlertTriangle size={16} /> Deadline o'tib ketgan. Fayl saqlab/topshirib bo'lmaydi.
        </div>
      )}

      {/* Mobile view toggle */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 lg:hidden">
        <button onClick={() => setMobileView('code')} className={`flex-1 py-2.5 text-sm font-medium ${mobileView === 'code' ? 'border-b-2 border-brand-600 text-brand-600' : 'text-slate-400'}`}>Kod</button>
        <button onClick={() => setMobileView('preview')} className={`flex-1 py-2.5 text-sm font-medium ${mobileView === 'preview' ? 'border-b-2 border-brand-600 text-brand-600' : 'text-slate-400'}`}>Preview</button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Code editor */}
        <div className={`flex w-full flex-col lg:w-1/2 lg:border-r lg:border-slate-200 dark:lg:border-slate-800 ${mobileView === 'preview' ? 'hidden lg:flex' : 'flex'}`}>
          <div className="flex border-b border-slate-200 dark:border-slate-800">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2.5 text-xs font-mono font-medium ${activeTab === tab.key ? 'border-b-2 border-brand-600 text-brand-600' : 'text-slate-400'}`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <textarea
            className="flex-1 resize-none bg-slate-900 p-4 font-mono text-sm text-slate-100 outline-none"
            spellCheck={false}
            disabled={disabled}
            value={editorValue}
            onChange={(e) => setEditorValue(e.target.value)}
          />
        </div>

        {/* Live preview */}
        <div className={`w-full flex-col lg:flex lg:w-1/2 ${mobileView === 'code' ? 'hidden lg:flex' : 'flex'}`}>
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-2 text-xs font-medium text-slate-400 dark:border-slate-800">
            LIVE PREVIEW (izolyatsiya qilingan sandbox)
          </div>
          <iframe
            key={previewKey}
            title="preview"
            sandbox="allow-scripts"
            srcDoc={srcDoc}
            className="flex-1 bg-white"
          />
        </div>
      </div>

      {/* Footer actions */}
      {!fullscreen && (
        <div className="space-y-3 border-t border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          {message && (
            <div className={`rounded-xl px-3.5 py-2 text-sm ${message.type === 'ok' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
              {message.text}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <button onClick={handleSave} disabled={disabled || saving} className="btn-secondary">
              {saving ? <Loader2 className="animate-spin" size={15} /> : <Save size={15} />} Saqlash
            </button>
            <button onClick={handleTest} disabled={disabled || saving} className="btn-secondary">
              <Play size={15} /> Sinash
            </button>
            {submissionId && (
              <a href={`/preview/${submissionId}`} target="_blank" className="btn-secondary">
                Virtual Lab'da ochish
              </a>
            )}
            <label className="btn-secondary cursor-pointer">
              {uploadingReport ? <Loader2 className="animate-spin" size={15} /> : <Upload size={15} />} Hisobot yuklash
              <input type="file" className="hidden" disabled={disabled} onChange={handleReportUpload} accept=".doc,.docx,.pdf,.png,.jpeg,.jpg,.txt,.ppt,.pptx" />
            </label>
            <div className="grow" />
            <button onClick={handleSubmit} disabled={disabled || submitting} className="btn-primary">
              {submitting ? <Loader2 className="animate-spin" size={15} /> : <Send size={15} />} Topshirish
            </button>
          </div>

          {reportFiles.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {reportFiles.map((f) => (
                <span key={f.id} className="flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs dark:bg-slate-800">
                  <FileText size={12} /> {f.fileName}
                  {!disabled && (
                    <button onClick={() => handleDeleteReport(f.id)} className="text-red-400 hover:text-red-600">
                      <Trash2 size={12} />
                    </button>
                  )}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
