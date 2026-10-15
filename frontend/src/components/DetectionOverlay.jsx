import React from 'react';
import { formatPercent } from '../utils/helpers';

const DetectionOverlay = ({ detections, frameSize }) => {
  const alertDetections = detections.filter((d) => d.alert_eligible);

  return (
    <>
      <svg
        className="pointer-events-none absolute inset-0 size-full"
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
              className={`${"fill-transparent stroke-[#f5f5f0] stroke-2 [stroke-linecap:square] [stroke-linejoin:miter] [vector-effect:non-scaling-stroke] [shape-rendering:crispEdges] [filter:drop-shadow(0_0_5px_rgba(0,0,0,0.72))]"} ${document.documentElement.dataset.theme !== 'dark' ? "stroke-[#111110] [filter:drop-shadow(0_0_4px_rgba(255,255,255,0.72))]" : ''}`}
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
            className="pointer-events-none inline-flex w-fit whitespace-nowrap rounded-none border-0 bg-danger px-2.5 py-1.5 font-mono text-[11px] leading-none font-medium uppercase text-white"
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
