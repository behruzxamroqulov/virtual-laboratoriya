'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ReviewForm({
  submissionId,
  initialGrade,
  initialFeedback
}: {
  submissionId: string;
  initialGrade?: number;
  initialFeedback: string;
}) {
  const router = useRouter();
  const [grade, setGrade] = useState(initialGrade?.toString() ?? '');
  const [feedback, setFeedback] = useState(initialFeedback);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  async function handleSave() {
    setSaving(true);
    setError('');
    setSaved(false);
    try {
      const res = await fetch(`/api/teacher/submissions/${submissionId}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ grade: grade ? Number(grade) : undefined, feedback })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSaved(true);
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Xatolik yuz berdi.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-4 gap-3">
        <div className="col-span-1">
          <label className="label">Ball (0-100)</label>
          <input type="number" min={0} max={100} className="input" value={grade} onChange={(e) => setGrade(e.target.value)} />
        </div>
      </div>
      <div>
        <label className="label">Izoh</label>
        <textarea className="input min-h-[100px]" value={feedback} onChange={(e) => setFeedback(e.target.value)} placeholder="Talabaga izoh qoldiring..." />
      </div>
      {error && <div className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
      {saved && <div className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700">Saqlandi.</div>}
      <button onClick={handleSave} disabled={saving} className="btn-primary">
        {saving ? 'Saqlanmoqda...' : 'Saqlash'}
      </button>
    </div>
  );
}
