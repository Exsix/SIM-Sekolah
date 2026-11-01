'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Calendar,
  Clock,
  BookOpen,
  Users,
  MapPin,
  X,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Plus,
  Save,
  School
} from 'lucide-react';
import { DayOfWeek } from '@prisma/client';

interface ScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: {
    id?: string;
    classId?: string;
    subjectId?: string;
    teacherId?: string;
    dayOfWeek?: DayOfWeek;
    startTime?: string;
    endTime?: string;
    room?: string | null;
  } | null;
  defaultClassId?: string;
  defaultTeacherId?: string;
  defaultDay?: DayOfWeek;
}

interface ClassItem {
  id: string;
  name: string;
  gradeLevel: number;
  room: string | null;
}

interface SubjectItem {
  id: string;
  code: string;
  name: string;
  category: string | null;
  teacherSubject: Array<{
    teacher: { id: string; name: string };
  }>;
}

interface TeacherItem {
  id: string;
  name: string;
  nip: string | null;
}

const TIME_PRESETS = [
  { label: '07:00 - 08:30', start: '07:00', end: '08:30' },
  { label: '07:30 - 09:00', start: '07:30', end: '09:00' },
  { label: '09:15 - 10:45', start: '09:15', end: '10:45' },
  { label: '11:00 - 12:30', start: '11:00', end: '12:30' },
  { label: '13:00 - 14:30', start: '13:00', end: '14:30' },
  { label: '14:30 - 16:00', start: '14:30', end: '16:00' },
];

const DAYS: Array<{ key: DayOfWeek; label: string }> = [
  { key: 'SENIN', label: 'Senin' },
  { key: 'SELASA', label: 'Selasa' },
  { key: 'RABU', label: 'Rabu' },
  { key: 'KAMIS', label: 'Kamis' },
  { key: 'JUMAT', label: 'Jumat' },
  { key: 'SABTU', label: 'Sabtu' },
];

export default function ScheduleModal({
  isOpen,
  onClose,
  onSuccess,
  initialData,
  defaultClassId,
  defaultTeacherId,
  defaultDay,
}: ScheduleModalProps) {
  const isEdit = Boolean(initialData?.id);

  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [teachers, setTeachers] = useState<TeacherItem[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Form states
  const [classId, setClassId] = useState(initialData?.classId || defaultClassId || '');
  const [subjectId, setSubjectId] = useState(initialData?.subjectId || '');
  const [teacherId, setTeacherId] = useState(initialData?.teacherId || defaultTeacherId || '');
  const [dayOfWeek, setDayOfWeek] = useState<DayOfWeek>(
    initialData?.dayOfWeek || defaultDay || 'SENIN'
  );
  const [startTime, setStartTime] = useState(initialData?.startTime || '07:30');
  const [endTime, setEndTime] = useState(initialData?.endTime || '09:00');
  const [room, setRoom] = useState(initialData?.room || '');

  // Conflict state
  const [conflicts, setConflicts] = useState<Array<{ type: string; message: string }>>([]);
  const [checkingConflict, setCheckingConflict] = useState(false);

  // Submit states
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Reset or initialize values when modal opens
  useEffect(() => {
    if (isOpen) {
      setClassId(initialData?.classId || defaultClassId || '');
      setSubjectId(initialData?.subjectId || '');
      setTeacherId(initialData?.teacherId || defaultTeacherId || '');
      setDayOfWeek(initialData?.dayOfWeek || defaultDay || 'SENIN');
      setStartTime(initialData?.startTime || '07:30');
      setEndTime(initialData?.endTime || '09:00');
      setRoom(initialData?.room || '');
      setConflicts([]);
      setErrorMsg(null);
    }
  }, [isOpen, initialData, defaultClassId, defaultTeacherId, defaultDay]);

  // Load dropdown references
  useEffect(() => {
    if (!isOpen) return;

    async function loadReferences() {
      setLoadingData(true);
      try {
        const [resClasses, resSubjects, resTeachers] = await Promise.all([
          fetch('/api/classes'),
          fetch('/api/subjects?limit=100'),
          fetch('/api/teachers?limit=100'),
        ]);

        const [cJson, sJson, tJson] = await Promise.all([
          resClasses.json(),
          resSubjects.json(),
          resTeachers.json(),
        ]);

        if (cJson.data) setClasses(cJson.data);
        if (sJson.data) setSubjects(sJson.data);
        if (tJson.data) setTeachers(tJson.data);

        // If class has a default room, autofill if empty
        if (!initialData?.room && defaultClassId && cJson.data) {
          const selected = cJson.data.find((c: ClassItem) => c.id === defaultClassId);
          if (selected?.room) setRoom(selected.room);
        }
      } catch (err) {
        console.error('Failed to load references', err);
      } finally {
        setLoadingData(false);
      }
    }

    loadReferences();
  }, [isOpen, defaultClassId, initialData]);

  // Auto-fill room when class changes
  const handleClassChange = (selectedClassId: string) => {
    setClassId(selectedClassId);
    if (!room) {
      const cls = classes.find((c) => c.id === selectedClassId);
      if (cls?.room) setRoom(cls.room);
    }
  };

  // When subject changes, suggest assigned teachers
  const handleSubjectChange = (selectedSubjectId: string) => {
    setSubjectId(selectedSubjectId);
    const sub = subjects.find((s) => s.id === selectedSubjectId);
    if (sub && sub.teacherSubject.length > 0 && !isEdit) {
      // Pick first teacher assigned to this subject if current teacher isn't assigned
      const isCurrentAssigned = sub.teacherSubject.some((ts) => ts.teacher.id === teacherId);
      if (!isCurrentAssigned) {
        setTeacherId(sub.teacherSubject[0].teacher.id);
      }
    }
  };

  // Real-time conflict checker
  const checkConflicts = useCallback(async () => {
    if (!classId || !dayOfWeek || !startTime || !endTime || startTime >= endTime) {
      setConflicts([]);
      return;
    }

    setCheckingConflict(true);
    try {
      const res = await fetch('/api/schedules/check-conflict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          classId,
          teacherId: teacherId || undefined,
          dayOfWeek,
          startTime,
          endTime,
          room: room || undefined,
          excludeScheduleId: initialData?.id,
        }),
      });

      const json = await res.json();
      if (json.conflicts) {
        setConflicts(json.conflicts);
      }
    } catch (err) {
      console.error('Conflict check error', err);
    } finally {
      setCheckingConflict(false);
    }
  }, [classId, teacherId, dayOfWeek, startTime, endTime, room, initialData?.id]);

  useEffect(() => {
    const timer = setTimeout(() => {
      checkConflicts();
    }, 400);
    return () => clearTimeout(timer);
  }, [checkConflicts]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (startTime >= endTime) {
      setErrorMsg('Waktu mulai harus lebih awal daripada waktu selesai');
      return;
    }

    setSubmitting(true);
    try {
      const url = isEdit ? `/api/schedules/${initialData?.id}` : '/api/schedules';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          classId,
          subjectId,
          teacherId,
          dayOfWeek,
          startTime,
          endTime,
          room: room.trim() || null,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || 'Gagal menyimpan jadwal pelajaran');
      }

      onSuccess();
      onClose();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Terjadi kesalahan sistem');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const selectedSubject = subjects.find((s) => s.id === subjectId);
  const assignedTeacherIds = selectedSubject?.teacherSubject.map((ts) => ts.teacher.id) || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xl max-w-xl w-full my-8 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-900 to-indigo-950 p-6 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-white/10 rounded-xl backdrop-blur-md">
              <Calendar className="w-5 h-5 text-indigo-300" />
            </div>
            <div>
              <h2 className="text-lg font-bold">
                {isEdit ? 'Perbarui Jadwal Pelajaran' : 'Plot Jadwal Pelajaran Baru'}
              </h2>
              <p className="text-xs text-indigo-200/80 mt-0.5">
                Konfigurasi rombel, guru, alokasi jam, dan ruang belajar
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

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {errorMsg && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-start space-x-2.5">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Real-time Conflict Warning Banner */}
          {conflicts.length > 0 && (
            <div className="p-3.5 bg-amber-50 border border-amber-300 text-amber-900 rounded-xl text-xs space-y-1.5">
              <div className="flex items-center space-x-2 font-bold text-amber-800">
                <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <span>Terdeteksi Bentrok Jadwal ({conflicts.length}):</span>
              </div>
              <ul className="list-disc pl-5 space-y-1 text-amber-800/90 text-[11px]">
                {conflicts.map((c, i) => (
                  <li key={i}>{c.message}</li>
                ))}
              </ul>
              <p className="text-[10px] text-amber-700 italic pt-1">
                Silakan ganti jam, hari, ruangan, atau pengajar agar tidak terjadi bentrok.
              </p>
            </div>
          )}

          {loadingData ? (
            <div className="py-12 text-center text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-indigo-600 mb-2" />
              <p className="text-xs">Memuat referensi kelas, mapel & guru...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Kelas & Hari */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Kelas / Rombel <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={classId}
                    onChange={(e) => handleClassChange(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 focus:bg-white font-medium"
                  >
                    <option value="">-- Pilih Kelas --</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.room ? `(${c.room})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Hari Pelajaran <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={dayOfWeek}
                    onChange={(e) => setDayOfWeek(e.target.value as DayOfWeek)}
                    required
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 focus:bg-white font-semibold text-slate-800"
                  >
                    {DAYS.map((d) => (
                      <option key={d.key} value={d.key}>
                        {d.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Mata Pelajaran */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Mata Pelajaran <span className="text-rose-500">*</span>
                </label>
                <select
                  value={subjectId}
                  onChange={(e) => handleSubjectChange(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 focus:bg-white font-medium"
                >
                  <option value="">-- Pilih Mata Pelajaran --</option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      [{s.code}] {s.name} ({s.category || 'Umum'})
                    </option>
                  ))}
                </select>
              </div>

              {/* Guru Pengajar */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Guru Pengajar <span className="text-rose-500">*</span>
                  </label>
                  {selectedSubject && (
                    <span className="text-[10px] text-indigo-600 font-medium">
                      {assignedTeacherIds.length} Guru Resmi Ditugaskan
                    </span>
                  )}
                </div>
                <select
                  value={teacherId}
                  onChange={(e) => setTeacherId(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 focus:bg-white font-medium"
                >
                  <option value="">-- Pilih Guru Pengajar --</option>
                  {teachers.map((t) => {
                    const isAssigned = assignedTeacherIds.includes(t.id);
                    return (
                      <option key={t.id} value={t.id}>
                        {t.name} {isAssigned ? '★ (Guru Pengampu Mapel Ini)' : ''}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Waktu & Presets */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Alokasi Waktu Jam Pelajaran <span className="text-rose-500">*</span>
                  </label>
                  {checkingConflict && (
                    <span className="text-[10px] text-slate-400 flex items-center">
                      <Loader2 className="w-3 h-3 animate-spin mr-1 text-indigo-600" />
                      Memeriksa bentrok...
                    </span>
                  )}
                </div>

                {/* Quick Presets */}
                <div className="flex flex-wrap gap-1.5">
                  {TIME_PRESETS.map((p) => {
                    const isSelected = startTime === p.start && endTime === p.end;
                    return (
                      <button
                        key={p.label}
                        type="button"
                        onClick={() => {
                          setStartTime(p.start);
                          setEndTime(p.end);
                        }}
                        className={`text-[11px] font-mono px-2 py-1 rounded-lg border transition ${
                          isSelected
                            ? 'bg-indigo-600 text-white border-indigo-600 font-semibold shadow-2xs'
                            : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'
                        }`}
                      >
                        {p.label}
                      </button>
                    );
                  })}
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">Jam Mulai (HH:mm)</label>
                    <input
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      required
                      className="w-full px-3 py-2 text-xs font-mono font-bold bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">Jam Selesai (HH:mm)</label>
                    <input
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      required
                      className="w-full px-3 py-2 text-xs font-mono font-bold bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 focus:bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Ruangan */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Ruangan Belajar / Laboratorium
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Contoh: R. 101, Lab Komputer 1, Lapangan Utama"
                    value={room}
                    onChange={(e) => setRoom(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 focus:bg-white font-medium"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Sistem otomatis mendeteksi bentrok jika ruangan yang sama dialokasikan ke kelas lain pada jam bersamaan.
                </p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 border border-slate-200 text-slate-700 text-xs font-medium rounded-xl hover:bg-slate-50 transition"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting || loadingData || conflicts.length > 0}
              className="inline-flex items-center px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-xl shadow-xs transition disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5 mr-1.5" />
                  {isEdit ? 'Simpan Perubahan' : 'Jadwalkan Sesi'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
