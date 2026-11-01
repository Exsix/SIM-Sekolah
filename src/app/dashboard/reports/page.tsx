'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  FileText,
  Printer,
  FileSpreadsheet,
  RefreshCw,
  Users,
  GraduationCap,
  Award,
  CheckCircle2,
  Clock,
  BookOpen,
  Library,
  TrendingUp,
  BarChart3,
  Layers,
  School,
  Loader2,
  Building2,
  AlertCircle,
  HelpCircle,
  ChevronRight,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import PrintReportModal from '@/components/reports/PrintReportModal';

export default function ReportsExecutivePage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'attendance' | 'grades' | 'library'>('overview');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [reportData, setReportData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPrintModal, setShowPrintModal] = useState(false);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/reports/summary');
      if (!res.ok) throw new Error('Gagal memuat data laporan');
      const data = await res.json();
      setReportData(data);
    } catch (err: unknown) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handleExportExcel = () => {
    window.location.href = '/api/reports/export';
  };

  if (loading || !reportData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        <p className="text-xs font-semibold text-slate-500">Mengkonsolidasikan buku laporan eksekutif...</p>
      </div>
    );
  }

  const { school, students, teachers, attendance, grades, library } = reportData;

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-16">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 border border-slate-800 p-7 md:p-8 text-white shadow-2xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-semibold tracking-wide">
              <BarChart3 className="w-3.5 h-3.5 text-indigo-400" />
              <span>Pusat Kendali Eksekutif & Kepatuhan Dokumen (ISO / Akreditasi)</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
              Pusat Laporan & Rekapitulasi Terpadu
            </h1>
            <p className="text-slate-300 text-xs md:text-sm leading-relaxed">
              Konsolidasi data makro sekolah meliputi demografi siswa & guru, tren presensi, leger nilai kurikulum,
              serta sirkulasi perpustakaan dalam satu pintu.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => fetchReports()}
              className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 border border-slate-700/70 text-xs font-semibold shadow-sm transition hover:scale-[1.02]"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Segarkan</span>
            </button>
            <button
              onClick={() => setShowPrintModal(true)}
              className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition hover:scale-[1.02]"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak Dokumen Resmi A4</span>
            </button>
            <button
              onClick={handleExportExcel}
              className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 transition hover:scale-[1.02]"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Buku Laporan Excel (.xlsx)</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mt-8 flex flex-wrap border-b border-slate-800">
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-3.5 px-4 text-xs font-bold transition flex items-center space-x-2 border-b-2 -mb-px ${
              activeTab === 'overview'
                ? 'border-indigo-400 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Building2 className="w-4 h-4 text-indigo-400" />
            <span>Ikhtisar Eksekutif & Demografi</span>
          </button>
          <button
            onClick={() => setActiveTab('attendance')}
            className={`pb-3.5 px-4 text-xs font-bold transition flex items-center space-x-2 border-b-2 -mb-px ${
              activeTab === 'attendance'
                ? 'border-indigo-400 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Clock className="w-4 h-4 text-indigo-400" />
            <span>Presensi & Kedisiplinan ({attendance.studentRate}%)</span>
          </button>
          <button
            onClick={() => setActiveTab('grades')}
            className={`pb-3.5 px-4 text-xs font-bold transition flex items-center space-x-2 border-b-2 -mb-px ${
              activeTab === 'grades'
                ? 'border-indigo-400 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Award className="w-4 h-4 text-indigo-400" />
            <span>Leger Nilai & Capaian KKM ({grades.averageScore})</span>
          </button>
          <button
            onClick={() => setActiveTab('library')}
            className={`pb-3.5 px-4 text-xs font-bold transition flex items-center space-x-2 border-b-2 -mb-px ${
              activeTab === 'library'
                ? 'border-indigo-400 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Library className="w-4 h-4 text-indigo-400" />
            <span>Sirkulasi Perpustakaan</span>
          </button>
        </div>
      </div>

      {/* TAB 1: IKHTISAR EKSEKUTIF & DEMOGRAFI */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Executive KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center space-x-4">
              <div className="p-3 bg-indigo-50 text-indigo-700 rounded-xl">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Peserta Didik Aktif</p>
                <h3 className="text-2xl font-black text-slate-900">{students.total} Siswa</h3>
                <p className="text-[11px] text-slate-500">
                  L: <strong className="text-slate-800">{students.male}</strong> • P: <strong className="text-slate-800">{students.female}</strong>
                </p>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center space-x-4">
              <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Pendidik & GTK</p>
                <h3 className="text-2xl font-black text-slate-900">{teachers.total} Guru</h3>
                <p className="text-[11px] text-emerald-600 font-semibold">
                  PNS: {teachers.pns} | PPPK: {teachers.pppk} | Honorer: {teachers.honorer}
                </p>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center space-x-4">
              <div className="p-3 bg-amber-50 text-amber-700 rounded-xl">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Rata-Rata Nilai (IPK)</p>
                <h3 className="text-2xl font-black text-amber-700">{grades.averageScore} / 100</h3>
                <p className="text-[11px] text-slate-500">Tingkat Tuntas KKM: <strong className="text-emerald-600">{grades.passRate}%</strong></p>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center space-x-4">
              <div className="p-3 bg-blue-50 text-blue-700 rounded-xl">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Presensi Sekolah</p>
                <h3 className="text-2xl font-black text-slate-900">{attendance.studentRate}%</h3>
                <p className="text-[11px] text-slate-500">GTK: {attendance.teacherRate}% hadir</p>
              </div>
            </div>
          </div>

          {/* Rombel Distribution & Employment Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-sm font-extrabold text-slate-900">Distribusi Siswa per Rombongan Belajar</h3>
                <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-lg bg-indigo-50 text-indigo-700">
                  {students.classBreakdown.length} Kelas
                </span>
              </div>
              <div className="space-y-3">
                {students.classBreakdown.map((c: { classId: string; className: string; studentCount: number }) => (
                  <div key={c.classId} className="space-y-1">
                    <div className="flex justify-between text-xs font-bold text-slate-700">
                      <span>{c.className}</span>
                      <span className="font-mono">{c.studentCount} Siswa</span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min((c.studentCount / 36) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-sm font-extrabold text-slate-900">Status Kepegawaian Pendidik & Staf</h3>
                <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-lg bg-emerald-50 text-emerald-700">
                  {teachers.total} GTK
                </span>
              </div>
              <div className="grid grid-cols-3 gap-3 text-center pt-2">
                <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100">
                  <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider block">PNS / ASN</span>
                  <p className="text-2xl font-black text-indigo-700 mt-1">{teachers.pns}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Pegawai Negeri Sipil</p>
                </div>
                <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-100">
                  <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block">PPPK</span>
                  <p className="text-2xl font-black text-emerald-700 mt-1">{teachers.pppk}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Perjanjian Kerja</p>
                </div>
                <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-100">
                  <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider block">Honorer / GTT</span>
                  <p className="text-2xl font-black text-amber-700 mt-1">{teachers.honorer}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Guru Tidak Tetap</p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs text-slate-600 space-y-1">
                <span className="font-bold text-slate-800 block">Kualifikasi Akademik:</span>
                <p>100% Pendidik berijazah S1/S2 dan memiliki sertifikasi profesi pendidik (Serdik Kemendikbud).</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PRESENSI & KEDISIPLINAN */}
      {activeTab === 'attendance' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">Rekapitulasi Kehadiran per Rombongan Belajar</h3>
                <p className="text-xs text-slate-500">Monitoring komparasi tingkat disiplin dan kehadiran siswa antar kelas</p>
              </div>
              <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                Rata-rata Sekolah: {attendance.studentRate}%
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold">
                    <th className="py-3 px-4">Kelas / Rombel</th>
                    <th className="py-3 px-4">Wali Kelas</th>
                    <th className="py-3 px-4 text-center">Jumlah Siswa</th>
                    <th className="py-3 px-4 text-center">Hadir</th>
                    <th className="py-3 px-4 text-center">Sakit</th>
                    <th className="py-3 px-4 text-center">Izin</th>
                    <th className="py-3 px-4 text-center">Alpa</th>
                    <th className="py-3 px-4 text-center">% Kehadiran</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {attendance.classRecap.map((c: { classId: string; className: string; homeroomTeacher: string; studentCount: number; attendanceRate: number; present: number; sick: number; perm: number; alpha: number }) => (
                    <tr key={c.classId} className="hover:bg-slate-50/60 transition">
                      <td className="py-3 px-4 font-bold text-slate-900">{c.className}</td>
                      <td className="py-3 px-4 text-slate-600">{c.homeroomTeacher}</td>
                      <td className="py-3 px-4 text-center font-mono">{c.studentCount}</td>
                      <td className="py-3 px-4 text-center font-mono text-emerald-600 font-bold">{c.present}</td>
                      <td className="py-3 px-4 text-center font-mono text-amber-600">{c.sick}</td>
                      <td className="py-3 px-4 text-center font-mono text-blue-600">{c.perm}</td>
                      <td className="py-3 px-4 text-center font-mono text-rose-600 font-bold">{c.alpha}</td>
                      <td className="py-3 px-4 text-center font-mono">
                        <span className={`px-2.5 py-0.5 rounded-full font-black text-xs ${
                          c.attendanceRate >= 90
                            ? 'bg-emerald-50 text-emerald-700'
                            : c.attendanceRate >= 75
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-rose-50 text-rose-700'
                        }`}>
                          {c.attendanceRate}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: LEGER NILAI & CAPAIAN KKM */}
      {activeTab === 'grades' && (
        <div className="space-y-6">
          {/* Grade Distribution Overview */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider block">Predikat A (88 - 100)</span>
              <p className="text-2xl font-black text-indigo-700 mt-1">{grades.distribution.A} Nilai</p>
              <p className="text-[11px] text-slate-500">Istimewa / Sangat Memuaskan</p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block">Predikat B (75 - 87)</span>
              <p className="text-2xl font-black text-emerald-700 mt-1">{grades.distribution.B} Nilai</p>
              <p className="text-[11px] text-slate-500">Baik / Tuntas KKM</p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider block">Predikat C (60 - 74)</span>
              <p className="text-2xl font-black text-amber-700 mt-1">{grades.distribution.C} Nilai</p>
              <p className="text-[11px] text-slate-500">Cukup / Bimbingan</p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wider block">Predikat D (&lt; 60)</span>
              <p className="text-2xl font-black text-rose-700 mt-1">{grades.distribution.D} Nilai</p>
              <p className="text-[11px] text-slate-500">Perlu Remedial</p>
            </div>
          </div>

          {/* Subject Performance Table */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">Statistik Capaian per Mata Pelajaran</h3>
                <p className="text-xs text-slate-500">Rata-rata akumulasi nilai dan persentase kelulusan standar KKM 75.0</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold">
                    <th className="py-3 px-4">Kode Mapel</th>
                    <th className="py-3 px-4">Nama Mata Pelajaran</th>
                    <th className="py-3 px-4 text-center">Jumlah Asesmen Masuk</th>
                    <th className="py-3 px-4 text-center">Nilai Rata-Rata</th>
                    <th className="py-3 px-4 text-center">Ketuntasan KKM</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {grades.subjectPerformance.map((s: { code: string; name: string; totalAssessments: number; average: number; passRate: number }) => (
                    <tr key={s.code} className="hover:bg-slate-50/60 transition">
                      <td className="py-3 px-4 font-mono font-bold text-slate-700">{s.code}</td>
                      <td className="py-3 px-4 font-bold text-slate-900">{s.name}</td>
                      <td className="py-3 px-4 text-center font-mono">{s.totalAssessments}</td>
                      <td className="py-3 px-4 text-center font-mono font-black text-indigo-700 text-sm">
                        {s.average}
                      </td>
                      <td className="py-3 px-4 text-center font-mono">
                        <span className="px-2.5 py-0.5 rounded-full font-bold text-xs bg-emerald-50 text-emerald-700">
                          {s.passRate}% Tuntas
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: SIRKULASI PERPUSTAKAAN */}
      {activeTab === 'library' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Judul Buku Terdaftar</span>
              <p className="text-2xl font-black text-slate-900 mt-1">{library.totalTitles} Judul</p>
              <p className="text-[11px] text-slate-500">{library.totalPhysicalCopies} Eksemplar Fisik</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider block">Peminjaman Aktif</span>
              <p className="text-2xl font-black text-indigo-700 mt-1">{library.activeLoans}</p>
              <p className="text-[11px] text-slate-500">Buku sedang dipinjam</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block">Buku Tersedia di Rak</span>
              <p className="text-2xl font-black text-emerald-700 mt-1">
                {library.totalPhysicalCopies - library.totalBorrowedCopies}
              </p>
              <p className="text-[11px] text-slate-500">Siap dipinjam siswa</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider block">Kas Denda Sirkulasi</span>
              <p className="text-2xl font-black text-amber-700 mt-1">Rp {library.totalFines.toLocaleString('id-ID')}</p>
              <p className="text-[11px] text-slate-500">Tarif Rp 1.000 / hari</p>
            </div>
          </div>

          {/* Top Borrowed Books */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-extrabold text-slate-900">Buku Paling Populer & Sering Dipinjam</h3>
              <span className="text-xs text-slate-400">Analisis minat baca literasi siswa</span>
            </div>

            <div className="space-y-3">
              {library.topBooks.map((b: { title: string; borrowCount: number }, idx: number) => (
                <div key={b.title} className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70 text-xs">
                  <div className="flex items-center space-x-3">
                    <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white font-bold flex items-center justify-center text-xs">
                      {idx + 1}
                    </span>
                    <span className="font-bold text-slate-900">{b.title}</span>
                  </div>
                  <span className="font-mono font-bold text-indigo-700 px-3 py-1 bg-white rounded-xl border border-slate-200">
                    {b.borrowCount}x Dipinjam
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal Cetak Dokumen Resmi A4 */}
      <PrintReportModal
        isOpen={showPrintModal}
        onClose={() => setShowPrintModal(false)}
        data={reportData}
      />
    </div>
  );
}
