import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession, requireRoles, ADMIN_ROLES } from '@/lib/session';
import * as XLSX from 'xlsx';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!requireRoles(session.role, [...ADMIN_ROLES, 'KEPALA_SEKOLAH'])) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const [setting, students, teachers, classes, grades, books, borrowings] = await Promise.all([
    prisma.schoolSetting.findFirst(),
    prisma.student.findMany({
      where: { status: 'AKTIF' },
      orderBy: [{ class: { name: 'asc' } }, { name: 'asc' }],
      include: { class: { select: { name: true } } },
    }),
    prisma.teacher.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    }),
    prisma.class.findMany({
      where: { isActive: true },
      include: {
        homeroomTeacher: { select: { name: true } },
        _count: { select: { students: true } },
      },
    }),
    prisma.grade.findMany({
      include: {
        student: { select: { name: true, nis: true, class: { select: { name: true } } } },
        gradeItem: { include: { subject: { select: { code: true, name: true } } } },
      },
    }),
    prisma.book.findMany({
      include: { category: true },
    }),
    prisma.borrowing.findMany({
      include: {
        member: {
          include: {
            student: { select: { name: true, nis: true } },
            teacher: { select: { name: true, nip: true } },
          },
        },
      },
    }),
  ]);

  const workbook = XLSX.utils.book_new();

  // SHEET 1: Ringkasan Eksekutif
  const summaryRows = [
    { Parameter: 'Nama Lembaga', Nilai: setting?.name || 'SMA Negeri 1 Nusantara' },
    { Parameter: 'NPSN', Nilai: setting?.npsn || '20260001' },
    { Parameter: 'Kepala Sekolah', Nilai: setting?.principalName || 'Dr. H. Ahmad Sudirman, M.Pd.' },
    { Parameter: 'Tanggal Ekspor Laporan', Nilai: new Date().toLocaleDateString('id-ID', { dateStyle: 'full' }) },
    { Parameter: 'Total Peserta Didik Aktif', Nilai: students.length },
    { Parameter: 'Total Pendidik & GTK', Nilai: teachers.length },
    { Parameter: 'Total Rombongan Belajar', Nilai: classes.length },
    { Parameter: 'Total Judul Buku Perpustakaan', Nilai: books.length },
    { Parameter: 'Total Transaksi Sirkulasi', Nilai: borrowings.length },
  ];
  const summarySheet = XLSX.utils.json_to_sheet(summaryRows);
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Ringkasan Eksekutif');

  // SHEET 2: Data Siswa
  const studentRows = students.map((s, idx) => ({
    No: idx + 1,
    NIS: s.nis,
    NISN: s.nisn || '-',
    'Nama Siswa': s.name,
    'Jenis Kelamin': s.gender === 'LAKI_LAKI' ? 'Laki-laki' : 'Perempuan',
    Kelas: s.class?.name || '-',
    'No. Telepon / WA': s.phone || '-',
    Alamat: s.address || '-',
    Status: s.status,
  }));
  const studentSheet = XLSX.utils.json_to_sheet(studentRows);
  XLSX.utils.book_append_sheet(workbook, studentSheet, 'Data Siswa');

  // SHEET 3: Data Guru & Staf
  const teacherRows = teachers.map((t, idx) => ({
    No: idx + 1,
    NIP: t.nip,
    'Nama Guru': t.name,
    'Jenis Kelamin': t.gender === 'LAKI_LAKI' ? 'Laki-laki' : 'Perempuan',
    'Status Kepegawaian': t.employmentStatus || 'PNS',
    Jabatan: t.position || 'Guru Pengajar',
    'No. Telepon / WA': t.phone || '-',
    Email: t.email || '-',
  }));
  const teacherSheet = XLSX.utils.json_to_sheet(teacherRows);
  XLSX.utils.book_append_sheet(workbook, teacherSheet, 'Data Guru & Staf');

  // SHEET 4: Leger Nilai Siswa
  const gradeRows = grades.map((g, idx) => ({
    No: idx + 1,
    NIS: g.student.nis,
    'Nama Siswa': g.student.name,
    Kelas: g.student.class?.name || '-',
    'Kode Mapel': g.gradeItem.subject.code,
    'Mata Pelajaran': g.gradeItem.subject.name,
    'Komponen Penilaian': g.gradeItem.name,
    'Jenis Penilaian': g.gradeItem.type,
    'Nilai Angka': g.score,
    'Ketuntasan KKM (75)': g.score >= 75 ? 'Tuntas' : 'Belum Tuntas',
  }));
  const gradeSheet = XLSX.utils.json_to_sheet(gradeRows);
  XLSX.utils.book_append_sheet(workbook, gradeSheet, 'Leger Nilai');

  // SHEET 5: Koleksi Perpustakaan
  const bookRows = books.map((b, idx) => ({
    No: idx + 1,
    ISBN: b.isbn || '-',
    'Judul Buku': b.title,
    Pengarang: b.author,
    Penerbit: b.publisher || '-',
    Kategori: b.category.name,
    'Total Eksemplar': b.totalCopies,
    'Tersedia di Rak': b.availableCopies,
    'Sedang Dipinjam': b.totalCopies - b.availableCopies,
  }));
  const bookSheet = XLSX.utils.json_to_sheet(bookRows);
  XLSX.utils.book_append_sheet(workbook, bookSheet, 'Koleksi Perpustakaan');

  const buf = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

  return new NextResponse(buf, {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="laporan-lengkap-sekolah-${new Date().toISOString().split('T')[0]}.xlsx"`,
    },
  });
}
