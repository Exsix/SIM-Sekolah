'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { School, ShieldCheck, Menu, X } from 'lucide-react';

interface PublicNavbarProps {
  schoolName: string;
}

export default function PublicNavbar({ schoolName }: PublicNavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinks = [
    { label: 'Profil', href: '#profil' },
    { label: 'Jurusan', href: '#akademik' },
    { label: 'Prestasi', href: '#prestasi' },
    { label: 'Warta & Agenda', href: '#pengumuman' },
    { label: 'Fasilitas', href: '#fasilitas' },
    { label: 'Kontak', href: '#kontak' },
  ];

  return (
    <header className="sticky top-0 z-50 bg-[#FAF8F5]/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
        {/* Logo & School Seal */}
        <Link href="/" className="flex items-center space-x-3.5 flex-shrink-0 group">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#0C2340] to-[#153A66] p-0.5 border border-amber-500/60 shadow-xs flex items-center justify-center text-amber-300 group-hover:scale-105 transition duration-200 flex-shrink-0">
            <School className="w-6 h-6 text-amber-300" />
          </div>

          <div className="flex flex-col">
            <span className="text-[10px] font-serif font-bold uppercase tracking-wider text-amber-800 leading-none mb-1">
              SMA Negeri Unggulan
            </span>
            <span className="text-base sm:text-lg font-serif font-bold text-[#0C2340] tracking-tight leading-none group-hover:text-amber-800 transition">
              {schoolName}
            </span>
          </div>
        </Link>

        {/* Desktop Nav Links (Clean, Spacious, Single Line, Never Wraps) */}
        <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
          {navLinks.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="px-3.5 py-2 text-xs font-semibold text-slate-700 hover:text-[#0C2340] hover:bg-slate-200/60 rounded-lg transition whitespace-nowrap"
            >
              {item.label}
            </a>
          ))}
        </nav>

        {/* Action Button: SIM Sekolah Login & Mobile Toggle */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <Link
            href="/login"
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-[#0C2340] hover:bg-[#153A66] text-amber-300 hover:text-white font-bold text-xs tracking-wide shadow-xs hover:shadow border border-amber-500/40 transition flex-shrink-0 whitespace-nowrap"
          >
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            <span>Masuk SIM Sekolah</span>
          </Link>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden p-2 rounded-xl text-slate-700 hover:bg-slate-200/60 transition"
            aria-label="Menu Navigasi"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-[#FAF8F5] px-4 py-3 space-y-1 shadow-lg animate-in fade-in duration-150">
          {navLinks.map((item) => (
            <a
              key={item.label}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className="block px-3 py-2 rounded-lg text-xs font-semibold text-slate-700 hover:text-[#0C2340] hover:bg-slate-200/60 transition"
            >
              {item.label}
            </a>
          ))}
        </div>
      )}
    </header>
  );
}
