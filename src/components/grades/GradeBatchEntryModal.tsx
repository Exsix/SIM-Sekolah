'use client';

import React, { useState, useEffect } from 'react';
import {
  Award,
  BookOpen,
  CheckCircle2,
  Clock,
  Loader2,
  Save,
  Send,
  Users,
  X,
  AlertCircle,
  HelpCircle,
  Sparkles
} from 'lucide-react';

interface StudentRosterItem {
  student: {
    id: string;
    nis: string;
    nisn: string | null;
    name: string;
    gender: string;
    photoUrl: string | null;
  };
  grade: {
    id: string;
    score: number;
    notes: string | null;
    isPublished: boolean;
  } | null;
}

interface GradeItemDetail {
  id: string;
  name: string;
  type: string;
  weight: number;
  maxScore: number;
  class: { id: string; name: string };
  subject: { id: string; code: string; name: string };
  teacher: { id: string; name: string };
  roster: StudentRosterItem[];
}

interface GradeBatchEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  gradeItemId: string | null;
}

export default function GradeBatchEntryModal({
  isOpen,
  onClose,
  onSuccess,
  gradeItemId,
}: GradeBatchEntryModalProps) {
  const [detail, setDetail] = useState<GradeItemDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Score states: map of studentId -> { score: string, notes: string }
  const [scores, setScores] = useState<Record<string, { score: string; notes: string }>>({});
  const [isPublished, setIsPublished] = useState(true);

  // Quick fill input
  const [quickFillVal, setQuickFillVal] = useState('');

  useEffect(() => {
    if (!isOpen || !gradeItemId) return;

    async function loadItem() {
      setLoading(true);
      setErrorMsg(null);
      setSuccessMsg(null);
      try {
        const res = await fetch(`/api/grades/items/${gradeItemId}`);
        if (!res.ok) throw new Error('Gagal memuat komponen penilaian');
        const json = await res.json();
        const data: GradeItemDetail = json.data;
        setDetail(data);

        // Prepopulate scores from existing grades
        const initialScores: Record<string, { score: string; notes: string }> = {};
        for (const r of data.roster) {
          initialScores[r.student.id] = {
            score: r.grade !== null && r.grade !== undefined ? String(r.grade.score) : '',
            notes: r.grade?.notes || '',
          };
        }
        setScores(initialScores);

        // Published status
        const anyPublished = data.roster.some((r) => r.grade?.isPublished);
        setIsPublished(anyPublished || true);
      } catch (err: unknown) {
        setErrorMsg(err instanceof Error ? err.message : 'Terjadi kesalahan');
      } finally {
        setLoading(false);
      }
    }

    loadItem();
  }, [isOpen, gradeItemId]);

  const handleScoreChange = (studentId: string, val: string) => {
    setScores((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        score: val,
      },
    }));
  };

  const handleNotesChange = (studentId: string, val: string) => {
    setScores((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        notes: val,
      },
    }));
  };

  const handleApplyQuickFill = () => {
    if (!quickFillVal) return;
    const valNum = parseFloat(quickFillVal);
    if (isNaN(valNum) || valNum < 0 || (detail && valNum > detail.maxScore)) {
      alert(`Nilai harus antara 0 dan ${detail?.maxScore || 100}`);
      return;
    }
    setScores((prev) => {
      const next = { ...prev };
      for (const k of Object.keys(next)) {
        next[k] = { ...next[k], score: quickFillVal };
      }
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gradeItemId || !detail) return;

    setSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const payloadGrades = Object.entries(scores)
        .filter(([, v]) => v.score.trim() !== '')
        .map(([studentId, v]) => ({
          studentId,
          score: parseFloat(v.score),
          notes: v.notes.trim() || undefined,
        }));

      if (payloadGrades.length === 0) {
        throw new Error('Masukkan setidaknya satu nilai siswa sebelum menyimpan');
      }

      const res = await fetch(`/api/grades/items/${gradeItemId}/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isPublished,
          grades: payloadGrades,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Gagal menyimpan nilai');

      setSuccessMsg(`Berhasil menyimpan ${json.totalSaved} nilai siswa!`);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 700);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Terjadi kesalahan sistem');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  // Live stats calculation
  const validScores = Object.values(scores)
    .map((s) => parseFloat(s.score))
    .filter((n) => !isNaN(n));
  const avg =
    validScores.length > 0
      ? (validScores.reduce((a, b) => a + b, 0) / validScores.length).toFixed(1)
      : '0';
  const highest = validScores.length > 0 ? Math.max(...validScores) : 0;
  const lowest = validScores.length > 0 ? Math.min(...validScores) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xl max-w-4xl w-full my-8 overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 to-indigo-950 p-5 text-white flex items-center justify-between flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-white/10 rounded-xl backdrop-blur-md">
              <Award className="w-5 h-5 text-indigo-300" />
            </div>
            <div>
              <h2 className="text-base font-bold">
                Input & Koreksi Nilai Siswa
              </h2>
              {detail && (
                <p className="text-xs text-indigo-200/90 mt-0.5">
                  {detail.name} • <span className="font-semibold">{detail.class.name}</span> • {detail.subject.name}
                </p>
              )}
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

        {/* Body Content */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {loading ? (
            <div className="py-20 text-center text-slate-400">
              <Loader2 className="w-7 h-7 animate-spin mx-auto text-indigo-600 mb-2" />
              <p className="text-xs">Memuat daftar siswa kelas...</p>
            </div>
          ) : !detail ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              Komponen penilaian tidak ditemukan
            </div>
          ) : (
            <div className="space-y-4">
              {/* Top Control Bar & Live Stats */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
                {/* Stats */}
                <div className="flex items-center space-x-5 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Dinilai</span>
                    <span className="font-bold text-slate-900 font-mono text-sm">
                      {validScores.length} / {detail.roster.length}
                    </span>
                  </div>
                  <div className="h-7 w-px bg-slate-200"></div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Rata-Rata</span>
                    <span className="font-bold text-indigo-600 font-mono text-sm">{avg}</span>
                  </div>
                  <div className="h-7 w-px bg-slate-200"></div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Tertinggi</span>
                    <span className="font-bold text-emerald-600 font-mono text-sm">{highest}</span>
                  </div>
                  <div className="h-7 w-px bg-slate-200"></div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Terendah</span>
                    <span className="font-bold text-amber-600 font-mono text-sm">{lowest}</span>
                  </div>
                </div>

                {/* Quick Fill Tool */}
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    placeholder={`0 - ${detail.maxScore}`}
                    value={quickFillVal}
                    onChange={(e) => setQuickFillVal(e.target.value)}
                    className="w-24 px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-mono font-bold"
                  />
                  <button
                    type="button"
                    onClick={handleApplyQuickFill}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-medium transition shadow-2xs"
                  >
                    Set Semua
                  </button>
                </div>
              </div>

              {/* Student Grading Roster Table */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100/80 border-b border-slate-200 text-slate-600 uppercase tracking-wider text-[11px] font-semibold">
                    <tr>
                      <th className="py-2.5 px-3 w-10 text-center">No</th>
                      <th className="py-2.5 px-3">Nama Siswa</th>
                      <th className="py-2.5 px-3 w-28">NIS</th>
                      <th className="py-2.5 px-3 w-32">
                        Nilai (Maks: {detail.maxScore}) <span className="text-rose-500">*</span>
                      </th>
                      <th className="py-2.5 px-3">Catatan Evaluasi / Umpan Balik Guru</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {detail.roster.map((r, idx) => {
                      const sState = scores[r.student.id] || { score: '', notes: '' };
                      const numVal = parseFloat(sState.score);
                      const isPassing = !isNaN(numVal) && numVal >= 75;

                      return (
                        <tr key={r.student.id} className="hover:bg-slate-50/70 transition">
                          <td className="py-2.5 px-3 text-center font-mono text-slate-400">
                            {idx + 1}
                          </td>
                          <td className="py-2.5 px-3 font-semibold text-slate-900">
                            {r.student.name}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-slate-500">
                            {r.student.nis}
                          </td>
                          <td className="py-2 px-3">
                            <div className="flex items-center space-x-1.5">
                              <input
                                type="number"
                                min="0"
                                max={detail.maxScore}
                                step="0.5"
                                placeholder="0"
                                value={sState.score}
                                onChange={(e) => handleScoreChange(r.student.id, e.target.value)}
                                className={`w-20 px-2.5 py-1.5 border rounded-xl font-mono font-bold text-center text-xs focus:outline-none focus:ring-2 ${
                                  sState.score.trim() === ''
                                    ? 'border-slate-200 bg-slate-50 text-slate-800 focus:bg-white focus:ring-indigo-500/20'
                                    : isPassing
                                    ? 'border-emerald-300 bg-emerald-50/60 text-emerald-900 focus:ring-emerald-500/20'
                                    : 'border-amber-300 bg-amber-50/60 text-amber-900 focus:ring-amber-500/20'
                                }`}
                              />
                              {sState.score.trim() !== '' && (
                                <span className={`text-[10px] font-bold ${isPassing ? 'text-emerald-600' : 'text-amber-600'}`}>
                                  {isPassing ? 'Tuntas' : 'Remedi'}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="text"
                              placeholder="Catatan guru (opsional)..."
                              value={sState.notes}
                              onChange={(e) => handleNotesChange(r.student.id, e.target.value)}
                              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between flex-shrink-0">
          <label className="flex items-center space-x-2 text-xs font-medium text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={isPublished}
              onChange={(e) => setIsPublished(e.target.checked)}
              className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
            />
            <span>Publikasikan nilai ke portal dan rapor siswa langsung</span>
          </label>

          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 border border-slate-200 text-slate-700 text-xs font-medium rounded-xl hover:bg-white transition"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting || loading}
              className="inline-flex items-center px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs transition disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  Menyimpan Nilai...
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5 mr-1.5" />
                  Simpan Semua Nilai
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
