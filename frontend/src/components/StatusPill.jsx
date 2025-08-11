// Badge indicator component reflecting the system's current alert severity level.
// Displays shield icons styled with color codes for safe, warning, and critical states.

import React from 'react';
import { Shield, ShieldAlert } from 'lucide-react';

const StatusPill = ({ level }) => {
  const isSafe = level === 'safe' || !level;
  const Icon = isSafe ? Shield : ShieldAlert;
  const tooltipText = (level || 'safe').replace('_', ' ').toUpperCase();

  return (
    <div className={`status-pill ${level || 'safe'}`} title={`Status: ${tooltipText}`}>
      <Icon size={18} />
    </div>
  );
};

export default StatusPill;
