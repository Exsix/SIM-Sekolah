'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  School,
  Save,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Users,
  MapPin,
  Calendar,
  Layers
} from 'lucide-react';

interface TeacherItem {
  id: string;
  name: string;
  nip: string | null;
}

interface AcademicYearItem {
  id: string;
  name: string;
  semester: string;
  isActive: boolean;
}

interface ClassFormProps {
  initialData?: {
    id?: string;
    name?: string;
    gradeLevel?: number;
    major?: string | null;
    room?: string | null;
    capacity?: number;
    homeroomTeacherId?: string | null;
    academicYearId?: string;
    isActive?: boolean;
  };
  isEdit?: boolean;
}

export default function ClassForm({ initialData, isEdit = false }: ClassFormProps) {
  const router = useRouter();

  const [teachers, setTeachers] = useState<TeacherItem[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYearItem[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);

  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    gradeLevel: initialData?.gradeLevel || 10,
    major: initialData?.major || 'MIPA',
    room: initialData?.room || '',
    capacity: initialData?.capacity || 36,
    homeroomTeacherId: initialData?.homeroomTeacherId || '',
    academicYearId: initialData?.academicYearId || '',
    isActive: initialData?.isActive ?? true,
  });

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    async function loadOptions() {
      try {
        const [teachersRes, yearsRes] = await Promise.all([
          fetch('/api/teachers?limit=100'),
          fetch('/api/academic-years'),
        ]);

        const [teachersData, yearsData] = await Promise.all([
          teachersRes.json(),
          yearsRes.json(),
        ]);

        if (teachersData.data) setTeachers(teachersData.data);
        if (yearsData.data) {
          setAcademicYears(yearsData.data);
          if (!initialData?.academicYearId) {
            const active = yearsData.data.find((y: AcademicYearItem) => y.isActive);
            if (active) {
              setFormData((prev) => ({ ...prev, academicYearId: active.id }));
            }
          }
        }
      } catch (err) {
        console.error('Failed to load options', err);
      } finally {
        setLoadingOptions(false);
      }
    }
    loadOptions();
  }, [initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const payload = {
        name: formData.name.trim(),
        gradeLevel: Number(formData.gradeLevel),
        major: formData.major || null,
        room: formData.room || null,
        capacity: Number(formData.capacity),
        homeroomTeacherId: formData.homeroomTeacherId || null,
        academicYearId: formData.academicYearId || null,
        isActive: formData.isActive,
      };

      const url = isEdit ? `/api/classes/${initialData?.id}` : '/api/classes';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Gagal menyimpan data kelas');
      }

      setSuccessMsg(isEdit ? 'Data kelas berhasil diperbarui!' : 'Kelas baru berhasil dibuat!');
      const classId = isEdit ? initialData?.id : json.data.id;

      setTimeout(() => {
        router.push(`/dashboard/classes/${classId}`);
        router.refresh();
      }, 1000);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Terjadi kesalahan sistem');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl flex items-center space-x-3 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl flex items-center space-x-3 text-sm">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-6">
        <h3 className="text-base font-semibold text-slate-800 border-b border-slate-100 pb-3 flex items-center">
          <School className="w-5 h-5 mr-2 text-indigo-600" />
          Identitas Rombongan Belajar (Kelas)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Nama Kelas */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2">
              Nama Kelas / Rombel <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              placeholder="Contoh: X MIPA 1, XI IPS 2, XII BAHASA"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 focus:bg-white"
              required
            />
          </div>

          {/* Tingkat Kelas */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2">
              Tingkat Kelas <span className="text-rose-500">*</span>
            </label>
            <select
              value={formData.gradeLevel}
              onChange={(e) => setFormData({ ...formData, gradeLevel: parseInt(e.target.value) || 10 })}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 focus:bg-white"
              required
            >
              <option value={10}>Kelas 10 (Fase E)</option>
              <option value={11}>Kelas 11 (Fase F)</option>
              <option value={12}>Kelas 12 (Fase F Lanjutan)</option>
            </select>
          </div>

          {/* Jurusan / Peminatan */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2">
              Jurusan / Peminatan
            </label>
            <select
              value={formData.major}
              onChange={(e) => setFormData({ ...formData, major: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 focus:bg-white"
            >
              <option value="MIPA">MIPA (Matematika & IPA)</option>
              <option value="IPS">IPS (Ilmu Pengetahuan Sosial)</option>
              <option value="Bahasa & Budaya">Bahasa & Budaya</option>
              <option value="Kurikulum Merdeka (Umum)">Kurikulum Merdeka (Umum)</option>
            </select>
          </div>

          {/* Ruangan */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2">
              Ruang Kelas / Gedung
            </label>
            <input
              type="text"
              placeholder="Contoh: R-101, Gedung A Lantai 2"
              value={formData.room}
              onChange={(e) => setFormData({ ...formData, room: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 focus:bg-white"
            />
          </div>

          {/* Kapasitas Siswa */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2">
              Kapasitas Maksimal Siswa <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              min={1}
              max={60}
              value={formData.capacity}
              onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 36 })}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 focus:bg-white"
              required
            />
            <p className="text-xs text-slate-400 mt-1">Standar kapasitas nasional SMA: 36 siswa</p>
          </div>

          {/* Tahun Ajaran */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2">
              Tahun Ajaran <span className="text-rose-500">*</span>
            </label>
            <select
              value={formData.academicYearId}
              onChange={(e) => setFormData({ ...formData, academicYearId: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 focus:bg-white"
              disabled={loadingOptions}
              required
            >
              <option value="">-- Pilih Tahun Ajaran --</option>
              {academicYears.map((y) => (
                <option key={y.id} value={y.id}>
                  {y.name} - Semester {y.semester} {y.isActive ? '(Aktif)' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Wali Kelas */}
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2">
              Wali Kelas (Homeroom Teacher)
            </label>
            <select
              value={formData.homeroomTeacherId}
              onChange={(e) => setFormData({ ...formData, homeroomTeacherId: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 focus:bg-white"
              disabled={loadingOptions}
            >
              <option value="">-- Belum Ditentukan (Bisa diisi nanti) --</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} {t.nip ? `(NIP: ${t.nip})` : ''}
                </option>
              ))}
            </select>
            <p className="text-xs text-slate-400 mt-1">
              Guru yang dipilih akan bertanggung jawab atas absensi dan rapor rombel ini
            </p>
          </div>

          {/* Checkbox Aktif */}
          <div className="md:col-span-2 pt-2">
            <label className="inline-flex items-center space-x-2 text-sm font-medium text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
              />
              <span>Rombongan Belajar Aktif untuk Pembelajaran</span>
            </label>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end space-x-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-5 py-2.5 border border-slate-200 text-slate-700 text-sm font-medium rounded-xl hover:bg-slate-50 transition"
        >
          Batal
        </button>
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl shadow-xs transition disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Menyimpan...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              {isEdit ? 'Simpan Perubahan' : 'Buat Kelas Baru'}
            </>
          )}
        </button>
      </div>
    </form>
  );
}
