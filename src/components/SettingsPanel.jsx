import { useState, useEffect } from 'react';
import './SettingsPanel.css';

/**
 * Slider component for settings with visual fill
 */
const Slider = ({ label, value, min, max, step, onChange, unit = '' }) => {
  // Calculate fill percentage for visual feedback
  const fillPercent = ((value - min) / (max - min)) * 100;
  
  return (
    <div className="slider-control">
      <div className="slider-header">
        <span className="slider-label">{label}</span>
        <span className="slider-value">{value.toFixed(step < 1 ? 2 : 0)}{unit}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="slider-input"
        style={{
          background: `linear-gradient(90deg, rgba(0, 255, 255, 0.5) 0%, rgba(255, 0, 255, 0.5) ${fillPercent}%, rgba(255, 255, 255, 0.1) ${fillPercent}%)`
        }}
      />
    </div>
  );
};

/**
 * Toggle component for boolean settings
 */
const Toggle = ({ label, checked, onChange }) => {
  return (
    <div className="toggle-control">
      <span className="toggle-label">{label}</span>
      <button
        className={`toggle-button ${checked ? 'active' : ''}`}
        onClick={() => onChange(!checked)}
      >
        <span className="toggle-indicator" />
      </button>
    </div>
  );
};

/**
 * Select component for dropdown settings
 */
const Select = ({ label, value, options, onChange }) => {
  return (
    <div className="select-control">
      <span className="select-label">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="select-input"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
};

/**
 * Collapsible section for organizing settings
 */
const Section = ({ title, icon, children, defaultOpen = true }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className={`settings-section ${isOpen ? 'open' : 'closed'}`}>
      <button className="section-header" onClick={() => setIsOpen(!isOpen)}>
        <span className="section-icon">{icon}</span>
        <span className="section-title">{title}</span>
        <span className={`section-chevron ${isOpen ? 'open' : ''}`}>&#9660;</span>
      </button>
      {isOpen && <div className="section-content">{children}</div>}
    </div>
  );
};

/**
 * SettingsPanel component
 * Provides controls for all visualization parameters
 */
const SettingsPanel = ({ settings, onSettingsChange }) => {
  const [isOpen, setIsOpen] = useState(false);

  const updateSetting = (key, value) => {
    onSettingsChange({
      ...settings,
      [key]: value,
    });
  };

  // Keyboard shortcut to toggle panel
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'KeyS' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        // Don't trigger if user is typing in an input
        if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
          e.preventDefault();
          setIsOpen((prev) => !prev);
        }
      }
      // Escape to close
      if (e.code === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  return (
    <>
      {/* Toggle button */}
      <button
        className={`settings-toggle ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        title="Paramètres de visualisation"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      </button>

      {/* Settings panel */}
      <div className={`settings-panel ${isOpen ? 'open' : ''}`}>
        <div className="settings-header">
          <h2>Paramètres</h2>
          <button className="close-button" onClick={() => setIsOpen(false)}>
            &times;
          </button>
        </div>

        <div className="settings-content">
          {/* Audio Section */}
          <Section title="Audio" icon="🎵" defaultOpen={true}>
            <Slider
              label="Sensibilité globale"
              value={settings.sensitivity}
              min={0.5}
              max={3}
              step={0.1}
              onChange={(v) => updateSetting('sensitivity', v)}
            />
            <Slider
              label="Intensité Bass"
              value={settings.bassIntensity}
              min={0}
              max={3}
              step={0.1}
              onChange={(v) => updateSetting('bassIntensity', v)}
            />
            <Slider
              label="Intensité Mid"
              value={settings.midIntensity}
              min={0}
              max={3}
              step={0.1}
              onChange={(v) => updateSetting('midIntensity', v)}
            />
            <Slider
              label="Intensité High"
              value={settings.highIntensity}
              min={0}
              max={3}
              step={0.1}
              onChange={(v) => updateSetting('highIntensity', v)}
            />
            <Slider
              label="Smoothing audio"
              value={settings.smoothing}
              min={0.1}
              max={0.95}
              step={0.05}
              onChange={(v) => updateSetting('smoothing', v)}
            />
          </Section>

          {/* Particles Section */}
          <Section title="Particules" icon="✨" defaultOpen={true}>
            <Slider
              label="Nombre de particules"
              value={settings.particleCount}
              min={1000}
              max={25000}
              step={1000}
              onChange={(v) => updateSetting('particleCount', v)}
            />
            <Slider
              label="Taille de base"
              value={settings.particleSize}
              min={1}
              max={8}
              step={0.5}
              onChange={(v) => updateSetting('particleSize', v)}
            />
            <Toggle
              label="Taille réactive"
              checked={settings.reactiveSize}
              onChange={(v) => updateSetting('reactiveSize', v)}
            />
          </Section>

          {/* Animation Section */}
          <Section title="Animation" icon="🌀" defaultOpen={false}>
            <Slider
              label="Vitesse rotation"
              value={settings.rotationSpeed}
              min={0}
              max={0.05}
              step={0.001}
              onChange={(v) => updateSetting('rotationSpeed', v)}
            />
            <Slider
              label="Vitesse animation"
              value={settings.animationSpeed}
              min={0.5}
              max={2}
              step={0.1}
              onChange={(v) => updateSetting('animationSpeed', v)}
            />
          </Section>

          {/* Shape Section */}
          <Section title="Forme" icon="🔮" defaultOpen={true}>
            <Select
              label="Distribution"
              value={settings.shape}
              options={[
                { value: 'sphere', label: 'Sphère' },
                { value: 'spiral', label: 'Spirale / Galaxie' },
              ]}
              onChange={(v) => updateSetting('shape', v)}
            />
            <Slider
              label="Expansion (rayon)"
              value={settings.expansion}
              min={0.5}
              max={2}
              step={0.1}
              onChange={(v) => updateSetting('expansion', v)}
            />
          </Section>
        </div>

        {/* Reset button */}
        <div className="settings-footer">
          <button
            className="reset-button"
            onClick={() => onSettingsChange(null)}
            title="Réinitialiser les paramètres"
          >
            Réinitialiser
          </button>
        </div>
      </div>

      {/* Backdrop */}
      {isOpen && (
        <div className="settings-backdrop" onClick={() => setIsOpen(false)} />
      )}
    </>
  );
};

export default SettingsPanel;
