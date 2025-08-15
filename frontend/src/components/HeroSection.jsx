// Hero landing page component presenting product branding, overview copy, and primary navigation actions.
// Hosts the pixel art detection animation canvas and key feature highlight cards.

import React from 'react';
import { Moon, Sun, Play, Image as ImageIcon } from 'lucide-react';
import PixelDetectionAnimation from './PixelDetectionAnimation';

const HeroSection = ({ theme, onToggleTheme, onOpenConsole, onOpenUpload }) => (
  <section className="hero-section" aria-labelledby="hero-title">
    <div className="hero-nav">
      <div className="hero-brand">
        <span className="hero-brand-mark" aria-hidden="true">
          <span />
          <span />
          <span />
          <span />
        </span>
      </div>
      <button
        className="icon-btn hero-theme"
        onClick={onToggleTheme}
        type="button"
        title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      >
        {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
      </button>
    </div>

    <div className="hero-layout">
      <div className="hero-copy">
        <span className="eyebrow">AI Camera Monitoring</span>
        <h1 id="hero-title">Fire Detection</h1>
        <p>
          A clean vision console that watches live camera frames, draws precise
          fire boxes, and stores image plus GIF evidence when an alert is real.
        </p>

        <div className="hero-actions">
          <button className="primary-btn hero-try-btn" onClick={onOpenConsole} type="button">
            <Play size={16} style={{ marginRight: '6px' }} /> Try now
          </button>
          <button className="primary-btn secondary" onClick={onOpenUpload} type="button">
            <ImageIcon size={16} style={{ marginRight: '6px' }} /> Test Image
          </button>
        </div>

        <PixelDetectionAnimation />

        <div className="hero-highlights" aria-label="System highlights">
          <div className="hero-highlight-tag fire">
            <span>01 / Detect</span>
            <strong>Live flame detection</strong>
            <small>AI box locks onto visible fire</small>
          </div>
          <div className="hero-highlight-tag verify">
            <span>02 / Verify</span>
            <strong>False-positive filtering</strong>
            <small>Rejects red walls and flat color noise</small>
          </div>
          <div className="hero-highlight-tag capture">
            <span>03 / Capture</span>
            <strong>Snapshot and GIF capture</strong>
            <small>Stores evidence for each real alert</small>
          </div>
        </div>
      </div>
    </div>
  </section>
);

export default HeroSection;
