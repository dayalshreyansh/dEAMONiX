import React from 'react';

export default function ForensicJobRow({ doc }) {
  const fileName = doc.storagePath.split('/').pop();
  const isGreen = doc.complianceMathStatus === 'GREEN';

  return (
    <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-xl overflow-hidden grid grid-cols-1 lg:grid-cols-3 hover:border-slate-700 transition-all">
      {/* Metadata Panel */}
      <div className="p-6 border-b lg:border-b-0 lg:border-r border-slate-800 flex flex-col justify-between gap-4">
        <div>
          <span className="text-[10px] font-mono text-slate-600 block">{doc.jobId}</span>
          <h4 className="text-sm font-bold text-slate-200 mt-1 font-mono truncate" title={fileName}>{fileName}</h4>
        </div>
        <div className="space-y-2 text-xs">
          <p class="text-slate-400">Taxonomy: <span className="text-slate-200 font-mono text-[11px] bg-slate-950 px-2 py-0.5 rounded border border-slate-800">{doc.inferredType}</span></p>
          <p class="text-slate-400">Compliance Audit: <span className={`font-bold ${isGreen ? 'text-emerald-400' : 'text-rose-400'}`}>{doc.complianceMathStatus}</span></p>
          <p class="text-slate-400">Tamper Score: <span className="font-mono text-slate-200 font-bold">{doc.visualTamperScore}%</span></p>
        </div>
      </div>
      
      {/* System Logs Panel */}
      <div className="p-6 lg:col-span-2 bg-slate-950/20 flex flex-col justify-between">
        <div>
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2">Automated Audit Log</span>
          <div className="bg-slate-950 border border-slate-800/80 p-4 rounded-xl font-mono text-xs text-slate-400 leading-relaxed min-h-[75px]">
            {doc.auditLog || "No ledger statements emitted."}
          </div>
        </div>
        <div className="mt-4 text-[10px] font-mono text-slate-600 truncate">Object Path: {doc.storagePath}</div>
      </div>
    </div>
  );
}