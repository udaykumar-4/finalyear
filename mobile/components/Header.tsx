import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Colors from '../constants/Colors';
import { useAuth } from '../context/AuthContext';
import { useResponsive } from '../constants/Layout';

interface HeaderProps {
  title: string;
  subtitle?: string;
  showLogout?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  showLogout = true,
}) => {
  const { user, logout } = useAuth();
  const { headerPaddingTop, isSmallDevice, horizontalPadding } = useResponsive();

  const getRoleBadgeColor = (role?: string) => {
    switch (role) {
      case 'admin':
        return Colors.secondary;
      case 'doctor':
        return Colors.primary;
      case 'therapist':
        return Colors.accentDark;
      case 'receptionist':
        return Colors.secondaryDark;
      case 'patient':
      default:
        return Colors.primary;
    }
  };

  const avatarSize = isSmallDevice ? 38 : 42;

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: headerPaddingTop,
          paddingHorizontal: horizontalPadding,
        },
      ]}
    >
      <View style={styles.userInfo}>
        <View
          style={[
            styles.avatar,
            {
              width: avatarSize,
              height: avatarSize,
              borderRadius: avatarSize / 2,
              backgroundColor: getRoleBadgeColor(user?.role),
            },
          ]}
        >
          <Text style={[styles.avatarText, isSmallDevice && { fontSize: 15 }]}>
            {user?.full_name ? user.full_name.charAt(0).toUpperCase() : 'U'}
          </Text>
        </View>
        <View style={styles.textContainer}>
          <Text
            style={[styles.title, isSmallDevice && { fontSize: 16 }]}
            numberOfLines={1}
          >
            {title || user?.full_name}
          </Text>
          {subtitle ? (
            <Text style={styles.subtitle} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : user?.role ? (
            <View style={styles.rolePill}>
              <Text style={styles.roleText}>{user.role.toUpperCase()}</Text>
            </View>
          ) : null}
        </View>
      </View>

      {showLogout && (
        <TouchableOpacity
          style={[
            styles.logoutBtn,
            isSmallDevice && { paddingHorizontal: 10, paddingVertical: 6 },
          ]}
          onPress={logout}
          activeOpacity={0.75}
          accessibilityLabel="Log out of AyurSutra"
        >
          <Text style={[styles.logoutText, isSmallDevice && { fontSize: 11 }]}>Sign Out</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 14,
    backgroundColor: Colors.glassHeaderBg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    shadowColor: Colors.shadowElevated,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  textContainer: {
    flex: 1,
    marginRight: 8,
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.text,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.textSecondary,
    marginTop: 1,
  },
  rolePill: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.primarySubtle,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 3,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  roleText: {
    fontSize: 9,
    fontWeight: '800',
    color: Colors.primaryDark,
    letterSpacing: 0.6,
  },
  logoutBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: Colors.errorBg,
    borderWidth: 1,
    borderColor: Colors.errorBorder,
    minHeight: 34,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutText: {
    color: Colors.error,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.1,
  },
});

export default Header;
