'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Edit3, Loader2, User } from 'lucide-react';
import TeacherForm from '@/components/teachers/TeacherForm';

export default function EditTeacherPage() {
  const params = useParams();
  const id = params?.id as string;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [teacher, setTeacher] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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
        <p className="text-sm text-slate-500">Memuat data guru...</p>
      </div>
    );
  }

  if (!teacher) {
    return (
      <div className="py-24 text-center">
        <User className="w-10 h-10 mx-auto text-slate-300 mb-3" />
        <p className="text-base font-semibold text-slate-800">Guru tidak ditemukan</p>
        <Link href="/dashboard/teachers" className="mt-4 inline-flex items-center text-sm text-indigo-600 font-medium hover:underline">
          <ArrowLeft className="w-4 h-4 mr-1" />Kembali
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Link href={`/dashboard/teachers/${id}`} className="p-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 rounded-xl transition">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center">
            <Edit3 className="w-6 h-6 mr-2 text-indigo-600" />
            Edit Data Guru: {teacher.name}
          </h1>
          <p className="text-sm text-slate-500 mt-1">Perbarui data identitas, kepegawaian, dan kontak</p>
        </div>
      </div>
      <TeacherForm initialData={teacher} isEdit={true} />
    </div>
  );
}
