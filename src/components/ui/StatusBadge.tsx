import React from 'react';

type StudentStatus = 'AKTIF' | 'LULUS' | 'PINDAH' | 'KELUAR' | 'DROPOUT' | string;

interface StatusBadgeProps {
  status: StudentStatus;
  size?: 'sm' | 'md';
}

export default function StatusBadge({ status, size = 'sm' }: StatusBadgeProps) {
  let badgeColor = 'bg-slate-100 text-slate-700 border-slate-200';
  let label = status;

  switch (status) {
    case 'AKTIF':
      badgeColor = 'bg-emerald-50 text-emerald-700 border-emerald-200';
      label = 'Aktif';
      break;
    case 'LULUS':
      badgeColor = 'bg-blue-50 text-blue-700 border-blue-200';
      label = 'Lulus';
      break;
    case 'PINDAH':
      badgeColor = 'bg-amber-50 text-amber-700 border-amber-200';
      label = 'Pindah';
      break;
    case 'KELUAR':
      badgeColor = 'bg-rose-50 text-rose-700 border-rose-200';
      label = 'Keluar';
      break;
    case 'DROPOUT':
      badgeColor = 'bg-gray-100 text-gray-700 border-gray-300';
      label = 'Drop Out';
      break;
    default:
      badgeColor = 'bg-slate-50 text-slate-600 border-slate-200';
  }

  const sizeClasses = size === 'sm' ? 'px-2.5 py-0.5 text-xs' : 'px-3 py-1 text-sm';

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border ${sizeClasses} ${badgeColor}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 opacity-70"></span>
      {label}
    </span>
  );
}
