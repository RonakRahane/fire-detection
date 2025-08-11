// Side-panel widget component that displays real-time camera feed diagnostics.
// Renders camera image metrics including brightness, sharpness, frame age, and frozen frame alerts.

import React from 'react';

const CameraHealth = ({ health, onRefresh }) => {
  const issues = health?.issues || [];

  return (
    <section className="side-panel">
      <div className="panel-header">
        <h2>Camera Health</h2>
        <button className="ghost-btn" onClick={onRefresh} type="button">Refresh</button>
      </div>

      <div className={`health-status ${health?.status || 'waiting'}`}>
        {(health?.status || 'waiting').toUpperCase()}
      </div>

      <div className="metric-row">
        <span>Brightness</span>
        <strong>{health?.brightness ?? '--'}</strong>
      </div>
      <div className="metric-row">
        <span>Sharpness</span>
        <strong>{health?.sharpness ?? '--'}</strong>
      </div>
      <div className="metric-row">
        <span>Frame Age</span>
        <strong>
          {health?.last_frame_age_seconds === null || health?.last_frame_age_seconds === undefined
            ? '--'
            : `${health.last_frame_age_seconds}s`}
        </strong>
      </div>

      <div className="issue-list">
        {issues.length === 0 ? 'No camera issues detected.' : issues.join(', ')}
      </div>
    </section>
  );
};

export default CameraHealth;
