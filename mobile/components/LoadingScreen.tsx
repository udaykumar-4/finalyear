import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import Colors from '../constants/Colors';
import Typography from '../constants/Typography';

interface LoadingScreenProps {
  message?: string;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ message = 'Synchronizing AyurSutra...' }) => {
  return (
    <View style={styles.container}>
      <View style={styles.brandBadge}>
        <Text style={styles.brandEmblem}>🪷</Text>
      </View>
      <ActivityIndicator size="small" color={Colors.primary} style={styles.spinner} />
      <Text style={styles.text}>{message}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
    padding: 24,
  },
  brandBadge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  brandEmblem: {
    fontSize: 28,
  },
  spinner: {
    marginBottom: 10,
  },
  text: {
    ...Typography.caption,
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
});

export default LoadingScreen;
