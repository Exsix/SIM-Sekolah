'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  User, ArrowLeft, Save, Upload, AlertCircle, CheckCircle2, Loader2,
  Phone, Mail, MapPin, Briefcase, GraduationCap, Calendar
} from 'lucide-react';
import Image from 'next/image';

interface TeacherFormProps {
  initialData?: {
    id?: string;
    nip?: string | null;
    nuptk?: string | null;
    name?: string;
    gender?: 'LAKI_LAKI' | 'PEREMPUAN';
    birthPlace?: string | null;
    birthDate?: string | null;
    address?: string | null;
    phone?: string | null;
    email?: string | null;
    education?: string | null;
    position?: string | null;
    employmentStatus?: 'PNS' | 'PPPK' | 'GURU_TETAP_YAYASAN' | 'GURU_HONORER';
    joinDate?: string | null;
    isActive?: boolean;
    photoUrl?: string | null;
  };
  isEdit?: boolean;
}

export default function TeacherForm({ initialData, isEdit = false }: TeacherFormProps) {
  const router = useRouter();

  const [formData, setFormData] = useState({
    nip: initialData?.nip || '',
    nuptk: initialData?.nuptk || '',
    name: initialData?.name || '',
    gender: initialData?.gender || 'LAKI_LAKI',
    birthPlace: initialData?.birthPlace || '',
    birthDate: initialData?.birthDate ? new Date(initialData.birthDate).toISOString().split('T')[0] : '',
    address: initialData?.address || '',
    phone: initialData?.phone || '',
    email: initialData?.email || '',
    education: initialData?.education || 'S1',
    position: initialData?.position || '',
    employmentStatus: initialData?.employmentStatus || 'GURU_HONORER',
    joinDate: initialData?.joinDate ? new Date(initialData.joinDate).toISOString().split('T')[0] : '',
    isActive: initialData?.isActive ?? true,
  });

  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(initialData?.photoUrl || null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setErrorMsg('Ukuran foto maksimal 2MB');
        return;
      }
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setPhotoPreview(reader.result as string);
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
        nip: formData.nip || null,
        nuptk: formData.nuptk || null,
        birthPlace: formData.birthPlace || null,
        birthDate: formData.birthDate || null,
        address: formData.address || null,
        phone: formData.phone || null,
        email: formData.email || null,
        education: formData.education || null,
        position: formData.position || null,
        joinDate: formData.joinDate || null,
      };

      const url = isEdit ? `/api/teachers/${initialData?.id}` : '/api/teachers';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Gagal menyimpan data');

      const teacherId = isEdit ? initialData?.id : result.data.id;

      if (photoFile && teacherId) {
        const photoData = new FormData();
        photoData.append('file', photoFile);
        await fetch(`/api/teachers/${teacherId}/photo`, { method: 'POST', body: photoData });
      }

      setSuccessMsg(isEdit ? 'Data guru berhasil diperbarui!' : 'Guru berhasil ditambahkan!');
      setTimeout(() => {
        router.push(`/dashboard/teachers/${teacherId}`);
        router.refresh();
      }, 1000);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Terjadi kesalahan sistem');
    } finally {
      setLoading(false);
    }
  };

  const statusOptions = [
    { value: 'PNS', label: 'PNS (Pegawai Negeri Sipil)' },
    { value: 'PPPK', label: 'PPPK (Pegawai Pemerintah dengan Perjanjian Kerja)' },
    { value: 'GURU_TETAP_YAYASAN', label: 'Guru Tetap Yayasan' },
    { value: 'GURU_HONORER', label: 'Guru Honorer / Tidak Tetap' },
  ];

  const educationOptions = ['S3 (Doktor)', 'S2 (Magister)', 'S1 (Sarjana)', 'D4', 'D3', 'SMA/SMK/Sederajat'];

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
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
        {/* Kolom Kiri: Foto & Status */}
        <div className="space-y-6">
          {/* Foto */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
            <h3 className="text-base font-semibold text-slate-800 mb-4 flex items-center">
              <User className="w-4 h-4 mr-2 text-indigo-600" />
              Foto Profil
            </h3>
            <div className="flex flex-col items-center">
              <div className="relative w-40 h-40 rounded-2xl overflow-hidden bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center mb-4">
                {photoPreview ? (
                  <Image src={photoPreview} alt="Foto Guru" fill className="object-cover" />
                ) : (
                  <div className="text-center p-4">
                    <User className="w-12 h-12 mx-auto text-slate-400 mb-2" />
                    <span className="text-xs text-slate-500">Belum ada foto</span>
                  </div>
                )}
              </div>
              <label className="cursor-pointer inline-flex items-center px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-medium transition">
                <Upload className="w-4 h-4 mr-2" />
                Pilih Foto
                <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handlePhotoChange} />
              </label>
              <p className="text-xs text-slate-400 mt-2 text-center">JPG, PNG atau WebP. Maks 2MB.</p>
            </div>
          </div>

          {/* Status Kepegawaian */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
            <h3 className="text-base font-semibold text-slate-800 flex items-center">
              <Briefcase className="w-4 h-4 mr-2 text-indigo-600" />
              Status Kepegawaian
            </h3>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Status <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.employmentStatus}
                onChange={(e) => setFormData({ ...formData, employmentStatus: e.target.value as 'PNS' | 'PPPK' | 'GURU_TETAP_YAYASAN' | 'GURU_HONORER' })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white"
              >
                {statusOptions.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Pendidikan Terakhir
              </label>
              <select
                value={formData.education}
                onChange={(e) => setFormData({ ...formData, education: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white"
              >
                {educationOptions.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Tanggal Bergabung
              </label>
              <input
                type="date"
                value={formData.joinDate}
                onChange={(e) => setFormData({ ...formData, joinDate: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              />
            </div>

            <div className="flex items-center space-x-3 pt-1">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="w-4 h-4 text-indigo-600 border-slate-300 rounded"
              />
              <label htmlFor="isActive" className="text-sm text-slate-700 font-medium cursor-pointer">
                Guru / Staf Aktif
              </label>
            </div>
          </div>
        </div>

        {/* Kolom Kanan: Data Pribadi */}
        <div className="lg:col-span-2 space-y-6">
          {/* Data Kepegawaian */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
            <h3 className="text-base font-semibold text-slate-800 border-b border-slate-100 pb-3">
              Data Identitas Guru / Staf
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">NIP</label>
                <input
                  type="text"
                  placeholder="Contoh: 198504152009012001"
                  value={formData.nip}
                  onChange={(e) => setFormData({ ...formData, nip: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">NUPTK</label>
                <input
                  type="text"
                  placeholder="16 digit NUPTK"
                  value={formData.nuptk}
                  onChange={(e) => setFormData({ ...formData, nuptk: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  Nama Lengkap + Gelar <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Budi Santoso, S.Pd., M.Kom."
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  Jabatan / Tugas Mengajar
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Guru Informatika, Kepala Laboratorium"
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  Jenis Kelamin <span className="text-rose-500">*</span>
                </label>
                <div className="flex space-x-4 mt-2">
                  <label className="inline-flex items-center text-sm text-slate-700 cursor-pointer">
                    <input type="radio" name="gender_t" value="LAKI_LAKI" checked={formData.gender === 'LAKI_LAKI'} onChange={() => setFormData({ ...formData, gender: 'LAKI_LAKI' })} className="w-4 h-4 text-indigo-600" />
                    <span className="ml-2">Laki-laki</span>
                  </label>
                  <label className="inline-flex items-center text-sm text-slate-700 cursor-pointer">
                    <input type="radio" name="gender_t" value="PEREMPUAN" checked={formData.gender === 'PEREMPUAN'} onChange={() => setFormData({ ...formData, gender: 'PEREMPUAN' })} className="w-4 h-4 text-indigo-600" />
                    <span className="ml-2">Perempuan</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">Tempat Lahir</label>
                <input
                  type="text"
                  placeholder="Kota kelahiran"
                  value={formData.birthPlace}
                  onChange={(e) => setFormData({ ...formData, birthPlace: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">Tanggal Lahir</label>
                <input
                  type="date"
                  value={formData.birthDate}
                  onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                />
              </div>
            </div>
          </div>

          {/* Kontak */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
            <h3 className="text-base font-semibold text-slate-800 border-b border-slate-100 pb-3">
              Kontak & Domisili
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">No. Telepon / WA</label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                  <input type="tel" placeholder="08xxxxxxxxxx" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="w-full pl-10 pr-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">Email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                  <input type="email" placeholder="nama@sekolah.sch.id" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full pl-10 pr-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600" />
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">Alamat Rumah</label>
                <div className="relative">
                  <MapPin className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                  <textarea rows={3} placeholder="Jalan, RT/RW, Kelurahan, Kecamatan, Kota" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} className="w-full pl-10 pr-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-4">
            <button type="button" onClick={() => router.back()} className="px-5 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 transition">
              Batal
            </button>
            <button type="submit" disabled={loading} className="inline-flex items-center px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium shadow-sm transition disabled:opacity-50">
              {loading ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Menyimpan...</>
              ) : (
                <><Save className="w-4 h-4 mr-2" />{isEdit ? 'Simpan Perubahan' : 'Tambah Guru'}</>
              )}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
