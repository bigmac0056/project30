import React, { useMemo, useEffect, useRef } from 'react';
import { Animated } from 'react-native';
import Svg, { Polyline, Defs, Filter, FeGaussianBlur } from 'react-native-svg';
import { PH } from '../constants/theme';

function generatePoints(width, height, intensity, density, seed) {
  const n = 120;
  const pts = [];
  for (let i = 0; i < n; i++) {
    const t = i / n;
    const base =
      Math.sin(t * Math.PI * 8 * density + seed) * 0.18 +
      Math.sin(t * Math.PI * 22 * density + seed * 2) * 0.10;
    const cluster = Math.sin(t * Math.PI * 6) > 0.85 ? Math.sin(t * 220) * 0.55 : 0;
    const noise = ((Math.sin(seed + i * 17.13) + 1) / 2 - 0.5) * 0.12;
    const y = height / 2 + (base + cluster + noise) * intensity * (height / 2 - 4);
    pts.push(`${((i / (n - 1)) * width).toFixed(1)},${y.toFixed(1)}`);
  }
  return pts.join(' ');
}

export default function EMGWave({
  width = 300,
  height = 60,
  color = PH.lime,
  intensity = 0.8,
  density = 1,
  glow = true,
  animated: isAnimated = false,
}) {
  const seed = useMemo(() => Math.floor(Math.random() * 1000), []);
  const animValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!isAnimated) return;
    const loop = Animated.loop(
      Animated.timing(animValue, { toValue: 1, duration: 2000, useNativeDriver: false })
    );
    loop.start();
    return () => loop.stop();
  }, [isAnimated]);

  const points = useMemo(
    () => generatePoints(width, height, intensity, density, seed),
    [width, height, intensity, density, seed]
  );

  return (
    <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      {glow && (
        <Defs>
          <Filter id="glow">
            <FeGaussianBlur stdDeviation="1.2" />
          </Filter>
        </Defs>
      )}
      {glow && (
        <Polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth="2.6"
          opacity="0.25"
          filter="url(#glow)"
        />
      )}
      <Polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.6"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </Svg>
  );
}
