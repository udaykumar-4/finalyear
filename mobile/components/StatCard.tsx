import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Colors from '../constants/Colors';
import Typography from '../constants/Typography';
import { useResponsive } from '../constants/Layout';
import Icon, { IconName } from './Icon';

const KNOWN_ICONS = new Set([
  'home', 'calendar', 'treatment', 'leaf', 'lotus', 'report', 'chart',
  'user', 'users', 'doctor', 'therapist', 'receptionist', 'admin',
  'pill', 'heart', 'star', 'clock', 'check', 'close', 'arrow-right',
  'arrow-left', 'chevron-right', 'chevron-left', 'sparkle', 'card',
  'gear', 'search', 'alert', 'shield', 'mail', 'phone', 'stethoscope',
  'plus', 'document', 'filter'
]);

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: IconName | string;
  color?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  color = Colors.primary,
}) => {
  const { isSmallDevice } = useResponsive();

  const renderIcon = () => {
    if (!icon) return null;
    if (KNOWN_ICONS.has(icon)) {
      return <Icon name={icon as IconName} size={isSmallDevice ? 16 : 19} color={color} />;
    }
    return (
      <Text style={[styles.icon, isSmallDevice && styles.iconSmall]}>
        {icon}
      </Text>
    );
  };

  return (
    <View
      style={[
        styles.card,
        { borderLeftColor: color },
        isSmallDevice && styles.cardSmall,
      ]}
    >
      <View style={styles.content}>
        {icon && (
          <View style={[styles.iconBadge, { backgroundColor: color + '15' }]}>
            {renderIcon()}
          </View>
        )}
        <View style={styles.textContainer}>
          <Text
            style={[styles.value, isSmallDevice && styles.valueSmall]}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {value}
          </Text>
          <Text
            style={[styles.title, isSmallDevice && styles.titleSmall]}
            numberOfLines={2}
          >
            {title}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginVertical: 5,
    flex: 1,
    minWidth: '46%',
    borderLeftWidth: 3.5,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  cardSmall: {
    padding: 11,
    minWidth: '47%',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  icon: {
    fontSize: 18,
  },
  iconSmall: {
    fontSize: 15,
  },
  textContainer: {
    flex: 1,
  },
  value: {
    ...Typography.metric,
    fontSize: 20,
    lineHeight: 24,
    color: Colors.text,
  },
  valueSmall: {
    fontSize: 17,
    lineHeight: 21,
  },
  title: {
    fontSize: 11.5,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginTop: 2,
    lineHeight: 15,
  },
  titleSmall: {
    fontSize: 10.5,
    lineHeight: 13,
  },
});

export default StatCard;
