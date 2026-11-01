import { prisma } from '../src/lib/prisma';

async function seedParents() {
  console.log('Seeding Parents and linking with Students...');

  const students = await prisma.student.findMany({
    orderBy: { nis: 'asc' },
    select: { id: true, name: true, nis: true },
  });

  console.log(`Found ${students.length} students.`);

  const parentSamples = [
    {
      father: { name: 'Ir. Bambang Pratama, M.T.', phone: '081234567890', email: 'bambang.pratama@gmail.com', occupation: 'Insinyur Sipil', relationship: 'Ayah' },
      mother: { name: 'Dra. Siti Rahmawati, M.Pd.', phone: '081298765432', email: 'siti.rahmawati@gmail.com', occupation: 'Dosen Perguruan Tinggi', relationship: 'Ibu' },
      address: 'Jl. Merdeka Barat No. 12, Gambir, Jakarta Pusat',
    },
    {
      father: { name: 'Drs. Hendra Gunawan', phone: '081311223344', email: 'hendra.gunawan@perusahaan.co.id', occupation: 'Wiraswasta / Pengusaha', relationship: 'Ayah' },
      mother: { name: 'dr. Ratna Juwita, Sp.A', phone: '081399887766', email: 'ratna.juwita@klinik.com', occupation: 'Dokter Spesialis Anak', relationship: 'Ibu' },
      address: 'Jl. Cempaka Putih Timur No. 45, Jakarta Pusat',
    },
    {
      father: { name: 'Agus Setiawan, S.E.', phone: '081122334455', email: 'agus.setiawan@bankmandiri.co.id', occupation: 'Manajer Perbankan', relationship: 'Ayah' },
      mother: { name: 'Nurul Hidayah, S.Pd.', phone: '081166778899', email: 'nurul.hidayah@gmail.com', occupation: 'Guru Yayasan', relationship: 'Ibu' },
      address: 'Jl. Percetakan Negara No. 88, Rawasari, Jakarta Pusat',
    },
    {
      father: { name: 'Mayor Inf. Rudi Hartono', phone: '081555667788', email: 'rudi.hartono@tni.mil.id', occupation: 'Perwira TNI AD', relationship: 'Ayah' },
      mother: { name: 'Endang Wahyuni, S.E.', phone: '081544332211', email: 'endang.wahyuni@yahoo.com', occupation: 'Akuntan Perusahaan', relationship: 'Ibu' },
      address: 'Kompleks Militer Kodam Jaya, Jakarta Pusat',
    },
  ];

  let createdParents = 0;

  for (let i = 0; i < students.length; i++) {
    const student = students[i];
    const sample = parentSamples[i % parentSamples.length];

    // 1. Create or connect Father
    const father = await prisma.parent.create({
      data: {
        name: sample.father.name,
        relationship: sample.father.relationship,
        phone: sample.father.phone,
        email: sample.father.email,
        occupation: sample.father.occupation,
        address: sample.address,
      },
    });

    await prisma.studentParent.upsert({
      where: {
        studentId_parentId: {
          studentId: student.id,
          parentId: father.id,
        },
      },
      update: {},
      create: {
        studentId: student.id,
        parentId: father.id,
      },
    });

    // 2. Create or connect Mother
    const mother = await prisma.parent.create({
      data: {
        name: sample.mother.name,
        relationship: sample.mother.relationship,
        phone: sample.mother.phone,
        email: sample.mother.email,
        occupation: sample.mother.occupation,
        address: sample.address,
      },
    });

    await prisma.studentParent.upsert({
      where: {
        studentId_parentId: {
          studentId: student.id,
          parentId: mother.id,
        },
      },
      update: {},
      create: {
        studentId: student.id,
        parentId: mother.id,
      },
    });

    createdParents += 2;
  }

  console.log(`Successfully created and linked ${createdParents} parents across ${students.length} students!`);
}

seedParents()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
