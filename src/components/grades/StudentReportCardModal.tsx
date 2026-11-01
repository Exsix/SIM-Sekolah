'use client';

import React, { useState, useEffect } from 'react';
import {
  Printer,
  X,
  Loader2,
  Award,
  BookOpen,
  Calendar,
  CheckCircle2,
  School
} from 'lucide-react';

interface StudentReportCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentId: string | null;
}

interface ReportData {
  school: {
    name: string;
    npsn: string;
    address: string;
    principalName: string;
    phone: string | null;
    email: string | null;
  } | null;
  academicYear: {
    name: string;
    semester: string;
  } | null;
  student: {
    id: string;
    nis: string;
    nisn: string | null;
    name: string;
    gender: string;
    className: string;
    homeroomTeacher: string;
  };
  overallAverage: number;
  overallPredicate: string;
  overallDescription: string;
  attendanceRecap: {
    hadir: number;
    sakit: number;
    izin: number;
    alpa: number;
    dispensasi: number;
    totalHari: number;
  };
  subjects: Array<{
    subject: { id: string; code: string; name: string; category: string | null };
    teacherName: string;
    finalScore: number;
    predicate: string;
    description: string;
    isPassed: boolean;
  }>;
}

export default function StudentReportCardModal({
  isOpen,
  onClose,
  studentId,
}: StudentReportCardModalProps) {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen || !studentId) return;

    async function loadReport() {
      setLoading(true);
      try {
        const res = await fetch(`/api/grades/my-grades?studentId=${studentId}`);
        const json = await res.json();
        if (json.data) {
          setData(json.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    loadReport();
  }, [isOpen, studentId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xl max-w-4xl w-full my-8 overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[92vh]">
        {/* Top Control Bar (Hidden when printing) */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between print:hidden">
          <div className="flex items-center space-x-2">
            <School className="w-5 h-5 text-indigo-400" />
            <span className="font-bold text-sm">Pratinjau Lembar Rapor Siswa</span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs transition"
            >
              <Printer className="w-4 h-4 mr-1.5" />
              Cetak Rapor (A4)
            </button>
            <button
              onClick={onClose}
              type="button"
              className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Sheet Content */}
        <div className="p-8 overflow-y-auto flex-1 bg-white text-slate-800 space-y-6 print:p-0 print:m-0">
          {loading ? (
            <div className="py-24 text-center text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-600 mb-2" />
              <p className="text-xs">Menyiapkan lembar rapor siswa...</p>
            </div>
          ) : !data ? (
            <div className="py-20 text-center text-slate-500 text-sm">
              Data rapor tidak ditemukan
            </div>
          ) : (
            <div className="space-y-6">
              {/* Kop Surat Sekolah Resmi */}
              <div className="text-center border-b-2 border-slate-900 pb-4">
                <h2 className="text-lg font-black tracking-wide uppercase text-slate-950">
                  {data.school?.name || 'SMA NEGERI 1 NUSANTARA'}
                </h2>
                <p className="text-xs text-slate-600 mt-0.5">
                  NPSN: {data.school?.npsn || '20260001'} • Akreditasi A (Unggul)
                </p>
                <p className="text-xs text-slate-500">
                  {data.school?.address || 'Jl. Pendidikan Merdeka No. 45, Jakarta Pusat'}
                </p>
                <div className="mt-3 inline-block px-4 py-1 bg-slate-100 rounded-full text-xs font-bold uppercase tracking-wider text-slate-800">
                  Laporan Hasil Belajar Peserta Didik (Rapor)
                </div>
              </div>

              {/* Identitas Siswa */}
              <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="space-y-1.5">
                  <div className="flex">
                    <span className="w-36 text-slate-500 font-medium">Nama Peserta Didik</span>
                    <span className="font-bold text-slate-900">: {data.student.name}</span>
                  </div>
                  <div className="flex">
                    <span className="w-36 text-slate-500 font-medium">NIS / NISN</span>
                    <span className="font-mono text-slate-800">: {data.student.nis} / {data.student.nisn || '-'}</span>
                  </div>
                  <div className="flex">
                    <span className="w-36 text-slate-500 font-medium">Kelas / Fase</span>
                    <span className="font-semibold text-slate-900">: {data.student.className}</span>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <div className="flex">
                    <span className="w-36 text-slate-500 font-medium">Tahun Ajaran</span>
                    <span className="font-semibold text-slate-900">
                      : {data.academicYear?.name || '2026/2027'} ({data.academicYear?.semester || 'Ganjil'})
                    </span>
                  </div>
                  <div className="flex">
                    <span className="w-36 text-slate-500 font-medium">Wali Kelas</span>
                    <span className="text-slate-800">: {data.student.homeroomTeacher}</span>
                  </div>
                  <div className="flex">
                    <span className="w-36 text-slate-500 font-medium">Rata-Rata Akhir</span>
                    <span className="font-mono font-bold text-indigo-600">
                      : {data.overallAverage} (Predikat {data.overallPredicate})
                    </span>
                  </div>
                </div>
              </div>

              {/* Tabel Nilai Capaian Kompetensi */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-2">
                  A. Nilai Capaian Hasil Belajar
                </h3>
                <div className="border border-slate-300 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-300 uppercase text-[11px]">
                      <tr>
                        <th className="py-2.5 px-3 w-10 text-center">No</th>
                        <th className="py-2.5 px-3">Mata Pelajaran</th>
                        <th className="py-2.5 px-3 w-24 text-center">Nilai Akhir</th>
                        <th className="py-2.5 px-3 w-20 text-center">Predikat</th>
                        <th className="py-2.5 px-3">Capaian Kompetensi & Evaluasi Guru</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {data.subjects.map((sub, idx) => (
                        <tr key={sub.subject.id} className="hover:bg-slate-50">
                          <td className="py-2.5 px-3 text-center font-mono text-slate-500">{idx + 1}</td>
                          <td className="py-2.5 px-3">
                            <p className="font-semibold text-slate-900">{sub.subject.name}</p>
                            <span className="text-[10px] text-slate-400 font-mono">Kode: {sub.subject.code}</span>
                          </td>
                          <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-900">
                            {sub.finalScore}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span className="font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200">
                              {sub.predicate}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-slate-600 text-[11px]">
                            {sub.finalScore >= 85
                              ? `Menunjukkan penguasaan yang sangat baik dalam seluruh kompetensi ${sub.subject.name}.`
                              : sub.finalScore >= 75
                              ? `Tuntas mencapai kriteria ketuntasan minimal pada mata pelajaran ${sub.subject.name}.`
                              : `Perlu bimbingan dan peningkatan pemahaman konsep materi ${sub.subject.name}.`}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Tabel Rekap Presensi Siswa */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-2">
                  B. Rekapitulasi Kehadiran & Ketidakhadiran
                </h3>
                <div className="grid grid-cols-4 gap-3 text-center text-xs">
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                    <span className="text-emerald-700 font-bold block text-base font-mono">
                      {data.attendanceRecap.hadir}
                    </span>
                    <span className="text-emerald-800 font-medium text-[11px]">Hari Hadir</span>
                  </div>
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl">
                    <span className="text-blue-700 font-bold block text-base font-mono">
                      {data.attendanceRecap.sakit}
                    </span>
                    <span className="text-blue-800 font-medium text-[11px]">Sakit</span>
                  </div>
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                    <span className="text-amber-700 font-bold block text-base font-mono">
                      {data.attendanceRecap.izin}
                    </span>
                    <span className="text-amber-800 font-medium text-[11px]">Izin</span>
                  </div>
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl">
                    <span className="text-rose-700 font-bold block text-base font-mono">
                      {data.attendanceRecap.alpa}
                    </span>
                    <span className="text-rose-800 font-medium text-[11px]">Tanpa Keterangan</span>
                  </div>
                </div>
              </div>

              {/* Bagian Tanda Tangan Resmi */}
              <div className="pt-6 grid grid-cols-3 gap-6 text-center text-xs text-slate-700">
                <div>
                  <p>Mengetahui,</p>
                  <p className="font-semibold text-slate-800">Orang Tua / Wali Murid</p>
                  <div className="h-16"></div>
                  <p className="border-b border-slate-400 w-36 mx-auto"></p>
                </div>

                <div>
                  <p>Jakarta, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                  <p className="font-semibold text-slate-800">Wali Kelas</p>
                  <div className="h-16"></div>
                  <p className="font-bold underline text-slate-900">{data.student.homeroomTeacher}</p>
                </div>

                <div>
                  <p>Mengetahui,</p>
                  <p className="font-semibold text-slate-800">Kepala Sekolah</p>
                  <div className="h-16"></div>
                  <p className="font-bold underline text-slate-900">
                    {data.school?.principalName || 'Dr. H. Ahmad Sudirman, M.Pd.'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
