// Shared visuals — LIGHT THEME
// Brand motif: live EMG waveform on warm-paper background.

const PH = {
  bg: '#F5F2EC',          // warm paper
  bgAlt: '#FFFFFF',       // card surface
  bgSoft: '#EDE9DF',      // subtle fill
  ink: '#1A1A1F',         // main text
  inkDim: '#5C5C68',      // secondary
  inkFaint: '#9A9AA8',    // tertiary
  hair: 'rgba(20,20,30,0.08)',
  hairStrong: 'rgba(20,20,30,0.16)',
  lime: '#3D7A1F',        // deep moss-green for EMG signal (works on light)
  limeBright: '#7FCB3A',  // accent lime
  limeSoft: '#E6F3D4',    // tinted bg
  coral: '#E8553A',
  violet: '#5B4DD9',
  violetSoft: '#EAE7FB',
  ok: '#2A9D5C',
  fontSans: '"Space Grotesk", "Inter", system-ui, sans-serif',
  fontText: '"Inter", system-ui, sans-serif',
  fontMono: '"JetBrains Mono", ui-monospace, monospace',
};

// EMG waveform
function EMGWave({ width = 320, height = 60, color = PH.lime, intensity = 0.8, density = 1, glow = true, style = {} }) {
  const id = React.useId ? React.useId() : 'wave-' + Math.random().toString(36).slice(2, 8);
  const points = React.useMemo(() => {
    const n = 200, seed = Math.floor(Math.random() * 1000), arr = [];
    for (let i = 0; i < n; i++) {
      const t = i / n;
      const base = Math.sin(t * Math.PI * 8 * density + seed) * 0.18
                 + Math.sin(t * Math.PI * 22 * density + seed * 2) * 0.10;
      const cluster = Math.sin(t * Math.PI * 6) > 0.85 ? Math.sin(t * 220) * 0.55 : 0;
      const noise = ((Math.sin(seed + i * 17.13) + 1) / 2 - 0.5) * 0.12;
      const y = height / 2 + (base + cluster + noise) * intensity * (height / 2 - 4);
      arr.push(`${(i / (n - 1)) * width},${y.toFixed(2)}`);
    }
    return arr.join(' ');
  }, [width, height, intensity, density]);
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ display: 'block', ...style }}>
      {glow && <defs><filter id={id} x="-10%" y="-50%" width="120%" height="200%"><feGaussianBlur stdDeviation="1.2" /></filter></defs>}
      {glow && <polyline points={points} fill="none" stroke={color} strokeWidth="2.6" opacity="0.25" filter={`url(#${id})`} />}
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

function Card({ children, style = {}, padded = true, raised = false }) {
  return (
    <div style={{
      background: PH.bgAlt,
      border: `1px solid ${PH.hair}`,
      borderRadius: 18,
      padding: padded ? 18 : 0,
      position: 'relative',
      overflow: 'hidden',
      boxShadow: raised ? '0 1px 2px rgba(20,20,30,0.04), 0 8px 24px -12px rgba(20,20,30,0.12)' : 'none',
      ...style,
    }}>{children}</div>
  );
}

function Pill({ children, color = PH.lime, filled = false, style = {} }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '4px 9px', borderRadius: 999,
      fontFamily: PH.fontMono, fontSize: 10, fontWeight: 500,
      letterSpacing: '0.08em', textTransform: 'uppercase',
      color: filled ? '#FFFFFF' : color,
      background: filled ? color : (color === PH.lime ? PH.limeSoft : `${color}14`),
      border: filled ? 'none' : `1px solid ${color}33`,
      ...style,
    }}>{children}</span>
  );
}

function PrimaryBtn({ children, onClick, style = {}, full = false, icon }) {
  return (
    <button onClick={onClick} style={{
      appearance: 'none', border: 'none', cursor: 'pointer',
      background: PH.ink, color: '#FFFFFF',
      padding: '14px 22px', borderRadius: 14,
      fontFamily: PH.fontSans, fontWeight: 600, fontSize: 16,
      letterSpacing: '-0.01em',
      width: full ? '100%' : 'auto',
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 10,
      boxShadow: '0 4px 14px -4px rgba(20,20,30,0.3)',
      ...style,
    }}>{children}{icon}</button>
  );
}

function GhostBtn({ children, onClick, style = {}, full = false }) {
  return (
    <button onClick={onClick} style={{
      appearance: 'none', cursor: 'pointer',
      background: '#FFFFFF', color: PH.ink,
      border: `1px solid ${PH.hairStrong}`,
      padding: '12px 18px', borderRadius: 12,
      fontFamily: PH.fontSans, fontWeight: 500, fontSize: 14,
      width: full ? '100%' : 'auto',
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
      ...style,
    }}>{children}</button>
  );
}

function IconBtn({ children, onClick, style = {} }) {
  return (
    <button onClick={onClick} style={{
      appearance: 'none', cursor: 'pointer',
      width: 40, height: 40, borderRadius: 999,
      background: PH.bgAlt, color: PH.ink,
      border: `1px solid ${PH.hair}`,
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      ...style,
    }}>{children}</button>
  );
}

// Phone shell — light
function PhoneShell({ children, tab, hideTab = false, style = {} }) {
  return (
    <IOSDevice width={390} height={780} dark={false}>
      <div style={{
        height: '100%', position: 'relative',
        background: PH.bg, color: PH.ink,
        fontFamily: PH.fontText,
        display: 'flex', flexDirection: 'column',
        ...style,
      }}>
        <div style={{ height: 54, flexShrink: 0 }} />
        <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>{children}</div>
        {!hideTab && <PhoneTabBar active={tab} />}
      </div>
    </IOSDevice>
  );
}

function PhoneTabBar({ active = 'home' }) {
  const items = [
    { id: 'home', label: 'Главная', icon: 'M3 11l9-8 9 8M5 9v11h14V9' },
    { id: 'play', label: 'Игры', icon: 'M5 4v16l14-8z' },
    { id: 'progress', label: 'Прогресс', icon: 'M3 19h18M6 16V9m4 7v-4m4 4V6m4 10v-7' },
    { id: 'settings', label: 'Профиль', icon: 'M12 12a4 4 0 100-8 4 4 0 000 8zm-7 8a7 7 0 0114 0' },
  ];
  return (
    <div style={{
      flexShrink: 0,
      borderTop: `1px solid ${PH.hair}`,
      background: 'rgba(245,242,236,0.92)',
      backdropFilter: 'blur(20px)',
      padding: '10px 8px 26px',
      display: 'flex', justifyContent: 'space-around',
    }}>
      {items.map(it => {
        const on = it.id === active;
        return (
          <div key={it.id} style={{
            flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
            color: on ? PH.ink : PH.inkFaint,
          }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={it.icon} /></svg>
            <span style={{ fontSize: 10, fontFamily: PH.fontSans, fontWeight: on ? 600 : 500, letterSpacing: '0.02em' }}>{it.label}</span>
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// ArmIllustration — stylized forearm with electrode pads + sensor.
// Used in onboarding/calibration to make placement intuitive.
// ─────────────────────────────────────────────────────────────
function ArmIllustration({ width = 280, active = true }) {
  const accent = active ? PH.lime : PH.inkFaint;
  return (
    <svg width={width} height={width * 0.62} viewBox="0 0 280 174" fill="none">
      {/* shadow */}
      <ellipse cx="140" cy="158" rx="100" ry="6" fill="rgba(20,20,30,0.06)" />
      {/* arm — stump form */}
      <path d="M30 90 Q 30 60, 60 56 L 175 56 Q 220 56, 230 90 L 220 105 Q 215 120, 175 120 L 60 120 Q 30 120, 30 90 Z"
        fill="#F5DCC4" stroke="#C9A380" strokeWidth="1.5" />
      {/* rounded stump end */}
      <path d="M230 90 Q 245 92, 245 100 Q 240 115, 220 105" fill="#EFCDB0" stroke="#C9A380" strokeWidth="1.5" />
      {/* skin shading */}
      <path d="M40 78 Q 80 70, 160 72 Q 200 74, 220 80" stroke="#D8AE8A" strokeWidth="1" opacity="0.5" />
      {/* electrode 1 */}
      <g transform="translate(85 82)">
        <circle r="22" fill="#FAFAFA" stroke="#C9C2B5" strokeWidth="1" />
        <circle r="14" fill="#FFFFFF" stroke="#E0DAC8" strokeWidth="0.5" />
        <circle r="5" fill={accent} opacity="0.25" />
        <circle r="2.5" fill={accent} />
        {active && <circle r="22" fill="none" stroke={accent} strokeWidth="1.5" opacity="0.4">
          <animate attributeName="r" values="22;30;22" dur="2s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.4;0;0.4" dur="2s" repeatCount="indefinite" />
        </circle>}
      </g>
      {/* electrode 2 */}
      <g transform="translate(140 95)">
        <circle r="22" fill="#FAFAFA" stroke="#C9C2B5" strokeWidth="1" />
        <circle r="14" fill="#FFFFFF" stroke="#E0DAC8" strokeWidth="0.5" />
        <circle r="5" fill={accent} opacity="0.25" />
        <circle r="2.5" fill={accent} />
      </g>
      {/* wires up */}
      <path d="M85 60 Q 90 30, 120 20" stroke="#888" strokeWidth="1.5" fill="none" />
      <path d="M140 73 Q 145 40, 130 22" stroke="#D04A30" strokeWidth="1.5" fill="none" />
      {/* sensor board top */}
      <g transform="translate(95 0)">
        <rect width="60" height="28" rx="4" fill="#C0392B" stroke="#8B2A1F" strokeWidth="1" />
        <rect x="6" y="6" width="20" height="14" rx="1" fill="#1A1A1F" />
        <circle cx="48" cy="10" r="2" fill={accent}>
          {active && <animate attributeName="opacity" values="1;0.3;1" dur="1.4s" repeatCount="indefinite" />}
        </circle>
        <circle cx="48" cy="18" r="2" fill="#5B4DD9" opacity="0.7" />
      </g>
    </svg>
  );
}

// Stylized device glyph (smaller, schematic)
function DeviceGlyph({ size = 200, connected = true }) {
  const accent = connected ? PH.lime : PH.coral;
  return (
    <svg width={size} height={size * 0.7} viewBox="0 0 200 140" fill="none">
      <rect x="60" y="20" width="80" height="44" rx="6" fill="#FAFAFA" stroke="#C0392B" strokeWidth="2" />
      <rect x="68" y="28" width="36" height="18" rx="2" fill="#1A1A1F" />
      <circle cx="130" cy="32" r="2.5" fill={accent}>
        {connected && <animate attributeName="opacity" values="1;0.2;1" dur="1.4s" repeatCount="indefinite" />}
      </circle>
      <circle cx="130" cy="40" r="2.5" fill={PH.violet} opacity="0.7" />
      {[0,1,2,3,4,5].map(i => <rect key={i} x={68 + i*6} y="50" width="3" height="8" fill="#888" />)}
      {/* wire */}
      <path d="M100 64 Q 100 80, 70 95" stroke="#888" strokeWidth="1.5" fill="none" />
      <path d="M120 64 Q 120 80, 150 95" stroke="#D04A30" strokeWidth="1.5" fill="none" />
      {/* electrodes */}
      <circle cx="60" cy="105" r="14" fill="#FAFAFA" stroke="#C9C2B5" />
      <circle cx="60" cy="105" r="3" fill={accent} />
      <circle cx="160" cy="105" r="14" fill="#FAFAFA" stroke="#C9C2B5" />
      <circle cx="160" cy="105" r="3" fill={accent} />
    </svg>
  );
}

// Game cover art — abstract scene per game
function GameCover({ kind, width = 88, height = 88 }) {
  const r = 12;
  if (kind === 'sparrow') {
    return (
      <svg width={width} height={height} viewBox="0 0 88 88">
        <rect width="88" height="88" rx={r} fill={PH.limeSoft} />
        <circle cx="20" cy="20" r="8" fill="#F2D75C" opacity="0.7" />
        <path d="M0 70 Q 22 60, 44 64 Q 66 68, 88 60 L 88 88 L 0 88 Z" fill={PH.limeBright} opacity="0.4" />
        <g transform="translate(34 36)">
          <circle r="14" fill={PH.lime} />
          <path d="M-7 -2 Q 0 -8, 8 -3 L 11 -6 L 10 0 Q 6 4, 0 4 Q -5 4, -7 -2 Z" fill="#FFFFFF" />
        </g>
        <path d="M16 50 L 28 50" stroke={PH.lime} strokeWidth="2" strokeLinecap="round" opacity="0.5" />
      </svg>
    );
  }
  if (kind === 'pulse') {
    return (
      <svg width={width} height={height} viewBox="0 0 88 88">
        <rect width="88" height="88" rx={r} fill={PH.violetSoft} />
        <path d="M0 64 L 88 64" stroke={PH.violet} strokeWidth="1.5" opacity="0.4" />
        {/* runner */}
        <g transform="translate(34 28)" fill={PH.violet}>
          <circle cx="6" cy="4" r="4" />
          <path d="M2 10 L -2 22 L 4 22 L 0 36 L 8 28 L 14 22 L 10 14 Z" />
        </g>
        {/* obstacles */}
        <rect x="60" y="50" width="6" height="14" fill={PH.violet} opacity="0.7" />
        <rect x="72" y="46" width="6" height="18" fill={PH.violet} opacity="0.5" />
        {/* speed lines */}
        <path d="M14 48 L 22 48 M 10 56 L 18 56" stroke={PH.violet} strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
      </svg>
    );
  }
  if (kind === 'climb') {
    return (
      <svg width={width} height={height} viewBox="0 0 88 88">
        <rect width="88" height="88" rx={r} fill="#FCE6DD" />
        {/* mountain */}
        <path d="M0 76 L 30 30 L 50 50 L 70 14 L 88 76 Z" fill={PH.coral} opacity="0.85" />
        <path d="M30 30 L 38 38 L 32 44 Z" fill="#FFFFFF" opacity="0.6" />
        <path d="M70 14 L 78 26 L 72 32 Z" fill="#FFFFFF" opacity="0.6" />
        {/* climber */}
        <g transform="translate(48 36)">
          <circle cx="0" cy="0" r="3" fill={PH.ink} />
          <path d="M-2 3 L -3 9 L 2 9 L 1 14 L 4 12 M 0 5 L 4 4" stroke={PH.ink} strokeWidth="1.6" strokeLinecap="round" fill="none" />
        </g>
        {/* flag at top */}
        <path d="M70 14 L 70 6 L 76 9 L 70 11" fill={PH.lime} stroke={PH.lime} strokeWidth="1" />
      </svg>
    );
  }
  return null;
}

Object.assign(window, { PH, EMGWave, Card, Pill, PrimaryBtn, GhostBtn, IconBtn, PhoneShell, PhoneTabBar, ArmIllustration, DeviceGlyph, GameCover });
