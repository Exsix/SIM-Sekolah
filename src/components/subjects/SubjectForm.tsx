'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  BookOpen,
  Save,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Users,
  Layers,
  GraduationCap
} from 'lucide-react';

interface TeacherItem {
  id: string;
  name: string;
  nip: string | null;
}

interface SubjectFormProps {
  initialData?: {
    id?: string;
    code?: string;
    name?: string;
    category?: string | null;
    gradeLevel?: number | null;
    isActive?: boolean;
    teacherSubject?: Array<{
      teacher: { id: string; name: string };
    }>;
  };
  isEdit?: boolean;
}

export default function SubjectForm({ initialData, isEdit = false }: SubjectFormProps) {
  const router = useRouter();

  const [teachers, setTeachers] = useState<TeacherItem[]>([]);
  const [loadingTeachers, setLoadingTeachers] = useState(true);

  const initialTeacherIds = initialData?.teacherSubject?.map((ts) => ts.teacher.id) || [];

  const [formData, setFormData] = useState({
    code: initialData?.code || '',
    name: initialData?.name || '',
    category: initialData?.category || 'Muatan Nasional',
    gradeLevel: initialData?.gradeLevel ? String(initialData.gradeLevel) : '',
    isActive: initialData?.isActive ?? true,
    teacherIds: initialTeacherIds,
  });

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    async function loadTeachers() {
      try {
        const res = await fetch('/api/teachers?limit=100');
        const json = await res.json();
        if (json.data) setTeachers(json.data);
      } catch (err) {
        console.error('Failed to load teachers', err);
      } finally {
        setLoadingTeachers(false);
      }
    }
    loadTeachers();
  }, []);

  const handleTeacherToggle = (tId: string) => {
    setFormData((prev) => {
      const exists = prev.teacherIds.includes(tId);
      return {
        ...prev,
        teacherIds: exists
          ? prev.teacherIds.filter((id) => id !== tId)
          : [...prev.teacherIds, tId],
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const payload = {
        code: formData.code.trim().toUpperCase(),
        name: formData.name.trim(),
        category: formData.category || null,
        gradeLevel: formData.gradeLevel ? Number(formData.gradeLevel) : null,
        isActive: formData.isActive,
        teacherIds: formData.teacherIds,
      };

      const url = isEdit ? `/api/subjects/${initialData?.id}` : '/api/subjects';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Gagal menyimpan mata pelajaran');

      setSuccessMsg(isEdit ? 'Mata pelajaran berhasil diperbarui!' : 'Mata pelajaran berhasil ditambahkan!');
      const subjectId = isEdit ? initialData?.id : json.data.id;

      setTimeout(() => {
        router.push(`/dashboard/subjects/${subjectId}`);
        router.refresh();
      }, 1000);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  };

  const categoryOptions = [
    'Muatan Nasional',
    'Peminatan MIPA',
    'Peminatan IPS',
    'Peminatan Bahasa',
    'Muatan Lokal',
    'Bimbingan Konseling (BK)',
    'Pilihan / Tambahan',
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl flex items-center space-x-3 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl flex items-center space-x-3 text-sm">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-6">
        <h3 className="text-base font-semibold text-slate-800 border-b border-slate-100 pb-3 flex items-center">
          <BookOpen className="w-5 h-5 mr-2 text-indigo-600" />
          Identitas Mata Pelajaran
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Kode Mapel */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2">
              Kode Mata Pelajaran <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              placeholder="Contoh: MAT-10, BIO-11, FIS-10"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 focus:bg-white uppercase"
              required
            />
            <p className="text-xs text-slate-400 mt-1">Kode unik untuk identifikasi jadwal dan rapor</p>
          </div>

          {/* Nama Mapel */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2">
              Nama Mata Pelajaran <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              placeholder="Contoh: Matematika Peminatan, Kimia, Bahasa Inggris"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 focus:bg-white"
              required
            />
          </div>

          {/* Kategori */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2">
              Kategori Kurikulum
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 focus:bg-white"
            >
              {categoryOptions.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Tingkat Kelas */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2">
              Tingkat Kelas Sasaran
            </label>
            <select
              value={formData.gradeLevel}
              onChange={(e) => setFormData({ ...formData, gradeLevel: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 focus:bg-white"
            >
              <option value="">Semua Tingkat (Umum / Lintas Tingkat)</option>
              <option value="10">Kelas 10 (Fase E)</option>
              <option value="11">Kelas 11 (Fase F)</option>
              <option value="12">Kelas 12 (Fase F Lanjutan)</option>
            </select>
          </div>

          {/* Guru Pengampu (Multi-Select) */}
          <div className="md:col-span-2 space-y-2 pt-2 border-t border-slate-100">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
              Guru Pengampu Mata Pelajaran Ini
            </label>
            <p className="text-xs text-slate-400">
              Pilih satu atau beberapa guru yang ditugaskan mengajar mata pelajaran ini
            </p>

            <div className="max-h-56 overflow-y-auto border border-slate-200 rounded-xl p-3 bg-slate-50/50 space-y-2">
              {loadingTeachers ? (
                <div className="py-4 text-center text-xs text-slate-400">
                  <Loader2 className="w-4 h-4 animate-spin mx-auto mb-1 text-indigo-600" />
                  Memuat daftar guru...
                </div>
              ) : teachers.length === 0 ? (
                <div className="py-4 text-center text-xs text-slate-400">
                  Belum ada data guru terdaftar
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {teachers.map((t) => {
                    const isSelected = formData.teacherIds.includes(t.id);
                    return (
                      <label
                        key={t.id}
                        className={`p-2.5 rounded-xl border flex items-center space-x-3 cursor-pointer transition text-xs ${
                          isSelected
                            ? 'bg-indigo-50/80 border-indigo-300 text-indigo-900 font-semibold'
                            : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleTeacherToggle(t.id)}
                          className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                        />
                        <div className="min-w-0 flex-1 truncate">
                          <p className="truncate">{t.name}</p>
                          {t.nip && <span className="text-[10px] text-slate-400 font-mono">NIP: {t.nip}</span>}
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Status Aktif */}
          <div className="md:col-span-2 pt-1">
            <label className="inline-flex items-center space-x-2 text-sm font-medium text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
              />
              <span>Mata Pelajaran Aktif (Diajarkan pada kurikulum sekolah)</span>
            </label>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end space-x-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-5 py-2.5 border border-slate-200 text-slate-700 text-sm font-medium rounded-xl hover:bg-slate-50 transition"
        >
          Batal
        </button>
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl shadow-xs transition disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Menyimpan...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              {isEdit ? 'Simpan Perubahan' : 'Tambah Mata Pelajaran'}
            </>
          )}
        </button>
      </div>
    </form>
  );
}
