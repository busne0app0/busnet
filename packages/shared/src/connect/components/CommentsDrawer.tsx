"use client";

import React, { useEffect, useRef, useState } from 'react';
import { MessageSquare, Send, Trash2, X } from 'lucide-react';
import type { ConnectComment, ConnectPost } from '../types/connect.types';
import { connectFeedService } from '../services/connectFeedService';
import { useAuthStore } from '../../store/useAuthStore';
import toast from 'react-hot-toast';

interface CommentsDrawerProps {
  post: ConnectPost | null;
  onClose: () => void;
  onAddComment: (postId: string, content: string) => Promise<void>;
  onDeleteComment?: (commentId: string) => Promise<void>;
}

const getCommentCountLabel = (count: number) => {
  const lastTwoDigits = count % 100;
  if (lastTwoDigits >= 11 && lastTwoDigits <= 14) return 'коментарів';

  switch (count % 10) {
    case 1:
      return 'коментар';
    case 2:
    case 3:
    case 4:
      return 'коментарі';
    default:
      return 'коментарів';
  }
};

export const CommentsDrawer: React.FC<CommentsDrawerProps> = ({
  post,
  onClose,
  onAddComment,
  onDeleteComment,
}) => {
  const { user, isAuthenticated } = useAuthStore();
  const [comments, setComments] = useState<ConnectComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const postId = post?.id;

  useEffect(() => {
    setComments([]);
    setNewComment('');

    if (!postId) return;

    return connectFeedService.subscribeToComments(postId, setComments);
  }, [postId]);

  useEffect(() => {
    if (!postId) return;

    const previousOverflow = document.body.style.overflow;
    const activeElement = document.activeElement;
    previousFocusRef.current = activeElement instanceof HTMLElement ? activeElement : null;
    document.body.style.overflow = 'hidden';
    closeButtonRef.current?.focus();

    const handleDialogKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onCloseRef.current();
        return;
      }

      if (event.key !== 'Tab') return;

      const dialog = dialogRef.current;
      if (!dialog) return;

      const focusableElements = Array.from(
        dialog.querySelectorAll<HTMLElement>(
          'button:not([disabled]), a[href], input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.error('Авторизуйтесь для написання коментаря');
      return;
    }
    if (!newComment.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onAddComment(post.id, newComment.trim());
      setNewComment('');
    } catch {
      // The store displays errors for failed comment submissions.
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    if (!window.confirm('Видалити цей коментар?')) return;

    try {
      if (onDeleteComment) {
        await onDeleteComment(commentId);
      } else {
        await connectFeedService.deleteComment(commentId);
      }

      setComments((currentComments) => currentComments.filter((comment) => comment.id !== commentId));
      toast.success('Коментар видалено');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Не вдалося видалити коментар';
      toast.error(message);
    }
  };

  return (
    <div
      role="presentation"
      onClick={onClose}
      className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm"
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="comments-drawer-title"
        aria-describedby="comments-post-preview"
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
        className="flex h-full w-full max-w-lg flex-col border-l border-slate-800 bg-[#0a101d] shadow-2xl outline-none"
      >
        <header className="flex items-center justify-between border-b border-slate-800 bg-[#0e1627] px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-xl border border-cyan-400/15 bg-cyan-400/[0.08] text-cyan-300">
              <MessageSquare className="size-4" aria-hidden="true" />
            </div>
            <div>
              <h2 id="comments-drawer-title" className="text-sm font-semibold text-white">Коментарі</h2>
              <p aria-live="polite" className="text-xs text-slate-400">{comments.length} {getCommentCountLabel(comments.length)}</p>
            </div>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Закрити коментарі"
            className="rounded-xl p-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </header>

        <section id="comments-post-preview" aria-label="Оригінальна публікація" className="border-b border-slate-800/80 bg-slate-900/40 px-5 py-4 text-xs text-slate-300">
          <p className="mb-1 font-semibold text-white">{post.authorName}</p>
          <p className="line-clamp-2 leading-relaxed text-slate-400">{post.content}</p>
        </section>

        <section aria-label="Список коментарів" aria-live="polite" className="flex-1 overflow-y-auto p-4">
          <div className="flex flex-col gap-3">
            {comments.length === 0 ? (
              <div role="status" className="flex h-full flex-col items-center justify-center gap-3 px-6 py-12 text-center text-slate-400">
                <div className="flex size-12 items-center justify-center rounded-2xl border border-cyan-400/15 bg-cyan-400/[0.08] text-cyan-300">
                  <MessageSquare className="size-5" aria-hidden="true" />
                </div>
                <p className="max-w-xs text-sm leading-relaxed">Коментарів поки немає. Будьте першим!</p>
              </div>
            ) : (
              comments.map((comment) => {
                const isMyComment = user?.uid === comment.userId;
                const authorName = comment.authorName?.trim() || 'Мандрівник';
                const initials = Array.from(authorName)[0]?.toLocaleUpperCase('uk-UA') || 'М';
                const createdAt = new Date(comment.createdAt);
                const dateLabel = createdAt.toLocaleString('uk-UA', {
                  hour: '2-digit',
                  minute: '2-digit',
                  day: 'numeric',
                  month: 'short',
                });
                const dateTime = Number.isNaN(createdAt.getTime()) ? undefined : createdAt.toISOString();

                return (
                  <article key={comment.id} className="group rounded-2xl border border-slate-800/80 bg-slate-900/50 p-4 text-sm transition-colors hover:border-slate-700">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-2.5">
                        <div aria-hidden="true" className="flex size-8 shrink-0 items-center justify-center rounded-full border border-cyan-500/25 bg-cyan-950 font-semibold text-xs text-cyan-200">
                          {initials}
                        </div>
                        <span className="truncate font-semibold text-white">{authorName}</span>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <time dateTime={dateTime} className="text-[10px] text-slate-500">{dateLabel}</time>
                        {isMyComment && (
                          <button
                            type="button"
                            onClick={() => handleDelete(comment.id)}
                            aria-label={`Видалити коментар від ${authorName}`}
                            className="rounded-lg p-2 text-rose-300 opacity-80 transition hover:bg-rose-400/10 hover:text-rose-200 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300 group-hover:opacity-100"
                            title="Видалити мій коментар"
                          >
                            <Trash2 className="size-3.5" aria-hidden="true" />
                          </button>
                        )}
                      </div>
                    </div>
                    <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-slate-300">{comment.content}</p>
                  </article>
                );
              })
            )}
          </div>
        </section>

        <form
          onSubmit={handleSubmit}
          aria-busy={isSubmitting}
          className="flex items-center gap-2 border-t border-slate-800 bg-[#0e1627] p-4"
        >
          <label htmlFor="comment-input" className="sr-only">Новий коментар</label>
          <p id="comment-input-status" className="sr-only">
            {isAuthenticated ? 'Введіть текст коментаря.' : 'Авторизуйтесь, щоб написати коментар.'}
          </p>
          <input
            id="comment-input"
            type="text"
            value={newComment}
            onChange={(event) => setNewComment(event.target.value)}
            placeholder={isAuthenticated ? 'Напишіть коментар...' : 'Авторизуйтесь для відповіді...'}
            aria-describedby="comment-input-status"
            disabled={!isAuthenticated || isSubmitting}
            className="min-h-11 min-w-0 flex-1 rounded-xl border border-slate-700/80 bg-[#0b1220] px-3.5 py-2.5 text-sm text-white placeholder-slate-500 transition-colors focus:border-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-300/20 disabled:cursor-not-allowed disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!isAuthenticated || !newComment.trim() || isSubmitting}
            aria-label="Надіслати коментар"
            className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl bg-cyan-300 text-slate-950 transition-colors hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-100"
            title="Надіслати"
          >
            <Send className="size-4" aria-hidden="true" />
          </button>
        </form>
      </div>
    </div>
  );
};
