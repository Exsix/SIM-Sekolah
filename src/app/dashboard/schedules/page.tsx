'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Calendar,
  Clock,
  BookOpen,
  Users,
  MapPin,
  Plus,
  Pencil,
  Trash2,
  Download,
  Printer,
  Filter,
  Layers,
  GraduationCap,
  School,
  AlertCircle,
  Loader2,
  Grid,
  List,
  Sparkles,
  Search,
  CheckCircle2,
  ChevronRight
} from 'lucide-react';
import { DayOfWeek } from '@prisma/client';
import ScheduleModal from '@/components/schedules/ScheduleModal';

interface ScheduleItem {
  id: string;
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  room: string | null;
  class: {
    id: string;
    name: string;
    gradeLevel: number;
    room: string | null;
  };
  subject: {
    id: string;
    code: string;
    name: string;
    category: string | null;
  };
  teacher: {
    id: string;
    name: string;
    nip: string | null;
    photoUrl: string | null;
  };
  academicYear: {
    id: string;
    name: string;
    semester: string;
  };
}

interface ClassItem {
  id: string;
  name: string;
  gradeLevel: number;
}

interface TeacherItem {
  id: string;
  name: string;
  nip: string | null;
}

const DAY_ORDER: DayOfWeek[] = ['SENIN', 'SELASA', 'RABU', 'KAMIS', 'JUMAT', 'SABTU'];

const DAY_LABELS: Record<DayOfWeek, { name: string; short: string }> = {
  SENIN: { name: 'Senin', short: 'Sen' },
  SELASA: { name: 'Selasa', short: 'Sel' },
  RABU: { name: 'Rabu', short: 'Rab' },
  KAMIS: { name: 'Kamis', short: 'Kam' },
  JUMAT: { name: 'Jumat', short: 'Jum' },
  SABTU: { name: 'Sabtu', short: 'Sab' },
};

const CATEGORY_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  'Muatan Nasional': { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  'Peminatan MIPA': { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  'Peminatan IPS': { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  'Peminatan Bahasa': { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  'Muatan Lokal': { bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200' },
  'Bimbingan Konseling (BK)': { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
};

export default function SchedulesPage() {
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [teachers, setTeachers] = useState<TeacherItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  // View state: 'grid' (Matriks Mingguan) or 'table' (Daftar List)
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Filter mode: 'byClass' or 'byTeacher'
  const [filterMode, setFilterMode] = useState<'byClass' | 'byTeacher'>('byClass');
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('');
  const [dayFilter, setDayFilter] = useState<string>('');

  // Current session user role
  const [currentUserRole, setCurrentUserRole] = useState<string>('');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<ScheduleItem | null>(null);
  const [modalDefaultDay, setModalDefaultDay] = useState<DayOfWeek | undefined>(undefined);

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState<ScheduleItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load initial references & session info
  useEffect(() => {
    async function loadMeta() {
      try {
        const [resAuth, resClasses, resTeachers] = await Promise.all([
          fetch('/api/auth/me'),
          fetch('/api/classes'),
          fetch('/api/teachers?limit=100'),
        ]);

        const [authJson, classesJson, teachersJson] = await Promise.all([
          resAuth.json(),
          resClasses.json(),
          resTeachers.json(),
        ]);

        if (authJson.user) {
          setCurrentUserRole(authJson.user.role);
          if (authJson.user.role === 'GURU' && authJson.user.teacherId) {
            setFilterMode('byTeacher');
            setSelectedTeacherId(authJson.user.teacherId);
          } else if (authJson.user.role === 'SISWA' && authJson.user.studentId) {
            setFilterMode('byClass');
          }
        }

        if (classesJson.data && classesJson.data.length > 0) {
          setClasses(classesJson.data);
          // Set first class as default if not student
          if (!authJson.user || authJson.user.role !== 'GURU') {
            setSelectedClassId(classesJson.data[0].id);
          }
        }

        if (teachersJson.data && teachersJson.data.length > 0) {
          setTeachers(teachersJson.data);
        }
      } catch (err) {
        console.error('Failed to load metadata', err);
      }
    }

    loadMeta();
  }, []);

  // Fetch schedules according to active filters
  const fetchSchedules = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterMode === 'byClass' && selectedClassId) {
        params.append('classId', selectedClassId);
      } else if (filterMode === 'byTeacher' && selectedTeacherId) {
        params.append('teacherId', selectedTeacherId);
      }
      if (dayFilter) {
        params.append('dayOfWeek', dayFilter);
      }

      const res = await fetch(`/api/schedules?${params.toString()}`);
      const json = await res.json();
      if (json.data) {
        setSchedules(json.data);
      }
    } catch (err) {
      console.error('Failed to fetch schedules', err);
    } finally {
      setLoading(false);
    }
  }, [filterMode, selectedClassId, selectedTeacherId, dayFilter]);

  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

  // Handle Export Excel
  const handleExport = async () => {
    setExporting(true);
    try {
      const params = new URLSearchParams();
      if (filterMode === 'byClass' && selectedClassId) {
        params.append('classId', selectedClassId);
      } else if (filterMode === 'byTeacher' && selectedTeacherId) {
        params.append('teacherId', selectedTeacherId);
      }
      const res = await fetch(`/api/schedules/export?${params.toString()}`);
      if (!res.ok) throw new Error('Gagal mengekspor jadwal');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `jadwal-pelajaran-${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch {
      alert('Gagal mengekspor data jadwal pelajaran');
    } finally {
      setExporting(false);
    }
  };

  // Handle Delete
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/schedules/${deleteTarget.id}`, { method: 'DELETE' });
      if (res.ok) {
        setDeleteTarget(null);
        fetchSchedules();
      } else {
        const json = await res.json();
        alert(json.error || 'Gagal menghapus jadwal');
      }
    } catch {
      alert('Terjadi kesalahan sistem');
    } finally {
      setIsDeleting(false);
    }
  };

  const isAdmin = currentUserRole === 'SUPER_ADMIN' || currentUserRole === 'ADMIN';

  // Group schedules by day of week
  const schedulesByDay = DAY_ORDER.reduce<Record<DayOfWeek, ScheduleItem[]>>((acc, day) => {
    acc[day] = schedules.filter((s) => s.dayOfWeek === day);
    return acc;
  }, {
    SENIN: [],
    SELASA: [],
    RABU: [],
    KAMIS: [],
    JUMAT: [],
    SABTU: [],
  });

  const selectedClassName = classes.find((c) => c.id === selectedClassId)?.name;
  const selectedTeacherName = teachers.find((t) => t.id === selectedTeacherId)?.name;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs text-slate-500 mb-1">
            <Link href="/dashboard" className="hover:text-indigo-600">Dashboard</Link>
            <ChevronRight className="w-3 h-3 text-slate-400" />
            <span className="text-slate-800 font-medium">Jadwal Pelajaran</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center">
            <Calendar className="w-6 h-6 mr-2 text-indigo-600" />
            Jadwal Pelajaran & Timetable
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Matriks alokasi jam mengajar mingguan, penugasan ruang kelas, dan validasi anti-bentrok
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Mode Switcher */}
          <div className="p-1 bg-slate-100 rounded-xl flex items-center space-x-1 border border-slate-200/80">
            <button
              onClick={() => setViewMode('grid')}
              className={`flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                viewMode === 'grid'
                  ? 'bg-white text-indigo-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Grid className="w-3.5 h-3.5 mr-1.5" />
              Matriks Mingguan
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                viewMode === 'table'
                  ? 'bg-white text-indigo-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <List className="w-3.5 h-3.5 mr-1.5" />
              Tabel List
            </button>
          </div>

          {/* Print Button */}
          <button
            onClick={() => window.print()}
            type="button"
            className="inline-flex items-center px-3.5 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium rounded-xl shadow-2xs transition"
            title="Cetak Jadwal Pelajaran"
          >
            <Printer className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
            Cetak (A4)
          </button>

          {/* Export Excel Button */}
          <button
            onClick={handleExport}
            disabled={exporting || schedules.length === 0}
            type="button"
            className="inline-flex items-center px-3.5 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium rounded-xl shadow-2xs transition disabled:opacity-50"
          >
            {exporting ? (
              <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin text-slate-400" />
            ) : (
              <Download className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
            )}
            Ekspor Excel
          </button>

          {/* Tambah Jadwal Button (Admin only) */}
          {isAdmin && (
            <button
              onClick={() => {
                setEditTarget(null);
                setModalDefaultDay(undefined);
                setIsModalOpen(true);
              }}
              type="button"
              className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-xl shadow-xs transition"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Plot Jadwal Baru
            </button>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Target Toggle: Per Kelas vs Per Guru */}
          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Tampilkan Jadwal:
            </span>
            <div className="inline-flex p-0.5 bg-slate-100 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setFilterMode('byClass')}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                  filterMode === 'byClass'
                    ? 'bg-white text-indigo-700 font-semibold shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Berdasarkan Kelas
              </button>
              <button
                type="button"
                onClick={() => setFilterMode('byTeacher')}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                  filterMode === 'byTeacher'
                    ? 'bg-white text-indigo-700 font-semibold shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Berdasarkan Guru
              </button>
            </div>
          </div>

          {/* Dropdown Selector */}
          <div className="flex flex-wrap items-center gap-2">
            {filterMode === 'byClass' ? (
              <div className="flex items-center space-x-2">
                <span className="text-xs text-slate-500 font-medium">Pilih Rombel:</span>
                <select
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                  className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 font-bold text-slate-800"
                >
                  <option value="">Semua Kelas</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <span className="text-xs text-slate-500 font-medium">Pilih Guru Pengajar:</span>
                <select
                  value={selectedTeacherId}
                  onChange={(e) => setSelectedTeacherId(e.target.value)}
                  className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 font-bold text-slate-800 max-w-xs"
                >
                  <option value="">Semua Guru</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Filter Hari */}
            <select
              value={dayFilter}
              onChange={(e) => setDayFilter(e.target.value)}
              className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-slate-700"
            >
              <option value="">Semua Hari (Senin - Sabtu)</option>
              {DAY_ORDER.map((d) => (
                <option key={d} value={d}>
                  Hari {DAY_LABELS[d].name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Selected target info banner */}
        <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100 text-slate-600">
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-slate-700">Jadwal Aktif:</span>
            <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 font-bold rounded-lg border border-indigo-200">
              {filterMode === 'byClass'
                ? selectedClassName || 'Semua Kelas'
                : selectedTeacherName || 'Semua Guru'}
            </span>
            <span className="text-slate-400">• Total {schedules.length} Sesi Terjadwal</span>
          </div>
        </div>
      </div>

      {/* VIEW MODE 1: MATRIKS MINGGUAN (TIMETABLE GRID) */}
      {viewMode === 'grid' && (
        <div className="space-y-4">
          {loading ? (
            <div className="py-24 text-center text-slate-400 bg-white rounded-3xl border border-slate-200/80">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-600 mb-2" />
              <p className="text-xs font-medium">Menyusun matriks jadwal pelajaran...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5 print:grid-cols-3 print:gap-4">
              {DAY_ORDER.map((day) => {
                const daySchedules = schedulesByDay[day];
                const dayMeta = DAY_LABELS[day];

                return (
                  <div
                    key={day}
                    className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden flex flex-col"
                  >
                    {/* Day Column Header */}
                    <div className="bg-slate-50/90 border-b border-slate-200/80 p-3 flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
                        <h3 className="font-bold text-sm text-slate-900">{dayMeta.name}</h3>
                      </div>
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-white border border-slate-200 text-slate-600 font-semibold">
                        {daySchedules.length} Sesi
                      </span>
                    </div>

                    {/* Day Content */}
                    <div className="p-2.5 space-y-2.5 flex-1 min-h-[220px]">
                      {daySchedules.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center p-4 text-center border-2 border-dashed border-slate-100 rounded-xl text-slate-400">
                          <Clock className="w-6 h-6 mb-1 text-slate-300" />
                          <p className="text-[11px] font-medium text-slate-400">Tidak ada jadwal</p>
                          {isAdmin && (
                            <button
                              type="button"
                              onClick={() => {
                                setEditTarget(null);
                                setModalDefaultDay(day);
                                setIsModalOpen(true);
                              }}
                              className="mt-2 text-[10px] text-indigo-600 hover:underline font-semibold flex items-center"
                            >
                              <Plus className="w-3 h-3 mr-0.5" />
                              Tambah Sesi
                            </button>
                          )}
                        </div>
                      ) : (
                        daySchedules.map((sch) => {
                          const catStyle = sch.subject.category && CATEGORY_STYLES[sch.subject.category]
                            ? CATEGORY_STYLES[sch.subject.category]
                            : { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200' };

                          return (
                            <div
                              key={sch.id}
                              className="p-3 rounded-xl border border-slate-200/90 hover:border-indigo-300 hover:shadow-xs transition bg-white group relative space-y-2"
                            >
                              {/* Time & Class Badge */}
                              <div className="flex items-center justify-between gap-1">
                                <span className="inline-flex items-center text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-900 text-white">
                                  <Clock className="w-3 h-3 mr-1 text-indigo-300" />
                                  {sch.startTime} - {sch.endTime}
                                </span>
                                <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100 truncate">
                                  {sch.class.name}
                                </span>
                              </div>

                              {/* Subject Name */}
                              <div>
                                <h4 className="font-bold text-xs text-slate-900 leading-snug line-clamp-2">
                                  {sch.subject.name}
                                </h4>
                                <div className="flex items-center gap-1 mt-1 flex-wrap">
                                  <span className="font-mono text-[9px] px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded font-bold">
                                    {sch.subject.code}
                                  </span>
                                  {sch.subject.category && (
                                    <span className={`text-[9px] px-1.5 py-0.5 rounded border font-medium truncate ${catStyle.bg} ${catStyle.text} ${catStyle.border}`}>
                                      {sch.subject.category}
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Teacher & Room */}
                              <div className="pt-2 border-t border-slate-100 flex flex-col gap-1 text-[11px] text-slate-600">
                                <div className="flex items-center space-x-1.5 truncate">
                                  <div className="w-4 h-4 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[9px] font-bold flex-shrink-0">
                                    {sch.teacher.name.charAt(0)}
                                  </div>
                                  <span className="truncate font-medium text-slate-800">
                                    {sch.teacher.name}
                                  </span>
                                </div>

                                {sch.room && (
                                  <div className="flex items-center space-x-1 text-[10px] text-slate-500">
                                    <MapPin className="w-3 h-3 text-slate-400 flex-shrink-0" />
                                    <span>{sch.room}</span>
                                  </div>
                                )}
                              </div>

                              {/* Admin Action Buttons on Card */}
                              {isAdmin && (
                                <div className="pt-1 flex items-center justify-end space-x-1 opacity-0 group-hover:opacity-100 transition">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditTarget(sch);
                                      setIsModalOpen(true);
                                    }}
                                    className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition"
                                    title="Edit Sesi"
                                  >
                                    <Pencil className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setDeleteTarget(sch)}
                                    className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition"
                                    title="Hapus Sesi"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>

                    {/* Bottom quick add button for day */}
                    {isAdmin && (
                      <div className="p-2 border-t border-slate-100 bg-slate-50/50">
                        <button
                          type="button"
                          onClick={() => {
                            setEditTarget(null);
                            setModalDefaultDay(day);
                            setIsModalOpen(true);
                          }}
                          className="w-full py-1 text-[11px] text-slate-500 hover:text-indigo-600 hover:bg-white rounded-lg transition font-medium flex items-center justify-center"
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          Tambah Sesi {dayMeta.short}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* VIEW MODE 2: TABEL LIST */}
      {viewMode === 'table' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 uppercase tracking-wider text-[11px] font-semibold">
                <tr>
                  <th className="py-3 px-4 w-12 text-center">No</th>
                  <th className="py-3 px-4">Hari</th>
                  <th className="py-3 px-4">Waktu</th>
                  <th className="py-3 px-4">Kelas</th>
                  <th className="py-3 px-4">Mata Pelajaran</th>
                  <th className="py-3 px-4">Ruang</th>
                  <th className="py-3 px-4">Guru Pengajar</th>
                  {isAdmin && <th className="py-3 px-4 text-right">Aksi</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {loading ? (
                  <tr>
                    <td colSpan={isAdmin ? 8 : 7} className="py-16 text-center text-slate-400">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto text-indigo-600 mb-2" />
                      Memuat data jadwal pelajaran...
                    </td>
                  </tr>
                ) : schedules.length === 0 ? (
                  <tr>
                    <td colSpan={isAdmin ? 8 : 7} className="py-16 text-center text-slate-400">
                      <Calendar className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                      <p className="font-semibold text-slate-700">Tidak ada jadwal ditemukan</p>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Sesuaikan filter kelas/guru atau buat plot jadwal baru
                      </p>
                    </td>
                  </tr>
                ) : (
                  schedules.map((sch, idx) => (
                    <tr key={sch.id} className="hover:bg-slate-50/60 transition">
                      <td className="py-3 px-4 text-center font-mono text-slate-400">{idx + 1}</td>
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {DAY_LABELS[sch.dayOfWeek]?.name || sch.dayOfWeek}
                      </td>
                      <td className="py-3 px-4 font-mono font-medium text-slate-800">
                        {sch.startTime} - {sch.endTime}
                      </td>
                      <td className="py-3 px-4 font-semibold text-indigo-600">
                        {sch.class.name}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{sch.subject.name}</div>
                        <span className="font-mono text-[10px] text-slate-400">{sch.subject.code}</span>
                      </td>
                      <td className="py-3 px-4">
                        {sch.room ? (
                          <span className="inline-flex items-center text-slate-700 font-medium">
                            <MapPin className="w-3 h-3 text-slate-400 mr-1" />
                            {sch.room}
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-800">
                        {sch.teacher.name}
                      </td>
                      {isAdmin && (
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end space-x-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setEditTarget(sch);
                                setIsModalOpen(true);
                              }}
                              className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition"
                              title="Edit Sesi"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteTarget(sch)}
                              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition"
                              title="Hapus Sesi"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Schedule Form Modal (Add / Edit) */}
      <ScheduleModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchSchedules}
        initialData={editTarget}
        defaultClassId={selectedClassId}
        defaultTeacherId={selectedTeacherId}
        defaultDay={modalDefaultDay}
      />

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center space-x-3 text-rose-600">
              <div className="p-2.5 bg-rose-50 rounded-xl">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                Hapus Sesi Jadwal Pelajaran?
              </h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Anda yakin ingin menghapus jadwal <span className="font-semibold text-slate-900">{deleteTarget.subject.name}</span> di kelas <span className="font-semibold text-slate-900">{deleteTarget.class.name}</span> ({DAY_LABELS[deleteTarget.dayOfWeek]?.name} {deleteTarget.startTime} - {deleteTarget.endTime})?
            </p>

            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 border border-slate-200 text-slate-700 text-xs font-medium rounded-xl hover:bg-slate-50 transition"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDelete}
                className="inline-flex items-center px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-medium rounded-xl shadow-xs transition disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                    Menghapus...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                    Ya, Hapus
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
