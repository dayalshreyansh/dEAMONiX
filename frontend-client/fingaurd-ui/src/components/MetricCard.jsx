import React from 'react';

export default function MetricCard({ title, value, statusColor }) {
  return (
    <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl backdrop-blur-md hover:border-slate-700 transition-colors">
      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">{title}</span>
      <div className={`text-3xl font-black mt-2 tracking-tight font-mono ${statusColor}`}>
        {value}
      </div>
    </div>
  );
}