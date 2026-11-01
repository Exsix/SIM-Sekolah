'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Bell,
  Search,
  Plus,
  Filter,
  Paperclip,
  Calendar,
  Users,
  Eye,
  Pencil,
  Trash2,
  ChevronRight,
  Loader2,
  Sparkles,
  Share2,
  AlertCircle,
  FileText,
  Megaphone,
  CheckCircle2
} from 'lucide-react';
import AnnouncementModal from '@/components/announcements/AnnouncementModal';
import AnnouncementDetailModal from '@/components/announcements/AnnouncementDetailModal';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface AnnouncementItem {
  id: string;
  title: string;
  content: string;
  targetRole: string | null;
  publishDate: string;
  expiryDate: string | null;
  authorName: string | null;
  attachmentUrl: string | null;
  isPublished: boolean;
  createdAt: string;
}

const TARGET_BADGES: Record<string, { label: string; bg: string; text: string; border: string }> = {
  ALL: { label: 'Semua Civitas', bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
  SISWA: { label: 'Khusus Siswa', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  GURU: { label: 'Khusus Guru & GTK', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  ORANG_TUA: { label: 'Orang Tua / Wali', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
};

export default function AnnouncementsPage() {
  const [currentUserRole, setCurrentUserRole] = useState<string>('');
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [targetFilter, setTargetFilter] = useState('');
  const [publishFilter, setPublishFilter] = useState('');

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<AnnouncementItem | null>(null);

  const [detailTarget, setDetailTarget] = useState<AnnouncementItem | null>(null);

  // Delete State
  const [deleteTarget, setDeleteTarget] = useState<AnnouncementItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // 1. Load User Session
  useEffect(() => {
    async function loadUser() {
      try {
        const res = await fetch('/api/auth/me');
        const json = await res.json();
        if (json.user) {
          setCurrentUserRole(json.user.role);
        }
      } catch (err) {
        console.error(err);
      }
    }
    loadUser();
  }, []);

  // 2. Fetch Announcements
  const fetchAnnouncements = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (targetFilter) params.append('targetRole', targetFilter);
      if (publishFilter) params.append('isPublished', publishFilter);

      const res = await fetch(`/api/announcements?${params.toString()}`);
      const json = await res.json();
      if (json.data) {
        setAnnouncements(json.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [search, targetFilter, publishFilter]);

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  // Handle Delete
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/announcements/${deleteTarget.id}`, { method: 'DELETE' });
      if (res.ok) {
        setDeleteTarget(null);
        fetchAnnouncements();
      } else {
        const json = await res.json();
        alert(json.error || 'Gagal menghapus pengumuman');
      }
    } catch {
      alert('Terjadi kesalahan sistem');
    } finally {
      setIsDeleting(false);
    }
  };

  const isStaff = currentUserRole === 'SUPER_ADMIN' || currentUserRole === 'ADMIN' || currentUserRole === 'GURU';
  const isAdmin = currentUserRole === 'SUPER_ADMIN' || currentUserRole === 'ADMIN';

  // Highlighted first announcement
  const heroAnnouncement = announcements.length > 0 ? announcements[0] : null;
  const remainingAnnouncements = announcements.length > 1 ? announcements.slice(1) : [];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs text-slate-500 mb-1">
            <Link href="/dashboard" className="hover:text-indigo-600">Dashboard</Link>
            <ChevronRight className="w-3 h-3 text-slate-400" />
            <span className="text-slate-800 font-medium">Pengumuman Sekolah</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center">
            <Megaphone className="w-6 h-6 mr-2 text-indigo-600" />
            Papan Informasi & Pengumuman Resmi
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Pusat surat edaran kedinasan, agenda kegiatan kesiswaan, dan pengumuman akademik
          </p>
        </div>

        {isStaff && (
          <button
            type="button"
            onClick={() => {
              setEditTarget(null);
              setIsModalOpen(true);
            }}
            className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs transition"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Buat Pengumuman Baru
          </button>
        )}
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Cari kata kunci pengumuman atau pengirim..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 focus:bg-white transition"
            />
          </div>

          {/* Target Audience Pills */}
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => setTargetFilter('')}
              className={`text-xs px-3 py-1 rounded-lg border transition ${
                targetFilter === ''
                  ? 'bg-indigo-600 text-white border-indigo-600 font-semibold shadow-2xs'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'
              }`}
            >
              Semua Target
            </button>
            <button
              type="button"
              onClick={() => setTargetFilter('ALL')}
              className={`text-xs px-2.5 py-1 rounded-lg border transition ${
                targetFilter === 'ALL'
                  ? 'bg-indigo-600 text-white border-indigo-600 font-semibold shadow-2xs'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'
              }`}
            >
              Semua Civitas
            </button>
            <button
              type="button"
              onClick={() => setTargetFilter('SISWA')}
              className={`text-xs px-2.5 py-1 rounded-lg border transition ${
                targetFilter === 'SISWA'
                  ? 'bg-indigo-600 text-white border-indigo-600 font-semibold shadow-2xs'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'
              }`}
            >
              Khusus Siswa
            </button>
            <button
              type="button"
              onClick={() => setTargetFilter('GURU')}
              className={`text-xs px-2.5 py-1 rounded-lg border transition ${
                targetFilter === 'GURU'
                  ? 'bg-indigo-600 text-white border-indigo-600 font-semibold shadow-2xs'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'
              }`}
            >
              Khusus Guru
            </button>
          </div>
        </div>
      </div>

      {/* Content Feed */}
      {loading ? (
        <div className="py-24 text-center text-slate-400 bg-white rounded-3xl border border-slate-200">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-600 mb-2" />
          <p className="text-xs">Memuat warta dan pengumuman sekolah...</p>
        </div>
      ) : announcements.length === 0 ? (
        <div className="bg-white p-16 rounded-3xl border border-slate-200 text-center">
          <Bell className="w-12 h-12 mx-auto text-slate-300 mb-2" />
          <p className="text-sm font-semibold text-slate-700">Tidak ada pengumuman ditemukan</p>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Belum ada warta pengumuman aktif untuk kategori ini.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* HERO SPOTLIGHT CARD (Featured Most Recent Announcement) */}
          {heroAnnouncement && !search && !targetFilter && (
            <div className="relative bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl overflow-hidden border border-slate-800">
              <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

              <div className="relative space-y-4 max-w-3xl">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-500 text-white tracking-wider uppercase">
                    <Sparkles className="w-3 h-3 mr-1" /> Warta Terbaru
                  </span>
                  <span className="text-xs font-mono text-indigo-200/80">
                    {new Date(heroAnnouncement.publishDate).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </span>
                  <span className="text-xs text-indigo-300">• {heroAnnouncement.authorName || 'Humas SMAN 1'}</span>
                </div>

                <h2 className="text-xl sm:text-2xl font-bold leading-tight tracking-tight text-white hover:text-indigo-200 transition cursor-pointer"
                    onClick={() => setDetailTarget(heroAnnouncement)}
                >
                  {heroAnnouncement.title}
                </h2>

                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed line-clamp-3">
                  {heroAnnouncement.content}
                </p>

                <div className="pt-2 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setDetailTarget(heroAnnouncement)}
                    className="inline-flex items-center px-4 py-2 bg-white text-slate-900 hover:bg-indigo-50 rounded-xl text-xs font-bold transition shadow-xs"
                  >
                    <Eye className="w-4 h-4 mr-1.5 text-indigo-600" />
                    Baca Selengkapnya
                  </button>

                  {heroAnnouncement.attachmentUrl && (
                    <a
                      href={heroAnnouncement.attachmentUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold backdrop-blur-xs transition"
                    >
                      <Paperclip className="w-4 h-4 mr-1.5 text-indigo-300" />
                      Unduh Lampiran
                    </a>
                  )}

                  {isStaff && (
                    <div className="ml-auto flex items-center space-x-1">
                      <button
                        type="button"
                        onClick={() => {
                          setEditTarget(heroAnnouncement);
                          setIsModalOpen(true);
                        }}
                        className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition"
                        title="Edit Pengumuman"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(heroAnnouncement)}
                        className="p-2 text-white/70 hover:text-rose-400 hover:bg-white/10 rounded-xl transition"
                        title="Hapus Pengumuman"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* GRID OF OTHER ANNOUNCEMENTS */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(heroAnnouncement && !search && !targetFilter ? remainingAnnouncements : announcements).map((item) => {
              const target = TARGET_BADGES[item.targetRole || 'ALL'] || TARGET_BADGES.ALL;

              return (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:border-indigo-300 hover:shadow-xs transition p-5 flex flex-col justify-between space-y-4 group"
                >
                  <div className="space-y-3">
                    {/* Top Meta */}
                    <div className="flex items-center justify-between text-xs">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border ${target.bg} ${target.text} ${target.border}`}>
                        {target.label}
                      </span>
                      <span className="text-[11px] font-mono text-slate-400">
                        {new Date(item.publishDate).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                        })}
                      </span>
                    </div>

                    {/* Title */}
                    <h3
                      onClick={() => setDetailTarget(item)}
                      className="font-bold text-sm text-slate-900 group-hover:text-indigo-600 transition leading-snug cursor-pointer line-clamp-2"
                    >
                      {item.title}
                    </h3>

                    {/* Excerpt */}
                    <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed">
                      {item.content}
                    </p>
                  </div>

                  {/* Bottom Footer */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-[11px] text-slate-400 truncate max-w-[140px]">
                      {item.authorName || 'Humas Sekolah'}
                    </span>

                    <div className="flex items-center space-x-1">
                      {item.attachmentUrl && (
                        <span className="p-1.5 text-indigo-600 bg-indigo-50 rounded-lg" title="Memiliki Lampiran Dokumen">
                          <Paperclip className="w-3.5 h-3.5" />
                        </span>
                      )}

                      <button
                        type="button"
                        onClick={() => setDetailTarget(item)}
                        className="px-2.5 py-1 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                      >
                        Buka
                      </button>

                      {isStaff && (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              setEditTarget(item);
                              setIsModalOpen(true);
                            }}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                            title="Edit"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(item)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            title="Hapus"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal Buat / Edit Pengumuman */}
      <AnnouncementModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchAnnouncements}
        initialData={editTarget}
      />

      {/* Modal Baca Detail Pengumuman */}
      <AnnouncementDetailModal
        isOpen={Boolean(detailTarget)}
        onClose={() => setDetailTarget(null)}
        announcement={detailTarget}
      />

      {/* Modal Konfirmasi Hapus */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center space-x-3 text-rose-600">
              <div className="p-2.5 bg-rose-50 rounded-xl">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                Hapus Pengumuman Ini?
              </h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Anda yakin ingin menghapus warta pengumuman <span className="font-semibold text-slate-900">{deleteTarget.title}</span>? Tindakan ini tidak dapat dibatalkan.
            </p>

            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 border border-slate-200 text-slate-700 text-xs font-medium rounded-xl hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDelete}
                className="inline-flex items-center px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xl shadow-xs"
              >
                {isDeleting ? 'Menghapus...' : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
