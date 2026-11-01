'use client';

import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  Loader2,
  Plus,
  Save,
  Search,
  Users,
  X,
  AlertCircle
} from 'lucide-react';

interface BorrowModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  preselectedBookId?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface MemberItem {
  id: string;
  memberNumber: string;
  type: string;
  student?: { id: string; name: string; nis: string; class?: { name: string } };
  teacher?: { id: string; name: string; nip: string | null; position: string | null };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface BookItem {
  id: string;
  title: string;
  author: string;
  availableCopies: number;
  copies: Array<{
    id: string;
    copyCode: string;
    status: string;
  }>;
}

export default function BorrowModal({
  isOpen,
  onClose,
  onSuccess,
  preselectedBookId,
}: BorrowModalProps) {
  const [members, setMembers] = useState<MemberItem[]>([]);
  const [books, setBooks] = useState<BookItem[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  const [memberSearch, setMemberSearch] = useState('');
  const [selectedMemberId, setSelectedMemberId] = useState('');

  const [selectedBookId, setSelectedBookId] = useState(preselectedBookId || '');
  const [selectedCopyId, setSelectedCopyId] = useState('');

  // Due Date (default +7 days)
  const defaultDue = new Date();
  defaultDue.setDate(defaultDue.getDate() + 7);
  const [dueDate, setDueDate] = useState(defaultDue.toISOString().split('T')[0]);

  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    async function loadRefs() {
      setLoadingData(true);
      setErrorMsg(null);
      try {
        const [resM, resB] = await Promise.all([
          fetch('/api/library/members'),
          fetch('/api/library/books?availableOnly=true&limit=100'),
        ]);
        const [jsonM, jsonB] = await Promise.all([resM.json(), resB.json()]);
        if (jsonM.data) setMembers(jsonM.data);
        if (jsonB.data) setBooks(jsonB.data);

        if (preselectedBookId && jsonB.data) {
          setSelectedBookId(preselectedBookId);
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const found = jsonB.data.find((b: any) => b.id === preselectedBookId);
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const availableCopy = found?.copies.find((c: any) => c.status === 'TERSEDIA');
          if (availableCopy) setSelectedCopyId(availableCopy.id);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingData(false);
      }
    }
    loadRefs();
  }, [isOpen, preselectedBookId]);

  // When book changes, select first available copy
  const handleBookChange = (bId: string) => {
    setSelectedBookId(bId);
    const book = books.find((b) => b.id === bId);
    const available = book?.copies.find((c) => c.status === 'TERSEDIA');
    if (available) {
      setSelectedCopyId(available.id);
    } else {
      setSelectedCopyId('');
    }
  };

  const handleSetPresetDays = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    setDueDate(d.toISOString().split('T')[0]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMemberId) {
      setErrorMsg('Pilih peminjam terlebih dahulu');
      return;
    }
    if (!selectedCopyId) {
      setErrorMsg('Pilih eksemplar buku yang tersedia');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/library/borrowings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memberId: selectedMemberId,
          copyIds: [selectedCopyId],
          dueDate,
          notes: notes.trim() || undefined,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Gagal mencatat peminjaman');

      onSuccess();
      onClose();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const filteredMembers = members.filter((m) => {
    const s = memberSearch.toLowerCase();
    const name = m.student?.name || m.teacher?.name || '';
    const num = m.memberNumber || '';
    const idNum = m.student?.nis || m.teacher?.nip || '';
    return name.toLowerCase().includes(s) || num.toLowerCase().includes(s) || idNum.includes(s);
  });

  const currentBook = books.find((b) => b.id === selectedBookId);
  const availableCopies = currentBook?.copies.filter((c) => c.status === 'TERSEDIA') || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xl max-w-lg w-full my-8 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="bg-gradient-to-r from-slate-900 to-indigo-950 p-6 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-white/10 rounded-xl backdrop-blur-md">
              <BookOpen className="w-5 h-5 text-indigo-300" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Catat Peminjaman Buku Baru</h2>
              <p className="text-xs text-indigo-200/80 mt-0.5">
                Sirkulasi peminjaman siswa dan guru perpustakaan sekolah
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

          {loadingData ? (
            <div className="py-12 text-center text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-indigo-600 mb-2" />
              <p className="text-xs">Memuat data anggota dan stok buku...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Cari & Pilih Anggota */}
              <div>
                <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Peminjam (Siswa / Guru) <span className="text-rose-500">*</span>
                </label>
                <div className="space-y-1.5">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Cari nama, NIS, atau nomor anggota..."
                      value={memberSearch}
                      onChange={(e) => setMemberSearch(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>

                  <select
                    value={selectedMemberId}
                    onChange={(e) => setSelectedMemberId(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-medium text-slate-900"
                  >
                    <option value="">-- Pilih Anggota ({filteredMembers.length}) --</option>
                    {filteredMembers.map((m) => {
                      const name = m.student?.name || m.teacher?.name;
                      const detail = m.student
                        ? `Siswa (${m.student.class?.name || '-'} / NIS: ${m.student.nis})`
                        : `Guru (${m.teacher?.position || 'Pengajar'})`;
                      return (
                        <option key={m.id} value={m.id}>
                          {name} — {detail} [{m.memberNumber}]
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>

              {/* Pilih Buku */}
              <div>
                <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Buku yang Dipinjam <span className="text-rose-500">*</span>
                </label>
                <select
                  value={selectedBookId}
                  onChange={(e) => handleBookChange(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-semibold text-slate-900"
                >
                  <option value="">-- Pilih Judul Buku Tersedia ({books.length}) --</option>
                  {books.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.title} — {b.author} ({b.availableCopies} eksemplar tersedia)
                    </option>
                  ))}
                </select>
              </div>

              {/* Pilih Eksemplar Fisik */}
              {currentBook && (
                <div>
                  <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Barcode / Kode Eksemplar Fisik <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={selectedCopyId}
                    onChange={(e) => setSelectedCopyId(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-mono font-bold text-slate-800"
                  >
                    <option value="">-- Pilih Eksemplar --</option>
                    {availableCopies.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.copyCode} (Kondisi: Baik)
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Tanggal Jatuh Tempo */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-semibold text-slate-700 uppercase tracking-wider">
                    Batas Waktu Pengembalian (Jatuh Tempo) <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex space-x-1">
                    <button
                      type="button"
                      onClick={() => handleSetPresetDays(7)}
                      className="text-[10px] px-2 py-0.5 bg-slate-100 hover:bg-slate-200 rounded text-slate-600 font-semibold"
                    >
                      +7 Hari
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSetPresetDays(14)}
                      className="text-[10px] px-2 py-0.5 bg-slate-100 hover:bg-slate-200 rounded text-slate-600 font-semibold"
                    >
                      +14 Hari
                    </button>
                  </div>
                </div>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-mono font-bold text-slate-900"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Denda keterlambatan Rp 1.000 / hari jika melewati batas tanggal jatuh tempo.
                </p>
              </div>

              {/* Catatan */}
              <div>
                <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Catatan Peminjaman
                </label>
                <input
                  type="text"
                  placeholder="Bahan tugas sekolah, olimpiade, dll (opsional)"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-800"
                />
              </div>
            </div>
          )}

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
              disabled={submitting || loadingData || !selectedCopyId}
              className="inline-flex items-center px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs transition disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  Memproses...
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5 mr-1.5" />
                  Konfirmasi Peminjaman
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
