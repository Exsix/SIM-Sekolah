'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  Plus,
  Search,
  Download,
  Users,
  Pencil,
  Trash2,
  Eye,
  Loader2,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Layers,
  GraduationCap
} from 'lucide-react';

interface SubjectItem {
  id: string;
  code: string;
  name: string;
  category: string | null;
  gradeLevel: number | null;
  isActive: boolean;
  teacherSubject: Array<{
    teacher: {
      id: string;
      name: string;
      nip: string | null;
      photoUrl: string | null;
    };
  }>;
  _count: {
    schedules: number;
    gradeItems: number;
    teacherSubject: number;
  };
}

const CATEGORY_COLORS: Record<string, string> = {
  'Muatan Nasional': 'bg-blue-50 text-blue-700 border-blue-200',
  'Peminatan MIPA': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Peminatan IPS': 'bg-amber-50 text-amber-700 border-amber-200',
  'Peminatan Bahasa': 'bg-purple-50 text-purple-700 border-purple-200',
  'Muatan Lokal': 'bg-teal-50 text-teal-700 border-teal-200',
  'Bimbingan Konseling (BK)': 'bg-rose-50 text-rose-700 border-rose-200',
};

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [gradeFilter, setGradeFilter] = useState('');

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState<SubjectItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchSubjects = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        search,
        ...(categoryFilter && { category: categoryFilter }),
        ...(gradeFilter && { gradeLevel: gradeFilter }),
      });

      const res = await fetch(`/api/subjects?${params.toString()}`);
      const json = await res.json();
      if (json.data) {
        setSubjects(json.data);
      }
    } catch (err) {
      console.error('Failed to fetch subjects', err);
    } finally {
      setLoading(false);
    }
  }, [search, categoryFilter, gradeFilter]);

  useEffect(() => {
    fetchSubjects();
  }, [fetchSubjects]);

  const handleExport = async () => {
    setExporting(true);
    try {
      const params = new URLSearchParams({
        search,
        category: categoryFilter,
      });
      const res = await fetch(`/api/subjects/export?${params.toString()}`);
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `data-mata-pelajaran-${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch {
      alert('Gagal mengekspor data mata pelajaran');
    } finally {
      setExporting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/subjects/${deleteTarget.id}`, { method: 'DELETE' });
      if (res.ok) {
        setDeleteTarget(null);
        fetchSubjects();
      } else {
        const json = await res.json();
        alert(json.error || 'Gagal menonaktifkan mata pelajaran');
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
            Manajemen Mata Pelajaran
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Pengelolaan kurikulum mapel, alokasi guru pengampu, kode kompetensi, dan beban ajar
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={handleExport}
            disabled={exporting || subjects.length === 0}
            className="inline-flex items-center px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-sm font-medium rounded-xl shadow-xs transition disabled:opacity-50"
          >
            {exporting ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin text-slate-400" />
            ) : (
              <Download className="w-4 h-4 mr-2 text-slate-500" />
            )}
            Ekspor Excel
          </button>
          <Link
            href="/dashboard/subjects/new"
            className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl shadow-xs transition duration-200"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Tambah Mata Pelajaran
          </Link>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search */}
          <div className="lg:col-span-2 relative">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Cari kode atau nama mata pelajaran..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 focus:bg-white transition"
            />
          </div>

          {/* Kategori */}
          <div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 focus:bg-white"
            >
              <option value="">Semua Kategori Kurikulum</option>
              <option value="Muatan Nasional">Muatan Nasional</option>
              <option value="Peminatan MIPA">Peminatan MIPA</option>
              <option value="Peminatan IPS">Peminatan IPS</option>
              <option value="Peminatan Bahasa">Peminatan Bahasa</option>
              <option value="Muatan Lokal">Muatan Lokal</option>
            </select>
          </div>

          {/* Reset button */}
          <div>
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setCategoryFilter('');
                setGradeFilter('');
              }}
              className="w-full inline-flex items-center justify-center px-3 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
              Reset Filter
            </button>
          </div>
        </div>
      </div>

      {/* Table Content */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-4 w-12 text-center">No</th>
                <th className="py-3.5 px-4">Kode Mapel</th>
                <th className="py-3.5 px-4">Nama Mata Pelajaran</th>
                <th className="py-3.5 px-4">Kategori</th>
                <th className="py-3.5 px-4">Tingkat</th>
                <th className="py-3.5 px-4">Guru Pengampu</th>
                <th className="py-3.5 px-4 text-center">Jadwal Sesi</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-16 text-center text-slate-500">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-indigo-600 mb-2" />
                    Memuat daftar mata pelajaran...
                  </td>
                </tr>
              ) : subjects.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-16 text-center text-slate-500">
                    <BookOpen className="w-12 h-12 mx-auto text-slate-300 mb-2" />
                    <p className="font-medium text-slate-700">Tidak ada mata pelajaran ditemukan</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Coba ubah filter pencarian atau tambahkan mata pelajaran baru
                    </p>
                  </td>
                </tr>
              ) : (
                subjects.map((sub, idx) => (
                  <tr key={sub.id} className="hover:bg-slate-50/70 transition duration-150">
                    <td className="py-3.5 px-4 text-center font-mono text-xs text-slate-400">
                      {idx + 1}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-mono font-bold text-xs bg-slate-100 text-slate-800 px-2 py-0.5 rounded border border-slate-200">
                        {sub.code}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <Link
                        href={`/dashboard/subjects/${sub.id}`}
                        className="font-bold text-slate-900 hover:text-indigo-600 transition"
                      >
                        {sub.name}
                      </Link>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                          CATEGORY_COLORS[sub.category || ''] || 'bg-slate-50 text-slate-600 border-slate-200'
                        }`}
                      >
                        {sub.category || 'Umum'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 text-xs">
                      {sub.gradeLevel ? `Kelas ${sub.gradeLevel}` : 'Semua Tingkat'}
                    </td>
                    <td className="py-3.5 px-4">
                      {sub.teacherSubject?.length > 0 ? (
                        <div className="flex flex-wrap items-center gap-1">
                          {sub.teacherSubject.map((ts) => (
                            <span
                              key={ts.teacher.id}
                              className="px-2 py-0.5 rounded text-xs bg-indigo-50 text-indigo-700 font-medium"
                            >
                              {ts.teacher.name}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 italic">Belum Ditentukan</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center font-semibold text-xs text-slate-700">
                      {sub._count?.schedules || 0}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {sub.isActive ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" />
                      ) : (
                        <XCircle className="w-4 h-4 text-slate-300 mx-auto" />
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        <Link
                          href={`/dashboard/subjects/${sub.id}`}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                          title="Detail Mapel"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <Link
                          href={`/dashboard/subjects/${sub.id}/edit`}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          title="Edit Mapel"
                        >
                          <Pencil className="w-4 h-4" />
                        </Link>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(sub)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                          title="Nonaktifkan Mapel"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100">
            <div className="flex items-center space-x-3 text-rose-600 mb-4">
              <div className="p-3 bg-rose-50 rounded-xl">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">Nonaktifkan Mata Pelajaran</h3>
                <p className="text-xs text-slate-500">Konfirmasi status kurikulum</p>
              </div>
            </div>

            <p className="text-sm text-slate-600 mb-6">
              Apakah Anda yakin ingin menonaktifkan mata pelajaran{' '}
              <strong className="text-slate-900">{deleteTarget.name}</strong> ({deleteTarget.code})?
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
