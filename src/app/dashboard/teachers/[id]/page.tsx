'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import {
  ArrowLeft, Pencil, User, Phone, Mail, MapPin, Briefcase,
  GraduationCap, Calendar, CheckCircle, XCircle, BookOpen,
  CalendarDays, ClipboardList, Loader2, Award, School
} from 'lucide-react';

interface TeacherDetail {
  id: string;
  nip: string | null;
  nuptk: string | null;
  name: string;
  gender: 'LAKI_LAKI' | 'PEREMPUAN';
  birthPlace: string | null;
  birthDate: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  education: string | null;
  position: string | null;
  employmentStatus: string;
  joinDate: string | null;
  isActive: boolean;
  photoUrl: string | null;
  createdAt: string;
  classesAdvised: Array<{ id: string; name: string; gradeLevel: number; major: string | null; room: string | null }>;
  teacherSubjects: Array<{
    subject: { id: string; name: string; code: string; category: string | null };
    academicYear: { name: string; semester: string };
  }>;
  schedules: Array<{
    id: string; dayOfWeek: string; startTime: string; endTime: string; room: string | null;
    subject: { name: string };
    class: { name: string };
  }>;
  attendances: Array<{
    id: string; date: string; status: string; checkInTime: string | null; checkOutTime: string | null; notes: string | null;
  }>;
}

const STATUS_LABEL: Record<string, string> = {
  PNS: 'PNS (Pegawai Negeri Sipil)',
  PPPK: 'PPPK',
  GURU_TETAP_YAYASAN: 'Guru Tetap Yayasan',
  GURU_HONORER: 'Guru Honorer',
};

const STATUS_COLOR: Record<string, string> = {
  PNS: 'bg-blue-50 text-blue-700 border-blue-200',
  PPPK: 'bg-violet-50 text-violet-700 border-violet-200',
  GURU_TETAP_YAYASAN: 'bg-teal-50 text-teal-700 border-teal-200',
  GURU_HONORER: 'bg-amber-50 text-amber-700 border-amber-200',
};

const DAY_LABEL: Record<string, string> = {
  SENIN: 'Senin', SELASA: 'Selasa', RABU: 'Rabu',
  KAMIS: 'Kamis', JUMAT: 'Jumat', SABTU: 'Sabtu',
};

type Tab = 'profil' | 'mengajar' | 'jadwal' | 'absensi';

export default function TeacherDetailPage() {
  const params = useParams();
  const id = params?.id as string;

  const [teacher, setTeacher] = useState<TeacherDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('profil');

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/teachers/${id}`);
        if (!res.ok) throw new Error('Not found');
        const json = await res.json();
        setTeacher(json.data);
      } catch { } finally {
        setLoading(false);
      }
    }
    if (id) load();
  }, [id]);

  if (loading) {
    return (
      <div className="py-24 text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-600 mb-3" />
        <p className="text-sm text-slate-500">Memuat profil guru...</p>
      </div>
    );
  }

  if (!teacher) {
    return (
      <div className="py-24 text-center">
        <User className="w-12 h-12 mx-auto text-slate-300 mb-3" />
        <p className="text-base font-semibold text-slate-800">Guru tidak ditemukan</p>
        <Link href="/dashboard/teachers" className="mt-4 inline-flex items-center text-sm text-indigo-600 font-medium hover:underline">
          <ArrowLeft className="w-4 h-4 mr-1" />Kembali ke Daftar Guru
        </Link>
      </div>
    );
  }

  const tabs: { key: Tab; label: string; icon: React.ReactNode; count?: number }[] = [
    { key: 'profil', label: 'Profil Lengkap', icon: <User className="w-4 h-4" /> },
    { key: 'mengajar', label: `Penugasan Mengajar (${teacher.teacherSubjects?.length || 0})`, icon: <BookOpen className="w-4 h-4" /> },
    { key: 'jadwal', label: `Jadwal (${teacher.schedules?.length || 0})`, icon: <CalendarDays className="w-4 h-4" /> },
    { key: 'absensi', label: `Riwayat Absensi (${teacher.attendances?.length || 0})`, icon: <ClipboardList className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-6">
      {/* Nav */}
      <div className="flex items-center justify-between">
        <Link href="/dashboard/teachers" className="inline-flex items-center text-sm font-medium text-slate-600 hover:text-slate-900 transition">
          <ArrowLeft className="w-4 h-4 mr-1.5" />Kembali ke Daftar Guru
        </Link>
        <Link href={`/dashboard/teachers/${teacher.id}/edit`} className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl shadow-xs transition">
          <Pencil className="w-4 h-4 mr-2" />Edit Data Guru
        </Link>
      </div>

      {/* Hero Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
          <div className="relative w-28 h-28 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 flex-shrink-0 flex items-center justify-center">
            {teacher.photoUrl ? (
              <Image src={teacher.photoUrl} alt={teacher.name} fill className="object-cover" />
            ) : (
              <User className="w-12 h-12 text-slate-400" />
            )}
          </div>

          <div className="flex-1 text-center md:text-left space-y-2">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
              <h1 className="text-2xl font-bold text-slate-900">{teacher.name}</h1>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${STATUS_COLOR[teacher.employmentStatus] || ''}`}>
                {STATUS_LABEL[teacher.employmentStatus] || teacher.employmentStatus}
              </span>
              {teacher.isActive ? (
                <span className="inline-flex items-center px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full text-xs font-medium border border-emerald-200">
                  <CheckCircle className="w-3 h-3 mr-1" />Aktif
                </span>
              ) : (
                <span className="inline-flex items-center px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full text-xs font-medium border border-slate-200">
                  <XCircle className="w-3 h-3 mr-1" />Tidak Aktif
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-4 gap-y-1 text-sm text-slate-500">
              {teacher.nip && (
                <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-xs text-slate-700">NIP: {teacher.nip}</span>
              )}
              {teacher.nuptk && (
                <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-xs text-slate-700">NUPTK: {teacher.nuptk}</span>
              )}
              {teacher.position && (
                <><span>•</span><span className="inline-flex items-center"><Briefcase className="w-3.5 h-3.5 mr-1 text-indigo-600" />{teacher.position}</span></>
              )}
              {teacher.education && (
                <><span>•</span><span className="inline-flex items-center"><GraduationCap className="w-3.5 h-3.5 mr-1 text-slate-500" />{teacher.education}</span></>
              )}
            </div>

            {/* Wali Kelas */}
            {teacher.classesAdvised?.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Wali Kelas:</span>
                {teacher.classesAdvised.map((c) => (
                  <span key={c.id} className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-md text-xs font-medium border border-indigo-100">
                    {c.name}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-100 mt-8 space-x-1 overflow-x-auto text-sm">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`pb-3 px-3 font-medium transition whitespace-nowrap border-b-2 flex items-center space-x-2 ${
                activeTab === tab.key
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
        {/* Profil */}
        {activeTab === 'profil' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400 border-b pb-2">Identitas Pribadi</h3>
              <div className="space-y-3 text-sm">
                {[
                  ['Nama Lengkap', teacher.name],
                  ['Jenis Kelamin', teacher.gender === 'LAKI_LAKI' ? 'Laki-laki' : 'Perempuan'],
                  ['Tempat, Tgl Lahir', `${teacher.birthPlace || '-'}, ${teacher.birthDate ? new Date(teacher.birthDate).toLocaleDateString('id-ID', { dateStyle: 'long' }) : '-'}`],
                  ['Pendidikan Terakhir', teacher.education || '-'],
                  ['Tanggal Bergabung', teacher.joinDate ? new Date(teacher.joinDate).toLocaleDateString('id-ID', { dateStyle: 'long' }) : '-'],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-500">{label}</span>
                    <span className="font-medium text-slate-900 text-right max-w-xs">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400 border-b pb-2">Kontak & Alamat</h3>
              <div className="space-y-3 text-sm">
                {[
                  ['No. Telepon / WA', teacher.phone || '-'],
                  ['Alamat Email', teacher.email || '-'],
                  ['Jabatan / Tugas', teacher.position || '-'],
                  ['Alamat Rumah', teacher.address || '-'],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-500">{label}</span>
                    <span className="font-medium text-slate-900 text-right max-w-xs">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Penugasan Mengajar */}
        {activeTab === 'mengajar' && (
          <div className="space-y-4">
            {(!teacher.teacherSubjects || teacher.teacherSubjects.length === 0) ? (
              <div className="text-center py-12 text-slate-400">
                <BookOpen className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                <p>Belum ada penugasan mengajar tercatat</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-xs font-semibold text-slate-400 uppercase">
                      <th className="py-2.5 px-3">Mata Pelajaran</th>
                      <th className="py-2.5 px-3">Kode</th>
                      <th className="py-2.5 px-3">Kategori</th>
                      <th className="py-2.5 px-3">Tahun Ajaran</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {teacher.teacherSubjects.map((ts, i) => (
                      <tr key={i}>
                        <td className="py-2.5 px-3 font-medium text-slate-900">{ts.subject.name}</td>
                        <td className="py-2.5 px-3 font-mono text-xs text-slate-600">{ts.subject.code}</td>
                        <td className="py-2.5 px-3 text-slate-600">{ts.subject.category || '-'}</td>
                        <td className="py-2.5 px-3 text-slate-600">{ts.academicYear.name} ({ts.academicYear.semester})</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Jadwal */}
        {activeTab === 'jadwal' && (
          <div className="space-y-4">
            {(!teacher.schedules || teacher.schedules.length === 0) ? (
              <div className="text-center py-12 text-slate-400">
                <CalendarDays className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                <p>Belum ada data jadwal mengajar</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-xs font-semibold text-slate-400 uppercase">
                      <th className="py-2.5 px-3">Hari</th>
                      <th className="py-2.5 px-3">Jam</th>
                      <th className="py-2.5 px-3">Mata Pelajaran</th>
                      <th className="py-2.5 px-3">Kelas</th>
                      <th className="py-2.5 px-3">Ruangan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {teacher.schedules.map((s) => (
                      <tr key={s.id}>
                        <td className="py-2.5 px-3 font-medium text-slate-900">{DAY_LABEL[s.dayOfWeek] || s.dayOfWeek}</td>
                        <td className="py-2.5 px-3 font-mono text-xs text-slate-600">{s.startTime} – {s.endTime}</td>
                        <td className="py-2.5 px-3 text-slate-700">{s.subject.name}</td>
                        <td className="py-2.5 px-3">
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-xs font-medium">{s.class.name}</span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-500 text-xs">{s.room || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Absensi */}
        {activeTab === 'absensi' && (
          <div className="overflow-x-auto">
            {(!teacher.attendances || teacher.attendances.length === 0) ? (
              <div className="text-center py-12 text-slate-400">
                <ClipboardList className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                <p>Belum ada riwayat absensi tercatat</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-xs font-semibold text-slate-400 uppercase">
                    <th className="py-2.5 px-3">Tanggal</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Jam Masuk</th>
                    <th className="py-2.5 px-3">Jam Keluar</th>
                    <th className="py-2.5 px-3">Catatan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {teacher.attendances.map((a) => (
                    <tr key={a.id}>
                      <td className="py-2.5 px-3 font-medium text-slate-900">
                        {new Date(a.date).toLocaleDateString('id-ID', { dateStyle: 'medium' })}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          a.status === 'HADIR' ? 'bg-emerald-50 text-emerald-700' :
                          a.status === 'SAKIT' ? 'bg-amber-50 text-amber-700' :
                          a.status === 'IZIN' ? 'bg-blue-50 text-blue-700' :
                          'bg-rose-50 text-rose-700'
                        }`}>{a.status}</span>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-xs text-slate-600">{a.checkInTime ? new Date(a.checkInTime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'}</td>
                      <td className="py-2.5 px-3 font-mono text-xs text-slate-600">{a.checkOutTime ? new Date(a.checkOutTime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'}</td>
                      <td className="py-2.5 px-3 text-slate-500 text-xs">{a.notes || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
