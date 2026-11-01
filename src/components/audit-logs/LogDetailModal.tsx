'use client';

import React from 'react';
import {
  ShieldAlert,
  Clock,
  User,
  Monitor,
  Database,
  ArrowRight,
  X,
  FileCode,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

interface LogDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  log: any | null;
}

const ACTION_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  CREATE: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  UPDATE: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  DELETE: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
  LOGIN: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  LOGOUT: { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200' },
};

export default function LogDetailModal({ isOpen, onClose, log }: LogDetailModalProps) {
  if (!isOpen || !log) return null;

  const actionStyle = ACTION_COLORS[log.action] || {
    bg: 'bg-slate-50',
    text: 'text-slate-700',
    border: 'border-slate-200',
  };

  const hasDiff = Boolean(log.oldData || log.newData);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xl max-w-2xl w-full my-8 overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 bg-slate-900 text-white flex items-center justify-between flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white/10 rounded-xl">
              <ShieldAlert className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-sm font-bold">Inspeksi Log Audit Keamanan</h2>
              <p className="text-[11px] text-slate-400 font-mono">ID: {log.id}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="p-1.5 text-slate-400 hover:text-white rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5 text-xs text-slate-700">
          {/* Top badges */}
          <div className="flex flex-wrap items-center gap-2">
            <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-lg border ${actionStyle.bg} ${actionStyle.text} ${actionStyle.border}`}>
              {log.action}
            </span>
            <span className="text-[11px] font-mono px-2.5 py-0.5 bg-slate-100 text-slate-800 rounded-lg font-bold border border-slate-200">
              MODUL: {log.module}
            </span>
            <span className="text-[11px] text-slate-400 font-mono ml-auto">
              {new Date(log.createdAt).toLocaleString('id-ID')}
            </span>
          </div>

          {/* Description */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              Deskripsi Kejadian:
            </span>
            <p className="text-sm font-semibold text-slate-900 leading-relaxed">
              {log.description}
            </p>
          </div>

          {/* User & Network Information */}
          <div className="grid grid-cols-2 gap-3 bg-white p-4 rounded-2xl border border-slate-200 text-xs">
            <div className="space-y-1">
              <span className="text-slate-400 text-[10px] uppercase font-bold block">Pengguna / Aktor:</span>
              <p className="font-bold text-slate-900 flex items-center">
                <User className="w-3.5 h-3.5 mr-1 text-slate-400" />
                {log.user?.username || 'Sistem Otomatis'} ({log.roleName || '-'})
              </p>
              {log.user?.email && <p className="text-[11px] text-slate-500 font-mono">{log.user.email}</p>}
            </div>

            <div className="space-y-1">
              <span className="text-slate-400 text-[10px] uppercase font-bold block">Jaringan & Perangkat:</span>
              <p className="font-mono text-slate-800 font-medium flex items-center">
                <Monitor className="w-3.5 h-3.5 mr-1 text-slate-400" />
                IP: {log.ipAddress || '127.0.0.1'}
              </p>
              {log.recordId && (
                <p className="text-[10px] text-slate-400 font-mono truncate" title={log.recordId}>
                  Target ID: {log.recordId}
                </p>
              )}
            </div>
          </div>

          {/* Data Diff (Before vs After) */}
          {hasDiff && (
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="flex items-center space-x-1.5 text-slate-800 font-bold">
                <Database className="w-4 h-4 text-indigo-600" />
                <span>Perubahan Struktur Data (Data Payload)</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Old Data */}
                <div className="p-3 bg-slate-900 text-slate-200 rounded-xl overflow-x-auto text-[11px] font-mono">
                  <span className="text-rose-400 font-bold block border-b border-slate-800 pb-1 mb-2">
                    ◀ Data Sebelum (oldData):
                  </span>
                  {log.oldData ? (
                    <pre className="whitespace-pre-wrap">{JSON.stringify(log.oldData, null, 2)}</pre>
                  ) : (
                    <span className="text-slate-500 italic">Tidak ada rekam data lama (Penambahan baru)</span>
                  )}
                </div>

                {/* New Data */}
                <div className="p-3 bg-slate-900 text-slate-200 rounded-xl overflow-x-auto text-[11px] font-mono">
                  <span className="text-emerald-400 font-bold block border-b border-slate-800 pb-1 mb-2">
                    ▶ Data Sesudah (newData):
                  </span>
                  {log.newData ? (
                    <pre className="whitespace-pre-wrap">{JSON.stringify(log.newData, null, 2)}</pre>
                  ) : (
                    <span className="text-slate-500 italic">Data dihapus dari sistem</span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-800 text-xs font-semibold rounded-xl transition"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
