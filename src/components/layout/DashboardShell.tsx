'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  Calendar,
  CalendarDays,
  CheckSquare,
  Award,
  Library,
  Bell,
  Settings,
  History,
  LogOut,
  School,
  Menu,
  X,
  User as UserIcon,
  ShieldCheck,
  Clock,
  FileText,
  Trophy,
  ExternalLink,
  Sparkles
} from 'lucide-react';
import { SessionUser } from '@/lib/session';
import NotificationBell from './NotificationBell';

interface DashboardShellProps {
  user: SessionUser;
  children: React.ReactNode;
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: string[];
  category?: string;
}

const ROLE_BADGE: Record<string, { label: string; color: string }> = {
  SUPER_ADMIN: { label: 'Super Admin', color: 'bg-amber-500/20 text-amber-300 border-amber-500/40' },
  ADMIN: { label: 'Administrator', color: 'bg-blue-500/20 text-blue-300 border-blue-500/40' },
  KEPALA_SEKOLAH: { label: 'Kepala Sekolah', color: 'bg-amber-500/25 text-amber-200 border-amber-400/60' },
  GURU: { label: 'Dewan Pendidik', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' },
  WALI_KELAS: { label: 'Wali Kelas', color: 'bg-teal-500/20 text-teal-300 border-teal-500/40' },
  SISWA: { label: 'Peserta Didik', color: 'bg-sky-500/20 text-sky-300 border-sky-500/40' },
  ORANG_TUA: { label: 'Wali Murid', color: 'bg-orange-500/20 text-orange-300 border-orange-500/40' },
  PETUGAS_PERPUSTAKAAN: { label: 'Pustakawan', color: 'bg-purple-500/20 text-purple-300 border-purple-500/40' },
};

export default function DashboardShell({ user, children }: DashboardShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  };

  // Nav items with strict Role-Based Access Control (RBAC)
  const allNavItems: NavItem[] = [
    // 1. Dashboard Utama
    {
      label: user.role === 'SISWA' || user.role === 'ORANG_TUA' ? 'Portal Siswa & Wali' : user.role === 'GURU' ? 'Dashboard Guru' : 'Ikhtisar Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
      roles: ['SUPER_ADMIN', 'ADMIN', 'KEPALA_SEKOLAH', 'GURU', 'WALI_KELAS', 'SISWA', 'ORANG_TUA', 'PETUGAS_PERPUSTAKAAN'],
      category: 'Menu Utama',
    },
    // Khusus Siswa: Profil & Biodata Saya
    ...(user.role === 'SISWA' && user.studentId
      ? [
          {
            label: 'Biodata & Profil Saya',
            href: `/dashboard/students/${user.studentId}`,
            icon: UserIcon,
            roles: ['SISWA'],
            category: 'Menu Utama',
          },
        ]
      : []),
    // Khusus Guru: Profil Pendidik
    ...(user.role === 'GURU' && user.teacherId
      ? [
          {
            label: 'Profil Pendidik Saya',
            href: `/dashboard/teachers/${user.teacherId}`,
            icon: UserIcon,
            roles: ['GURU', 'WALI_KELAS'],
            category: 'Menu Utama',
          },
        ]
      : []),

    // 2. Data Master (Hanya Admin / Manajemen / Guru)
    {
      label: 'Data Siswa',
      href: '/dashboard/students',
      icon: GraduationCap,
      roles: ['SUPER_ADMIN', 'ADMIN', 'KEPALA_SEKOLAH', 'GURU', 'WALI_KELAS'],
      category: 'Data Master',
    },
    {
      label: 'Data Guru & Staf',
      href: '/dashboard/teachers',
      icon: Users,
      roles: ['SUPER_ADMIN', 'ADMIN', 'KEPALA_SEKOLAH'],
      category: 'Data Master',
    },
    {
      label: 'Kelas & Rombel',
      href: '/dashboard/classes',
      icon: CalendarDays,
      roles: ['SUPER_ADMIN', 'ADMIN', 'KEPALA_SEKOLAH', 'GURU', 'WALI_KELAS'],
      category: 'Data Master',
    },
    {
      label: 'Mata Pelajaran',
      href: '/dashboard/subjects',
      icon: BookOpen,
      roles: ['SUPER_ADMIN', 'ADMIN', 'KEPALA_SEKOLAH', 'GURU'],
      category: 'Data Master',
    },

    // 3. Aktivitas Akademik
    {
      label: user.role === 'SISWA' ? 'Jadwal Pelajaran Saya' : 'Jadwal Pelajaran',
      href: '/dashboard/schedules',
      icon: Calendar,
      roles: ['SUPER_ADMIN', 'ADMIN', 'KEPALA_SEKOLAH', 'GURU', 'WALI_KELAS', 'SISWA'],
      category: 'Akademik',
    },
    {
      label: user.role === 'SISWA' ? 'Presensi Kehadiran' : 'Absensi Siswa',
      href: '/dashboard/attendance',
      icon: CheckSquare,
      roles: ['SUPER_ADMIN', 'ADMIN', 'KEPALA_SEKOLAH', 'GURU', 'WALI_KELAS', 'SISWA'],
      category: 'Akademik',
    },
    {
      label: user.role === 'GURU' ? 'Presensi Mandiri' : 'Absensi Guru & GTK',
      href: '/dashboard/teacher-attendance',
      icon: Clock,
      roles: ['SUPER_ADMIN', 'ADMIN', 'KEPALA_SEKOLAH', 'GURU'],
      category: 'Akademik',
    },
    {
      label: user.role === 'SISWA' ? 'Nilai & Rapor Saya' : 'Penilaian & Rapor',
      href: '/dashboard/grades',
      icon: Award,
      roles: ['SUPER_ADMIN', 'ADMIN', 'KEPALA_SEKOLAH', 'GURU', 'WALI_KELAS'],
      category: 'Akademik',
    },
    {
      label: user.role === 'SISWA' ? 'Prestasi & Kejuaraan' : 'Prestasi Siswa',
      href: '/dashboard/achievements',
      icon: Trophy,
      roles: ['SUPER_ADMIN', 'ADMIN', 'KEPALA_SEKOLAH', 'GURU', 'WALI_KELAS', 'SISWA', 'ORANG_TUA'],
      category: 'Akademik',
    },
    {
      label: 'Perpustakaan Digital',
      href: '/dashboard/library',
      icon: Library,
      roles: ['SUPER_ADMIN', 'ADMIN', 'KEPALA_SEKOLAH', 'GURU', 'WALI_KELAS', 'SISWA', 'PETUGAS_PERPUSTAKAAN'],
      category: 'Layanan',
    },
    {
      label: 'Pengumuman Sekolah',
      href: '/dashboard/announcements',
      icon: Bell,
      roles: ['SUPER_ADMIN', 'ADMIN', 'KEPALA_SEKOLAH', 'GURU', 'WALI_KELAS', 'SISWA', 'ORANG_TUA', 'PETUGAS_PERPUSTAKAAN'],
      category: 'Layanan',
    },
    {
      label: 'Pusat Laporan Eksekutif',
      href: '/dashboard/reports',
      icon: FileText,
      roles: ['SUPER_ADMIN', 'ADMIN', 'KEPALA_SEKOLAH'],
      category: 'Layanan',
    },

    // 4. Sistem & Pengaturan
    {
      label: 'Keamanan & Log Audit',
      href: '/dashboard/audit-logs',
      icon: ShieldCheck,
      roles: ['SUPER_ADMIN', 'ADMIN', 'KEPALA_SEKOLAH'],
      category: 'Sistem',
    },
    {
      label: 'Pengaturan Sekolah',
      href: '/dashboard/settings',
      icon: Settings,
      roles: ['SUPER_ADMIN', 'ADMIN'],
      category: 'Sistem',
    },
  ];

  // Filter items matching current user's role
  const allowedNavItems = allNavItems.filter((item) => item.roles.includes(user.role));

  const roleInfo = ROLE_BADGE[user.role] || {
    label: user.role,
    color: 'bg-slate-800 text-slate-300 border-slate-700',
  };

  // Group by category
  const categories = ['Menu Utama', 'Data Master', 'Akademik', 'Layanan', 'Sistem'];

  const renderNavLinks = () => (
    <div className="space-y-4">
      {categories.map((cat) => {
        const catItems = allowedNavItems.filter((item) => item.category === cat);
        if (catItems.length === 0) return null;

        return (
          <div key={cat} className="space-y-1">
            <div className="px-3 py-1 text-[10px] font-serif font-bold uppercase tracking-widest text-amber-500/70">
              {cat}
            </div>
            {catItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                pathname === item.href ||
                (item.href !== '/dashboard' && pathname?.startsWith(item.href));

              return (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition duration-150 ${
                    isActive
                      ? 'bg-[#153459] text-amber-300 font-bold border-l-4 border-amber-400 shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-[#10243d]'
                  }`}
                >
                  <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-amber-400' : 'text-slate-400'}`} />
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FAF8F5] flex">
      {/* Sidebar Desktop: Regal Navy & Gold Trim */}
      <aside className="hidden md:flex md:w-64 flex-col bg-[#091726] text-slate-300 border-r border-amber-500/20 shadow-xl">
        {/* Brand Crest Header */}
        <div className="h-20 flex items-center gap-3.5 px-5 border-b border-slate-800/80 bg-[#071320]">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0C2340] to-[#153A66] p-0.5 border border-amber-500/60 shadow-md flex items-center justify-center text-amber-400 flex-shrink-0">
            <School className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h1 className="font-serif font-bold text-sm text-white tracking-tight leading-tight truncate">
              SMAN 1 Nusantara
            </h1>
            <p className="text-[10px] text-amber-400/80 font-mono tracking-wider truncate">
              SIM SEKOLAH TERPADU
            </p>
          </div>
        </div>

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-2">
          {renderNavLinks()}
        </div>

        {/* User Card & Logout Footer */}
        <div className="p-4 border-t border-slate-800 bg-[#071320]">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-300 font-bold text-sm flex items-center justify-center border border-amber-500/30">
                {user?.name?.[0] || 'U'}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-white truncate">{user?.name}</p>
                <span
                  className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold border ${roleInfo.color} mt-0.5`}
                >
                  {roleInfo.label}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl text-[11px] font-medium text-slate-300 bg-slate-800/80 hover:bg-slate-800 hover:text-white transition"
              title="Kunjungi Beranda Publik"
            >
              <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
              <span>Beranda</span>
            </Link>

            <button
              onClick={handleLogout}
              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl text-[11px] font-medium text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 transition cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Keluar</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside className="relative flex flex-col w-64 max-w-xs bg-[#091726] text-slate-300 shadow-2xl z-50">
            <div className="h-16 flex items-center justify-between px-5 border-b border-slate-800 bg-[#071320]">
              <div className="flex items-center gap-2.5">
                <School className="w-5 h-5 text-amber-400" />
                <span className="font-serif font-bold text-sm text-white">SMAN 1 Nusantara</span>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto py-4 px-3">
              {renderNavLinks()}
            </div>
            <div className="p-4 border-t border-slate-800 bg-[#071320]">
              <p className="text-xs font-semibold text-white truncate">{user?.name}</p>
              <span className="text-[10px] text-amber-400/80">{roleInfo.label}</span>
              <button
                onClick={handleLogout}
                className="mt-3 w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-medium text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 transition"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Keluar Sistem</span>
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar: Stately Ivory & Clean Institutional Trim */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-8 shadow-2xs">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 text-xs">
              <span className="font-serif font-bold text-[#0C2340] hidden sm:inline">
                Tahun Ajaran:
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-900 border border-amber-300 text-[11px] font-semibold font-mono">
                2026/2027 Ganjil
              </span>
              <span className="text-slate-400 hidden lg:inline">•</span>
              <span className="text-slate-500 text-[11px] hidden lg:inline">
                Kurikulum Merdeka Mandiri Berbagi
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <NotificationBell />
            <div className="h-6 w-px bg-slate-200 hidden sm:block" />
            <div className="text-right hidden sm:block">
              <p className="text-xs font-serif font-bold text-[#0C2340]">{user?.name}</p>
              <p className="text-[10px] text-amber-800 font-medium">{roleInfo.label}</p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-[#0C2340] text-amber-300 font-serif font-bold text-sm flex items-center justify-center border border-amber-500/40 shadow-xs">
              {user?.name?.[0] || 'U'}
            </div>
          </div>
        </header>

        {/* Dynamic Page Content with Scholastic Texture */}
        <main className="flex-1 p-4 sm:p-8 overflow-y-auto bg-scholastic-pattern">
          {children}
        </main>
      </div>
    </div>
  );
}
