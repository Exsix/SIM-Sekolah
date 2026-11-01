'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Trophy,
  Award,
  Search,
  Filter,
  Plus,
  Star,
  CheckCircle2,
  Clock,
  Sparkles,
  ExternalLink,
  Loader2,
  Calendar,
  Building2,
  User,
  Eye,
  Pencil,
  Trash2,
  Layers,
  GraduationCap,
  LayoutGrid,
  List,
  AlertCircle,
  RefreshCw,
  ChevronRight,
  ShieldCheck,
  Globe2
} from 'lucide-react';
import AchievementFormModal, { AchievementItem } from '@/components/achievements/AchievementFormModal';
import AchievementDetailModal from '@/components/achievements/AchievementDetailModal';

const CATEGORY_MAP: Record<string, { label: string; bg: string; text: string }> = {
  SAINS_TEKNOLOGI: { label: 'Sains & Robotik', bg: 'bg-cyan-500/10 border-cyan-500/20', text: 'text-cyan-400' },
  AKADEMIK: { label: 'Akademik', bg: 'bg-indigo-500/10 border-indigo-500/20', text: 'text-indigo-400' },
  OLAHRAGA: { label: 'Olahraga', bg: 'bg-emerald-500/10 border-emerald-500/20', text: 'text-emerald-400' },
  SENI: { label: 'Seni & Budaya', bg: 'bg-pink-500/10 border-pink-500/20', text: 'text-pink-400' },
  KEAGAMAAN: { label: 'Keagamaan', bg: 'bg-amber-500/10 border-amber-500/20', text: 'text-amber-400' },
  ORGANISASI: { label: 'Organisasi', bg: 'bg-purple-500/10 border-purple-500/20', text: 'text-purple-400' },
  LAINNYA: { label: 'Lainnya', bg: 'bg-slate-500/10 border-slate-500/20', text: 'text-slate-400' },
};

const LEVEL_MAP: Record<string, { label: string; badge: string }> = {
  INTERNASIONAL: { label: 'Internasional', badge: 'bg-yellow-500/15 text-yellow-300 border-yellow-500/30' },
  NASIONAL: { label: 'Nasional', badge: 'bg-purple-500/15 text-purple-300 border-purple-500/30' },
  PROVINSI: { label: 'Provinsi', badge: 'bg-blue-500/15 text-blue-300 border-blue-500/30' },
  KABUPATEN_KOTA: { label: 'Kota / Kab', badge: 'bg-teal-500/15 text-teal-300 border-teal-500/30' },
  KECAMATAN: { label: 'Kecamatan', badge: 'bg-slate-700/30 text-slate-300 border-slate-600/30' },
  SEKOLAH: { label: 'Sekolah', badge: 'bg-slate-800/40 text-slate-400 border-slate-700/40' },
};

export default function AchievementsPage() {
  const [currentUserRole, setCurrentUserRole] = useState<string>('');
  const [currentStudentId, setCurrentStudentId] = useState<string | null>(null);

  const [achievements, setAchievements] = useState<AchievementItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    verified: 0,
    unverified: 0,
    featured: 0,
    nationalInternational: 0,
  });

  // Filter states
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [levelFilter, setLevelFilter] = useState('ALL');
  const [activeTab, setActiveTab] = useState<'all' | 'verified' | 'unverified' | 'featured' | 'mine'>('all');

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [achievementToEdit, setAchievementToEdit] = useState<AchievementItem | null>(null);
  const [selectedDetail, setSelectedDetail] = useState<AchievementItem | null>(null);

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState<AchievementItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Load User Meta
  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setCurrentUserRole(data.user.role);
          setCurrentStudentId(data.user.studentId || null);
        }
      })
      .catch(console.error);
  }, []);

  const isStaff = ['SUPER_ADMIN', 'ADMIN', 'KEPALA_SEKOLAH', 'GURU', 'WALI_KELAS'].includes(currentUserRole);

  // Fetch Achievements
  const fetchAchievements = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set('search', search.trim());
      if (categoryFilter !== 'ALL') params.set('category', categoryFilter);
      if (levelFilter !== 'ALL') params.set('level', levelFilter);

      if (activeTab === 'verified') params.set('isVerified', 'true');
      if (activeTab === 'unverified') params.set('isVerified', 'false');
      if (activeTab === 'featured') params.set('isFeatured', 'true');
      if (activeTab === 'mine' && currentStudentId) params.set('studentId', currentStudentId);

      const res = await fetch(`/api/achievements?${params.toString()}`);
      if (!res.ok) throw new Error('Gagal mengambil data prestasi');
      const data = await res.json();
      setAchievements(data.data || []);
      if (data.stats) setStats(data.stats);
    } catch (err: unknown) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [search, categoryFilter, levelFilter, activeTab, currentStudentId]);

  useEffect(() => {
    fetchAchievements();
  }, [fetchAchievements]);

  // Handle Quick Verify Toggle
  const handleToggleVerify = async (item: AchievementItem) => {
    try {
      const res = await fetch(`/api/achievements/${item.id}/verify`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isVerified: !item.isVerified }),
      });
      if (res.ok) {
        fetchAchievements();
        if (selectedDetail && selectedDetail.id === item.id) {
          setSelectedDetail({ ...selectedDetail, isVerified: !item.isVerified });
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Handle Delete
  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/achievements/${deleteTarget.id}`, { method: 'DELETE' });
      if (res.ok) {
        setDeleteTarget(null);
        fetchAchievements();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDeleting(false);
    }
  };

  // Featured items spotlight list
  const featuredList = achievements.filter((a) => a.isFeatured && a.isVerified);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-400 mb-1">
            <Trophy className="w-4 h-4" />
            <span>Portofolio & Rekam Jejak Unggulan</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Prestasi Siswa & Hall of Fame
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Pusat dokumentasi capaian kejuaraan akademik, sains teknologi, seni budaya, dan olahraga siswa SMA Negeri 1 Nusantara di kancah daerah hingga internasional.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              setAchievementToEdit(null);
              setIsFormOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold shadow-lg shadow-amber-500/20 transition"
          >
            <Plus className="w-4 h-4" />
            <span>{isStaff ? 'Catat Prestasi Baru' : 'Ajukan Prestasi Saya'}</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Counters */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Prestasi */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
              Total Prestasi
            </span>
            <div className="text-xl font-bold text-white">{stats.total}</div>
            <span className="text-[10px] text-emerald-400 font-medium">
              {stats.verified} Terverifikasi
            </span>
          </div>
        </div>

        {/* Nasional & Internasional */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <Globe2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
              Tingkat Nas / Inter
            </span>
            <div className="text-xl font-bold text-white">{stats.nationalInternational}</div>
            <span className="text-[10px] text-purple-400 font-medium">Reputasi Nasional</span>
          </div>
        </div>

        {/* Prestasi Unggulan */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Star className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
              Hall of Fame
            </span>
            <div className="text-xl font-bold text-white">{stats.featured}</div>
            <span className="text-[10px] text-indigo-400 font-medium">Prestasi Pilihan</span>
          </div>
        </div>

        {/* Menunggu Verifikasi */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center gap-3.5">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
            stats.unverified > 0
              ? 'bg-rose-500/10 border border-rose-500/30 text-rose-400'
              : 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
          }`}>
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
              Menunggu Verifikasi
            </span>
            <div className="text-xl font-bold text-white">{stats.unverified}</div>
            <span className={`text-[10px] font-medium ${stats.unverified > 0 ? 'text-rose-400' : 'text-slate-500'}`}>
              {stats.unverified > 0 ? 'Perlu tindakan kesiswaan' : 'Semua berkas tuntas'}
            </span>
          </div>
        </div>
      </div>

      {/* Featured Hall of Fame Carousel / Spotlight */}
      {featuredList.length > 0 && activeTab === 'all' && (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-950/30 via-slate-900 to-indigo-950/30 border border-amber-500/30 relative overflow-hidden">
          <div className="flex items-center justify-between mb-3.5">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <h3 className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Hall of Fame & Sorotan Prestasi Terkini</span>
              </h3>
            </div>
            <span className="text-[11px] text-amber-400/80 font-medium">
              {featuredList.length} Capaian Unggulan
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            {featuredList.slice(0, 3).map((item) => (
              <div
                key={item.id}
                onClick={() => setSelectedDetail(item)}
                className="p-3.5 rounded-xl bg-slate-950/70 border border-amber-500/20 hover:border-amber-500/50 hover:bg-slate-950 cursor-pointer transition group"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    {item.rank}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {new Date(item.date).getFullYear()}
                  </span>
                </div>
                <h4 className="text-xs font-bold text-white group-hover:text-amber-300 transition line-clamp-2 mb-1.5">
                  {item.title}
                </h4>
                <div className="flex items-center gap-2 text-[11px] text-slate-400">
                  <User className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="text-slate-300 font-medium">{item.student.name}</span>
                  {item.student.class && (
                    <span className="text-[10px] text-slate-500">({item.student.class.name})</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter Tabs & Search Controls */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3.5">
        {/* Tab Buttons */}
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-3">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition ${
              activeTab === 'all'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            Semua Prestasi ({stats.total})
          </button>
          <button
            onClick={() => setActiveTab('verified')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition ${
              activeTab === 'verified'
                ? 'bg-emerald-600 text-white font-semibold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            Terverifikasi ({stats.verified})
          </button>
          <button
            onClick={() => setActiveTab('unverified')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition flex items-center gap-1.5 ${
              activeTab === 'unverified'
                ? 'bg-rose-600 text-white font-semibold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <span>Menunggu Verifikasi</span>
            {stats.unverified > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-rose-500/30 text-rose-200 text-[10px] font-bold">
                {stats.unverified}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('featured')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition flex items-center gap-1 ${
              activeTab === 'featured'
                ? 'bg-indigo-600 text-white font-semibold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Star className="w-3.5 h-3.5 fill-current" />
            <span>Hall of Fame ({stats.featured})</span>
          </button>
          {currentStudentId && (
            <button
              onClick={() => setActiveTab('mine')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition ${
                activeTab === 'mine'
                  ? 'bg-blue-600 text-white font-semibold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              Prestasi Saya
            </button>
          )}

          <div className="ml-auto hidden sm:flex items-center gap-1 border border-slate-800 rounded-xl p-1 bg-slate-950">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition ${
                viewMode === 'grid' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-300'
              }`}
              title="Tampilan Grid Card"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition ${
                viewMode === 'table' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-300'
              }`}
              title="Tampilan Tabel Rinci"
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Search & Dropdowns */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-6 relative">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama kejuaraan, nama siswa, NIS, atau penyelenggara..."
              className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
            />
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          </div>

          <div className="sm:col-span-3">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
            >
              <option value="ALL">Semua Kategori</option>
              <option value="SAINS_TEKNOLOGI">Sains & Robotik</option>
              <option value="AKADEMIK">Akademik</option>
              <option value="OLAHRAGA">Olahraga</option>
              <option value="SENI">Seni & Budaya</option>
              <option value="KEAGAMAAN">Keagamaan</option>
              <option value="ORGANISASI">Organisasi</option>
              <option value="LAINNYA">Lainnya</option>
            </select>
          </div>

          <div className="sm:col-span-3">
            <select
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
            >
              <option value="ALL">Semua Tingkat</option>
              <option value="INTERNASIONAL">Internasional</option>
              <option value="NASIONAL">Nasional</option>
              <option value="PROVINSI">Provinsi</option>
              <option value="KABUPATEN_KOTA">Kota / Kabupaten</option>
              <option value="KECAMATAN">Kecamatan</option>
              <option value="SEKOLAH">Sekolah</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="p-16 text-center rounded-2xl bg-slate-900 border border-slate-800">
          <Loader2 className="w-8 h-8 animate-spin text-amber-500 mx-auto mb-3" />
          <p className="text-xs text-slate-400">Memuat data prestasi siswa...</p>
        </div>
      ) : achievements.length === 0 ? (
        <div className="p-16 text-center rounded-2xl bg-slate-900 border border-slate-800">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto mb-3">
            <Trophy className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-semibold text-white mb-1">Belum Ada Catatan Prestasi</h4>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4">
            Tidak ditemukan data prestasi yang cocok dengan kata kunci pencarian atau filter yang dipilih.
          </p>
          <button
            onClick={() => {
              setSearch('');
              setCategoryFilter('ALL');
              setLevelFilter('ALL');
              setActiveTab('all');
            }}
            className="px-4 py-2 rounded-xl text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 transition"
          >
            Reset Filter Pencarian
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        /* GRID CARD VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {achievements.map((item) => {
            const cat = CATEGORY_MAP[item.category] || { label: item.category, bg: 'bg-slate-800', text: 'text-slate-300' };
            const lvl = LEVEL_MAP[item.level] || { label: item.level, badge: 'bg-slate-800 text-slate-300' };

            return (
              <div
                key={item.id}
                className={`p-4 rounded-2xl bg-slate-900 border transition flex flex-col justify-between hover:shadow-xl ${
                  item.isFeatured
                    ? 'border-amber-500/40 hover:border-amber-500/70 shadow-amber-500/5'
                    : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                <div>
                  {/* Top Badges */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${cat.bg} ${cat.text}`}>
                        {cat.label}
                      </span>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${lvl.badge}`}>
                        {lvl.label}
                      </span>
                    </div>

                    {item.isVerified ? (
                      <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-medium" title="Terverifikasi Kesiswaan">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Valid</span>
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[10px] text-rose-400 font-medium" title="Menunggu Verifikasi">
                        <Clock className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Menunggu</span>
                      </span>
                    )}
                  </div>

                  {/* Rank & Title */}
                  <div className="mb-3">
                    <span className="inline-block text-xs font-bold text-amber-400 tracking-wide uppercase mb-1">
                      {item.rank}
                    </span>
                    <h3
                      onClick={() => setSelectedDetail(item)}
                      className="text-sm font-bold text-white hover:text-amber-300 transition cursor-pointer leading-snug line-clamp-2"
                    >
                      {item.title}
                    </h3>
                  </div>

                  {/* Organizer & Date */}
                  <div className="space-y-1 mb-3 text-[11px] text-slate-400">
                    <div className="flex items-center gap-1.5 truncate">
                      <Building2 className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                      <span className="truncate">{item.organizer}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                      <span>{new Date(item.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    </div>
                  </div>
                </div>

                {/* Bottom Student Info & Action Buttons */}
                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-300 font-bold text-[10px]">
                      {item.student.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="truncate">
                      <span className="text-xs font-medium text-white block truncate max-w-[130px]">
                        {item.student.name}
                      </span>
                      <span className="text-[10px] text-slate-400 block">
                        {item.student.class?.name || `NIS ${item.student.nis}`}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setSelectedDetail(item)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                      title="Lihat Detail Sertifikat"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    {(isStaff || !item.isVerified) && (
                      <button
                        onClick={() => {
                          setAchievementToEdit(item);
                          setIsFormOpen(true);
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                        title="Edit Prestasi"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {(isStaff || !item.isVerified) && (
                      <button
                        onClick={() => setDeleteTarget(item)}
                        className="p-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition"
                        title="Hapus Prestasi"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TABLE LIST VIEW */
        <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800 text-[11px] uppercase tracking-wider font-semibold">
                <tr>
                  <th className="px-4 py-3">Siswa Peraih</th>
                  <th className="px-4 py-3">Nama Kejuaraan & Lomba</th>
                  <th className="px-4 py-3">Bidang & Tingkat</th>
                  <th className="px-4 py-3">Peringkat</th>
                  <th className="px-4 py-3">Penyelenggara & Tanggal</th>
                  <th className="px-4 py-3">Verifikasi</th>
                  <th className="px-4 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {achievements.map((item) => {
                  const cat = CATEGORY_MAP[item.category] || { label: item.category, bg: 'bg-slate-800', text: 'text-slate-300' };
                  const lvl = LEVEL_MAP[item.level] || { label: item.level, badge: 'bg-slate-800 text-slate-300' };

                  return (
                    <tr key={item.id} className="hover:bg-slate-800/40 transition">
                      {/* Siswa */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="font-semibold text-white">{item.student.name}</div>
                        <div className="text-[10px] text-slate-400">
                          NIS: {item.student.nis} {item.student.class && `• ${item.student.class.name}`}
                        </div>
                      </td>

                      {/* Judul Lomba */}
                      <td className="px-4 py-3">
                        <div
                          onClick={() => setSelectedDetail(item)}
                          className="font-medium text-white hover:text-amber-300 transition cursor-pointer max-w-xs truncate"
                        >
                          {item.title}
                        </div>
                        {item.isFeatured && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-amber-400 mt-0.5">
                            <Star className="w-2.5 h-2.5 fill-current" /> Unggulan
                          </span>
                        )}
                      </td>

                      {/* Kategori & Tingkat */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${cat.bg} ${cat.text}`}>
                            {cat.label}
                          </span>
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${lvl.badge}`}>
                            {lvl.label}
                          </span>
                        </div>
                      </td>

                      {/* Peringkat */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="font-bold text-amber-400">{item.rank}</span>
                      </td>

                      {/* Penyelenggara */}
                      <td className="px-4 py-3 whitespace-nowrap text-[11px] text-slate-400">
                        <div className="truncate max-w-[160px]">{item.organizer}</div>
                        <div className="text-[10px] text-slate-500">
                          {new Date(item.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </div>
                      </td>

                      {/* Status Verifikasi */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        {item.isVerified ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-[10px] font-semibold">
                            <CheckCircle2 className="w-3 h-3" /> Terverifikasi
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/25 text-rose-400 text-[10px] font-semibold">
                            <Clock className="w-3 h-3" /> Menunggu
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setSelectedDetail(item)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                            title="Detail"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          {(isStaff || !item.isVerified) && (
                            <button
                              onClick={() => {
                                setAchievementToEdit(item);
                                setIsFormOpen(true);
                              }}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                              title="Edit"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {(isStaff || !item.isVerified) && (
                            <button
                              onClick={() => setDeleteTarget(item)}
                              className="p-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition"
                              title="Hapus"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Form Modal (Create / Edit) */}
      <AchievementFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSuccess={() => {
          fetchAchievements();
        }}
        achievementToEdit={achievementToEdit}
        currentUserRole={currentUserRole}
        currentStudentId={currentStudentId}
      />

      {/* Detail Modal */}
      <AchievementDetailModal
        isOpen={!!selectedDetail}
        onClose={() => setSelectedDetail(null)}
        achievement={selectedDetail}
        currentUserRole={currentUserRole}
        onEdit={(item) => {
          setAchievementToEdit(item);
          setIsFormOpen(true);
        }}
        onDelete={(item) => {
          setDeleteTarget(item);
        }}
        onToggleVerify={handleToggleVerify}
      />

      {/* Delete Confirmation Dialog */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mb-4">
              <Trash2 className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white mb-1.5">Konfirmasi Penghapusan Prestasi</h3>
            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              Apakah Anda yakin ingin menghapus catatan prestasi <span className="text-white font-semibold">&quot;{deleteTarget.title}&quot;</span> yang diraih oleh <span className="text-white font-semibold">{deleteTarget.student.name}</span>? Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="px-3.5 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={deleting}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white transition disabled:opacity-50"
              >
                {deleting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Menghapus...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Hapus Prestasi</span>
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
