import React, { useMemo, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  RefreshControl,
  Modal,
  FlatList,
  Image,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { format, subMonths } from "date-fns";
import { useApp } from "../context/AppContext";
import {
  Colors,
  Typography,
  Spacing,
  BorderRadius,
  Shadows,
  CATEGORY_LIST,
} from "../constants/theme";
import {
  formatCurrency,
  getMonthKey,
  getPercentage,
} from "../utils/formatters";
import { TransactionItem } from "../components/TransactionItem";
import { SectionHeader, EmptyState, ProgressBar } from "../components/ui";

const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = [CURRENT_YEAR, CURRENT_YEAR - 1, CURRENT_YEAR - 2];

function buildMonthOptions() {
  return Array.from({ length: 13 }, (_, i) => {
    const d = subMonths(new Date(), i);
    return {
      key: getMonthKey(d),
      label: format(d, "MMMM yyyy"),
      short: format(d, "MMM yy"),
    };
  });
}

export default function HomeScreen({
  navigation,
  onNavigateTab,
  onPeriodChange,
  sharedPeriod,
}: any) {
  const {
    state,
    getMonthlyStats,
    getYearlyStats,
    getCategorySpend,
    getYearlyCategorySpend,
    getRecentTransactions,
  } = useApp();
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<"yearly" | "monthly">(
    sharedPeriod?.mode ?? "yearly",
  );
  const [selectedYear, setSelectedYear] = useState<number>(
    sharedPeriod?.mode === "yearly" ? sharedPeriod.value : CURRENT_YEAR,
  );
  const [selectedMonth, setSelectedMonth] = useState<string>(
    sharedPeriod?.mode === "monthly" ? sharedPeriod.value : getMonthKey(),
  );
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const monthOptions = useMemo(buildMonthOptions, []);

  const stats = useMemo(() => {
    if (viewMode === "yearly") return getYearlyStats(selectedYear);
    return getMonthlyStats(selectedMonth);
  }, [viewMode, selectedYear, selectedMonth, state.transactions]);

  const categorySpend = useMemo(() => {
    if (viewMode === "yearly") return getYearlyCategorySpend(selectedYear);
    return getCategorySpend(selectedMonth);
  }, [viewMode, selectedYear, selectedMonth, state.transactions]);

  const recent = useMemo(() => getRecentTransactions(5), [state.transactions]);

  const topCategories = useMemo(() => {
    return Object.entries(categorySpend)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([id, amount]) => {
        const cat = CATEGORY_LIST.find((c) => c.id === id);
        if (!cat) return null;
        return {
          ...cat,
          amount,
          percentage: getPercentage(amount, stats.expense),
        };
      })
      .filter(Boolean) as any[];
  }, [categorySpend, stats.expense]);

  const budgetUsed =
    state.profile.monthlyBudget > 0
      ? getPercentage(
          stats.expense,
          viewMode === "yearly"
            ? state.profile.monthlyBudget * 12
            : state.profile.monthlyBudget,
        )
      : 0;

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 600);
  }, []);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  };

  const periodLabel =
    viewMode === "yearly"
      ? String(selectedYear)
      : monthOptions.find((m) => m.key === selectedMonth)?.short ||
        selectedMonth;

  const handlePeriodSelect = (
    mode: "yearly" | "monthly",
    value: string | number,
  ) => {
    if (mode === "yearly") {
      setViewMode("yearly");
      setSelectedYear(Number(value));
    } else {
      setViewMode("monthly");
      setSelectedMonth(String(value));
    }
    setDropdownVisible(false);
    onPeriodChange?.({ mode, value });
  };

  const balanceColor = stats.balance >= 0 ? Colors.income : Colors.expense;

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
          />
        }
        contentContainerStyle={{ paddingBottom: 48 }}
      >
        {/* ── Header ── */}
        <LinearGradient
          colors={[Colors.backgroundSecondary, Colors.background]}
          style={[styles.header, { paddingTop: insets.top + 12 }]}
        >
          <View style={styles.headerTop}>
            <View style={{ flex: 1 }}>
              <Text style={styles.greeting}>{greeting()}</Text>
              <Text style={styles.userName}>
                {state.profile.name || "there"} 👋
              </Text>
            </View>

            {/* Logo as settings button — with gear badge */}
            <TouchableOpacity
              onPress={() => navigation.navigate("Settings")}
              style={styles.logoBtn}
              activeOpacity={0.8}
            >
              <View style={styles.logoWrap}>
                <Image
                  source={require("../../assets/icon.png")}
                  style={styles.logoImg}
                  resizeMode="cover"
                />
              </View>
              {/* Gear badge */}
              <View style={styles.gearBadge}>
                <MaterialIcons
                  name="settings"
                  size={10}
                  color={Colors.surface}
                />
              </View>
            </TouchableOpacity>
          </View>

          {/* ── Balance Card ── */}
          <View style={styles.balanceCard}>
            {/* Period controls */}
            <View style={styles.periodControls}>
              <View style={styles.modeToggle}>
                <TouchableOpacity
                  style={[
                    styles.modeBtn,
                    viewMode === "yearly" && styles.modeBtnActive,
                  ]}
                  onPress={() => setViewMode("yearly")}
                >
                  <Text
                    style={[
                      styles.modeBtnText,
                      viewMode === "yearly" && styles.modeBtnTextActive,
                    ]}
                  >
                    Yearly
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.modeBtn,
                    viewMode === "monthly" && styles.modeBtnActive,
                  ]}
                  onPress={() => setViewMode("monthly")}
                >
                  <Text
                    style={[
                      styles.modeBtnText,
                      viewMode === "monthly" && styles.modeBtnTextActive,
                    ]}
                  >
                    Monthly
                  </Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.periodChip}
                onPress={() => setDropdownVisible(true)}
              >
                <MaterialIcons
                  name="calendar-today"
                  size={12}
                  color={Colors.primary}
                />
                <Text style={styles.periodChipText} numberOfLines={1}>
                  {periodLabel}
                </Text>
                <MaterialIcons
                  name="expand-more"
                  size={15}
                  color={Colors.primary}
                />
              </TouchableOpacity>
            </View>

            {/* Balance */}
            <View style={styles.balanceSection}>
              <Text style={styles.balanceLabel}>Net Balance</Text>
              <Text style={[styles.balanceAmount, { color: balanceColor }]}>
                {stats.balance < 0 ? "−" : ""}
                {formatCurrency(
                  Math.abs(stats.balance),
                  state.profile.currency,
                )}
              </Text>
            </View>

            {/* Income / Expense */}
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <View
                  style={[
                    styles.statIconWrap,
                    { backgroundColor: Colors.incomeLight },
                  ]}
                >
                  <MaterialIcons
                    name="south-west"
                    size={14}
                    color={Colors.income}
                  />
                </View>
                <View>
                  <Text style={styles.statLabel}>Income</Text>
                  <Text style={[styles.statValue, { color: Colors.income }]}>
                    {formatCurrency(stats.income, state.profile.currency)}
                  </Text>
                </View>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <View
                  style={[
                    styles.statIconWrap,
                    { backgroundColor: Colors.expenseLight },
                  ]}
                >
                  <MaterialIcons
                    name="north-east"
                    size={14}
                    color={Colors.expense}
                  />
                </View>
                <View>
                  <Text style={styles.statLabel}>Expenses</Text>
                  <Text style={[styles.statValue, { color: Colors.expense }]}>
                    {formatCurrency(stats.expense, state.profile.currency)}
                  </Text>
                </View>
              </View>
            </View>

            {/* Budget progress */}
            {state.profile.monthlyBudget > 0 && (
              <View style={styles.budgetSection}>
                <View style={styles.budgetRow}>
                  <Text style={styles.budgetLabel}>
                    {viewMode === "yearly" ? "Yearly" : "Monthly"} Budget
                  </Text>
                  <Text
                    style={[
                      styles.budgetPct,
                      {
                        color:
                          budgetUsed >= 90
                            ? Colors.expense
                            : Colors.textTertiary,
                      },
                    ]}
                  >
                    {budgetUsed.toFixed(0)}% used
                  </Text>
                </View>
                <ProgressBar percentage={budgetUsed} height={5} />
                <Text style={styles.budgetSub}>
                  {formatCurrency(stats.expense, state.profile.currency)} of{" "}
                  {formatCurrency(
                    viewMode === "yearly"
                      ? state.profile.monthlyBudget * 12
                      : state.profile.monthlyBudget,
                    state.profile.currency,
                  )}
                  {budgetUsed >= 90 && " · ⚠️ Almost exceeded"}
                </Text>
              </View>
            )}
          </View>
        </LinearGradient>

        {/* ── Quick Actions ── */}
        <View style={styles.section}>
          <View style={styles.actionsGrid}>
            <QuickAction
              icon="remove-circle-outline"
              label="Add Expense"
              color={Colors.expense}
              onPress={() =>
                navigation.navigate("AddTransaction", { type: "expense" })
              }
            />
            <QuickAction
              icon="add-circle-outline"
              label="Add Income"
              color={Colors.income}
              onPress={() =>
                navigation.navigate("AddTransaction", { type: "income" })
              }
            />
            <QuickAction
              icon="insights"
              label="Analytics"
              color={Colors.savings}
              onPress={() => onNavigateTab("Analytics")}
            />
            <QuickAction
              icon="account-balance-wallet"
              label="Budgets"
              color={Colors.primary}
              onPress={() => onNavigateTab("Budgets")}
            />
          </View>
        </View>

        {/* ── Top Categories ── */}
        {topCategories.length > 0 && (
          <View style={styles.section}>
            <SectionHeader
              title="Top Categories"
              action="See All"
              onAction={() => onNavigateTab("Analytics")}
            />
            <View style={styles.categoriesCard}>
              {topCategories.map((cat: any, index: number) => (
                <View key={cat.id}>
                  <View style={styles.catRow}>
                    <View
                      style={[
                        styles.catIcon,
                        { backgroundColor: cat.color + "18" },
                      ]}
                    >
                      <MaterialIcons
                        name={cat.icon as any}
                        size={17}
                        color={cat.color}
                      />
                    </View>
                    <View style={styles.catContent}>
                      <View style={styles.catMeta}>
                        <Text style={styles.catName}>{cat.label}</Text>
                        <Text style={[styles.catAmt, { color: cat.color }]}>
                          {formatCurrency(cat.amount, state.profile.currency)}
                        </Text>
                      </View>
                      <View style={styles.catBarRow}>
                        <ProgressBar
                          percentage={cat.percentage}
                          color={cat.color}
                          height={4}
                          style={{ flex: 1 }}
                        />
                        <Text style={styles.catPct}>
                          {cat.percentage.toFixed(0)}%
                        </Text>
                      </View>
                    </View>
                  </View>
                  {index < topCategories.length - 1 && (
                    <View style={styles.rowDivider} />
                  )}
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ── Recent Transactions ── */}
        <View style={styles.section}>
          <SectionHeader
            title="Recent"
            action="All"
            onAction={() => onNavigateTab("Transactions")}
          />
          {recent.length === 0 ? (
            <EmptyState
              icon={
                <MaterialIcons
                  name="receipt-long"
                  size={32}
                  color={Colors.textTertiary}
                />
              }
              title="No transactions yet"
              message="Tap Add Expense or Add Income to get started"
              action="Add Transaction"
              onAction={() =>
                navigation.navigate("AddTransaction", { type: "expense" })
              }
            />
          ) : (
            recent.map((t) => (
              <TransactionItem
                key={t.id}
                transaction={t}
                showDate
                onPress={() =>
                  navigation.navigate("TransactionDetail", { id: t.id })
                }
              />
            ))
          )}
        </View>
      </ScrollView>

      {/* ── Period Dropdown ── */}
      <Modal
        visible={dropdownVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setDropdownVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setDropdownVisible(false)}
        >
          <View style={styles.dropdownSheet}>
            <View style={styles.dropdownHeader}>
              <Text style={styles.dropdownTitle}>Select Period</Text>
              <TouchableOpacity
                onPress={() => setDropdownVisible(false)}
                style={styles.dropdownClose}
              >
                <MaterialIcons
                  name="close"
                  size={17}
                  color={Colors.textSecondary}
                />
              </TouchableOpacity>
            </View>

            <Text style={styles.dropdownGroupLabel}>Yearly</Text>
            {YEAR_OPTIONS.map((yr) => {
              const active = viewMode === "yearly" && selectedYear === yr;
              return (
                <TouchableOpacity
                  key={yr}
                  style={[
                    styles.dropdownItem,
                    active && styles.dropdownItemActive,
                  ]}
                  onPress={() => handlePeriodSelect("yearly", yr)}
                >
                  <MaterialIcons
                    name="calendar-today"
                    size={14}
                    color={active ? Colors.primary : Colors.textTertiary}
                  />
                  <Text
                    style={[
                      styles.dropdownItemText,
                      active && styles.dropdownItemTextActive,
                    ]}
                  >
                    {yr}
                  </Text>
                  {active && (
                    <MaterialIcons
                      name="check"
                      size={14}
                      color={Colors.primary}
                    />
                  )}
                </TouchableOpacity>
              );
            })}

            <Text style={[styles.dropdownGroupLabel, { marginTop: 12 }]}>
              Monthly
            </Text>
            <FlatList
              data={monthOptions}
              keyExtractor={(m) => m.key}
              style={{ maxHeight: 200 }}
              showsVerticalScrollIndicator={false}
              renderItem={({ item: m }) => {
                const active =
                  viewMode === "monthly" && selectedMonth === m.key;
                return (
                  <TouchableOpacity
                    style={[
                      styles.dropdownItem,
                      active && styles.dropdownItemActive,
                    ]}
                    onPress={() => handlePeriodSelect("monthly", m.key)}
                  >
                    <MaterialIcons
                      name="date-range"
                      size={14}
                      color={active ? Colors.primary : Colors.textTertiary}
                    />
                    <Text
                      style={[
                        styles.dropdownItemText,
                        active && styles.dropdownItemTextActive,
                      ]}
                    >
                      {m.label}
                    </Text>
                    {active && (
                      <MaterialIcons
                        name="check"
                        size={14}
                        color={Colors.primary}
                      />
                    )}
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

function QuickAction({
  icon,
  label,
  color,
  onPress,
}: {
  icon: string;
  label: string;
  color: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={styles.quickAction}
      activeOpacity={0.75}
    >
      <View style={[styles.quickIcon, { backgroundColor: color + "14" }]}>
        <MaterialIcons name={icon as any} size={22} color={color} />
      </View>
      <Text style={styles.quickLabel} numberOfLines={2}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: Spacing["2xl"], paddingBottom: 20 },

  headerTop: { flexDirection: "row", alignItems: "center", marginBottom: 20 },
  greeting: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textTertiary,
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  userName: {
    fontSize: Typography.fontSize.xl,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.textPrimary,
    letterSpacing: -0.3,
    marginTop: 2,
  },

  // Logo settings button
  logoBtn: { position: "relative", marginLeft: 12 },
  logoWrap: {
    width: 46,
    height: 46,
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: Colors.surface,
    ...Shadows.md,
  },
  logoImg: { width: "100%", height: "100%" },
  gearBadge: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: Colors.surface,
  },

  // Balance card
  balanceCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius["2xl"],
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...Shadows.md,
  },

  periodControls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 18,
  },
  modeToggle: {
    flexDirection: "row",
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: BorderRadius.lg,
    padding: 3,
  },
  modeBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: BorderRadius.md,
  },
  modeBtnActive: { backgroundColor: Colors.surface, ...Shadows.sm },
  modeBtnText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.textTertiary,
  },
  modeBtnTextActive: {
    color: Colors.primary,
    fontFamily: Typography.fontFamily.semiBold,
  },
  periodChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.primaryMuted,
    borderRadius: BorderRadius.full,
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: Colors.primary + "35",
    maxWidth: 120,
  },
  periodChipText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.primary,
    flex: 1,
  },

  balanceSection: { marginBottom: 16 },
  balanceLabel: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textTertiary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  balanceAmount: {
    fontSize: 36,
    fontFamily: Typography.fontFamily.bold,
    letterSpacing: -1.5,
    lineHeight: 44,
  },

  statsRow: {
    flexDirection: "row",
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
  },
  statItem: { flex: 1, flexDirection: "row", alignItems: "center", gap: 10 },
  statIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  statLabel: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textTertiary,
    fontFamily: Typography.fontFamily.regular,
    marginBottom: 1,
  },
  statValue: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.bold,
    letterSpacing: -0.2,
  },
  statDivider: {
    width: 1,
    backgroundColor: Colors.divider,
    marginHorizontal: 14,
    alignSelf: "stretch",
  },

  budgetSection: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
  },
  budgetRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  budgetLabel: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.textSecondary,
  },
  budgetPct: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.semiBold,
  },
  budgetSub: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textTertiary,
    fontFamily: Typography.fontFamily.regular,
    marginTop: 4,
  },

  section: { paddingHorizontal: Spacing["2xl"], marginTop: 24 },
  actionsGrid: { flexDirection: "row", gap: 10 },
  quickAction: { flex: 1, alignItems: "center", gap: 7 },
  quickIcon: {
    width: 54,
    height: 54,
    borderRadius: BorderRadius.xl,
    alignItems: "center",
    justifyContent: "center",
  },
  quickLabel: {
    fontSize: 11,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 14,
  },

  categoriesCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    paddingHorizontal: Spacing.base,
    paddingVertical: 4,
    ...Shadows.sm,
  },
  catRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 11,
    gap: 11,
  },
  catIcon: {
    width: 34,
    height: 34,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  catContent: { flex: 1, gap: 5 },
  catMeta: { flexDirection: "row", justifyContent: "space-between" },
  catName: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.textSecondary,
  },
  catAmt: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.semiBold,
  },
  catBarRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  catPct: {
    fontSize: 11,
    color: Colors.textTertiary,
    width: 28,
    textAlign: "right",
    fontFamily: Typography.fontFamily.regular,
  },
  rowDivider: { height: 1, backgroundColor: Colors.divider, marginLeft: 45 },

  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    padding: 24,
  },
  dropdownSheet: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius["2xl"],
    padding: 20,
    maxHeight: "75%",
    ...Shadows.lg,
  },
  dropdownHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  dropdownTitle: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.textPrimary,
  },
  dropdownClose: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.backgroundSecondary,
    alignItems: "center",
    justifyContent: "center",
  },
  dropdownGroupLabel: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.textTertiary,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 6,
    paddingHorizontal: 4,
  },
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: BorderRadius.md,
    marginBottom: 2,
  },
  dropdownItemActive: { backgroundColor: Colors.primaryMuted },
  dropdownItemText: {
    flex: 1,
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.textSecondary,
  },
  dropdownItemTextActive: {
    color: Colors.primary,
    fontFamily: Typography.fontFamily.semiBold,
  },
});
