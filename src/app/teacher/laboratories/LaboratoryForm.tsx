'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type StudentOption = { id: string; name: string };

type InitialLab = {
  id?: string;
  number: number;
  title: string;
  topic: string;
  description: string;
  task: string;
  instructions: string;
  deadline: string;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  starterHtml: string;
  assignedStudentIds: string[];
};

const DEFAULT: InitialLab = {
  number: 1,
  title: '',
  topic: '',
  description: '',
  task: '',
  instructions: '',
  deadline: '',
  status: 'DRAFT',
  starterHtml: '',
  assignedStudentIds: []
};

export default function LaboratoryForm({ students, initial }: { students: StudentOption[]; initial?: InitialLab }) {
  const router = useRouter();
  const [form, setForm] = useState<InitialLab>(initial || DEFAULT);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  function toggleStudent(id: string) {
    setForm((f) => ({
      ...f,
      assignedStudentIds: f.assignedStudentIds.includes(id)
        ? f.assignedStudentIds.filter((x) => x !== id)
        : [...f.assignedStudentIds, id]
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload = {
        number: form.number,
        title: form.title,
        topic: form.topic,
        description: form.description,
        task: form.task,
        instructions: form.instructions,
        deadline: form.deadline,
        status: form.status,
        starterHtml: form.starterHtml,
        studentIds: form.assignedStudentIds
      };

      const url = initial?.id ? `/api/teacher/laboratories/${initial.id}` : '/api/teacher/laboratories';
      const method = initial?.id ? 'PATCH' : 'POST';

      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      router.push(`/teacher/laboratories/${data.laboratory.id}`);
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Xatolik yuz berdi.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-4 p-6">
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="label">Laboratoriya raqami</label>
          <input type="number" className="input" required min={1} value={form.number} onChange={(e) => setForm({ ...form, number: Number(e.target.value) })} />
        </div>
        <div className="col-span-2">
          <label className="label">Sarlavha</label>
          <input className="input" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        </div>
      </div>

      <div>
        <label className="label">Mavzu</label>
        <input className="input" required value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })} />
      </div>

      <div>
        <label className="label">Tavsif</label>
        <textarea className="input min-h-[80px]" required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
      </div>

      <div>
        <label className="label">Topshiriq</label>
        <textarea className="input min-h-[100px]" required value={form.task} onChange={(e) => setForm({ ...form, task: e.target.value })} />
      </div>

      <div>
        <label className="label">Qo'shimcha ko'rsatmalar (ixtiyoriy)</label>
        <textarea className="input min-h-[80px]" value={form.instructions} onChange={(e) => setForm({ ...form, instructions: e.target.value })} />
      </div>

      <div>
        <label className="label">Starter HTML (ixtiyoriy, talabaga boshlang'ich shablon sifatida beriladi)</label>
        <textarea className="input min-h-[100px] font-mono text-xs" value={form.starterHtml} onChange={(e) => setForm({ ...form, starterHtml: e.target.value })} placeholder="<!doctype html>..." />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Deadline</label>
          <input type="datetime-local" className="input" required value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} />
        </div>
        <div>
          <label className="label">Holat</label>
          <select className="input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as any })}>
            <option value="DRAFT">Qoralama</option>
            <option value="PUBLISHED">E'lon qilish</option>
            <option value="ARCHIVED">Arxivlash</option>
          </select>
        </div>
      </div>

      <div>
        <label className="label">Talabalarni biriktirish</label>
        <div className="max-h-56 space-y-1 overflow-y-auto rounded-xl border border-slate-200 p-3 dark:border-slate-700">
          {students.map((s) => (
            <label key={s.id} className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-slate-50 dark:hover:bg-slate-800">
              <input type="checkbox" checked={form.assignedStudentIds.includes(s.id)} onChange={() => toggleStudent(s.id)} />
              {s.name}
            </label>
          ))}
          {students.length === 0 && <p className="text-sm text-slate-400">Avval talabalarni qo'shing.</p>}
        </div>
      </div>

      {error && <div className="rounded-xl bg-red-50 px-3.5 py-2.5 text-sm text-red-700">{error}</div>}

      <button type="submit" disabled={saving} className="btn-primary w-full">
        {saving ? 'Saqlanmoqda...' : 'Saqlash'}
      </button>
    </form>
  );
}
