import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  KeyboardAvoidingView, Platform, Animated, Modal, FlatList, Pressable,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { format, parseISO } from 'date-fns';
import * as Haptics from 'expo-haptics';
import { useApp } from '../context/AppContext';
import { Colors, Typography, Spacing, BorderRadius, Shadows, CATEGORY_LIST } from '../constants/theme';
import { Button, Input } from '../components/ui';
import { Transaction } from '../constants/types';

// ─── Simple inline date picker ─────────────────────────────────────────────────
function DatePickerModal({ visible, value, onConfirm, onClose }: {
  visible: boolean; value: Date; onConfirm: (d: Date) => void; onClose: () => void;
}) {
  const [year, setYear] = useState(value.getFullYear());
  const [month, setMonth] = useState(value.getMonth()); // 0-indexed
  const [day, setDay] = useState(value.getDate());

  useEffect(() => {
    if (visible) { setYear(value.getFullYear()); setMonth(value.getMonth()); setDay(value.getDate()); }
  }, [visible]);

  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const clampedDay = Math.min(day, daysInMonth);

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={dp.backdrop} onPress={onClose} />
      <View style={dp.sheet}>
        <View style={dp.handle} />
        <View style={dp.header}>
          <Text style={dp.title}>Select Date</Text>
          <TouchableOpacity onPress={onClose} style={dp.closeBtn}>
            <MaterialIcons name="close" size={18} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <View style={dp.cols}>
          {/* Day */}
          <View style={dp.col}>
            <Text style={dp.colLabel}>Day</Text>
            <ScrollView style={dp.scroll} showsVerticalScrollIndicator={false}>
              {days.map(d => (
                <TouchableOpacity key={d} style={[dp.item, d === clampedDay && dp.itemActive]} onPress={() => setDay(d)}>
                  <Text style={[dp.itemText, d === clampedDay && dp.itemTextActive]}>{String(d).padStart(2,'0')}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
          {/* Month */}
          <View style={[dp.col, { flex: 1.5 }]}>
            <Text style={dp.colLabel}>Month</Text>
            <ScrollView style={dp.scroll} showsVerticalScrollIndicator={false}>
              {MONTHS.map((m, i) => (
                <TouchableOpacity key={m} style={[dp.item, i === month && dp.itemActive]} onPress={() => setMonth(i)}>
                  <Text style={[dp.itemText, i === month && dp.itemTextActive]}>{m}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
          {/* Year */}
          <View style={dp.col}>
            <Text style={dp.colLabel}>Year</Text>
            <ScrollView style={dp.scroll} showsVerticalScrollIndicator={false}>
              {years.map(y => (
                <TouchableOpacity key={y} style={[dp.item, y === year && dp.itemActive]} onPress={() => setYear(y)}>
                  <Text style={[dp.itemText, y === year && dp.itemTextActive]}>{y}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>

        <Button label="Confirm Date" onPress={() => { onConfirm(new Date(year, month, clampedDay)); onClose(); }} fullWidth style={{ marginTop: 16 }} />
      </View>
    </Modal>
  );
}

const dp = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: Colors.surface, borderTopLeftRadius: BorderRadius['3xl'], borderTopRightRadius: BorderRadius['3xl'], padding: 20, paddingBottom: 36 },
  handle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.border, marginBottom: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: Typography.fontSize.xl, fontFamily: Typography.fontFamily.bold, color: Colors.textPrimary },
  closeBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.backgroundSecondary, alignItems: 'center', justifyContent: 'center' },
  cols: { flexDirection: 'row', gap: 8 },
  col: { flex: 1 },
  colLabel: { fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.semiBold, color: Colors.textTertiary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8, textAlign: 'center' },
  scroll: { maxHeight: 200, backgroundColor: Colors.backgroundSecondary, borderRadius: BorderRadius.lg },
  item: { paddingVertical: 10, alignItems: 'center', borderRadius: BorderRadius.md, marginHorizontal: 2, marginVertical: 1 },
  itemActive: { backgroundColor: Colors.primary },
  itemText: { fontSize: Typography.fontSize.base, fontFamily: Typography.fontFamily.medium, color: Colors.textSecondary },
  itemTextActive: { color: Colors.surface, fontFamily: Typography.fontFamily.bold },
});

// ─── Main Screen ───────────────────────────────────────────────────────────────
export default function AddTransactionScreen({ navigation, route }: any) {
  const { addTransaction, updateTransaction, state } = useApp();
  const insets = useSafeAreaInsets();

  // Check if we're editing an existing transaction
  const editingId: string | undefined = route?.params?.editId;
  const editingTx: Transaction | undefined = editingId ? state.transactions.find(t => t.id === editingId) : undefined;
  const isEditing = !!editingTx;

  const initialType = editingTx?.type || route?.params?.type || 'expense';
  const [type, setType] = useState<'expense' | 'income'>(initialType);
  const [amount, setAmount] = useState(editingTx ? String(editingTx.amount) : '');
  const [title, setTitle] = useState(editingTx?.title || '');
  const [category, setCategory] = useState<string | null>(editingTx?.category || null); // null = no category selected
  const [note, setNote] = useState(editingTx?.note || '');
  const [date, setDate] = useState(editingTx ? parseISO(editingTx.date) : new Date());
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const shakeAnim = useRef(new Animated.Value(0)).current;

  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 6, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -6, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) e.amount = 'Enter a valid amount';
    if (!title.trim()) e.title = 'Title is required';
    setErrors(e);
    if (Object.keys(e).length > 0) {
      shake();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return false;
    }
    return true;
  };

  const handleSave = () => {
    if (!validate()) return;
    const dateStr = format(date, 'yyyy-MM-dd');

    if (isEditing && editingTx) {
      updateTransaction({
        ...editingTx,
        type,
        amount: parseFloat(amount),
        title: title.trim(),
        category: category || 'other',
        note: note.trim() || undefined,
        date: dateStr,
      });
    } else {
      addTransaction({
        type, amount: parseFloat(amount),
        title: title.trim(),
        category: category || 'other',
        note: note.trim() || undefined,
        date: dateStr,
      });
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    navigation.goBack();
  };

  const currency = state.profile.currency;
  const currencySymbols: Record<string, string> = { INR: '₹', USD: '$', EUR: '€', GBP: '£', JPY: '¥', AUD: 'A$', CAD: 'C$', SGD: 'S$', AED: 'AED' };
  const currSymbol = currencySymbols[currency] || '₹';
  const typeColor = type === 'expense' ? Colors.expense : Colors.income;

  const formattedDate = format(date, 'dd MMM yyyy');

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: Colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 24}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{isEditing ? 'Edit Transaction' : 'Add Transaction'}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
      >
        {/* Type Toggle */}
        <View style={styles.typeToggle}>
          <TouchableOpacity
            style={[styles.typeBtn, type === 'expense' && { backgroundColor: Colors.expenseLight, borderColor: Colors.expense }]}
            onPress={() => setType('expense')}
          >
            <MaterialIcons name="arrow-upward" size={18} color={type === 'expense' ? Colors.expense : Colors.textTertiary} />
            <Text style={[styles.typeBtnText, type === 'expense' && { color: Colors.expense }]}>Expense</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.typeBtn, type === 'income' && { backgroundColor: Colors.incomeLight, borderColor: Colors.income }]}
            onPress={() => setType('income')}
          >
            <MaterialIcons name="arrow-downward" size={18} color={type === 'income' ? Colors.income : Colors.textTertiary} />
            <Text style={[styles.typeBtnText, type === 'income' && { color: Colors.income }]}>Income</Text>
          </TouchableOpacity>
        </View>

        {/* Amount */}
        <Animated.View style={[styles.amountCard, { transform: [{ translateX: shakeAnim }] }]}>
          <Text style={styles.amountLabel}>Amount</Text>
          <View style={styles.amountRow}>
            <Text style={[styles.currencySymbol, { color: typeColor }]}>{currSymbol}</Text>
            <Input
              value={amount}
              onChangeText={v => { setAmount(v); setErrors(e => ({ ...e, amount: '' })); }}
              placeholder="0.00"
              keyboardType="decimal-pad"
              style={[styles.amountInput, { color: typeColor }]}
              containerStyle={{ flex: 1, marginBottom: 0 }}
              error={errors.amount}
            />
          </View>
        </Animated.View>

        {/* Title */}
        <View style={styles.fieldGroup}>
          <Input
            label="Title"
            value={title}
            onChangeText={v => { setTitle(v); setErrors(e => ({ ...e, title: '' })); }}
            placeholder="What was this for?"
            leftIcon={<MaterialIcons name="edit" size={18} color={Colors.textTertiary} />}
            error={errors.title}
          />
        </View>

        {/* Category — Optional */}
        <View style={styles.fieldGroup}>
          <View style={styles.fieldLabelRow}>
            <Text style={styles.fieldLabel}>Category</Text>
            <Text style={styles.optionalBadge}>Optional</Text>
          </View>
          <View style={styles.categoryGrid}>
            {CATEGORY_LIST.map(cat => (
              <TouchableOpacity
                key={cat.id}
                onPress={() => setCategory(category === cat.id ? null : cat.id)}
                style={[
                  styles.categoryChip,
                  category === cat.id && { backgroundColor: cat.color + '18', borderColor: cat.color },
                ]}
              >
                <MaterialIcons name={cat.icon as any} size={16} color={category === cat.id ? cat.color : Colors.textTertiary} />
                <Text style={[styles.categoryChipText, category === cat.id && { color: cat.color }]}>{cat.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Date — tap to open picker */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Date</Text>
          <TouchableOpacity style={styles.datePicker} onPress={() => setDatePickerVisible(true)} activeOpacity={0.7}>
            <MaterialIcons name="calendar-today" size={18} color={Colors.primary} />
            <Text style={styles.datePickerText}>{formattedDate}</Text>
            <MaterialIcons name="keyboard-arrow-down" size={18} color={Colors.textTertiary} />
          </TouchableOpacity>
        </View>

        {/* Note */}
        <View style={styles.fieldGroup}>
          <Input
            label="Note (Optional)"
            value={note}
            onChangeText={setNote}
            placeholder="Add a note..."
            multiline
            numberOfLines={3}
            leftIcon={<MaterialIcons name="notes" size={18} color={Colors.textTertiary} />}
            style={{ minHeight: 80, textAlignVertical: 'top' }}
          />
        </View>

        {/* Save Button */}
        <Button
          label={isEditing ? 'Update Transaction' : 'Save Transaction'}
          onPress={handleSave}
          size="lg"
          fullWidth
          style={{ marginTop: 8 }}
        />
      </ScrollView>

      <DatePickerModal
        visible={datePickerVisible}
        value={date}
        onConfirm={setDate}
        onClose={() => setDatePickerVisible(false)}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing['2xl'], paddingBottom: 16,
    backgroundColor: Colors.background, borderBottomWidth: 1, borderBottomColor: Colors.borderLight,
  },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.backgroundSecondary, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: Typography.fontSize.lg, fontFamily: Typography.fontFamily.semiBold, color: Colors.textPrimary, letterSpacing: -0.2 },
  content: { padding: Spacing['2xl'], gap: 4 },
  typeToggle: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  typeBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 48, borderRadius: BorderRadius.lg, backgroundColor: Colors.backgroundSecondary, borderWidth: 1.5, borderColor: Colors.border },
  typeBtnText: { fontSize: Typography.fontSize.base, fontFamily: Typography.fontFamily.semiBold, color: Colors.textTertiary },
  amountCard: { backgroundColor: Colors.surface, borderRadius: BorderRadius.xl, padding: Spacing.xl, borderWidth: 1, borderColor: Colors.borderLight, marginBottom: 20, ...Shadows.sm },
  amountLabel: { fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.medium, color: Colors.textTertiary, marginBottom: 8, letterSpacing: 0.3, textTransform: 'uppercase' },
  amountRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  currencySymbol: { fontSize: 36, fontFamily: Typography.fontFamily.bold, letterSpacing: -0.5 },
  amountInput: { fontSize: 36, fontFamily: Typography.fontFamily.bold, letterSpacing: -0.5, borderWidth: 0, backgroundColor: Colors.transparent, paddingVertical: 0, paddingHorizontal: 0 },
  fieldGroup: { marginBottom: 20 },
  fieldLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  fieldLabel: { fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.medium, color: Colors.textSecondary, letterSpacing: 0.2 },
  optionalBadge: { fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.regular, color: Colors.textTertiary, backgroundColor: Colors.backgroundSecondary, paddingHorizontal: 8, paddingVertical: 2, borderRadius: BorderRadius.full },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  categoryChip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 8, borderRadius: BorderRadius.full, backgroundColor: Colors.backgroundSecondary, borderWidth: 1, borderColor: Colors.border },
  categoryChipText: { fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.medium, color: Colors.textTertiary },
  datePicker: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, borderWidth: 1.5, borderColor: Colors.border, paddingHorizontal: 14, paddingVertical: 14 },
  datePickerText: { flex: 1, fontSize: Typography.fontSize.base, fontFamily: Typography.fontFamily.medium, color: Colors.textPrimary },
});
