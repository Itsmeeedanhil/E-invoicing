import React from 'react';
import { X, CheckCircle2, ShieldCheck, Copy, FileCode2 } from 'lucide-react';
import { EisTransmission } from '../types';

interface TransmissionModalProps {
  transmission: EisTransmission | null;
  onClose: () => void;
}

export const TransmissionModal: React.FC<TransmissionModalProps> = ({
  transmission,
  onClose,
}) => {
  if (!transmission) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="px-6 py-4 border-b border-emerald-100 flex items-center justify-between bg-emerald-50/70">
          <div className="flex items-center gap-2 text-emerald-700">
            <ShieldCheck className="w-5 h-5" />
            <h3 className="text-base font-bold text-slate-900">
              BIR EIS Transmission Receipt
            </h3>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 text-xs">
          <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-200 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">
                Batch Successfully Acknowledged by BIR EIS
              </h4>
              <p className="text-slate-600 mt-0.5">
                {transmission.invoice_count} invoices validated and recorded in BIR Electronic Storage.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 font-mono">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-slate-500 text-[10px] block font-semibold">BIR ACKNOWLEDGEMENT NUMBER</span>
              <p className="text-emerald-700 font-bold text-sm mt-1">{transmission.ack_number}</p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-slate-500 text-[10px] block font-semibold">TRANSMISSION BATCH ID</span>
              <p className="text-slate-800 font-bold text-xs mt-1">{transmission.batch_id}</p>
            </div>
          </div>

          <div className="space-y-1.5 font-mono">
            <span className="text-slate-500 text-[10px] font-semibold">PAYLOAD SHA-256 HASH</span>
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-[11px] truncate">
              {transmission.payload_hash}
            </div>
          </div>

          <div className="space-y-1.5 font-mono">
            <span className="text-slate-500 text-[10px] font-semibold">RAW BIR RESPONSE</span>
            <pre className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-emerald-400 text-[11px] max-h-36 overflow-y-auto">
              {transmission.raw_response_json}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
