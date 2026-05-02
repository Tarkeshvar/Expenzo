import React, { useRef } from 'react';
import {
  View, Text, TouchableOpacity, TextInput, StyleSheet,
  ViewStyle, TextStyle, Animated, ActivityIndicator,
  TouchableOpacityProps, TextInputProps,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../constants/theme';

// ─── Button ────────────────────────────────────────────────────────────────────
interface ButtonProps extends TouchableOpacityProps {
  label: string;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
  fullWidth?: boolean;
}

export function Button({
  label, variant = 'primary', size = 'md', loading, icon,
  fullWidth, style, disabled, ...props
}: ButtonProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const onPressIn = () => {
    Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: true, tension: 300, friction: 10 }).start();
  };
  const onPressOut = () => {
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 300, friction: 10 }).start();
  };

  const heights = { sm: 40, md: 52, lg: 60 };
  const fontSizes = { sm: Typography.fontSize.sm, md: Typography.fontSize.base, lg: Typography.fontSize.md };

  const variantStyles: Record<string, { bg: string; text: string; border?: string }> = {
    primary: { bg: Colors.primary, text: Colors.white },
    secondary: { bg: Colors.backgroundSecondary, text: Colors.textPrimary, border: Colors.border },
    ghost: { bg: Colors.transparent, text: Colors.primary },
    danger: { bg: Colors.expenseLight, text: Colors.expense },
  };

  const vs = variantStyles[variant];

  return (
    <Animated.View style={[{ transform: [{ scale: scaleAnim }] }, fullWidth && { width: '100%' }]}>
      <TouchableOpacity
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        disabled={disabled || loading}
        activeOpacity={0.9}
        style={[
          styles.button,
          {
            height: heights[size],
            backgroundColor: vs.bg,
            borderWidth: vs.border ? 1 : 0,
            borderColor: vs.border,
            opacity: disabled ? 0.5 : 1,
          },
          fullWidth && { width: '100%' },
          style as ViewStyle,
        ]}
        {...props}
      >
        {loading ? (
          <ActivityIndicator color={vs.text} size="small" />
        ) : (
          <>
            {icon && <View style={{ marginRight: 8 }}>{icon}</View>}
            <Text style={[styles.buttonText, { color: vs.text, fontSize: fontSizes[size] }]}>
              {label}
            </Text>
          </>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── Card ──────────────────────────────────────────────────────────────────────
interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
  elevated?: boolean;
  padding?: number;
}

export function Card({ children, style, onPress, elevated, padding = Spacing.base }: CardProps) {
  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.85}
        style={[styles.card, elevated && Shadows.md, { padding }, style]}
      >
        {children}
      </TouchableOpacity>
    );
  }
  return (
    <View style={[styles.card, elevated && Shadows.md, { padding }, style]}>
      {children}
    </View>
  );
}

// ─── Input ─────────────────────────────────────────────────────────────────────
interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  prefix?: string;
  suffix?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerStyle?: ViewStyle;
}

export function Input({
  label, error, prefix, suffix, leftIcon, rightIcon,
  containerStyle, style, ...props
}: InputProps) {
  return (
    <View style={[{ width: '100%' }, containerStyle]}>
      {label && <Text style={styles.inputLabel}>{label}</Text>}
      <View style={[styles.inputContainer, error && styles.inputError]}>
        {leftIcon && <View style={styles.inputIcon}>{leftIcon}</View>}
        {prefix && <Text style={styles.inputPrefix}>{prefix}</Text>}
        <TextInput
          style={[styles.input, style as TextStyle]}
          placeholderTextColor={Colors.textDisabled}
          {...props}
        />
        {suffix && <Text style={styles.inputSuffix}>{suffix}</Text>}
        {rightIcon && <View style={styles.inputIcon}>{rightIcon}</View>}
      </View>
      {error && <Text style={styles.inputErrorText}>{error}</Text>}
    </View>
  );
}

// ─── Chip ──────────────────────────────────────────────────────────────────────
interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  color?: string;
  icon?: React.ReactNode;
}

export function Chip({ label, selected, onPress, color = Colors.primary, icon }: ChipProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={[
        styles.chip,
        selected && { backgroundColor: color + '20', borderColor: color },
      ]}
    >
      {icon && <View style={{ marginRight: 4 }}>{icon}</View>}
      <Text style={[styles.chipText, selected && { color }]}>{label}</Text>
    </TouchableOpacity>
  );
}

// ─── Divider ───────────────────────────────────────────────────────────────────
export function Divider({ style }: { style?: ViewStyle }) {
  return <View style={[styles.divider, style]} />;
}

// ─── Badge ─────────────────────────────────────────────────────────────────────
export function Badge({ count, color = Colors.primary }: { count: number; color?: string }) {
  if (count <= 0) return null;
  return (
    <View style={[styles.badge, { backgroundColor: color }]}>
      <Text style={styles.badgeText}>{count > 99 ? '99+' : count}</Text>
    </View>
  );
}

// ─── Amount Display ────────────────────────────────────────────────────────────
export function AmountText({
  amount, type, style, size = 'md',
}: {
  amount: string; type?: 'income' | 'expense'; style?: TextStyle; size?: 'sm' | 'md' | 'lg';
}) {
  const sizes = { sm: Typography.fontSize.sm, md: Typography.fontSize.md, lg: Typography.fontSize['2xl'] };
  const color = type === 'income' ? Colors.income : type === 'expense' ? Colors.expense : Colors.textPrimary;
  const prefix = type === 'income' ? '+' : type === 'expense' ? '−' : '';
  return (
    <Text style={[{ color, fontSize: sizes[size], fontFamily: Typography.fontFamily.semiBold }, style]}>
      {prefix}{amount}
    </Text>
  );
}

// ─── Section Header ────────────────────────────────────────────────────────────
export function SectionHeader({ title, action, onAction }: {
  title: string; action?: string; onAction?: () => void;
}) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {action && (
        <TouchableOpacity onPress={onAction}>
          <Text style={styles.sectionAction}>{action}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── Empty State ───────────────────────────────────────────────────────────────
export function EmptyState({ icon, title, message, action, onAction }: {
  icon: React.ReactNode; title: string; message?: string; action?: string; onAction?: () => void;
}) {
  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}>{icon}</View>
      <Text style={styles.emptyTitle}>{title}</Text>
      {message && <Text style={styles.emptyMessage}>{message}</Text>}
      {action && onAction && (
        <Button label={action} onPress={onAction} variant="primary" size="md" style={{ marginTop: 16 }} />
      )}
    </View>
  );
}

// ─── Progress Bar ──────────────────────────────────────────────────────────────
export function ProgressBar({ percentage, color = Colors.primary, height = 6, style }: {
  percentage: number; color?: string; height?: number; style?: ViewStyle;
}) {
  const clamped = Math.min(100, Math.max(0, percentage));
  const barColor = percentage >= 90 ? Colors.expense : percentage >= 70 ? Colors.warning : color;
  return (
    <View style={[styles.progressTrack, { height }, style]}>
      <View style={[styles.progressFill, { width: `${clamped}%`, backgroundColor: barColor, height }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.xl,
  },
  buttonText: {
    fontFamily: Typography.fontFamily.semiBold,
    letterSpacing: 0.1,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  inputLabel: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.textSecondary,
    marginBottom: 6,
    letterSpacing: 0.2,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    minHeight: 52,
  },
  inputError: {
    borderColor: Colors.error,
    backgroundColor: Colors.errorLight,
  },
  input: {
    flex: 1,
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textPrimary,
    paddingVertical: 12,
  },
  inputIcon: { marginHorizontal: 4 },
  inputPrefix: {
    fontSize: Typography.fontSize.base,
    color: Colors.textSecondary,
    marginRight: 4,
    fontFamily: Typography.fontFamily.medium,
  },
  inputSuffix: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginLeft: 4,
    fontFamily: Typography.fontFamily.regular,
  },
  inputErrorText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.error,
    marginTop: 4,
    fontFamily: Typography.fontFamily.regular,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: 8,
    marginBottom: 8,
  },
  chipText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.textSecondary,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.divider,
    marginVertical: Spacing.sm,
  },
  badge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    fontSize: 10,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.white,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.textPrimary,
    letterSpacing: -0.2,
  },
  sectionAction: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.primary,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing['4xl'],
    paddingHorizontal: Spacing['2xl'],
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyMessage: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textTertiary,
    textAlign: 'center',
    lineHeight: 20,
  },
  progressTrack: {
    backgroundColor: Colors.backgroundTertiary,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  progressFill: {
    borderRadius: BorderRadius.full,
  },
});
