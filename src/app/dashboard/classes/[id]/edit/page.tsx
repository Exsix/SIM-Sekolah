'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Edit3, Loader2, School } from 'lucide-react';
import ClassForm from '@/components/classes/ClassForm';

export default function EditClassPage() {
  const params = useParams();
  const id = params?.id as string;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [classData, setClassData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
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
    }
    if (id) load();
  }, [id]);

  if (loading) {
    return (
      <div className="py-24 text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-600 mb-3" />
        <p className="text-sm text-slate-500">Memuat data kelas...</p>
      </div>
    );
  }

  if (!classData) {
    return (
      <div className="py-24 text-center">
        <School className="w-10 h-10 mx-auto text-slate-300 mb-3" />
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

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Link
          href={`/dashboard/classes/${id}`}
          className="p-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 rounded-xl transition"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center">
            <Edit3 className="w-6 h-6 mr-2 text-indigo-600" />
            Edit Data Kelas: {classData.name}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Ubah nama rombel, ruangan, kapasitas maksimal, atau penetapan wali kelas
          </p>
        </div>
      </div>

      <ClassForm initialData={classData} isEdit={true} />
    </div>
  );
}
