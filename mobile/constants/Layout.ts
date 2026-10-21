import { Dimensions, PixelRatio, Platform } from 'react-native';
import { useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Standard design baseline (iPhone 13 / 14 / standard mobile view)
const BASE_WIDTH = 375;
const BASE_HEIGHT = 812;

/**
 * Responsive horizontal scaling based on screen width
 */
export const scale = (size: number): number => {
  return (SCREEN_WIDTH / BASE_WIDTH) * size;
};

/**
 * Responsive vertical scaling based on screen height
 */
export const verticalScale = (size: number): number => {
  return (SCREEN_HEIGHT / BASE_HEIGHT) * size;
};

/**
 * Moderate scaling with a dampening factor (0.5 default)
 * Prevents typography and elements from becoming too large or small
 */
export const moderateScale = (size: number, factor = 0.5): number => {
  return size + (scale(size) - size) * factor;
};

/**
 * Responsive font scale with strict bounds to prevent overflow on small screens
 */
export const responsiveFontSize = (size: number): number => {
  const scaled = moderateScale(size, 0.4);
  const fontScale = PixelRatio.getFontScale();
  // Ensure accessibility font scaling doesn't break critical UI boundaries
  return Math.round(scaled / (fontScale > 1.3 ? 1.15 : 1));
};

export const Layout = {
  window: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  isSmallDevice: SCREEN_WIDTH < 360,
  isNormalDevice: SCREEN_WIDTH >= 360 && SCREEN_WIDTH < 414,
  isLargePhone: SCREEN_WIDTH >= 414 && SCREEN_WIDTH < 600,
  isTablet: SCREEN_WIDTH >= 600,
  maxContentWidth: 540,
  scale,
  verticalScale,
  moderateScale,
  responsiveFontSize,
};

/**
 * Hook for dynamic responsive calculations reacting to orientation/window dimension changes
 */
export const useResponsive = () => {
  const { width, height, fontScale } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const isSmallDevice = width < 360;
  const isNormalDevice = width >= 360 && width < 414;
  const isLargePhone = width >= 414 && width < 600;
  const isTablet = width >= 600;

  // Safe area calculated paddings
  const headerPaddingTop = Math.max(insets.top, 16) + (isSmallDevice ? 4 : 8);
  const tabBarPaddingBottom = Math.max(insets.bottom, 8);
  const tabBarHeight = 56 + tabBarPaddingBottom;
  const bottomContentPadding = Math.max(insets.bottom, 16) + 20;
  const horizontalPadding = isSmallDevice ? 12 : isTablet ? 24 : 16;
  const containerMaxWidth = isTablet ? 540 : undefined;

  return {
    width,
    height,
    fontScale,
    insets,
    isSmallDevice,
    isNormalDevice,
    isLargePhone,
    isTablet,
    headerPaddingTop,
    tabBarHeight,
    tabBarPaddingBottom,
    bottomContentPadding,
    horizontalPadding,
    containerMaxWidth,
    // Dynamic scaling based on live width
    scale: (size: number) => (width / BASE_WIDTH) * size,
    verticalScale: (size: number) => (height / BASE_HEIGHT) * size,
    moderateScale: (size: number, factor = 0.5) => size + ((width / BASE_WIDTH) * size - size) * factor,
    responsiveFontSize: (size: number) => {
      const scaled = size + ((width / BASE_WIDTH) * size - size) * 0.4;
      return Math.round(scaled / (fontScale > 1.3 ? 1.15 : 1));
    },
  };
};

export default Layout;
