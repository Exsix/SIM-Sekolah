import React from 'react';
import Link from 'next/link';
import { ArrowLeft, UserPlus } from 'lucide-react';
import TeacherForm from '@/components/teachers/TeacherForm';

export default function NewTeacherPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Link href="/dashboard/teachers" className="p-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 rounded-xl transition">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center">
            <UserPlus className="w-6 h-6 mr-2 text-indigo-600" />
            Tambah Guru / Staf Baru
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Isi data identitas dan kepegawaian guru atau tenaga kependidikan
          </p>
        </div>
      </div>
      <TeacherForm />
    </div>
  );
}
