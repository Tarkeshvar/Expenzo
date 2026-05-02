import React, { useState, useMemo, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useApp } from "../context/AppContext";
import {
  Colors,
  Typography,
  Spacing,
  BorderRadius,
  Shadows,
  CATEGORY_LIST,
  CURRENCIES,
} from "../constants/theme";
import { formatCurrency } from "../utils/formatters";
import { Button, ProgressBar, EmptyState } from "../components/ui";
import { Budget } from "../constants/types";

// ─── Budget Modal ──────────────────────────────────────────────────────────────
interface BudgetModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (category: string, limit: number) => void;
  editingBudget: Budget | null;
  catsWithoutBudget: typeof CATEGORY_LIST;
  currency: string;
}

function BudgetModal({
  visible,
  onClose,
  onSave,
  editingBudget,
  catsWithoutBudget,
  currency,
}: BudgetModalProps) {
  const insets = useSafeAreaInsets();
  const inputRef = useRef<TextInput>(null);

  const isEditing = !!editingBudget;
  const availableCats = isEditing
    ? CATEGORY_LIST.filter((c) => c.id === editingBudget.category)
    : catsWithoutBudget;

  const [selectedCat, setSelectedCat] = useState(
    editingBudget?.category ?? availableCats[0]?.id ?? "food",
  );
  const [limitText, setLimitText] = useState(
    editingBudget ? String(editingBudget.limit) : "",
  );
  const [error, setError] = useState("");

  // Sync state when modal opens
  React.useEffect(() => {
    if (visible) {
      setSelectedCat(editingBudget?.category ?? availableCats[0]?.id ?? "food");
      setLimitText(editingBudget ? String(editingBudget.limit) : "");
      setError("");
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [visible, editingBudget]);

  const currencySymbol =
    CURRENCIES.find((c) => c.code === currency)?.symbol ?? "₹";

  const activeCat =
    CATEGORY_LIST.find((c) => c.id === selectedCat) ?? CATEGORY_LIST[0];

  const handleSave = () => {
    const val = parseFloat(limitText.trim());
    if (!limitText.trim() || isNaN(val) || val <= 0) {
      setError("Please enter a valid amount greater than 0");
      return;
    }
    onSave(selectedCat, val);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1, justifyContent: "flex-end" }}
      >
        {/* Backdrop */}
        <Pressable
          style={[styles.backdrop, StyleSheet.absoluteFillObject]}
          onPress={onClose}
        />

        <View style={styles.sheet}>
          {/* Drag handle */}
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.sheetHeader}>
            <View>
              <Text style={styles.sheetTitle}>
                {isEditing ? "Edit Budget" : "Set Budget"}
              </Text>
              <Text style={styles.sheetSubtitle}>Monthly spending limit</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <MaterialIcons
                name="close"
                size={18}
                color={Colors.textSecondary}
              />
            </TouchableOpacity>
          </View>

          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              paddingBottom: Math.max(insets.bottom, 16) + 8,
            }}
          >
            {/* Category selector */}
            <Text style={styles.fieldLabel}>Category</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8, paddingBottom: 4 }}
              style={{ marginBottom: 20 }}
            >
              {availableCats.map((cat) => {
                const active = selectedCat === cat.id;
                return (
                  <TouchableOpacity
                    key={cat.id}
                    onPress={() => !isEditing && setSelectedCat(cat.id)}
                    activeOpacity={isEditing ? 1 : 0.75}
                    style={[
                      styles.catChip,
                      active && {
                        backgroundColor: cat.color + "18",
                        borderColor: cat.color,
                      },
                    ]}
                  >
                    <MaterialIcons
                      name={cat.icon as any}
                      size={14}
                      color={active ? cat.color : Colors.textTertiary}
                    />
                    <Text
                      style={[
                        styles.catChipText,
                        active && { color: cat.color },
                      ]}
                    >
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Amount input */}
            <Text style={styles.fieldLabel}>Monthly Limit</Text>
            <TouchableOpacity
              activeOpacity={1}
              onPress={() => inputRef.current?.focus()}
              style={[
                styles.amountBox,
                error ? { borderColor: Colors.error } : {},
              ]}
            >
              <View
                style={[
                  styles.symbolBox,
                  { backgroundColor: activeCat.color + "18" },
                ]}
              >
                <Text style={[styles.symbolText, { color: activeCat.color }]}>
                  {currencySymbol}
                </Text>
              </View>
              <TextInput
                ref={inputRef}
                style={styles.amountInput}
                value={limitText}
                onChangeText={(v) => {
                  const clean = v
                    .replace(/[^0-9.]/g, "")
                    .replace(/(\..*)\./g, "$1");
                  setLimitText(clean);
                  setError("");
                }}
                placeholder="0.00"
                placeholderTextColor={Colors.textDisabled}
                keyboardType="decimal-pad"
                returnKeyType="done"
                onSubmitEditing={handleSave}
              />
            </TouchableOpacity>

            {error ? (
              <Text style={styles.errorText}>{error}</Text>
            ) : (
              <View style={{ height: 20 }} />
            )}

            {/* Action buttons */}
            <View style={styles.actions}>
              <Button
                label="Cancel"
                variant="secondary"
                onPress={onClose}
                style={{ flex: 1 }}
              />
              <Button
                label={isEditing ? "Update" : "Save Budget"}
                onPress={handleSave}
                style={{ flex: 1.6 }}
              />
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Main Screen ───────────────────────────────────────────────────────────────
export default function BudgetsScreen({ navigation }: any) {
  const { state, addBudget, updateBudget, deleteBudget, getBudgetUsage } =
    useApp();
  const insets = useSafeAreaInsets();

  const [modalVisible, setModalVisible] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);

  const currency = state.profile.currency;

  const budgetsWithUsage = useMemo(() => {
    return state.budgets.map((b) => {
      const usage = getBudgetUsage(b.category);
      const cat = CATEGORY_LIST.find((c) => c.id === b.category);
      return { ...b, usage, cat };
    });
  }, [state.budgets, state.transactions]);

  const catsWithoutBudget = CATEGORY_LIST.filter(
    (c) => !state.budgets.find((b) => b.category === c.id),
  );

  const openAdd = () => {
    if (catsWithoutBudget.length === 0) return;
    setEditingBudget(null);
    setModalVisible(true);
  };

  const openEdit = (b: Budget) => {
    setEditingBudget(b);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setEditingBudget(null);
  };

  const handleSave = (category: string, limit: number) => {
    if (editingBudget) {
      updateBudget({ ...editingBudget, limit });
    } else {
      addBudget({ category, limit, period: "monthly" });
    }
    closeModal();
  };

  const handleDelete = (id: string, catName: string) => {
    Alert.alert("Delete Budget", `Remove budget for ${catName}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => deleteBudget(id),
      },
    ]);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Budgets</Text>
          <Text style={styles.subtitle}>
            {state.budgets.length} categories tracked
          </Text>
        </View>
        <TouchableOpacity
          onPress={openAdd}
          style={[
            styles.addBtn,
            catsWithoutBudget.length === 0 && { opacity: 0.4 },
          ]}
          disabled={catsWithoutBudget.length === 0}
        >
          <MaterialIcons name="add" size={22} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Budget list */}
      <ScrollView
        contentContainerStyle={{
          padding: Spacing["2xl"],
          paddingBottom: 48,
        }}
        showsVerticalScrollIndicator={false}
      >
        {budgetsWithUsage.length === 0 ? (
          <EmptyState
            icon={
              <MaterialIcons
                name="pie-chart"
                size={32}
                color={Colors.textTertiary}
              />
            }
            title="No budgets set"
            message="Set spending limits per category to stay on track"
            action="Set First Budget"
            onAction={openAdd}
          />
        ) : (
          budgetsWithUsage.map((b) => {
            const { usage, cat } = b;
            if (!cat || !usage) return null;

            const statusColor =
              usage.percentage >= 90
                ? Colors.expense
                : usage.percentage >= 70
                  ? Colors.warning
                  : Colors.income;

            return (
              <View key={b.id} style={[styles.card, Shadows.sm]}>
                {/* Card top */}
                <View style={styles.cardTop}>
                  <View style={styles.cardLeft}>
                    <View
                      style={[
                        styles.catIcon,
                        { backgroundColor: cat.color + "18" },
                      ]}
                    >
                      <MaterialIcons
                        name={cat.icon as any}
                        size={20}
                        color={cat.color}
                      />
                    </View>
                    <View>
                      <Text style={styles.catName}>{cat.label}</Text>
                      <Text style={styles.periodLabel}>Monthly budget</Text>
                    </View>
                  </View>

                  <View style={styles.cardActions}>
                    <TouchableOpacity
                      onPress={() => openEdit(b)}
                      style={styles.iconBtn}
                    >
                      <MaterialIcons
                        name="edit"
                        size={18}
                        color={Colors.textTertiary}
                      />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleDelete(b.id, cat.label)}
                      style={styles.iconBtn}
                    >
                      <MaterialIcons
                        name="delete-outline"
                        size={18}
                        color={Colors.textDisabled}
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Amounts */}
                <View style={styles.amountsRow}>
                  <View>
                    <Text style={styles.amtLabel}>Spent</Text>
                    <Text style={[styles.amtValue, { color: statusColor }]}>
                      {formatCurrency(usage.spent, currency)}
                    </Text>
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={styles.amtLabel}>Limit</Text>
                    <Text
                      style={[styles.amtValue, { color: Colors.textSecondary }]}
                    >
                      {formatCurrency(usage.limit, currency)}
                    </Text>
                  </View>
                </View>

                {/* Progress bar */}
                <ProgressBar
                  percentage={usage.percentage}
                  color={cat.color}
                  height={8}
                  style={{ marginBottom: 8 }}
                />

                {/* Footer */}
                <View style={styles.cardFooter}>
                  <Text style={[styles.percentText, { color: statusColor }]}>
                    {usage.percentage.toFixed(0)}% used
                  </Text>
                  <Text style={styles.remainingText}>
                    {formatCurrency(
                      Math.max(0, usage.limit - usage.spent),
                      currency,
                    )}{" "}
                    remaining
                  </Text>
                </View>

                {usage.percentage >= 90 && (
                  <View style={styles.warningBanner}>
                    <MaterialIcons
                      name="warning-amber"
                      size={14}
                      color={Colors.expense}
                    />
                    <Text style={styles.warningText}>
                      Budget almost reached!
                    </Text>
                  </View>
                )}
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Modal */}
      <BudgetModal
        visible={modalVisible}
        onClose={closeModal}
        onSave={handleSave}
        editingBudget={editingBudget}
        catsWithoutBudget={catsWithoutBudget}
        currency={currency}
      />
    </View>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing["2xl"],
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  title: {
    fontSize: Typography.fontSize["2xl"],
    fontFamily: Typography.fontFamily.bold,
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textTertiary,
    marginTop: 2,
  },
  addBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.primaryMuted,
    alignItems: "center",
    justifyContent: "center",
  },

  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    marginBottom: 16,
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  cardLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  catIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  catName: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.textPrimary,
  },
  periodLabel: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textTertiary,
    marginTop: 2,
  },
  cardActions: {
    flexDirection: "row",
    gap: 2,
  },
  iconBtn: { padding: 6 },
  amountsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  amtLabel: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textTertiary,
    marginBottom: 3,
  },
  amtValue: {
    fontSize: Typography.fontSize.xl,
    fontFamily: Typography.fontFamily.bold,
    letterSpacing: -0.3,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  percentText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.semiBold,
  },
  remainingText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textTertiary,
  },
  warningBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 10,
    backgroundColor: Colors.expenseLight,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: BorderRadius.sm,
  },
  warningText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.expense,
  },

  // Modal
  backdrop: {
    backgroundColor: Colors.overlay,
  },
  kavWrapper: {
    flex: 1,
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: BorderRadius["3xl"],
    borderTopRightRadius: BorderRadius["3xl"],
    paddingHorizontal: Spacing["2xl"],
    paddingTop: 12,
  },
  handle: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
    marginBottom: 20,
  },
  sheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 24,
  },
  sheetTitle: {
    fontSize: Typography.fontSize.xl,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.textPrimary,
    letterSpacing: -0.3,
  },
  sheetSubtitle: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textTertiary,
    marginTop: 3,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.backgroundSecondary,
    alignItems: "center",
    justifyContent: "center",
  },
  fieldLabel: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.textSecondary,
    marginBottom: 10,
  },
  catChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  catChipText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.textTertiary,
  },
  amountBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    borderColor: Colors.border,
    overflow: "hidden",
    height: 60,
  },
  symbolBox: {
    width: 52,
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    borderRightWidth: 1,
    borderRightColor: Colors.border,
  },
  symbolText: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.bold,
  },
  amountInput: {
    flex: 1,
    fontSize: Typography.fontSize["2xl"],
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.textPrimary,
    paddingHorizontal: 16,
    letterSpacing: -0.5,
  },
  errorText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.error,
    marginTop: 6,
    height: 20,
  },
  actions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 20,
  },
});
