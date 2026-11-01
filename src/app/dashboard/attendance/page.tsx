'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import {
  Calendar,
  CheckCircle,
  AlertCircle,
  Users,
  Check,
  Download,
  Loader2,
  Save,
  User,
  Clock,
  RotateCcw,
  BarChart3,
  CalendarDays,
  FileSpreadsheet,
  AlertTriangle
} from 'lucide-react';

interface ClassItem {
  id: string;
  name: string;
  gradeLevel: number;
}

type AttendanceStatusType = 'HADIR' | 'SAKIT' | 'IZIN' | 'ALPA' | 'DISPENSASI';

interface StudentAttendanceItem {
  studentId: string;
  nis: string;
  nisn: string | null;
  name: string;
  gender: 'LAKI_LAKI' | 'PEREMPUAN';
  photoUrl: string | null;
  status: AttendanceStatusType;
  notes: string;
  attendanceId: string | null;
}

interface AttendanceStats {
  total: number;
  hadir: number;
  sakit: number;
  izin: number;
  alpa: number;
  dispensasi: number;
  attendanceRate: number;
}

interface MonthlyRecapItem {
  student: {
    id: string;
    nis: string;
    nisn: string | null;
    name: string;
    gender: 'LAKI_LAKI' | 'PEREMPUAN';
    photoUrl: string | null;
  };
  hadir: number;
  sakit: number;
  izin: number;
  alpa: number;
  dispensasi: number;
  totalRecorded: number;
  attendanceRate: number;
}

export default function AttendancePage() {
  const [activeTab, setActiveTab] = useState<'daily' | 'recap'>('daily');
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  
  // Daily attendance state
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [students, setStudents] = useState<StudentAttendanceItem[]>([]);
  const [stats, setStats] = useState<AttendanceStats | null>(null);
  const [isRecorded, setIsRecorded] = useState<boolean>(false);
  const [loadingDaily, setLoadingDaily] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Monthly recap state
  const currentDate = new Date();
  const [recapMonth, setRecapMonth] = useState<number>(currentDate.getMonth() + 1);
  const [recapYear, setRecapYear] = useState<number>(currentDate.getFullYear());
  const [recapList, setRecapList] = useState<MonthlyRecapItem[]>([]);
  const [recapClassAvg, setRecapClassAvg] = useState<number>(0);
  const [totalMeetingDays, setTotalMeetingDays] = useState<number>(0);
  const [loadingRecap, setLoadingRecap] = useState<boolean>(false);
  const [exporting, setExporting] = useState<boolean>(false);

  // 1. Fetch available classes
  useEffect(() => {
    async function loadClasses() {
      try {
        const res = await fetch('/api/classes');
        const json = await res.json();
        if (json.data && json.data.length > 0) {
          setClasses(json.data);
          setSelectedClassId(json.data[0].id);
        }
      } catch (err) {
        console.error('Failed to load classes', err);
      }
    }
    loadClasses();
  }, []);

  // 2. Fetch daily attendance
  const fetchDailyAttendance = useCallback(async () => {
    if (!selectedClassId) return;
    setLoadingDaily(true);
    setFeedback(null);
    try {
      const res = await fetch(
        `/api/attendance/students?classId=${selectedClassId}&date=${selectedDate}`
      );
      const json = await res.json();
      if (json.data) {
        setStudents(json.data.students || []);
        setStats(json.data.stats || null);
        setIsRecorded(json.data.isRecorded || false);
      }
    } catch (err) {
      console.error('Failed to fetch daily attendance', err);
    } finally {
      setLoadingDaily(false);
    }
  }, [selectedClassId, selectedDate]);

  useEffect(() => {
    if (activeTab === 'daily' && selectedClassId) {
      fetchDailyAttendance();
    }
  }, [activeTab, selectedClassId, selectedDate, fetchDailyAttendance]);

  // 3. Fetch monthly recap
  const fetchRecap = useCallback(async () => {
    if (!selectedClassId) return;
    setLoadingRecap(true);
    try {
      const res = await fetch(
        `/api/attendance/students/recap?classId=${selectedClassId}&month=${recapMonth}&year=${recapYear}`
      );
      const json = await res.json();
      if (json.data) {
        setRecapList(json.data.recap || []);
        setRecapClassAvg(json.data.classAverageRate || 0);
        setTotalMeetingDays(json.data.period?.totalMeetingDays || 0);
      }
    } catch (err) {
      console.error('Failed to fetch recap', err);
    } finally {
      setLoadingRecap(false);
    }
  }, [selectedClassId, recapMonth, recapYear]);

  useEffect(() => {
    if (activeTab === 'recap' && selectedClassId) {
      fetchRecap();
    }
  }, [activeTab, selectedClassId, recapMonth, recapYear, fetchRecap]);

  // Change individual student attendance status
  const handleStatusChange = (studentId: string, status: AttendanceStatusType) => {
    setStudents((prev) => {
      const updated = prev.map((s) => (s.studentId === studentId ? { ...s, status } : s));
      recalculateStats(updated);
      return updated;
    });
  };

  // Change individual student note
  const handleNoteChange = (studentId: string, notes: string) => {
    setStudents((prev) =>
      prev.map((s) => (s.studentId === studentId ? { ...s, notes } : s))
    );
  };

  // 1-Click: Mark all students as HADIR
  const handleMarkAllHadir = () => {
    const updated = students.map((s) => ({ ...s, status: 'HADIR' as AttendanceStatusType }));
    setStudents(updated);
    recalculateStats(updated);
  };

  const recalculateStats = (currentStudents: StudentAttendanceItem[]) => {
    let hadir = 0, sakit = 0, izin = 0, alpa = 0, dispensasi = 0;
    currentStudents.forEach((s) => {
      if (s.status === 'HADIR') hadir++;
      else if (s.status === 'SAKIT') sakit++;
      else if (s.status === 'IZIN') izin++;
      else if (s.status === 'ALPA') alpa++;
      else if (s.status === 'DISPENSASI') dispensasi++;
    });
    const total = currentStudents.length;
    const rate = total > 0 ? Math.round(((hadir + dispensasi) / total) * 100) : 0;
    setStats({ total, hadir, sakit, izin, alpa, dispensasi, attendanceRate: rate });
  };

  // Save daily attendance
  const handleSaveAttendance = async () => {
    if (!selectedClassId || students.length === 0) return;
    setSaving(true);
    setFeedback(null);
    try {
      const payload = {
        classId: selectedClassId,
        date: selectedDate,
        attendances: students.map((s) => ({
          studentId: s.studentId,
          status: s.status,
          notes: s.notes || null,
        })),
      };

      const res = await fetch('/api/attendance/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Gagal menyimpan absensi');

      setIsRecorded(true);
      setFeedback({
        type: 'success',
        message: 'Presensi harian siswa berhasil disimpan ke database!',
      });
    } catch (err: unknown) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Terjadi kesalahan sistem',
      });
    } finally {
      setSaving(false);
    }
  };

  // Export recap to Excel
  const handleExportExcel = async () => {
    if (!selectedClassId) return;
    setExporting(true);
    try {
      const res = await fetch(
        `/api/attendance/students/export?classId=${selectedClassId}&month=${recapMonth}&year=${recapYear}`
      );
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `rekap-absensi-kelas-${recapMonth}-${recapYear}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch {
      alert('Gagal mengekspor data absensi ke Excel');
    } finally {
      setExporting(false);
    }
  };

  const selectedClassName = classes.find((c) => c.id === selectedClassId)?.name || 'Kelas';

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Absensi & Kehadiran Siswa
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Pencatatan presensi harian per rombel dan laporan rekapitulasi kehadiran
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-slate-200/70 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('daily')}
            className={`flex items-center px-4 py-2 text-xs font-semibold rounded-lg transition duration-150 ${
              activeTab === 'daily'
                ? 'bg-white text-indigo-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CalendarDays className="w-4 h-4 mr-1.5" />
            Input Presensi Harian
          </button>
          <button
            onClick={() => setActiveTab('recap')}
            className={`flex items-center px-4 py-2 text-xs font-semibold rounded-lg transition duration-150 ${
              activeTab === 'recap'
                ? 'bg-white text-indigo-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BarChart3 className="w-4 h-4 mr-1.5" />
            Rekapitulasi Bulanan
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* TAB 1: INPUT PRESENSI HARIAN                             */}
      {/* ======================================================== */}
      {activeTab === 'daily' && (
        <div className="space-y-6">
          {/* Controls Bar */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
              {/* Class Selector */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                  Pilih Rombongan Belajar (Kelas)
                </label>
                <select
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 focus:bg-white transition"
                >
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} (Tingkat {c.gradeLevel})
                    </option>
                  ))}
                </select>
              </div>

              {/* Date Selector */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                  Tanggal Presensi
                </label>
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 focus:bg-white transition"
                  />
                  <button
                    type="button"
                    onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
                    className="px-3 py-2 text-xs font-medium border border-slate-200 rounded-xl hover:bg-slate-50 transition"
                  >
                    Hari Ini
                  </button>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex flex-col justify-end">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                  Tindakan Cepat
                </label>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={handleMarkAllHadir}
                    className="flex-1 inline-flex items-center justify-center px-4 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-xl border border-emerald-200 transition"
                  >
                    <Check className="w-4 h-4 mr-1.5" />
                    Set Semua Hadir
                  </button>
                  <button
                    type="button"
                    onClick={fetchDailyAttendance}
                    title="Muat Ulang"
                    className="p-2.5 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Status Indicator */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2">
                <span className="text-slate-500">Status Pengisian:</span>
                {isRecorded ? (
                  <span className="inline-flex items-center font-medium text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    <CheckCircle className="w-3.5 h-3.5 mr-1" />
                    Sudah Tersimpan di Database
                  </span>
                ) : (
                  <span className="inline-flex items-center font-medium text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                    <AlertTriangle className="w-3.5 h-3.5 mr-1" />
                    Belum Dicatat / Draf
                  </span>
                )}
              </div>
              <span className="text-slate-400 font-mono">
                {new Date(selectedDate).toLocaleDateString('id-ID', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </span>
            </div>
          </div>

          {/* Feedback message */}
          {feedback && (
            <div
              className={`p-4 rounded-xl text-sm flex items-center space-x-3 border ${
                feedback.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                  : 'bg-rose-50 border-rose-200 text-rose-700'
              }`}
            >
              {feedback.type === 'success' ? (
                <CheckCircle className="w-5 h-5 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
              )}
              <span>{feedback.message}</span>
            </div>
          )}

          {/* Realtime Stats Bar */}
          {stats && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
              <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                  Total Siswa
                </span>
                <span className="text-xl font-bold text-slate-900">{stats.total}</span>
              </div>
              <div className="bg-emerald-50/60 p-3.5 rounded-2xl border border-emerald-200/80 shadow-xs">
                <span className="text-[11px] font-semibold text-emerald-600 uppercase tracking-wider block mb-1">
                  Hadir (H)
                </span>
                <span className="text-xl font-bold text-emerald-700">{stats.hadir}</span>
              </div>
              <div className="bg-amber-50/60 p-3.5 rounded-2xl border border-amber-200/80 shadow-xs">
                <span className="text-[11px] font-semibold text-amber-600 uppercase tracking-wider block mb-1">
                  Sakit (S)
                </span>
                <span className="text-xl font-bold text-amber-700">{stats.sakit}</span>
              </div>
              <div className="bg-blue-50/60 p-3.5 rounded-2xl border border-blue-200/80 shadow-xs">
                <span className="text-[11px] font-semibold text-blue-600 uppercase tracking-wider block mb-1">
                  Izin (I)
                </span>
                <span className="text-xl font-bold text-blue-700">{stats.izin}</span>
              </div>
              <div className="bg-rose-50/60 p-3.5 rounded-2xl border border-rose-200/80 shadow-xs">
                <span className="text-[11px] font-semibold text-rose-600 uppercase tracking-wider block mb-1">
                  Alpa (A)
                </span>
                <span className="text-xl font-bold text-rose-700">{stats.alpa}</span>
              </div>
              <div className="bg-purple-50/60 p-3.5 rounded-2xl border border-purple-200/80 shadow-xs">
                <span className="text-[11px] font-semibold text-purple-600 uppercase tracking-wider block mb-1">
                  Dispensasi (D)
                </span>
                <span className="text-xl font-bold text-purple-700">{stats.dispensasi}</span>
              </div>
              <div className="bg-indigo-50/60 p-3.5 rounded-2xl border border-indigo-200/80 shadow-xs">
                <span className="text-[11px] font-semibold text-indigo-600 uppercase tracking-wider block mb-1">
                  Tingkat Hadir
                </span>
                <span className="text-xl font-bold text-indigo-700">{stats.attendanceRate}%</span>
              </div>
            </div>
          )}

          {/* Student Roster Presensi Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200/80 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    <th className="py-3.5 px-4 w-12 text-center">No</th>
                    <th className="py-3.5 px-4">Siswa</th>
                    <th className="py-3.5 px-4 text-center">Status Kehadiran</th>
                    <th className="py-3.5 px-4">Keterangan / Catatan Medis</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {loadingDaily ? (
                    <tr>
                      <td colSpan={4} className="py-16 text-center text-slate-500">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto text-indigo-600 mb-2" />
                        Memuat data siswa kelas...
                      </td>
                    </tr>
                  ) : students.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-16 text-center text-slate-500">
                        <Users className="w-12 h-12 mx-auto text-slate-300 mb-2" />
                        <p className="font-medium text-slate-700">Belum ada siswa di kelas ini</p>
                        <p className="text-xs text-slate-400 mt-1">
                          Tempatkan siswa ke dalam rombel terlebih dahulu
                        </p>
                      </td>
                    </tr>
                  ) : (
                    students.map((student, idx) => (
                      <tr
                        key={student.studentId}
                        className="hover:bg-slate-50/70 transition duration-150"
                      >
                        <td className="py-3 px-4 text-center font-mono text-xs text-slate-400">
                          {idx + 1}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-3">
                            <div className="relative w-9 h-9 rounded-full overflow-hidden bg-slate-100 border border-slate-200 flex-shrink-0 flex items-center justify-center">
                              {student.photoUrl ? (
                                <Image
                                  src={student.photoUrl}
                                  alt={student.name}
                                  fill
                                  className="object-cover"
                                />
                              ) : (
                                <User className="w-4 h-4 text-slate-400" />
                              )}
                            </div>
                            <div>
                              <p className="font-semibold text-slate-900 leading-tight">
                                {student.name}
                              </p>
                              <span className="font-mono text-xs text-slate-400">
                                NIS: {student.nis}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Interactive Status Radio Pills */}
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-center space-x-1 sm:space-x-2">
                            {/* HADIR */}
                            <button
                              type="button"
                              onClick={() => handleStatusChange(student.studentId, 'HADIR')}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center ${
                                student.status === 'HADIR'
                                  ? 'bg-emerald-600 text-white shadow-xs scale-105'
                                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              }`}
                            >
                              Hadir
                            </button>

                            {/* SAKIT */}
                            <button
                              type="button"
                              onClick={() => handleStatusChange(student.studentId, 'SAKIT')}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center ${
                                student.status === 'SAKIT'
                                  ? 'bg-amber-500 text-white shadow-xs scale-105'
                                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              }`}
                            >
                              Sakit
                            </button>

                            {/* IZIN */}
                            <button
                              type="button"
                              onClick={() => handleStatusChange(student.studentId, 'IZIN')}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center ${
                                student.status === 'IZIN'
                                  ? 'bg-blue-600 text-white shadow-xs scale-105'
                                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              }`}
                            >
                              Izin
                            </button>

                            {/* ALPA */}
                            <button
                              type="button"
                              onClick={() => handleStatusChange(student.studentId, 'ALPA')}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center ${
                                student.status === 'ALPA'
                                  ? 'bg-rose-600 text-white shadow-xs scale-105'
                                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              }`}
                            >
                              Alpa
                            </button>

                            {/* DISPENSASI */}
                            <button
                              type="button"
                              onClick={() => handleStatusChange(student.studentId, 'DISPENSASI')}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center ${
                                student.status === 'DISPENSASI'
                                  ? 'bg-purple-600 text-white shadow-xs scale-105'
                                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              }`}
                            >
                              Dispen
                            </button>
                          </div>
                        </td>

                        {/* Note Input */}
                        <td className="py-3 px-4">
                          <input
                            type="text"
                            placeholder="Alasan / no. surat izin..."
                            value={student.notes}
                            onChange={(e) =>
                              handleNoteChange(student.studentId, e.target.value)
                            }
                            className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white"
                          />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Sticky Bottom Save Bar */}
          {students.length > 0 && (
            <div className="fixed bottom-0 left-0 right-0 md:left-64 bg-white/90 backdrop-blur-md border-t border-slate-200 p-4 shadow-lg flex items-center justify-between z-30 px-6 sm:px-10">
              <div className="text-xs text-slate-600 hidden sm:block">
                Menyimpan presensi kelas <strong className="text-slate-900">{selectedClassName}</strong> untuk tanggal <span className="font-mono text-indigo-600 font-semibold">{selectedDate}</span>
              </div>
              <div className="flex items-center space-x-3 ml-auto">
                <button
                  type="button"
                  onClick={fetchDailyAttendance}
                  className="px-4 py-2 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-50 transition"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSaveAttendance}
                  disabled={saving}
                  className="inline-flex items-center px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-sm transition disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Menyimpan ke Database...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Simpan Rekap Presensi
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: REKAPITULASI BULANAN & ANALITIK                   */}
      {/* ======================================================== */}
      {activeTab === 'recap' && (
        <div className="space-y-6">
          {/* Controls Bar */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-center">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                  Rombongan Belajar
                </label>
                <select
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 focus:bg-white transition"
                >
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                  Bulan
                </label>
                <select
                  value={recapMonth}
                  onChange={(e) => setRecapMonth(parseInt(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 focus:bg-white transition"
                >
                  <option value={1}>Januari</option>
                  <option value={2}>Februari</option>
                  <option value={3}>Maret</option>
                  <option value={4}>April</option>
                  <option value={5}>Mei</option>
                  <option value={6}>Juni</option>
                  <option value={7}>Juli</option>
                  <option value={8}>Agustus</option>
                  <option value={9}>September</option>
                  <option value={10}>Oktober</option>
                  <option value={11}>November</option>
                  <option value={12}>Desember</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                  Tahun
                </label>
                <select
                  value={recapYear}
                  onChange={(e) => setRecapYear(parseInt(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 focus:bg-white transition"
                >
                  <option value={2026}>2026</option>
                  <option value={2027}>2027</option>
                  <option value={2025}>2025</option>
                </select>
              </div>

              <div className="flex items-end">
                <button
                  type="button"
                  onClick={handleExportExcel}
                  disabled={exporting || recapList.length === 0}
                  className="w-full inline-flex items-center justify-center px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-xs transition duration-200 disabled:opacity-50"
                >
                  {exporting ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <FileSpreadsheet className="w-4 h-4 mr-2" />
                  )}
                  Ekspor Rekap Excel
                </button>
              </div>
            </div>
          </div>

          {/* Quick Recap Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Hari Efektif Belajar
                </p>
                <h3 className="text-2xl font-bold text-slate-900 mt-1">
                  {totalMeetingDays} Hari
                </h3>
              </div>
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                <Calendar className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Rata-rata Kehadiran Rombel
                </p>
                <h3 className="text-2xl font-bold text-emerald-600 mt-1">
                  {recapClassAvg}%
                </h3>
              </div>
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                <CheckCircle className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Siswa Terdaftar
                </p>
                <h3 className="text-2xl font-bold text-slate-900 mt-1">
                  {recapList.length} Orang
                </h3>
              </div>
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                <Users className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Monthly Recap Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200/80 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    <th className="py-3.5 px-4 w-12 text-center">No</th>
                    <th className="py-3.5 px-4">Nama Siswa</th>
                    <th className="py-3.5 px-4 font-mono">NIS</th>
                    <th className="py-3.5 px-4 text-center">L/P</th>
                    <th className="py-3.5 px-4 text-center text-emerald-700 bg-emerald-50/50">H</th>
                    <th className="py-3.5 px-4 text-center text-amber-700 bg-amber-50/50">S</th>
                    <th className="py-3.5 px-4 text-center text-blue-700 bg-blue-50/50">I</th>
                    <th className="py-3.5 px-4 text-center text-rose-700 bg-rose-50/50">A</th>
                    <th className="py-3.5 px-4 text-center text-purple-700 bg-purple-50/50">D</th>
                    <th className="py-3.5 px-4 text-right">Persentase</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {loadingRecap ? (
                    <tr>
                      <td colSpan={10} className="py-16 text-center text-slate-500">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto text-indigo-600 mb-2" />
                        Menghitung rekapitulasi kehadiran...
                      </td>
                    </tr>
                  ) : recapList.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-16 text-center text-slate-500">
                        <Calendar className="w-12 h-12 mx-auto text-slate-300 mb-2" />
                        <p className="font-medium text-slate-700">Belum ada data presensi pada bulan ini</p>
                      </td>
                    </tr>
                  ) : (
                    recapList.map((item, idx) => (
                      <tr key={item.student.id} className="hover:bg-slate-50/70 transition">
                        <td className="py-3 px-4 text-center font-mono text-xs text-slate-400">
                          {idx + 1}
                        </td>
                        <td className="py-3 px-4 font-medium text-slate-900">
                          {item.student.name}
                        </td>
                        <td className="py-3 px-4 font-mono text-xs text-slate-600">
                          {item.student.nis}
                        </td>
                        <td className="py-3 px-4 text-center text-xs text-slate-500">
                          {item.student.gender === 'LAKI_LAKI' ? 'L' : 'P'}
                        </td>
                        <td className="py-3 px-4 text-center font-bold text-emerald-700 bg-emerald-50/30">
                          {item.hadir}
                        </td>
                        <td className="py-3 px-4 text-center font-medium text-amber-700 bg-amber-50/30">
                          {item.sakit}
                        </td>
                        <td className="py-3 px-4 text-center font-medium text-blue-700 bg-blue-50/30">
                          {item.izin}
                        </td>
                        <td className="py-3 px-4 text-center font-medium text-rose-700 bg-rose-50/30">
                          {item.alpa}
                        </td>
                        <td className="py-3 px-4 text-center font-medium text-purple-700 bg-purple-50/30">
                          {item.dispensasi}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <div className="w-16 bg-slate-100 rounded-full h-2 overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  item.attendanceRate >= 90
                                    ? 'bg-emerald-500'
                                    : item.attendanceRate >= 75
                                    ? 'bg-amber-500'
                                    : 'bg-rose-500'
                                }`}
                                style={{ width: `${item.attendanceRate}%` }}
                              />
                            </div>
                            <span className="font-bold text-xs text-slate-800 font-mono w-9">
                              {item.attendanceRate}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
