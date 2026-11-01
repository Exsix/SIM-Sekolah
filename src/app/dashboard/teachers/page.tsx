'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Users, Plus, Download, Search, Eye, Pencil, Trash2,
  ChevronLeft, ChevronRight, Loader2, User, RefreshCw, AlertCircle,
  CheckCircle2, XCircle, Briefcase
} from 'lucide-react';

interface TeacherItem {
  id: string;
  nip: string | null;
  nuptk: string | null;
  name: string;
  gender: 'LAKI_LAKI' | 'PEREMPUAN';
  position: string | null;
  employmentStatus: string;
  education: string | null;
  isActive: boolean;
  photoUrl: string | null;
  classesAdvised: Array<{ id: string; name: string }>;
  teacherSubjects: Array<{ subject: { name: string; code: string } }>;
  _count: { schedules: number; teacherSubjects: number };
}

const STATUS_LABEL: Record<string, string> = {
  PNS: 'PNS',
  PPPK: 'PPPK',
  GURU_TETAP_YAYASAN: 'GTY',
  GURU_HONORER: 'Honorer',
};

const STATUS_COLOR: Record<string, string> = {
  PNS: 'bg-blue-50 text-blue-700 border-blue-200',
  PPPK: 'bg-violet-50 text-violet-700 border-violet-200',
  GURU_TETAP_YAYASAN: 'bg-teal-50 text-teal-700 border-teal-200',
  GURU_HONORER: 'bg-amber-50 text-amber-700 border-amber-200',
};

export default function TeachersPage() {
  const [teachers, setTeachers] = useState<TeacherItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isActiveFilter, setIsActiveFilter] = useState('true');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [deleteTarget, setDeleteTarget] = useState<TeacherItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchTeachers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        search,
        status: statusFilter,
        isActive: isActiveFilter,
        sortBy: 'name',
        order: 'asc',
      });
      const res = await fetch(`/api/teachers?${params.toString()}`);
      const json = await res.json();
      if (json.data) {
        setTeachers(json.data);
        setTotalPages(json.pagination.totalPages);
        setTotalCount(json.pagination.total);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, isActiveFilter]);

  useEffect(() => { fetchTeachers(); }, [fetchTeachers]);

  const handleExport = async () => {
    setExporting(true);
    try {
      const params = new URLSearchParams({ search, status: statusFilter, isActive: isActiveFilter });
      const res = await fetch(`/api/teachers/export?${params.toString()}`);
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `data-guru-${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch {
      alert('Gagal mengekspor data ke Excel');
    } finally {
      setExporting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/teachers/${deleteTarget.id}`, { method: 'DELETE' });
      if (res.ok) { setDeleteTarget(null); fetchTeachers(); }
      else { const j = await res.json(); alert(j.error || 'Gagal menonaktifkan guru'); }
    } catch { alert('Terjadi kesalahan'); }
    finally { setIsDeleting(false); }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Manajemen Guru & Staf</h1>
          <p className="text-sm text-slate-500 mt-1">Kelola data GTK, penugasan mengajar, dan wali kelas</p>
        </div>
        <div className="flex items-center space-x-3">
          <button onClick={handleExport} disabled={exporting} className="inline-flex items-center px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-sm font-medium rounded-xl shadow-xs transition disabled:opacity-50">
            {exporting ? <Loader2 className="w-4 h-4 mr-2 animate-spin text-slate-400" /> : <Download className="w-4 h-4 mr-2 text-slate-500" />}
            Ekspor Excel
          </button>
          <Link href="/dashboard/teachers/new" className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl shadow-xs transition">
            <Plus className="w-4 h-4 mr-1.5" />
            Tambah Guru
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="lg:col-span-2 relative">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama, NIP, NUPTK, jabatan..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 focus:bg-white transition"
            />
          </div>

          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 focus:bg-white">
            <option value="">Semua Status</option>
            <option value="PNS">PNS</option>
            <option value="PPPK">PPPK</option>
            <option value="GURU_TETAP_YAYASAN">Guru Tetap Yayasan</option>
            <option value="GURU_HONORER">Guru Honorer</option>
          </select>

          <select value={isActiveFilter} onChange={(e) => { setIsActiveFilter(e.target.value); setPage(1); }} className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 focus:bg-white">
            <option value="">Semua</option>
            <option value="true">Aktif</option>
            <option value="false">Tidak Aktif</option>
          </select>

          <button onClick={() => { setSearch(''); setStatusFilter(''); setIsActiveFilter('true'); setPage(1); }} className="inline-flex items-center justify-center px-3 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition">
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
            Reset Filter
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-4">Guru / Staf</th>
                <th className="py-3.5 px-4">NIP / NUPTK</th>
                <th className="py-3.5 px-4">Jabatan</th>
                <th className="py-3.5 px-4">Status Kepeg.</th>
                <th className="py-3.5 px-4">Wali Kelas</th>
                <th className="py-3.5 px-4">Mapel Diampu</th>
                <th className="py-3.5 px-4">Aktif</th>
                <th className="py-3.5 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-slate-500">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-indigo-600 mb-2" />
                    Memuat data guru...
                  </td>
                </tr>
              ) : teachers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-slate-500">
                    <Briefcase className="w-12 h-12 mx-auto text-slate-300 mb-2" />
                    <p className="font-medium text-slate-700">Tidak ada data guru ditemukan</p>
                    <p className="text-xs text-slate-400 mt-1">Coba ubah filter pencarian atau reset filter</p>
                  </td>
                </tr>
              ) : (
                teachers.map((teacher) => (
                  <tr key={teacher.id} className="hover:bg-slate-50/70 transition duration-150">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center space-x-3">
                        <div className="relative w-10 h-10 rounded-full overflow-hidden bg-slate-100 border border-slate-200 flex-shrink-0 flex items-center justify-center">
                          {teacher.photoUrl ? (
                            <Image src={teacher.photoUrl} alt={teacher.name} fill className="object-cover" />
                          ) : (
                            <User className="w-5 h-5 text-slate-400" />
                          )}
                        </div>
                        <div>
                          <Link href={`/dashboard/teachers/${teacher.id}`} className="font-medium text-slate-900 hover:text-indigo-600 transition">
                            {teacher.name}
                          </Link>
                          <p className="text-xs text-slate-400">{teacher.gender === 'LAKI_LAKI' ? 'Laki-laki' : 'Perempuan'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs text-slate-600">
                      <div>{teacher.nip || '-'}</div>
                      {teacher.nuptk && <div className="text-slate-400">{teacher.nuptk}</div>}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 text-xs">
                      {teacher.position || <span className="italic text-slate-400">-</span>}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${STATUS_COLOR[teacher.employmentStatus] || 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                        {STATUS_LABEL[teacher.employmentStatus] || teacher.employmentStatus}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-xs">
                      {teacher.classesAdvised?.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {teacher.classesAdvised.map((c) => (
                            <span key={c.id} className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded text-xs font-medium">{c.name}</span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">-</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-600">
                      {teacher.teacherSubjects?.length > 0 ? (
                        <div className="space-y-0.5">
                          {teacher.teacherSubjects.slice(0, 2).map((ts, i) => (
                            <div key={i} className="text-slate-600">{ts.subject.name}</div>
                          ))}
                          {teacher.teacherSubjects.length > 2 && (
                            <div className="text-slate-400">+{teacher.teacherSubjects.length - 2} lainnya</div>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">-</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      {teacher.isActive ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <XCircle className="w-4 h-4 text-slate-300" />
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <Link href={`/dashboard/teachers/${teacher.id}`} title="Lihat Detail" className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition">
                          <Eye className="w-4 h-4" />
                        </Link>
                        <Link href={`/dashboard/teachers/${teacher.id}/edit`} title="Edit Guru" className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition">
                          <Pencil className="w-4 h-4" />
                        </Link>
                        <button onClick={() => setDeleteTarget(teacher)} title="Nonaktifkan Guru" className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition">
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

        {/* Pagination */}
        <div className="px-4 py-3 bg-slate-50/50 border-t border-slate-200/80 flex items-center justify-between text-xs text-slate-500">
          <div>
            Menampilkan <span className="font-semibold text-slate-700">{teachers.length}</span> dari{' '}
            <span className="font-semibold text-slate-700">{totalCount}</span> guru/staf
          </div>
          <div className="flex items-center space-x-1">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 py-1 font-medium text-slate-700">Halaman {page} dari {totalPages || 1}</span>
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Delete Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100">
            <div className="flex items-center space-x-3 text-rose-600 mb-4">
              <div className="p-3 bg-rose-50 rounded-xl">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">Nonaktifkan Guru</h3>
                <p className="text-xs text-slate-500">Konfirmasi perubahan status data</p>
              </div>
            </div>
            <p className="text-sm text-slate-600 mb-6">
              Apakah Anda yakin ingin menonaktifkan <strong className="text-slate-900">{deleteTarget.name}</strong>?
              Data tidak akan dihapus permanen.
            </p>
            <div className="flex items-center justify-end space-x-3">
              <button onClick={() => setDeleteTarget(null)} className="px-4 py-2 border border-slate-200 text-slate-700 text-sm font-medium rounded-xl hover:bg-slate-50 transition">Batal</button>
              <button onClick={handleDelete} disabled={isDeleting} className="inline-flex items-center px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-sm font-medium rounded-xl shadow-xs transition disabled:opacity-50">
                {isDeleting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Memproses...</> : 'Ya, Nonaktifkan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
