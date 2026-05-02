import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '../context/AppContext';
import { Colors, Typography, Spacing, BorderRadius, Shadows, CATEGORY_LIST } from '../constants/theme';
import { formatCurrency, formatDate, formatRelativeTime } from '../utils/formatters';

export default function TransactionDetailScreen({ navigation, route }: any) {
  const { id } = route.params;
  const { state, deleteTransaction } = useApp();
  const insets = useSafeAreaInsets();

  const transaction = state.transactions.find(t => t.id === id);
  if (!transaction) {
    navigation.goBack();
    return null;
  }

  const category = CATEGORY_LIST.find(c => c.id === transaction.category);
  const catColor = category?.color || Colors.textTertiary;
  const isExpense = transaction.type === 'expense';
  const amountColor = isExpense ? Colors.expense : Colors.income;

  const handleDelete = () => {
    Alert.alert('Delete Transaction', 'This action cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          deleteTransaction(id);
          navigation.goBack();
        },
      },
    ]);
  };

  const handleEdit = () => {
    navigation.navigate('AddTransaction', { editId: id });
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Transaction</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={handleEdit} style={styles.editBtn}>
            <MaterialIcons name="edit" size={20} color={Colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleDelete} style={styles.deleteBtn}>
            <MaterialIcons name="delete-outline" size={20} color={Colors.expense} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: Spacing['2xl'], paddingBottom: insets.bottom + 40 }}>

        {/* Hero Amount Card */}
        <View style={[styles.heroCard, { borderColor: amountColor + '30' }]}>
          <View style={[styles.categoryBadge, { backgroundColor: catColor + '18' }]}>
            <MaterialIcons name={category?.icon as any || 'receipt'} size={28} color={catColor} />
          </View>
          <Text style={styles.transactionTitle}>{transaction.title}</Text>
          <Text style={[styles.amount, { color: amountColor }]}>
            {isExpense ? '−' : '+'}{formatCurrency(transaction.amount, state.profile.currency)}
          </Text>
          <View style={[styles.typeBadge, {
            backgroundColor: isExpense ? Colors.expenseLight : Colors.incomeLight,
          }]}>
            <MaterialIcons
              name={isExpense ? 'arrow-upward' : 'arrow-downward'}
              size={12}
              color={amountColor}
            />
            <Text style={[styles.typeText, { color: amountColor }]}>
              {isExpense ? 'Expense' : 'Income'}
            </Text>
          </View>
        </View>

        {/* Details */}
        <View style={styles.detailsCard}>
          <DetailRow
            icon="category"
            label="Category"
            value={category?.label || transaction.category}
            valueColor={catColor}
          />
          <DetailRow
            icon="calendar-today"
            label="Date"
            value={formatDate(transaction.date)}
          />
          <DetailRow
            icon="access-time"
            label="Added"
            value={formatRelativeTime(transaction.createdAt)}
          />
          {transaction.note && (
            <DetailRow
              icon="notes"
              label="Note"
              value={transaction.note}
            />
          )}
        </View>

      </ScrollView>
    </View>
  );
}

function DetailRow({ icon, label, value, valueColor }: {
  icon: string; label: string; value: string; valueColor?: string;
}) {
  return (
    <View style={styles.detailRow}>
      <View style={styles.detailIcon}>
        <MaterialIcons name={icon as any} size={18} color={Colors.textTertiary} />
      </View>
      <View style={styles.detailContent}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={[styles.detailValue, valueColor ? { color: valueColor } : {}]}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing['2xl'],
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.backgroundSecondary,
    alignItems: 'center', justifyContent: 'center',
  },
  deleteBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.expenseLight,
    alignItems: 'center', justifyContent: 'center',
  },
  editBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.primaryMuted,
    alignItems: 'center', justifyContent: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  title: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.textPrimary,
  },
  heroCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius['2xl'],
    padding: Spacing['2xl'],
    alignItems: 'center',
    borderWidth: 1,
    marginBottom: 20,
    ...Shadows.sm,
  },
  categoryBadge: {
    width: 72, height: 72, borderRadius: 36,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 16,
  },
  transactionTitle: {
    fontSize: Typography.fontSize.xl,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
  },
  amount: {
    fontSize: Typography.fontSize['4xl'],
    fontFamily: Typography.fontFamily.bold,
    letterSpacing: -1,
    marginBottom: 12,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
  },
  typeText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.semiBold,
  },
  detailsCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    overflow: 'hidden',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
    gap: 12,
  },
  detailIcon: {
    width: 36, height: 36, borderRadius: BorderRadius.sm,
    backgroundColor: Colors.backgroundSecondary,
    alignItems: 'center', justifyContent: 'center',
  },
  detailContent: { flex: 1 },
  detailLabel: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textTertiary,
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailValue: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.textPrimary,
  },
});
