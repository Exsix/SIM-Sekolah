import { PrismaClient, BookCopyStatus, BorrowingStatus, MemberType } from '@prisma/client';

const prisma = new PrismaClient();

async function seedLibrary() {
  console.log('Seeding digital library catalog and circulation data...');

  // 1. Seed Categories (Dewey Decimal Classification)
  const categories = [
    { code: '000', name: 'Karya Umum & Komputer', desc: 'Informatika, ensiklopedia, dan sistem komputasi' },
    { code: '100', name: 'Filsafat & Psikologi', desc: 'Pemikiran filsafat, etika, dan psikologi perkembangan' },
    { code: '200', name: 'Agama & Budi Pekerti', desc: 'Kajian keagamaan dan pembentukan karakter moral' },
    { code: '300', name: 'Ilmu Sosial & Hukum', desc: 'Sosiologi, ekonomi, politik, dan kewarganegaraan' },
    { code: '400', name: 'Bahasa & Linguistik', desc: 'Tata bahasa, kamus, dan keterampilan berbahasa' },
    { code: '500', name: 'Sains & Matematika', desc: 'Biologi, fisika, kimia, dan kalkulus' },
    { code: '600', name: 'Teknologi & Ilmu Terapan', desc: 'Rekayasa, kedokteran, dan teknologi tepat guna' },
    { code: '700', name: 'Kesenian & Olahraga', desc: 'Seni rupa, musik, arsitektur, dan kebugaran' },
    { code: '800', name: 'Kesusastraan & Novel', desc: 'Sastra Indonesia, fiksi, puisi, dan novel klasik' },
    { code: '900', name: 'Sejarah & Geografi', desc: 'Sejarah peradaban nusantara dan geografi dunia' },
  ];

  const catMap = new Map<string, string>();
  for (const c of categories) {
    const cat = await prisma.bookCategory.upsert({
      where: { code: c.code },
      update: { name: c.name, description: c.desc },
      create: { code: c.code, name: c.name, description: c.desc },
    });
    catMap.set(c.code, cat.id);
  }
  console.log('✅ Categories seeded');

  // 2. Seed Books
  const booksData = [
    {
      isbn: '978-602-03-0123-1',
      title: 'Struktur Data dan Algoritma Modern',
      author: 'Prof. Dr. Bambang Riyanto, M.Sc.',
      publisher: 'Informatika Press',
      publishYear: 2023,
      catCode: '000',
      rack: 'Rak A-01',
      copiesCount: 4,
      desc: 'Buku pegangan komprehensif mengenai analisis kompleksitas, pohon biner, graf, dan pemrograman dinamis.',
    },
    {
      isbn: '978-979-22-1234-5',
      title: 'Laskar Pelangi',
      author: 'Andrea Hirata',
      publisher: 'Bentang Pustaka',
      publishYear: 2005,
      catCode: '800',
      rack: 'Rak D-05',
      copiesCount: 5,
      desc: 'Novel inspiratif perjuangan sepuluh anak di Belitung dalam meraih pendidikan setinggi-tingginya.',
    },
    {
      isbn: '978-979-973-120-2',
      title: 'Bumi Manusia',
      author: 'Pramoedya Ananta Toer',
      publisher: 'Hasta Mitra',
      publishYear: 1980,
      catCode: '800',
      rack: 'Rak D-06',
      copiesCount: 3,
      desc: 'Mahakarya roman sejarah Indonesia era kolonial Belanda bagian pertama dari Tetralogi Buru.',
    },
    {
      isbn: '978-602-444-555-8',
      title: 'Biologi Konsep & Esensi (Edisi 11)',
      author: 'Neil A. Campbell & Jane B. Reece',
      publisher: 'Erlangga',
      publishYear: 2021,
      catCode: '500',
      rack: 'Rak B-02',
      copiesCount: 3,
      desc: 'Buku teks standar olimpiade dan pengantar biologi sel, genetika molekuler, dan ekologi global.',
    },
    {
      isbn: '978-979-015-777-1',
      title: 'Fisika untuk SMA/MA Kelas X',
      author: 'Marthen Kanginan',
      publisher: 'Erlangga',
      publishYear: 2022,
      catCode: '500',
      rack: 'Rak B-04',
      copiesCount: 4,
      desc: 'Panduan kurikulum merdeka materi vektor, gerak lurus, hukum Newton, dan fluida dinamis.',
    },
    {
      isbn: '978-602-123-888-0',
      title: 'Ekonomi Mikro & Makro Terapan',
      author: 'Dr. Sri Mulyani, S.E., M.Si.',
      publisher: 'Salemba Empat',
      publishYear: 2023,
      catCode: '300',
      rack: 'Rak C-01',
      copiesCount: 3,
      desc: 'Analisis kebijakan fiskal, perbankan nasional, pasar modal, dan inflasi untuk siswa SMA.',
    },
    {
      isbn: '978-979-403-999-9',
      title: 'Sejarah Pergerakan Nasional Indonesia',
      author: 'Prof. Sartono Kartodirdjo',
      publisher: 'Gramedia Pustaka Utama',
      publishYear: 2019,
      catCode: '900',
      rack: 'Rak E-02',
      copiesCount: 3,
      desc: 'Kajian mendalam kebangkitan kesadaran nasionalisme Indonesia dari Boedi Oetomo hingga Kemerdekaan 1945.',
    },
    {
      isbn: '978-602-888-111-4',
      title: 'Kamus Besar Bahasa Indonesia (KBBI V)',
      author: 'Badan Pengembangan dan Pembinaan Bahasa',
      publisher: 'Balai Pustaka',
      publishYear: 2020,
      catCode: '400',
      rack: 'Rak A-05 (Referensi)',
      copiesCount: 2,
      desc: 'Rujukan leksikografi resmi dan terlengkap kosakata bahasa Indonesia baku.',
    },
  ];

  const createdBooks = [];

  for (const b of booksData) {
    const categoryId = catMap.get(b.catCode)!;
    const book = await prisma.book.upsert({
      where: { isbn: b.isbn },
      update: {
        title: b.title,
        author: b.author,
        publisher: b.publisher,
        publishYear: b.publishYear,
        categoryId,
        rackLocation: b.rack,
        description: b.desc,
      },
      create: {
        isbn: b.isbn,
        title: b.title,
        author: b.author,
        publisher: b.publisher,
        publishYear: b.publishYear,
        categoryId,
        rackLocation: b.rack,
        totalCopies: b.copiesCount,
        availableCopies: b.copiesCount,
        description: b.desc,
      },
    });

    createdBooks.push(book);

    // Create physical copies if not existing
    for (let c = 1; c <= b.copiesCount; c++) {
      const copyCode = `EX-${b.catCode}-${book.id.slice(0, 4).toUpperCase()}-${String(c).padStart(2, '0')}`;
      await prisma.bookCopy.upsert({
        where: { copyCode },
        update: {},
        create: {
          bookId: book.id,
          copyCode,
          condition: 'Baik',
          status: BookCopyStatus.TERSEDIA,
        },
      });
    }

    console.log(`Upserted book: ${book.title} (${b.copiesCount} eksemplar)`);
  }

  // 3. Seed Library Members for existing students & teachers
  const students = await prisma.student.findMany({ take: 5 });
  const teachers = await prisma.teacher.findMany({ take: 3 });

  for (const s of students) {
    const memberNumber = `LIB-S-${s.nis}`;
    await prisma.libraryMember.upsert({
      where: { studentId: s.id },
      update: {},
      create: {
        memberNumber,
        studentId: s.id,
        type: MemberType.SISWA,
        isActive: true,
      },
    });
  }

  for (const t of teachers) {
    const memberNumber = `LIB-G-${t.nip || t.id.slice(0, 6)}`;
    await prisma.libraryMember.upsert({
      where: { teacherId: t.id },
      update: {},
      create: {
        memberNumber,
        teacherId: t.id,
        type: MemberType.GURU,
        isActive: true,
      },
    });
  }
  console.log('✅ Library members seeded');

  // 4. Seed sample active & returned borrowings for Siswa Andi Pratama
  const andiStudent = await prisma.student.findFirst({ where: { name: { contains: 'Andi' } } });
  if (andiStudent) {
    const andiMember = await prisma.libraryMember.findUnique({ where: { studentId: andiStudent.id } });
    const bookLaskar = await prisma.book.findFirst({ where: { title: { contains: 'Laskar Pelangi' } } });
    const bookStruktur = await prisma.book.findFirst({ where: { title: { contains: 'Struktur Data' } } });

    if (andiMember && bookLaskar && bookStruktur) {
      const copyLaskar = await prisma.bookCopy.findFirst({ where: { bookId: bookLaskar.id } });
      const copyStruktur = await prisma.bookCopy.findFirst({ where: { bookId: bookStruktur.id } });

      if (copyLaskar) {
        // Active Borrowing: borrowed 3 days ago, due in 4 days
        const borrowDate = new Date();
        borrowDate.setDate(borrowDate.getDate() - 3);
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 4);

        const b1 = await prisma.borrowing.upsert({
          where: { borrowingNumber: 'PINJAM-2026-0001' },
          update: {},
          create: {
            borrowingNumber: 'PINJAM-2026-0001',
            memberId: andiMember.id,
            borrowDate,
            dueDate,
            status: BorrowingStatus.DIPINJAM,
            notes: 'Peminjaman rutin bahan bacaan literasi',
          },
        });

        await prisma.borrowingItem.create({
          data: {
            borrowingId: b1.id,
            bookCopyId: copyLaskar.id,
            status: BorrowingStatus.DIPINJAM,
          },
        });

        await prisma.bookCopy.update({
          where: { id: copyLaskar.id },
          data: { status: BookCopyStatus.DIPINJAM },
        });

        await prisma.book.update({
          where: { id: bookLaskar.id },
          data: { availableCopies: { decrement: 1 } },
        });

        console.log('✅ Created active borrowing for Siswa Andi: Laskar Pelangi');
      }

      if (copyStruktur) {
        // Returned Borrowing: borrowed 20 days ago, returned 10 days ago
        const borrowDate = new Date();
        borrowDate.setDate(borrowDate.getDate() - 20);
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() - 6);
        const returnDate = new Date();
        returnDate.setDate(returnDate.getDate() - 8);

        const b2 = await prisma.borrowing.upsert({
          where: { borrowingNumber: 'PINJAM-2026-0002' },
          update: {},
          create: {
            borrowingNumber: 'PINJAM-2026-0002',
            memberId: andiMember.id,
            borrowDate,
            dueDate,
            returnDate,
            status: BorrowingStatus.DIKEMBALIKAN,
            fineAmount: 0,
            notes: 'Buku dikembalikan dalam kondisi sangat baik',
          },
        });

        await prisma.borrowingItem.create({
          data: {
            borrowingId: b2.id,
            bookCopyId: copyStruktur.id,
            returnDate,
            status: BorrowingStatus.DIKEMBALIKAN,
          },
        });

        console.log('✅ Created completed loan history: Struktur Data');
      }
    }
  }

  console.log('✅ Seeding library finished successfully!');
}

seedLibrary()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
