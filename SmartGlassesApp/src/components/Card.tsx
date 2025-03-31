import React from 'react';
import { View, Text, StyleSheet, ViewProps } from 'react-native';
import theme from '@assets/styles/theme';

interface CardProps extends ViewProps {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  variant?: 'default' | 'outlined' | 'elevated';
  footer?: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
  title,
  subtitle,
  children,
  variant = 'default',
  footer,
  style,
  ...rest
}) => {
  const getCardStyle = () => {
    switch (variant) {
      case 'outlined':
        return {
          ...styles.card,
          borderWidth: theme.borders.width.thin,
          borderColor: theme.colors.neutral.light,
          ...theme.shadows.none,
        };
      case 'elevated':
        return {
          ...styles.card,
          ...theme.shadows.md,
        };
      default:
        return styles.card;
    }
  };

  return (
    <View style={[getCardStyle(), style]} {...rest}>
      {(title || subtitle) && (
        <View style={styles.header}>
          {title && <Text style={styles.title}>{title}</Text>}
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>
      )}
      <View style={styles.content}>{children}</View>
      {footer && <View style={styles.footer}>{footer}</View>}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.neutral.white,
    borderRadius: theme.borders.radius.lg,
    padding: theme.spacing.md,
    marginVertical: theme.spacing.sm,
    ...theme.shadows.sm,
  },
  header: {
    marginBottom: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.neutral.lighter,
    paddingBottom: theme.spacing.sm,
  },
  title: {
    fontSize: theme.typography.fontSizes.lg,
    color: theme.colors.neutral.darkest,
  },
  subtitle: {
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.neutral.darker,
    marginTop: theme.spacing.xs,
  },
  content: {
    flex: 1,
  },
  footer: {
    marginTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.neutral.lighter,
    paddingTop: theme.spacing.sm,
  },
});

export default Card; 