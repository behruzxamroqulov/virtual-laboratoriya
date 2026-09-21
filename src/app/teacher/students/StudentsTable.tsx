'use client';

import { useState } from 'react';
import { Plus, Pencil, Trash2, X } from 'lucide-react';

type Student = {
  id: string;
  firstName: string;
  lastName: string;
  group: string;
  studentId: string;
  login: string;
  active: boolean;
};

export default function StudentsTable({ initialStudents }: { initialStudents: Student[] }) {
  const [students, setStudents] = useState(initialStudents);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Student | null>(null);
  const [form, setForm] = useState({ firstName: '', lastName: '', login: '', password: '', group: '', studentId: '' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  function openCreate() {
    setEditing(null);
    setForm({ firstName: '', lastName: '', login: '', password: '', group: '', studentId: '' });
    setError('');
    setShowModal(true);
  }

  function openEdit(s: Student) {
    setEditing(s);
    setForm({ firstName: s.firstName, lastName: s.lastName, login: s.login, password: '', group: s.group, studentId: s.studentId });
    setError('');
    setShowModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (editing) {
        const res = await fetch(`/api/teacher/students/${editing.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            firstName: form.firstName,
            lastName: form.lastName,
            group: form.group,
            ...(form.password ? { password: form.password } : {})
          })
        });
        if (!res.ok) throw new Error((await res.json()).error);
        setStudents((prev) => prev.map((s) => (s.id === editing.id ? { ...s, ...form } : s)));
      } else {
        const res = await fetch('/api/teacher/students', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form)
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setStudents((prev) => [
          { id: data.student.studentProfile.id, ...form, active: true },
          ...prev
        ]);
      }
      setShowModal(false);
    } catch (err: any) {
      setError(err.message || 'Xatolik yuz berdi.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDeactivate(s: Student) {
    if (!confirm(`${s.firstName} ${s.lastName}ni deaktivatsiya qilishni tasdiqlaysizmi?`)) return;
    await fetch(`/api/teacher/students/${s.id}`, { method: 'DELETE' });
    setStudents((prev) => prev.filter((x) => x.id !== s.id));
  }

  return (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between border-b border-slate-200 p-4 dark:border-slate-800">
        <span className="text-sm text-slate-500">{students.length} ta talaba</span>
        <button onClick={openCreate} className="btn-primary">
          <Plus size={16} /> Yangi talaba
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-400 dark:bg-slate-800/50">
            <tr>
              <th className="px-4 py-3">Ism Familiya</th>
              <th className="px-4 py-3">Login</th>
              <th className="px-4 py-3">Guruh</th>
              <th className="px-4 py-3">Talaba ID</th>
              <th className="px-4 py-3">Holat</th>
              <th className="px-4 py-3 text-right">Amallar</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {students.map((s) => (
              <tr key={s.id}>
                <td className="px-4 py-3 font-medium">{s.firstName} {s.lastName}</td>
                <td className="px-4 py-3 text-slate-500">{s.login}</td>
                <td className="px-4 py-3">{s.group}</td>
                <td className="px-4 py-3 text-slate-500">{s.studentId}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs ${s.active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                    {s.active ? 'Faol' : 'Faol emas'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1.5">
                    <button onClick={() => openEdit(s)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
                      <Pencil size={15} />
                    </button>
                    <button onClick={() => handleDeactivate(s)} className="rounded-lg p-2 text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {students.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-slate-400">Hozircha talaba yo'q.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 dark:bg-slate-900">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">{editing ? 'Talabani tahrirlash' : 'Yangi talaba'}</h3>
              <button onClick={() => setShowModal(false)} className="rounded-lg p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Ism</label>
                  <input className="input" required value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
                </div>
                <div>
                  <label className="label">Familiya</label>
                  <input className="input" required value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="label">Login</label>
                <input className="input" required disabled={!!editing} value={form.login} onChange={(e) => setForm({ ...form, login: e.target.value })} />
              </div>
              <div>
                <label className="label">{editing ? "Yangi parol (o'zgartirish uchun)" : 'Parol'}</label>
                <input className="input" type="text" required={!editing} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Guruh</label>
                  <input className="input" required value={form.group} onChange={(e) => setForm({ ...form, group: e.target.value })} />
                </div>
                <div>
                  <label className="label">Talaba ID</label>
                  <input className="input" required disabled={!!editing} value={form.studentId} onChange={(e) => setForm({ ...form, studentId: e.target.value })} />
                </div>
              </div>
              {error && <div className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
              <button type="submit" disabled={saving} className="btn-primary w-full">
                {saving ? 'Saqlanmoqda...' : 'Saqlash'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
