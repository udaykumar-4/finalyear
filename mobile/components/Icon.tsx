import React from 'react';
import { View, Text, StyleSheet, ViewStyle, ColorValue } from 'react-native';
import Colors from '../constants/Colors';

export type IconName =
  | 'home'
  | 'calendar'
  | 'treatment'
  | 'leaf'
  | 'lotus'
  | 'report'
  | 'chart'
  | 'user'
  | 'users'
  | 'doctor'
  | 'therapist'
  | 'receptionist'
  | 'admin'
  | 'pill'
  | 'heart'
  | 'star'
  | 'clock'
  | 'check'
  | 'close'
  | 'arrow-right'
  | 'arrow-left'
  | 'chevron-right'
  | 'chevron-left'
  | 'sparkle'
  | 'card'
  | 'gear'
  | 'search'
  | 'alert'
  | 'shield'
  | 'mail'
  | 'phone'
  | 'stethoscope'
  | 'plus'
  | 'document'
  | 'filter';

interface IconProps {
  name: IconName;
  size?: number;
  color?: ColorValue | string;
  style?: ViewStyle;
}

/**
 * Clean Geometric Medical-Grade Glyph System
 * Adheres to Taste & UI/UX Pro Max Anti-Emoji & Professional Vector Standards
 */
export const Icon: React.FC<IconProps> = ({
  name,
  size = 20,
  color = Colors.primary,
  style,
}) => {
  const getGlyph = (): string => {
    switch (name) {
      case 'home':
        return '⌂';
      case 'calendar':
        return '◫';
      case 'treatment':
      case 'leaf':
      case 'lotus':
        return '🪷';
      case 'report':
      case 'chart':
        return '◰';
      case 'user':
        return '⚲';
      case 'users':
        return '⚲⚲';
      case 'doctor':
        return '✚';
      case 'therapist':
        return '☯';
      case 'receptionist':
        return '◪';
      case 'admin':
        return '◈';
      case 'pill':
        return '⬭';
      case 'heart':
        return '♥';
      case 'star':
        return '★';
      case 'clock':
        return '⏱';
      case 'check':
        return '✓';
      case 'close':
        return '✕';
      case 'arrow-right':
      case 'chevron-right':
        return '→';
      case 'arrow-left':
      case 'chevron-left':
        return '←';
      case 'sparkle':
        return '✦';
      case 'card':
        return '💳';
      case 'mail':
        return '✉';
      case 'phone':
        return '☎';
      case 'stethoscope':
        return '⚕';
      case 'plus':
        return '+';
      case 'document':
        return '🗎';
      case 'filter':
        return '▽';
      case 'gear':
        return '⚙';
      case 'search':
        return '⌕';
      case 'alert':
        return '⚠';
      case 'shield':
        return '🛡';
      default:
        return '•';
    }
  };

  return (
    <View style={[styles.container, { width: size, height: size }, style]}>
      <Text
        style={[
          styles.glyph,
          {
            fontSize: size * 0.85,
            color: color as any,
            lineHeight: size,
          },
        ]}
      >
        {getGlyph()}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  glyph: {
    textAlign: 'center',
    fontWeight: '700',
  },
});

export default Icon;
