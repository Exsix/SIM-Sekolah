'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  School,
  Save,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Clock,
  BookOpen,
  Award,
  Globe,
  Mail,
  Phone,
  MapPin,
  UserCheck,
  Building2,
  Layers,
  Plus,
  Loader2,
  RefreshCw,
  Sparkles,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';

interface SchoolSettingData {
  id: string;
  name: string;
  npsn: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  principalName: string | null;
  operationalHours: string | null;
  attendanceRules: {
    lateToleranceMinutes?: number;
    defaultStartTime?: string;
    defaultEndTime?: string;
  } | null;
  gradingRules: {
    standardKkm?: number;
    weightAssignment?: number;
    weightQuiz?: number;
    weightMidterm?: number;
    weightFinal?: number;
  } | null;
  libraryRules: {
    maxBorrowDays?: number;
    maxBooksPerStudent?: number;
    finePerDay?: number;
  } | null;
}

interface AcademicYearItem {
  id: string;
  name: string;
  semester: 'GANJIL' | 'GENAP';
  isActive: boolean;
  startDate: string | null;
  endDate: string | null;
  _count: {
    classes: number;
    schedules: number;
    gradeItems: number;
  };
}

export default function SchoolSettingsPage() {
  const [activeTab, setActiveTab] = useState<'profile' | 'academic' | 'rules' | 'library'>('profile');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // School Profile Form State
  const [form, setForm] = useState<SchoolSettingData>({
    id: 'default-school-setting',
    name: 'SMA Negeri 1 Nusantara',
    npsn: '20260001',
    address: 'Jl. Pendidikan Merdeka No. 45, Jakarta Pusat',
    phone: '021-5551234',
    email: 'info@sman1nusantara.sch.id',
    website: 'https://sman1nusantara.sch.id',
    principalName: 'Dr. H. Ahmad Sudirman, M.Pd.',
    operationalHours: 'Senin - Jumat, 07:00 - 16:00 WIB',
    attendanceRules: {
      lateToleranceMinutes: 15,
      defaultStartTime: '07:00',
      defaultEndTime: '15:30',
    },
    gradingRules: {
      standardKkm: 75,
      weightAssignment: 20,
      weightQuiz: 15,
      weightMidterm: 30,
      weightFinal: 35,
    },
    libraryRules: {
      maxBorrowDays: 7,
      maxBooksPerStudent: 3,
      finePerDay: 1000,
    },
  });

  // Academic Years State
  const [academicYears, setAcademicYears] = useState<AcademicYearItem[]>([]);
  const [newYearName, setNewYearName] = useState('2027/2028');
  const [newYearSemester, setNewYearSemester] = useState<'GANJIL' | 'GENAP'>('GANJIL');
  const [newYearStart, setNewYearStart] = useState('');
  const [newYearEnd, setNewYearEnd] = useState('');
  const [isAddingYear, setIsAddingYear] = useState(false);
  const [isActivatingId, setIsActivatingId] = useState<string | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/settings');
      if (!res.ok) throw new Error('Gagal memuat pengaturan sekolah');
      const data = await res.json();
      if (data.setting) {
        setForm({
          ...data.setting,
          attendanceRules: data.setting.attendanceRules || {
            lateToleranceMinutes: 15,
            defaultStartTime: '07:00',
            defaultEndTime: '15:30',
          },
          gradingRules: data.setting.gradingRules || {
            standardKkm: 75,
            weightAssignment: 20,
            weightQuiz: 15,
            weightMidterm: 30,
            weightFinal: 35,
          },
          libraryRules: data.setting.libraryRules || {
            maxBorrowDays: 7,
            maxBooksPerStudent: 3,
            finePerDay: 1000,
          },
        });
      }
      setAcademicYears(data.academicYears || []);
    } catch (err: unknown) {
      console.error(err);
      showToast('Gagal memuat pengaturan', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSaveSettings = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menyimpan pengaturan');

      showToast(data.message || 'Pengaturan berhasil disimpan', 'success');
      loadData();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Terjadi kesalahan sistem', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleAddAcademicYear = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAddingYear(true);
    try {
      const res = await fetch('/api/settings/academic-years', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newYearName,
          semester: newYearSemester,
          startDate: newYearStart || null,
          endDate: newYearEnd || null,
          isActive: false,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menambahkan tahun ajaran');

      showToast(data.message || 'Tahun ajaran berhasil ditambahkan', 'success');
      setNewYearStart('');
      setNewYearEnd('');
      loadData();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Terjadi kesalahan sistem', 'error');
    } finally {
      setIsAddingYear(false);
    }
  };

  const handleActivateAcademicYear = async (id: string) => {
    setIsActivatingId(id);
    try {
      const res = await fetch(`/api/settings/academic-years/${id}/activate`, {
        method: 'PUT',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal mengaktifkan tahun ajaran');

      showToast(data.message || 'Tahun ajaran berhasil diaktifkan', 'success');
      loadData();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Terjadi kesalahan sistem', 'error');
    } finally {
      setIsActivatingId(null);
    }
  };

  const activeYear = academicYears.find((y) => y.isActive);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        <p className="text-xs font-semibold text-slate-500">Memuat konfigurasi sistem sekolah...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-16">
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
              <School className="w-3.5 h-3.5 text-indigo-400" />
              <span>Konfigurasi Induk Lembaga & Kebijakan Akademik</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
              Pengaturan Sekolah & Profil Lembaga
            </h1>
            <p className="text-slate-300 text-xs md:text-sm leading-relaxed">
              Kelola identitas formal sekolah, kop cetak laporan, tahun ajaran aktif, batas toleransi presensi,
              serta ketentuan sirkulasi perpustakaan.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => loadData()}
              className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 border border-slate-700/70 text-xs font-semibold shadow-sm transition hover:scale-[1.02] active:scale-[0.98]"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Muat Ulang</span>
            </button>
            <button
              onClick={() => handleSaveSettings()}
              disabled={saving}
              className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 transition hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              <span>Simpan Pengaturan</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mt-8 flex flex-wrap border-b border-slate-800">
          <button
            onClick={() => setActiveTab('profile')}
            className={`pb-3.5 px-4 text-xs font-bold transition flex items-center space-x-2 border-b-2 -mb-px ${
              activeTab === 'profile'
                ? 'border-indigo-400 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Building2 className="w-4 h-4 text-indigo-400" />
            <span>Identitas & Profil Sekolah</span>
          </button>
          <button
            onClick={() => setActiveTab('academic')}
            className={`pb-3.5 px-4 text-xs font-bold transition flex items-center space-x-2 border-b-2 -mb-px ${
              activeTab === 'academic'
                ? 'border-indigo-400 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Calendar className="w-4 h-4 text-indigo-400" />
            <span>Tahun Ajaran & Semester ({academicYears.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('rules')}
            className={`pb-3.5 px-4 text-xs font-bold transition flex items-center space-x-2 border-b-2 -mb-px ${
              activeTab === 'rules'
                ? 'border-indigo-400 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Award className="w-4 h-4 text-indigo-400" />
            <span>Aturan Presensi & Akademik</span>
          </button>
          <button
            onClick={() => setActiveTab('library')}
            className={`pb-3.5 px-4 text-xs font-bold transition flex items-center space-x-2 border-b-2 -mb-px ${
              activeTab === 'library'
                ? 'border-indigo-400 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-4 h-4 text-indigo-400" />
            <span>Aturan Perpustakaan</span>
          </button>
        </div>
      </div>

      {/* TAB 1: IDENTITAS & PROFIL SEKOLAH */}
      {activeTab === 'profile' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form (2 cols) */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-5">
              <div className="flex items-center space-x-2 pb-3 border-b border-slate-100">
                <Building2 className="w-5 h-5 text-indigo-600" />
                <h2 className="text-sm font-extrabold text-slate-900">Informasi Formal Lembaga</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Nama Resmi Sekolah</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-semibold text-slate-900"
                    placeholder="Contoh: SMA Negeri 1 Nusantara"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-bold mb-1">NPSN (Nomor Pokok Sekolah)</label>
                  <input
                    type="text"
                    value={form.npsn || ''}
                    onChange={(e) => setForm({ ...form, npsn: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono text-slate-900"
                    placeholder="Contoh: 20260001"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-slate-600 font-bold mb-1">Alamat Lengkap Lembaga</label>
                  <textarea
                    rows={2}
                    value={form.address || ''}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900"
                    placeholder="Jl. Pendidikan Merdeka No. 45, Jakarta Pusat, DKI Jakarta"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-bold mb-1">Nomor Telepon Kantor</label>
                  <input
                    type="text"
                    value={form.phone || ''}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900 font-mono"
                    placeholder="Contoh: 021-5551234"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-bold mb-1">Email Resmi</label>
                  <input
                    type="email"
                    value={form.email || ''}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900 font-mono"
                    placeholder="info@sman1nusantara.sch.id"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-bold mb-1">Website Lembaga</label>
                  <input
                    type="url"
                    value={form.website || ''}
                    onChange={(e) => setForm({ ...form, website: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900 font-mono"
                    placeholder="https://sman1nusantara.sch.id"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-bold mb-1">Jam Operasional Pelayanan</label>
                  <input
                    type="text"
                    value={form.operationalHours || ''}
                    onChange={(e) => setForm({ ...form, operationalHours: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900"
                    placeholder="Senin - Jumat, 07:00 - 16:00 WIB"
                  />
                </div>
              </div>
            </div>

            {/* Pimpinan & Penandatangan Rapor */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center space-x-2 pb-3 border-b border-slate-100">
                <UserCheck className="w-5 h-5 text-indigo-600" />
                <h2 className="text-sm font-extrabold text-slate-900">
                  Kepala Sekolah & Penandatangan Dokumen Resmi
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="md:col-span-2">
                  <label className="block text-slate-600 font-bold mb-1">
                    Nama Kepala Sekolah (Lengkap dengan Gelar)
                  </label>
                  <input
                    type="text"
                    value={form.principalName || ''}
                    onChange={(e) => setForm({ ...form, principalName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-semibold text-slate-900"
                    placeholder="Contoh: Dr. H. Ahmad Sudirman, M.Pd."
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Nama ini otomatis dicantumkan pada bagian tanda tangan e-Rapor dan dokumen cetak resmi.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Side Preview Card (1 col) */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                  Pratinjau Kop Surat Resmi
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-bold">
                  Standar A4
                </span>
              </div>

              {/* Mock Letterhead Kop */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-1">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  PEMERINTAH PROVINSI DKI JAKARTA
                </p>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  DINAS PENDIDIKAN DAN KEBUDAYAAN
                </p>
                <h4 className="text-sm font-extrabold text-slate-900 uppercase tracking-tight pt-1">
                  {form.name || 'SMA NEGERI 1 NUSANTARA'}
                </h4>
                <p className="text-[10px] text-slate-600">
                  NPSN: {form.npsn || '20260001'} | Akreditasi: A (Unggul)
                </p>
                <p className="text-[9px] text-slate-500 italic">
                  {form.address || 'Jl. Pendidikan Merdeka No. 45, Jakarta Pusat'}
                </p>
                <p className="text-[9px] text-slate-500 font-mono">
                  Telp: {form.phone || '-'} | Email: {form.email || '-'}
                </p>
                <div className="pt-2 border-b-2 border-slate-800" />
                <div className="border-b border-slate-400 pt-0.5" />
              </div>

              <div className="text-[11px] text-slate-500 space-y-1.5 pt-2">
                <p className="flex items-center">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mr-2" />
                  Kop surat ini digunakan otomatis pada e-Rapor Siswa
                </p>
                <p className="flex items-center">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mr-2" />
                  Tanda tangan Kepala Sekolah terikat ke nama di atas
                </p>
              </div>
            </div>

            {/* Quick Summary Pill */}
            <div className="bg-gradient-to-br from-indigo-900 to-slate-900 p-5 rounded-3xl text-white space-y-3">
              <div className="flex items-center space-x-2 text-indigo-300">
                <Sparkles className="w-4 h-4" />
                <h4 className="text-xs font-bold uppercase tracking-wider">Status Konfigurasi</h4>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Pengaturan yang disimpan segera berlaku untuk seluruh guru, siswa, dan staf administrasi.
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => handleSaveSettings()}
                  disabled={saving}
                  className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition disabled:opacity-50"
                >
                  {saving ? 'Menyimpan Perubahan...' : 'Simpan Seluruh Perubahan'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: TAHUN AJARAN & SEMESTER */}
      {activeTab === 'academic' && (
        <div className="space-y-6">
          {/* Active Banner */}
          {activeYear && (
            <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-indigo-950 p-6 rounded-3xl border border-emerald-800/40 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-2xl border border-emerald-400/30">
                  <Calendar className="w-7 h-7" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[11px] font-bold text-emerald-300 uppercase tracking-widest">
                      Tahun Ajaran Aktif Berjalan
                    </span>
                  </div>
                  <h3 className="text-xl font-black text-white">
                    Tahun Ajaran {activeYear.name} — Semester {activeYear.semester}
                  </h3>
                  <p className="text-xs text-slate-300">
                    Semua jadwal pelajaran, rombel kelas, presensi, dan buku nilai terhubung pada semester ini.
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-4 bg-white/5 px-4 py-3 rounded-2xl border border-white/10 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px]">Rombel Terdaftar</span>
                  <span className="font-extrabold text-white text-sm">{activeYear._count.classes} Kelas</span>
                </div>
                <div className="h-6 w-px bg-white/20" />
                <div>
                  <span className="text-slate-400 block text-[10px]">Jadwal Aktif</span>
                  <span className="font-extrabold text-white text-sm">{activeYear._count.schedules} Sesi</span>
                </div>
              </div>
            </div>
          )}

          {/* Form Add New Academic Year */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center space-x-2 pb-3 border-b border-slate-100">
              <Plus className="w-5 h-5 text-indigo-600" />
              <h2 className="text-sm font-extrabold text-slate-900">Tambah Tahun Ajaran / Semester Baru</h2>
            </div>

            <form onSubmit={handleAddAcademicYear} className="grid grid-cols-1 md:grid-cols-5 gap-3 text-xs items-end">
              <div>
                <label className="block text-slate-600 font-bold mb-1">Tahun Ajaran (YYYY/YYYY)</label>
                <input
                  type="text"
                  value={newYearName}
                  onChange={(e) => setNewYearName(e.target.value)}
                  placeholder="2027/2028"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono font-bold"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">Semester</label>
                <select
                  value={newYearSemester}
                  onChange={(e) => setNewYearSemester(e.target.value as 'GANJIL' | 'GENAP')}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-bold bg-white"
                >
                  <option value="GANJIL">GANJIL (Juli - Desember)</option>
                  <option value="GENAP">GENAP (Januari - Juni)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">Tanggal Mulai</label>
                <input
                  type="date"
                  value={newYearStart}
                  onChange={(e) => setNewYearStart(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">Tanggal Berakhir</label>
                <input
                  type="date"
                  value={newYearEnd}
                  onChange={(e) => setNewYearEnd(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isAddingYear}
                  className="w-full py-2 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition flex items-center justify-center space-x-1.5 disabled:opacity-50"
                >
                  {isAddingYear ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                  <span>Tambah Ajaran</span>
                </button>
              </div>
            </form>
          </div>

          {/* Table of Academic Years */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                Daftar Riwayat Tahun Ajaran
              </h3>
              <span className="text-[11px] text-slate-500">
                Pilih semester dan klik tombol aktifkan untuk berpindah periode akademik
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold">
                    <th className="py-3 px-4">Tahun Ajaran</th>
                    <th className="py-3 px-4">Semester</th>
                    <th className="py-3 px-4">Periode Tanggal</th>
                    <th className="py-3 px-4">Jumlah Kelas</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-center">Tindakan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {academicYears.map((ay) => (
                    <tr key={ay.id} className="hover:bg-slate-50/60 transition">
                      <td className="py-3 px-4 font-bold text-slate-900 font-mono text-sm">
                        {ay.name}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-md font-bold text-[10px] ${
                            ay.semester === 'GANJIL'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {ay.semester}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {ay.startDate
                          ? new Date(ay.startDate).toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })
                          : '-'}{' '}
                        s/d{' '}
                        {ay.endDate
                          ? new Date(ay.endDate).toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })
                          : '-'}
                      </td>
                      <td className="py-3 px-4 font-mono">
                        {ay._count.classes} Kelas / {ay._count.schedules} Jadwal
                      </td>
                      <td className="py-3 px-4">
                        {ay.isActive ? (
                          <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-[10px]">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span>Aktif Berjalan</span>
                          </span>
                        ) : (
                          <span className="text-slate-400 font-medium">Non-Aktif</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {ay.isActive ? (
                          <span className="text-[11px] font-bold text-emerald-600 flex items-center justify-center">
                            <CheckCircle2 className="w-4 h-4 mr-1 text-emerald-500" />
                            Sedang Digunakan
                          </span>
                        ) : (
                          <button
                            onClick={() => handleActivateAcademicYear(ay.id)}
                            disabled={Boolean(isActivatingId)}
                            className="px-3 py-1 rounded-xl bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 border border-slate-200 hover:border-emerald-200 font-bold text-[11px] transition inline-flex items-center space-x-1"
                          >
                            {isActivatingId === ay.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                            )}
                            <span>Jadikan Semester Aktif</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: ATURAN PRESENSI & AKADEMIK */}
      {activeTab === 'rules' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Presensi Rules */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center space-x-2 pb-3 border-b border-slate-100">
              <Clock className="w-5 h-5 text-indigo-600" />
              <h2 className="text-sm font-extrabold text-slate-900">Kebijakan Presensi & Jam Sekolah</h2>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-600 font-bold mb-1">
                  Toleransi Keterlambatan Masuk (Menit)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min={0}
                    max={60}
                    value={form.attendanceRules?.lateToleranceMinutes || 15}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        attendanceRules: {
                          ...form.attendanceRules,
                          lateToleranceMinutes: Number(e.target.value),
                        },
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-bold font-mono"
                  />
                  <span className="absolute right-3 top-2.5 text-slate-400 font-bold">menit</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Siswa yang hadir setelah jam masuk ditambah batas toleransi ini akan tercatat statusnya sebagai
                  TERLAMBAT.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Jam Masuk Standar</label>
                  <input
                    type="time"
                    value={form.attendanceRules?.defaultStartTime || '07:00'}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        attendanceRules: {
                          ...form.attendanceRules,
                          defaultStartTime: e.target.value,
                        },
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-bold mb-1">Jam Pulang Standar</label>
                  <input
                    type="time"
                    value={form.attendanceRules?.defaultEndTime || '15:30'}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        attendanceRules: {
                          ...form.attendanceRules,
                          defaultEndTime: e.target.value,
                        },
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Grading Rules */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center space-x-2 pb-3 border-b border-slate-100">
              <Award className="w-5 h-5 text-indigo-600" />
              <h2 className="text-sm font-extrabold text-slate-900">Standar Penilaian & Kelulusan (KKM)</h2>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-600 font-bold mb-1">
                  Nilai Standar KKM Sekolah (Kriteria Ketuntasan Minimal)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    min={50}
                    max={100}
                    value={form.gradingRules?.standardKkm || 75}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        gradingRules: {
                          ...form.gradingRules,
                          standardKkm: Number(e.target.value),
                        },
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-bold font-mono text-indigo-600 text-sm"
                  />
                  <span className="absolute right-3 top-2.5 text-slate-400 font-bold">/ 100</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Siswa dengan nilai akhir di bawah nilai KKM ini akan mendapat predikat D (Perlu Bimbingan).
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/70 space-y-2">
                <span className="font-bold text-slate-700 block">Bobot Rekomendasi Rapor (%):</span>
                <div className="grid grid-cols-2 gap-2 font-mono text-[11px]">
                  <div className="flex justify-between bg-white p-2 rounded-lg border border-slate-200">
                    <span className="text-slate-500">Tugas / PR:</span>
                    <span className="font-bold text-slate-800">20%</span>
                  </div>
                  <div className="flex justify-between bg-white p-2 rounded-lg border border-slate-200">
                    <span className="text-slate-500">Kuis / Ulangan:</span>
                    <span className="font-bold text-slate-800">15%</span>
                  </div>
                  <div className="flex justify-between bg-white p-2 rounded-lg border border-slate-200">
                    <span className="text-slate-500">UTS (Tengah Sem):</span>
                    <span className="font-bold text-slate-800">30%</span>
                  </div>
                  <div className="flex justify-between bg-white p-2 rounded-lg border border-slate-200">
                    <span className="text-slate-500">UAS (Akhir Sem):</span>
                    <span className="font-bold text-slate-800">35%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: ATURAN PERPUSTAKAAN */}
      {activeTab === 'library' && (
        <div className="max-w-2xl bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-5">
          <div className="flex items-center space-x-2 pb-3 border-b border-slate-100">
            <BookOpen className="w-5 h-5 text-indigo-600" />
            <h2 className="text-sm font-extrabold text-slate-900">
              Ketentuan Peminjaman & Denda Perpustakaan Digital
            </h2>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-600 font-bold mb-1">
                Maksimal Peminjaman Buku per Siswa
              </label>
              <div className="relative">
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={form.libraryRules?.maxBooksPerStudent || 3}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      libraryRules: {
                        ...form.libraryRules,
                        maxBooksPerStudent: Number(e.target.value),
                      },
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-bold font-mono"
                />
                <span className="absolute right-3 top-2.5 text-slate-400 font-bold">buku</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Siswa tidak dapat meminjam buku tambahan jika batas kuota buku aktif ini telah tercapai.
              </p>
            </div>

            <div>
              <label className="block text-slate-600 font-bold mb-1">
                Durasi Standar Masa Pinjam
              </label>
              <div className="relative">
                <input
                  type="number"
                  min={1}
                  max={30}
                  value={form.libraryRules?.maxBorrowDays || 7}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      libraryRules: {
                        ...form.libraryRules,
                        maxBorrowDays: Number(e.target.value),
                      },
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-bold font-mono"
                />
                <span className="absolute right-3 top-2.5 text-slate-400 font-bold">hari kalender</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Batas pengembalian buku dihitung otomatis dari tanggal peminjaman ditambah jumlah hari ini.
              </p>
            </div>

            <div>
              <label className="block text-slate-600 font-bold mb-1">
                Tarif Denda Keterlambatan Pengembalian (per Hari)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-slate-400 font-bold font-mono">Rp</span>
                <input
                  type="number"
                  min={0}
                  step={500}
                  value={form.libraryRules?.finePerDay || 1000}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      libraryRules: {
                        ...form.libraryRules,
                        finePerDay: Number(e.target.value),
                      },
                    })
                  }
                  className="w-full pl-10 pr-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-bold font-mono text-rose-600"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Denda dihitung secara otomatis oleh sistem saat pustakawan memproses transaksi pengembalian buku.
              </p>
            </div>

            <div className="pt-3">
              <button
                type="button"
                onClick={() => handleSaveSettings()}
                disabled={saving}
                className="py-2.5 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition flex items-center space-x-1.5 disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                <span>Simpan Aturan Perpustakaan</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
