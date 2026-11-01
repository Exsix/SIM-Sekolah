'use client';

import React from 'react';
import {
  X,
  Trophy,
  Award,
  Calendar,
  Building2,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Star,
  User,
  GraduationCap,
  Sparkles,
  Pencil,
  Trash2
} from 'lucide-react';
import { AchievementItem } from './AchievementFormModal';

interface AchievementDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  achievement: AchievementItem | null;
  onEdit?: (item: AchievementItem) => void;
  onDelete?: (item: AchievementItem) => void;
  onToggleVerify?: (item: AchievementItem) => void;
  currentUserRole: string;
}

const CATEGORY_LABELS: Record<string, { label: string; color: string }> = {
  SAINS_TEKNOLOGI: { label: 'Sains & Teknologi', color: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' },
  AKADEMIK: { label: 'Akademik', color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' },
  OLAHRAGA: { label: 'Olahraga', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  SENI: { label: 'Seni & Budaya', color: 'bg-pink-500/10 text-pink-400 border-pink-500/20' },
  KEAGAMAAN: { label: 'Keagamaan', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  ORGANISASI: { label: 'Organisasi & Kepemimpinan', color: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
  LAINNYA: { label: 'Lainnya', color: 'bg-slate-500/10 text-slate-400 border-slate-500/20' },
};

const LEVEL_LABELS: Record<string, { label: string; badge: string }> = {
  INTERNASIONAL: { label: 'Tingkat Internasional', badge: 'bg-gradient-to-r from-amber-500/20 to-yellow-500/20 text-yellow-300 border-yellow-500/40' },
  NASIONAL: { label: 'Tingkat Nasional', badge: 'bg-gradient-to-r from-purple-500/20 to-indigo-500/20 text-purple-300 border-purple-500/40' },
  PROVINSI: { label: 'Tingkat Provinsi', badge: 'bg-blue-500/15 text-blue-300 border-blue-500/30' },
  KABUPATEN_KOTA: { label: 'Tingkat Kota / Kab.', badge: 'bg-teal-500/15 text-teal-300 border-teal-500/30' },
  KECAMATAN: { label: 'Tingkat Kecamatan', badge: 'bg-slate-500/15 text-slate-300 border-slate-600/30' },
  SEKOLAH: { label: 'Tingkat Sekolah', badge: 'bg-slate-700/20 text-slate-400 border-slate-700/40' },
};

export default function AchievementDetailModal({
  isOpen,
  onClose,
  achievement,
  onEdit,
  onDelete,
  onToggleVerify,
  currentUserRole,
}: AchievementDetailModalProps) {
  if (!isOpen || !achievement) return null;

  const isStaff = ['SUPER_ADMIN', 'ADMIN', 'KEPALA_SEKOLAH', 'GURU', 'WALI_KELAS'].includes(currentUserRole);

  const formattedDate = new Date(achievement.date).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const cat = CATEGORY_LABELS[achievement.category] || {
    label: achievement.category,
    color: 'bg-slate-800 text-slate-300 border-slate-700',
  };

  const lvl = LEVEL_LABELS[achievement.level] || {
    label: achievement.level,
    badge: 'bg-slate-800 text-slate-300 border-slate-700',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden relative">
        {/* Glow header ambient */}
        <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-amber-500/10 via-transparent to-transparent pointer-events-none" />

        {/* Modal Top Actions */}
        <div className="flex items-center justify-between px-6 pt-5 pb-2 relative z-10">
          <div className="flex items-center gap-2">
            <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${cat.color}`}>
              {cat.label}
            </span>
            <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${lvl.badge}`}>
              {lvl.label}
            </span>
            {achievement.isFeatured && (
              <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" /> Unggulan
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scroll Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6 relative z-10">
          {/* Piagam / Award Header Card */}
          <div className="p-5 rounded-2xl bg-gradient-to-b from-slate-950/90 to-slate-950/50 border border-amber-500/20 text-center relative overflow-hidden shadow-inner">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 mx-auto flex items-center justify-center shadow-lg shadow-amber-500/30 mb-3 text-slate-950">
              <Trophy className="w-8 h-8" />
            </div>

            <div className="inline-block px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 font-bold text-xs tracking-wider uppercase mb-1.5">
              {achievement.rank}
            </div>

            <h3 className="text-lg font-bold text-white tracking-tight leading-snug">
              {achievement.title}
            </h3>

            <p className="text-xs text-slate-400 mt-1 flex items-center justify-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-slate-500" />
              <span>{achievement.organizer}</span>
              <span>•</span>
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <span>{formattedDate}</span>
            </p>
          </div>

          {/* Student Profile Card */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-300 font-bold text-sm">
                {achievement.student.name.substring(0, 2).toUpperCase()}
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Peraih Prestasi</span>
                <h4 className="text-xs font-bold text-white">{achievement.student.name}</h4>
                <p className="text-[11px] text-slate-400">
                  NIS: <span className="text-slate-300 font-mono">{achievement.student.nis}</span>
                  {achievement.student.class && (
                    <span className="ml-2 font-medium text-indigo-400">
                      • {achievement.student.class.name}
                    </span>
                  )}
                </p>
              </div>
            </div>

            {achievement.isVerified ? (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-semibold">
                <CheckCircle2 className="w-4 h-4" />
                <span>Terverifikasi</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/25 text-rose-400 text-xs font-semibold">
                <AlertCircle className="w-4 h-4" />
                <span>Menunggu Verifikasi</span>
              </div>
            )}
          </div>

          {/* Description */}
          {achievement.description && (
            <div>
              <h5 className="text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Ringkasan Catatan Prestasi</span>
              </h5>
              <div className="p-3.5 rounded-xl bg-slate-950/40 border border-slate-800 text-xs text-slate-300 leading-relaxed">
                {achievement.description}
              </div>
            </div>
          )}

          {/* Proof Document Link */}
          <div>
            <h5 className="text-xs font-semibold text-slate-300 mb-1.5">Dokumen Bukti / Piagam Digital</h5>
            {achievement.proofUrl ? (
              <a
                href={achievement.proofUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-indigo-500/50 hover:bg-slate-950 transition group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                    <Award className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-medium text-white group-hover:text-indigo-300 transition">
                      Lihat Piagam / Dokumen Sertifikat Resmi
                    </span>
                    <span className="text-[10px] text-slate-400 block truncate max-w-xs">
                      {achievement.proofUrl}
                    </span>
                  </div>
                </div>
                <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-indigo-400 transition" />
              </a>
            ) : (
              <p className="text-xs text-slate-500 italic p-3 rounded-xl bg-slate-950/30 border border-slate-800/60">
                Tidak ada tautan dokumen digital yang dilampirkan.
              </p>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-900/90 relative z-10">
          <div className="flex items-center gap-2">
            {isStaff && onToggleVerify && (
              <button
                onClick={() => onToggleVerify(achievement)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition flex items-center gap-1.5 ${
                  achievement.isVerified
                    ? 'border-slate-700 bg-slate-800/80 text-slate-300 hover:bg-slate-800'
                    : 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{achievement.isVerified ? 'Batalkan Verifikasi' : 'Verifikasi Prestasi'}</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {onEdit && (isStaff || !achievement.isVerified) && (
              <button
                onClick={() => {
                  onClose();
                  onEdit(achievement);
                }}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
                title="Edit Prestasi"
              >
                <Pencil className="w-4 h-4" />
              </button>
            )}

            {onDelete && (isStaff || !achievement.isVerified) && (
              <button
                onClick={() => {
                  onClose();
                  onDelete(achievement);
                }}
                className="p-2 rounded-xl text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition"
                title="Hapus Prestasi"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
