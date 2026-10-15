import React from 'react';

const CameraHealth = ({ health, onRefresh }) => {
  const issues = health?.issues || [];

  return (
    <section className="min-w-0 rounded-[var(--radius)] border border-dashed border-[var(--border-strong)] bg-[var(--surface)] p-[18px] transition-[border-color] duration-[180ms] max-[760px]:p-3.5">
      <div className="mb-3.5 flex items-center justify-between gap-3">
        <h2 className="m-0 font-sans text-[15px] font-semibold tracking-[-0.01em]">Camera Health</h2>
        <button className="rounded-[calc(var(--radius)-2px)] border border-transparent bg-transparent px-3 py-2.5 text-[13px] font-medium text-[var(--muted)] transition-all duration-[180ms] hover:bg-[var(--surface-muted)] hover:text-[var(--text)] active:scale-[0.97]" onClick={onRefresh} type="button">Refresh</button>
      </div>

      <div className={`${"mb-3.5 w-fit rounded-[var(--radius)] px-2.5 py-1.5 font-mono text-[11px] font-medium tracking-[0.02em] text-white"} ${health?.status === 'ok' ? 'bg-safe' : health?.status === 'warning' ? 'bg-warning' : health?.status === 'problem' ? 'bg-danger-strong' : 'bg-[var(--soft)]'}`}>
        {(health?.status || 'waiting').toUpperCase()}
      </div>

      <div className="flex items-center justify-between gap-4 border-b border-[var(--border)] py-3 text-[13px] text-[var(--muted)]">
        <span>Brightness</span>
        <strong className="font-mono font-medium text-[var(--text)]">{health?.brightness ?? '--'}</strong>
      </div>
      <div className="flex items-center justify-between gap-4 border-b border-[var(--border)] py-3 text-[13px] text-[var(--muted)]">
        <span>Sharpness</span>
        <strong className="font-mono font-medium text-[var(--text)]">{health?.sharpness ?? '--'}</strong>
      </div>
      <div className="flex items-center justify-between gap-4 border-b border-[var(--border)] py-3 text-[13px] text-[var(--muted)]">
        <span>Frame Age</span>
        <strong className="font-mono font-medium text-[var(--text)]">
          {health?.last_frame_age_seconds === null || health?.last_frame_age_seconds === undefined
            ? '--'
            : `${health.last_frame_age_seconds}s`}
        </strong>
      </div>

      <div className="mt-3 text-[13px] leading-[1.45] text-[var(--muted)]">
        {issues.length === 0 ? 'No camera issues detected.' : issues.join(', ')}
      </div>
    </section>
  );
};

export default CameraHealth;
