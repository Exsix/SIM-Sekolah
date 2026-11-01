'use client';

import React from 'react';
import { Printer, X, School, CheckCircle2 } from 'lucide-react';

interface PrintReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any | null;
}

export default function PrintReportModal({ isOpen, onClose, data }: PrintReportModalProps) {
  if (!isOpen || !data) return null;

  const handlePrint = () => {
    window.print();
  };

  const school = data.school;
  const students = data.students;
  const teachers = data.teachers;
  const att = data.attendance;
  const grades = data.grades;
  const lib = data.library;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto print:p-0 print:bg-white print:static">
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xl max-w-4xl w-full my-8 overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[92vh] print:max-h-none print:shadow-none print:border-none print:rounded-none print:my-0">
        {/* Modal Top Bar (Hidden on print) */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between flex-shrink-0 print:hidden">
          <div className="flex items-center space-x-2 text-xs font-bold">
            <Printer className="w-4 h-4 text-indigo-400" />
            <span>Pratinjau Cetak Laporan Resmi (Standar Dokumen A4)</span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shadow-md shadow-indigo-600/30"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak / Cetak PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div className="p-8 sm:p-12 overflow-y-auto flex-1 font-sans text-slate-900 space-y-6 print:p-6 print:overflow-visible text-xs">
          {/* KOP SURAT RESMI */}
          <div className="text-center pb-4 border-b-2 border-slate-900 space-y-1">
            <p className="text-[10px] font-bold tracking-widest uppercase text-slate-600">
              PEMERINTAH PROVINSI DKI JAKARTA • DINAS PENDIDIKAN
            </p>
            <h1 className="text-xl font-black uppercase tracking-tight text-slate-950">
              {school.name}
            </h1>
            <p className="text-[11px] font-medium text-slate-700">
              NPSN: {school.npsn} | Akreditasi: A (Amat Baik / Unggul) | Status: Sekolah Menengah Atas Negeri
            </p>
            <p className="text-[10px] text-slate-500 italic">
              {school.address}
            </p>
            <div className="pt-2 border-b-2 border-slate-900" />
            <div className="border-b border-slate-500 pt-0.5" />
          </div>

          {/* JUDUL DOKUMEN */}
          <div className="text-center space-y-1 pt-2">
            <h2 className="text-sm font-extrabold tracking-wide uppercase underline">
              LAPORAN KINERJA & IKHTISAR REKAPITULASI SEKOLAH
            </h2>
            <p className="text-[11px] text-slate-500 font-mono">
              Tahun Ajaran 2026/2027 — Semester Ganjil | Tanggal Dokumen: {new Date().toLocaleDateString('id-ID', { dateStyle: 'full' })}
            </p>
          </div>

          {/* BAGIAN 1: DEMOGRAFI & KEPEGAWAIAN */}
          <div className="space-y-2">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800 border-b border-slate-200 pb-1">
              I. Demografi Peserta Didik & Tenaga Kependidikan
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                <span className="font-bold text-slate-700 block">Peserta Didik (Siswa):</span>
                <div className="grid grid-cols-2 gap-1 font-mono text-[11px]">
                  <div>Total Siswa Aktif: <strong>{students.total} orang</strong></div>
                  <div>Siswa Laki-laki: <strong>{students.male} orang</strong></div>
                  <div>Siswa Perempuan: <strong>{students.female} orang</strong></div>
                  <div>Rombel Terdaftar: <strong>{students.classBreakdown.length} Kelas</strong></div>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                <span className="font-bold text-slate-700 block">Pendidik & Tenaga Kependidikan:</span>
                <div className="grid grid-cols-2 gap-1 font-mono text-[11px]">
                  <div>Total Pendidik: <strong>{teachers.total} orang</strong></div>
                  <div>Status PNS: <strong>{teachers.pns} orang</strong></div>
                  <div>Status PPPK: <strong>{teachers.pppk} orang</strong></div>
                  <div>Status Honorer: <strong>{teachers.honorer} orang</strong></div>
                </div>
              </div>
            </div>
          </div>

          {/* BAGIAN 2: PRESENSI & KEDISIPLINAN */}
          <div className="space-y-2">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800 border-b border-slate-200 pb-1">
              II. Rekapitulasi Presensi & Kedisiplinan Lembaga
            </h3>
            <div className="grid grid-cols-2 gap-4 font-mono text-[11px]">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="font-bold text-slate-700 block font-sans mb-1">Presensi Siswa:</span>
                <p>Tingkat Kehadiran: <strong className="text-emerald-700">{att.studentRate}%</strong></p>
                <p>Total Sesi Tercatat: {att.studentStats.total}</p>
                <p>Hadir / Dispensasi: {att.studentStats.present} | Sakit: {att.studentStats.sick} | Izin: {att.studentStats.perm} | Alpa: {att.studentStats.alpha}</p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="font-bold text-slate-700 block font-sans mb-1">Presensi Guru & GTK:</span>
                <p>Tingkat Kehadiran: <strong className="text-emerald-700">{att.teacherRate}%</strong></p>
                <p>Kedisiplinan Jam Masuk: 100% Tercatat Otomatis</p>
                <p>Batas Toleransi Sekolah: 15 Menit</p>
              </div>
            </div>
          </div>

          {/* BAGIAN 3: NILAI & CAPAIAN KURIKULUM */}
          <div className="space-y-2">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800 border-b border-slate-200 pb-1">
              III. Capaian Akademik & Standar Kelulusan KKM
            </h3>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div className="grid grid-cols-3 gap-2 font-mono text-[11px]">
                <div>Rata-rata Nilai Sekolah: <strong>{grades.averageScore} / 100</strong></div>
                <div>Tingkat Ketuntasan KKM: <strong>{grades.passRate}%</strong></div>
                <div>Total Asesmen Masuk: <strong>{grades.totalAssessments} nilai</strong></div>
              </div>
              <div className="pt-1 flex items-center space-x-4 text-[10px] font-mono border-t border-slate-200">
                <span>Distribusi Predikat:</span>
                <span className="font-bold">A (88-100): {grades.distribution.A}</span>
                <span className="font-bold">B (75-87): {grades.distribution.B}</span>
                <span className="font-bold">C (60-74): {grades.distribution.C}</span>
                <span className="font-bold">D (&lt;60): {grades.distribution.D}</span>
              </div>
            </div>
          </div>

          {/* BAGIAN 4: PERPUSTAKAAN */}
          <div className="space-y-2">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800 border-b border-slate-200 pb-1">
              IV. Koleksi & Sirkulasi Perpustakaan Digital
            </h3>
            <div className="grid grid-cols-4 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 font-mono text-[11px] text-center">
              <div>
                <span className="text-slate-500 block text-[10px]">Judul Koleksi</span>
                <strong>{lib.totalTitles} Judul</strong>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">Total Eksemplar</span>
                <strong>{lib.totalPhysicalCopies} Buku</strong>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">Sedang Dipinjam</span>
                <strong>{lib.activeLoans} Peminjaman</strong>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">Kas Denda Sirkulasi</span>
                <strong>Rp {lib.totalFines.toLocaleString('id-ID')}</strong>
              </div>
            </div>
          </div>

          {/* LEMBAR TANDA TANGAN */}
          <div className="pt-8 flex justify-between items-end text-xs">
            <div>
              <p className="text-slate-500 text-[10px]">Dokumen ini digenerate secara otomatis melalui</p>
              <p className="font-bold text-slate-700">Sistem Informasi Manajemen Sekolah (SIM Sekolah v1.0)</p>
              <p className="text-slate-400 font-mono text-[9px]">Hash Integritas: SIM-{Date.now()}-AUTH</p>
            </div>

            <div className="text-center space-y-16">
              <div>
                <p>Jakarta Pusat, {new Date().toLocaleDateString('id-ID', { dateStyle: 'long' })}</p>
                <p className="font-bold">Kepala Sekolah {school.name}</p>
              </div>
              <div>
                <p className="font-bold underline text-sm">{school.principalName}</p>
                <p className="text-[10px] text-slate-600 font-mono">NIP: 19740512 199803 1 002</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
