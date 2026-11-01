'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Edit3, Loader2 } from 'lucide-react';
import StudentForm from '@/components/students/StudentForm';

export default function EditStudentPage() {
  const params = useParams();
  const id = params?.id as string;

  const [student, setStudent] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStudent() {
      try {
        const res = await fetch(`/api/students/${id}`);
        if (!res.ok) throw new Error('Student not found');
        const json = await res.json();
        setStudent(json.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    if (id) loadStudent();
  }, [id]);

  if (loading) {
    return (
      <div className="py-24 text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-600 mb-3" />
        <p className="text-sm text-slate-500">Memuat data siswa...</p>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="py-24 text-center">
        <p className="text-base font-semibold text-slate-800">Siswa tidak ditemukan</p>
        <Link
          href="/dashboard/students"
          className="mt-4 inline-flex items-center text-sm text-indigo-600 font-medium hover:underline"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Kembali ke Daftar Siswa
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Link
          href={`/dashboard/students/${id}`}
          className="p-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 rounded-xl transition"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center">
            <Edit3 className="w-6 h-6 mr-2 text-indigo-600" />
            Edit Data Siswa: {student.name}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Ubah data identitas, status akademik, atau kelas siswa
          </p>
        </div>
      </div>

      <StudentForm initialData={student} isEdit={true} />
    </div>
  );
}
