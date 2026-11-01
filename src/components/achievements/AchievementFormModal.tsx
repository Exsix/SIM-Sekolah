'use client';

import React, { useState, useEffect } from 'react';
import { X, Award, Trophy, Loader2, Link2, Calendar, Building2, User, FileText, CheckCircle2, Star } from 'lucide-react';

interface StudentOption {
  id: string;
  name: string;
  nis: string;
  class?: { name: string } | null;
}

export interface AchievementItem {
  id: string;
  studentId: string;
  title: string;
  category: string;
  level: string;
  rank: string;
  date: string;
  organizer: string;
  description: string | null;
  proofUrl: string | null;
  isVerified: boolean;
  isFeatured: boolean;
  student: {
    id: string;
    name: string;
    nis: string;
    nisn?: string | null;
    gender?: string;
    photoUrl?: string | null;
    class?: { id: string; name: string } | null;
  };
}

interface AchievementFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  achievementToEdit?: AchievementItem | null;
  currentUserRole: string;
  currentStudentId?: string | null;
}

export default function AchievementFormModal({
  isOpen,
  onClose,
  onSuccess,
  achievementToEdit,
  currentUserRole,
  currentStudentId,
}: AchievementFormModalProps) {
  const isStaff = ['SUPER_ADMIN', 'ADMIN', 'KEPALA_SEKOLAH', 'GURU', 'WALI_KELAS'].includes(currentUserRole);

  const [students, setStudents] = useState<StudentOption[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Form State
  const [studentId, setStudentId] = useState('');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('AKADEMIK');
  const [level, setLevel] = useState('SEKOLAH');
  const [rank, setRank] = useState('Juara 1');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [organizer, setOrganizer] = useState('');
  const [description, setDescription] = useState('');
  const [proofUrl, setProofUrl] = useState('');
  const [isVerified, setIsVerified] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);

  // Fetch student options if staff
  useEffect(() => {
    if (!isOpen) return;

    if (isStaff) {
      setLoadingStudents(true);
      fetch('/api/students?limit=200&sortBy=name&order=asc')
        .then((res) => res.json())
        .then((data) => {
          if (data.data) {
            setStudents(data.data);
          }
        })
        .catch(console.error)
        .finally(() => setLoadingStudents(false));
    }

    if (achievementToEdit) {
      setStudentId(achievementToEdit.studentId);
      setTitle(achievementToEdit.title);
      setCategory(achievementToEdit.category);
      setLevel(achievementToEdit.level);
      setRank(achievementToEdit.rank);
      setDate(achievementToEdit.date.split('T')[0]);
      setOrganizer(achievementToEdit.organizer);
      setDescription(achievementToEdit.description || '');
      setProofUrl(achievementToEdit.proofUrl || '');
      setIsVerified(achievementToEdit.isVerified);
      setIsFeatured(achievementToEdit.isFeatured);
    } else {
      setStudentId(currentStudentId || '');
      setTitle('');
      setCategory('SAINS_TEKNOLOGI');
      setLevel('NASIONAL');
      setRank('Juara 1');
      setDate(new Date().toISOString().split('T')[0]);
      setOrganizer('');
      setDescription('');
      setProofUrl('');
      setIsVerified(isStaff);
      setIsFeatured(false);
    }
    setErrorMsg('');
  }, [isOpen, achievementToEdit, isStaff, currentStudentId]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const targetStudent = isStaff ? studentId : currentStudentId;
    if (!targetStudent) {
      setErrorMsg('Pilih siswa yang meraih prestasi ini.');
      return;
    }

    if (!title.trim()) {
      setErrorMsg('Nama kejuaraan atau prestasi wajib diisi.');
      return;
    }

    if (!organizer.trim()) {
      setErrorMsg('Instansi atau lembaga penyelenggara wajib diisi.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        studentId: targetStudent,
        title: title.trim(),
        category,
        level,
        rank: rank.trim(),
        date,
        organizer: organizer.trim(),
        description: description.trim() || null,
        proofUrl: proofUrl.trim() || null,
        isVerified: isStaff ? isVerified : false,
        isFeatured: isStaff ? isFeatured : false,
      };

      const url = achievementToEdit
        ? `/api/achievements/${achievementToEdit.id}`
        : '/api/achievements';
      const method = achievementToEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const resJson = await res.json();
      if (!res.ok) {
        throw new Error(resJson.error || 'Gagal menyimpan prestasi');
      }

      onSuccess();
      onClose();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Terjadi kesalahan sistem');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">
                {achievementToEdit ? 'Edit Catatan Prestasi' : 'Catat Prestasi & Kejuaraan Siswa'}
              </h2>
              <p className="text-xs text-slate-400">
                {isStaff
                  ? 'Dokumentasikan perolehan medali, piagam, dan reputasi siswa'
                  : 'Ajukan portofolio prestasi Anda untuk diverifikasi kesiswaan'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <span className="font-semibold">Perhatian:</span> {errorMsg}
            </div>
          )}

          {/* Student Picker (Only for Staff) */}
          {isStaff && (
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Pilih Siswa Peraih Prestasi <span className="text-rose-400">*</span>
              </label>
              {loadingStudents ? (
                <div className="flex items-center gap-2 text-xs text-slate-400 py-2">
                  <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                  <span>Memuat daftar siswa aktif...</span>
                </div>
              ) : (
                <div className="relative">
                  <select
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    required
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition appearance-none"
                  >
                    <option value="">-- Pilih Siswa --</option>
                    {students.map((st) => (
                      <option key={st.id} value={st.id}>
                        {st.name} (NIS: {st.nis}) {st.class ? `- ${st.class.name}` : ''}
                      </option>
                    ))}
                  </select>
                  <User className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
                </div>
              )}
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Nama Lomba / Prestasi / Kejuaraan <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Contoh: Olimpiade Sains Nasional (OSN) Bidang Informatika"
                required
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
              />
              <Award className="w-4 h-4 text-slate-500 absolute right-3 top-3" />
            </div>
          </div>

          {/* Category & Level */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Kategori Bidang <span className="text-rose-400">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
              >
                <option value="SAINS_TEKNOLOGI">Sains, Robotik & Teknologi</option>
                <option value="AKADEMIK">Akademik & Riset Ilmiah</option>
                <option value="OLAHRAGA">Olahraga & Bela Diri</option>
                <option value="SENI">Seni, Musik & Desain</option>
                <option value="KEAGAMAAN">Keagamaan & Musabaqah</option>
                <option value="ORGANISASI">Kepemimpinan & Organisasi</option>
                <option value="LAINNYA">Lainnya</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Tingkat Kompetisi <span className="text-rose-400">*</span>
              </label>
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
              >
                <option value="SEKOLAH">Tingkat Sekolah</option>
                <option value="KECAMATAN">Tingkat Kecamatan</option>
                <option value="KABUPATEN_KOTA">Tingkat Kota / Kabupaten</option>
                <option value="PROVINSI">Tingkat Provinsi</option>
                <option value="NASIONAL">Tingkat Nasional</option>
                <option value="INTERNASIONAL">Tingkat Internasional</option>
              </select>
            </div>
          </div>

          {/* Rank & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Peringkat / Capaian Juara <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={rank}
                onChange={(e) => setRank(e.target.value)}
                placeholder="Contoh: Juara 1 / Medali Emas / Finalis"
                required
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Tanggal Perolehan <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                />
                <Calendar className="w-4 h-4 text-slate-500 absolute right-3 top-3 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Organizer */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Lembaga / Instansi Penyelenggara <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={organizer}
                onChange={(e) => setOrganizer(e.target.value)}
                placeholder="Contoh: Pusat Prestasi Nasional Kemendikbudristek / Pemprov DKI"
                required
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
              />
              <Building2 className="w-4 h-4 text-slate-500 absolute right-3 top-3 pointer-events-none" />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Deskripsi Singkat / Catatan Kompetisi
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Jelaskan detail perolehan, babak yang dilalui, karya yang dipresentasikan, dsb..."
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition resize-none"
            />
          </div>

          {/* Proof URL */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Tautan Bukti Sertifikat / Piagam (Google Drive / Cloud PDF)
            </label>
            <div className="relative">
              <input
                type="url"
                value={proofUrl}
                onChange={(e) => setProofUrl(e.target.value)}
                placeholder="https://drive.google.com/file/d/... atau URL sertifikat"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
              />
              <Link2 className="w-4 h-4 text-slate-500 absolute right-3 top-3" />
            </div>
          </div>

          {/* Staff Controls: Verified & Featured */}
          {isStaff && (
            <div className="pt-2 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-950/60 border border-slate-800 cursor-pointer hover:border-slate-700 transition">
                <input
                  type="checkbox"
                  checked={isVerified}
                  onChange={(e) => setIsVerified(e.target.checked)}
                  className="rounded bg-slate-900 border-slate-700 text-emerald-500 focus:ring-emerald-500 w-4 h-4"
                />
                <div>
                  <span className="text-xs font-medium text-slate-200 block">Status Terverifikasi</span>
                  <span className="text-[10px] text-slate-400">Prestasi resmi diakui kesiswaan sekolah</span>
                </div>
              </label>

              <label className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-950/60 border border-slate-800 cursor-pointer hover:border-slate-700 transition">
                <input
                  type="checkbox"
                  checked={isFeatured}
                  onChange={(e) => setIsFeatured(e.target.checked)}
                  className="rounded bg-slate-900 border-slate-700 text-amber-500 focus:ring-amber-500 w-4 h-4"
                />
                <div>
                  <span className="text-xs font-medium text-slate-200 block flex items-center gap-1">
                    <Star className="w-3 h-3 text-amber-400 fill-amber-400" /> Prestasi Unggulan
                  </span>
                  <span className="text-[10px] text-slate-400">Sorot di Hall of Fame beranda sekolah</span>
                </div>
              </label>
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-800 bg-slate-900/90 sticky bottom-0">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            Batal
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={submitting}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold shadow-lg shadow-amber-500/20 transition disabled:opacity-50"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                <span>Menyimpan...</span>
              </>
            ) : (
              <>
                <Trophy className="w-4 h-4" />
                <span>{achievementToEdit ? 'Simpan Perubahan' : 'Catat Prestasi'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
