'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Pencil,
  BookOpen,
  Users,
  Calendar,
  Award,
  Layers,
  GraduationCap,
  Clock,
  MapPin,
  Mail,
  Phone,
  Loader2,
  Trash2,
  AlertCircle,
  CheckCircle2,
  XCircle,
  ExternalLink,
  ChevronRight,
  BookCheck,
  CalendarDays
} from 'lucide-react';

interface SubjectDetail {
  id: string;
  code: string;
  name: string;
  category: string | null;
  gradeLevel: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  teacherSubject: Array<{
    teacher: {
      id: string;
      name: string;
      nip: string | null;
      phone: string | null;
      email: string | null;
      photoUrl: string | null;
      position: string | null;
    };
    academicYear?: {
      id: string;
      name: string;
      semester: string;
    };
  }>;
  schedules: Array<{
    id: string;
    dayOfWeek: string;
    startTime: string;
    endTime: string;
    room: string | null;
    class: {
      id: string;
      name: string;
      gradeLevel: number;
    };
    teacher: {
      id: string;
      name: string;
    };
  }>;
  gradeItems: Array<{
    id: string;
    title: string;
    type: string;
    weight: number;
    maxScore: number;
    date: string | null;
    class: {
      id: string;
      name: string;
    };
    teacher: {
      id: string;
      name: string;
    };
    _count: {
      grades: number;
    };
  }>;
  _count: {
    schedules: number;
    gradeItems: number;
    teacherSubject: number;
  };
}

const CATEGORY_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  'Muatan Nasional': { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  'Peminatan MIPA': { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  'Peminatan IPS': { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  'Peminatan Bahasa': { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  'Muatan Lokal': { bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200' },
  'Bimbingan Konseling (BK)': { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
};

const DAY_LABELS: Record<string, string> = {
  SENIN: 'Senin',
  SELASA: 'Selasa',
  RABU: 'Rabu',
  KAMIS: 'Kamis',
  JUMAT: 'Jumat',
  SABTU: 'Sabtu',
  MONDAY: 'Senin',
  TUESDAY: 'Selasa',
  WEDNESDAY: 'Rabu',
  THURSDAY: 'Kamis',
  FRIDAY: 'Jumat',
  SATURDAY: 'Sabtu',
  SUNDAY: 'Minggu',
};

export default function SubjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [subject, setSubject] = useState<SubjectDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'teachers' | 'schedules' | 'grades' | 'info'>('teachers');

  // Delete modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    async function loadSubject() {
      try {
        const res = await fetch(`/api/subjects/${id}`);
        if (!res.ok) throw new Error('Mata pelajaran tidak ditemukan');
        const json = await res.json();
        setSubject(json.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    if (id) loadSubject();
  }, [id]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/subjects/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Gagal menonaktifkan mata pelajaran');
      router.push('/dashboard/subjects');
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-600 mb-3" />
        <p className="text-sm text-slate-500 font-medium">Memuat detail mata pelajaran...</p>
      </div>
    );
  }

  if (!subject) {
    return (
      <div className="py-24 text-center">
        <BookOpen className="w-12 h-12 mx-auto text-slate-300 mb-3" />
        <h2 className="text-base font-semibold text-slate-800">Mata Pelajaran Tidak Ditemukan</h2>
        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
          Mata pelajaran dengan ID tersebut tidak ditemukan dalam basis data sistem.
        </p>
        <Link
          href="/dashboard/subjects"
          className="mt-4 inline-flex items-center text-sm text-indigo-600 font-medium hover:underline"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Kembali ke Daftar Mata Pelajaran
        </Link>
      </div>
    );
  }

  const categoryStyle = subject.category && CATEGORY_STYLES[subject.category]
    ? CATEGORY_STYLES[subject.category]
    : { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200' };

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-3">
          <Link
            href="/dashboard/subjects"
            className="p-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 rounded-xl transition shadow-2xs"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center space-x-2 text-xs text-slate-500 mb-0.5">
              <Link href="/dashboard" className="hover:text-indigo-600">Dashboard</Link>
              <ChevronRight className="w-3 h-3 text-slate-400" />
              <Link href="/dashboard/subjects" className="hover:text-indigo-600">Mata Pelajaran</Link>
              <ChevronRight className="w-3 h-3 text-slate-400" />
              <span className="text-slate-800 font-medium font-mono">{subject.code}</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                {subject.name}
              </h1>
              <span className="font-mono text-xs px-2.5 py-1 bg-slate-900 text-white font-semibold rounded-lg tracking-wider">
                {subject.code}
              </span>
              <span className={`text-xs px-2.5 py-1 rounded-lg border font-medium ${categoryStyle.bg} ${categoryStyle.text} ${categoryStyle.border}`}>
                {subject.category || 'Umum'}
              </span>
              {subject.gradeLevel ? (
                <span className="text-xs px-2.5 py-1 rounded-lg border bg-indigo-50 text-indigo-700 border-indigo-200 font-medium">
                  Kelas {subject.gradeLevel}
                </span>
              ) : (
                <span className="text-xs px-2.5 py-1 rounded-lg border bg-slate-100 text-slate-600 border-slate-200 font-medium">
                  Semua Tingkat
                </span>
              )}
              {subject.isActive ? (
                <span className="inline-flex items-center text-xs px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Aktif
                </span>
              ) : (
                <span className="inline-flex items-center text-xs px-2.5 py-1 bg-rose-50 text-rose-700 border border-rose-200 rounded-lg font-medium">
                  <XCircle className="w-3.5 h-3.5 mr-1" /> Nonaktif
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Link
            href={`/dashboard/subjects/${id}/edit`}
            className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-xl shadow-xs transition"
          >
            <Pencil className="w-3.5 h-3.5 mr-1.5" />
            Edit Mapel
          </Link>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="inline-flex items-center px-3 py-2 bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 text-xs font-medium rounded-xl transition shadow-2xs"
          >
            <Trash2 className="w-3.5 h-3.5 mr-1" />
            Hapus
          </button>
        </div>
      </div>

      {/* KPI Metric Summary Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center space-x-3.5">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Guru Pengampu</p>
            <p className="text-xl font-bold text-slate-900">{subject._count?.teacherSubject || subject.teacherSubject.length}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center space-x-3.5">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Jadwal Sesi</p>
            <p className="text-xl font-bold text-slate-900">{subject._count?.schedules || subject.schedules.length}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center space-x-3.5">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Komponen Penilaian</p>
            <p className="text-xl font-bold text-slate-900">{subject._count?.gradeItems || subject.gradeItems.length}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center space-x-3.5">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Tingkat Sasaran</p>
            <p className="text-sm font-bold text-slate-900">
              {subject.gradeLevel ? `Kelas ${subject.gradeLevel}` : 'Semua Fase'}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs Header */}
      <div className="border-b border-slate-200">
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveTab('teachers')}
            className={`pb-3 px-4 text-xs font-medium border-b-2 transition flex items-center space-x-1.5 ${
              activeTab === 'teachers'
                ? 'border-indigo-600 text-indigo-600 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Guru Pengampu</span>
            <span className="ml-1 px-1.5 py-0.5 text-[10px] bg-slate-100 rounded-full font-bold">
              {subject.teacherSubject.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('schedules')}
            className={`pb-3 px-4 text-xs font-medium border-b-2 transition flex items-center space-x-1.5 ${
              activeTab === 'schedules'
                ? 'border-indigo-600 text-indigo-600 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <CalendarDays className="w-4 h-4" />
            <span>Jadwal Pelajaran</span>
            <span className="ml-1 px-1.5 py-0.5 text-[10px] bg-slate-100 rounded-full font-bold">
              {subject.schedules.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('grades')}
            className={`pb-3 px-4 text-xs font-medium border-b-2 transition flex items-center space-x-1.5 ${
              activeTab === 'grades'
                ? 'border-indigo-600 text-indigo-600 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>Komponen Penilaian</span>
            <span className="ml-1 px-1.5 py-0.5 text-[10px] bg-slate-100 rounded-full font-bold">
              {subject.gradeItems.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('info')}
            className={`pb-3 px-4 text-xs font-medium border-b-2 transition flex items-center space-x-1.5 ${
              activeTab === 'info'
                ? 'border-indigo-600 text-indigo-600 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Info & Metadata</span>
          </button>
        </div>
      </div>

      {/* Tab 1: Guru Pengampu */}
      {activeTab === 'teachers' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-800">
              Daftar Guru Pengampu ({subject.teacherSubject.length})
            </h3>
            <Link
              href={`/dashboard/subjects/${id}/edit`}
              className="text-xs text-indigo-600 hover:underline font-medium inline-flex items-center"
            >
              <Pencil className="w-3.5 h-3.5 mr-1" />
              Kelola Guru Pengampu
            </Link>
          </div>

          {subject.teacherSubject.length === 0 ? (
            <div className="bg-white p-10 rounded-2xl border border-slate-200 text-center">
              <Users className="w-10 h-10 mx-auto text-slate-300 mb-2" />
              <p className="text-sm font-semibold text-slate-700">Belum Ada Guru Pengampu</p>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Mata pelajaran ini belum ditugaskan kepada guru pengajar mana pun.
              </p>
              <Link
                href={`/dashboard/subjects/${id}/edit`}
                className="mt-4 inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-xl transition"
              >
                <Pencil className="w-3.5 h-3.5 mr-1.5" />
                Tugaskan Guru Sekarang
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {subject.teacherSubject.map(({ teacher, academicYear }) => (
                <div
                  key={teacher.id}
                  className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs hover:border-indigo-200 transition group flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start space-x-3.5">
                      <div className="relative w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700 font-bold overflow-hidden flex-shrink-0">
                        {teacher.photoUrl ? (
                          <Image
                            src={teacher.photoUrl}
                            alt={teacher.name}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <span>{teacher.name.charAt(0)}</span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/dashboard/teachers/${teacher.id}`}
                          className="font-semibold text-sm text-slate-900 group-hover:text-indigo-600 transition block truncate"
                        >
                          {teacher.name}
                        </Link>
                        <p className="text-xs text-slate-500 font-mono mt-0.5">
                          {teacher.nip ? `NIP: ${teacher.nip}` : 'NIP: -'}
                        </p>
                        {teacher.position && (
                          <span className="inline-block mt-1 text-[10px] px-2 py-0.5 bg-slate-100 text-slate-600 rounded font-medium truncate max-w-full">
                            {teacher.position}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 space-y-1.5 text-xs text-slate-600 border-t border-slate-100 pt-3">
                      {teacher.email && (
                        <div className="flex items-center space-x-2 truncate">
                          <Mail className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                          <span className="truncate">{teacher.email}</span>
                        </div>
                      )}
                      {teacher.phone && (
                        <div className="flex items-center space-x-2">
                          <Phone className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                          <span>{teacher.phone}</span>
                        </div>
                      )}
                      {academicYear && (
                        <div className="flex items-center space-x-2 text-[11px] text-slate-400">
                          <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                          <span>T.A. {academicYear.name} ({academicYear.semester})</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end">
                    <Link
                      href={`/dashboard/teachers/${teacher.id}`}
                      className="text-xs text-indigo-600 hover:text-indigo-700 font-medium inline-flex items-center group-hover:underline"
                    >
                      <span>Lihat Profil Guru</span>
                      <ExternalLink className="w-3 h-3 ml-1" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Jadwal Pelajaran */}
      {activeTab === 'schedules' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-800">
              Jadwal Kelas untuk Mapel Ini ({subject.schedules.length})
            </h3>
            <Link
              href="/dashboard/classes"
              className="text-xs text-indigo-600 hover:underline font-medium inline-flex items-center"
            >
              Lihat Master Kelas
            </Link>
          </div>

          {subject.schedules.length === 0 ? (
            <div className="bg-white p-10 rounded-2xl border border-slate-200 text-center">
              <Calendar className="w-10 h-10 mx-auto text-slate-300 mb-2" />
              <p className="text-sm font-semibold text-slate-700">Belum Ada Jadwal Pelajaran</p>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Mata pelajaran ini belum dialokasikan ke jadwal mingguan kelas rombel.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="py-3 px-4">Hari</th>
                      <th className="py-3 px-4">Waktu</th>
                      <th className="py-3 px-4">Kelas</th>
                      <th className="py-3 px-4">Ruang</th>
                      <th className="py-3 px-4">Guru Pengajar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {subject.schedules.map((sch) => (
                      <tr key={sch.id} className="hover:bg-slate-50/60 transition">
                        <td className="py-3 px-4 font-semibold text-slate-900">
                          {DAY_LABELS[sch.dayOfWeek] || sch.dayOfWeek}
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-600 flex items-center space-x-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>{sch.startTime} - {sch.endTime}</span>
                        </td>
                        <td className="py-3 px-4">
                          <Link
                            href={`/dashboard/classes/${sch.class.id}`}
                            className="font-medium text-indigo-600 hover:underline"
                          >
                            {sch.class.name}
                          </Link>
                        </td>
                        <td className="py-3 px-4">
                          {sch.room ? (
                            <span className="inline-flex items-center space-x-1 text-slate-600 font-medium">
                              <MapPin className="w-3 h-3 text-slate-400" />
                              <span>{sch.room}</span>
                            </span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4 font-medium text-slate-800">
                          {sch.teacher.name}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Komponen Penilaian */}
      {activeTab === 'grades' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-800">
              Komponen Penilaian & Tugas ({subject.gradeItems.length})
            </h3>
          </div>

          {subject.gradeItems.length === 0 ? (
            <div className="bg-white p-10 rounded-2xl border border-slate-200 text-center">
              <Award className="w-10 h-10 mx-auto text-slate-300 mb-2" />
              <p className="text-sm font-semibold text-slate-700">Belum Ada Komponen Penilaian</p>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Tugas, kuis, UTS, atau UAS untuk mata pelajaran ini belum dibuat oleh guru pengajar.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="py-3 px-4">Judul Penilaian</th>
                      <th className="py-3 px-4">Tipe</th>
                      <th className="py-3 px-4">Kelas</th>
                      <th className="py-3 px-4">Bobot (%)</th>
                      <th className="py-3 px-4">Skor Maks</th>
                      <th className="py-3 px-4">Guru Penilai</th>
                      <th className="py-3 px-4 text-center">Siswa Dinilai</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {subject.gradeItems.map((gi) => (
                      <tr key={gi.id} className="hover:bg-slate-50/60 transition">
                        <td className="py-3 px-4 font-semibold text-slate-900">
                          {gi.title}
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium text-[11px]">
                            {gi.type}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-medium text-slate-800">
                          {gi.class.name}
                        </td>
                        <td className="py-3 px-4 font-mono font-medium text-slate-700">
                          {gi.weight}%
                        </td>
                        <td className="py-3 px-4 font-mono font-medium text-slate-700">
                          {gi.maxScore}
                        </td>
                        <td className="py-3 px-4 text-slate-600">
                          {gi.teacher.name}
                        </td>
                        <td className="py-3 px-4 text-center font-bold text-indigo-600">
                          {gi._count.grades}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Info Kurikulum & Standar */}
      {activeTab === 'info' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
            <h3 className="text-sm font-semibold text-slate-900 flex items-center border-b border-slate-100 pb-3">
              <BookCheck className="w-4 h-4 mr-2 text-indigo-600" />
              Identitas & Spesifikasi Kurikulum
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-50">
                <span className="text-slate-500">Nama Mata Pelajaran:</span>
                <span className="font-semibold text-slate-800">{subject.name}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-50">
                <span className="text-slate-500">Kode Mata Pelajaran:</span>
                <span className="font-mono font-semibold text-slate-800">{subject.code}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-50">
                <span className="text-slate-500">Kelompok / Kategori:</span>
                <span className="font-medium text-slate-800">{subject.category || 'Muatan Nasional'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-50">
                <span className="text-slate-500">Tingkat Sasaran:</span>
                <span className="font-medium text-slate-800">
                  {subject.gradeLevel ? `Kelas ${subject.gradeLevel}` : 'Semua Tingkat'}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-50">
                <span className="text-slate-500">Status Operasional:</span>
                <span className="font-semibold text-emerald-600">
                  {subject.isActive ? 'Aktif dalam Kurikulum' : 'Nonaktif'}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-50">
                <span className="text-slate-500">Jumlah Guru Pengampu:</span>
                <span className="font-medium text-slate-800">{subject.teacherSubject.length} Guru</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
            <h3 className="text-sm font-semibold text-slate-900 flex items-center border-b border-slate-100 pb-3">
              <Layers className="w-4 h-4 mr-2 text-indigo-600" />
              Informasi Sistem & Audit
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-50">
                <span className="text-slate-500">ID Record:</span>
                <span className="font-mono text-slate-600 text-[11px] truncate max-w-[200px]">{subject.id}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-50">
                <span className="text-slate-500">Tanggal Dibuat:</span>
                <span className="text-slate-700">
                  {new Date(subject.createdAt).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-50">
                <span className="text-slate-500">Terakhir Diperbarui:</span>
                <span className="text-slate-700">
                  {new Date(subject.updatedAt).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })} WIB
                </span>
              </div>
            </div>

            <div className="mt-4 p-3.5 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-600 space-y-1">
              <p className="font-semibold text-slate-800">Catatan Pengelolaan Kurikulum:</p>
              <p className="text-slate-500 leading-relaxed text-[11px]">
                Mata pelajaran yang dinonaktifkan tidak akan muncul pada pilihan pembuatan jadwal baru, namun seluruh arsip nilai rapor historis tetap aman di basis data.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal Delete/Deactivate */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center space-x-3 text-rose-600">
              <div className="p-2.5 bg-rose-50 rounded-xl">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                Nonaktifkan Mata Pelajaran?
              </h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Anda akan menonaktifkan mata pelajaran <span className="font-semibold text-slate-900">{subject.name} ({subject.code})</span>. Mata pelajaran ini tidak akan muncul dalam opsi jadwal baru.
            </p>

            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 border border-slate-200 text-slate-700 text-xs font-medium rounded-xl hover:bg-slate-50 transition"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleDelete}
                className="inline-flex items-center px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-medium rounded-xl shadow-xs transition disabled:opacity-50"
              >
                {deleting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                    Memproses...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                    Ya, Nonaktifkan
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
