import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import * as XLSX from 'xlsx';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type') || 'books'; // 'books' or 'borrowings'

  if (type === 'borrowings') {
    const borrowings = await prisma.borrowing.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        member: {
          include: {
            student: { select: { name: true, nis: true } },
            teacher: { select: { name: true, nip: true } },
          },
        },
        items: {
          include: {
            bookCopy: {
              include: {
                book: { select: { title: true, isbn: true } },
              },
            },
          },
        },
      },
    });

    const rows = borrowings.map((b, idx) => ({
      No: idx + 1,
      'No. Peminjaman': b.borrowingNumber,
      'Nama Peminjam': b.member.student?.name || b.member.teacher?.name || b.member.memberNumber,
      Tipe: b.member.type,
      'Judul Buku': b.items.map((i) => i.bookCopy.book.title).join('; '),
      'Kode Eksemplar': b.items.map((i) => i.bookCopy.copyCode).join('; '),
      'Tgl Pinjam': new Date(b.borrowDate).toISOString().split('T')[0],
      'Jatuh Tempo': new Date(b.dueDate).toISOString().split('T')[0],
      'Tgl Kembali': b.returnDate ? new Date(b.returnDate).toISOString().split('T')[0] : '-',
      Status: b.status,
      'Denda (Rp)': b.fineAmount,
      Catatan: b.notes || '-',
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sirkulasi Perpustakaan');
    const buf = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    return new NextResponse(buf, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="sirkulasi-perpustakaan-${new Date().toISOString().split('T')[0]}.xlsx"`,
      },
    });
  }

  // Default: export books catalog
  const books = await prisma.book.findMany({
    orderBy: { title: 'asc' },
    include: {
      category: { select: { code: true, name: true } },
      copies: true,
    },
  });

  const rows = books.map((b, idx) => ({
    No: idx + 1,
    ISBN: b.isbn || '-',
    'Judul Buku': b.title,
    Penulis: b.author,
    Penerbit: b.publisher || '-',
    'Tahun Terbit': b.publishYear || '-',
    Kategori: `[${b.category.code}] ${b.category.name}`,
    'Lokasi Rak': b.rackLocation || '-',
    'Total Eksemplar': b.totalCopies,
    'Tersedia (Bisa Dipinjam)': b.availableCopies,
    Kondisi: b.condition || 'Baik',
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Katalog Buku Perpustakaan');
  const buf = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

  return new NextResponse(buf, {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="katalog-buku-${new Date().toISOString().split('T')[0]}.xlsx"`,
    },
  });
}
