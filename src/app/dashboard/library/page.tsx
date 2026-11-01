'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Library,
  BookOpen,
  Search,
  Plus,
  Download,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RotateCcw,
  MapPin,
  Barcode,
  Users,
  Calendar,
  Pencil,
  Trash2,
  ChevronRight,
  Loader2,
  BookMarked,
  Sparkles,
  ArrowUpRight
} from 'lucide-react';
import BookModal from '@/components/library/BookModal';
import BorrowModal from '@/components/library/BorrowModal';

interface BookItem {
  id: string;
  isbn: string | null;
  title: string;
  author: string;
  publisher: string | null;
  publishYear: number | null;
  rackLocation: string | null;
  totalCopies: number;
  availableCopies: number;
  condition: string | null;
  description: string | null;
  category: {
    id: string;
    code: string;
    name: string;
  };
  copies: Array<{
    id: string;
    copyCode: string;
    status: string;
  }>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface BorrowingItem {
  id: string;
  borrowingNumber: string;
  borrowDate: string;
  dueDate: string;
  returnDate: string | null;
  status: string;
  fineAmount: number;
  notes: string | null;
  member: {
    memberNumber: string;
    type: string;
    student?: { name: string; nis: string; class?: { name: string } };
    teacher?: { name: string; nip: string | null; position: string | null };
  };
  items: Array<{
    id: string;
    bookCopy: {
      copyCode: string;
      book: {
        id: string;
        title: string;
        author: string;
        rackLocation: string | null;
      };
    };
  }>;
}

interface CategoryItem {
  id: string;
  code: string;
  name: string;
  _count: { books: number };
}

export default function DigitalLibraryPage() {
  const [currentUserRole, setCurrentUserRole] = useState<string>('');

  // Tabs: 'catalog' | 'circulation' | 'myLoans'
  const [activeTab, setActiveTab] = useState<'catalog' | 'circulation' | 'myLoans'>('catalog');

  // Catalog State
  const [books, setBooks] = useState<BookItem[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loadingBooks, setLoadingBooks] = useState(true);

  // Filters for Catalog
  const [search, setSearch] = useState('');
  const [selectedCatId, setSelectedCatId] = useState('');
  const [availableOnly, setAvailableOnly] = useState(false);

  // Circulation State
  const [borrowings, setBorrowings] = useState<BorrowingItem[]>([]);
  const [loadingCirculation, setLoadingCirculation] = useState(false);
  const [circulationStatus, setCirculationStatus] = useState<string>('DIPINJAM');

  // My Loans State
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [myLoans, setMyLoans] = useState<any>(null);
  const [loadingMyLoans, setLoadingMyLoans] = useState(false);

  // Modals
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [editBookTarget, setEditBookTarget] = useState<BookItem | null>(null);

  const [isBorrowModalOpen, setIsBorrowModalOpen] = useState(false);
  const [preselectedBookId, setPreselectedBookId] = useState<string | undefined>(undefined);

  // Return Book Confirmation Modal
  const [returnTarget, setReturnTarget] = useState<BorrowingItem | null>(null);
  const [returning, setReturning] = useState(false);

  // Export State
  const [exporting, setExporting] = useState(false);

  // 1. Load User session and categories
  useEffect(() => {
    async function loadMeta() {
      try {
        const [resAuth, resCats] = await Promise.all([
          fetch('/api/auth/me'),
          fetch('/api/library/categories'),
        ]);
        const [jsonAuth, jsonCats] = await Promise.all([resAuth.json(), resCats.json()]);

        if (jsonAuth.user) {
          setCurrentUserRole(jsonAuth.user.role);
          if (jsonAuth.user.role === 'SISWA') {
            setActiveTab('catalog');
          }
        }
        if (jsonCats.data) setCategories(jsonCats.data);
      } catch (err) {
        console.error(err);
      }
    }
    loadMeta();
  }, []);

  // 2. Fetch Books Catalog
  const fetchBooks = useCallback(async () => {
    setLoadingBooks(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (selectedCatId) params.append('categoryId', selectedCatId);
      if (availableOnly) params.append('availableOnly', 'true');

      const res = await fetch(`/api/library/books?${params.toString()}`);
      const json = await res.json();
      if (json.data) setBooks(json.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingBooks(false);
    }
  }, [search, selectedCatId, availableOnly]);

  // 3. Fetch Circulation
  const fetchCirculation = useCallback(async () => {
    setLoadingCirculation(true);
    try {
      const params = new URLSearchParams();
      if (circulationStatus) params.append('status', circulationStatus);
      const res = await fetch(`/api/library/borrowings?${params.toString()}`);
      const json = await res.json();
      if (json.data) setBorrowings(json.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingCirculation(false);
    }
  }, [circulationStatus]);

  // 4. Fetch My Loans
  const fetchMyLoans = useCallback(async () => {
    setLoadingMyLoans(true);
    try {
      const res = await fetch('/api/library/my-borrowings');
      const json = await res.json();
      if (json.data) setMyLoans(json.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMyLoans(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'catalog') {
      fetchBooks();
    } else if (activeTab === 'circulation') {
      fetchCirculation();
    } else if (activeTab === 'myLoans') {
      fetchMyLoans();
    }
  }, [activeTab, fetchBooks, fetchCirculation, fetchMyLoans]);

  // Handle Export Excel
  const handleExport = async (type: 'books' | 'borrowings') => {
    setExporting(true);
    try {
      const res = await fetch(`/api/library/export?type=${type}`);
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `perpustakaan-${type}-${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch {
      alert('Gagal mengekspor data');
    } finally {
      setExporting(false);
    }
  };

  // Handle Return Book
  const handleReturnBook = async () => {
    if (!returnTarget) return;
    setReturning(true);
    try {
      const res = await fetch(`/api/library/borrowings/${returnTarget.id}/return`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Gagal mengembalikan buku');

      setReturnTarget(null);
      fetchCirculation();
      fetchBooks();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setReturning(false);
    }
  };

  const isStaff = currentUserRole !== 'SISWA';

  // Overall calculations for KPI
  const totalBooksCount = books.length;
  const totalCopiesCount = books.reduce((sum, b) => sum + b.totalCopies, 0);
  const totalAvailableCopies = books.reduce((sum, b) => sum + b.availableCopies, 0);
  const totalBorrowedCopies = totalCopiesCount - totalAvailableCopies;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs text-slate-500 mb-1">
            <Link href="/dashboard" className="hover:text-indigo-600">Dashboard</Link>
            <ChevronRight className="w-3 h-3 text-slate-400" />
            <span className="text-slate-800 font-medium">Perpustakaan Digital</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center">
            <Library className="w-6 h-6 mr-2 text-indigo-600" />
            Perpustakaan Digital & Sirkulasi Buku
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Katalog literatur sekolah, klasifikasi Dewey Decimal (DDC), dan sirkulasi peminjaman
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Export Excel */}
          <button
            onClick={() => handleExport(activeTab === 'circulation' ? 'borrowings' : 'books')}
            disabled={exporting}
            type="button"
            className="inline-flex items-center px-3.5 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium rounded-xl shadow-2xs transition"
          >
            {exporting ? (
              <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin text-slate-400" />
            ) : (
              <Download className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
            )}
            Ekspor Excel
          </button>

          {/* Borrow New (Staff only) */}
          {isStaff && (
            <button
              onClick={() => {
                setPreselectedBookId(undefined);
                setIsBorrowModalOpen(true);
              }}
              type="button"
              className="inline-flex items-center px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-xs transition"
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
              Catat Peminjaman
            </button>
          )}

          {/* Add Book (Staff only) */}
          {isStaff && (
            <button
              onClick={() => {
                setEditBookTarget(null);
                setIsBookModalOpen(true);
              }}
              type="button"
              className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs transition"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Tambah Judul Buku
            </button>
          )}
        </div>
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <span className="text-xs font-semibold text-slate-500 uppercase">Koleksi Judul</span>
          <p className="text-2xl font-bold font-mono text-slate-900 mt-1">
            {totalBooksCount} <span className="text-sm font-normal text-slate-400">Judul</span>
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">Klasifikasi DDC 000-900</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <span className="text-xs font-semibold text-slate-500 uppercase">Total Fisik Eksemplar</span>
          <p className="text-2xl font-bold font-mono text-indigo-600 mt-1">
            {totalCopiesCount} <span className="text-sm font-normal text-slate-400">Buku</span>
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">Inventaris Perpustakaan</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <span className="text-xs font-semibold text-slate-500 uppercase">Buku Siap Dipinjam</span>
          <p className="text-2xl font-bold font-mono text-emerald-600 mt-1">
            {totalAvailableCopies} <span className="text-sm font-normal text-slate-400">Tersedia</span>
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">Tersedia di Rak</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <span className="text-xs font-semibold text-slate-500 uppercase">Sedang Dipinjam</span>
          <p className="text-2xl font-bold font-mono text-amber-600 mt-1">
            {totalBorrowedCopies} <span className="text-sm font-normal text-slate-400">Buku</span>
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">Beredar di Siswa/Guru</p>
        </div>
      </div>

      {/* Tabs Header */}
      <div className="border-b border-slate-200">
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveTab('catalog')}
            className={`pb-3 px-4 text-xs font-medium border-b-2 transition flex items-center space-x-1.5 ${
              activeTab === 'catalog'
                ? 'border-indigo-600 text-indigo-600 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Katalog Koleksi Buku</span>
            <span className="ml-1 px-1.5 py-0.5 text-[10px] bg-slate-100 rounded-full font-bold">
              {books.length}
            </span>
          </button>

          {isStaff && (
            <button
              onClick={() => setActiveTab('circulation')}
              className={`pb-3 px-4 text-xs font-medium border-b-2 transition flex items-center space-x-1.5 ${
                activeTab === 'circulation'
                  ? 'border-indigo-600 text-indigo-600 font-semibold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <RotateCcw className="w-4 h-4" />
              <span>Sirkulasi & Pengembalian</span>
            </button>
          )}

          <button
            onClick={() => setActiveTab('myLoans')}
            className={`pb-3 px-4 text-xs font-medium border-b-2 transition flex items-center space-x-1.5 ${
              activeTab === 'myLoans'
                ? 'border-indigo-600 text-indigo-600 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <BookMarked className="w-4 h-4" />
            <span>Rak Peminjaman Saya</span>
          </button>
        </div>
      </div>

      {/* TAB 1: KATALOG BUKU */}
      {activeTab === 'catalog' && (
        <div className="space-y-4">
          {/* Search & Category Pills */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="md:col-span-2 relative">
                <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari judul buku, nama penulis, ISBN, atau penerbit..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 focus:bg-white transition"
                />
              </div>

              <div className="flex items-center space-x-2">
                <label className="flex items-center space-x-2 text-xs font-medium text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={availableOnly}
                    onChange={(e) => setAvailableOnly(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                  />
                  <span>Hanya buku yang tersedia (ready)</span>
                </label>
              </div>
            </div>

            {/* Category Filter Pills */}
            <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedCatId('')}
                className={`text-xs px-3 py-1 rounded-lg border transition ${
                  selectedCatId === ''
                    ? 'bg-indigo-600 text-white border-indigo-600 font-semibold shadow-2xs'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'
                }`}
              >
                Semua Kategori ({books.length})
              </button>
              {categories.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelectedCatId(c.id)}
                  className={`text-xs px-2.5 py-1 rounded-lg border transition ${
                    selectedCatId === c.id
                      ? 'bg-indigo-600 text-white border-indigo-600 font-semibold shadow-2xs'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'
                  }`}
                >
                  [{c.code}] {c.name}
                </button>
              ))}
            </div>
          </div>

          {/* Book Cards Grid */}
          {loadingBooks ? (
            <div className="py-24 text-center text-slate-400 bg-white rounded-3xl border border-slate-200">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-600 mb-2" />
              <p className="text-xs">Memuat katalog buku perpustakaan...</p>
            </div>
          ) : books.length === 0 ? (
            <div className="bg-white p-16 rounded-3xl border border-slate-200 text-center">
              <BookOpen className="w-12 h-12 mx-auto text-slate-300 mb-2" />
              <p className="text-sm font-semibold text-slate-700">Tidak ada buku ditemukan</p>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Coba ubah kata kunci pencarian atau bersihkan filter kategori.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {books.map((b) => {
                const isAvailable = b.availableCopies > 0;

                return (
                  <div
                    key={b.id}
                    className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:border-indigo-300 hover:shadow-xs transition p-5 flex flex-col justify-between space-y-4 group"
                  >
                    <div className="space-y-3">
                      {/* Stylized Book Spine Header */}
                      <div className="h-28 rounded-xl bg-gradient-to-br from-indigo-900 to-slate-900 p-3.5 text-white flex flex-col justify-between relative overflow-hidden shadow-inner">
                        <div className="absolute right-0 bottom-0 translate-x-3 translate-y-3 opacity-10">
                          <BookOpen className="w-24 h-24" />
                        </div>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/20 backdrop-blur-xs font-bold w-fit">
                          {b.category.code} • {b.rackLocation || 'Rak Umum'}
                        </span>
                        <div>
                          <p className="text-[11px] text-indigo-200 font-medium truncate">{b.author}</p>
                          <h4 className="font-bold text-xs text-white line-clamp-2 leading-snug">
                            {b.title}
                          </h4>
                        </div>
                      </div>

                      {/* Book Details */}
                      <div className="space-y-1.5 text-xs text-slate-600">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-400">Penerbit:</span>
                          <span className="font-medium text-slate-800 truncate max-w-[150px]">
                            {b.publisher || '-'} ({b.publishYear || '-'})
                          </span>
                        </div>
                        {b.isbn && (
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-slate-400">ISBN:</span>
                            <span className="font-mono text-slate-600">{b.isbn}</span>
                          </div>
                        )}
                        {b.description && (
                          <p className="text-[11px] text-slate-500 line-clamp-2 pt-1 border-t border-slate-100">
                            {b.description}
                          </p>
                        )}
                      </div>

                      {/* Availability Pill */}
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                        <span
                          className={`inline-flex items-center text-[11px] font-bold px-2.5 py-0.5 rounded-lg border ${
                            isAvailable
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border-rose-200'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${isAvailable ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                          {isAvailable ? `${b.availableCopies} dari ${b.totalCopies} Tersedia` : 'Semua Dipinjam'}
                        </span>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                      {isStaff && isAvailable ? (
                        <button
                          type="button"
                          onClick={() => {
                            setPreselectedBookId(b.id);
                            setIsBorrowModalOpen(true);
                          }}
                          className="inline-flex items-center px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-2xs transition"
                        >
                          Pinjamkan
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-400 font-medium">
                          {isAvailable ? 'Bisa Dipinjam di Perpus' : 'Menunggu Dikembalikan'}
                        </span>
                      )}

                      {isStaff && (
                        <div className="flex items-center space-x-1">
                          <button
                            type="button"
                            onClick={() => {
                              setEditBookTarget(b);
                              setIsBookModalOpen(true);
                            }}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                            title="Edit Data Buku"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: SIRKULASI & PENGEMBALIAN (STAFF ONLY) */}
      {activeTab === 'circulation' && isStaff && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Status:</span>
              <div className="inline-flex p-0.5 bg-slate-100 rounded-xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => setCirculationStatus('DIPINJAM')}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                    circulationStatus === 'DIPINJAM'
                      ? 'bg-white text-indigo-700 font-semibold shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Sedang Dipinjam
                </button>
                <button
                  type="button"
                  onClick={() => setCirculationStatus('DIKEMBALIKAN')}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                    circulationStatus === 'DIKEMBALIKAN'
                      ? 'bg-white text-indigo-700 font-semibold shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Sudah Dikembalikan
                </button>
                <button
                  type="button"
                  onClick={() => setCirculationStatus('')}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                    circulationStatus === ''
                      ? 'bg-white text-indigo-700 font-semibold shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Semua Riwayat
                </button>
              </div>
            </div>

            <button
              onClick={() => {
                setPreselectedBookId(undefined);
                setIsBorrowModalOpen(true);
              }}
              type="button"
              className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs transition"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Catat Peminjaman Baru
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100/80 border-b border-slate-200 text-slate-600 uppercase tracking-wider text-[11px] font-semibold">
                  <tr>
                    <th className="py-3 px-4">No. Pinjam</th>
                    <th className="py-3 px-4">Peminjam</th>
                    <th className="py-3 px-4">Judul Buku</th>
                    <th className="py-3 px-4">Tgl Pinjam</th>
                    <th className="py-3 px-4">Jatuh Tempo</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {loadingCirculation ? (
                    <tr>
                      <td colSpan={7} className="py-16 text-center text-slate-400">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto text-indigo-600 mb-2" />
                        Memuat data sirkulasi perpustakaan...
                      </td>
                    </tr>
                  ) : borrowings.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-16 text-center text-slate-400">
                        <RotateCcw className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                        <p className="font-semibold text-slate-700">Tidak ada peminjaman dalam kategori ini</p>
                      </td>
                    </tr>
                  ) : (
                    borrowings.map((b) => {
                      const memberName = b.member.student?.name || b.member.teacher?.name || b.member.memberNumber;
                      const memberSub = b.member.student
                        ? `Kelas ${b.member.student.class?.name || '-'}`
                        : `Guru ${b.member.teacher?.position || ''}`;

                      const isLate = new Date().getTime() > new Date(b.dueDate).getTime() && b.status === 'DIPINJAM';

                      return (
                        <tr key={b.id} className="hover:bg-slate-50/60 transition">
                          <td className="py-3 px-4 font-mono font-bold text-slate-800">
                            {b.borrowingNumber}
                          </td>
                          <td className="py-3 px-4">
                            <p className="font-semibold text-slate-900">{memberName}</p>
                            <span className="text-[10px] text-slate-400">{memberSub} [{b.member.memberNumber}]</span>
                          </td>
                          <td className="py-3 px-4">
                            {b.items.map((item) => (
                              <div key={item.id}>
                                <p className="font-semibold text-slate-900">{item.bookCopy.book.title}</p>
                                <span className="font-mono text-[10px] text-slate-400">Kode: {item.bookCopy.copyCode}</span>
                              </div>
                            ))}
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-600">
                            {new Date(b.borrowDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </td>
                          <td className="py-3 px-4 font-mono">
                            <span className={isLate ? 'text-rose-600 font-bold' : 'text-slate-700'}>
                              {new Date(b.dueDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </span>
                            {isLate && (
                              <span className="block text-[10px] text-rose-500 font-semibold">
                                Lewat Jatuh Tempo
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center">
                            {b.status === 'DIPINJAM' ? (
                              <span className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-lg border ${
                                isLate ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                              }`}>
                                {isLate ? 'Terlambat' : 'Dipinjam'}
                              </span>
                            ) : (
                              <span className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-lg border bg-emerald-50 text-emerald-700 border-emerald-200">
                                Selesai
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right">
                            {b.status === 'DIPINJAM' && (
                              <button
                                type="button"
                                onClick={() => setReturnTarget(b)}
                                className="inline-flex items-center px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-2xs transition"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                                Kembalikan
                              </button>
                            )}
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

      {/* TAB 3: PEMINJAMAN SAYA */}
      {activeTab === 'myLoans' && (
        <div className="space-y-4">
          {loadingMyLoans ? (
            <div className="py-24 text-center text-slate-400 bg-white rounded-3xl border border-slate-200">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-600 mb-2" />
              <p className="text-xs">Memuat daftar buku yang Anda pinjam...</p>
            </div>
          ) : !myLoans ? (
            <div className="py-16 text-center text-slate-500 bg-white rounded-3xl border border-slate-200 text-xs">
              Belum ada riwayat peminjaman buku
            </div>
          ) : (
            <div className="space-y-6">
              {/* My Member Card */}
              <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-3xl border border-slate-800 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-indigo-300 font-bold block">
                    Kartu Anggota Perpustakaan Sekolah
                  </span>
                  <h3 className="text-lg font-bold mt-1">
                    {myLoans.member.student?.name || myLoans.member.teacher?.name || 'Anggota Perpustakaan'}
                  </h3>
                  <p className="text-xs font-mono text-slate-300 mt-0.5">
                    No. Anggota: <span className="font-bold text-white">{myLoans.member.memberNumber}</span>
                  </p>
                </div>

                <div className="flex items-center space-x-6 text-center text-xs">
                  <div>
                    <span className="text-slate-400 text-[10px] block uppercase font-bold">Sedang Dipinjam</span>
                    <span className="text-2xl font-bold font-mono text-amber-300">
                      {myLoans.stats.activeCount} Buku
                    </span>
                  </div>
                  <div className="h-8 w-px bg-white/20"></div>
                  <div>
                    <span className="text-slate-400 text-[10px] block uppercase font-bold">Total Pernah Dipinjam</span>
                    <span className="text-2xl font-bold font-mono text-indigo-300">
                      {myLoans.stats.totalBorrowed} Kali
                    </span>
                  </div>
                </div>
              </div>

              {/* Active Borrowed Books */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
                <div className="p-4 bg-slate-50 border-b border-slate-200/80 flex items-center justify-between">
                  <h3 className="font-bold text-sm text-slate-900 flex items-center">
                    <BookMarked className="w-4 h-4 mr-2 text-indigo-600" />
                    Buku yang Sedang Anda Pinjam ({myLoans.activeLoans.length})
                  </h3>
                </div>

                {myLoans.activeLoans.length === 0 ? (
                  <div className="p-10 text-center text-slate-400 text-xs">
                    Anda tidak sedang meminjam buku apa pun saat ini.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    {myLoans.activeLoans.map((b: any) => {
                      const isLate = new Date().getTime() > new Date(b.dueDate).getTime();

                      return (
                        <div key={b.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 transition">
                          <div className="space-y-1">
                            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                            {b.items.map((i: any) => (
                              <div key={i.id}>
                                <h4 className="font-bold text-sm text-slate-900">{i.bookCopy.book.title}</h4>
                                <p className="text-xs text-slate-500">
                                  {i.bookCopy.book.author} • Kode: <span className="font-mono font-semibold">{i.bookCopy.copyCode}</span>
                                </p>
                              </div>
                            ))}
                            <p className="text-[11px] text-slate-400 font-mono">
                              Dipinjam: {new Date(b.borrowDate).toLocaleDateString('id-ID')}
                            </p>
                          </div>

                          <div className="text-right">
                            <span className="text-[10px] text-slate-400 block">Jatuh Tempo:</span>
                            <span className={`text-xs font-mono font-bold ${isLate ? 'text-rose-600' : 'text-slate-800'}`}>
                              {new Date(b.dueDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                            </span>
                            {isLate && (
                              <span className="block text-[10px] text-rose-500 font-bold">
                                Terlambat (Segera kembalikan)
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Book Create / Edit Modal */}
      <BookModal
        isOpen={isBookModalOpen}
        onClose={() => setIsBookModalOpen(false)}
        onSuccess={fetchBooks}
        initialData={editBookTarget}
      />

      {/* Borrow Modal */}
      <BorrowModal
        isOpen={isBorrowModalOpen}
        onClose={() => setIsBorrowModalOpen(false)}
        onSuccess={() => {
          fetchBooks();
          if (activeTab === 'circulation') fetchCirculation();
        }}
        preselectedBookId={preselectedBookId}
      />

      {/* Return Book Confirmation Modal */}
      {returnTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center space-x-3 text-emerald-600">
              <div className="p-2.5 bg-emerald-50 rounded-xl">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                Konfirmasi Pengembalian Buku
              </h3>
            </div>

            <div className="text-xs text-slate-600 space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-200">
              <p><strong>No. Pinjam:</strong> {returnTarget.borrowingNumber}</p>
              <p><strong>Peminjam:</strong> {returnTarget.member.student?.name || returnTarget.member.teacher?.name}</p>
              <p><strong>Buku:</strong> {returnTarget.items.map((i) => i.bookCopy.book.title).join(', ')}</p>
            </div>

            <p className="text-xs text-slate-500">
              Buku akan dikembalikan statusnya menjadi <strong>TERSEDIA</strong> dan stok rak perpustakaan akan bertambah otomatis.
            </p>

            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                disabled={returning}
                onClick={() => setReturnTarget(null)}
                className="px-4 py-2 border border-slate-200 text-slate-700 text-xs font-medium rounded-xl hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={returning}
                onClick={handleReturnBook}
                className="inline-flex items-center px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-xs"
              >
                {returning ? 'Memproses...' : 'Ya, Terima Pengembalian'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
