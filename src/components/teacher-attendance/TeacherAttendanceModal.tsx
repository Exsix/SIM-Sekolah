'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Save,
  Clock,
  User,
  AlertCircle,
  Loader2,
  Calendar,
  FileText
} from 'lucide-react';
import { AttendanceStatus } from '@prisma/client';

interface TeacherAttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  teacher: any | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  attendance: any | null;
  date: string;
}

export default function TeacherAttendanceModal({
  isOpen,
  onClose,
  onSuccess,
  teacher,
  attendance,
  date,
}: TeacherAttendanceModalProps) {
  const [status, setStatus] = useState<AttendanceStatus>(AttendanceStatus.HADIR);
  const [checkInTime, setCheckInTime] = useState('07:00');
  const [checkOutTime, setCheckOutTime] = useState('15:30');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (attendance) {
      setStatus(attendance.status || AttendanceStatus.HADIR);
      if (attendance.checkInTime) {
        const d = new Date(attendance.checkInTime);
        setCheckInTime(`${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`);
      } else {
        setCheckInTime('');
      }
      if (attendance.checkOutTime) {
        const d = new Date(attendance.checkOutTime);
        setCheckOutTime(`${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`);
      } else {
        setCheckOutTime('');
      }
      setNotes(attendance.notes || '');
    } else {
      setStatus(AttendanceStatus.HADIR);
      setCheckInTime('07:00');
      setCheckOutTime('15:30');
      setNotes('');
    }
    setErrorMsg(null);
  }, [attendance, isOpen]);

  if (!isOpen || !teacher) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/teacher-attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teacherId: teacher.id,
          date,
          status,
          checkInTime: status === 'HADIR' || status === 'DISPENSASI' ? checkInTime || null : null,
          checkOutTime: status === 'HADIR' || status === 'DISPENSASI' ? checkOutTime || null : null,
          notes: notes.trim() || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menyimpan presensi');

      onSuccess();
      onClose();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Terjadi kesalahan sistem');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xl max-w-md w-full my-8 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-950 to-indigo-950 p-6 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-white/10 rounded-xl">
              <Clock className="w-5 h-5 text-indigo-300" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold">Input / Koreksi Presensi Guru</h2>
              <p className="text-[11px] text-slate-300 font-mono">
                {new Date(date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="p-1.5 text-slate-400 hover:text-white rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center space-x-2 text-rose-700">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Teacher Info Card */}
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white font-bold flex items-center justify-center text-sm">
              {teacher.name.charAt(0)}
            </div>
            <div>
              <p className="font-extrabold text-slate-900">{teacher.name}</p>
              <p className="text-[11px] text-slate-500 font-mono">NIP: {teacher.nip} • {teacher.position || 'Guru'}</p>
            </div>
          </div>

          {/* Status Kehadiran */}
          <div>
            <label className="block text-slate-600 font-bold mb-1.5">Status Kehadiran</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { val: AttendanceStatus.HADIR, label: 'HADIR', color: 'peer-checked:bg-emerald-500 peer-checked:text-white border-emerald-200' },
                { val: AttendanceStatus.DISPENSASI, label: 'DINAS LUAR', color: 'peer-checked:bg-indigo-500 peer-checked:text-white border-indigo-200' },
                { val: AttendanceStatus.IZIN, label: 'IZIN', color: 'peer-checked:bg-blue-500 peer-checked:text-white border-blue-200' },
                { val: AttendanceStatus.SAKIT, label: 'SAKIT', color: 'peer-checked:bg-amber-500 peer-checked:text-white border-amber-200' },
                { val: AttendanceStatus.ALPA, label: 'ALPA', color: 'peer-checked:bg-rose-500 peer-checked:text-white border-rose-200' },
              ].map((item) => (
                <label
                  key={item.val}
                  className="cursor-pointer"
                >
                  <input
                    type="radio"
                    name="status"
                    value={item.val}
                    checked={status === item.val}
                    onChange={() => setStatus(item.val)}
                    className="peer sr-only"
                  />
                  <div className={`p-2.5 rounded-xl border text-center font-bold text-[10px] transition ${item.color} bg-slate-50 text-slate-700 hover:bg-slate-100`}>
                    {item.label}
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Jam Masuk & Pulang (jika Hadir / Dinas) */}
          {(status === AttendanceStatus.HADIR || status === AttendanceStatus.DISPENSASI) && (
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-slate-600 font-bold mb-1">Jam Masuk</label>
                <input
                  type="time"
                  value={checkInTime}
                  onChange={(e) => setCheckInTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono"
                />
              </div>
              <div>
                <label className="block text-slate-600 font-bold mb-1">Jam Pulang</label>
                <input
                  type="time"
                  value={checkOutTime}
                  onChange={(e) => setCheckOutTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono"
                />
              </div>
            </div>
          )}

          {/* Catatan */}
          <div>
            <label className="block text-slate-600 font-bold mb-1">Catatan / Keterangan Tambahan</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Contoh: Mengikuti dinas rapat di dinas pendidikan, surat tugas terlampir"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold transition"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-md shadow-indigo-600/20 transition flex items-center space-x-1.5 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              <span>Simpan Presensi</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
