import React, { useCallback, useEffect, useRef, useState } from 'react';
import Webcam from 'react-webcam';
import axios from 'axios';
import { Moon, Sun } from 'lucide-react';

import DetectionOverlay from './components/DetectionOverlay';
import CameraHealth from './components/CameraHealth';
import EventViewer from './components/EventViewer';
import EventHistory from './components/EventHistory';
import Logo from './landing/components/brand/Logo';

import { FIRE_CLASSES, consoleViewFromUrl, defaultApiUrl, formatPercent } from './utils/helpers';
import { consoleTheme } from './consoleTw';

axios.defaults.headers.common['ngrok-skip-browser-warning'] = 'true';

const App = () => {
  const webcamRef = useRef(null);
  const requestInFlightRef = useRef(false);
  const lastAlertAtRef = useRef(0);
  const uploadInputRef = useRef(null);

  const [theme, setTheme] = useState('light');
  const [activeView, setActiveView] = useState(() => consoleViewFromUrl() || 'live');

  const [isRunning, setIsRunning] = useState(false);
  const [intervalMs, setIntervalMs] = useState(500);
  const [baseApi, setBaseApi] = useState(() => defaultApiUrl());
  const [response, setResponse] = useState('Camera standing by. Click Start Monitoring to begin.');
  const [detections, setDetections] = useState([]);
  const [frameSize, setFrameSize] = useState({ width: 960, height: 720 });
  const [alertLevel, setAlertLevel] = useState('safe');

  const [cameraHealth, setCameraHealth] = useState(null);
  const [events, setEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [eventsUpdatedAt, setEventsUpdatedAt] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [uploadPreview, setUploadPreview] = useState('');

  const beep = useCallback(() => {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    oscillator.type = 'square';
    oscillator.frequency.value = 880;
    gainNode.gain.value = 0.1;
    oscillator.start();

    setTimeout(() => {
      oscillator.stop();
      audioCtx.close();
    }, 200);
  }, []);

  const fetchEvents = useCallback(async () => {
    setEventsLoading(true);
    try {
      const result = await axios.get(`${baseApi}/events`, {
        params: { limit: 50, _: Date.now() },
      });
      setEvents(result.data.events || []);
      setEventsUpdatedAt(new Date());
    } catch (error) {
      console.error('Event fetch error:', error);
    } finally {
      setEventsLoading(false);
    }
  }, [baseApi]);

  const deleteEvent = useCallback(async (event) => {
    if (!window.confirm('Delete this event with its snapshot and GIF? This cannot be undone.')) return;
    try {
      await axios.delete(`${baseApi}/events/${event.id}`);
      setEvents((current) => current.filter((item) => item.id !== event.id));
      setSelectedEvent((current) => (current?.id === event.id ? null : current));
    } catch (error) {
      console.error('Event delete error:', error);
      window.alert('Could not delete the event. Refreshing the list.');
      fetchEvents();
    }
  }, [baseApi, fetchEvents]);

  const clearEvents = useCallback(async () => {
    if (!window.confirm('Delete all events with their snapshots and GIFs? This cannot be undone.')) return;
    try {
      await axios.delete(`${baseApi}/events`);
      setEvents([]);
      setSelectedEvent(null);
    } catch (error) {
      console.error('Event clear error:', error);
      window.alert('Could not clear the event history. Refreshing the list.');
      fetchEvents();
    }
  }, [baseApi, fetchEvents]);

  const fetchCameraHealth = useCallback(async () => {
    try {
      const result = await axios.get(`${baseApi}/camera-health`);
      setCameraHealth((current) => ({ ...current, ...result.data }));
    } catch (error) {
      console.error('Camera health error:', error);
    }
  }, [baseApi]);

  const applyDetectionResult = useCallback((data) => {
    const nextDetections = data.detections || [];
    const alertDetections = nextDetections.filter((d) => d.alert_eligible);

    setDetections(nextDetections);
    setAlertLevel(data.alert_level || 'safe');
    setCameraHealth(data.camera_health || null);

    if (data.frame) {
      setFrameSize(data.frame);
    }

    if (data.fire_detected) {
      const best = alertDetections.reduce((top, current) => {
        if (!top) return current;
        return current.confidence > top.confidence ? current : top;
      }, null);

      setResponse(
        data.alert_summary ||
        `WARNING: FIRE DETECTED NOW! Confidence ${best ? formatPercent(best.confidence) : '0%'}`
      );

      const now = Date.now();
      if (now - lastAlertAtRef.current > 2000) {
        beep();
        lastAlertAtRef.current = now;
      }

      if (data.event) {
        fetchEvents();
      }
      return;
    }

    const rejectedFireCount = nextDetections.filter((d) => {
      return FIRE_CLASSES.includes(d.class) && !d.alert_eligible && !d.on_person;
    }).length;

    if (rejectedFireCount > 0) {
      setResponse('No fire. Red/pink color-like detection ignored.');
    } else {
      setResponse(data.alert_summary || 'No fire detected.');
    }
  }, [beep, fetchEvents]);

  const detectFile = useCallback(async (file, { live = false } = {}) => {
    if (requestInFlightRef.current) return;
    requestInFlightRef.current = true;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const result = await axios.post(`${baseApi}/detect`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        params: live ? { live: true } : undefined,
      });
      applyDetectionResult(result.data);
    } catch (error) {
      console.error('Detection error:', error);
      setDetections([]);
      setAlertLevel('safe');
      setResponse(error.response?.data?.detail || 'Error connecting to backend.');
    } finally {
      requestInFlightRef.current = false;
    }
  }, [applyDetectionResult, baseApi]);

  const captureAndDetect = useCallback(async () => {
    if (!webcamRef.current) return;
    const imageSrc = webcamRef.current.getScreenshot({ width: 640, height: 480 });
    if (!imageSrc) return;

    const res = await fetch(imageSrc);
    const blob = await res.blob();
    const file = new File([blob], 'capture.jpg', { type: 'image/jpeg' });
    detectFile(file, { live: true });
  }, [detectFile]);

  const handleUpload = useCallback((event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (uploadPreview) {
      URL.revokeObjectURL(uploadPreview);
    }

    setActiveView('upload');
    setUploadPreview(URL.createObjectURL(file));
    detectFile(file);
  }, [detectFile, uploadPreview]);

  useEffect(() => {
    let intervalId;
    if (isRunning) {
      intervalId = setInterval(captureAndDetect, intervalMs);
    }
    return () => clearInterval(intervalId);
  }, [isRunning, intervalMs, captureAndDetect]);

  useEffect(() => {
    fetchEvents();
    fetchCameraHealth();
  }, [fetchCameraHealth, fetchEvents]);

  useEffect(() => {
    const intervalId = setInterval(fetchEvents, 8000);
    return () => clearInterval(intervalId);
  }, [fetchEvents]);

  useEffect(() => {
    const storedTheme = window.localStorage.getItem('fire-monitor-theme');
    if (storedTheme === 'dark' || storedTheme === 'light') {
      setTheme(storedTheme);
    }
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem('fire-monitor-theme', theme);
  }, [theme]);

  useEffect(() => {
    return () => {
      if (uploadPreview) {
        URL.revokeObjectURL(uploadPreview);
      }
    };
  }, [uploadPreview]);

  const toggleTheme = useCallback(() => {
    setTheme((current) => (current === 'dark' ? 'light' : 'dark'));
  }, []);

  return (
    <div className="min-h-screen w-full bg-[var(--bg)] font-sans text-sm leading-[1.6] tracking-[-0.01em] text-[var(--text)] antialiased" style={consoleTheme(theme === 'dark')}>
      <section className="mx-auto w-[min(1200px,100%)] px-[clamp(16px,4vw,48px)] pb-12 max-[760px]:px-[14px] max-[760px]:pb-8" id="console">
        <nav className="sticky top-0 z-[100] -mx-[clamp(16px,4vw,48px)] mb-7 flex items-center justify-between border-b border-[var(--border)] bg-[color-mix(in_srgb,var(--bg)_85%,transparent)] px-[clamp(16px,4vw,48px)] py-[14px] backdrop-blur-[12px] max-[760px]:-mx-[14px] max-[760px]:mb-5 max-[760px]:gap-0 max-[760px]:px-[14px] max-[760px]:py-3">
          <Logo href="/" title="Back to the FireCatch home page" />
          <div className="flex items-center gap-2.5 max-[760px]:gap-1.5">
            <div
              className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1 text-xs font-mono text-[var(--muted)] max-[480px]:hidden"
              title={`Connected API: ${baseApi}`}
            >
              <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-sans uppercase tracking-wider text-[var(--soft)]">API</span>
              <span className="max-w-[150px] truncate text-[11px] text-[var(--text)] sm:max-w-[240px]">
                {baseApi}
              </span>
            </div>
            <button className="inline-flex size-9 min-w-0 items-center justify-center rounded-[var(--radius)] border border-transparent bg-transparent p-0 text-[var(--muted)] transition-all duration-[180ms] hover:bg-[var(--surface-muted)] hover:text-[var(--text)] max-[760px]:size-[34px]" onClick={toggleTheme} type="button" title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}>
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>
        </nav>

        <header className="py-2 pb-9 max-[760px]:pt-1 max-[760px]:pb-5">
          <div>
            <span className="block font-mono text-[11px] font-medium uppercase tracking-[0.06em] text-[var(--soft)] max-[760px]:text-[10px]">Real-Time Security Feed</span>
            <h1 className="mt-1.5 font-sans text-[clamp(24px,3vw,36px)] leading-[1.1] font-semibold tracking-[-0.025em] max-[760px]:text-[22px] max-[420px]:text-[20px]">Live Fire & Smoke Monitor</h1>
            <p className="mt-2.5 max-w-[760px] text-sm leading-[1.5] text-[var(--muted)] max-[760px]:text-[13px]">{response}</p>
          </div>
        </header>

        <main className="grid grid-cols-[minmax(0,1fr)_360px] gap-5 max-[1080px]:grid-cols-1 max-[760px]:gap-3.5">
          <section className="min-w-0 rounded-[var(--radius)] border border-dashed border-[var(--border-strong)] bg-[var(--surface)] p-[18px] transition-[border-color] duration-[180ms] max-[760px]:p-3">
            <div className="mb-4 grid grid-cols-3 overflow-hidden rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-muted)] p-1 max-[760px]:grid-cols-1 max-[760px]:p-[3px]">
              <button className={`${"min-h-9 rounded-[calc(var(--radius)-4px)] border-0 bg-transparent px-3 py-2.5 font-sans text-[13px] font-medium text-[var(--muted)] transition-all duration-[180ms] max-[760px]:min-h-[38px]"} ${activeView === 'live' ? "bg-[var(--surface)] text-[var(--text)] shadow-[0_1px_2px_rgba(0,0,0,0.06)]" : ''}`} onClick={() => setActiveView('live')} type="button">
                Live Camera
              </button>
              <button className={`${"min-h-9 rounded-[calc(var(--radius)-4px)] border-0 bg-transparent px-3 py-2.5 font-sans text-[13px] font-medium text-[var(--muted)] transition-all duration-[180ms] max-[760px]:min-h-[38px]"} ${activeView === 'upload' ? "bg-[var(--surface)] text-[var(--text)] shadow-[0_1px_2px_rgba(0,0,0,0.06)]" : ''}`} onClick={() => setActiveView('upload')} type="button">
                Test Image
              </button>
              <button className={`${"min-h-9 rounded-[calc(var(--radius)-4px)] border-0 bg-transparent px-3 py-2.5 font-sans text-[13px] font-medium text-[var(--muted)] transition-all duration-[180ms] max-[760px]:min-h-[38px]"} ${activeView === 'history' ? "bg-[var(--surface)] text-[var(--text)] shadow-[0_1px_2px_rgba(0,0,0,0.06)]" : ''}`} onClick={() => setActiveView('history')} type="button">
                Event History
              </button>
            </div>

            {activeView === 'live' && (
              <>
                <div className={`${"relative max-h-[80vh] w-full overflow-hidden border border-dotted border-[var(--media-border)] bg-[#050505] max-[760px]:max-h-[65vh]"} ${theme === 'light' ? "bg-[#fbfbfa]" : ''}`}>
                  <Webcam
                    audio={false}
                    ref={webcamRef}
                    screenshotFormat="image/jpeg"
                    minScreenshotWidth={640}
                    minScreenshotHeight={480}
                    videoConstraints={{
                      width: { ideal: 1280 },
                      height: { ideal: 720 },
                      facingMode: 'environment',
                    }}
                    className="block h-auto max-h-[80vh] w-full object-contain max-[760px]:max-h-[65vh]"
                    style={{ width: '100%', height: 'auto' }}
                  />
                  <DetectionOverlay detections={detections} frameSize={frameSize} />
                </div>

                <div className="mt-3 grid grid-cols-[minmax(220px,1fr)_auto_auto] items-end gap-2.5 max-[760px]:grid-cols-1 max-[760px]:gap-2">
                  <label className="flex flex-col gap-1.5 text-xs font-bold text-[var(--soft)]">
                    <span className="flex items-center justify-between">
                      <span>Base API</span>
                      {import.meta.env.VITE_API_URL && (
                        <span className="text-[10px] font-mono font-normal text-emerald-600 dark:text-emerald-400">
                          auto-configured from VITE_API_URL
                        </span>
                      )}
                    </span>
                    <input className="min-h-10 rounded-[calc(var(--radius)-2px)] border border-[var(--border)] bg-[var(--surface)] px-3 py-2 font-mono text-[13px] text-[var(--text)] transition-all duration-[180ms] focus:border-[var(--text)] focus:outline-none focus:ring-3 focus:ring-[color-mix(in_srgb,var(--accent)_10%,transparent)]" type="text" value={baseApi} onChange={(e) => setBaseApi(e.target.value)} />
                  </label>
                  <label className="flex flex-col gap-1.5 text-xs font-bold text-[var(--soft)]">
                    Interval
                    <select className="min-h-10 rounded-[calc(var(--radius)-2px)] border border-[var(--border)] bg-[var(--surface)] px-3 py-2 font-mono text-[13px] text-[var(--text)] transition-all duration-[180ms] focus:border-[var(--text)] focus:outline-none focus:ring-3 focus:ring-[color-mix(in_srgb,var(--accent)_10%,transparent)]" value={intervalMs} onChange={(e) => setIntervalMs(Number(e.target.value))}>
                      <option value={100}>100ms</option>
                      <option value={500}>500ms</option>
                      <option value={1000}>1000ms</option>
                      <option value={2000}>2000ms</option>
                    </select>
                  </label>
                  <button className={`${"inline-flex min-h-10 items-center justify-center rounded-[var(--radius)] border border-[var(--accent)] bg-[var(--accent)] px-5 py-[9px] font-sans text-sm font-medium tracking-[-0.01em] text-[var(--accent-text)] no-underline transition-all duration-[180ms] hover:opacity-88 active:scale-[0.98] max-[760px]:w-full"} ${isRunning ? "border-danger bg-danger text-white" : ''}`} onClick={() => setIsRunning(!isRunning)} type="button">
                    {isRunning ? 'Stop Monitoring' : 'Start Monitoring'}
                  </button>
                </div>
              </>
            )}

            {activeView === 'upload' && (
              <section>
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2.5">
                    <input className="hidden" accept="image/*" onChange={handleUpload} ref={uploadInputRef} type="file" />
                    <button className="inline-flex min-h-10 items-center justify-center rounded-[var(--radius)] border border-[var(--accent)] bg-[var(--accent)] px-5 py-[9px] font-sans text-sm font-medium tracking-[-0.01em] text-[var(--accent-text)] no-underline transition-all duration-[180ms] hover:opacity-88 active:scale-[0.98] max-[760px]:w-full" onClick={() => uploadInputRef.current?.click()} type="button">
                      Choose Image
                    </button>
                  </div>
                  <div className="flex items-center gap-1.5 font-mono text-xs text-[var(--muted)]">
                    <span className="size-1.5 rounded-full bg-emerald-500" />
                    <span className="text-[10px] uppercase font-sans text-[var(--soft)]">Target API:</span>
                    <span className="truncate max-w-[200px] text-[var(--text)]">{baseApi}</span>
                  </div>
                </div>
                <div className={`${"relative max-h-[80vh] w-full overflow-hidden border border-dotted border-[var(--media-border)] bg-[#050505] max-[760px]:max-h-[65vh]"} ${theme === 'light' ? "bg-[#fbfbfa]" : ''}`}>
                  {uploadPreview ? (
                    <>
                      <img className="block h-auto max-h-[80vh] w-full object-contain max-[760px]:max-h-[65vh]" src={uploadPreview} alt="Uploaded fire test" />
                      <DetectionOverlay detections={detections} frameSize={frameSize} />
                    </>
                  ) : (
                    <span className="absolute inset-0 grid place-items-center p-6 text-center text-[#d1d5db]">Select an image to test fire and smoke detection.</span>
                  )}
                </div>
              </section>
            )}

            {activeView === 'history' && (
              <EventHistory
                events={events}
                baseApi={baseApi}
                onRefresh={fetchEvents}
                onSelectEvent={setSelectedEvent}
                onDeleteEvent={deleteEvent}
                onClearAll={clearEvents}
                isLoading={eventsLoading}
                updatedAt={eventsUpdatedAt}
              />
            )}
          </section>

          <aside className="flex flex-col gap-4 max-[1080px]:grid max-[1080px]:grid-cols-[repeat(auto-fit,minmax(280px,1fr))] max-[760px]:grid-cols-1 max-[760px]:gap-3.5">
            <section className="min-w-0 rounded-[var(--radius)] border border-dashed border-[var(--border-strong)] bg-[var(--surface)] p-[18px] transition-[border-color] duration-[180ms] max-[760px]:p-3.5">
              <h2 className="m-0 font-sans text-[15px] font-semibold tracking-[-0.01em]">Hazard Status</h2>
              <div className="flex items-center justify-between gap-4 border-b border-[var(--border)] py-3 text-[13px] text-[var(--muted)]">
                <span>Threat Level</span>
                <strong className="font-mono font-medium text-[var(--text)]">{alertLevel.toUpperCase()}</strong>
              </div>
              <div className="flex items-center justify-between gap-4 border-b border-[var(--border)] py-3 text-[13px] text-[var(--muted)]">
                <span>Detected Objects</span>
                <strong className="font-mono font-medium text-[var(--text)]">{detections.length}</strong>
              </div>
              <div className="flex items-center justify-between gap-4 border-b border-[var(--border)] py-3 text-[13px] text-[var(--muted)]">
                <span>Confirmed Hazards</span>
                <strong className="font-mono font-medium text-[var(--text)]">{detections.filter((d) => d.alert_eligible).length}</strong>
              </div>
            </section>

            <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-muted)] p-3.5 text-xs leading-[1.5] text-[var(--muted)]">
              <p className="m-0">
                <strong className="text-[var(--text)]">Operational Notice:</strong> System is not 100% accurate. Glare, hot lighting, or sudden reflections may occasionally trigger a false alert. Always confirm hazards visually.
              </p>
            </div>

            <CameraHealth health={cameraHealth} onRefresh={fetchCameraHealth} />

            <EventHistory
              events={events.slice(0, 3)}
              baseApi={baseApi}
              onRefresh={fetchEvents}
              onSelectEvent={setSelectedEvent}
              onDeleteEvent={deleteEvent}
              isLoading={eventsLoading}
              updatedAt={eventsUpdatedAt}
            />
          </aside>
        </main>
      </section>

      <EventViewer
        event={selectedEvent}
        baseApi={baseApi}
        onClose={() => setSelectedEvent(null)}
        onDelete={deleteEvent}
      />
    </div>
  );
};

export default App;
