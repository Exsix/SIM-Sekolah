'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  ShieldAlert,
  ShieldCheck,
  Activity,
  UserCheck,
  UserX,
  Search,
  Filter,
  RefreshCw,
  Download,
  KeyRound,
  Lock,
  Unlock,
  Eye,
  CheckCircle2,
  AlertTriangle,
  Clock,
  User,
  Users,
  Database,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Shield,
  FileSpreadsheet,
  AlertCircle
} from 'lucide-react';
import LogDetailModal from '@/components/audit-logs/LogDetailModal';
import ResetPasswordModal from '@/components/security/ResetPasswordModal';

interface ActivityLogItem {
  id: string;
  userId: string | null;
  roleName: string | null;
  module: string;
  action: string;
  recordId: string | null;
  description: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  oldData?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  newData?: any;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  user?: {
    id: string;
    username: string;
    email: string | null;
    role?: { name: string };
  } | null;
}

interface UserSecurityItem {
  id: string;
  username: string;
  email: string | null;
  isActive: boolean;
  role: {
    id: string;
    name: string;
    description: string | null;
  };
  student?: {
    id: string;
    name: string;
    nis: string;
    class?: { name: string } | null;
  } | null;
  teacher?: {
    id: string;
    name: string;
    nip: string;
    position: string | null;
  } | null;
  _count: {
    activityLogs: number;
  };
}

const ACTION_BADGES: Record<string, { label: string; bg: string; text: string; border: string }> = {
  CREATE: { label: 'CREATE', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  UPDATE: { label: 'UPDATE', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  DELETE: { label: 'DELETE', bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
  LOGIN: { label: 'LOGIN', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  LOGOUT: { label: 'LOGOUT', bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-300' },
};

const MODULE_OPTIONS = [
  'AUTH',
  'SECURITY',
  'STUDENT',
  'TEACHER',
  'CLASS',
  'SUBJECT',
  'ATTENDANCE',
  'SCHEDULE',
  'GRADE',
  'LIBRARY',
  'ANNOUNCEMENT',
  'SETTINGS',
];

const ROLE_COLOR: Record<string, { bg: string; text: string }> = {
  SUPER_ADMIN: { bg: 'bg-indigo-100 text-indigo-800', text: 'Super Admin' },
  ADMIN: { bg: 'bg-blue-100 text-blue-800', text: 'Administrator' },
  KEPALA_SEKOLAH: { bg: 'bg-amber-100 text-amber-800', text: 'Kepala Sekolah' },
  GURU: { bg: 'bg-emerald-100 text-emerald-800', text: 'Guru' },
  WALI_KELAS: { bg: 'bg-teal-100 text-teal-800', text: 'Wali Kelas' },
  SISWA: { bg: 'bg-sky-100 text-sky-800', text: 'Siswa' },
  PETUGAS_PERPUSTAKAAN: { bg: 'bg-purple-100 text-purple-800', text: 'Pustakawan' },
};

export default function AuditLogsSecurityPage() {
  // Current user state
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'logs' | 'users'>('logs');

  // Logs state
  const [logs, setLogs] = useState<ActivityLogItem[]>([]);
  const [logsLoading, setLogsLoading] = useState(true);
  const [logStats, setLogStats] = useState({
    totalLogs: 0,
    todayLogs: 0,
    actionBreakdown: {} as Record<string, number>,
  });
  const [logPage, setLogPage] = useState(1);
  const [logLimit, setLogLimit] = useState(20);
  const [logTotalPages, setLogTotalPages] = useState(1);
  const [logTotalItems, setLogTotalItems] = useState(0);

  // Filters for logs
  const [logSearch, setLogSearch] = useState('');
  const [logModule, setLogModule] = useState('');
  const [logAction, setLogAction] = useState('');
  const [logRole, setLogRole] = useState('');

  // Modals for logs
  const [inspectLog, setInspectLog] = useState<ActivityLogItem | null>(null);

  // Users state
  const [users, setUsers] = useState<UserSecurityItem[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('');
  const [userStatusFilter, setUserStatusFilter] = useState('');

  // Modals for users
  const [resetTargetUser, setResetTargetUser] = useState<UserSecurityItem | null>(null);
  const [statusActionUser, setStatusActionUser] = useState<UserSecurityItem | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Notifications
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // 1. Fetch current user
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

  // 2. Fetch Audit Logs
  const fetchLogs = useCallback(async () => {
    setLogsLoading(true);
    try {
      const params = new URLSearchParams({
        page: logPage.toString(),
        limit: logLimit.toString(),
      });
      if (logSearch) params.append('search', logSearch);
      if (logModule) params.append('module', logModule);
      if (logAction) params.append('action', logAction);
      if (logRole) params.append('roleName', logRole);

      const res = await fetch(`/api/audit-logs?${params.toString()}`);
      if (!res.ok) throw new Error('Gagal mengambil data log');

      const data = await res.json();
      setLogs(data.data || []);
      setLogTotalPages(data.pagination?.totalPages || 1);
      setLogTotalItems(data.pagination?.total || 0);
      setLogStats({
        totalLogs: data.stats?.totalLogs || 0,
        todayLogs: data.stats?.todayLogs || 0,
        actionBreakdown: data.stats?.actionBreakdown || {},
      });
    } catch (err: unknown) {
      console.error(err);
      showToast('Gagal memuat log audit', 'error');
    } finally {
      setLogsLoading(false);
    }
  }, [logPage, logLimit, logSearch, logModule, logAction, logRole]);

  // 3. Fetch Users
  const fetchUsers = useCallback(async () => {
    setUsersLoading(true);
    try {
      const params = new URLSearchParams();
      if (userSearch) params.append('search', userSearch);
      if (userRoleFilter) params.append('role', userRoleFilter);
      if (userStatusFilter) params.append('isActive', userStatusFilter);

      const res = await fetch(`/api/security/users?${params.toString()}`);
      if (!res.ok) throw new Error('Gagal mengambil daftar pengguna');

      const data = await res.json();
      setUsers(data.data || []);
    } catch (err: unknown) {
      console.error(err);
      showToast('Gagal memuat akun pengguna', 'error');
    } finally {
      setUsersLoading(false);
    }
  }, [userSearch, userRoleFilter, userStatusFilter]);

  useEffect(() => {
    if (activeTab === 'logs') {
      fetchLogs();
    } else {
      fetchUsers();
    }
  }, [activeTab, fetchLogs, fetchUsers]);

  // Handle user lock / unlock
  const handleToggleStatus = async (user: UserSecurityItem) => {
    if (currentUser && user.id === currentUser.id) {
      showToast('Anda tidak dapat mengunci akun Anda sendiri!', 'error');
      return;
    }

    setIsUpdatingStatus(true);
    try {
      const res = await fetch(`/api/security/users/${user.id}/status`, {
        method: 'PUT',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal mengubah status');

      showToast(data.message, 'success');
      setStatusActionUser(null);
      fetchUsers();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Terjadi kesalahan sistem', 'error');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleExportExcel = () => {
    const params = new URLSearchParams();
    if (logModule) params.append('module', logModule);
    if (logAction) params.append('action', logAction);
    window.location.href = `/api/audit-logs/export?${params.toString()}`;
  };

  // Compute active vs locked count in users
  const activeCount = users.filter((u) => u.isActive).length;
  const lockedCount = users.filter((u) => !u.isActive).length;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
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
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
              <span>Sistem Keamanan & Kepatuhan Data (Enterprise Security)</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
              Pusat Keamanan & Jejak Audit
            </h1>
            <p className="text-slate-300 text-xs md:text-sm leading-relaxed">
              Pemantauan terpusat terhadap mutasi data, riwayat sesi login pengguna, kontrol integritas hak akses,
              serta inspeksi perubahan state sistem secara menyeluruh.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => {
                if (activeTab === 'logs') fetchLogs();
                else fetchUsers();
              }}
              className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 border border-slate-700/70 text-xs font-semibold shadow-sm transition hover:scale-[1.02] active:scale-[0.98]"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${logsLoading || usersLoading ? 'animate-spin' : ''}`} />
              <span>Segarkan Data</span>
            </button>
            {activeTab === 'logs' && (
              <button
                onClick={handleExportExcel}
                className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition hover:scale-[1.02] active:scale-[0.98]"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Ekspor Excel (.xlsx)</span>
              </button>
            )}
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="mt-8 flex border-b border-slate-800">
          <button
            onClick={() => setActiveTab('logs')}
            className={`pb-3.5 px-4 text-xs font-bold transition flex items-center space-x-2 border-b-2 -mb-px ${
              activeTab === 'logs'
                ? 'border-indigo-400 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Activity className="w-4 h-4 text-indigo-400" />
            <span>Jejak Audit Aktivitas ({logStats.totalLogs.toLocaleString('id-ID')})</span>
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`pb-3.5 px-4 text-xs font-bold transition flex items-center space-x-2 border-b-2 -mb-px ${
              activeTab === 'users'
                ? 'border-indigo-400 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-4 h-4 text-indigo-400" />
            <span>Manajemen Akun & Autentikasi ({users.length})</span>
          </button>
        </div>
      </div>

      {/* TAB 1: AUDIT LOGS */}
      {activeTab === 'logs' && (
        <div className="space-y-6">
          {/* Summary KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center space-x-4">
              <div className="p-3 bg-indigo-50 text-indigo-700 rounded-xl">
                <Database className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Log Tercatat</p>
                <h3 className="text-xl font-extrabold text-slate-900">
                  {logStats.totalLogs.toLocaleString('id-ID')}
                </h3>
                <p className="text-[11px] text-slate-500">Mutasi & transaksi tercatat</p>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center space-x-4">
              <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl">
                <Activity className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Aktivitas Hari Ini</p>
                <h3 className="text-xl font-extrabold text-slate-900">
                  {logStats.todayLogs.toLocaleString('id-ID')}
                </h3>
                <p className="text-[11px] text-emerald-600 font-semibold flex items-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse" />
                  Realtime aktif
                </p>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center space-x-4">
              <div className="p-3 bg-amber-50 text-amber-700 rounded-xl">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Distribusi Mutasi</p>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-mono text-[10px] font-bold">
                    C: {logStats.actionBreakdown.CREATE || 0}
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 font-mono text-[10px] font-bold">
                    U: {logStats.actionBreakdown.UPDATE || 0}
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 font-mono text-[10px] font-bold">
                    D: {logStats.actionBreakdown.DELETE || 0}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center space-x-4">
              <div className="p-3 bg-blue-50 text-blue-700 rounded-xl">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Status Proteksi</p>
                <h3 className="text-sm font-bold text-emerald-700 flex items-center">
                  <ShieldCheck className="w-4 h-4 mr-1 text-emerald-600" />
                  Aktif & Terproteksi
                </h3>
                <p className="text-[10px] text-slate-400 mt-0.5">RBAC & bcrypt aktif</p>
              </div>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              {/* Search */}
              <div className="relative md:col-span-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Cari deskripsi, IP, user..."
                  value={logSearch}
                  onChange={(e) => {
                    setLogSearch(e.target.value);
                    setLogPage(1);
                  }}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-slate-50/50"
                />
              </div>

              {/* Module Filter */}
              <div>
                <select
                  value={logModule}
                  onChange={(e) => {
                    setLogModule(e.target.value);
                    setLogPage(1);
                  }}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
                >
                  <option value="">Semua Modul Sistem</option>
                  {MODULE_OPTIONS.map((m) => (
                    <option key={m} value={m}>
                      Modul: {m}
                    </option>
                  ))}
                </select>
              </div>

              {/* Action Filter */}
              <div>
                <select
                  value={logAction}
                  onChange={(e) => {
                    setLogAction(e.target.value);
                    setLogPage(1);
                  }}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
                >
                  <option value="">Semua Tindakan / Aksi</option>
                  <option value="CREATE">CREATE (Tambah Data)</option>
                  <option value="UPDATE">UPDATE (Ubah Data)</option>
                  <option value="DELETE">DELETE (Hapus Data)</option>
                  <option value="LOGIN">LOGIN (Masuk Sistem)</option>
                  <option value="LOGOUT">LOGOUT (Keluar Sistem)</option>
                </select>
              </div>

              {/* Role Filter */}
              <div>
                <select
                  value={logRole}
                  onChange={(e) => {
                    setLogRole(e.target.value);
                    setLogPage(1);
                  }}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
                >
                  <option value="">Semua Peran Pengguna</option>
                  <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                  <option value="ADMIN">ADMIN</option>
                  <option value="KEPALA_SEKOLAH">KEPALA_SEKOLAH</option>
                  <option value="GURU">GURU</option>
                  <option value="SISWA">SISWA</option>
                </select>
              </div>
            </div>
          </div>

          {/* Master Table of Logs */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold">
                    <th className="py-3 px-4">Waktu Kejadian</th>
                    <th className="py-3 px-4">Aktor / Pengguna</th>
                    <th className="py-3 px-4">Modul</th>
                    <th className="py-3 px-4">Aksi</th>
                    <th className="py-3 px-4">Deskripsi Aktivitas</th>
                    <th className="py-3 px-4">IP & Perangkat</th>
                    <th className="py-3 px-4 text-center">Inspeksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {logsLoading ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto text-indigo-600 mb-2" />
                        <p>Memuat rekam jejak audit...</p>
                      </td>
                    </tr>
                  ) : logs.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        <ShieldAlert className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                        <p className="font-semibold text-slate-600">Tidak ada data log yang sesuai dengan filter.</p>
                      </td>
                    </tr>
                  ) : (
                    logs.map((log) => {
                      const badge = ACTION_BADGES[log.action] || {
                        label: log.action,
                        bg: 'bg-slate-100',
                        text: 'text-slate-700',
                        border: 'border-slate-200',
                      };
                      return (
                        <tr key={log.id} className="hover:bg-slate-50/60 transition group">
                          {/* Waktu */}
                          <td className="py-3 px-4 whitespace-nowrap">
                            <div className="flex items-center space-x-1.5 font-medium text-slate-800">
                              <Clock className="w-3.5 h-3.5 text-slate-400" />
                              <span>{new Date(log.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                            </div>
                            <span className="text-[10px] text-slate-400 font-mono block">
                              {new Date(log.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </span>
                          </td>

                          {/* Aktor */}
                          <td className="py-3 px-4 whitespace-nowrap">
                            <div className="flex items-center space-x-2">
                              <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-700 font-bold flex items-center justify-center text-xs border border-indigo-100">
                                {log.user?.username?.charAt(0).toUpperCase() || 'S'}
                              </div>
                              <div>
                                <span className="font-bold text-slate-800 block">
                                  {log.user?.username || 'Sistem'}
                                </span>
                                <span className="text-[10px] px-1.5 py-0.2 rounded font-mono bg-slate-100 text-slate-600">
                                  {log.roleName || '-'}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Modul */}
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                              {log.module}
                            </span>
                          </td>

                          {/* Aksi */}
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span
                              className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md border ${badge.bg} ${badge.text} ${badge.border}`}
                            >
                              {badge.label}
                            </span>
                          </td>

                          {/* Deskripsi */}
                          <td className="py-3 px-4 max-w-md">
                            <p className="text-slate-700 font-medium truncate" title={log.description}>
                              {log.description}
                            </p>
                            {log.recordId && (
                              <span className="text-[10px] text-slate-400 font-mono">
                                Ref: {log.recordId}
                              </span>
                            )}
                          </td>

                          {/* IP & Perangkat */}
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span className="font-mono text-[11px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                              {log.ipAddress || 'localhost'}
                            </span>
                          </td>

                          {/* Action Button */}
                          <td className="py-3 px-4 whitespace-nowrap text-center">
                            <button
                              onClick={() => setInspectLog(log)}
                              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 border border-slate-200 hover:border-indigo-200 font-semibold text-[11px] inline-flex items-center space-x-1 transition shadow-2xs"
                              title="Inspeksi Detail Diff"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Diff</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="p-4 bg-slate-50/60 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-600">
              <div className="flex items-center space-x-2">
                <span>Menampilkan log ke</span>
                <span className="font-bold text-slate-900">
                  {logs.length > 0 ? (logPage - 1) * logLimit + 1 : 0}
                </span>
                <span>sampai</span>
                <span className="font-bold text-slate-900">
                  {Math.min(logPage * logLimit, logTotalItems)}
                </span>
                <span>dari</span>
                <span className="font-bold text-slate-900">{logTotalItems}</span>
                <span>total aktivitas</span>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  disabled={logPage <= 1}
                  onClick={() => setLogPage((p) => Math.max(1, p - 1))}
                  className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="font-bold px-2">
                  {logPage} / {logTotalPages || 1}
                </span>
                <button
                  disabled={logPage >= logTotalPages}
                  onClick={() => setLogPage((p) => p + 1)}
                  className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <select
                  value={logLimit}
                  onChange={(e) => {
                    setLogLimit(Number(e.target.value));
                    setLogPage(1);
                  }}
                  className="ml-2 px-2 py-1 rounded-lg border border-slate-200 bg-white text-xs font-semibold"
                >
                  <option value={10}>10 / hal</option>
                  <option value={20}>20 / hal</option>
                  <option value={50}>50 / hal</option>
                  <option value={100}>100 / hal</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: USER SECURITY MANAGEMENT */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          {/* Summary KPI Cards for Users */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center space-x-4">
              <div className="p-3 bg-indigo-50 text-indigo-700 rounded-xl">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Akun</p>
                <h3 className="text-xl font-extrabold text-slate-900">{users.length}</h3>
                <p className="text-[11px] text-slate-500">Seluruh kredensial aktif & non-aktif</p>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center space-x-4">
              <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl">
                <UserCheck className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Akun Aktif</p>
                <h3 className="text-xl font-extrabold text-emerald-700">{activeCount}</h3>
                <p className="text-[11px] text-emerald-600">Dapat login ke aplikasi</p>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center space-x-4">
              <div className="p-3 bg-rose-50 text-rose-700 rounded-xl">
                <UserX className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Akun Terkunci</p>
                <h3 className="text-xl font-extrabold text-rose-700">{lockedCount}</h3>
                <p className="text-[11px] text-rose-600">Akses diblokir sementara</p>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center space-x-4">
              <div className="p-3 bg-blue-50 text-blue-700 rounded-xl">
                <KeyRound className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Keamanan Sandi</p>
                <h3 className="text-sm font-bold text-slate-800">Enkripsi bcrypt</h3>
                <p className="text-[10px] text-slate-400">Salt rounds: 10 auto-hash</p>
              </div>
            </div>
          </div>

          {/* User Filter Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Search */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Cari username, nama siswa/guru, email..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-slate-50/50"
                />
              </div>

              {/* Role filter */}
              <div>
                <select
                  value={userRoleFilter}
                  onChange={(e) => setUserRoleFilter(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
                >
                  <option value="">Semua Peran Akun</option>
                  <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                  <option value="ADMIN">ADMIN</option>
                  <option value="KEPALA_SEKOLAH">KEPALA_SEKOLAH</option>
                  <option value="GURU">GURU</option>
                  <option value="SISWA">SISWA</option>
                  <option value="PETUGAS_PERPUSTAKAAN">PETUGAS_PERPUSTAKAAN</option>
                </select>
              </div>

              {/* Status filter */}
              <div>
                <select
                  value={userStatusFilter}
                  onChange={(e) => setUserStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
                >
                  <option value="">Semua Status Akun</option>
                  <option value="true">Status: Aktif</option>
                  <option value="false">Status: Terkunci / Diblokir</option>
                </select>
              </div>
            </div>
          </div>

          {/* Master Table of Users */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold">
                    <th className="py-3 px-4">Pengguna & Identitas</th>
                    <th className="py-3 px-4">Peran Hak Akses</th>
                    <th className="py-3 px-4">Email Terdaftar</th>
                    <th className="py-3 px-4">Total Aktivitas</th>
                    <th className="py-3 px-4">Status Akun</th>
                    <th className="py-3 px-4 text-center">Tindakan Keamanan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {usersLoading ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto text-indigo-600 mb-2" />
                        <p>Memuat akun pengguna...</p>
                      </td>
                    </tr>
                  ) : users.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400">
                        <Users className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                        <p className="font-semibold text-slate-600">Tidak ada akun yang sesuai dengan filter.</p>
                      </td>
                    </tr>
                  ) : (
                    users.map((u) => {
                      const roleConfig = ROLE_COLOR[u.role.name] || {
                        bg: 'bg-slate-100 text-slate-800',
                        text: u.role.name,
                      };
                      const displayName = u.student?.name || u.teacher?.name || '-';
                      const identifier = u.student ? `NIS: ${u.student.nis} (${u.student.class?.name || '-'})` : u.teacher ? `NIP: ${u.teacher.nip}` : null;
                      const isSelf = currentUser && currentUser.id === u.id;

                      return (
                        <tr key={u.id} className="hover:bg-slate-50/60 transition">
                          {/* Pengguna & Identitas */}
                          <td className="py-3 px-4">
                            <div className="flex items-center space-x-3">
                              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 text-white font-extrabold flex items-center justify-center text-sm shadow-xs">
                                {u.username.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div className="flex items-center space-x-1.5">
                                  <span className="font-bold text-slate-900">{u.username}</span>
                                  {isSelf && (
                                    <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-indigo-100 text-indigo-800">
                                      Anda
                                    </span>
                                  )}
                                </div>
                                {displayName !== '-' && (
                                  <span className="text-slate-600 block text-[11px] font-medium">
                                    {displayName}
                                  </span>
                                )}
                                {identifier && (
                                  <span className="text-[10px] text-slate-400 font-mono block">
                                    {identifier}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Peran */}
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${roleConfig.bg}`}>
                              {roleConfig.text}
                            </span>
                          </td>

                          {/* Email */}
                          <td className="py-3 px-4 whitespace-nowrap font-mono text-slate-600">
                            {u.email || <span className="text-slate-300">-</span>}
                          </td>

                          {/* Log Count */}
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-mono font-bold text-[11px]">
                              <Activity className="w-3 h-3 text-slate-400" />
                              <span>{u._count.activityLogs} aksi</span>
                            </span>
                          </td>

                          {/* Status */}
                          <td className="py-3 px-4 whitespace-nowrap">
                            {u.isActive ? (
                              <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-[10px]">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                <span>Aktif</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200 font-bold text-[10px]">
                                <Lock className="w-3 h-3 text-rose-500" />
                                <span>Terkunci</span>
                              </span>
                            )}
                          </td>

                          {/* Tindakan */}
                          <td className="py-3 px-4 whitespace-nowrap text-center">
                            <div className="flex items-center justify-center space-x-2">
                              {/* Reset Password */}
                              <button
                                onClick={() => setResetTargetUser(u)}
                                className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-[11px] font-bold inline-flex items-center space-x-1 transition shadow-2xs"
                                title="Setel Ulang Kata Sandi"
                              >
                                <KeyRound className="w-3.5 h-3.5" />
                                <span>Reset Sandi</span>
                              </button>

                              {/* Lock / Unlock Toggle */}
                              <button
                                disabled={isSelf}
                                onClick={() => setStatusActionUser(u)}
                                className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold inline-flex items-center space-x-1 transition shadow-2xs disabled:opacity-30 disabled:cursor-not-allowed ${
                                  u.isActive
                                    ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200'
                                    : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                                }`}
                                title={u.isActive ? 'Kunci Akun Pengguna' : 'Buka Kunci Akun Pengguna'}
                              >
                                {u.isActive ? (
                                  <>
                                    <Lock className="w-3.5 h-3.5" />
                                    <span>Kunci</span>
                                  </>
                                ) : (
                                  <>
                                    <Unlock className="w-3.5 h-3.5" />
                                    <span>Buka</span>
                                  </>
                                )}
                              </button>
                            </div>
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

      {/* Modal 1: Log Detail Inspector */}
      <LogDetailModal
        isOpen={Boolean(inspectLog)}
        onClose={() => setInspectLog(null)}
        log={inspectLog}
      />

      {/* Modal 2: Reset Password Modal */}
      <ResetPasswordModal
        isOpen={Boolean(resetTargetUser)}
        onClose={() => setResetTargetUser(null)}
        onSuccess={() => {
          showToast('Kata sandi berhasil disetel ulang');
          fetchUsers();
        }}
        user={resetTargetUser}
      />

      {/* Modal 3: Confirmation Dialog for Lock/Unlock */}
      {statusActionUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-sm w-full p-6 space-y-4">
            <div className="flex items-center space-x-3 text-slate-900">
              <div
                className={`p-3 rounded-2xl ${
                  statusActionUser.isActive ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'
                }`}
              >
                {statusActionUser.isActive ? <Lock className="w-6 h-6" /> : <Unlock className="w-6 h-6" />}
              </div>
              <div>
                <h3 className="font-extrabold text-sm">
                  {statusActionUser.isActive ? 'Kunci Akun Pengguna?' : 'Buka Kunci Akun?'}
                </h3>
                <p className="text-xs text-slate-500 font-mono">@{statusActionUser.username}</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              {statusActionUser.isActive
                ? `Pengguna @${statusActionUser.username} tidak akan dapat login ke dalam sistem hingga akun dibuka kembali oleh administrator.`
                : `Pengguna @${statusActionUser.username} akan dapat kembali login dan mengakses fitur sistem sesuai perannya.`}
            </p>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                disabled={isUpdatingStatus}
                onClick={() => setStatusActionUser(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isUpdatingStatus}
                onClick={() => handleToggleStatus(statusActionUser)}
                className={`px-4 py-2 rounded-xl text-xs font-bold text-white shadow-md transition flex items-center space-x-1.5 ${
                  statusActionUser.isActive
                    ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/20'
                    : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20'
                }`}
              >
                {isUpdatingStatus ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : statusActionUser.isActive ? (
                  <Lock className="w-3.5 h-3.5" />
                ) : (
                  <Unlock className="w-3.5 h-3.5" />
                )}
                <span>{statusActionUser.isActive ? 'Ya, Kunci Akun' : 'Ya, Buka Kunci'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
