'use client';

import React, { useState, useEffect } from 'react';
import {
  Award,
  BookOpen,
  Calendar,
  Layers,
  Loader2,
  Plus,
  Save,
  Users,
  X,
  AlertCircle
} from 'lucide-react';
import { AssessmentType } from '@prisma/client';

interface GradeItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: {
    id?: string;
    name?: string;
    type?: AssessmentType;
    weight?: number;
    maxScore?: number;
    classId?: string;
    subjectId?: string;
    teacherId?: string;
  } | null;
  defaultClassId?: string;
  defaultSubjectId?: string;
}

const ASSESSMENT_TYPES: Array<{ key: AssessmentType; label: string; desc: string }> = [
  { key: 'TUGAS', label: 'Tugas Harian', desc: 'Latihan mandiri atau pekerjaan rumah' },
  { key: 'KUIS', label: 'Kuis Singkat', desc: 'Evaluasi pemahaman konsep cepat' },
  { key: 'ULANGAN', label: 'Ulangan Harian', desc: 'Tes formatif akhir bab / materi' },
  { key: 'UTS', label: 'PTS / UTS', desc: 'Penilaian Tengah Semester' },
  { key: 'UAS', label: 'PAS / UAS', desc: 'Penilaian Akhir Semester' },
  { key: 'PRAKTIK', label: 'Praktikum', desc: 'Keterampilan unjuk kerja di laboratorium' },
  { key: 'PROYEK', label: 'Tugas Proyek', desc: 'Pengerjaan produk atau karya kolaboratif' },
  { key: 'SIKAP', label: 'Penilaian Sikap', desc: 'Observasi profil pelajar & karakter' },
];

export default function GradeItemModal({
  isOpen,
  onClose,
  onSuccess,
  initialData,
  defaultClassId,
  defaultSubjectId,
}: GradeItemModalProps) {
  const isEdit = Boolean(initialData?.id);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [classes, setClasses] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [subjects, setSubjects] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  const [name, setName] = useState(initialData?.name || '');
  const [type, setType] = useState<AssessmentType>(initialData?.type || 'TUGAS');
  const [weight, setWeight] = useState(initialData?.weight ? String(initialData.weight) : '1.0');
  const [maxScore, setMaxScore] = useState(initialData?.maxScore ? String(initialData.maxScore) : '100');
  const [classId, setClassId] = useState(initialData?.classId || defaultClassId || '');
  const [subjectId, setSubjectId] = useState(initialData?.subjectId || defaultSubjectId || '');
  const [teacherId, setTeacherId] = useState(initialData?.teacherId || '');

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setName(initialData?.name || '');
      setType(initialData?.type || 'TUGAS');
      setWeight(initialData?.weight ? String(initialData.weight) : '1.0');
      setMaxScore(initialData?.maxScore ? String(initialData.maxScore) : '100');
      setClassId(initialData?.classId || defaultClassId || '');
      setSubjectId(initialData?.subjectId || defaultSubjectId || '');
      setTeacherId(initialData?.teacherId || '');
      setErrorMsg(null);
    }
  }, [isOpen, initialData, defaultClassId, defaultSubjectId]);

  useEffect(() => {
    if (!isOpen) return;

    async function loadRefs() {
      setLoadingData(true);
      try {
        const [resC, resS, resT] = await Promise.all([
          fetch('/api/classes'),
          fetch('/api/subjects?limit=100'),
          fetch('/api/teachers?limit=100'),
        ]);
        const [jsonC, jsonS, jsonT] = await Promise.all([resC.json(), resS.json(), resT.json()]);
        if (jsonC.data) setClasses(jsonC.data);
        if (jsonS.data) setSubjects(jsonS.data);
        if (jsonT.data) setTeachers(jsonT.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingData(false);
      }
    }
    loadRefs();
  }, [isOpen]);

  // When subject changes, suggest assigned teacher
  const handleSubjectChange = (newSubId: string) => {
    setSubjectId(newSubId);
    const sub = subjects.find((s) => s.id === newSubId);
    if (sub && sub.teacherSubject && sub.teacherSubject.length > 0 && !isEdit) {
      setTeacherId(sub.teacherSubject[0].teacher.id);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg(null);

    try {
      const url = isEdit ? `/api/grades/items/${initialData?.id}` : '/api/grades/items';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          type,
          weight: parseFloat(weight) || 1.0,
          maxScore: parseFloat(maxScore) || 100,
          classId,
          subjectId,
          teacherId,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Gagal menyimpan komponen penilaian');

      onSuccess();
      onClose();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Terjadi kesalahan sistem');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xl max-w-lg w-full my-8 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="bg-gradient-to-r from-slate-900 to-indigo-950 p-6 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-white/10 rounded-xl backdrop-blur-md">
              <Award className="w-5 h-5 text-indigo-300" />
            </div>
            <div>
              <h2 className="text-lg font-bold">
                {isEdit ? 'Perbarui Komponen Penilaian' : 'Buat Komponen Penilaian Baru'}
              </h2>
              <p className="text-xs text-indigo-200/80 mt-0.5">
                Konfigurasi tugas, ulangan harian, PTS, PAS, atau praktik
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="p-2 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {loadingData ? (
            <div className="py-12 text-center text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-indigo-600 mb-2" />
              <p className="text-xs">Memuat referensi...</p>
            </div>
          ) : (
            <div className="space-y-4 text-xs">
              {/* Kelas & Mapel */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Kelas <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={classId}
                    onChange={(e) => setClassId(e.target.value)}
                    required
                    disabled={isEdit}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 font-semibold text-slate-800 disabled:opacity-60"
                  >
                    <option value="">-- Pilih Kelas --</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Mata Pelajaran <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={subjectId}
                    onChange={(e) => handleSubjectChange(e.target.value)}
                    required
                    disabled={isEdit}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 font-medium text-slate-800 disabled:opacity-60"
                  >
                    <option value="">-- Pilih Mapel --</option>
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        [{s.code}] {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Nama Penilaian */}
              <div>
                <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Nama Penilaian / Judul Tugas <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Tugas 1 - Trigonometri, PTS Ganjil, Praktik Lab"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 font-medium text-slate-800"
                />
              </div>

              {/* Tipe Penilaian */}
              <div>
                <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Kategori Penilaian <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {ASSESSMENT_TYPES.map((t) => {
                    const isSelected = type === t.key;
                    return (
                      <button
                        key={t.key}
                        type="button"
                        onClick={() => setType(t.key)}
                        className={`p-2 rounded-xl border text-center transition ${
                          isSelected
                            ? 'bg-indigo-50 border-indigo-500 text-indigo-700 font-bold shadow-2xs'
                            : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                        }`}
                      >
                        <p className="text-[11px] font-semibold">{t.label}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Bobot & Skor Maksimal */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Bobot Penilaian (Weight) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    max="10"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 font-mono font-bold text-slate-800"
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">Tugas biasa: 1.0, PTS: 2.0, PAS: 3.0</p>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Skor Maksimal (Max Score) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="10"
                    max="1000"
                    value={maxScore}
                    onChange={(e) => setMaxScore(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 font-mono font-bold text-slate-800"
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">Standar nilai: 100</p>
                </div>
              </div>

              {/* Guru Penilai */}
              <div>
                <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Guru Penilai <span className="text-rose-500">*</span>
                </label>
                <select
                  value={teacherId}
                  onChange={(e) => setTeacherId(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 font-medium text-slate-800"
                >
                  <option value="">-- Pilih Guru Penilai --</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 border border-slate-200 text-slate-700 text-xs font-medium rounded-xl hover:bg-slate-50 transition"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting || loadingData}
              className="inline-flex items-center px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-xl shadow-xs transition disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5 mr-1.5" />
                  {isEdit ? 'Simpan Perubahan' : 'Buat Penilaian'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
