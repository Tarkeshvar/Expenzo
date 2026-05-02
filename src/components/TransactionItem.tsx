import React, { useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Animated,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Transaction } from '../constants/types';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../constants/theme';
import { formatCurrency, formatDate } from '../utils/formatters';
import { CATEGORY_LIST } from '../constants/theme';
import { useApp } from '../context/AppContext';

interface TransactionItemProps {
  transaction: Transaction;
  onPress?: () => void;
  onDelete?: () => void;
  showDate?: boolean;
}

export function TransactionItem({ transaction, onPress, onDelete, showDate = false }: TransactionItemProps) {
  const { state } = useApp();
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const category = CATEGORY_LIST.find(c => c.id === transaction.category);
  const catColor = category?.color || Colors.textTertiary;
  const catIcon = (category?.icon || 'receipt') as any;

  const onPressIn = () => {
    Animated.spring(scaleAnim, { toValue: 0.98, useNativeDriver: true, tension: 300, friction: 10 }).start();
  };
  const onPressOut = () => {
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 300, friction: 10 }).start();
  };

  const amountColor = transaction.type === 'income' ? Colors.income : Colors.expense;
  const amountPrefix = transaction.type === 'income' ? '+' : '−';

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        activeOpacity={0.9}
        style={styles.container}
      >
        {/* Category Icon */}
        <View style={[styles.iconContainer, { backgroundColor: catColor + '18' }]}>
          <MaterialIcons name={catIcon} size={22} color={catColor} />
        </View>

        {/* Details */}
        <View style={styles.details}>
          <Text style={styles.title} numberOfLines={1}>{transaction.title}</Text>
          <View style={styles.meta}>
            <Text style={styles.category}>{category?.label || transaction.category}</Text>
            {showDate && (
              <>
                <View style={styles.dot} />
                <Text style={styles.date}>{formatDate(transaction.date)}</Text>
              </>
            )}
          </View>
        </View>

        {/* Amount */}
        <Text style={[styles.amount, { color: amountColor }]}>
          {amountPrefix}{formatCurrency(transaction.amount, state.profile.currency)}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: Spacing.base,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  details: {
    flex: 1,
    marginRight: 8,
  },
  title: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.textPrimary,
    marginBottom: 3,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  category: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textTertiary,
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: Colors.textDisabled,
    marginHorizontal: 6,
  },
  date: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textTertiary,
  },
  amount: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semiBold,
    letterSpacing: -0.2,
  },
});
