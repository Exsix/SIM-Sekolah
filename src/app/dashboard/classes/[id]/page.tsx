'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import {
  ArrowLeft,
  Pencil,
  School,
  Users,
  MapPin,
  Calendar,
  UserPlus,
  Trash2,
  CalendarDays,
  Loader2,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  User,
  Plus,
  BookOpen
} from 'lucide-react';

interface ClassDetail {
  id: string;
  name: string;
  gradeLevel: number;
  major: string | null;
  room: string | null;
  capacity: number;
  isActive: boolean;
  homeroomTeacher: {
    id: string;
    name: string;
    nip: string | null;
    phone: string | null;
    email: string | null;
    photoUrl: string | null;
    position: string | null;
  } | null;
  academicYear: {
    id: string;
    name: string;
    semester: string;
    isActive: boolean;
  } | null;
  students: Array<{
    id: string;
    nis: string;
    nisn: string | null;
    name: string;
    gender: 'LAKI_LAKI' | 'PEREMPUAN';
    status: string;
    photoUrl: string | null;
    phone: string | null;
    email: string | null;
  }>;
  schedules: Array<{
    id: string;
    dayOfWeek: string;
    startTime: string;
    endTime: string;
    room: string | null;
    subject: { id: string; name: string; code: string };
    teacher: { id: string; name: string };
  }>;
  _count: {
    students: number;
    schedules: number;
  };
}

interface CandidateStudent {
  id: string;
  nis: string;
  nisn: string | null;
  name: string;
  gender: string;
  classId: string | null;
  class?: { id: string; name: string } | null;
}

export default function ClassDetailPage() {
  const params = useParams();
  const id = params?.id as string;

  const [classData, setClassData] = useState<ClassDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'roster' | 'schedules' | 'info'>('roster');

  // Modal Placement State
  const [showPlacementModal, setShowPlacementModal] = useState(false);
  const [candidates, setCandidates] = useState<CandidateStudent[]>([]);
  const [loadingCandidates, setLoadingCandidates] = useState(false);
  const [candidateSearch, setCandidateSearch] = useState('');
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [placing, setPlacing] = useState(false);
  const [placementError, setPlacementError] = useState<string | null>(null);

  // Removing student state
  const [removingStudentId, setRemovingStudentId] = useState<string | null>(null);

  const fetchClassDetail = useCallback(async () => {
    try {
      const res = await fetch(`/api/classes/${id}`);
      if (!res.ok) throw new Error('Class not found');
      const json = await res.json();
      setClassData(json.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) fetchClassDetail();
  }, [id, fetchClassDetail]);

  // Load candidate students for placement
  const loadCandidates = useCallback(async () => {
    setLoadingCandidates(true);
    setPlacementError(null);
    try {
      const params = new URLSearchParams({
        search: candidateSearch,
        onlyUnassigned: 'false',
      });
      const res = await fetch(`/api/classes/${id}/students?${params.toString()}`);
      const json = await res.json();
      if (json.data) {
        setCandidates(json.data);
      }
    } catch {
      setPlacementError('Gagal memuat kandidat siswa');
    } finally {
      setLoadingCandidates(false);
    }
  }, [id, candidateSearch]);

  useEffect(() => {
    if (showPlacementModal) {
      loadCandidates();
    }
  }, [showPlacementModal, loadCandidates]);

  // Handle student placement
  const handlePlaceStudents = async () => {
    if (selectedStudentIds.length === 0) return;
    setPlacing(true);
    setPlacementError(null);
    try {
      const res = await fetch(`/api/classes/${id}/students`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentIds: selectedStudentIds }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Gagal menempatkan siswa');

      setShowPlacementModal(false);
      setSelectedStudentIds([]);
      fetchClassDetail();
    } catch (err: unknown) {
      setPlacementError(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setPlacing(false);
    }
  };

  // Handle remove student from class
  const handleRemoveStudent = async (studentId: string, studentName: string) => {
    if (!confirm(`Keluarkan ${studentName} dari kelas ${classData?.name}?`)) return;
    setRemovingStudentId(studentId);
    try {
      const res = await fetch(`/api/classes/${id}/students?studentId=${studentId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        fetchClassDetail();
      } else {
        const json = await res.json();
        alert(json.error || 'Gagal mengeluarkan siswa');
      }
    } catch {
      alert('Terjadi kesalahan sistem');
    } finally {
      setRemovingStudentId(null);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-600 mb-3" />
        <p className="text-sm text-slate-500">Memuat informasi kelas...</p>
      </div>
    );
  }

  if (!classData) {
    return (
      <div className="py-24 text-center">
        <School className="w-12 h-12 mx-auto text-slate-300 mb-3" />
        <p className="text-base font-semibold text-slate-800">Kelas tidak ditemukan</p>
        <Link
          href="/dashboard/classes"
          className="mt-4 inline-flex items-center text-sm text-indigo-600 font-medium hover:underline"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Kembali ke Daftar Kelas
        </Link>
      </div>
    );
  }

  const studentCount = classData.students?.length || 0;
  const capacity = classData.capacity || 36;
  const percentage = Math.min(100, Math.round((studentCount / capacity) * 100));

  return (
    <div className="space-y-6">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard/classes"
          className="inline-flex items-center text-sm font-medium text-slate-600 hover:text-slate-900 transition"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          Kembali ke Daftar Kelas
        </Link>
        <Link
          href={`/dashboard/classes/${classData.id}/edit`}
          className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl shadow-xs transition"
        >
          <Pencil className="w-4 h-4 mr-2" />
          Edit Data Kelas
        </Link>
      </div>

      {/* Hero Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                {classData.name}
              </h1>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                Tingkat {classData.gradeLevel} • {classData.major || 'Umum'}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                {classData.academicYear?.name} ({classData.academicYear?.semester})
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
              <span className="inline-flex items-center">
                <MapPin className="w-3.5 h-3.5 mr-1 text-slate-400" />
                Ruang: <strong className="text-slate-700 ml-1">{classData.room || '-'}</strong>
              </span>
              <span>•</span>
              <span className="inline-flex items-center">
                <Users className="w-3.5 h-3.5 mr-1 text-slate-400" />
                Wali Kelas:{' '}
                <strong className="text-slate-700 ml-1">
                  {classData.homeroomTeacher?.name || 'Belum Ditentukan'}
                </strong>
              </span>
            </div>
          </div>

          {/* Kapasitas Indicator Card */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 min-w-[220px]">
            <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
              <span className="text-slate-500">Kapasitas Rombel</span>
              <span className="text-slate-900 font-mono">
                {studentCount} / {capacity}
              </span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden mb-1">
              <div
                className={`h-full rounded-full transition-all ${
                  percentage >= 100
                    ? 'bg-rose-500'
                    : percentage >= 80
                    ? 'bg-amber-500'
                    : 'bg-indigo-600'
                }`}
                style={{ width: `${percentage}%` }}
              />
            </div>
            <span className="text-[11px] text-slate-400">
              {capacity - studentCount > 0
                ? `Tersisa ${capacity - studentCount} kursi kosong`
                : 'Kelas sudah penuh'}
            </span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-100 mt-8 space-x-2 overflow-x-auto text-sm">
          <button
            onClick={() => setActiveTab('roster')}
            className={`pb-3 px-3 font-medium transition whitespace-nowrap border-b-2 flex items-center space-x-2 ${
              activeTab === 'roster'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Daftar Siswa (Roster) ({studentCount})</span>
          </button>

          <button
            onClick={() => setActiveTab('schedules')}
            className={`pb-3 px-3 font-medium transition whitespace-nowrap border-b-2 flex items-center space-x-2 ${
              activeTab === 'schedules'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <CalendarDays className="w-4 h-4" />
            <span>Jadwal Pelajaran ({classData.schedules?.length || 0})</span>
          </button>

          <button
            onClick={() => setActiveTab('info')}
            className={`pb-3 px-3 font-medium transition whitespace-nowrap border-b-2 flex items-center space-x-2 ${
              activeTab === 'info'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <School className="w-4 h-4" />
            <span>Profil Wali Kelas & Ruangan</span>
          </button>
        </div>
      </div>

      {/* TAB CONTENTS */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
        {/* ======================================================== */}
        {/* TAB 1: DAFTAR SISWA (ROSTER)                             */}
        {/* ======================================================== */}
        {activeTab === 'roster' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-semibold text-slate-900">
                  Daftar Siswa Terdaftar di Rombel
                </h3>
                <p className="text-xs text-slate-500">
                  Total {studentCount} siswa aktif menempuh pembelajaran di rombel ini
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowPlacementModal(true)}
                className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs transition"
              >
                <UserPlus className="w-4 h-4 mr-1.5" />
                Tempatkan Siswa ke Kelas Ini
              </button>
            </div>

            {studentCount === 0 ? (
              <div className="text-center py-16 text-slate-400">
                <Users className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                <p className="font-medium text-slate-700">Belum ada siswa yang ditempatkan di kelas ini</p>
                <p className="text-xs text-slate-400 mt-1">
                  Klik tombol &quot;Tempatkan Siswa ke Kelas Ini&quot; untuk menambahkan siswa
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-100 text-xs font-semibold text-slate-400 uppercase">
                      <th className="py-3 px-3 w-12 text-center">No</th>
                      <th className="py-3 px-3">Siswa</th>
                      <th className="py-3 px-3">NIS / NISN</th>
                      <th className="py-3 px-3">Jenis Kelamin</th>
                      <th className="py-3 px-3">Kontak Siswa</th>
                      <th className="py-3 px-3 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {classData.students.map((student, idx) => (
                      <tr key={student.id} className="hover:bg-slate-50/70 transition">
                        <td className="py-3 px-3 text-center font-mono text-xs text-slate-400">
                          {idx + 1}
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex items-center space-x-3">
                            <div className="relative w-8 h-8 rounded-full overflow-hidden bg-slate-100 border border-slate-200 flex-shrink-0 flex items-center justify-center">
                              {student.photoUrl ? (
                                <Image
                                  src={student.photoUrl}
                                  alt={student.name}
                                  fill
                                  className="object-cover"
                                />
                              ) : (
                                <User className="w-4 h-4 text-slate-400" />
                              )}
                            </div>
                            <Link
                              href={`/dashboard/students/${student.id}`}
                              className="font-medium text-slate-900 hover:text-indigo-600 transition"
                            >
                              {student.name}
                            </Link>
                          </div>
                        </td>
                        <td className="py-3 px-3 font-mono text-xs text-slate-600">
                          <div>{student.nis}</div>
                          {student.nisn && <div className="text-slate-400">{student.nisn}</div>}
                        </td>
                        <td className="py-3 px-3 text-slate-600 text-xs">
                          {student.gender === 'LAKI_LAKI' ? 'Laki-laki' : 'Perempuan'}
                        </td>
                        <td className="py-3 px-3 text-slate-600 text-xs font-mono">
                          {student.phone || student.email || '-'}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button
                            type="button"
                            onClick={() => handleRemoveStudent(student.id, student.name)}
                            disabled={removingStudentId === student.id}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            title="Keluarkan dari kelas"
                          >
                            {removingStudentId === student.id ? (
                              <Loader2 className="w-4 h-4 animate-spin text-rose-600" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 2: JADWAL PELAJARAN                                  */}
        {/* ======================================================== */}
        {activeTab === 'schedules' && (
          <div className="space-y-4">
            {classData.schedules.length === 0 ? (
              <div className="text-center py-16 text-slate-400">
                <CalendarDays className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                <p className="font-medium text-slate-700">Belum ada jadwal pelajaran untuk kelas ini</p>
                <p className="text-xs text-slate-400 mt-1">
                  Plot jadwal dapat dikonfigurasikan di modul Jadwal Pelajaran
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-xs font-semibold text-slate-400 uppercase">
                      <th className="py-2.5 px-3">Hari</th>
                      <th className="py-2.5 px-3">Jam Belajar</th>
                      <th className="py-2.5 px-3">Mata Pelajaran</th>
                      <th className="py-2.5 px-3">Guru Pengampu</th>
                      <th className="py-2.5 px-3">Ruangan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {classData.schedules.map((s) => (
                      <tr key={s.id}>
                        <td className="py-2.5 px-3 font-semibold text-slate-900">
                          {s.dayOfWeek}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-xs text-slate-600">
                          {s.startTime} - {s.endTime}
                        </td>
                        <td className="py-2.5 px-3 font-medium text-slate-900">
                          {s.subject.name} ({s.subject.code})
                        </td>
                        <td className="py-2.5 px-3 text-slate-700">
                          {s.teacher.name}
                        </td>
                        <td className="py-2.5 px-3 text-slate-500 text-xs">
                          {s.room || classData.room || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 3: INFORMASI WALI KELAS & RUANGAN                   */}
        {/* ======================================================== */}
        {activeTab === 'info' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Wali Kelas Card */}
            <div className="p-5 rounded-2xl border border-slate-200/80 bg-slate-50/50 space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b pb-2">
                Profil Wali Kelas
              </h4>
              {classData.homeroomTeacher ? (
                <div className="space-y-3 text-sm">
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white font-bold text-lg flex items-center justify-center">
                      {classData.homeroomTeacher.name[0]}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900">
                        {classData.homeroomTeacher.name}
                      </h4>
                      <p className="text-xs font-mono text-slate-500">
                        NIP: {classData.homeroomTeacher.nip || '-'}
                      </p>
                    </div>
                  </div>
                  <div className="text-xs text-slate-600 space-y-1.5 pt-2 border-t border-slate-100">
                    <div>No. HP / WA: <strong className="text-slate-800">{classData.homeroomTeacher.phone || '-'}</strong></div>
                    <div>Email: <strong className="text-slate-800">{classData.homeroomTeacher.email || '-'}</strong></div>
                  </div>
                  <Link
                    href={`/dashboard/teachers/${classData.homeroomTeacher.id}`}
                    className="inline-flex items-center text-xs font-semibold text-indigo-600 hover:underline pt-2"
                  >
                    Lihat Profil Pendidik Lengkap →
                  </Link>
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">
                  Wali kelas belum ditentukan untuk rombel ini.
                </p>
              )}
            </div>

            {/* Ruangan Card */}
            <div className="p-5 rounded-2xl border border-slate-200/80 bg-slate-50/50 space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b pb-2">
                Detail Ruang Belajar
              </h4>
              <div className="space-y-2.5 text-sm">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500 text-xs">Ruang Kelas</span>
                  <span className="font-semibold text-slate-900">{classData.room || '-'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500 text-xs">Kapasitas Maksimal</span>
                  <span className="font-semibold text-slate-900">{classData.capacity} Siswa</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500 text-xs">Siswa Terdaftar</span>
                  <span className="font-semibold text-indigo-600">{studentCount} Siswa</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500 text-xs">Status Rombel</span>
                  <span className="font-semibold text-emerald-600">Aktif</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* MODAL: TEMPATKAN SISWA KE KELAS                          */}
      {/* ======================================================== */}
      {showPlacementModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Tempatkan Siswa ke Kelas {classData.name}
                </h3>
                <p className="text-xs text-slate-500">
                  Tersisa {capacity - studentCount} kuota kursi kosong di rombel ini
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowPlacementModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-semibold"
              >
                ✕
              </button>
            </div>

            {placementError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{placementError}</span>
              </div>
            )}

            {/* Candidate Search */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Cari nama atau NIS siswa..."
                value={candidateSearch}
                onChange={(e) => setCandidateSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              />
            </div>

            {/* Candidate List with Checkbox */}
            <div className="max-h-72 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100">
              {loadingCandidates ? (
                <div className="p-8 text-center text-xs text-slate-500">
                  <Loader2 className="w-5 h-5 animate-spin mx-auto text-indigo-600 mb-2" />
                  Memuat data siswa...
                </div>
              ) : candidates.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500">
                  Tidak ada data siswa ditemukan
                </div>
              ) : (
                candidates.map((c) => {
                  const isChecked = selectedStudentIds.includes(c.id);
                  return (
                    <label
                      key={c.id}
                      className="p-3 flex items-center justify-between hover:bg-slate-50 cursor-pointer transition text-xs"
                    >
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedStudentIds([...selectedStudentIds, c.id]);
                            } else {
                              setSelectedStudentIds(
                                selectedStudentIds.filter((sid) => sid !== c.id)
                              );
                            }
                          }}
                          className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                        />
                        <div>
                          <p className="font-semibold text-slate-900">{c.name}</p>
                          <span className="font-mono text-slate-400">NIS: {c.nis}</span>
                        </div>
                      </div>

                      <div>
                        {c.class ? (
                          <span className="px-2 py-0.5 rounded text-[10px] bg-amber-50 text-amber-700 font-medium border border-amber-200">
                            Pindah dari {c.class.name}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-50 text-emerald-700 font-medium border border-emerald-200">
                            Belum Punya Kelas
                          </span>
                        )}
                      </div>
                    </label>
                  );
                })
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-slate-500">
                {selectedStudentIds.length} siswa dipilih
              </span>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setShowPlacementModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handlePlaceStudents}
                  disabled={placing || selectedStudentIds.length === 0}
                  className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs disabled:opacity-50 transition"
                >
                  {placing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    `Tempatkan (${selectedStudentIds.length}) Siswa`
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
