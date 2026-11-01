'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Clock,
  Calendar,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  RefreshCw,
  Search,
  Filter,
  UserCheck,
  UserX,
  AlertTriangle,
  Award,
  Users,
  Building2,
  Pencil,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Sparkles,
  ArrowRight,
  TrendingUp,
  MapPin,
  Check,
  LogOut,
  LogIn
} from 'lucide-react';
import TeacherAttendanceModal from '@/components/teacher-attendance/TeacherAttendanceModal';

interface TeacherAttendanceRecord {
  teacher: {
    id: string;
    name: string;
    nip: string;
    position: string | null;
    phone: string | null;
  };
  attendance: {
    id: string;
    status: 'HADIR' | 'SAKIT' | 'IZIN' | 'ALPA' | 'DISPENSASI';
    checkInTime: string | null;
    checkOutTime: string | null;
    notes: string | null;
    recordedBy: string | null;
    isLate: boolean;
    lateMinutes: number;
  } | null;
}

interface TeacherRecapItem {
  teacher: {
    id: string;
    name: string;
    nip: string;
    position: string | null;
  };
  stats: {
    recordedDays: number;
    hadirCount: number;
    lateCount: number;
    lateMinutesTotal: number;
    sakitCount: number;
    izinCount: number;
    dutyCount: number;
    alpaCount: number;
    percentage: number;
    rating: 'SANGAT_BAIK' | 'BAIK' | 'CUKUP' | 'PERLU_PEMBINAAN';
  };
}

const STATUS_BADGE: Record<string, { label: string; bg: string; text: string; border: string }> = {
  HADIR: { label: 'HADIR', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  DISPENSASI: { label: 'DINAS LUAR', bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
  IZIN: { label: 'IZIN', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  SAKIT: { label: 'SAKIT', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  ALPA: { label: 'ALPA', bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
};

const RATING_BADGE: Record<string, { label: string; bg: string }> = {
  SANGAT_BAIK: { label: 'Sangat Disiplin', bg: 'bg-emerald-100 text-emerald-800' },
  BAIK: { label: 'Baik', bg: 'bg-blue-100 text-blue-800' },
  CUKUP: { label: 'Cukup', bg: 'bg-amber-100 text-amber-800' },
  PERLU_PEMBINAAN: { label: 'Perlu Pembinaan', bg: 'bg-rose-100 text-rose-800' },
};

export default function TeacherAttendancePage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'daily' | 'recap'>('daily');
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Daily State
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [records, setRecords] = useState<TeacherAttendanceRecord[]>([]);
  const [stats, setStats] = useState({
    totalTeachers: 0,
    presentCount: 0,
    lateCount: 0,
    sickCount: 0,
    permissionCount: 0,
    dutyCount: 0,
    alphaCount: 0,
    attendanceRate: 0,
  });
  const [rules, setRules] = useState({
    defaultStartTime: '07:00',
    lateToleranceMinutes: 15,
  });
  const [dailyLoading, setDailyLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Self Attendance State
  const [currentTime, setCurrentTime] = useState('');
  const [isCheckingIn, setIsCheckingIn] = useState(false);

  // Recap State
  const [recapMonth, setRecapMonth] = useState(() => new Date().getMonth() + 1);
  const [recapYear, setRecapYear] = useState(() => new Date().getFullYear());
  const [recapList, setRecapList] = useState<TeacherRecapItem[]>([]);
  const [recapLoading, setRecapLoading] = useState(false);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [selectedTeacher, setSelectedTeacher] = useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [selectedAttendance, setSelectedAttendance] = useState<any>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Clock Ticker
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // 1. Fetch User Session
  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated && data.user) {
          setCurrentUser(data.user);
        }
      })
      .catch(() => {});
  }, []);

  // 2. Fetch Daily Attendance
  const fetchDaily = useCallback(async () => {
    setDailyLoading(true);
    try {
      const params = new URLSearchParams({ date: selectedDate });
      const res = await fetch(`/api/teacher-attendance?${params.toString()}`);
      if (!res.ok) throw new Error('Gagal mengambil data presensi');

      const data = await res.json();
      setRecords(data.records || []);
      setStats(data.stats || {});
      if (data.rules) setRules(data.rules);
    } catch (err: unknown) {
      console.error(err);
      showToast('Gagal memuat presensi harian', 'error');
    } finally {
      setDailyLoading(false);
    }
  }, [selectedDate]);

  // 3. Fetch Monthly Recap
  const fetchRecap = useCallback(async () => {
    setRecapLoading(true);
    try {
      const params = new URLSearchParams({
        month: recapMonth.toString(),
        year: recapYear.toString(),
      });
      const res = await fetch(`/api/teacher-attendance/recap?${params.toString()}`);
      if (!res.ok) throw new Error('Gagal mengambil rekapitulasi');

      const data = await res.json();
      setRecapList(data.recap || []);
    } catch (err: unknown) {
      console.error(err);
      showToast('Gagal memuat rekapitulasi presensi', 'error');
    } finally {
      setRecapLoading(false);
    }
  }, [recapMonth, recapYear]);

  useEffect(() => {
    if (activeTab === 'daily') {
      fetchDaily();
    } else {
      fetchRecap();
    }
  }, [activeTab, fetchDaily, fetchRecap]);

  // Self Check-in / Check-out Handler
  const handleSelfCheckIn = async () => {
    setIsCheckingIn(true);
    try {
      const res = await fetch('/api/teacher-attendance/checkin', {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal memproses presensi');

      showToast(data.message, 'success');
      fetchDaily();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Terjadi kesalahan sistem', 'error');
    } finally {
      setIsCheckingIn(false);
    }
  };

  const handleExportExcel = () => {
    window.location.href = `/api/teacher-attendance/export?date=${selectedDate}`;
  };

  // Filtered daily records
  const filteredRecords = records.filter((r) => {
    const matchSearch =
      r.teacher.name.toLowerCase().includes(search.toLowerCase()) ||
      r.teacher.nip.toLowerCase().includes(search.toLowerCase());
    const currentStatus = r.attendance?.status || 'ALPA';
    const matchStatus = !statusFilter || currentStatus === statusFilter;
    return matchSearch && matchStatus;
  });

  // Current user's attendance status today
  const myRecord = currentUser?.teacher
    ? records.find((r) => r.teacher.id === currentUser.teacher.id)
    : null;

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-16">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center space-x-3 px-5 py-3.5 rounded-2xl shadow-xl border text-sm font-semibold transition-all duration-300 animate-in slide-in-from-bottom-5 ${
            toastMessage.type === 'success'
              ? 'bg-slate-900 text-emerald-300 border-emerald-500/30'
              : 'bg-rose-950 text-rose-200 border-rose-500/30'
          }`}
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 border border-slate-800 p-7 md:p-8 text-white shadow-2xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-semibold tracking-wide">
              <Clock className="w-3.5 h-3.5 text-indigo-400" />
              <span>Manajemen Kedisiplinan & Presensi Pendidik (GTK)</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
              Presensi Guru & Tenaga Kependidikan
            </h1>
            <p className="text-slate-300 text-xs md:text-sm leading-relaxed">
              Monitoring absensi harian guru, pencatatan waktu kehadiran otomatis, toleransi keterlambatan ({rules.lateToleranceMinutes} menit), serta evaluasi kedisiplinan semester.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => {
                if (activeTab === 'daily') fetchDaily();
                else fetchRecap();
              }}
              className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 border border-slate-700/70 text-xs font-semibold shadow-sm transition hover:scale-[1.02] active:scale-[0.98]"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${dailyLoading || recapLoading ? 'animate-spin' : ''}`} />
              <span>Segarkan</span>
            </button>
            <button
              onClick={handleExportExcel}
              className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 transition hover:scale-[1.02] active:scale-[0.98]"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Ekspor Excel (.xlsx)</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mt-8 flex border-b border-slate-800">
          <button
            onClick={() => setActiveTab('daily')}
            className={`pb-3.5 px-4 text-xs font-bold transition flex items-center space-x-2 border-b-2 -mb-px ${
              activeTab === 'daily'
                ? 'border-indigo-400 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Clock className="w-4 h-4 text-indigo-400" />
            <span>Presensi Harian GTK</span>
          </button>
          <button
            onClick={() => setActiveTab('recap')}
            className={`pb-3.5 px-4 text-xs font-bold transition flex items-center space-x-2 border-b-2 -mb-px ${
              activeTab === 'recap'
                ? 'border-indigo-400 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <TrendingUp className="w-4 h-4 text-indigo-400" />
            <span>Rekapitulasi Bulanan & Evaluasi</span>
          </button>
        </div>
      </div>

      {/* QUICK ATTENDANCE CARD (KHUSUS GURU) */}
      {currentUser?.role === 'GURU' && (
        <div className="bg-gradient-to-r from-indigo-900 via-indigo-950 to-slate-900 p-6 rounded-3xl border border-indigo-800/50 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-indigo-300 text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>KARTU PRESENSI MANDIRI HARI INI</span>
            </div>
            <h3 className="text-xl font-black">
              Halo, {currentUser?.name || currentUser?.username}!
            </h3>
            <p className="text-xs text-slate-300">
              Jam masuk standar sekolah: <strong className="text-white">{rules.defaultStartTime} WIB</strong> (Toleransi batas hadir:{' '}
              <strong className="text-white font-mono">+{rules.lateToleranceMinutes} mnt</strong>).
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4">
            {/* Live Clock Display */}
            <div className="bg-white/10 px-5 py-3 rounded-2xl border border-white/15 text-center font-mono">
              <span className="text-[10px] text-slate-300 block font-sans">Waktu Sistem (WIB)</span>
              <span className="text-2xl font-black text-white tracking-wider">{currentTime || '--:--:--'}</span>
            </div>

            {/* Check-In / Check-Out Action Button */}
            {!myRecord?.attendance?.checkInTime ? (
              <button
                onClick={handleSelfCheckIn}
                disabled={isCheckingIn}
                className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold shadow-lg shadow-emerald-600/30 transition hover:scale-105 active:scale-95 flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                {isCheckingIn ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <LogIn className="w-4 h-4" />
                )}
                <span>Check-In Jam Masuk</span>
              </button>
            ) : !myRecord?.attendance?.checkOutTime ? (
              <button
                onClick={handleSelfCheckIn}
                disabled={isCheckingIn}
                className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold shadow-lg shadow-indigo-600/30 transition hover:scale-105 active:scale-95 flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                {isCheckingIn ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <LogOut className="w-4 h-4" />
                )}
                <span>Check-Out Jam Pulang</span>
              </button>
            ) : (
              <div className="px-5 py-3 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Presensi Hari Ini Telah Lengkap</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 1: PRESENSI HARIAN GTK */}
      {activeTab === 'daily' && (
        <div className="space-y-6">
          {/* Summary KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
            <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total GTK</span>
              <p className="text-2xl font-black text-slate-900 mt-1">{stats.totalTeachers}</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Pendidik aktif</p>
            </div>

            <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block">Hadir Tepat Waktu</span>
              <p className="text-2xl font-black text-emerald-600 mt-1">
                {stats.presentCount - stats.lateCount}
              </p>
              <p className="text-[11px] text-emerald-600 font-medium mt-0.5">Disiplin tinggi</p>
            </div>

            <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider block">Terlambat</span>
              <p className="text-2xl font-black text-amber-600 mt-1">{stats.lateCount}</p>
              <p className="text-[11px] text-amber-600 font-medium mt-0.5">Lewat batas toleransi</p>
            </div>

            <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider block">Izin / Dinas Luar</span>
              <p className="text-2xl font-black text-indigo-600 mt-1">
                {stats.dutyCount + stats.permissionCount + stats.sickCount}
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">Tugas & izin resmi</p>
            </div>

            <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-xs col-span-2 lg:col-span-1">
              <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wider block">Alpa / Belum Hadir</span>
              <p className="text-2xl font-black text-rose-600 mt-1">{stats.alphaCount}</p>
              <p className="text-[11px] text-rose-600 font-medium mt-0.5">Tanpa keterangan</p>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              {/* Date Selector */}
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-slate-600 whitespace-nowrap">Tanggal:</span>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-bold bg-white"
                />
              </div>

              {/* Status Filter */}
              <div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-semibold bg-white"
                >
                  <option value="">Semua Status Kehadiran</option>
                  <option value="HADIR">Status: HADIR</option>
                  <option value="DISPENSASI">Status: DINAS LUAR</option>
                  <option value="IZIN">Status: IZIN</option>
                  <option value="SAKIT">Status: SAKIT</option>
                  <option value="ALPA">Status: ALPA</option>
                </select>
              </div>
            </div>

            {/* Search Input */}
            <div className="relative w-full md:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Cari nama guru atau NIP..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-slate-50/50"
              />
            </div>
          </div>

          {/* Master Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold">
                    <th className="py-3 px-4">Nama Guru & Pendidik</th>
                    <th className="py-3 px-4">Jabatan / Tugas</th>
                    <th className="py-3 px-4">Jam Masuk</th>
                    <th className="py-3 px-4">Jam Pulang</th>
                    <th className="py-3 px-4">Status Kehadiran</th>
                    <th className="py-3 px-4">Keterangan / Catatan</th>
                    <th className="py-3 px-4 text-center">Tindakan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {dailyLoading ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto text-indigo-600 mb-2" />
                        <p>Memuat presensi guru...</p>
                      </td>
                    </tr>
                  ) : filteredRecords.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        <Users className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                        <p className="font-semibold text-slate-600">Tidak ada data guru yang sesuai dengan pencarian.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredRecords.map((r) => {
                      const att = r.attendance;
                      const statusKey = att?.status || 'ALPA';
                      const badge = STATUS_BADGE[statusKey] || STATUS_BADGE.ALPA;

                      return (
                        <tr key={r.teacher.id} className="hover:bg-slate-50/60 transition group">
                          {/* Nama & NIP */}
                          <td className="py-3 px-4">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 text-white font-extrabold flex items-center justify-center text-xs shadow-2xs">
                                {r.teacher.name.charAt(0)}
                              </div>
                              <div>
                                <span className="font-bold text-slate-900 block">{r.teacher.name}</span>
                                <span className="text-[10px] text-slate-400 font-mono block">NIP: {r.teacher.nip}</span>
                              </div>
                            </div>
                          </td>

                          {/* Jabatan */}
                          <td className="py-3 px-4 text-slate-600">
                            {r.teacher.position || 'Guru Pengajar'}
                          </td>

                          {/* Jam Masuk */}
                          <td className="py-3 px-4 whitespace-nowrap">
                            {att?.checkInTime ? (
                              <div className="flex items-center space-x-2">
                                <span className="font-mono font-bold text-slate-800 text-xs">
                                  {new Date(att.checkInTime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                                {att.isLate ? (
                                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                    +{att.lateMinutes}m
                                  </span>
                                ) : (
                                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                    Tepat
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-300 font-mono">-</span>
                            )}
                          </td>

                          {/* Jam Pulang */}
                          <td className="py-3 px-4 whitespace-nowrap font-mono">
                            {att?.checkOutTime ? (
                              <span className="font-bold text-slate-800 text-xs">
                                {new Date(att.checkOutTime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            ) : (
                              <span className="text-slate-300">-</span>
                            )}
                          </td>

                          {/* Status */}
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span className={`px-2.5 py-0.5 rounded-md font-bold text-[10px] border ${badge.bg} ${badge.text} ${badge.border}`}>
                              {badge.label}
                            </span>
                          </td>

                          {/* Catatan */}
                          <td className="py-3 px-4 max-w-xs truncate text-slate-600" title={att?.notes || '-'}>
                            {att?.notes || <span className="text-slate-300">-</span>}
                          </td>

                          {/* Tindakan */}
                          <td className="py-3 px-4 whitespace-nowrap text-center">
                            <button
                              onClick={() => {
                                setSelectedTeacher(r.teacher);
                                setSelectedAttendance(att);
                                setModalOpen(true);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-[11px] font-bold inline-flex items-center space-x-1 transition shadow-2xs"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                              <span>{att ? 'Koreksi' : 'Catat'}</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: REKAPITULASI BULANAN & EVALUASI */}
      {activeTab === 'recap' && (
        <div className="space-y-6">
          {/* Filter Month/Year */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center space-x-3">
            <span className="text-xs font-bold text-slate-700">Periode Rekapitulasi:</span>
            <select
              value={recapMonth}
              onChange={(e) => setRecapMonth(Number(e.target.value))}
              className="px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-bold bg-white"
            >
              {[
                { v: 1, l: 'Januari' },
                { v: 2, l: 'Februari' },
                { v: 3, l: 'Maret' },
                { v: 4, l: 'April' },
                { v: 5, l: 'Mei' },
                { v: 6, l: 'Juni' },
                { v: 7, l: 'Juli' },
                { v: 8, l: 'Agustus' },
                { v: 9, l: 'September' },
                { v: 10, l: 'Oktober' },
                { v: 11, l: 'November' },
                { v: 12, l: 'Desember' },
              ].map((m) => (
                <option key={m.v} value={m.v}>
                  Bulan: {m.l}
                </option>
              ))}
            </select>

            <select
              value={recapYear}
              onChange={(e) => setRecapYear(Number(e.target.value))}
              className="px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-bold bg-white"
            >
              <option value={2026}>Tahun 2026</option>
              <option value={2027}>Tahun 2027</option>
            </select>
          </div>

          {/* Master Table Recap */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold">
                    <th className="py-3 px-4">Nama Pendidik</th>
                    <th className="py-3 px-4 text-center">Hari Terdata</th>
                    <th className="py-3 px-4 text-center">Hadir</th>
                    <th className="py-3 px-4 text-center">Terlambat</th>
                    <th className="py-3 px-4 text-center">Dinas Luar</th>
                    <th className="py-3 px-4 text-center">Izin / Sakit</th>
                    <th className="py-3 px-4 text-center">Alpa</th>
                    <th className="py-3 px-4 text-center">Persentase</th>
                    <th className="py-3 px-4 text-center">Evaluasi Disiplin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recapLoading ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-slate-400">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto text-indigo-600 mb-2" />
                        <p>Mengkalkulasi rekapitulasi kehadiran...</p>
                      </td>
                    </tr>
                  ) : recapList.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-slate-400">
                        <Users className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                        <p className="font-semibold text-slate-600">Belum ada data presensi pada periode ini.</p>
                      </td>
                    </tr>
                  ) : (
                    recapList.map((item) => {
                      const ratingBadge = RATING_BADGE[item.stats.rating] || RATING_BADGE.SANGAT_BAIK;

                      return (
                        <tr key={item.teacher.id} className="hover:bg-slate-50/60 transition">
                          <td className="py-3 px-4">
                            <span className="font-bold text-slate-900 block">{item.teacher.name}</span>
                            <span className="text-[10px] text-slate-400 font-mono">NIP: {item.teacher.nip}</span>
                          </td>
                          <td className="py-3 px-4 text-center font-mono font-bold text-slate-700">
                            {item.stats.recordedDays}
                          </td>
                          <td className="py-3 px-4 text-center font-mono font-bold text-emerald-600">
                            {item.stats.hadirCount}
                          </td>
                          <td className="py-3 px-4 text-center font-mono">
                            {item.stats.lateCount > 0 ? (
                              <span className="font-bold text-amber-600">
                                {item.stats.lateCount}x ({item.stats.lateMinutesTotal}m)
                              </span>
                            ) : (
                              <span className="text-slate-300">0</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center font-mono font-semibold text-indigo-600">
                            {item.stats.dutyCount}
                          </td>
                          <td className="py-3 px-4 text-center font-mono text-slate-600">
                            {item.stats.izinCount + item.stats.sakitCount}
                          </td>
                          <td className="py-3 px-4 text-center font-mono font-bold text-rose-600">
                            {item.stats.alpaCount}
                          </td>
                          <td className="py-3 px-4 text-center font-mono">
                            <span className={`px-2 py-0.5 rounded-full font-black text-xs ${
                              item.stats.percentage >= 90
                                ? 'bg-emerald-50 text-emerald-700'
                                : item.stats.percentage >= 75
                                ? 'bg-amber-50 text-amber-700'
                                : 'bg-rose-50 text-rose-700'
                            }`}>
                              {item.stats.percentage}%
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center whitespace-nowrap">
                            <span className={`px-2.5 py-0.5 rounded-md font-extrabold text-[10px] ${ratingBadge.bg}`}>
                              {ratingBadge.label}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modal Koreksi Presensi */}
      <TeacherAttendanceModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={() => {
          showToast('Presensi guru berhasil diperbarui');
          fetchDaily();
        }}
        teacher={selectedTeacher}
        attendance={selectedAttendance}
        date={selectedDate}
      />
    </div>
  );
}
