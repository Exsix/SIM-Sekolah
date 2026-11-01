'use client';

import React, { useEffect, useState } from 'react';
import {
  GraduationCap,
  Users,
  School,
  BookOpen,
  Library,
  Calendar,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  ShieldAlert,
  User,
  CheckSquare,
  Award,
  Sparkles,
  BookMarked,
  Bell,
  Megaphone,
  Phone,
  Mail,
  MapPin,
  Briefcase,
  HeartHandshake,
  Pencil,
  Printer,
  ChevronRight,
  HelpCircle,
  ExternalLink,
  AlertCircle,
  ShieldCheck,
  Trophy,
} from 'lucide-react';
import Link from 'next/link';
import EditParentModal from '@/components/parents/EditParentModal';

interface StatsData {
  totalStudents: number;
  totalTeachers: number;
  totalClasses: number;
  totalSubjects: number;
  totalBooks: number;
}

interface StudentStats {
  studentId: string;
  name: string;
  nis: string;
  nisn?: string | null;
  className: string;
  homeroomTeacher?: {
    name: string;
    phone: string;
    nip: string;
  } | null;
  parents?: Array<{
    id: string;
    name: string;
    relationship: string;
    phone: string;
    email: string | null;
    occupation: string | null;
    address: string | null;
  }>;
  attendanceStats?: {
    rate: number;
    total: number;
    present: number;
    sick: number;
    permission: number;
    alpha: number;
  };
  attendanceRate: number;
  avgScore?: number;
  activeBorrowings: number;
  recentGrades?: Array<{
    id: string;
    subject: string;
    itemName: string;
    score: number;
    type: string;
  }>;
}

interface ActivityLog {
  id: string;
  module: string;
  action: string;
  description: string;
  roleName: string | null;
  createdAt: string;
}

interface RecentAnnouncement {
  id: string;
  title: string;
  targetRole: string | null;
  publishDate: string;
  authorName: string | null;
}

export default function DashboardPage() {
  const [role, setRole] = useState<string>('SUPER_ADMIN');
  const [userName, setUserName] = useState<string>('');
  const [stats, setStats] = useState<StatsData>({
    totalStudents: 0,
    totalTeachers: 0,
    totalClasses: 0,
    totalSubjects: 0,
    totalBooks: 0,
  });
  const [studentStats, setStudentStats] = useState<StudentStats | null>(null);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [announcements, setAnnouncements] = useState<RecentAnnouncement[]>([]);
  const [loading, setLoading] = useState(true);

  // Student & Parent Unified Portal Tab State
  const [activeStudentTab, setActiveStudentTab] = useState<'academics' | 'parents' | 'announcements'>('academics');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [selectedParentToEdit, setSelectedParentToEdit] = useState<any | null>(null);

  const loadData = () => {
    fetch('/api/dashboard/stats')
      .then((res) => res.json())
      .then((data) => {
        if (data.role) setRole(data.role);
        if (data.name) setUserName(data.name);
        if (data.stats) setStats(data.stats);
        if (data.studentStats) setStudentStats(data.studentStats);
        if (data.recentLogs) setLogs(data.recentLogs);
        if (data.recentAnnouncements) setAnnouncements(data.recentAnnouncements);
      })
      .catch((err) => console.error('Failed to load stats:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  // Admin / Staff Stat Cards
  const adminCards = [
    {
      label: 'Total Siswa Aktif',
      value: stats.totalStudents,
      icon: GraduationCap,
      color: 'bg-[#0C2340]',
      lightColor: 'bg-amber-50 text-amber-900 border border-amber-200',
      href: '/dashboard/students',
    },
    {
      label: 'Guru & Tenaga Pendidik',
      value: stats.totalTeachers,
      icon: Users,
      color: 'bg-[#0C2340]',
      lightColor: 'bg-emerald-50 text-emerald-900 border border-emerald-200',
      href: '/dashboard/teachers',
    },
    {
      label: 'Total Kelas Aktif',
      value: stats.totalClasses,
      icon: School,
      color: 'bg-[#0C2340]',
      lightColor: 'bg-blue-50 text-blue-900 border border-blue-200',
      href: '/dashboard/classes',
    },
    {
      label: 'Mata Pelajaran',
      value: stats.totalSubjects,
      icon: BookOpen,
      color: 'bg-[#0C2340]',
      lightColor: 'bg-indigo-50 text-indigo-900 border border-indigo-200',
      href: '/dashboard/subjects',
    },
    {
      label: 'Koleksi Perpustakaan',
      value: stats.totalBooks,
      icon: Library,
      color: 'bg-[#0C2340]',
      lightColor: 'bg-rose-50 text-rose-900 border border-rose-200',
      href: '/dashboard/library',
    },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* ======================================================== */}
      {/* 1. STUDENT & PARENT UNIFIED PORTAL VIEW                 */}
      {/* ======================================================== */}
      {role === 'SISWA' || role === 'ORANG_TUA' ? (
        <div className="space-y-6">
          {/* Welcome Banner */}
          <div className="bg-gradient-to-br from-[#0C2340] via-[#0E2C52] to-[#081729] rounded-3xl p-6 sm:p-8 text-white shadow-xl border-2 border-amber-500/30 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-xl">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/40 backdrop-blur-sm">
                <HeartHandshake className="w-3.5 h-3.5 text-amber-400" />
                Portal Terpadu Siswa & Wali Murid
              </span>
              <h1 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight">
                Selamat Datang, {userName || studentStats?.name || 'Siswa & Orang Tua'}
              </h1>
              <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
                Portal pantau perkembangan belajar, hasil ujian, kehadiran harian siswa, serta sarana komunikasi langsung orang tua dengan wali kelas.
              </p>

              {/* Homeroom Teacher Badge with WhatsApp link */}
              {studentStats?.homeroomTeacher && (
                <div className="pt-2 flex flex-wrap items-center gap-2">
                  <div className="inline-flex items-center space-x-2 bg-white/10 px-3 py-1.5 rounded-xl border border-white/10 text-xs text-slate-200">
                    <User className="w-3.5 h-3.5 text-amber-300" />
                    <span>Wali Kelas: <strong className="text-white">{studentStats.homeroomTeacher.name}</strong></span>
                  </div>
                  <a
                    href={`https://wa.me/${studentStats.homeroomTeacher.phone.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/30 transition hover:scale-105"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Konsultasi via WhatsApp</span>
                  </a>
                </div>
              )}
            </div>

            <div className="flex sm:flex-col gap-2 flex-shrink-0">
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 text-center border border-white/10">
                <p className="text-[11px] font-medium text-amber-300">Rombongan Belajar</p>
                <p className="text-base font-serif font-bold text-white">
                  {studentStats?.className || 'X MIPA 1'}
                </p>
                <span className="text-[10px] text-slate-300 font-mono block">
                  NIS: {studentStats?.nis || '-'}
                </span>
                {studentStats?.nisn && (
                  <span className="text-[9px] text-slate-400 font-mono block">
                    NISN: {studentStats.nisn}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Sub-Tab Navigation */}
          <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap gap-2 text-xs font-bold">
            <button
              onClick={() => setActiveStudentTab('academics')}
              className={`px-4 py-2 rounded-xl transition flex items-center space-x-2 ${
                activeStudentTab === 'academics'
                  ? 'bg-[#0C2340] text-amber-300 shadow-md border border-amber-500/30'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Award className="w-4 h-4 text-amber-400" />
              <span>Akademik & Hasil Rapor</span>
            </button>
            <button
              onClick={() => setActiveStudentTab('parents')}
              className={`px-4 py-2 rounded-xl transition flex items-center space-x-2 ${
                activeStudentTab === 'parents'
                  ? 'bg-[#0C2340] text-amber-300 shadow-md border border-amber-500/30'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <HeartHandshake className="w-4 h-4 text-amber-400" />
              <span>Data Orang Tua & Kontak Darurat ({studentStats?.parents?.length || 0})</span>
            </button>
            <button
              onClick={() => setActiveStudentTab('announcements')}
              className={`px-4 py-2 rounded-xl transition flex items-center space-x-2 ${
                activeStudentTab === 'announcements'
                  ? 'bg-[#0C2340] text-amber-300 shadow-md border border-amber-500/30'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Megaphone className="w-4 h-4 text-amber-400" />
              <span>Warta Sekolah ({announcements.length})</span>
            </button>
          </div>

          {/* TAB CONTENT 1: ACADEMICS & REPORT CARDS */}
          {activeStudentTab === 'academics' && (
            <div className="space-y-6">
              {/* Quick Stat Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Link
                  href="/dashboard/attendance"
                  className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition group"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                      <CheckSquare className="w-5 h-5" />
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition" />
                  </div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Kehadiran Siswa
                  </p>
                  <h3 className="text-2xl font-bold text-slate-900 mt-1">
                    {studentStats?.attendanceRate ?? 100}%
                  </h3>
                  {studentStats?.attendanceStats ? (
                    <p className="text-[11px] text-slate-500 mt-1">
                      Hadir: <strong className="text-emerald-600">{studentStats.attendanceStats.present}</strong> • Sakit: {studentStats.attendanceStats.sick} • Izin: {studentStats.attendanceStats.permission}
                    </p>
                  ) : (
                    <p className="text-xs text-emerald-600 mt-1 font-medium">Status kehadiran sangat baik</p>
                  )}
                </Link>

                <Link
                  href="/dashboard/grades"
                  className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition group"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                      <Award className="w-5 h-5" />
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition" />
                  </div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Rata-Rata Nilai (IPK)
                  </p>
                  <h3 className="text-2xl font-bold text-indigo-700 mt-1">
                    {studentStats?.avgScore ?? 85.0}
                  </h3>
                  <p className="text-xs text-emerald-600 mt-1 font-medium">Predikat A (Sangat Memuaskan)</p>
                </Link>

                <Link
                  href="/dashboard/library"
                  className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition group"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                      <BookMarked className="w-5 h-5" />
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition" />
                  </div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Pinjaman Buku
                  </p>
                  <h3 className="text-2xl font-bold text-slate-900 mt-1">
                    {studentStats?.activeBorrowings ?? 0} Buku
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">Sedang aktif dipinjam</p>
                </Link>

                <Link
                  href="/dashboard/achievements"
                  className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition group"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                      <Trophy className="w-5 h-5" />
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-amber-600 transition" />
                  </div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Prestasi & Kejuaraan
                  </p>
                  <h3 className="text-2xl font-bold text-slate-900 mt-1">
                    Portofolio
                  </h3>
                  <p className="text-xs text-amber-600 mt-1 font-medium">Hall of Fame & Sertifikat</p>
                </Link>
              </div>

              {/* Recent Grades Table */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">Hasil Nilai Tugas & Penilaian Terakhir</h3>
                    <p className="text-xs text-slate-500">Transparansi nilai yang telah divalidasi oleh dewan guru pengampu</p>
                  </div>
                  <Link
                    href="/dashboard/grades"
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs transition"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Buka Lembar Rapor Lengkap</span>
                  </Link>
                </div>

                {studentStats?.recentGrades && studentStats.recentGrades.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 text-slate-500 uppercase tracking-wider font-bold border-b border-slate-200">
                          <th className="py-2.5 px-3">Mata Pelajaran</th>
                          <th className="py-2.5 px-3">Jenis Penilaian</th>
                          <th className="py-2.5 px-3">Nama Tugas/Ulangan</th>
                          <th className="py-2.5 px-3 text-center">Nilai Angka</th>
                          <th className="py-2.5 px-3 text-center">Status KKM (75.0)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium">
                        {studentStats.recentGrades.map((g) => (
                          <tr key={g.id} className="hover:bg-slate-50/60 transition">
                            <td className="py-2.5 px-3 font-bold text-slate-800">{g.subject}</td>
                            <td className="py-2.5 px-3">
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                                {g.type}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-slate-600">{g.itemName}</td>
                            <td className="py-2.5 px-3 text-center font-mono font-bold text-sm text-slate-900">
                              {g.score}
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              {g.score >= 75 ? (
                                <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px]">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                                  <span>Tuntas</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 font-bold text-[10px]">
                                  <AlertCircle className="w-3 h-3 text-rose-500" />
                                  <span>Remedial</span>
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 py-6 text-center">Belum ada catatan nilai yang dipublikasikan.</p>
                )}
              </div>
            </div>
          )}

          {/* TAB CONTENT 2: PARENTS DATA & EMERGENCY CONTACT */}
          {activeStudentTab === 'parents' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {studentStats?.parents && studentStats.parents.length > 0 ? (
                  studentStats.parents.map((p) => (
                    <div
                      key={p.id}
                      className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4 hover:border-indigo-300 transition"
                    >
                      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-700 font-bold flex items-center justify-center text-sm border border-indigo-100">
                            {p.relationship === 'Ayah' ? '👨' : p.relationship === 'Ibu' ? '👩' : '👤'}
                          </div>
                          <div>
                            <h4 className="font-extrabold text-slate-900 text-sm">{p.name}</h4>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700">
                              Hubungan: {p.relationship}
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={() => setSelectedParentToEdit(p)}
                          className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 border border-slate-200 text-xs font-bold inline-flex items-center space-x-1 transition"
                          title="Perbarui Kontak"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                          <span>Perbarui</span>
                        </button>
                      </div>

                      <div className="space-y-2.5 text-xs">
                        <div className="flex items-center justify-between py-1 border-b border-slate-50">
                          <span className="text-slate-400 font-medium flex items-center">
                            <Phone className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
                            Telepon / WA:
                          </span>
                          <a
                            href={`https://wa.me/${p.phone.replace(/[^0-9]/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-mono font-bold text-emerald-600 hover:underline flex items-center"
                          >
                            <span>{p.phone}</span>
                            <ExternalLink className="w-3 h-3 ml-1" />
                          </a>
                        </div>

                        <div className="flex items-center justify-between py-1 border-b border-slate-50">
                          <span className="text-slate-400 font-medium flex items-center">
                            <Mail className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
                            Email:
                          </span>
                          <span className="font-mono text-slate-700">{p.email || '-'}</span>
                        </div>

                        <div className="flex items-center justify-between py-1 border-b border-slate-50">
                          <span className="text-slate-400 font-medium flex items-center">
                            <Briefcase className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
                            Pekerjaan:
                          </span>
                          <span className="font-semibold text-slate-800">{p.occupation || '-'}</span>
                        </div>

                        <div className="pt-1">
                          <span className="text-slate-400 font-medium flex items-center mb-1">
                            <MapPin className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
                            Alamat Tinggal:
                          </span>
                          <p className="text-slate-700 text-[11px] leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                            {p.address || 'Alamat domisili sama dengan siswa.'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="md:col-span-2 p-12 text-center bg-white rounded-3xl border border-slate-200 text-slate-400 text-xs">
                    Belum ada data orang tua / wali yang ditautkan.
                  </div>
                )}
              </div>

              {/* Consultation & Emergency Notice */}
              <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-indigo-950 p-6 rounded-3xl border border-emerald-800/40 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <h4 className="text-sm font-bold flex items-center">
                    <ShieldCheck className="w-4 h-4 mr-2 text-emerald-400" />
                    Pemberitahuan Komunikasi & Keadaan Darurat
                  </h4>
                  <p className="text-xs text-slate-300">
                    Pihak sekolah akan menghubungi nomor di atas saat terjadi kendala akademik, dispensasi dinas, atau keadaan darurat di sekolah.
                  </p>
                </div>
                {studentStats?.homeroomTeacher && (
                  <a
                    href={`https://wa.me/${studentStats.homeroomTeacher.phone.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 transition flex items-center justify-center space-x-2 flex-shrink-0"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>WhatsApp Wali Kelas</span>
                  </a>
                )}
              </div>
            </div>
          )}

          {/* TAB CONTENT 3: ANNOUNCEMENTS */}
          {activeStudentTab === 'announcements' && (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Megaphone className="w-4 h-4 text-indigo-600" />
                  Warta & Surat Edaran Resmi Sekolah untuk Orang Tua & Siswa
                </h3>
                <Link
                  href="/dashboard/announcements"
                  className="text-xs text-indigo-600 font-bold hover:underline"
                >
                  Arsip Lengkap
                </Link>
              </div>

              {announcements.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">Belum ada pengumuman baru untuk orang tua.</p>
              ) : (
                <div className="divide-y divide-slate-100 text-xs">
                  {announcements.map((a) => (
                    <Link
                      key={a.id}
                      href="/dashboard/announcements"
                      className="py-3.5 flex items-center justify-between gap-4 hover:bg-slate-50 px-2 rounded-xl transition group"
                    >
                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700">
                            {a.targetRole === 'ALL' ? 'Semua Civitas' : 'Khusus Orang Tua / Siswa'}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400">
                            {new Date(a.publishDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                          </span>
                        </div>
                        <p className="font-bold text-slate-900 group-hover:text-indigo-600 transition truncate text-sm">
                          {a.title}
                        </p>
                        <p className="text-[11px] text-slate-400">Diterbitkan oleh: {a.authorName || 'Humas Sekolah'}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-600 transition" />
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        /* ======================================================== */
        /* 2. ADMIN & STAFF VIEW                                   */
        /* ======================================================== */
        <div className="space-y-8">
          {/* Header Banner: Regal Navy & Gold */}
          <div className="bg-gradient-to-r from-[#0C2340] via-[#0E2C52] to-[#081729] rounded-3xl p-6 sm:p-8 text-white shadow-xl border-2 border-amber-500/30 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/40 backdrop-blur-sm mb-3">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                Sistem Berjalan Normal (Full-Stack Live)
              </span>
              <h1 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight">
                Selamat Datang, {userName || 'Administrator'}
              </h1>
              <p className="mt-2 text-slate-300 text-sm max-w-2xl leading-relaxed">
                Pusat kendali operasional terintegrasi SMAN 1 Nusantara: manajemen data akademik, absensi siswa & GTK, rekapitulasi nilai rapor, sirkulasi perpustakaan, dan audit log keamanan.
              </p>
            </div>

            <div className="flex sm:flex-col gap-2 flex-shrink-0">
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 text-center border border-white/10">
                <p className="text-[11px] font-medium text-amber-300">Tahun Akademik</p>
                <p className="text-base font-serif font-bold text-white">2026/2027</p>
                <span className="text-[10px] text-emerald-300 font-medium">Semester Ganjil</span>
              </div>
            </div>
          </div>

          {/* Grid Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {adminCards.map((card) => {
              const Icon = card.icon;
              return (
                <div
                  key={card.label}
                  className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition group"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center ${card.lightColor}`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <Link
                      href={card.href}
                      className="text-slate-400 group-hover:text-indigo-600 transition"
                    >
                      <ArrowUpRight className="w-4 h-4" />
                    </Link>
                  </div>
                  <p className="text-xs font-medium text-slate-500">{card.label}</p>
                  <h3 className="text-2xl font-bold text-slate-900 mt-1">
                    {loading ? '-' : card.value}
                  </h3>
                </div>
              );
            })}
          </div>

          {/* Bottom Grid: Announcements & Audit Logs */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Announcements Feed */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
                  <h3 className="font-semibold text-slate-800 flex items-center gap-2 text-sm">
                    <Megaphone className="w-4 h-4 text-indigo-600" />
                    Warta & Pengumuman Sekolah
                  </h3>
                  <Link
                    href="/dashboard/announcements"
                    className="text-xs text-indigo-600 font-semibold hover:underline flex items-center"
                  >
                    Kelola Semua <ArrowUpRight className="w-3.5 h-3.5 ml-0.5" />
                  </Link>
                </div>

                {announcements.length === 0 ? (
                  <p className="text-xs text-slate-400 py-6 text-center">Belum ada pengumuman aktif</p>
                ) : (
                  <div className="divide-y divide-slate-100 text-xs">
                    {announcements.map((a) => (
                      <Link
                        key={a.id}
                        href="/dashboard/announcements"
                        className="py-3 flex items-center justify-between gap-4 hover:bg-slate-50 px-2 rounded-xl transition group"
                      >
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900 group-hover:text-indigo-600 transition truncate">
                            {a.title}
                          </p>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            {a.authorName || 'Humas Sekolah'} • Target: {a.targetRole}
                          </p>
                        </div>
                        <span className="text-[10px] font-mono text-slate-400 whitespace-nowrap">
                          {new Date(a.publishDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                        </span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Audit Logs (Only for Super Admin / Kepala Sekolah) */}
            {(role === 'SUPER_ADMIN' || role === 'KEPALA_SEKOLAH') && (
              <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
                    <h3 className="font-semibold text-slate-800 flex items-center gap-2 text-sm">
                      <ShieldAlert className="w-4 h-4 text-indigo-600" />
                      Log Aktivitas Terbaru (Audit Keamanan)
                    </h3>
                  </div>

                  {logs.length === 0 ? (
                    <p className="text-xs text-slate-400 py-6 text-center">Belum ada aktivitas tercatat</p>
                  ) : (
                    <div className="divide-y divide-slate-100 text-xs">
                      {logs.map((log) => (
                        <div key={log.id} className="py-2.5 flex items-center justify-between gap-4">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="px-2 py-0.5 rounded font-mono font-medium text-[10px] bg-slate-100 text-slate-700">
                              {log.module}
                            </span>
                            <span className="text-slate-700 truncate">{log.description}</span>
                          </div>
                          <span className="text-slate-400 whitespace-nowrap font-mono text-[11px]">
                            {new Date(log.createdAt).toLocaleTimeString('id-ID', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      {/* Modal Edit Kontak Orang Tua / Wali */}
      <EditParentModal
        isOpen={Boolean(selectedParentToEdit)}
        onClose={() => setSelectedParentToEdit(null)}
        onSuccess={() => loadData()}
        parent={selectedParentToEdit}
      />
    </div>
  );
}
