'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Pencil, 
  Printer, 
  User, 
  Calendar, 
  MapPin, 
  Phone, 
  Mail, 
  GraduationCap, 
  BookOpen, 
  Award, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  FileText,
  Users,
  Loader2,
  BookmarkCheck
} from 'lucide-react';
import StatusBadge from '@/components/ui/StatusBadge';

interface StudentDetail {
  id: string;
  nis: string;
  nisn: string | null;
  name: string;
  gender: 'LAKI_LAKI' | 'PEREMPUAN';
  birthPlace: string | null;
  birthDate: string | null;
  religion: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  entryYear: number;
  status: string;
  photoUrl: string | null;
  notes: string | null;
  createdAt: string;
  class: {
    id: string;
    name: string;
    gradeLevel: number;
  } | null;
  parents: Array<{
    id: string;
    parent: {
      id: string;
      name: string;
      relationship: string;
      phone: string;
      email: string | null;
      address: string | null;
      occupation: string | null;
    };
  }>;
  attendances: Array<{
    id: string;
    date: string;
    status: string;
    notes: string | null;
    schedule?: {
      subject?: { name: string };
    } | null;
  }>;
  grades: Array<{
    id: string;
    score: number;
    notes: string | null;
    gradeItem?: {
      name: string;
      type: string;
      subject?: { name: string; code: string };
    };
  }>;
  achievements: Array<{
    id: string;
    title: string;
    category: string;
    level: string;
    rank: string;
    date: string;
    organizer: string;
  }>;
  libraryMember: {
    id: string;
    borrowings: Array<{
      id: string;
      borrowDate: string;
      dueDate: string;
      returnDate: string | null;
      status: string;
      items?: Array<{
        bookCopy?: {
          book?: {
            title: string;
            author: string;
            isbn: string;
          };
        };
      }>;
    }>;
  } | null;
}

export default function StudentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [student, setStudent] = useState<StudentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'biodata' | 'parents' | 'attendance' | 'grades' | 'achievements' | 'library'>('biodata');
  const [showPrintModal, setShowPrintModal] = useState(false);

  useEffect(() => {
    async function loadStudent() {
      try {
        const res = await fetch(`/api/students/${id}`);
        if (!res.ok) throw new Error('Student not found');
        const json = await res.json();
        setStudent(json.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    if (id) loadStudent();
  }, [id]);

  if (loading) {
    return (
      <div className="py-24 text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-600 mb-3" />
        <p className="text-sm text-slate-500">Memuat profil siswa...</p>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="py-24 text-center">
        <User className="w-12 h-12 mx-auto text-slate-300 mb-3" />
        <p className="text-base font-semibold text-slate-800">Siswa tidak ditemukan</p>
        <Link
          href="/dashboard/students"
          className="mt-4 inline-flex items-center text-sm text-indigo-600 font-medium hover:underline"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Kembali ke Daftar Siswa
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard/students"
          className="inline-flex items-center text-sm font-medium text-slate-600 hover:text-slate-900 transition"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          Kembali ke Daftar Siswa
        </Link>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowPrintModal(true)}
            className="inline-flex items-center px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-sm font-medium rounded-xl shadow-xs transition"
          >
            <Printer className="w-4 h-4 mr-2 text-slate-500" />
            Cetak Kartu Siswa
          </button>
          <Link
            href={`/dashboard/students/${student.id}/edit`}
            className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl shadow-xs transition"
          >
            <Pencil className="w-4 h-4 mr-2" />
            Edit Data Siswa
          </Link>
        </div>
      </div>

      {/* Hero Profile Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
          <div className="relative w-28 h-28 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 flex-shrink-0 flex items-center justify-center">
            {student.photoUrl ? (
              <Image
                src={student.photoUrl}
                alt={student.name}
                fill
                className="object-cover"
              />
            ) : (
              <User className="w-12 h-12 text-slate-400" />
            )}
          </div>

          <div className="flex-1 text-center md:text-left space-y-2">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
              <h1 className="text-2xl font-bold text-slate-900">{student.name}</h1>
              <StatusBadge status={student.status} size="md" />
            </div>

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-y-1 gap-x-4 text-sm text-slate-500">
              <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-xs text-slate-700">
                NIS: {student.nis}
              </span>
              {student.nisn && (
                <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-xs text-slate-700">
                  NISN: {student.nisn}
                </span>
              )}
              <span>•</span>
              <span className="inline-flex items-center">
                <GraduationCap className="w-4 h-4 mr-1 text-indigo-600" />
                {student.class ? `${student.class.name} (Tingkat ${student.class.gradeLevel})` : 'Belum Terdaftar Kelas'}
              </span>
              <span>•</span>
              <span>Tahun Masuk: {student.entryYear}</span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-100 mt-8 space-x-2 overflow-x-auto text-sm">
          <button
            onClick={() => setActiveTab('biodata')}
            className={`pb-3 px-3 font-medium transition whitespace-nowrap border-b-2 flex items-center space-x-2 ${
              activeTab === 'biodata'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Biodata Lengkap</span>
          </button>

          <button
            onClick={() => setActiveTab('parents')}
            className={`pb-3 px-3 font-medium transition whitespace-nowrap border-b-2 flex items-center space-x-2 ${
              activeTab === 'parents'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Orang Tua / Wali ({student.parents?.length || 0})</span>
          </button>

          <button
            onClick={() => setActiveTab('attendance')}
            className={`pb-3 px-3 font-medium transition whitespace-nowrap border-b-2 flex items-center space-x-2 ${
              activeTab === 'attendance'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Riwayat Absensi ({student.attendances?.length || 0})</span>
          </button>

          <button
            onClick={() => setActiveTab('grades')}
            className={`pb-3 px-3 font-medium transition whitespace-nowrap border-b-2 flex items-center space-x-2 ${
              activeTab === 'grades'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>Nilai Akademik ({student.grades?.length || 0})</span>
          </button>

          <button
            onClick={() => setActiveTab('achievements')}
            className={`pb-3 px-3 font-medium transition whitespace-nowrap border-b-2 flex items-center space-x-2 ${
              activeTab === 'achievements'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <BookmarkCheck className="w-4 h-4" />
            <span>Prestasi ({student.achievements?.length || 0})</span>
          </button>

          <button
            onClick={() => setActiveTab('library')}
            className={`pb-3 px-3 font-medium transition whitespace-nowrap border-b-2 flex items-center space-x-2 ${
              activeTab === 'library'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Perpustakaan ({student.libraryMember?.borrowings?.length || 0})</span>
          </button>
        </div>
      </div>

      {/* Tab Contents */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
        {/* 1. Biodata Tab */}
        {activeTab === 'biodata' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400 border-b pb-2">
                Identitas Pribadi
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">Nama Lengkap</span>
                  <span className="font-medium text-slate-900">{student.name}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">NIS / NISN</span>
                  <span className="font-medium text-slate-900">{student.nis} / {student.nisn || '-'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">Jenis Kelamin</span>
                  <span className="font-medium text-slate-900">{student.gender === 'LAKI_LAKI' ? 'Laki-laki' : 'Perempuan'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">Tempat, Tanggal Lahir</span>
                  <span className="font-medium text-slate-900">
                    {student.birthPlace || '-'}, {student.birthDate ? new Date(student.birthDate).toLocaleDateString('id-ID', { dateStyle: 'long' }) : '-'}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">Agama</span>
                  <span className="font-medium text-slate-900">{student.religion || '-'}</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400 border-b pb-2">
                Kontak & Domisili
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">No. Telepon / WA</span>
                  <span className="font-medium text-slate-900">{student.phone || '-'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">Email</span>
                  <span className="font-medium text-slate-900">{student.email || '-'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">Alamat Tempat Tinggal</span>
                  <span className="font-medium text-slate-900 text-right max-w-xs">{student.address || '-'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">Catatan Khusus</span>
                  <span className="font-medium text-slate-900 text-right max-w-xs">{student.notes || '-'}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. Parents Tab */}
        {activeTab === 'parents' && (
          <div className="space-y-4">
            {(!student.parents || student.parents.length === 0) ? (
              <div className="text-center py-12 text-slate-400">
                <Users className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                <p>Belum ada data orang tua / wali yang terhubung</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {student.parents.map((p) => (
                  <div key={p.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-900">{p.parent.name}</span>
                      <span className="px-2 py-0.5 rounded text-xs bg-indigo-50 text-indigo-700 font-medium">
                        {p.parent.relationship}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 space-y-1">
                      <div>No. Telp / WA: <strong className="text-slate-700">{p.parent.phone}</strong></div>
                      {p.parent.email && <div>Email: {p.parent.email}</div>}
                      {p.parent.occupation && <div>Pekerjaan: {p.parent.occupation}</div>}
                      {p.parent.address && <div>Alamat: {p.parent.address}</div>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 3. Attendance Tab */}
        {activeTab === 'attendance' && (
          <div className="overflow-x-auto">
            {(!student.attendances || student.attendances.length === 0) ? (
              <div className="text-center py-12 text-slate-400">
                <Clock className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                <p>Belum ada riwayat absensi tercatat</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-xs font-semibold text-slate-400 uppercase">
                    <th className="py-2.5 px-3">Tanggal</th>
                    <th className="py-2.5 px-3">Mata Pelajaran</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Catatan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {student.attendances.map((att) => (
                    <tr key={att.id}>
                      <td className="py-2.5 px-3 text-slate-700 font-medium">
                        {new Date(att.date).toLocaleDateString('id-ID', { dateStyle: 'medium' })}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">
                        {att.schedule?.subject?.name || 'Absensi Harian'}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          att.status === 'HADIR' ? 'bg-emerald-50 text-emerald-700' :
                          att.status === 'SAKIT' ? 'bg-amber-50 text-amber-700' :
                          att.status === 'IZIN' ? 'bg-blue-50 text-blue-700' :
                          'bg-rose-50 text-rose-700'
                        }`}>
                          {att.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-500 text-xs">
                        {att.notes || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* 4. Grades Tab */}
        {activeTab === 'grades' && (
          <div className="overflow-x-auto">
            {(!student.grades || student.grades.length === 0) ? (
              <div className="text-center py-12 text-slate-400">
                <Award className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                <p>Belum ada nilai akademik yang tercatat</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-xs font-semibold text-slate-400 uppercase">
                    <th className="py-2.5 px-3">Mata Pelajaran</th>
                    <th className="py-2.5 px-3">Komponen Penilaian</th>
                    <th className="py-2.5 px-3">Tipe</th>
                    <th className="py-2.5 px-3 text-right">Nilai</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {student.grades.map((g) => (
                    <tr key={g.id}>
                      <td className="py-2.5 px-3 font-medium text-slate-900">
                        {g.gradeItem?.subject?.name || '-'}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">
                        {g.gradeItem?.name || '-'}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-xs font-medium">
                          {g.gradeItem?.type || 'TUGAS'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-indigo-600">
                        {g.score}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* 5. Achievements Tab */}
        {activeTab === 'achievements' && (
          <div className="space-y-4">
            {(!student.achievements || student.achievements.length === 0) ? (
              <div className="text-center py-12 text-slate-400">
                <BookmarkCheck className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                <p>Belum ada data prestasi tercatat</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {student.achievements.map((ach) => (
                  <div key={ach.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-900">{ach.title}</span>
                      <span className="px-2 py-0.5 rounded text-xs bg-amber-50 text-amber-700 font-semibold">
                        {ach.rank}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 space-y-1">
                      <div>Tingkat: <span className="font-medium text-slate-700">{ach.level}</span> ({ach.category})</div>
                      <div>Penyelenggara: {ach.organizer}</div>
                      <div>Tanggal: {new Date(ach.date).toLocaleDateString('id-ID', { dateStyle: 'medium' })}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 6. Library Tab */}
        {activeTab === 'library' && (
          <div className="overflow-x-auto">
            {(!student.libraryMember?.borrowings || student.libraryMember.borrowings.length === 0) ? (
              <div className="text-center py-12 text-slate-400">
                <BookOpen className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                <p>Tidak ada riwayat peminjaman buku perpustakaan</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-xs font-semibold text-slate-400 uppercase">
                    <th className="py-2.5 px-3">Judul Buku</th>
                    <th className="py-2.5 px-3">Tgl Pinjam</th>
                    <th className="py-2.5 px-3">Batas Kembali</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {student.libraryMember.borrowings.map((b) => (
                    <tr key={b.id}>
                      <td className="py-2.5 px-3 font-medium text-slate-900">
                        {b.items?.[0]?.bookCopy?.book?.title || 'Buku Perpustakaan'}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">
                        {new Date(b.borrowDate).toLocaleDateString('id-ID')}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">
                        {new Date(b.dueDate).toLocaleDateString('id-ID')}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          b.status === 'DIKEMBALIKAN' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                        }`}>
                          {b.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {/* Student Card Modal / Print View */}
      {showPrintModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-semibold text-slate-900">Kartu Tanda Siswa</h3>
              <button
                onClick={() => setShowPrintModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm"
              >
                Tutup
              </button>
            </div>

            {/* Printable ID Card */}
            <div id="student-id-card" className="border-2 border-indigo-700 rounded-2xl overflow-hidden shadow-md bg-gradient-to-br from-indigo-900 via-indigo-800 to-slate-900 text-white p-6 relative">
              <div className="flex items-center justify-between border-b border-indigo-600/50 pb-4 mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                    <GraduationCap className="w-6 h-6 text-indigo-300" />
                  </div>
                  <div>
                    <h4 className="text-xs uppercase tracking-widest text-indigo-200">Kartu Pelajar</h4>
                    <h2 className="text-sm font-bold">SMA NEGERI 1 NUSANTARA</h2>
                  </div>
                </div>
                <div className="text-right text-xs text-indigo-300 font-mono">
                  NPSN: 20260001
                </div>
              </div>

              <div className="flex gap-4 items-center">
                <div className="relative w-24 h-28 rounded-xl overflow-hidden bg-slate-800 border-2 border-indigo-400/50 flex-shrink-0 flex items-center justify-center">
                  {student.photoUrl ? (
                    <Image
                      src={student.photoUrl}
                      alt={student.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <User className="w-12 h-12 text-slate-500" />
                  )}
                </div>

                <div className="space-y-1 text-xs">
                  <div className="text-base font-bold text-white uppercase">{student.name}</div>
                  <div className="text-indigo-200 font-mono">NIS: <span className="text-white font-semibold">{student.nis}</span></div>
                  {student.nisn && <div className="text-indigo-200 font-mono">NISN: <span className="text-white">{student.nisn}</span></div>}
                  <div className="text-indigo-200">Kelas: <span className="text-white font-medium">{student.class?.name || '-'}</span></div>
                  <div className="text-indigo-200">Alamat: <span className="text-white truncate block max-w-xs">{student.address || '-'}</span></div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-indigo-600/40 flex items-center justify-between text-[10px] text-indigo-300">
                <span>Berlaku Selama Menjadi Siswa Aktif</span>
                <span className="font-mono">Tahun Ajaran 2026/2027</span>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowPrintModal(false)}
                className="px-4 py-2 border border-slate-200 text-slate-700 text-sm font-medium rounded-xl hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl shadow-xs"
              >
                <Printer className="w-4 h-4 mr-2" />
                Cetak Sekarang
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
