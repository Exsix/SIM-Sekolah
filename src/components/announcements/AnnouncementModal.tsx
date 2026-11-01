'use client';

import React, { useState, useEffect } from 'react';
import {
  Bell,
  Calendar,
  FileText,
  Loader2,
  Paperclip,
  Plus,
  Save,
  UploadCloud,
  Users,
  X,
  AlertCircle,
  CheckCircle2,
  Trash2
} from 'lucide-react';

interface AnnouncementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: {
    id?: string;
    title?: string;
    content?: string;
    targetRole?: string | null;
    publishDate?: string;
    expiryDate?: string | null;
    authorName?: string | null;
    attachmentUrl?: string | null;
    isPublished?: boolean;
  } | null;
}

const TARGET_OPTIONS = [
  { value: 'ALL', label: 'Semua Civitas Sekolah', desc: 'Guru, Siswa, Staf, & Orang Tua' },
  { value: 'SISWA', label: 'Khusus Peserta Didik (Siswa)', desc: 'Hanya terlihat di portal siswa' },
  { value: 'GURU', label: 'Khusus Dewan Guru & GTK', desc: 'Hanya terlihat oleh guru & staf' },
  { value: 'ORANG_TUA', label: 'Khusus Orang Tua / Wali', desc: 'Surat edaran untuk wali murid' },
];

export default function AnnouncementModal({
  isOpen,
  onClose,
  onSuccess,
  initialData,
}: AnnouncementModalProps) {
  const isEdit = Boolean(initialData?.id);

  const [title, setTitle] = useState(initialData?.title || '');
  const [content, setContent] = useState(initialData?.content || '');
  const [targetRole, setTargetRole] = useState(initialData?.targetRole || 'ALL');
  const [authorName, setAuthorName] = useState(initialData?.authorName || '');
  const [publishDate, setPublishDate] = useState(
    initialData?.publishDate
      ? new Date(initialData.publishDate).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0]
  );
  const [expiryDate, setExpiryDate] = useState(
    initialData?.expiryDate
      ? new Date(initialData.expiryDate).toISOString().split('T')[0]
      : ''
  );
  const [attachmentUrl, setAttachmentUrl] = useState<string | null>(
    initialData?.attachmentUrl || null
  );
  const [isPublished, setIsPublished] = useState(initialData?.isPublished ?? true);

  const [uploadingFile, setUploadingFile] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setTitle(initialData?.title || '');
      setContent(initialData?.content || '');
      setTargetRole(initialData?.targetRole || 'ALL');
      setAuthorName(initialData?.authorName || '');
      setPublishDate(
        initialData?.publishDate
          ? new Date(initialData.publishDate).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0]
      );
      setExpiryDate(
        initialData?.expiryDate
          ? new Date(initialData.expiryDate).toISOString().split('T')[0]
          : ''
      );
      setAttachmentUrl(initialData?.attachmentUrl || null);
      setIsPublished(initialData?.isPublished ?? true);
      setErrorMsg(null);
    }
  }, [isOpen, initialData]);

  // Handle file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingFile(true);
    setErrorMsg(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/announcements/upload', {
        method: 'POST',
        body: formData,
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Gagal mengunggah file');

      setAttachmentUrl(json.url);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Gagal mengunggah lampiran');
    } finally {
      setUploadingFile(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg(null);

    try {
      const url = isEdit ? `/api/announcements/${initialData?.id}` : '/api/announcements';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          content: content.trim(),
          targetRole,
          authorName: authorName.trim() || undefined,
          publishDate,
          expiryDate: expiryDate || null,
          attachmentUrl,
          isPublished,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Gagal menyimpan pengumuman');

      onSuccess();
      onClose();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Terjadi kesalahan sistem');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xl max-w-2xl w-full my-8 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="bg-gradient-to-r from-slate-900 to-indigo-950 p-6 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-white/10 rounded-xl backdrop-blur-md">
              <Bell className="w-5 h-5 text-indigo-300" />
            </div>
            <div>
              <h2 className="text-lg font-bold">
                {isEdit ? 'Perbarui Pengumuman Sekolah' : 'Buat Pengumuman / Surat Edaran Baru'}
              </h2>
              <p className="text-xs text-indigo-200/80 mt-0.5">
                Publikasi informasi resmi untuk dewan guru, peserta didik, atau orang tua
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="p-2 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {errorMsg && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="space-y-4">
            {/* Judul Pengumuman */}
            <div>
              <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Judul Pengumuman / Perihal <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Contoh: Surat Edaran Jadwal Penilaian Akhir Semester (PAS) Ganjil"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 font-semibold text-slate-900"
              />
            </div>

            {/* Target Pembaca & Pengirim */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Target Pembaca <span className="text-rose-500">*</span>
                </label>
                <select
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 font-medium text-slate-800"
                >
                  {TARGET_OPTIONS.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Nama Pengirim / Penanggung Jawab
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Kepala Sekolah / Bagian Kurikulum"
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 font-medium text-slate-800"
                />
              </div>
            </div>

            {/* Konten Lengkap */}
            <div>
              <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Isi Pengumuman / Berita <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={6}
                placeholder="Tuliskan isi pengumuman, instruksi pelaksanaan, rincian jadwal, atau tata tertib secara lengkap..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-slate-800 leading-relaxed font-sans"
              />
            </div>

            {/* Tanggal Terbit & Kedaluwarsa */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Tanggal Terbit <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  value={publishDate}
                  onChange={(e) => setPublishDate(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-mono text-slate-800"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Tanggal Kedaluwarsa (Opsional)
                </label>
                <input
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-mono text-slate-800"
                />
              </div>
            </div>

            {/* Upload Lampiran File */}
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
              <label className="block font-semibold text-slate-700 uppercase tracking-wider">
                Dokumen Lampiran (PDF / Gambar / Word)
              </label>
              <p className="text-[10px] text-slate-400">
                Unggah dokumen pendukung seperti Surat Edaran resmi, jadwal kegiatan, atau brosur (maksimal 5MB)
              </p>

              {attachmentUrl ? (
                <div className="flex items-center justify-between p-2.5 bg-white border border-indigo-200 rounded-xl">
                  <div className="flex items-center space-x-2 truncate">
                    <Paperclip className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                    <span className="font-mono text-xs text-indigo-700 truncate">{attachmentUrl}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAttachmentUrl(null)}
                    className="p-1 text-slate-400 hover:text-rose-600 rounded transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-3">
                  <label className="inline-flex items-center px-4 py-2 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl cursor-pointer text-slate-700 font-medium transition shadow-2xs">
                    {uploadingFile ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin text-indigo-600" />
                        Mengunggah...
                      </>
                    ) : (
                      <>
                        <UploadCloud className="w-3.5 h-3.5 mr-1.5 text-indigo-600" />
                        Pilih Dokumen
                      </>
                    )}
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      onChange={handleFileUpload}
                      disabled={uploadingFile}
                      className="hidden"
                    />
                  </label>
                  <span className="text-[11px] text-slate-400">PDF, Word, atau Gambar</span>
                </div>
              )}
            </div>

            {/* Status Publikasi */}
            <div className="pt-1">
              <label className="flex items-center space-x-2 font-medium text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPublished}
                  onChange={(e) => setIsPublished(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                />
                <span>Publikasikan pengumuman sekarang (Langsung tampil di portal dan dashboard)</span>
              </label>
            </div>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 border border-slate-200 text-slate-700 text-xs font-medium rounded-xl hover:bg-slate-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs transition disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5 mr-1.5" />
                  {isEdit ? 'Simpan Perubahan' : 'Terbitkan Pengumuman'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
