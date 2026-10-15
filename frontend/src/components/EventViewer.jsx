import React from 'react';
import { mediaUrl } from '../utils/helpers';

const EventViewer = ({ event, baseApi, onClose, onDelete }) => {
  if (!event) return null;

  const snapshot = mediaUrl(baseApi, event.snapshot_url);
  const gifCapture = mediaUrl(baseApi, event.gif_url);

  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-6 max-[760px]:p-2.5" role="dialog" aria-modal="true" aria-label="Event media viewer">
      <div className="absolute inset-0 bg-black/62 backdrop-blur-[10px]" onClick={onClose} />

      <div className="relative max-h-[calc(100vh-48px)] w-[min(1100px,100%)] overflow-auto rounded-md border border-[var(--border-strong)] bg-[var(--surface)] p-3.5 shadow-[0_1px_3px_rgba(0,0,0,0.3),0_4px_16px_rgba(0,0,0,0.2)] max-[760px]:p-3">
        <div className="mb-3 flex items-start justify-between gap-4">
          <div>
            <span className={`${"rounded-[2px] px-2 py-1 font-mono text-[10px] font-semibold uppercase text-white"} ${event.alert_level === 'warning' ? 'bg-warning' : event.alert_level === 'critical' ? 'bg-danger-strong' : 'bg-danger'}`}>{event.alert_level}</span>
            <h2 className="mt-2 font-serif text-[28px] font-medium max-[760px]:text-[20px]">{event.summary}</h2>
            <time className="mt-1 block text-[13px] text-[var(--muted)]">{new Date(event.timestamp).toLocaleString()}</time>
          </div>
          <button className="rounded-[calc(var(--radius)-2px)] border border-transparent bg-transparent px-3 py-2.5 text-[13px] font-medium text-[var(--muted)] transition-all duration-[180ms] hover:bg-[var(--surface-muted)] hover:text-[var(--text)] active:scale-[0.97]" onClick={onClose} type="button">Close</button>
        </div>

        <div className="grid grid-cols-2 gap-3 max-[760px]:flex max-[760px]:flex-col">
          <a href={snapshot} target="_blank" rel="noreferrer">
            <img className="min-h-[320px] max-h-[62vh] w-full border border-dotted border-[var(--media-border)] bg-[#090909] object-contain" src={snapshot} alt={`Alert snapshot ${event.id}`} />
          </a>
          {gifCapture ? (
            <a href={gifCapture} target="_blank" rel="noreferrer">
              <img className="min-h-[320px] max-h-[62vh] w-full border border-dotted border-[var(--media-border)] bg-[#090909] object-contain" src={gifCapture} alt={`Alert GIF capture ${event.id}`} />
            </a>
          ) : (
            <div className={`${"min-h-[320px] max-h-[62vh] w-full border border-dotted border-[var(--media-border)] bg-[#090909] object-contain"} ${"grid place-items-center p-6 text-[var(--muted)]"}`}>No GIF capture was recorded for this event.</div>
          )}
        </div>

        <div className="mt-3 flex flex-wrap gap-2.5">
          <a className="inline-flex min-h-10 items-center justify-center rounded-[var(--radius)] border border-[var(--accent)] bg-[var(--accent)] px-5 py-[9px] font-sans text-sm font-medium tracking-[-0.01em] text-[var(--accent-text)] no-underline transition-all duration-[180ms] hover:opacity-88 active:scale-[0.98] max-[760px]:w-full" href={snapshot} target="_blank" rel="noreferrer">Open Image</a>
          {gifCapture && (
            <a className={`${"inline-flex min-h-10 items-center justify-center rounded-[var(--radius)] border border-[var(--accent)] bg-[var(--accent)] px-5 py-[9px] font-sans text-sm font-medium tracking-[-0.01em] text-[var(--accent-text)] no-underline transition-all duration-[180ms] hover:opacity-88 active:scale-[0.98] max-[760px]:w-full"} ${"border-[var(--border)] bg-[var(--surface)] text-[var(--text)] hover:border-[var(--border-strong)] hover:bg-[var(--surface-muted)]"}`} href={gifCapture} target="_blank" rel="noreferrer">Open GIF Capture</a>
          )}
          {onDelete && (
            <button className={`${"inline-flex min-h-10 items-center justify-center rounded-[var(--radius)] border border-[var(--accent)] bg-[var(--accent)] px-5 py-[9px] font-sans text-sm font-medium tracking-[-0.01em] text-[var(--accent-text)] no-underline transition-all duration-[180ms] hover:opacity-88 active:scale-[0.98] max-[760px]:w-full"} ${"border-danger bg-danger text-white"}`} onClick={() => onDelete(event)} type="button">Delete Event</button>
          )}
        </div>
      </div>
    </div>
  );
};

export default EventViewer;
