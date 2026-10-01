import React, { useState } from 'react';
import { History, Search, ShieldCheck, Download, Filter } from 'lucide-react';
import { AuditLog } from '../types';

interface AuditLogViewProps {
  auditLogs: AuditLog[];
}

export const AuditLogView: React.FC<AuditLogViewProps> = ({ auditLogs }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredLogs = (auditLogs || []).filter((l) => {
    const q = (searchTerm || '').toLowerCase();
    return (
      (l.action || '').toLowerCase().includes(q) ||
      (l.entity_type || '').toLowerCase().includes(q) ||
      (l.entity_id || '').toLowerCase().includes(q) ||
      (l.details || '').toLowerCase().includes(q) ||
      (l.user_name || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              BIR CAS Certified Audit Trail
            </h2>
            <span className="px-2.5 py-0.5 text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              Immutable CAS Standard
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Chronological system logs capturing all invoice modifications, QuickBooks synchronizations, and BIR EIS transmissions.
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 flex items-center justify-between shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search audit logs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white transition"
          />
        </div>
        <span className="text-xs text-slate-500 font-mono">
          Total Logs: {auditLogs.length}
        </span>
      </div>

      {/* Log Table */}
      <div className="rounded-2xl bg-white border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase font-semibold text-[11px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Action Event</th>
                <th className="py-3 px-4">Entity Type</th>
                <th className="py-3 px-4">Entity Reference</th>
                <th className="py-3 px-4">Operator</th>
                <th className="py-3 px-4">Event Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 text-xs">
                    No audit logs matching search query.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-4 font-mono text-slate-500 text-[11px]">
                      {log.timestamp ? new Date(log.timestamp).toLocaleString() : 'N/A'}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-emerald-700">
                      {log.action}
                    </td>
                    <td className="py-3.5 px-4 text-blue-700 font-semibold">
                      {log.entity_type}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-700">
                      {log.entity_id}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {log.user_name}
                    </td>
                    <td className="py-3.5 px-4 text-slate-800 font-sans max-w-md">
                      {log.details}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
