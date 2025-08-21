// Main application dashboard container wiring together webcam polling, API detection calls, theme state, and sidebar panels.
// Coordinates live stream frame capturing, event modal rendering, and alert audio notifications.

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Webcam from 'react-webcam';
import axios from 'axios';
import { Home, Moon, Sun } from 'lucide-react';
import './index.css';

import DetectionOverlay from './components/DetectionOverlay';
import StatusPill from './components/StatusPill';
import HeroSection from './components/HeroSection';
import CameraHealth from './components/CameraHealth';
import EventViewer from './components/EventViewer';
import EventHistory from './components/EventHistory';

import { FIRE_CLASSES, formatPercent } from './utils/helpers';

axios.defaults.headers.common['ngrok-skip-browser-warning'] = 'true';

const App = () => {
  const webcamRef = useRef(null);
  const requestInFlightRef = useRef(false);
  const lastAlertAtRef = useRef(0);
  const uploadInputRef = useRef(null);

  const [theme, setTheme] = useState('light');
  const [activeView, setActiveView] = useState('live');
  const [currentRoute, setCurrentRoute] = useState('landing');

  const [isRunning, setIsRunning] = useState(false);
  const [intervalMs, setIntervalMs] = useState(500);
  const [baseApi, setBaseApi] = useState(
    window.location.hostname.includes('ngrok') || window.location.port === '8000'
      ? window.location.origin
      : 'http://localhost:8000'
  );
  const [response, setResponse] = useState('Waiting for start...');
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
      return FIRE_CLASSES.includes(d.class) && !d.alert_eligible;
    }).length;

    if (rejectedFireCount > 0) {
      setResponse('No fire. Red/pink color-like detection ignored.');
    } else {
      setResponse(data.alert_summary || 'No fire detected.');
    }
  }, [beep, fetchEvents]);

  const detectFile = useCallback(async (file) => {
    if (requestInFlightRef.current) return;
    requestInFlightRef.current = true;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const result = await axios.post(`${baseApi}/detect`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      applyDetectionResult(result.data);
    } catch (error) {
      console.error('Detection error:', error);
      setDetections([]);
      setAlertLevel('safe');
      setResponse('Error connecting to backend.');
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
    detectFile(file);
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

  const openConsole = useCallback((view = 'live') => {
    setActiveView(view);
    setCurrentRoute('console');
  }, []);

  const openLanding = useCallback(() => {
    setCurrentRoute('landing');
  }, []);

  return (
    <div className="app-shell">
      {currentRoute === 'landing' ? (
        <HeroSection
          theme={theme}
          onToggleTheme={toggleTheme}
          onOpenConsole={() => openConsole('live')}
          onOpenUpload={() => openConsole('upload')}
        />
      ) : (
        <section className="console-section" id="console">
          <nav className="console-nav">
            <div className="console-nav-brand">
              <span className="hero-brand-mark" aria-hidden="true">
                <span />
                <span />
                <span />
                <span />
              </span>
              <span onClick={openLanding}>Fire Detection</span>
            </div>
            <div className="console-nav-actions">
              <button className="icon-btn" onClick={toggleTheme} type="button" title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}>
                {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
              </button>
            </div>
          </nav>

          <header className="console-header">
            <div>
              <span className="eyebrow">System Dashboard</span>
              <h1>Monitoring Console</h1>
              <p>{response}</p>
            </div>
          </header>

          <main className="dashboard-grid">
            <section className="monitor-panel">
              <div className="view-tabs">
                <button className={activeView === 'live' ? 'active' : ''} onClick={() => setActiveView('live')} type="button">
                  Live Camera
                </button>
                <button className={activeView === 'upload' ? 'active' : ''} onClick={() => setActiveView('upload')} type="button">
                  Image Test
                </button>
                <button className={activeView === 'history' ? 'active' : ''} onClick={() => setActiveView('history')} type="button">
                  History
                </button>
              </div>

              {activeView === 'live' && (
                <>
                  <div className="video-container">
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
                      className="webcam-feed"
                      style={{ width: '100%', height: 'auto' }}
                    />
                    <DetectionOverlay detections={detections} frameSize={frameSize} />
                  </div>

                  <div className="control-row">
                    <label>
                      Base API
                      <input type="text" value={baseApi} onChange={(e) => setBaseApi(e.target.value)} />
                    </label>
                    <label>
                      Interval
                      <select value={intervalMs} onChange={(e) => setIntervalMs(Number(e.target.value))}>
                        <option value={100}>100ms</option>
                        <option value={500}>500ms</option>
                        <option value={1000}>1000ms</option>
                        <option value={2000}>2000ms</option>
                      </select>
                    </label>
                    <button className={`primary-btn ${isRunning ? 'stop' : ''}`} onClick={() => setIsRunning(!isRunning)} type="button">
                      {isRunning ? 'Stop Monitoring' : 'Start Monitoring'}
                    </button>
                  </div>
                </>
              )}

              {activeView === 'upload' && (
                <section className="upload-panel">
                  <div className="upload-actions">
                    <input accept="image/*" onChange={handleUpload} ref={uploadInputRef} type="file" />
                    <button className="primary-btn" onClick={() => uploadInputRef.current?.click()} type="button">
                      Choose Image
                    </button>
                  </div>
                  <div className="upload-preview">
                    {uploadPreview ? (
                      <>
                        <img src={uploadPreview} alt="Uploaded fire test" />
                        <DetectionOverlay detections={detections} frameSize={frameSize} />
                      </>
                    ) : (
                      <span>Select an image to test fire detection.</span>
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
                  isLoading={eventsLoading}
                  updatedAt={eventsUpdatedAt}
                />
              )}
            </section>

            <aside className="side-stack">
              <section className="side-panel">
                <h2>Alert Details</h2>
                <div className="metric-row">
                  <span>Level</span>
                  <strong>{alertLevel.toUpperCase()}</strong>
                </div>
                <div className="metric-row">
                  <span>Detections</span>
                  <strong>{detections.length}</strong>
                </div>
                <div className="metric-row">
                  <span>Alert Boxes</span>
                  <strong>{detections.filter((d) => d.alert_eligible).length}</strong>
                </div>
              </section>

              <CameraHealth health={cameraHealth} onRefresh={fetchCameraHealth} />

              <EventHistory
                events={events.slice(0, 3)}
                baseApi={baseApi}
                onRefresh={fetchEvents}
                onSelectEvent={setSelectedEvent}
                isLoading={eventsLoading}
                updatedAt={eventsUpdatedAt}
              />
            </aside>
          </main>
        </section>
      )}

      <EventViewer event={selectedEvent} baseApi={baseApi} onClose={() => setSelectedEvent(null)} />
    </div>
  );
};

export default App;
