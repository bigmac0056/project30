import React from 'react';
import Svg, {
  Ellipse, Path, G, Circle, Animate, Rect,
} from 'react-native-svg';
import { PH } from '../constants/theme';

export default function ArmIllustration({ width = 280, active = true }) {
  const height = width * 0.62;
  const accent = active ? PH.lime : PH.inkFaint;
  const scale = width / 280;

  return (
    <Svg width={width} height={height} viewBox="0 0 280 174" fill="none">
      <Ellipse cx="140" cy="158" rx="100" ry="6" fill="rgba(20,20,30,0.06)" />
      <Path
        d="M30 90 Q 30 60, 60 56 L 175 56 Q 220 56, 230 90 L 220 105 Q 215 120, 175 120 L 60 120 Q 30 120, 30 90 Z"
        fill="#F5DCC4"
        stroke="#C9A380"
        strokeWidth="1.5"
      />
      <Path
        d="M230 90 Q 245 92, 245 100 Q 240 115, 220 105"
        fill="#EFCDB0"
        stroke="#C9A380"
        strokeWidth="1.5"
      />
      <Path d="M40 78 Q 80 70, 160 72 Q 200 74, 220 80" stroke="#D8AE8A" strokeWidth="1" opacity="0.5" />

      {/* Electrode 1 */}
      <G transform="translate(85, 82)">
        <Circle r="22" fill="#FAFAFA" stroke="#C9C2B5" strokeWidth="1" />
        <Circle r="14" fill="#FFFFFF" stroke="#E0DAC8" strokeWidth="0.5" />
        <Circle r="5" fill={accent} opacity="0.25" />
        <Circle r="2.5" fill={accent} />
        {active && (
          <Circle r="22" fill="none" stroke={accent} strokeWidth="1.5" opacity="0.4">
            <Animate attributeName="r" values="22;30;22" dur="2s" repeatCount="indefinite" />
            <Animate attributeName="opacity" values="0.4;0;0.4" dur="2s" repeatCount="indefinite" />
          </Circle>
        )}
      </G>

      {/* Electrode 2 */}
      <G transform="translate(140, 95)">
        <Circle r="22" fill="#FAFAFA" stroke="#C9C2B5" strokeWidth="1" />
        <Circle r="14" fill="#FFFFFF" stroke="#E0DAC8" strokeWidth="0.5" />
        <Circle r="5" fill={accent} opacity="0.25" />
        <Circle r="2.5" fill={accent} />
      </G>

      {/* Wires */}
      <Path d="M85 60 Q 90 30, 120 20" stroke="#888" strokeWidth="1.5" fill="none" />
      <Path d="M140 73 Q 145 40, 130 22" stroke="#D04A30" strokeWidth="1.5" fill="none" />

      {/* Sensor board */}
      <G transform="translate(95, 0)">
        <Rect width="60" height="28" rx="4" fill="#C0392B" stroke="#8B2A1F" strokeWidth="1" />
        <Rect x="6" y="6" width="20" height="14" rx="1" fill="#1A1A1F" />
        <Circle cx="48" cy="10" r="2" fill={accent}>
          {active && <Animate attributeName="opacity" values="1;0.3;1" dur="1.4s" repeatCount="indefinite" />}
        </Circle>
        <Circle cx="48" cy="18" r="2" fill="#5B4DD9" opacity="0.7" />
      </G>
    </Svg>
  );
}
