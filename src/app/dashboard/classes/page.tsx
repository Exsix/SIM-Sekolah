'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  School,
  Plus,
  Search,
  Users,
  MapPin,
  Pencil,
  Trash2,
  Eye,
  Loader2,
  RefreshCw,
  AlertCircle,
  LayoutGrid,
  List,
  GraduationCap,
  CalendarDays,
  ShieldCheck
} from 'lucide-react';

interface ClassItem {
  id: string;
  name: string;
  gradeLevel: number;
  major: string | null;
  room: string | null;
  capacity: number;
  isActive: boolean;
  homeroomTeacher: {
    id: string;
    name: string;
    nip: string | null;
    photoUrl: string | null;
  } | null;
  academicYear: {
    id: string;
    name: string;
    semester: string;
  } | null;
  _count: {
    students: number;
    schedules: number;
  };
}

export default function ClassesPage() {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Filters
  const [search, setSearch] = useState('');
  const [gradeFilter, setGradeFilter] = useState('');
  const [majorFilter, setMajorFilter] = useState('');

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState<ClassItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchClasses = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        search,
        ...(gradeFilter && { gradeLevel: gradeFilter }),
        ...(majorFilter && { major: majorFilter }),
      });

      const res = await fetch(`/api/classes?${params.toString()}`);
      const json = await res.json();
      if (json.data) {
        setClasses(json.data);
      }
    } catch (err) {
      console.error('Failed to fetch classes', err);
    } finally {
      setLoading(false);
    }
  }, [search, gradeFilter, majorFilter]);

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/classes/${deleteTarget.id}`, { method: 'DELETE' });
      if (res.ok) {
        setDeleteTarget(null);
        fetchClasses();
      } else {
        const json = await res.json();
        alert(json.error || 'Gagal menonaktifkan kelas');
      }
    } catch {
      alert('Terjadi kesalahan sistem');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Manajemen Kelas & Rombel
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Pengelolaan rombongan belajar, alokasi wali kelas, ruang belajar, dan kapasitas siswa
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Link
            href="/dashboard/classes/new"
            className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl shadow-xs transition duration-200"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Tambah Kelas Baru
          </Link>
        </div>
      </div>

      {/* Filter and View Switcher */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full md:w-auto flex-1 max-w-2xl">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Cari kelas, wali kelas, ruangan..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 focus:bg-white transition"
            />
          </div>

          {/* Tingkat */}
          <div>
            <select
              value={gradeFilter}
              onChange={(e) => setGradeFilter(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 focus:bg-white"
            >
              <option value="">Semua Tingkat</option>
              <option value="10">Kelas 10</option>
              <option value="11">Kelas 11</option>
              <option value="12">Kelas 12</option>
            </select>
          </div>

          {/* Jurusan */}
          <div>
            <select
              value={majorFilter}
              onChange={(e) => setMajorFilter(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 focus:bg-white"
            >
              <option value="">Semua Jurusan</option>
              <option value="MIPA">MIPA</option>
              <option value="IPS">IPS</option>
              <option value="Bahasa & Budaya">Bahasa</option>
            </select>
          </div>
        </div>

        {/* View mode toggle */}
        <div className="flex items-center space-x-1 border border-slate-200 rounded-xl p-1 bg-slate-50 self-end md:self-auto">
          <button
            type="button"
            onClick={() => setViewMode('grid')}
            className={`p-1.5 rounded-lg transition ${
              viewMode === 'grid' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-400 hover:text-slate-700'
            }`}
            title="Tampilan Grid Kartu"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setViewMode('table')}
            className={`p-1.5 rounded-lg transition ${
              viewMode === 'table' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-400 hover:text-slate-700'
            }`}
            title="Tampilan Tabel"
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Content: Grid or Table */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-600 mb-2" />
          <p className="text-sm text-slate-500">Memuat data rombongan belajar...</p>
        </div>
      ) : classes.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center">
          <School className="w-12 h-12 mx-auto text-slate-300 mb-3" />
          <h3 className="text-base font-semibold text-slate-800">Tidak ada kelas ditemukan</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Belum ada data rombel yang sesuai dengan pencarian Anda. Silakan tambahkan kelas baru.
          </p>
          <Link
            href="/dashboard/classes/new"
            className="mt-4 inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs transition"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Tambah Kelas Pertama
          </Link>
        </div>
      ) : viewMode === 'grid' ? (
        /* GRID VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {classes.map((cls) => {
            const studentCount = cls._count?.students || 0;
            const capacity = cls.capacity || 36;
            const percentage = Math.min(100, Math.round((studentCount / capacity) * 100));

            return (
              <div
                key={cls.id}
                className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md transition duration-200 flex flex-col justify-between group"
              >
                <div>
                  {/* Top Bar inside card */}
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                        cls.gradeLevel === 10
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : cls.gradeLevel === 11
                          ? 'bg-violet-50 text-violet-700 border-violet-200'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}
                    >
                      Tingkat {cls.gradeLevel}
                    </span>
                    <span className="text-xs font-mono text-slate-400">
                      {cls.academicYear ? `${cls.academicYear.name}` : ''}
                    </span>
                  </div>

                  {/* Class Name & Major */}
                  <h3 className="text-xl font-bold text-slate-900 group-hover:text-indigo-600 transition">
                    {cls.name}
                  </h3>
                  <div className="flex items-center space-x-2 mt-1 text-xs text-slate-500">
                    <span className="font-medium text-slate-700">{cls.major || 'Umum'}</span>
                    <span>•</span>
                    <span className="inline-flex items-center">
                      <MapPin className="w-3.5 h-3.5 mr-1 text-slate-400" />
                      {cls.room || 'Ruangan Belum Diatur'}
                    </span>
                  </div>

                  {/* Wali Kelas Card */}
                  <div className="mt-4 p-3 bg-slate-50/80 rounded-xl border border-slate-100 flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center flex-shrink-0">
                      {cls.homeroomTeacher?.name?.[0] || 'W'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] text-slate-400 uppercase font-semibold">
                        Wali Kelas
                      </p>
                      <p className="text-xs font-semibold text-slate-800 truncate">
                        {cls.homeroomTeacher?.name || (
                          <span className="text-slate-400 italic">Belum ditentukan</span>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Kapasitas Progress Bar */}
                  <div className="mt-4 space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-medium">
                      <span className="text-slate-500 flex items-center">
                        <Users className="w-3.5 h-3.5 mr-1 text-slate-400" />
                        Siswa Terdaftar
                      </span>
                      <span className="text-slate-900 font-bold">
                        {studentCount} / {capacity}
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          percentage >= 100
                            ? 'bg-rose-500'
                            : percentage >= 80
                            ? 'bg-amber-500'
                            : 'bg-indigo-600'
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <Link
                    href={`/dashboard/classes/${cls.id}`}
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition inline-flex items-center"
                  >
                    Kelola Rombel & Siswa →
                  </Link>

                  <div className="flex items-center space-x-1">
                    <Link
                      href={`/dashboard/classes/${cls.id}/edit`}
                      className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                      title="Edit Kelas"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </Link>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(cls)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                      title="Nonaktifkan Kelas"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Nama Kelas</th>
                <th className="py-3 px-4">Tingkat</th>
                <th className="py-3 px-4">Jurusan</th>
                <th className="py-3 px-4">Ruangan</th>
                <th className="py-3 px-4">Wali Kelas</th>
                <th className="py-3 px-4 text-center">Kapasitas</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {classes.map((cls) => (
                <tr key={cls.id} className="hover:bg-slate-50/70 transition">
                  <td className="py-3 px-4 font-bold text-slate-900">
                    <Link href={`/dashboard/classes/${cls.id}`} className="hover:text-indigo-600">
                      {cls.name}
                    </Link>
                  </td>
                  <td className="py-3 px-4">Kelas {cls.gradeLevel}</td>
                  <td className="py-3 px-4 text-slate-600">{cls.major || '-'}</td>
                  <td className="py-3 px-4 text-slate-600">{cls.room || '-'}</td>
                  <td className="py-3 px-4 font-medium text-slate-800">
                    {cls.homeroomTeacher?.name || <span className="text-slate-400 italic">-</span>}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="font-semibold text-slate-900">{cls._count?.students || 0}</span>
                    <span className="text-slate-400"> / {cls.capacity}</span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <Link
                        href={`/dashboard/classes/${cls.id}`}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                        title="Detail Rombel"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                      <Link
                        href={`/dashboard/classes/${cls.id}/edit`}
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        title="Edit Kelas"
                      >
                        <Pencil className="w-4 h-4" />
                      </Link>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(cls)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                        title="Nonaktifkan"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100">
            <div className="flex items-center space-x-3 text-rose-600 mb-4">
              <div className="p-3 bg-rose-50 rounded-xl">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">Nonaktifkan Kelas</h3>
                <p className="text-xs text-slate-500">Konfirmasi status rombel</p>
              </div>
            </div>

            <p className="text-sm text-slate-600 mb-6">
              Apakah Anda yakin ingin menonaktifkan rombel{' '}
              <strong className="text-slate-900">{deleteTarget.name}</strong>?
            </p>

            <div className="flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 border border-slate-200 text-slate-700 text-sm font-medium rounded-xl hover:bg-slate-50 transition"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="inline-flex items-center px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-sm font-medium rounded-xl shadow-xs transition disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Memproses...
                  </>
                ) : (
                  'Ya, Nonaktifkan'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
