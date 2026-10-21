import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import Colors from '../constants/Colors';

interface ProgressBarProps {
  progress: number; // 0 to 1 or percentage (0 to 100)
  label?: string;
  showPercentage?: boolean;
  color?: string;
  height?: number;
  style?: ViewStyle;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  label,
  showPercentage = true,
  color = Colors.accentDark,
  height = 8,
  style,
}) => {
  // Normalize progress to 0 - 100
  const percentage = Math.min(100, Math.max(0, progress <= 1 ? progress * 100 : progress));

  return (
    <View style={[styles.container, style]}>
      {(label || showPercentage) && (
        <View style={styles.header}>
          {label ? <Text style={styles.label}>{label}</Text> : <View />}
          {showPercentage && <Text style={styles.percentage}>{Math.round(percentage)}%</Text>}
        </View>
      )}
      <View style={[styles.track, { height }]}>
        <View
          style={[
            styles.fill,
            {
              width: `${percentage}%`,
              backgroundColor: color,
              height,
            },
          ]}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginVertical: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  label: {
    fontSize: 12.5,
    fontWeight: '600',
    color: Colors.textSecondary,
    letterSpacing: -0.1,
  },
  percentage: {
    fontSize: 12.5,
    fontWeight: '800',
    color: Colors.primary,
    fontVariant: ['tabular-nums'],
  },
  track: {
    backgroundColor: '#E8EFEA',
    borderRadius: 6,
    overflow: 'hidden',
    width: '100%',
  },
  fill: {
    borderRadius: 6,
  },
});

export default ProgressBar;
