import React, { ReactNode, useEffect, useRef } from 'react';
import { StyleSheet, ViewStyle, Animated } from 'react-native';
import Colors from '../constants/Colors';
import { useResponsive } from '../constants/Layout';

interface CardProps {
  children: ReactNode;
  style?: ViewStyle | ViewStyle[];
  animate?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, style, animate = false }) => {
  const { isSmallDevice } = useResponsive();
  const fadeAnim = useRef(new Animated.Value(animate ? 0 : 1)).current;
  const translateYAnim = useRef(new Animated.Value(animate ? 8 : 0)).current;

  useEffect(() => {
    if (animate) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(translateYAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [animate]);

  return (
    <Animated.View
      style={[
        styles.card,
        isSmallDevice && styles.cardSmall,
        style,
        animate && { opacity: fadeAnim, transform: [{ translateY: translateYAnim }] },
      ]}
    >
      {children}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.cardBg,
    borderRadius: 16,
    padding: 16,
    marginVertical: 6,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardSmall: {
    padding: 12,
    borderRadius: 14,
    marginVertical: 5,
  },
});

export default Card;
