'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  User, 
  ArrowLeft, 
  Save, 
  Upload, 
  AlertCircle, 
  CheckCircle2, 
  Loader2, 
  Calendar, 
  Phone, 
  Mail, 
  MapPin, 
  School
} from 'lucide-react';
import Image from 'next/image';

interface ClassItem {
  id: string;
  name: string;
  gradeLevel: number;
}

interface StudentFormProps {
  initialData?: {
    id?: string;
    nis?: string;
    nisn?: string | null;
    name?: string;
    gender?: 'LAKI_LAKI' | 'PEREMPUAN';
    birthPlace?: string | null;
    birthDate?: string | null;
    religion?: string | null;
    address?: string | null;
    phone?: string | null;
    email?: string | null;
    entryYear?: number;
    status?: 'AKTIF' | 'LULUS' | 'PINDAH' | 'KELUAR' | 'DROPOUT';
    classId?: string | null;
    notes?: string | null;
    photoUrl?: string | null;
  };
  isEdit?: boolean;
}

export default function StudentForm({ initialData, isEdit = false }: StudentFormProps) {
  const router = useRouter();

  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loadingClasses, setLoadingClasses] = useState(true);

  const [formData, setFormData] = useState({
    nis: initialData?.nis || '',
    nisn: initialData?.nisn || '',
    name: initialData?.name || '',
    gender: initialData?.gender || 'LAKI_LAKI',
    birthPlace: initialData?.birthPlace || '',
    birthDate: initialData?.birthDate ? new Date(initialData.birthDate).toISOString().split('T')[0] : '',
    religion: initialData?.religion || 'Islam',
    address: initialData?.address || '',
    phone: initialData?.phone || '',
    email: initialData?.email || '',
    entryYear: initialData?.entryYear || new Date().getFullYear(),
    status: initialData?.status || 'AKTIF',
    classId: initialData?.classId || '',
    notes: initialData?.notes || '',
  });

  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(initialData?.photoUrl || null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Fetch classes
  useEffect(() => {
    async function loadClasses() {
      try {
        const res = await fetch('/api/classes');
        const json = await res.json();
        if (json.data) {
          setClasses(json.data);
        }
      } catch (err) {
        console.error('Failed to load classes', err);
      } finally {
        setLoadingClasses(false);
      }
    }
    loadClasses();
  }, []);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setErrorMsg('Ukuran foto maksimal 2MB');
        return;
      }
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const payload = {
        ...formData,
        entryYear: Number(formData.entryYear),
        classId: formData.classId || null,
        nisn: formData.nisn || null,
        birthPlace: formData.birthPlace || null,
        birthDate: formData.birthDate || null,
        religion: formData.religion || null,
        address: formData.address || null,
        phone: formData.phone || null,
        email: formData.email || null,
        notes: formData.notes || null,
      };

      const url = isEdit ? `/api/students/${initialData?.id}` : '/api/students';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || 'Terjadi kesalahan saat menyimpan data');
      }

      const studentId = isEdit ? initialData?.id : result.data.id;

      // If photo was selected, upload photo
      if (photoFile && studentId) {
        const photoData = new FormData();
        photoData.append('file', photoFile);

        const photoRes = await fetch(`/api/students/${studentId}/photo`, {
          method: 'POST',
          body: photoData,
        });

        if (!photoRes.ok) {
          const photoErr = await photoRes.json();
          console.warn('Gagal upload foto:', photoErr.error);
        }
      }

      setSuccessMsg(isEdit ? 'Data siswa berhasil diperbarui!' : 'Siswa berhasil ditambahkan!');
      
      setTimeout(() => {
        router.push(`/dashboard/students/${studentId}`);
        router.refresh();
      }, 1000);

    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg('Terjadi kesalahan sistem');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Notifications */}
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Photo & Status */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
            <h3 className="text-base font-semibold text-slate-800 mb-4 flex items-center">
              <User className="w-4 h-4 mr-2 text-indigo-600" />
              Foto Profil Siswa
            </h3>
            
            <div className="flex flex-col items-center">
              <div className="relative w-40 h-40 rounded-2xl overflow-hidden bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center group mb-4">
                {photoPreview ? (
                  <Image
                    src={photoPreview}
                    alt="Foto Siswa"
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="text-center p-4">
                    <User className="w-12 h-12 mx-auto text-slate-400 mb-2" />
                    <span className="text-xs text-slate-500">Belum ada foto</span>
                  </div>
                )}
              </div>

              <label className="cursor-pointer inline-flex items-center px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-medium transition duration-200">
                <Upload className="w-4 h-4 mr-2" />
                Pilih Foto
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handlePhotoChange}
                />
              </label>
              <p className="text-xs text-slate-400 mt-2 text-center">
                JPG, PNG atau WebP. Maks 2MB.
              </p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
            <h3 className="text-base font-semibold text-slate-800 flex items-center">
              <School className="w-4 h-4 mr-2 text-indigo-600" />
              Status Akademik
            </h3>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Status Siswa <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as 'AKTIF' | 'LULUS' | 'PINDAH' | 'KELUAR' | 'DROPOUT' })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white"
              >
                <option value="AKTIF">Aktif</option>
                <option value="LULUS">Lulus</option>
                <option value="PINDAH">Pindah</option>
                <option value="KELUAR">Keluar</option>
                <option value="DROPOUT">Drop Out</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Kelas
              </label>
              <select
                value={formData.classId}
                onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white"
                disabled={loadingClasses}
              >
                <option value="">-- Pilih Kelas --</option>
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name} (Kelas {cls.gradeLevel})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Tahun Masuk <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                value={formData.entryYear}
                onChange={(e) => setFormData({ ...formData, entryYear: parseInt(e.target.value) || 2026 })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                min={2000}
                max={2100}
                required
              />
            </div>
          </div>
        </div>

        {/* Right Column: Personal Data & Contacts */}
        <div className="lg:col-span-2 space-y-6">
          {/* Data Pokok */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
            <h3 className="text-base font-semibold text-slate-800 border-b border-slate-100 pb-3">
              Data Pribadi Siswa
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  NIS <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Contoh: 202610001"
                  value={formData.nis}
                  onChange={(e) => setFormData({ ...formData, nis: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  NISN
                </label>
                <input
                  type="text"
                  placeholder="Contoh: 0081234567"
                  value={formData.nisn}
                  onChange={(e) => setFormData({ ...formData, nisn: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  Nama Lengkap Siswa <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Nama lengkap sesuai akta / ijazah"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  Jenis Kelamin <span className="text-rose-500">*</span>
                </label>
                <div className="flex space-x-4 mt-2">
                  <label className="inline-flex items-center text-sm text-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      name="gender"
                      value="LAKI_LAKI"
                      checked={formData.gender === 'LAKI_LAKI'}
                      onChange={() => setFormData({ ...formData, gender: 'LAKI_LAKI' })}
                      className="w-4 h-4 text-indigo-600 border-slate-300 focus:ring-indigo-500"
                    />
                    <span className="ml-2">Laki-laki</span>
                  </label>
                  <label className="inline-flex items-center text-sm text-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      name="gender"
                      value="PEREMPUAN"
                      checked={formData.gender === 'PEREMPUAN'}
                      onChange={() => setFormData({ ...formData, gender: 'PEREMPUAN' })}
                      className="w-4 h-4 text-indigo-600 border-slate-300 focus:ring-indigo-500"
                    />
                    <span className="ml-2">Perempuan</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  Agama
                </label>
                <select
                  value={formData.religion}
                  onChange={(e) => setFormData({ ...formData, religion: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white"
                >
                  <option value="Islam">Islam</option>
                  <option value="Kristen Protestan">Kristen Protestan</option>
                  <option value="Katolik">Katolik</option>
                  <option value="Hindu">Hindu</option>
                  <option value="Buddha">Buddha</option>
                  <option value="Khonghucu">Khonghucu</option>
                  <option value="Lainnya">Lainnya</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  Tempat Lahir
                </label>
                <input
                  type="text"
                  placeholder="Kota kelahiran"
                  value={formData.birthPlace}
                  onChange={(e) => setFormData({ ...formData, birthPlace: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  Tanggal Lahir
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={formData.birthDate}
                    onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Kontak & Alamat */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
            <h3 className="text-base font-semibold text-slate-800 border-b border-slate-100 pb-3">
              Kontak & Alamat Tempat Tinggal
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  No. Telepon / WhatsApp
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                  <input
                    type="tel"
                    placeholder="08xxxxxxxxxx"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full pl-10 pr-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  Email Siswa
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                  <input
                    type="email"
                    placeholder="nama@siswa.belajar.id"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full pl-10 pr-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                  />
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  Alamat Lengkap
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                  <textarea
                    rows={3}
                    placeholder="Jalan, RT/RW, Kelurahan, Kecamatan, Kota/Kabupaten"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full pl-10 pr-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                  />
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  Catatan Khusus (Opsional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Informasi khusus medis, bakat istimewa, atau catatan lainnya"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-5 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 transition duration-200"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium shadow-sm transition duration-200 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  {isEdit ? 'Simpan Perubahan' : 'Tambah Siswa'}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
