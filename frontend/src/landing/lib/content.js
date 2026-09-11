export const detectionLoop = [
  {
    title: '1. Scan',
    body: 'Continuously monitors live camera frames to identify visible flames and rising smoke.',
  },
  {
    title: '2. Verify',
    body: 'Analyzes heat intensity, color ratios, and motion to filter out warm lights and reflections.',
  },
  {
    title: '3. Record',
    body: 'Saves a high-resolution snapshot and animated GIF evidence the second an alert triggers.',
  },
  {
    title: '4. Alert',
    body: 'Delivers immediate alerts with clear confidence metrics so safety teams can respond instantly.',
  },
];

export const detectionFacts = [
  { label: 'Targets', value: 'Active Flames & Smoke' },
  { label: 'Latency', value: '100ms – 2s intervals' },
  { label: 'Resolution', value: 'Up to 960p HD' },
];

export const verificationSpecs = [
  { label: 'Target Hazard', value: 'True flames & smoke plumes' },
  { label: 'Ignored Clutter', value: 'Red clothes, warm lamps, sunlight' },
  { label: 'Verification Method', value: 'Color temperature + multi-frame consistency' },
];
export const alertLevels = [
  { id: 'safe', name: 'Normal', rule: 'Area clear. No flame or smoke detected.', trigger: 'Monitoring' },
  { id: 'suspicious', name: 'Evaluating', rule: 'Fire-like light or motion detected; checking consistency.', trigger: 'Evaluating' },
  { id: 'warning', name: 'Smoke Warning', rule: 'Visible smoke detected in camera frame.', trigger: 'Smoke ≥ 55%' },
  { id: 'danger', name: 'Fire Detected', rule: 'Active flame confirmed in camera frame.', trigger: 'Fire ≥ 30%' },
  { id: 'critical', name: 'Critical Alarm', rule: 'High-confidence active fire with verified heat core.', trigger: 'Fire ≥ 75%' },
];

export const evidenceParts = [
  {
    title: 'High-Resolution Snapshot',
    body: 'Captures the exact moment an alert is triggered, complete with labeled bounding boxes and confidence score.',
  },
  {
    title: 'Video Clip (GIF)',
    body: 'Loops the frames immediately before and after detection so you can verify fire motion without digging through hours of video.',
  },
];
export const sampleEvent = {
  id: 'af36d95f6cc8',
  recorded: '2026-05-10 · 16:18:22 UTC',
  level: 'danger',
  summary: 'Active flame confirmed at 43%',
  rows: [
    { label: 'Detection Status', value: 'Fire · 43% confidence · Verified' },
    { label: 'Heat Signature', value: 'Core 0.25 · Flame body 0.22 · Sharpness 291' },
    { label: 'Camera Status', value: 'Online · Normal brightness' },
    { label: 'Attached Media', value: 'Snapshot (.jpg) + Video clip (.gif)' },
  ],
};
