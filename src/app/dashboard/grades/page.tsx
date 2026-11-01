'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Award,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  Eye,
  Filter,
  GraduationCap,
  Layers,
  ListOrdered,
  Loader2,
  Pencil,
  Plus,
  Printer,
  RefreshCw,
  Search,
  Sparkles,
  Trash2,
  Trophy,
  Users,
  XCircle,
  School,
  ChevronRight
} from 'lucide-react';
import GradeItemModal from '@/components/grades/GradeItemModal';
import GradeBatchEntryModal from '@/components/grades/GradeBatchEntryModal';
import StudentReportCardModal from '@/components/grades/StudentReportCardModal';
import { AssessmentType } from '@prisma/client';

interface GradeItem {
  id: string;
  name: string;
  type: string;
  weight: number;
  maxScore: number;
  class: { id: string; name: string };
  subject: { id: string; code: string; name: string; category: string | null };
  teacher: { id: string; name: string };
  stats: {
    totalGraded: number;
    averageScore: number;
    publishedCount: number;
  };
}

interface ClassItem {
  id: string;
  name: string;
  gradeLevel: number;
}

interface SubjectItem {
  id: string;
  code: string;
  name: string;
}

const TYPE_BADGE: Record<string, { label: string; bg: string; text: string }> = {
  TUGAS: { label: 'Tugas', bg: 'bg-blue-50 border-blue-200', text: 'text-blue-700' },
  KUIS: { label: 'Kuis', bg: 'bg-indigo-50 border-indigo-200', text: 'text-indigo-700' },
  ULANGAN: { label: 'Ulangan', bg: 'bg-amber-50 border-amber-200', text: 'text-amber-700' },
  UTS: { label: 'PTS / UTS', bg: 'bg-rose-50 border-rose-200', text: 'text-rose-700' },
  UAS: { label: 'PAS / UAS', bg: 'bg-purple-50 border-purple-200', text: 'text-purple-700' },
  PRAKTIK: { label: 'Praktik', bg: 'bg-teal-50 border-teal-200', text: 'text-teal-700' },
  PROYEK: { label: 'Proyek', bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700' },
  SIKAP: { label: 'Sikap', bg: 'bg-slate-50 border-slate-200', text: 'text-slate-700' },
};

export default function GradesPage() {
  const [currentUserRole, setCurrentUserRole] = useState<string>('');
  const [currentStudentId, setCurrentStudentId] = useState<string | null>(null);

  // Tabs: 'items' (Komponen Asesmen) or 'recap' (Rekap Rapor Kelas)
  const [activeTab, setActiveTab] = useState<'items' | 'recap'>('items');

  // References
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);

  // Filter states
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('');
  const [search, setSearch] = useState<string>('');

  // Data states
  const [gradeItems, setGradeItems] = useState<GradeItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(true);

  // Recap state
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [recapData, setRecapData] = useState<any>(null);
  const [loadingRecap, setLoadingRecap] = useState(false);

  // Student specific transcript data
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [studentData, setStudentData] = useState<any>(null);
  const [loadingStudent, setLoadingStudent] = useState(false);

  // Modals
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editTargetItem, setEditTargetItem] = useState<GradeItem | null>(null);

  const [batchModalItemId, setBatchModalItemId] = useState<string | null>(null);

  const [reportCardStudentId, setReportCardStudentId] = useState<string | null>(null);

  // Delete state
  const [deleteTargetItem, setDeleteTargetItem] = useState<GradeItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Export state
  const [exporting, setExporting] = useState(false);

  // 1. Initial Load: User role, classes, and subjects
  useEffect(() => {
    async function loadMeta() {
      try {
        const [resAuth, resClasses, resSubjects] = await Promise.all([
          fetch('/api/auth/me'),
          fetch('/api/classes'),
          fetch('/api/subjects?limit=100'),
        ]);

        const [authJson, classesJson, subjectsJson] = await Promise.all([
          resAuth.json(),
          resClasses.json(),
          resSubjects.json(),
        ]);

        if (authJson.user) {
          setCurrentUserRole(authJson.user.role);
          if (authJson.user.role === 'SISWA') {
            setCurrentStudentId(authJson.user.studentId || null);
          }
        }

        if (classesJson.data && classesJson.data.length > 0) {
          setClasses(classesJson.data);
          setSelectedClassId(classesJson.data[0].id);
        }

        if (subjectsJson.data && subjectsJson.data.length > 0) {
          setSubjects(subjectsJson.data);
        }
      } catch (err) {
        console.error('Failed to load metadata', err);
      }
    }
    loadMeta();
  }, []);

  // 2. Fetch Student Report if SISWA
  const fetchStudentReport = useCallback(async () => {
    setLoadingStudent(true);
    try {
      const res = await fetch('/api/grades/my-grades');
      const json = await res.json();
      if (json.data) setStudentData(json.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingStudent(false);
    }
  }, []);

  // 3. Fetch Grade Items
  const fetchGradeItems = useCallback(async () => {
    setLoadingItems(true);
    try {
      const params = new URLSearchParams();
      if (selectedClassId) params.append('classId', selectedClassId);
      if (selectedSubjectId) params.append('subjectId', selectedSubjectId);
      if (selectedType) params.append('type', selectedType);

      const res = await fetch(`/api/grades/items?${params.toString()}`);
      const json = await res.json();
      if (json.data) setGradeItems(json.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingItems(false);
    }
  }, [selectedClassId, selectedSubjectId, selectedType]);

  // 4. Fetch Class Recap
  const fetchClassRecap = useCallback(async () => {
    if (!selectedClassId) return;
    setLoadingRecap(true);
    try {
      const res = await fetch(`/api/grades/recap?classId=${selectedClassId}`);
      const json = await res.json();
      if (json.data) setRecapData(json.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingRecap(false);
    }
  }, [selectedClassId]);

  useEffect(() => {
    if (currentUserRole === 'SISWA') {
      fetchStudentReport();
    } else {
      if (activeTab === 'items') {
        fetchGradeItems();
      } else if (activeTab === 'recap') {
        fetchClassRecap();
      }
    }
  }, [currentUserRole, activeTab, fetchGradeItems, fetchClassRecap, fetchStudentReport]);

  // Handle Export Excel
  const handleExport = async () => {
    if (!selectedClassId) return;
    setExporting(true);
    try {
      const res = await fetch(`/api/grades/export?classId=${selectedClassId}`);
      if (!res.ok) throw new Error('Gagal mengekspor nilai');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `rekap-nilai-${selectedClassId}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch {
      alert('Gagal mengekspor data nilai');
    } finally {
      setExporting(false);
    }
  };

  // Handle Delete GradeItem
  const handleDeleteItem = async () => {
    if (!deleteTargetItem) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/grades/items/${deleteTargetItem.id}`, { method: 'DELETE' });
      if (res.ok) {
        setDeleteTargetItem(null);
        fetchGradeItems();
      } else {
        const json = await res.json();
        alert(json.error || 'Gagal menghapus komponen penilaian');
      }
    } catch {
      alert('Terjadi kesalahan sistem');
    } finally {
      setIsDeleting(false);
    }
  };

  const isStaff = currentUserRole !== 'SISWA';

  // -------------------------------------------------------------------------
  // RENDER: VIEW KHUSUS SISWA (TRANSPARAN RAPOR & NILAI SAYA)
  // -------------------------------------------------------------------------
  if (currentUserRole === 'SISWA') {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-xs text-slate-500 mb-1">
              <Link href="/dashboard" className="hover:text-indigo-600">Dashboard</Link>
              <ChevronRight className="w-3 h-3 text-slate-400" />
              <span className="text-slate-800 font-medium">Nilai & Rapor Saya</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center">
              <Award className="w-6 h-6 mr-2 text-indigo-600" />
              Laporan Hasil Belajar (Rapor Digital)
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Transkrip capaian kompetensi, rata-rata nilai akademik, dan rekapitulasi kehadiran Anda
            </p>
          </div>

          <button
            onClick={() => setReportCardStudentId(currentStudentId)}
            className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs transition"
          >
            <Printer className="w-4 h-4 mr-1.5" />
            Cetak Lembar Rapor Resmi
          </button>
        </div>

        {loadingStudent ? (
          <div className="py-24 text-center text-slate-400 bg-white rounded-3xl border border-slate-200">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-600 mb-2" />
            <p className="text-xs">Memuat data rapor akademik Anda...</p>
          </div>
        ) : !studentData ? (
          <div className="py-20 text-center text-slate-500 bg-white rounded-3xl border border-slate-200">
            Belum ada data nilai rapor untuk semester ini
          </div>
        ) : (
          <div className="space-y-6">
            {/* KPI Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
                <span className="text-xs font-semibold text-slate-500 uppercase">Rata-Rata Akhir</span>
                <div className="flex items-baseline space-x-2 mt-1">
                  <span className="text-2xl font-bold font-mono text-indigo-600">
                    {studentData.overallAverage}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-bold border border-indigo-200">
                    Predikat {studentData.overallPredicate}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">{studentData.overallDescription}</p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
                <span className="text-xs font-semibold text-slate-500 uppercase">Status Kelulusan KKM</span>
                <div className="flex items-center space-x-2 mt-1">
                  {studentData.overallAverage >= 75 ? (
                    <span className="inline-flex items-center text-sm font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                      <CheckCircle2 className="w-4 h-4 mr-1" /> TUNTAS (KKM: 75)
                    </span>
                  ) : (
                    <span className="inline-flex items-center text-sm font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                      <XCircle className="w-4 h-4 mr-1" /> PERLU REMEDI
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 mt-1">Standar KKM Sekolah: 75.0</p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
                <span className="text-xs font-semibold text-slate-500 uppercase">Mapel Dinilai</span>
                <p className="text-2xl font-bold font-mono text-slate-900 mt-1">
                  {studentData.subjects.length} <span className="text-sm font-normal text-slate-400">Mapel</span>
                </p>
                <p className="text-[11px] text-slate-400 mt-1">Kurikulum Merdeka Fase E</p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
                <span className="text-xs font-semibold text-slate-500 uppercase">Tingkat Kehadiran</span>
                <p className="text-2xl font-bold font-mono text-emerald-600 mt-1">
                  {studentData.attendanceRecap.hadir} <span className="text-sm font-normal text-slate-400">Hari Hadir</span>
                </p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Sakit: {studentData.attendanceRecap.sakit} • Izin: {studentData.attendanceRecap.izin} • Alpa: {studentData.attendanceRecap.alpa}
                </p>
              </div>
            </div>

            {/* Subject Breakdown Table */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
              <div className="p-4 bg-slate-50 border-b border-slate-200/80 flex items-center justify-between">
                <h3 className="font-bold text-sm text-slate-900 flex items-center">
                  <BookOpen className="w-4 h-4 mr-2 text-indigo-600" />
                  Rincian Capaian Nilai per Mata Pelajaran
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50/50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[11px] font-semibold">
                    <tr>
                      <th className="py-3 px-4 w-10 text-center">No</th>
                      <th className="py-3 px-4">Mata Pelajaran</th>
                      <th className="py-3 px-4">Guru Pengajar</th>
                      <th className="py-3 px-4 text-center">Komponen Selesai</th>
                      <th className="py-3 px-4 text-center">Nilai Akhir</th>
                      <th className="py-3 px-4 text-center">Predikat</th>
                      <th className="py-3 px-4 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    {studentData.subjects.map((sub: any, idx: number) => (
                      <tr key={sub.subject.id} className="hover:bg-slate-50/70 transition">
                        <td className="py-3 px-4 text-center font-mono text-slate-400">{idx + 1}</td>
                        <td className="py-3 px-4 font-semibold text-slate-900">
                          <div>{sub.subject.name}</div>
                          <span className="font-mono text-[10px] text-slate-400">{sub.subject.code}</span>
                        </td>
                        <td className="py-3 px-4 text-slate-600">{sub.teacherName}</td>
                        <td className="py-3 px-4 text-center font-mono text-slate-600">
                          {sub.items.filter((i: { score: number | null }) => i.score !== null).length} / {sub.items.length} Asesmen
                        </td>
                        <td className="py-3 px-4 text-center font-mono font-bold text-slate-900 text-sm">
                          {sub.finalScore}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200">
                            {sub.predicate}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          {sub.isPassed ? (
                            <span className="inline-flex items-center text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                              Tuntas
                            </span>
                          ) : (
                            <span className="inline-flex items-center text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                              Belum Tuntas
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Modal Pratinjau Lembar Rapor */}
        <StudentReportCardModal
          isOpen={Boolean(reportCardStudentId)}
          onClose={() => setReportCardStudentId(null)}
          studentId={reportCardStudentId}
        />
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // RENDER: VIEW STAFF (SUPER ADMIN, ADMIN, GURU, WALI KELAS)
  // -------------------------------------------------------------------------
  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs text-slate-500 mb-1">
            <Link href="/dashboard" className="hover:text-indigo-600">Dashboard</Link>
            <ChevronRight className="w-3 h-3 text-slate-400" />
            <span className="text-slate-800 font-medium">Nilai & E-Rapor</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center">
            <Award className="w-6 h-6 mr-2 text-indigo-600" />
            Manajemen Penilaian & E-Rapor
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Komponen penilaian formatif/sumatif, input skor massal, dan buku nilai rapor
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Export Excel Button */}
          <button
            onClick={handleExport}
            disabled={exporting || !selectedClassId}
            type="button"
            className="inline-flex items-center px-3.5 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium rounded-xl shadow-2xs transition disabled:opacity-50"
          >
            {exporting ? (
              <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin text-slate-400" />
            ) : (
              <Download className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
            )}
            Ekspor Excel Rapor
          </button>

          {/* Create Grade Item Button */}
          {isStaff && (
            <button
              onClick={() => {
                setEditTargetItem(null);
                setIsItemModalOpen(true);
              }}
              type="button"
              className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-xl shadow-xs transition"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Buat Penilaian Baru
            </button>
          )}
        </div>
      </div>

      {/* Tabs Header */}
      <div className="border-b border-slate-200">
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveTab('items')}
            className={`pb-3 px-4 text-xs font-medium border-b-2 transition flex items-center space-x-1.5 ${
              activeTab === 'items'
                ? 'border-indigo-600 text-indigo-600 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Komponen Penilaian & Tugas</span>
            <span className="ml-1 px-1.5 py-0.5 text-[10px] bg-slate-100 rounded-full font-bold">
              {gradeItems.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('recap')}
            className={`pb-3 px-4 text-xs font-medium border-b-2 transition flex items-center space-x-1.5 ${
              activeTab === 'recap'
                ? 'border-indigo-600 text-indigo-600 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Trophy className="w-4 h-4" />
            <span>Rekapitulasi Rapor Kelas & Ranking</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Pilih Kelas */}
          <div>
            <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Rombel Kelas
            </label>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 font-bold text-slate-800"
            >
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Pilih Mapel (Hanya untuk Tab Komponen) */}
          {activeTab === 'items' && (
            <div>
              <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Mata Pelajaran
              </label>
              <select
                value={selectedSubjectId}
                onChange={(e) => setSelectedSubjectId(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-slate-700"
              >
                <option value="">Semua Mata Pelajaran</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    [{s.code}] {s.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Pilih Kategori Tipe Asesmen (Hanya Tab Komponen) */}
          {activeTab === 'items' && (
            <div>
              <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Kategori Asesmen
              </label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-slate-700"
              >
                <option value="">Semua Tipe Asesmen</option>
                {Object.keys(TYPE_BADGE).map((k) => (
                  <option key={k} value={k}>
                    {TYPE_BADGE[k].label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Reset Filter Button */}
          <div className="flex items-end">
            <button
              type="button"
              onClick={() => {
                setSelectedSubjectId('');
                setSelectedType('');
              }}
              className="w-full px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition flex items-center justify-center space-x-1"
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1" />
              Reset Filter
            </button>
          </div>
        </div>
      </div>

      {/* TAB 1: KOMPONEN PENILAIAN */}
      {activeTab === 'items' && (
        <div className="space-y-4">
          {loadingItems ? (
            <div className="py-24 text-center text-slate-400 bg-white rounded-3xl border border-slate-200">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-600 mb-2" />
              <p className="text-xs">Memuat komponen penilaian...</p>
            </div>
          ) : gradeItems.length === 0 ? (
            <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center">
              <Award className="w-12 h-12 mx-auto text-slate-300 mb-2" />
              <p className="text-sm font-semibold text-slate-700">Belum Ada Komponen Penilaian</p>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Silakan buat tugas, kuis, atau ulangan baru untuk kelas ini.
              </p>
              {isStaff && (
                <button
                  type="button"
                  onClick={() => {
                    setEditTargetItem(null);
                    setIsItemModalOpen(true);
                  }}
                  className="mt-4 inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition"
                >
                  <Plus className="w-4 h-4 mr-1.5" />
                  Buat Penilaian Baru
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {gradeItems.map((item) => {
                const badge = TYPE_BADGE[item.type] || {
                  label: item.type,
                  bg: 'bg-slate-50 border-slate-200',
                  text: 'text-slate-700',
                };

                return (
                  <div
                    key={item.id}
                    className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:border-indigo-300 hover:shadow-xs transition p-5 flex flex-col justify-between space-y-4 group"
                  >
                    <div className="space-y-2.5">
                      {/* Top Badges */}
                      <div className="flex items-center justify-between">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border ${badge.bg} ${badge.text}`}>
                          {badge.label}
                        </span>
                        <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-100">
                          {item.class.name}
                        </span>
                      </div>

                      {/* Title */}
                      <h3 className="font-bold text-sm text-slate-900 group-hover:text-indigo-600 transition leading-snug">
                        {item.name}
                      </h3>

                      {/* Subject & Teacher Info */}
                      <div className="text-xs text-slate-500 space-y-0.5">
                        <p className="font-medium text-slate-700">
                          {item.subject.name} <span className="font-mono text-slate-400">({item.subject.code})</span>
                        </p>
                        <p className="text-[11px] text-slate-400">Guru Penilai: {item.teacher.name}</p>
                      </div>

                      {/* Weight & Max Score */}
                      <div className="flex items-center space-x-3 text-xs pt-1 border-t border-slate-100 text-slate-600">
                        <span className="font-mono">Bobot: <strong>{item.weight}x</strong></span>
                        <span>•</span>
                        <span className="font-mono">Maks: <strong>{item.maxScore}</strong></span>
                      </div>

                      {/* Progress Stats */}
                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 space-y-1 text-xs">
                        <div className="flex justify-between text-[11px]">
                          <span className="text-slate-500">Siswa Dinilai:</span>
                          <span className="font-bold text-slate-800 font-mono">
                            {item.stats.totalGraded} Siswa
                          </span>
                        </div>
                        <div className="flex justify-between text-[11px]">
                          <span className="text-slate-500">Rata-Rata Kelas:</span>
                          <span className="font-bold text-indigo-600 font-mono">
                            {item.stats.averageScore > 0 ? item.stats.averageScore : '-'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Action Bar */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => setBatchModalItemId(item.id)}
                        className="inline-flex items-center px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-2xs transition"
                      >
                        <Pencil className="w-3.5 h-3.5 mr-1" />
                        Input / Koreksi Nilai
                      </button>

                      <div className="flex items-center space-x-1">
                        <button
                          type="button"
                          onClick={() => {
                            setEditTargetItem(item);
                            setIsItemModalOpen(true);
                          }}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                          title="Edit Pengaturan Penilaian"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTargetItem(item)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                          title="Hapus Penilaian"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: REKAPITULASI RAPOR KELAS */}
      {activeTab === 'recap' && (
        <div className="space-y-4">
          {loadingRecap ? (
            <div className="py-24 text-center text-slate-400 bg-white rounded-3xl border border-slate-200">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-600 mb-2" />
              <p className="text-xs">Menghitung matriks rapor dan peringkat kelas...</p>
            </div>
          ) : !recapData ? (
            <div className="py-20 text-center text-slate-500 bg-white rounded-3xl border border-slate-200">
              Pilih rombel kelas untuk melihat rekapitulasi rapor
            </div>
          ) : (
            <div className="space-y-4">
              {/* Class KPI Strip */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
                  <span className="text-xs font-semibold text-slate-500 uppercase">Rata-Rata Kelas</span>
                  <p className="text-2xl font-bold font-mono text-indigo-600 mt-1">
                    {recapData.classStatistics.classAverage}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Nilai Tengah Rombel</p>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
                  <span className="text-xs font-semibold text-slate-500 uppercase">Nilai Tertinggi</span>
                  <p className="text-2xl font-bold font-mono text-emerald-600 mt-1">
                    {recapData.classStatistics.highestScore}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Peringkat 1 Kelas</p>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
                  <span className="text-xs font-semibold text-slate-500 uppercase">Ketuntasan KKM</span>
                  <p className="text-2xl font-bold font-mono text-slate-900 mt-1">
                    {recapData.classStatistics.passingRate}%
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">KKM Standar: 75.0</p>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
                  <span className="text-xs font-semibold text-slate-500 uppercase">Total Siswa</span>
                  <p className="text-2xl font-bold font-mono text-slate-900 mt-1">
                    {recapData.class.totalStudents} <span className="text-sm font-normal text-slate-400">Siswa</span>
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Wali Kelas: {recapData.class.homeroomTeacher?.name || '-'}
                  </p>
                </div>
              </div>

              {/* Master Gradebook Matrix Table */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100/80 border-b border-slate-200 text-slate-600 uppercase tracking-wider text-[11px] font-semibold">
                      <tr>
                        <th className="py-3 px-3 w-12 text-center">Rank</th>
                        <th className="py-3 px-4">Nama Siswa</th>
                        <th className="py-3 px-3">NIS</th>
                        {/* Dynamic Subject Headers */}
                        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                        {recapData.subjects.map((s: any) => (
                          <th key={s.id} className="py-3 px-3 text-center min-w-[80px]">
                            <div className="truncate max-w-[100px] mx-auto" title={s.name}>
                              {s.code}
                            </div>
                          </th>
                        ))}
                        <th className="py-3 px-3 text-center font-bold text-indigo-700 bg-indigo-50/50">
                          Rata-Rata
                        </th>
                        <th className="py-3 px-3 text-center">Predikat</th>
                        <th className="py-3 px-4 text-right">Rapor Siswa</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                      {recapData.students.map((sr: any) => (
                        <tr key={sr.student.id} className="hover:bg-slate-50/60 transition">
                          <td className="py-3 px-3 text-center">
                            {sr.rank <= 3 ? (
                              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full font-bold text-xs bg-amber-100 text-amber-800 border border-amber-300">
                                {sr.rank}
                              </span>
                            ) : (
                              <span className="font-mono text-slate-400">{sr.rank}</span>
                            )}
                          </td>
                          <td className="py-3 px-4 font-semibold text-slate-900">
                            {sr.student.name}
                          </td>
                          <td className="py-3 px-3 font-mono text-slate-500">
                            {sr.student.nis}
                          </td>
                          {/* Subject Scores */}
                          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                          {recapData.subjects.map((sub: any) => {
                            const subScore = sr.subjectScores[sub.id];
                            return (
                              <td key={sub.id} className="py-3 px-3 text-center font-mono font-medium">
                                {subScore && subScore.itemCount > 0 ? (
                                  <span
                                    className={
                                      subScore.isPassed ? 'text-slate-800' : 'text-amber-600 font-bold'
                                    }
                                  >
                                    {subScore.finalScore}
                                  </span>
                                ) : (
                                  <span className="text-slate-300">-</span>
                                )}
                              </td>
                            );
                          })}
                          <td className="py-3 px-3 text-center font-mono font-bold text-sm text-indigo-600 bg-indigo-50/40">
                            {sr.overallAverage}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span className="font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200">
                              {sr.overallPredicate}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              type="button"
                              onClick={() => setReportCardStudentId(sr.student.id)}
                              className="inline-flex items-center px-3 py-1 bg-white hover:bg-indigo-50 text-indigo-600 border border-indigo-200 text-xs font-medium rounded-xl transition shadow-2xs"
                            >
                              <Eye className="w-3.5 h-3.5 mr-1" />
                              Cetak Rapor
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Grade Item Modal (Create / Edit) */}
      <GradeItemModal
        isOpen={isItemModalOpen}
        onClose={() => setIsItemModalOpen(false)}
        onSuccess={fetchGradeItems}
        initialData={
          editTargetItem
            ? {
                id: editTargetItem.id,
                name: editTargetItem.name,
                type: editTargetItem.type as AssessmentType,
                weight: editTargetItem.weight,
                maxScore: editTargetItem.maxScore,
                classId: editTargetItem.class.id,
                subjectId: editTargetItem.subject.id,
                teacherId: editTargetItem.teacher.id,
              }
            : null
        }
        defaultClassId={selectedClassId}
        defaultSubjectId={selectedSubjectId}
      />

      {/* Batch Scoring Modal */}
      <GradeBatchEntryModal
        isOpen={Boolean(batchModalItemId)}
        onClose={() => setBatchModalItemId(null)}
        onSuccess={() => {
          fetchGradeItems();
          if (activeTab === 'recap') fetchClassRecap();
        }}
        gradeItemId={batchModalItemId}
      />

      {/* Student Printable Report Card Modal */}
      <StudentReportCardModal
        isOpen={Boolean(reportCardStudentId)}
        onClose={() => setReportCardStudentId(null)}
        studentId={reportCardStudentId}
      />

      {/* Delete Item Confirmation Modal */}
      {deleteTargetItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-slate-900">
              Hapus Komponen Penilaian?
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Anda yakin ingin menghapus <span className="font-semibold">{deleteTargetItem.name}</span> ({deleteTargetItem.subject.name} - {deleteTargetItem.class.name})? Seluruh nilai siswa yang terkait dengan komponen ini akan terhapus.
            </p>
            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeleteTargetItem(null)}
                className="px-4 py-2 border border-slate-200 text-slate-700 text-xs font-medium rounded-xl hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDeleteItem}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-medium rounded-xl shadow-xs"
              >
                {isDeleting ? 'Menghapus...' : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
