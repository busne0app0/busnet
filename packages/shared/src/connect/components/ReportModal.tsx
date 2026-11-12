import React, { useState } from 'react';
import { X, Flag, AlertTriangle } from 'lucide-react';
import { ConnectPost, ConnectReportPayload } from '../types/connect.types';
import toast from 'react-hot-toast';

interface ReportModalProps {
  post: ConnectPost | null;
  onClose: () => void;
  onSubmit: (payload: ConnectReportPayload) => Promise<void>;
}

export const ReportModal: React.FC<ReportModalProps> = ({
  post,
  onClose,
  onSubmit,
}) => {
  const [reason, setReason] = useState('spam');
  const [details, setDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!post) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit({
        postId: post.id,
        reason,
        details: details.trim() || undefined,
      });
      onClose();
    } catch (e) {
      // Handled by store
    } finally {
      setIsSubmitting(false);
    }
  };

  const reasons = [
    { id: 'spam', label: 'Спам або нав’язлива реклама' },
    { id: 'misleading_border', label: 'Неправдива інформація про черги на кордоні' },
    { id: 'fraud', label: 'Шахрайство або сумнівна передача посилки' },
    { id: 'harassment', label: 'Образлива поведінка або ворожнеча' },
    { id: 'other', label: 'Інше порушення правил BUSNET' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#0e1627] border border-amber-500/30 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-[#0a101d]">
          <div className="flex items-center space-x-2 text-amber-400">
            <Flag className="w-4 h-4" />
            <span className="font-bold text-sm text-white">Подати скаргу на публікацію</span>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-bold mb-2">Оберіть причину скарги:</label>
            <div className="space-y-1.5">
              {reasons.map(r => (
                <label 
                  key={r.id} 
                  className={`flex items-center space-x-2.5 p-2.5 rounded-xl border cursor-pointer transition-all ${
                    reason === r.id 
                      ? 'bg-amber-500/10 border-amber-500/40 text-amber-300' 
                      : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <input
                    type="radio"
                    name="report_reason"
                    value={r.id}
                    checked={reason === r.id}
                    onChange={(e) => setReason(e.target.value)}
                    className="accent-amber-400"
                  />
                  <span>{r.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-bold mb-1.5">Додаткові деталі (опціонально):</label>
            <textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              rows={3}
              placeholder="Опишіть ситуацію докладніше для модераторів..."
              className="w-full bg-[#0b1220] border border-slate-700/80 rounded-xl p-3 text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 resize-none"
            />
          </div>

          <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl text-slate-400 hover:text-white transition-colors"
            >
              Скасувати
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 font-bold text-slate-950 transition-colors"
            >
              {isSubmitting ? 'Надсилання...' : 'Надіслати скаргу'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

