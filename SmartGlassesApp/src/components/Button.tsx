import React from 'react';
import { 
  TouchableOpacity, 
  Text, 
  StyleSheet, 
  ActivityIndicator,
  TouchableOpacityProps,
  View
} from 'react-native';
import theme from '@assets/styles/theme';

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning';
  size?: 'small' | 'medium' | 'large';
  isLoading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

export const Button: React.FC<ButtonProps> = ({
  title,
  variant = 'primary',
  size = 'medium',
  isLoading = false,
  icon,
  iconPosition = 'left',
  style,
  disabled,
  ...rest
}) => {
  const getBackgroundColor = () => {
    if (disabled) return theme.colors.neutral.light;
    
    switch (variant) {
      case 'primary': return theme.colors.primary.default;
      case 'secondary': return theme.colors.secondary.default;
      case 'success': return theme.colors.success.default;
      case 'danger': return theme.colors.danger.default;
      case 'warning': return theme.colors.warning.default;
      default: return theme.colors.primary.default;
    }
  };

  const getPadding = () => {
    switch (size) {
      case 'small': return { paddingVertical: theme.spacing.xs, paddingHorizontal: theme.spacing.sm };
      case 'medium': return { paddingVertical: theme.spacing.sm, paddingHorizontal: theme.spacing.md };
      case 'large': return { paddingVertical: theme.spacing.md, paddingHorizontal: theme.spacing.lg };
      default: return { paddingVertical: theme.spacing.sm, paddingHorizontal: theme.spacing.md };
    }
  };

  const getFontSize = () => {
    switch (size) {
      case 'small': return theme.typography.fontSizes.sm;
      case 'medium': return theme.typography.fontSizes.md;
      case 'large': return theme.typography.fontSizes.lg;
      default: return theme.typography.fontSizes.md;
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.button,
        { backgroundColor: getBackgroundColor() },
        getPadding(),
        style,
      ]}
      disabled={disabled || isLoading}
      {...rest}
    >
      {isLoading ? (
        <ActivityIndicator color={theme.colors.neutral.white} size="small" />
      ) : (
        <View style={styles.contentContainer}>
          {icon && iconPosition === 'left' && <View style={styles.iconLeft}>{icon}</View>}
          <Text 
            style={[
              styles.text, 
              { fontSize: getFontSize() },
              disabled && styles.disabledText,
            ]}
          >
            {title}
          </Text>
          {icon && iconPosition === 'right' && <View style={styles.iconRight}>{icon}</View>}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: theme.borders.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.sm,
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: theme.colors.neutral.white,
    textAlign: 'center',
  },
  disabledText: {
    color: theme.colors.neutral.dark,
  },
  iconLeft: {
    marginRight: theme.spacing.xs,
  },
  iconRight: {
    marginLeft: theme.spacing.xs,
  },
});

export default Button; 