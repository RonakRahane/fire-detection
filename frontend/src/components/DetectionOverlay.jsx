// Visual bounding box overlay component rendered over camera frames and test images.
// Scales SVG bounding boxes and HTML confidence badges according to object detection coordinates.

import React from 'react';
import { formatPercent } from '../utils/helpers';

const DetectionOverlay = ({ detections, frameSize }) => {
  const alertDetections = detections.filter((d) => d.alert_eligible);

  return (
    <>
      <svg
        className="detection-overlay"
        viewBox={`0 0 ${frameSize.width} ${frameSize.height}`}
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        {alertDetections.map((detection, index) => {
          const [x1, y1, x2, y2] = detection.box;
          const width = Math.max(0, x2 - x1);
          const height = Math.max(0, y2 - y1);
          return (
            <rect
              key={`${detection.class}-${index}-${x1}-${y1}`}
              className="detection-square"
              x={x1}
              y={y1}
              width={width}
              height={height}
            />
          );
        })}
      </svg>

      {alertDetections.map((detection, index) => {
        const [x1, y1] = detection.box;
        const leftPercent = (Math.max(0, x1) / frameSize.width) * 100;
        const topPercent = (Math.max(0, y1) / frameSize.height) * 100;

        return (
          <span
            key={`tag-${index}`}
            className="video-detection-tag"
            style={{
              position: 'absolute',
              left: `calc(${leftPercent}% - 1px)`,
              bottom: `calc(${100 - topPercent}% + 4px)`,
            }}
          >
            FIRE / {formatPercent(detection.confidence)}
          </span>
        );
      })}
    </>
  );
};

export default DetectionOverlay;
