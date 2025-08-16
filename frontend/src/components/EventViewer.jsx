// Modal dialog component for viewing full-size event snapshots and animated GIF previews.
// Provides direct media download links and backdrop overlay dismiss actions.

import React from 'react';
import { mediaUrl } from '../utils/helpers';

const EventViewer = ({ event, baseApi, onClose }) => {
  if (!event) return null;

  const snapshot = mediaUrl(baseApi, event.snapshot_url);
  const gifCapture = mediaUrl(baseApi, event.gif_url || event.clip_preview_url);

  return (
    <div className="event-viewer" role="dialog" aria-modal="true" aria-label="Event media viewer">
      <div className="event-viewer-backdrop" onClick={onClose} />

      <div className="event-viewer-panel">
        <div className="event-viewer-header">
          <div>
            <span className={`mini-level ${event.alert_level}`}>{event.alert_level}</span>
            <h2>{event.summary}</h2>
            <time>{new Date(event.timestamp).toLocaleString()}</time>
          </div>
          <button className="ghost-btn" onClick={onClose} type="button">Close</button>
        </div>

        <div className="event-viewer-media">
          <a href={snapshot} target="_blank" rel="noreferrer">
            <img src={snapshot} alt={`Alert snapshot ${event.id}`} />
          </a>
          {gifCapture ? (
            <a href={gifCapture} target="_blank" rel="noreferrer">
              <img src={gifCapture} alt={`Alert GIF capture ${event.id}`} />
            </a>
          ) : (
            <div className="capture-empty">No GIF capture was recorded for this event.</div>
          )}
        </div>

        <div className="event-viewer-actions">
          <a className="primary-btn link-btn" href={snapshot} target="_blank" rel="noreferrer">Open Image</a>
          {gifCapture && (
            <a className="primary-btn link-btn secondary" href={gifCapture} target="_blank" rel="noreferrer">Open GIF Capture</a>
          )}
        </div>
      </div>
    </div>
  );
};

export default EventViewer;
