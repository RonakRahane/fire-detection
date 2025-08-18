// Historical event list panel displaying past fire alerts and recorded snapshots.
// Supports manual list refresh and item selection to trigger full media inspection in the viewer modal.

import React from 'react';
import { mediaUrl, formatPercent } from '../utils/helpers';

const EventHistory = ({ events, baseApi, onRefresh, onSelectEvent, isLoading, updatedAt }) => (
  <section className="history-panel">
    <div className="panel-header">
      <div>
        <h2>Event History</h2>
        {updatedAt && <span className="panel-meta">Updated {updatedAt.toLocaleTimeString()}</span>}
      </div>
      <button className="ghost-btn" disabled={isLoading} onClick={onRefresh} type="button">
        {isLoading ? 'Refreshing...' : 'Refresh'}
      </button>
    </div>

    {events.length === 0 ? (
      <p className="empty-state">No fire events recorded yet.</p>
    ) : (
      <div className="event-list">
        {events.map((event) => (
          <article className="event-item" key={event.id}>
            <button className="event-thumb" onClick={() => onSelectEvent(event)} type="button">
              <img src={mediaUrl(baseApi, event.snapshot_url)} alt={`Alert ${event.id}`} />
              <span>View</span>
            </button>

            <div className="event-copy">
              <div className="event-topline">
                <span className={`mini-level ${event.alert_level}`}>{event.alert_level}</span>
                <time>{new Date(event.timestamp).toLocaleString()}</time>
              </div>
              <strong>{event.summary}</strong>
              {event.best_detection && (
                <span>
                  {event.best_detection.class} {formatPercent(event.best_detection.confidence)}
                </span>
              )}
              <div className="event-actions">
                <button className="text-btn" onClick={() => onSelectEvent(event)} type="button">View media</button>
                {(event.gif_url || event.clip_preview_url) && <span className="capture-badge">GIF captured</span>}
              </div>
            </div>
          </article>
        ))}
      </div>
    )}
  </section>
);

export default EventHistory;
