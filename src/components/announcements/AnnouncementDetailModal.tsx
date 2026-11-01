'use client';

import React from 'react';
import {
  Bell,
  Calendar,
  CheckCircle2,
  Download,
  FileText,
  Paperclip,
  Printer,
  Share2,
  Users,
  X,
  School
} from 'lucide-react';

interface AnnouncementDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  announcement: any | null;
}

const TARGET_LABELS: Record<string, { label: string; bg: string; text: string; border: string }> = {
  ALL: { label: 'Semua Civitas Sekolah', bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
  SISWA: { label: 'Khusus Siswa', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  GURU: { label: 'Khusus Guru & GTK', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  ORANG_TUA: { label: 'Orang Tua / Wali', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
};

export default function AnnouncementDetailModal({
  isOpen,
  onClose,
  announcement,
}: AnnouncementDetailModalProps) {
  if (!isOpen || !announcement) return null;

  const target = TARGET_LABELS[announcement.targetRole || 'ALL'] || TARGET_LABELS.ALL;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xl max-w-2xl w-full my-8 overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        {/* Header Bar */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between flex-shrink-0">
          <div className="flex items-center space-x-2">
            <School className="w-4 h-4 text-indigo-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Pemberitahuan Resmi Sekolah
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg transition"
              title="Cetak Pengumuman"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              type="button"
              className="p-1.5 text-slate-400 hover:text-white rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-8 overflow-y-auto flex-1 space-y-6 text-xs text-slate-700">
          {/* Metadata badges */}
          <div className="flex flex-wrap items-center gap-2">
            <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-lg border ${target.bg} ${target.text} ${target.border}`}>
              {target.label}
            </span>
            <span className="text-[11px] text-slate-400 font-mono">
              Terbit: {new Date(announcement.publishDate).toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </span>
            {announcement.expiryDate && (
              <span className="text-[11px] text-slate-400 font-mono">
                • Berlaku s.d: {new Date(announcement.expiryDate).toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </span>
            )}
          </div>

          {/* Headline */}
          <h2 className="text-xl font-bold text-slate-950 leading-snug tracking-tight">
            {announcement.title}
          </h2>

          {/* Author Badge */}
          <div className="flex items-center space-x-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-xs">
              {(announcement.authorName || 'S').charAt(0)}
            </div>
            <div>
              <p className="font-semibold text-slate-900 text-xs">
                {announcement.authorName || 'Manajemen Sekolah'}
              </p>
              <p className="text-[10px] text-slate-400">Penerbit Informasi Resmi</p>
            </div>
          </div>

          {/* Formatted Content */}
          <div className="prose prose-sm max-w-none text-slate-800 leading-relaxed text-xs space-y-3 whitespace-pre-line border-t border-slate-100 pt-4">
            {announcement.content}
          </div>

          {/* Attachment Box */}
          {announcement.attachmentUrl && (
            <div className="p-4 bg-indigo-50/70 border border-indigo-200 rounded-2xl flex items-center justify-between">
              <div className="flex items-center space-x-3 truncate">
                <div className="p-2.5 bg-white rounded-xl border border-indigo-100 text-indigo-600 shadow-2xs">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="truncate">
                  <p className="font-semibold text-xs text-indigo-950 truncate">Dokumen Lampiran Resmi</p>
                  <p className="text-[10px] text-indigo-600 font-mono truncate">{announcement.attachmentUrl}</p>
                </div>
              </div>
              <a
                href={announcement.attachmentUrl}
                target="_blank"
                rel="noreferrer"
                download
                className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs transition flex-shrink-0"
              >
                <Download className="w-3.5 h-3.5 mr-1.5" />
                Unduh Lampiran
              </a>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-800 text-xs font-semibold rounded-xl transition"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
