import React from 'react';
import Svg, { Rect, Circle, Path, G, Ellipse } from 'react-native-svg';
import { PH } from '../constants/theme';

export default function GameCover({ kind, width = 88, height = 88 }) {
  const r = 12;

  if (kind === 'sparrow') {
    return (
      <Svg width={width} height={height} viewBox="0 0 88 88">
        <Rect width="88" height="88" rx={r} fill={PH.limeSoft} />
        <Circle cx="20" cy="20" r="8" fill="#F2D75C" opacity="0.7" />
        <Path d="M0 70 Q 22 60, 44 64 Q 66 68, 88 60 L 88 88 L 0 88 Z" fill={PH.limeBright} opacity="0.4" />
        <G transform="translate(34, 36)">
          <Circle r="14" fill={PH.lime} />
          <Path d="M-7 -2 Q 0 -8, 8 -3 L 11 -6 L 10 0 Q 6 4, 0 4 Q -5 4, -7 -2 Z" fill="#FFFFFF" />
        </G>
        <Path d="M16 50 L 28 50" stroke={PH.lime} strokeWidth="2" strokeLinecap="round" opacity="0.5" />
      </Svg>
    );
  }

  if (kind === 'pulse') {
    return (
      <Svg width={width} height={height} viewBox="0 0 88 88">
        <Rect width="88" height="88" rx={r} fill={PH.violetSoft} />
        <Path d="M0 64 L 88 64" stroke={PH.violet} strokeWidth="1.5" opacity="0.4" />
        <G transform="translate(34, 28)" fill={PH.violet}>
          <Circle cx="6" cy="4" r="4" />
          <Path d="M2 10 L -2 22 L 4 22 L 0 36 L 8 28 L 14 22 L 10 14 Z" />
        </G>
        <Rect x="60" y="50" width="6" height="14" fill={PH.violet} opacity="0.7" />
        <Rect x="72" y="46" width="6" height="18" fill={PH.violet} opacity="0.5" />
        <Path d="M14 48 L 22 48 M 10 56 L 18 56" stroke={PH.violet} strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
      </Svg>
    );
  }

  if (kind === 'climb') {
    return (
      <Svg width={width} height={height} viewBox="0 0 88 88">
        <Rect width="88" height="88" rx={r} fill="#FCE6DD" />
        <Path d="M0 76 L 30 30 L 50 50 L 70 14 L 88 76 Z" fill={PH.coral} opacity="0.85" />
        <Path d="M30 30 L 38 38 L 32 44 Z" fill="#FFFFFF" opacity="0.6" />
        <Path d="M70 14 L 78 26 L 72 32 Z" fill="#FFFFFF" opacity="0.6" />
        <G transform="translate(48, 36)">
          <Circle cx="0" cy="0" r="3" fill={PH.ink} />
          <Path d="M-2 3 L -3 9 L 2 9 L 1 14 L 4 12 M 0 5 L 4 4" stroke={PH.ink} strokeWidth="1.6" strokeLinecap="round" fill="none" />
        </G>
        <Path d="M70 14 L 70 6 L 76 9 L 70 11" fill={PH.lime} stroke={PH.lime} strokeWidth="1" />
      </Svg>
    );
  }

  return null;
}
