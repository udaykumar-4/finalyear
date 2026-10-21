import { StyleSheet, TextStyle } from 'react-native';
import { responsiveFontSize } from './Layout';
import Colors from './Colors';

/**
 * AyurSutra Typographic System
 * Designed with Taste (High contrast weights, controlled hierarchy, sans-serif clarity)
 * and UI/UX Pro Max (Readability, line-height 1.4-1.6, accessible font sizing)
 */
export const Typography = {
  // Display & Hero Titles
  display: {
    fontSize: responsiveFontSize(28),
    fontWeight: '800' as const,
    lineHeight: responsiveFontSize(34),
    letterSpacing: -0.6,
    color: Colors.text,
  },
  
  // Section & Screen Titles
  h1: {
    fontSize: responsiveFontSize(22),
    fontWeight: '800' as const,
    lineHeight: responsiveFontSize(28),
    letterSpacing: -0.4,
    color: Colors.text,
  },

  // Card & Module Titles
  h2: {
    fontSize: responsiveFontSize(18),
    fontWeight: '700' as const,
    lineHeight: responsiveFontSize(24),
    letterSpacing: -0.2,
    color: Colors.text,
  },

  // Subsections & List Titles
  h3: {
    fontSize: responsiveFontSize(15),
    fontWeight: '700' as const,
    lineHeight: responsiveFontSize(20),
    letterSpacing: -0.1,
    color: Colors.text,
  },

  // Primary Body Text
  body: {
    fontSize: responsiveFontSize(14),
    fontWeight: '400' as const,
    lineHeight: responsiveFontSize(20),
    color: Colors.text,
  },

  // Medium / Emphasized Body Text
  bodyMedium: {
    fontSize: responsiveFontSize(14),
    fontWeight: '600' as const,
    lineHeight: responsiveFontSize(20),
    color: Colors.text,
  },

  // Small Supporting / Detail Text
  bodySmall: {
    fontSize: responsiveFontSize(13),
    fontWeight: '400' as const,
    lineHeight: responsiveFontSize(18),
    color: Colors.text,
  },

  // Small Supporting / Secondary Text
  caption: {
    fontSize: responsiveFontSize(12),
    fontWeight: '500' as const,
    lineHeight: responsiveFontSize(16),
    color: Colors.textSecondary,
  },

  // Micro Labels, Tags, Categories (Uppercase & tracked)
  overline: {
    fontSize: responsiveFontSize(10),
    fontWeight: '800' as const,
    lineHeight: responsiveFontSize(14),
    letterSpacing: 0.8,
    textTransform: 'uppercase' as const,
    color: Colors.primary,
  },

  // Numeric Values & Metrics (Monospace numeric alignment)
  metric: {
    fontSize: responsiveFontSize(24),
    fontWeight: '800' as const,
    lineHeight: responsiveFontSize(30),
    letterSpacing: -0.5,
    fontVariant: ['tabular-nums' as const],
    color: Colors.text,
  },

  // Button Labels
  button: {
    fontSize: responsiveFontSize(14),
    fontWeight: '700' as const,
    lineHeight: responsiveFontSize(18),
    letterSpacing: 0.2,
  },
};

export default Typography;
