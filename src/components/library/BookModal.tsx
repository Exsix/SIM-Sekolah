'use client';

import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Layers,
  Loader2,
  MapPin,
  Plus,
  Save,
  X,
  AlertCircle
} from 'lucide-react';

interface BookModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: {
    id?: string;
    isbn?: string | null;
    title?: string;
    author?: string;
    publisher?: string | null;
    publishYear?: number | null;
    categoryId?: string;
    rackLocation?: string | null;
    totalCopies?: number;
    condition?: string | null;
    description?: string | null;
  } | null;
}

export default function BookModal({
  isOpen,
  onClose,
  onSuccess,
  initialData,
}: BookModalProps) {
  const isEdit = Boolean(initialData?.id);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [categories, setCategories] = useState<any[]>([]);
  const [loadingCats, setLoadingCats] = useState(true);

  const [title, setTitle] = useState(initialData?.title || '');
  const [author, setAuthor] = useState(initialData?.author || '');
  const [isbn, setIsbn] = useState(initialData?.isbn || '');
  const [publisher, setPublisher] = useState(initialData?.publisher || '');
  const [publishYear, setPublishYear] = useState(
    initialData?.publishYear ? String(initialData.publishYear) : '2023'
  );
  const [categoryId, setCategoryId] = useState(initialData?.categoryId || '');
  const [rackLocation, setRackLocation] = useState(initialData?.rackLocation || 'Rak A-01');
  const [totalCopies, setTotalCopies] = useState(
    initialData?.totalCopies ? String(initialData.totalCopies) : '3'
  );
  const [condition, setCondition] = useState(initialData?.condition || 'Baik');
  const [description, setDescription] = useState(initialData?.description || '');

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setTitle(initialData?.title || '');
      setAuthor(initialData?.author || '');
      setIsbn(initialData?.isbn || '');
      setPublisher(initialData?.publisher || '');
      setPublishYear(initialData?.publishYear ? String(initialData.publishYear) : '2023');
      setCategoryId(initialData?.categoryId || '');
      setRackLocation(initialData?.rackLocation || 'Rak A-01');
      setTotalCopies(initialData?.totalCopies ? String(initialData.totalCopies) : '3');
      setCondition(initialData?.condition || 'Baik');
      setDescription(initialData?.description || '');
      setErrorMsg(null);
    }
  }, [isOpen, initialData]);

  useEffect(() => {
    if (!isOpen) return;

    async function loadCats() {
      setLoadingCats(true);
      try {
        const res = await fetch('/api/library/categories');
        const json = await res.json();
        if (json.data) {
          setCategories(json.data);
          if (!categoryId && json.data.length > 0 && !initialData?.categoryId) {
            setCategoryId(json.data[0].id);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingCats(false);
      }
    }
    loadCats();
  }, [isOpen, categoryId, initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg(null);

    try {
      const url = isEdit ? `/api/library/books/${initialData?.id}` : '/api/library/books';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          author: author.trim(),
          isbn: isbn.trim() || null,
          publisher: publisher.trim() || null,
          publishYear: publishYear ? parseInt(publishYear) : null,
          categoryId,
          rackLocation: rackLocation.trim() || null,
          totalCopies: parseInt(totalCopies) || 1,
          condition,
          description: description.trim() || null,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Gagal menyimpan data buku');

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
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xl max-w-xl w-full my-8 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="bg-gradient-to-r from-slate-900 to-indigo-950 p-6 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-white/10 rounded-xl backdrop-blur-md">
              <BookOpen className="w-5 h-5 text-indigo-300" />
            </div>
            <div>
              <h2 className="text-lg font-bold">
                {isEdit ? 'Edit Data Buku' : 'Tambah Buku Baru ke Katalog'}
              </h2>
              <p className="text-xs text-indigo-200/80 mt-0.5">
                Pencatatan judul, nomor panggil DDC, dan lokasi rak
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
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="space-y-4">
            {/* Judul Buku */}
            <div>
              <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Judul Buku <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Contoh: Struktur Data dan Algoritma Modern"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 font-semibold text-slate-900"
              />
            </div>

            {/* Penulis & ISBN */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Penulis / Pengarang <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Andrea Hirata"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 font-medium text-slate-800"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Nomor ISBN
                </label>
                <input
                  type="text"
                  placeholder="978-602-03-0123-1"
                  value={isbn}
                  onChange={(e) => setIsbn(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 font-mono text-slate-800"
                />
              </div>
            </div>

            {/* Kategori DDC & Rak */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Klasifikasi Kategori DDC <span className="text-rose-500">*</span>
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 font-medium text-slate-800"
                >
                  <option value="">-- Pilih Kategori --</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      [{c.code}] {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Lokasi Rak Buku
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 absolute left-3 top-2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Contoh: Rak B-02, Rak Sastra"
                    value={rackLocation}
                    onChange={(e) => setRackLocation(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 font-medium text-slate-800"
                  />
                </div>
              </div>
            </div>

            {/* Penerbit & Tahun & Eksemplar */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Penerbit
                </label>
                <input
                  type="text"
                  placeholder="Balai Pustaka"
                  value={publisher}
                  onChange={(e) => setPublisher(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-slate-800"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Tahun Terbit
                </label>
                <input
                  type="number"
                  placeholder="2022"
                  value={publishYear}
                  onChange={(e) => setPublishYear(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 font-mono text-slate-800"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Eksemplar {!isEdit && <span className="text-rose-500">*</span>}
                </label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={totalCopies}
                  onChange={(e) => setTotalCopies(e.target.value)}
                  disabled={isEdit}
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 font-mono font-bold text-slate-800 disabled:opacity-50"
                />
              </div>
            </div>

            {/* Deskripsi */}
            <div>
              <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Sinopsis / Deskripsi Buku
              </label>
              <textarea
                rows={3}
                placeholder="Ringkasan isi buku atau catatan kurikulum..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-slate-800"
              />
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
              disabled={submitting || loadingCats}
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
                  {isEdit ? 'Simpan Perubahan' : 'Tambah ke Katalog'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
