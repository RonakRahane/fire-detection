import React from 'react';
import { mediaUrl, formatPercent } from '../utils/helpers';

const EventHistory = ({
  events, baseApi, onRefresh, onSelectEvent, onDeleteEvent, onClearAll, isLoading, updatedAt,
}) => (
  <section className="min-w-0 rounded-[var(--radius)] border border-dashed border-[var(--border-strong)] bg-[var(--surface)] p-[18px] transition-[border-color] duration-[180ms] max-[760px]:p-3.5">
    <div className="mb-3.5 flex items-center justify-between gap-3">
      <div>
        <h2 className="m-0 font-sans text-[15px] font-semibold tracking-[-0.01em]">Event History</h2>
        {updatedAt && <span className="block font-mono text-[11px] font-medium uppercase tracking-[0.06em] text-[var(--soft)]">Updated {updatedAt.toLocaleTimeString()}</span>}
      </div>
      <div className="flex items-center gap-1">
        {onClearAll && events.length > 0 && (
          <button className={`${"rounded-[calc(var(--radius)-2px)] border border-transparent bg-transparent px-3 py-2.5 text-[13px] font-medium text-[var(--muted)] transition-all duration-[180ms] hover:bg-[var(--surface-muted)] hover:text-[var(--text)] active:scale-[0.97]"} ${"text-danger hover:bg-[color-mix(in_srgb,var(--danger)_10%,transparent)] hover:text-danger-strong"}`} disabled={isLoading} onClick={onClearAll} type="button">
            Clear all
          </button>
        )}
        <button className="rounded-[calc(var(--radius)-2px)] border border-transparent bg-transparent px-3 py-2.5 text-[13px] font-medium text-[var(--muted)] transition-all duration-[180ms] hover:bg-[var(--surface-muted)] hover:text-[var(--text)] active:scale-[0.97]" disabled={isLoading} onClick={onRefresh} type="button">
          {isLoading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>
    </div>

    {events.length === 0 ? (
      <p className="mt-3 text-[13px] leading-[1.45] text-[var(--muted)]">No fire events recorded yet.</p>
    ) : (
      <div className="flex flex-col gap-2.5">
        {events.map((event) => (
          <article className="grid grid-cols-[116px_minmax(0,1fr)] gap-3 border border-[var(--border)] bg-[var(--surface-muted)] p-2 max-[760px]:grid-cols-1" key={event.id}>
            <button className="relative overflow-hidden border-0 border-dotted border-[var(--media-border)] bg-[#111] p-0" onClick={() => onSelectEvent(event)} type="button">
              <img className="block size-[116px] object-cover transition-transform duration-[180ms] ease-out hover:scale-[1.03] max-[760px]:h-[180px] max-[760px]:w-full" src={mediaUrl(baseApi, event.snapshot_url)} alt={`Alert ${event.id}`} />
              <span className="absolute bottom-1.5 left-1.5 bg-black/66 px-1.5 py-1 text-[11px] font-extrabold text-white">View</span>
            </button>

            <div className="flex min-w-0 flex-col gap-1.5 text-[13px] text-[var(--muted)]">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className={`${"rounded-[2px] px-2 py-1 font-mono text-[10px] font-semibold uppercase text-white"} ${event.alert_level === 'warning' ? 'bg-warning' : event.alert_level === 'critical' ? 'bg-danger-strong' : 'bg-danger'}`}>{event.alert_level}</span>
                <time>{new Date(event.timestamp).toLocaleString()}</time>
              </div>
              <strong>{event.summary}</strong>
              {event.best_detection && (
                <span>
                  {event.best_detection.class} {formatPercent(event.best_detection.confidence)}
                </span>
              )}
              <div className="mt-0.5 flex flex-wrap items-center gap-2">
                <button className="w-fit rounded-[calc(var(--radius)-2px)] border border-transparent bg-transparent px-2 py-1.5 text-[13px] font-medium text-[var(--text)] transition-all duration-[180ms] hover:bg-[var(--surface-muted)] active:scale-[0.97]" onClick={() => onSelectEvent(event)} type="button">View media</button>
                {onDeleteEvent && (
                  <button className={`${"w-fit rounded-[calc(var(--radius)-2px)] border border-transparent bg-transparent px-2 py-1.5 text-[13px] font-medium text-[var(--text)] transition-all duration-[180ms] hover:bg-[var(--surface-muted)] active:scale-[0.97]"} ${"text-danger hover:bg-[color-mix(in_srgb,var(--danger)_10%,transparent)] hover:text-danger-strong"}`} onClick={() => onDeleteEvent(event)} type="button">Delete</button>
                )}
                {event.gif_url && <span className="rounded-[2px] bg-[var(--accent)] px-2 py-1 font-mono text-[10px] font-semibold uppercase text-white">GIF captured</span>}
              </div>
            </div>
          </article>
        ))}
      </div>
    )}
  </section>
);

export default EventHistory;
