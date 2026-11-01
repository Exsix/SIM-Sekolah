import Link from 'next/link';
import {
  School,
  ArrowRight,
  GraduationCap,
  Users,
  Award,
  BookOpen,
  ShieldCheck,
  Sparkles,
  Calendar,
  Clock,
  MapPin,
  Phone,
  Mail,
  Globe,
  CheckCircle2,
  ChevronRight,
  BookMarked,
  Microscope,
  Compass,
  Building,
  Trophy,
  ExternalLink,
  Library,
  Flame,
  FileText
} from 'lucide-react';
import { prisma } from '@/lib/prisma';
import PublicNavbar from '@/components/home/PublicNavbar';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  // Query real data from database
  const [
    setting,
    publicAnnouncements,
    studentCount,
    teacherCount,
    classCount,
    topAchievements,
  ] = await Promise.all([
    prisma.schoolSetting.findFirst(),
    prisma.announcement.findMany({
      where: {
        isPublished: true,
        OR: [{ targetRole: 'ALL' }, { targetRole: null }],
      },
      orderBy: { publishDate: 'desc' },
      take: 3,
    }),
    prisma.student.count({ where: { status: 'AKTIF' } }),
    prisma.teacher.count({ where: { isActive: true } }),
    prisma.class.count({ where: { isActive: true } }),
    prisma.achievement.findMany({
      where: { isVerified: true },
      orderBy: [{ isFeatured: 'desc' }, { date: 'desc' }],
      take: 3,
      include: {
        student: {
          select: {
            name: true,
            nis: true,
            class: { select: { name: true } },
          },
        },
      },
    }),
  ]);

  const schoolName = setting?.name || 'SMA Negeri 1 Nusantara';
  const schoolNpsn = setting?.npsn || '20260001';
  const schoolAddress = setting?.address || 'Jl. Pendidikan Merdeka No. 45, Jakarta Pusat, DKI Jakarta 10110';
  const schoolPhone = setting?.phone || '(021) 345-6789';
  const schoolEmail = setting?.email || 'sekretariat@sman1nusantara.sch.id';
  const schoolPrincipal = setting?.principalName || 'Dr. H. Ahmad Sudirman, M.Pd.';
  const schoolHours = setting?.operationalHours || 'Senin - Jumat: 06:45 - 15:45 WIB';

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-slate-800 flex flex-col font-sans">
      {/* 1. KOP RESMI DINAS & IDENTITAS PEMERINTAH */}
      <div className="bg-[#091726] text-slate-300 text-xs py-2 px-4 sm:px-6 lg:px-8 border-b border-amber-500/30">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-2.5">
          <div className="flex items-center space-x-3 text-[11px] tracking-wide">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/40">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
              PORTAL RESMI
            </span>
            <span className="hidden sm:inline font-medium text-slate-300">
              Kementerian Pendidikan, Kebudayaan, Riset, dan Teknologi RI • Dinas Pendidikan DKI Jakarta
            </span>
          </div>

          <div className="flex items-center space-x-3 text-[11px] text-slate-300 font-mono">
            <span>NPSN: <strong className="text-white">{schoolNpsn}</strong></span>
            <span className="text-slate-600">•</span>
            <span className="text-amber-300 font-semibold">Akreditasi A (Unggul 96.8)</span>
            <span className="text-slate-600 hidden sm:inline">•</span>
            <span className="hidden sm:inline text-slate-300">Kurikulum Merdeka</span>
          </div>
        </div>
      </div>

      {/* 2. STATELY SCHOOL NAVBAR (Clean, Spacious, Un-cramped) */}
      <PublicNavbar schoolName={schoolName} />

      {/* 3. HERO SECTION: ACADEMIC CITADEL & STATELY ENTRANCE */}
      <section className="relative overflow-hidden py-14 lg:py-20 bg-scholastic-pattern border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            {/* Left Column: Vision & Identity */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-100 border border-amber-300 text-amber-900 text-xs font-semibold">
                <Flame className="w-4 h-4 text-amber-700 flex-shrink-0" />
                <span>Sapientia, Virtus, et Patria — Cerdas, Berkarakter, Berdaya Saing Global</span>
              </div>

              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-[#0C2340] leading-tight tracking-tight">
                Membentuk Generasi Pemimpin Bangsa yang <span className="text-amber-800 underline decoration-amber-500/50 underline-offset-8">Berakhlak Mulia</span> & Berprestasi Global.
              </h2>

              <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl">
                Selamat datang di situs resmi <strong>{schoolName}</strong>. Selama lebih dari empat dekade, kami berdedikasi menyelenggarakan pendidikan menengah atas holistik yang memadukan keunggulan akademik, riset sains teknologi, kepemimpinan transformatif, serta integritas moral generasi penerus Indonesia.
              </p>

              {/* 4 Pillars Badge Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 pt-2">
                <div className="p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
                  <GraduationCap className="w-5 h-5 text-amber-700 mb-1.5" />
                  <div className="font-serif font-bold text-xs text-[#0C2340]">Kurikulum Merdeka</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Berbasis Proyek & Riset</div>
                </div>

                <div className="p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
                  <Trophy className="w-5 h-5 text-amber-700 mb-1.5" />
                  <div className="font-serif font-bold text-xs text-[#0C2340]">Akreditasi A</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">BAN-S/M Unggul 96.8</div>
                </div>

                <div className="p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
                  <Globe className="w-5 h-5 text-amber-700 mb-1.5" />
                  <div className="font-serif font-bold text-xs text-[#0C2340]">Prestasi Global</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">OSN & Olympiad Camp</div>
                </div>

                <div className="p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
                  <ShieldCheck className="w-5 h-5 text-amber-700 mb-1.5" />
                  <div className="font-serif font-bold text-xs text-[#0C2340]">100% SIM Terpadu</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Presensi & Rapor Digital</div>
                </div>
              </div>

              {/* CTA Action Buttons */}
              <div className="flex flex-wrap items-center gap-4 pt-4">
                <Link
                  href="/login"
                  className="px-6 py-3 rounded-xl bg-[#0C2340] hover:bg-[#153A66] text-amber-300 hover:text-white font-bold text-xs shadow-md shadow-[#0C2340]/20 flex items-center space-x-2 border border-amber-500/40 transition"
                >
                  <span>Masuk ke Dashboard Akademik</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <a
                  href="#profil"
                  className="px-6 py-3 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs border border-slate-300 shadow-2xs transition"
                >
                  Pelajari Profil Lembaga
                </a>
              </div>
            </div>

            {/* Right Column: Formal Accreditation & Stately Notice Card */}
            <div className="lg:col-span-5">
              <div className="relative rounded-3xl bg-gradient-to-b from-[#0C2340] to-[#081729] p-7 sm:p-8 text-white shadow-xl border-2 border-amber-500/40">
                <span className="text-[10px] font-mono font-bold tracking-widest text-amber-300 uppercase block mb-1">
                  LEMBAGA TERAKREDITASI NASIONAL
                </span>
                <h3 className="text-xl font-serif font-bold text-white mb-2 leading-snug">
                  Komitmen Mutu & Keunggulan Belajar
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed mb-6">
                  SMAN 1 Nusantara mengimplementasikan standarisasi tata kelola sekolah digital terpadu, mengintegrasikan data akademik, absensi harian, transparansi nilai ujian, dan catatan prestasi kejuaraan dalam satu ekosistem terpadu.
                </p>

                {/* Quick Real Stats inside the Stately Card */}
                <div className="grid grid-cols-3 gap-3 p-4 rounded-2xl bg-white/5 border border-white/10 text-center mb-6">
                  <div>
                    <div className="text-2xl font-serif font-bold text-amber-300">{studentCount}</div>
                    <div className="text-[10px] text-slate-300 uppercase tracking-wider mt-0.5">Siswa Aktif</div>
                  </div>
                  <div className="border-x border-white/10">
                    <div className="text-2xl font-serif font-bold text-amber-300">{teacherCount}</div>
                    <div className="text-[10px] text-slate-300 uppercase tracking-wider mt-0.5">Pendidik & GTK</div>
                  </div>
                  <div>
                    <div className="text-2xl font-serif font-bold text-amber-300">{classCount}</div>
                    <div className="text-[10px] text-slate-300 uppercase tracking-wider mt-0.5">Rombel Kelas</div>
                  </div>
                </div>

                {/* Direct Link to parent/student portal */}
                <div className="pt-4 border-t border-white/10 flex items-center justify-between text-xs">
                  <div className="text-slate-300 text-[11px]">
                    Akses Peserta Didik & Orang Tua:
                  </div>
                  <Link
                    href="/login"
                    className="text-amber-300 font-bold hover:text-white flex items-center gap-1 transition"
                  >
                    <span>Masuk Portal Siswa</span>
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. REAL-TIME STATS STRIP (Spacious Card Layout) */}
      <section className="bg-white border-b border-slate-200 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <div className="flex items-center space-x-3.5 p-4 rounded-2xl bg-[#FAF8F5] border border-slate-200/80">
              <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center font-bold flex-shrink-0">
                <Trophy className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="text-xl font-serif font-bold text-[#0C2340] truncate">Juara 1 OSN</div>
                <div className="text-xs text-slate-500 font-medium truncate">Informatika & Debat 2026</div>
              </div>
            </div>

            <div className="flex items-center space-x-3.5 p-4 rounded-2xl bg-[#FAF8F5] border border-slate-200/80">
              <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-900 flex items-center justify-center font-bold flex-shrink-0">
                <Building className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <div className="text-xl font-serif font-bold text-[#0C2340] truncate">100% PTN</div>
                <div className="text-xs text-slate-500 font-medium truncate">Tembus SNBP & SNBT Favorit</div>
              </div>
            </div>

            <div className="flex items-center space-x-3.5 p-4 rounded-2xl bg-[#FAF8F5] border border-slate-200/80">
              <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center font-bold flex-shrink-0">
                <Library className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="text-xl font-serif font-bold text-[#0C2340] truncate">Digital Lab</div>
                <div className="text-xs text-slate-500 font-medium truncate">Perpustakaan & Riset AI</div>
              </div>
            </div>

            <div className="flex items-center space-x-3.5 p-4 rounded-2xl bg-[#FAF8F5] border border-slate-200/80">
              <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-900 flex items-center justify-center font-bold flex-shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="text-xl font-serif font-bold text-[#0C2340] truncate">Adiwiyata</div>
                <div className="text-xs text-slate-500 font-medium truncate">Sekolah Ramah Lingkungan</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. SAMBUTAN RESMI KEPALA SEKOLAH (Formal Letterhead Desk) */}
      <section id="profil" className="py-16 sm:py-20 bg-[#FAF8F5] border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl bg-white border border-slate-200 p-8 sm:p-12 shadow-sm">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
              {/* Photo & Seal Column */}
              <div className="lg:col-span-4 flex flex-col items-center text-center">
                <div className="relative mb-4">
                  {/* Formal Frame */}
                  <div className="w-44 h-52 rounded-2xl bg-gradient-to-tr from-[#0C2340] to-slate-700 p-2 shadow-xl border-4 border-amber-500/40 flex items-center justify-center">
                    <div className="w-full h-full rounded-xl bg-slate-100 flex flex-col items-center justify-center text-slate-400">
                      <GraduationCap className="w-14 h-14 text-[#0C2340]/60 mb-2" />
                      <span className="text-[10px] font-serif font-bold text-[#0C2340]">Foto Resmi Pimpinan</span>
                    </div>
                  </div>
                  {/* Seal Badge */}
                  <div className="absolute -bottom-2.5 -right-2.5 w-11 h-11 rounded-full bg-amber-600 border-2 border-white text-white flex items-center justify-center shadow-md">
                    <Award className="w-5 h-5" />
                  </div>
                </div>

                <h4 className="font-serif font-bold text-base text-[#0C2340]">{schoolPrincipal}</h4>
                <p className="text-xs text-amber-800 font-semibold uppercase tracking-wider">Kepala Sekolah</p>
                <p className="text-[11px] text-slate-500 font-mono mt-0.5">NIP: 19680514 199303 1 002</p>
              </div>

              {/* Official Statement Text */}
              <div className="lg:col-span-8 space-y-4">
                <div className="inline-flex items-center gap-1.5 text-xs font-serif font-bold uppercase tracking-widest text-amber-800">
                  <span>Amanat & Sambutan Pimpinan Lembaga</span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-serif font-bold text-[#0C2340] leading-snug">
                  &ldquo;Menyiapkan Insan Akademis Berkarakter Luhur Menghadapi Abad 21&rdquo;
                </h3>
                <div className="prose prose-slate text-sm text-slate-600 space-y-3 leading-relaxed">
                  <p>
                    <em>Assalamu’alaikum Warahmatullahi Wabarakatuh, Salam Sejahtera, Om Swastiastu, Namo Buddhaya, Salam Kebajikan.</em>
                  </p>
                  <p>
                    Puji syukur kita panjatkan ke hadirat Tuhan Yang Maha Esa. Perkembangan sains, teknologi kecerdasan buatan, dan dinamika global menuntut dunia pendidikan untuk tidak hanya berfokus pada capaian kognitif, melainkan mengedepankan pembentukan budi pekerti yang kokoh, integritas etis, dan daya resiliensi tinggi.
                  </p>
                  <p>
                    Di <strong>{schoolName}</strong>, kami meyakini bahwa setiap anak memiliki potensi istimewa yang patut diasah dengan disiplin ilmiah dan kehangatan bimbingan moral. Melalui integrasi Kurikulum Merdeka dan Sistem Informasi Manajemen Sekolah yang transparan, kami berkomitmen memberikan ekosistem pembelajaran yang inklusif, akuntabel, dan bermutu tinggi bagi seluruh siswa dan orang tua murid.
                  </p>
                </div>

                <div className="pt-3 flex items-center gap-4 text-xs font-serif italic text-slate-600">
                  <span>Jakarta, Semester Ganjil Tahun Ajaran 2026/2027</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. PROGRAM UNGGULAN & KONSENTRASI JURUSAN */}
      <section id="akademik" className="py-16 sm:py-20 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14 space-y-2.5">
            <span className="text-xs font-serif font-bold tracking-widest text-amber-800 uppercase">
              STRUKTUR AKADEMIK & KONSENTRASI
            </span>
            <h3 className="text-3xl font-serif font-bold text-[#0C2340]">
              Pilihan Konsentrasi Minat & Bakat Siswa
            </h3>
            <p className="text-sm text-slate-600">
              Disusun secara terstruktur mengikuti pedoman Kurikulum Merdeka, memfasilitasi eksplorasi ilmu alam, sosial kemasyarakatan, serta rekayasa komputasi modern.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {/* Card 1: MIPA */}
            <div className="rounded-3xl bg-[#FAF8F5] border border-slate-200 p-7 hover:shadow-lg hover:border-amber-600 transition flex flex-col justify-between group">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-[#0C2340] text-amber-300 flex items-center justify-center shadow-sm mb-5 group-hover:scale-105 transition">
                  <Microscope className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-mono font-bold text-amber-800 uppercase tracking-widest block mb-1">
                  KONSENTRASI SAINS ALAM
                </span>
                <h4 className="text-lg font-serif font-bold text-[#0C2340] mb-2.5">
                  MIPA & Riset Bioteknologi
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed mb-6">
                  Pendalaman Fisika, Kimia, Biologi tingkat lanjut, dan Matematika murni dengan fokus metodologi riset ilmiah, praktikum laboratorium, dan persiapan Olimpiade Sains Nasional (OSN).
                </p>
              </div>
              <ul className="text-xs text-slate-700 space-y-2 border-t border-slate-200/80 pt-4">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>Klinik Pembinaan Olimpiade Sains</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>Laboratorium Terakreditasi Mandiri</span>
                </li>
              </ul>
            </div>

            {/* Card 2: IPS Humaniora */}
            <div className="rounded-3xl bg-[#FAF8F5] border border-slate-200 p-7 hover:shadow-lg hover:border-amber-600 transition flex flex-col justify-between group">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-[#0C2340] text-amber-300 flex items-center justify-center shadow-sm mb-5 group-hover:scale-105 transition">
                  <Compass className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-mono font-bold text-amber-800 uppercase tracking-widest block mb-1">
                  KONSENTRASI HUMANIORA
                </span>
                <h4 className="text-lg font-serif font-bold text-[#0C2340] mb-2.5">
                  IPS, Diplomasi & Ekonomi Bisnis
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed mb-6">
                  Fokus pada kajian sosiologi terapan, hukum tata negara, ekonomi makro, geografi geopolitik, dan simulasi diplomasi internasional (Model United Nations).
                </p>
              </div>
              <ul className="text-xs text-slate-700 space-y-2 border-t border-slate-200/80 pt-4">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>Simulasi Sidang Diplomasi Pelajar</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>Inkubator Kewirausahaan & Finansial</span>
                </li>
              </ul>
            </div>

            {/* Card 3: Informatika & Rekayasa Komputasi */}
            <div className="rounded-3xl bg-[#FAF8F5] border border-slate-200 p-7 hover:shadow-lg hover:border-amber-600 transition flex flex-col justify-between group">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-[#0C2340] text-amber-300 flex items-center justify-center shadow-sm mb-5 group-hover:scale-105 transition">
                  <Sparkles className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-mono font-bold text-amber-800 uppercase tracking-widest block mb-1">
                  KONSENTRASI DIGITAL
                </span>
                <h4 className="text-lg font-serif font-bold text-[#0C2340] mb-2.5">
                  Informatika & Kecerdasan Buatan
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed mb-6">
                  Pemrograman kompetitif (C++, Python), algoritma struktur data, Internet of Things (IoT), dan etika teknologi digital untuk mencetak talenta rekayasa perangkat lunak masa depan.
                </p>
              </div>
              <ul className="text-xs text-slate-700 space-y-2 border-t border-slate-200/80 pt-4">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>Kompetisi Hackathon & Cipta Algoritma</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>Lab AI & Jaringan Berkecepatan Tinggi</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 7. HALL OF FAME: PRESTASI SISWA NYATA DARI DATABASE */}
      <section id="prestasi" className="py-16 sm:py-20 bg-[#FAF8F5] border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-12 gap-4">
            <div>
              <span className="text-xs font-serif font-bold tracking-widest text-amber-800 uppercase">
                HALL OF FAME & REPUTASI SISWA
              </span>
              <h3 className="text-3xl font-serif font-bold text-[#0C2340] mt-1">
                Catatan Kejuaraan Siswa Berprestasi
              </h3>
              <p className="text-sm text-slate-600 mt-1">
                Dokumentasi nyata capaian medali dan kejuaraan tingkat daerah hingga internasional.
              </p>
            </div>

            <Link
              href="/login"
              className="inline-flex items-center space-x-2 text-xs font-bold text-amber-800 hover:text-amber-950 transition"
            >
              <span>Lihat Seluruh Portofolio Prestasi ({topAchievements.length}+)</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {topAchievements.map((item) => (
              <div
                key={item.id}
                className="rounded-3xl bg-white border border-slate-200 p-6 shadow-xs hover:shadow-md transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300 font-bold text-xs">
                      <Trophy className="w-3.5 h-3.5 text-amber-700" />
                      <span>{item.rank}</span>
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">
                      {item.level}
                    </span>
                  </div>

                  <h4 className="font-serif font-bold text-base text-[#0C2340] line-clamp-2 mb-2">
                    {item.title}
                  </h4>

                  <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed mb-4">
                    {item.description || 'Kejuaraan resmi yang diselenggarakan lembaga kredibel.'}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-800 block">{item.student.name}</span>
                    <span className="text-[11px] text-slate-500">
                      {item.student.class?.name || `NIS ${item.student.nis}`}
                    </span>
                  </div>
                  <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Terverifikasi
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 8. PAPAN PENGUMUMAN RESMI (Notice Board) */}
      <section id="pengumuman" className="py-16 sm:py-20 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-12 gap-4">
            <div>
              <span className="text-xs font-serif font-bold tracking-widest text-amber-800 uppercase">
                PAPAN INFORMASI RESMI
              </span>
              <h3 className="text-3xl font-serif font-bold text-[#0C2340] mt-1">
                Warta & Pengumuman Sekolah
              </h3>
              <p className="text-sm text-slate-600 mt-1">
                Pemberitahuan terkini seputar kalender akademik, kegiatan kesiswaan, dan kedinasan.
              </p>
            </div>

            <Link
              href="/login"
              className="inline-flex items-center space-x-2 text-xs font-bold text-amber-800 hover:text-amber-950 transition"
            >
              <span>Arsip Pengumuman Lengkap</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {publicAnnouncements.map((item) => (
              <div
                key={item.id}
                className="rounded-3xl bg-[#FAF8F5] border border-slate-200 p-6 hover:shadow-md transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 mb-3">
                    <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-700 font-semibold font-mono">
                      WARTA KBM
                    </span>
                    <span className="flex items-center gap-1 font-mono">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(item.publishDate).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </div>

                  <h4 className="font-serif font-bold text-base text-[#0C2340] line-clamp-2 mb-2">
                    {item.title}
                  </h4>

                  <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed mb-4">
                    {item.content}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-200/80 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-slate-500">
                    Oleh: <strong>{item.authorName || 'Humas Sekolah'}</strong>
                  </span>
                  <Link
                    href="/login"
                    className="text-amber-800 hover:underline font-bold text-xs"
                  >
                    Buka Detail →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 9. FASILITAS KAMPUS (Dignified Academic Facilities) */}
      <section id="fasilitas" className="py-16 sm:py-20 bg-[#FAF8F5] border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14 space-y-2.5">
            <span className="text-xs font-serif font-bold tracking-widest text-amber-800 uppercase">
              SARANA & PRASARANA
            </span>
            <h3 className="text-3xl font-serif font-bold text-[#0C2340]">
              Fasilitas Pendukung Keunggulan Belajar
            </h3>
            <p className="text-sm text-slate-600">
              Menyediakan ruang eksplorasi akademik, olahraga, dan seni yang representatif, modern, dan ramah lingkungan.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="rounded-2xl bg-white border border-slate-200 p-5 shadow-2xs">
              <Library className="w-7 h-7 text-[#0C2340] mb-3" />
              <h4 className="font-serif font-bold text-sm text-[#0C2340] mb-1">Perpustakaan Ki Hajar Dewantara</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Ribuan koleksi buku fisik terdaftar ISBN, e-book reader, dan ruang baca hening ber-AC.
              </p>
            </div>

            <div className="rounded-2xl bg-white border border-slate-200 p-5 shadow-2xs">
              <Microscope className="w-7 h-7 text-[#0C2340] mb-3" />
              <h4 className="font-serif font-bold text-sm text-[#0C2340] mb-1">Laboratorium Sains Terpadu</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Fasilitas praktikum Fisika, Kimia, Biologi dengan standar keselamatan kerja laboratorium modern.
              </p>
            </div>

            <div className="rounded-2xl bg-white border border-slate-200 p-5 shadow-2xs">
              <Sparkles className="w-7 h-7 text-[#0C2340] mb-3" />
              <h4 className="font-serif font-bold text-sm text-[#0C2340] mb-1">Lab Komputer & AI</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Perangkat komputasi spek tinggi untuk KBM Informatika, UTBK-SNBT, dan simulasi robotika.
              </p>
            </div>

            <div className="rounded-2xl bg-white border border-slate-200 p-5 shadow-2xs">
              <Building className="w-7 h-7 text-[#0C2340] mb-3" />
              <h4 className="font-serif font-bold text-sm text-[#0C2340] mb-1">Gelanggang Olahraga & Seni</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Lapangan indoor multifungsi untuk basket, futsal, bulutangkis, dan aula panggung kreasi budaya.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 10. STATELY FOOTER (Formal Ministry & School Verification) */}
      <footer id="kontak" className="bg-[#091726] text-slate-300 pt-16 pb-12 border-t-2 border-amber-500/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-10 pb-12 border-b border-slate-800">
            {/* Col 1: School Identity */}
            <div className="lg:col-span-5 space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#0C2340] to-[#153A66] border border-amber-500/50 flex items-center justify-center text-amber-400">
                  <School className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-serif font-bold text-base text-white leading-tight">{schoolName}</h4>
                  <span className="text-xs text-amber-400 font-mono">NPSN: {schoolNpsn}</span>
                </div>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
                Lembaga pendidikan menengah atas rujukan nasional yang berkomitmen melahirkan tunas bangsa berintegritas tinggi, berakhlak mulia, dan siap memimpin peradaban dunia.
              </p>
              <div className="text-xs text-slate-400 font-mono space-y-1">
                <div>Akreditasi BAN-S/M: <strong className="text-amber-300">A (Unggul)</strong></div>
                <div>Status Lembaga: <strong className="text-white">Negeri</strong></div>
              </div>
            </div>

            {/* Col 2: Hubungi Kami */}
            <div className="lg:col-span-4 space-y-3">
              <h5 className="font-serif font-bold text-sm text-white uppercase tracking-wider text-amber-400">
                Alamat & Sekretariat
              </h5>
              <div className="text-xs text-slate-300 space-y-2.5">
                <div className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                  <span>{schoolAddress}</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Phone className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  <span>{schoolPhone}</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Mail className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  <span>{schoolEmail}</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Clock className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  <span>{schoolHours}</span>
                </div>
              </div>
            </div>

            {/* Col 3: Portal SIM Cepat */}
            <div className="lg:col-span-3 space-y-3">
              <h5 className="font-serif font-bold text-sm text-white uppercase tracking-wider text-amber-400">
                Sistem Terpadu
              </h5>
              <ul className="text-xs text-slate-300 space-y-2">
                <li>
                  <Link href="/login" className="hover:text-amber-300 transition flex items-center gap-1.5">
                    <ChevronRight className="w-3.5 h-3.5 text-amber-400" />
                    <span>Portal Siswa & Wali Murid</span>
                  </Link>
                </li>
                <li>
                  <Link href="/login" className="hover:text-amber-300 transition flex items-center gap-1.5">
                    <ChevronRight className="w-3.5 h-3.5 text-amber-400" />
                    <span>Presensi & Absensi Guru</span>
                  </Link>
                </li>
                <li>
                  <Link href="/login" className="hover:text-amber-300 transition flex items-center gap-1.5">
                    <ChevronRight className="w-3.5 h-3.5 text-amber-400" />
                    <span>Perpustakaan Digital</span>
                  </Link>
                </li>
                <li>
                  <Link href="/login" className="hover:text-amber-300 transition flex items-center gap-1.5">
                    <ChevronRight className="w-3.5 h-3.5 text-amber-400" />
                    <span>Pusat Laporan Eksekutif</span>
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Copyright Strip */}
          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-400 gap-3">
            <p>© {new Date().getFullYear()} {schoolName}. Seluruh Hak Cipta Dilindungi Undang-Undang.</p>
            <div className="flex items-center gap-4 text-slate-400">
              <span>Kurikulum Merdeka</span>
              <span>•</span>
              <span>Dinas Pendidikan DKI Jakarta</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
