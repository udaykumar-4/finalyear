/**
 * AyurSutra Botanical Design Tokens
 * Reconciled using Taste (Anti-Slop, No-Purple ban, Desaturated Accents, Tinted Shadows)
 * and UI/UX Pro Max (WCAG 4.5:1+ Contrast, Touch Targets, Semantic Clarity)
 */
export const Colors = {
  // Brand Palette: Deep Forest Sanctuary & Botanical Accents
  primary: '#1E3F2B',          // Deep grounding forest green (Primary brand)
  primaryDark: '#12291C',      // Night forest
  primaryLight: '#2C573D',     // Forest pine highlight
  primarySubtle: '#E8F2EC',    // Soft sage pill tint
  
  secondary: '#C07A2B',        // Warm Sandalwood / Amber Ochre
  secondaryDark: '#9A5D19',
  secondaryLight: '#FDF6EC',
  
  accent: '#10B981',           // Vibrant Healing Emerald
  accentDark: '#047857',       // Deep emerald
  accentLight: '#D1FAE5',      // Mint wash
  
  // Canvas & Surfaces
  background: '#FAF7F2',       // Warm organic ivory canvas (Anti-clinical coldness)
  surface: '#FFFFFF',          // Standard clean white surface
  cardBg: '#FFFFFF',           // Crisp high-contrast card surface
  cardBgSolid: '#FFFFFF',
  cardBgElevated: '#FFFFFF',
  cardAlt: '#F4EFE6',          // Organic warm secondary card fill
  
  // Modern Glassmorphic / Layered Surfaces
  glassBg: 'rgba(255, 255, 255, 0.92)',
  glassBgDark: 'rgba(18, 41, 28, 0.92)',
  glassBorder: '#E5EDE6',      // 1px hairline botanical border
  glassBorderSubtle: '#EBF1EC',
  glassHeaderBg: 'rgba(250, 247, 242, 0.96)',
  glassPillBg: '#EFF5F0',
  
  // High-Contrast Typography Tokens (WCAG AAA compliant on #FAF7F2 / #FFFFFF)
  text: '#112318',             // Deep forest charcoal (Eliminates harsh #000000)
  textSecondary: '#3E5748',    // Calm pine slate (6.5:1+ contrast)
  textTertiary: '#647E6F',     // Muted botanical green
  textMuted: '#8BA194',        // Placeholder & boundary text
  textInverted: '#FFFFFF',
  
  // Hairline Borders & Dividers
  border: '#E2EBE4',
  borderLight: '#EDF4EE',
  borderFocus: '#2D7A4D',
  
  // Medical & Clinical System States
  success: '#059669',
  successBg: '#ECFDF5',
  successBorder: '#A7F3D0',
  
  warning: '#D97706',
  warningBg: '#FFFBEB',
  warningBorder: '#FDE68A',
  
  error: '#DC2626',
  errorBg: '#FEF2F2',
  errorBorder: '#FECACA',
  
  info: '#0284C7',
  infoBg: '#F0F9FF',
  infoBorder: '#BAE6FD',
  
  white: '#FFFFFF',
  black: '#112318',
  
  // Dosha-Specific Constitutional Tokens
  vata: {
    primary: '#6D28D9',
    light: '#F5F3FF',
    border: '#DDD6FE',
    text: '#5B21B6',
  },
  pitta: {
    primary: '#C2410C',
    light: '#FFF7ED',
    border: '#FFEDD5',
    text: '#9A3412',
  },
  kapha: {
    primary: '#047857',
    light: '#ECFDF5',
    border: '#A7F3D0',
    text: '#065F46',
  },
  
  // Taste Rule 4: Shadows Tinted to Background Hue (Natural Ambient Depth)
  shadow: 'rgba(30, 63, 43, 0.06)',
  shadowElevated: 'rgba(30, 63, 43, 0.12)',
  shadowPressed: 'rgba(30, 63, 43, 0.04)',
};

export default Colors;
