"use client";

import React, { useEffect, useRef, useState } from 'react';
import { AlertTriangle, Flag, Loader2, X } from 'lucide-react';
import type { ConnectPost, ConnectReportPayload } from '../types/connect.types';
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
  const [reason, setReason] = useState<ConnectReportPayload['reason']>('spam');
  const [details, setDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);
  const canCloseRef = useRef(!isSubmitting);
  onCloseRef.current = onClose;
  canCloseRef.current = !isSubmitting;
  const postId = post?.id;

  useEffect(() => {
    if (!postId) return;

    const previousOverflow = document.body.style.overflow;
    const activeElement = document.activeElement;
    previousFocusRef.current = activeElement instanceof HTMLElement ? activeElement : null;
    document.body.style.overflow = 'hidden';
    closeButtonRef.current?.focus();

    const handleDialogKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (canCloseRef.current) onCloseRef.current();
        return;
      }

      if (event.key !== 'Tab') return;

      const dialog = dialogRef.current;
      if (!dialog) return;

      const focusableElements = Array.from(
        dialog.querySelectorAll<HTMLElement>(
          'button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])',
        ),
      );
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (focusableElements.length === 0) {
        event.preventDefault();
        dialog.focus();
      } else if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    window.addEventListener('keydown', handleDialogKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleDialogKeyDown);
      if (previousFocusRef.current?.isConnected) previousFocusRef.current.focus();
    };
  }, [postId]);

  if (!post) return null;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);

    try {
      await onSubmit({
        postId: post.id,
        reason,
        details: details.trim() || undefined,
      });
      setReason('spam');
      setDetails('');
      onClose();
    } catch {
      // The store displays errors for failed report submissions.
    } finally {
      setIsSubmitting(false);
    }
  };

  const reasons: { id: ConnectReportPayload['reason']; label: string }[] = [
    { id: 'spam', label: 'Спам або нав’язлива реклама' },
    { id: 'misleading_border', label: 'Неправдива інформація про черги на кордоні' },
    { id: 'fraud', label: 'Шахрайство або сумнівна передача посилки' },
    { id: 'harassment', label: 'Образлива поведінка або ворожнеча' },
    { id: 'other', label: 'Інше порушення правил BUSNET' },
  ];

  return (
    <div
      role="presentation"
      onClick={() => {
        if (canCloseRef.current) onCloseRef.current();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3 backdrop-blur-sm sm:p-4"
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="report-modal-title"
        aria-describedby="report-modal-description"
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
        className="w-full max-w-lg overflow-y-auto rounded-3xl border border-amber-500/25 bg-[#0e1627] shadow-2xl outline-none"
      >
        <header className="flex items-center justify-between gap-4 border-b border-slate-800 bg-[#0a101d] px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-xl border border-amber-400/20 bg-amber-400/[0.08] text-amber-200">
              <Flag className="size-4" aria-hidden="true" />
            </div>
            <h2 id="report-modal-title" className="text-sm font-semibold text-white">Подати скаргу</h2>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Закрити форму скарги"
            className="rounded-xl p-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </header>

        <p id="report-modal-description" className="sr-only">Повідомте модераторів про порушення правил у цій публікації.</p>

        <form onSubmit={handleSubmit} aria-busy={isSubmitting} className="flex flex-col gap-5 p-5 text-sm">
          <section aria-label="Публікація, на яку подають скаргу" className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4">
            <p className="mb-1 text-xs font-semibold text-white">{post.authorName}</p>
            <p className="line-clamp-3 text-xs leading-relaxed text-slate-400">{post.content}</p>
          </section>

          <div role="note" className="flex gap-3 rounded-xl border border-amber-400/15 bg-amber-400/[0.06] p-3 text-xs leading-relaxed text-amber-100/80">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-200" aria-hidden="true" />
            <p>Скаргу буде передано модераторам для перевірки. Надсилайте її лише щодо конкретного порушення правил.</p>
          </div>

          <fieldset className="m-0 border-0 p-0">
            <legend className="mb-2 text-sm font-semibold text-slate-200">Оберіть причину скарги</legend>
            <div className="flex flex-col gap-2">
              {reasons.map((reportReason) => (
                <label
                  key={reportReason.id}
                  className={`flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 text-xs leading-relaxed transition-colors focus-within:ring-2 focus-within:ring-amber-200 ${reason === reportReason.id
                      ? 'border-amber-400/40 bg-amber-400/[0.08] text-amber-100'
                      : 'border-slate-800 bg-slate-900/40 text-slate-300 hover:border-slate-700 hover:text-white'
                    }`}
                >
                  <input
                    type="radio"
                    name="report_reason"
                    value={reportReason.id}
                    checked={reason === reportReason.id}
                    onChange={(event) => setReason(event.currentTarget.value as ConnectReportPayload['reason'])}
                    className="size-4 shrink-0 accent-amber-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200"
                  />
                  <span>{reportReason.label}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <div className="flex flex-col gap-2">
            <label htmlFor="report-details" className="text-sm font-semibold text-slate-200">Додаткові деталі (необов&apos;язково)</label>
            <textarea
              id="report-details"
              value={details}
              onChange={(event) => setDetails(event.target.value)}
              rows={4}
              maxLength={1000}
              aria-describedby="report-details-hint report-details-count"
              disabled={isSubmitting}
              placeholder="Опишіть, що саме сталося, щоб допомогти модераторам..."
              className="min-h-28 w-full resize-y rounded-xl border border-slate-700/80 bg-[#0b1220] p-3 text-sm leading-relaxed text-white placeholder-slate-500 transition-colors focus:border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-300/20 disabled:cursor-not-allowed disabled:opacity-50"
            />
            <div className="flex items-start justify-between gap-3 text-[11px] text-slate-500">
              <p id="report-details-hint">Не додавайте паролі, платіжні чи інші чутливі дані.</p>
              <span id="report-details-count" aria-live="polite" className="shrink-0 tabular-nums">{details.length}/1000</span>
            </div>
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

