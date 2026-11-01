import React from 'react';
import Link from 'next/link';
import { ArrowLeft, BookOpen } from 'lucide-react';
import SubjectForm from '@/components/subjects/SubjectForm';

export default function NewSubjectPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Link
          href="/dashboard/subjects"
          className="p-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 rounded-xl transition"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center">
            <BookOpen className="w-6 h-6 mr-2 text-indigo-600" />
            Tambah Mata Pelajaran Baru
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Daftarkan mata pelajaran ke dalam kurikulum sekolah dan tentukan penugasan guru pengampu
          </p>
        </div>
      </div>

      <SubjectForm />
    </div>
  );
}
