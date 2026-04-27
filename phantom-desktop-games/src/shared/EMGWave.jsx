import React, { useMemo } from 'react';
import { PH } from '../theme';

function genPoints(w, h, intensity, density, seed) {
  const n = 200;
  const pts = [];
  for (let i = 0; i < n; i++) {
    const t = i / n;
    const base = Math.sin(t * Math.PI * 8 * density + seed) * 0.18
               + Math.sin(t * Math.PI * 22 * density + seed * 2) * 0.10;
    const cluster = Math.sin(t * Math.PI * 6) > 0.85 ? Math.sin(t * 220) * 0.55 : 0;
    const noise = ((Math.sin(seed + i * 17.13) + 1) / 2 - 0.5) * 0.12;
    const y = h / 2 + (base + cluster + noise) * intensity * (h / 2 - 4);
    pts.push(`${((i / (n - 1)) * w).toFixed(1)},${y.toFixed(1)}`);
  }
  return pts.join(' ');
}

export default function EMGWave({ width = 400, height = 60, color = PH.lime, intensity = 0.8, density = 1, glow = true, style = {} }) {
  const seed = useMemo(() => Math.floor(Math.random() * 1000), []);
  const pts = useMemo(() => genPoints(width, height, intensity, density, seed), [width, height, intensity, density]);
  const id = useMemo(() => 'glow-' + Math.random().toString(36).slice(2, 7), []);
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ display: 'block', ...style }}>
      {glow && <defs><filter id={id}><feGaussianBlur stdDeviation="1.2" /></filter></defs>}
      {glow && <polyline points={pts} fill="none" stroke={color} strokeWidth="2.6" opacity="0.25" filter={`url(#${id})`} />}
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}
