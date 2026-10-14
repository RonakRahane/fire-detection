import React from 'react';
import { mediaUrl, formatPercent } from '../utils/helpers';

const EventHistory = ({
  events, baseApi, onRefresh, onSelectEvent, onDeleteEvent, onClearAll, isLoading, updatedAt,
}) => (
  <section className="history-panel">
    <div className="panel-header">
      <div>
        <h2>Event History</h2>
        {updatedAt && <span className="panel-meta">Updated {updatedAt.toLocaleTimeString()}</span>}
      </div>
      <div className="panel-header-actions">
        {onClearAll && events.length > 0 && (
          <button className="ghost-btn danger" disabled={isLoading} onClick={onClearAll} type="button">
            Clear all
          </button>
        )}
        <button className="ghost-btn" disabled={isLoading} onClick={onRefresh} type="button">
          {isLoading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>
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
                {onDeleteEvent && (
                  <button className="text-btn danger" onClick={() => onDeleteEvent(event)} type="button">Delete</button>
                )}
                {event.gif_url && <span className="capture-badge">GIF captured</span>}
              </div>
            </div>
          </article>
        ))}
      </div>
    )}
  </section>
);

export default EventHistory;
