'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Lock, User, School, AlertCircle, ArrowRight, ShieldCheck, ChevronLeft, Award } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleQuickFill = (user: string, pass: string) => {
    setIdentifier(user);
    setPassword(pass);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Gagal masuk. Periksa kembali akun Anda.');
      }

      // Berhasil login -> redirect ke dashboard
      router.push('/dashboard');
      router.refresh();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Terjadi kesalahan yang tidak terduga.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] bg-scholastic-pattern flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Top Back Link */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md mb-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0C2340] hover:text-amber-800 transition"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Kembali ke Beranda Utama SMAN 1 Nusantara</span>
        </Link>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Ornate School Crest Header */}
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#0C2340] to-[#153A66] p-1 border-2 border-amber-500/60 shadow-lg flex items-center justify-center text-amber-300 mb-3">
            <div className="w-full h-full border border-amber-400/40 rounded-xl flex flex-col items-center justify-center">
              <School className="w-8 h-8 text-amber-300" />
            </div>
          </div>
          <span className="text-[11px] font-serif font-bold uppercase tracking-widest text-amber-800">
            Sistem Informasi Manajemen Terpadu
          </span>
          <h2 className="text-2xl font-serif font-bold text-[#0C2340] tracking-tight mt-0.5">
            SMA Negeri 1 Nusantara
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-sm">
            Portal otentikasi resmi pendidik, tenaga kependidikan, peserta didik, dan wali murid.
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-md border border-slate-200/90 rounded-3xl sm:px-10">
          <form className="space-y-4" onSubmit={handleSubmit}>
            {error && (
              <div className="flex items-center gap-3 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 animate-in fade-in duration-200">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-serif font-bold text-[#0C2340] mb-1.5 uppercase tracking-wide">
                Identitas Pengguna (NIS / NIP / Username)
              </label>
              <div className="relative rounded-xl">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="h-4 w-4" />
                </div>
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="Contoh: superadmin, guru.budi, siswa.andi"
                  className="block w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0C2340] focus:bg-white transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-serif font-bold text-[#0C2340] mb-1.5 uppercase tracking-wide">
                Kata Sandi Akun
              </label>
              <div className="relative rounded-xl">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0C2340] focus:bg-white transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 flex justify-center items-center gap-2 py-3 px-4 rounded-xl text-xs font-bold text-amber-300 bg-[#0C2340] hover:bg-[#153A66] hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0C2340] shadow-md border border-amber-500/40 disabled:opacity-60 transition cursor-pointer"
            >
              {loading ? (
                <span>Memverifikasi Akun...</span>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                  <span>Masuk ke Dashboard Sistem</span>
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Pre-Fill Selector */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <span className="text-[10px] font-serif font-bold text-slate-500 uppercase tracking-widest block mb-2">
              Akun Uji Coba Cepat (Klik untuk Isi Otomatis):
            </span>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickFill('superadmin', 'admin123')}
                className="p-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-amber-50 hover:border-amber-300 text-left transition"
              >
                <div className="text-[11px] font-bold text-[#0C2340]">Super Admin</div>
                <div className="text-[9px] text-slate-500 font-mono">superadmin</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill('guru.budi', 'admin123')}
                className="p-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-amber-50 hover:border-amber-300 text-left transition"
              >
                <div className="text-[11px] font-bold text-[#0C2340]">Guru / Wali</div>
                <div className="text-[9px] text-slate-500 font-mono">guru.budi</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill('siswa.andi', 'admin123')}
                className="p-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-amber-50 hover:border-amber-300 text-left transition"
              >
                <div className="text-[11px] font-bold text-[#0C2340]">Siswa / Ortu</div>
                <div className="text-[9px] text-slate-500 font-mono">siswa.andi</div>
              </button>
            </div>
          </div>
        </div>

        {/* Security & Copyright footer */}
        <div className="text-center mt-6 text-[11px] text-slate-500 space-y-1">
          <p className="flex items-center justify-center gap-1">
            <Lock className="w-3 h-3 text-slate-400" />
            <span>Sesi aman terenkripsi 256-bit • Dilengkapi audit trail otomatis</span>
          </p>
          <p>© {new Date().getFullYear()} SMAN 1 Nusantara • Dikembangkan untuk Mutu Pendidikan Nasional</p>
        </div>
      </div>
    </div>
  );
}
