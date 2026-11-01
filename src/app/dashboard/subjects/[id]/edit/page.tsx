'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, BookOpen, Edit3, Loader2 } from 'lucide-react';
import SubjectForm from '@/components/subjects/SubjectForm';

export default function EditSubjectPage() {
  const params = useParams();
  const id = params?.id as string;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [subject, setSubject] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
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
    if (id) load();
  }, [id]);

  if (loading) {
    return (
      <div className="py-24 text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-600 mb-3" />
        <p className="text-sm text-slate-500 font-medium">Memuat data mata pelajaran...</p>
      </div>
    );
  }

  if (!subject) {
    return (
      <div className="py-24 text-center">
        <BookOpen className="w-12 h-12 mx-auto text-slate-300 mb-3" />
        <h2 className="text-base font-semibold text-slate-800">Mata Pelajaran Tidak Ditemukan</h2>
        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
          Mata pelajaran yang Anda cari mungkin telah dihapus atau ID tidak valid.
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

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Link
          href={`/dashboard/subjects/${id}`}
          className="p-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 rounded-xl transition"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center">
            <Edit3 className="w-6 h-6 mr-2 text-indigo-600" />
            Edit Mata Pelajaran: {subject.name}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Kode: <span className="font-mono font-semibold text-slate-700">{subject.code}</span> • Perbarui kurikulum, kategori, dan guru pengampu
          </p>
        </div>
      </div>

      <SubjectForm initialData={subject} isEdit={true} />
    </div>
  );
}
