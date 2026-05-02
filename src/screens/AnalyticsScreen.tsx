import React, { useMemo, useState, useEffect } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { format, subMonths } from "date-fns";
import { useApp } from "../context/AppContext";
import {
  Colors, Typography, Spacing, BorderRadius, Shadows, CATEGORY_LIST,
} from "../constants/theme";
import { formatCurrency, getMonthKey, getPercentage } from "../utils/formatters";
import { SectionHeader, ProgressBar } from "../components/ui";
import type { SharedPeriod } from "../navigation/AppNavigator";

const CURRENT_YEAR = new Date().getFullYear();

interface Props {
  navigation: any;
  sharedPeriod?: SharedPeriod;
  onPeriodChange?: (p: SharedPeriod) => void;
}

export default function AnalyticsScreen({ navigation, sharedPeriod, onPeriodChange }: Props) {
  const {
    state, getMonthlyStats, getYearlyStats,
    getCategorySpend, getYearlyCategorySpend,
  } = useApp();
  const insets = useSafeAreaInsets();

  // Local state that syncs with sharedPeriod from Home
  const [viewMode, setViewMode] = useState<"yearly" | "monthly">(
    sharedPeriod?.mode ?? "yearly"
  );
  const [selectedYear, setSelectedYear] = useState<number>(
    sharedPeriod?.mode === "yearly" ? (sharedPeriod.value as number) : CURRENT_YEAR
  );
  const [selectedMonthKey, setSelectedMonthKey] = useState<string>(
    sharedPeriod?.mode === "monthly" ? (sharedPeriod.value as string) : getMonthKey()
  );

  // Sync when sharedPeriod prop changes (e.g. user changed it on Home tab)
  useEffect(() => {
    if (!sharedPeriod) return;
    setViewMode(sharedPeriod.mode);
    if (sharedPeriod.mode === "yearly") setSelectedYear(sharedPeriod.value as number);
    else setSelectedMonthKey(sharedPeriod.value as string);
  }, [sharedPeriod]);

  // Push changes back to shared state
  const selectYear = (yr: number) => {
    setViewMode("yearly");
    setSelectedYear(yr);
    onPeriodChange?.({ mode: "yearly", value: yr });
  };
  const selectMonthKey = (key: string) => {
    setViewMode("monthly");
    setSelectedMonthKey(key);
    onPeriodChange?.({ mode: "monthly", value: key });
  };
  const setMode = (m: "yearly" | "monthly") => {
    setViewMode(m);
    if (m === "yearly") onPeriodChange?.({ mode: "yearly", value: selectedYear });
    else onPeriodChange?.({ mode: "monthly", value: selectedMonthKey });
  };

  // Build 6 months for bar chart
  const months = useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => {
      const date = subMonths(new Date(), i);
      const key = getMonthKey(date);
      const stats = getMonthlyStats(key);
      return { key, label: format(date, "MMM"), fullLabel: format(date, "MMMM yyyy"), ...stats };
    }).reverse();
  }, [state.transactions]);

  const yearlyStats = useMemo(() => getYearlyStats(selectedYear), [selectedYear, state.transactions]);
  const monthlyStats = useMemo(() => getMonthlyStats(selectedMonthKey), [selectedMonthKey, state.transactions]);

  const activeStats = viewMode === "yearly" ? yearlyStats : monthlyStats;
  const activeLabel = viewMode === "yearly" ? String(selectedYear) : format(new Date(selectedMonthKey + "-01"), "MMMM yyyy");

  const categorySpend = viewMode === "yearly"
    ? getYearlyCategorySpend(selectedYear)
    : getCategorySpend(selectedMonthKey);

  const categoryBreakdown = useMemo(() => {
    return CATEGORY_LIST.map((cat) => ({
      ...cat,
      amount: categorySpend[cat.id] || 0,
      percentage: getPercentage(categorySpend[cat.id] || 0, activeStats.expense),
    }))
      .filter((c) => c.amount > 0)
      .sort((a, b) => b.amount - a.amount);
  }, [categorySpend, activeStats.expense]);

  const maxBarValue = Math.max(...months.map((m) => Math.max(m.income, m.expense)), 1);
  const savingsRate = activeStats.income > 0
    ? ((activeStats.income - activeStats.expense) / activeStats.income) * 100
    : 0;

  // Find which bar is selected
  const selectedBarIdx = viewMode === "monthly"
    ? months.findIndex(m => m.key === selectedMonthKey)
    : -1;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Analytics</Text>
          <Text style={styles.subtitle}>{activeLabel}</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 36 }}>
        {/* Mode toggle */}
        <View style={styles.modeRow}>
          <TouchableOpacity
            style={[styles.modeBtn, viewMode === "yearly" && styles.modeBtnActive]}
            onPress={() => setMode("yearly")}
          >
            <MaterialIcons name="calendar-today" size={15} color={viewMode === "yearly" ? Colors.primary : Colors.textTertiary} />
            <Text style={[styles.modeBtnText, viewMode === "yearly" && styles.modeBtnTextActive]}>Yearly</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modeBtn, viewMode === "monthly" && styles.modeBtnActive]}
            onPress={() => setMode("monthly")}
          >
            <MaterialIcons name="date-range" size={15} color={viewMode === "monthly" ? Colors.primary : Colors.textTertiary} />
            <Text style={[styles.modeBtnText, viewMode === "monthly" && styles.modeBtnTextActive]}>Monthly</Text>
          </TouchableOpacity>
        </View>

        {/* Year chips */}
        {viewMode === "yearly" && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
            {[CURRENT_YEAR, CURRENT_YEAR - 1, CURRENT_YEAR - 2].map((yr) => (
              <TouchableOpacity
                key={yr}
                style={[styles.chip, selectedYear === yr && styles.chipActive]}
                onPress={() => selectYear(yr)}
              >
                <Text style={[styles.chipText, selectedYear === yr && styles.chipTextActive]}>{yr}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Month chips */}
        {viewMode === "monthly" && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
            {[...months].reverse().map((m) => (
              <TouchableOpacity
                key={m.key}
                style={[styles.chip, selectedMonthKey === m.key && styles.chipActive]}
                onPress={() => selectMonthKey(m.key)}
              >
                <Text style={[styles.chipText, selectedMonthKey === m.key && styles.chipTextActive]}>
                  {m.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Summary cards */}
        <View style={styles.section}>
          <View style={styles.cardRow}>
            <StatCard label="Income" amount={formatCurrency(activeStats.income, state.profile.currency)} icon="south-west" color={Colors.income} bg={Colors.incomeLight} />
            <StatCard label="Expenses" amount={formatCurrency(activeStats.expense, state.profile.currency)} icon="north-east" color={Colors.expense} bg={Colors.expenseLight} />
          </View>
          <View style={[styles.netCard, { backgroundColor: Colors.savings + "0F", borderColor: Colors.savings + "28" }]}>
            <View>
              <Text style={styles.netLabel}>Savings Rate</Text>
              <Text style={[styles.netValue, { color: savingsRate >= 0 ? Colors.savings : Colors.expense }]}>
                {savingsRate.toFixed(1)}%
              </Text>
            </View>
            <View style={styles.netDivider} />
            <View>
              <Text style={styles.netLabel}>Net {activeStats.balance >= 0 ? "Saved" : "Deficit"}</Text>
              <Text style={[styles.netValue, { color: activeStats.balance >= 0 ? Colors.income : Colors.expense }]}>
                {formatCurrency(Math.abs(activeStats.balance), state.profile.currency)}
              </Text>
            </View>
            <MaterialIcons
              name={activeStats.balance >= 0 ? "trending-up" : "trending-down"}
              size={32}
              color={activeStats.balance >= 0 ? Colors.income : Colors.expense}
            />
          </View>
        </View>

        {/* Bar chart — 6 months, tappable */}
        <View style={styles.section}>
          <SectionHeader title="6-Month Overview" />
          <View style={styles.chartCard}>
            <View style={styles.chartLegend}>
              <LegendDot color={Colors.income} label="Income" />
              <LegendDot color={Colors.expense} label="Expense" />
            </View>
            <View style={styles.barChart}>
              {months.map((m, i) => {
                const isSel = selectedBarIdx === i;
                const dimmed = viewMode === "monthly" && selectedBarIdx !== -1 && !isSel;
                return (
                  <TouchableOpacity
                    key={m.key}
                    style={styles.barGroup}
                    onPress={() => selectMonthKey(m.key)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.barPair}>
                      <View style={[styles.bar, {
                        height: Math.max((m.income / maxBarValue) * 110, 3),
                        backgroundColor: Colors.income,
                        opacity: dimmed ? 0.3 : 1,
                      }]} />
                      <View style={[styles.bar, {
                        height: Math.max((m.expense / maxBarValue) * 110, 3),
                        backgroundColor: Colors.expense,
                        opacity: dimmed ? 0.3 : 1,
                      }]} />
                    </View>
                    {isSel && <View style={styles.barIndicator} />}
                    <Text style={[styles.barLabel, isSel && styles.barLabelSel]}>{m.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>

        {/* Category breakdown */}
        {categoryBreakdown.length > 0 ? (
          <View style={styles.section}>
            <SectionHeader title={`Spending — ${activeLabel}`} />
            <View style={styles.breakdownCard}>
              {categoryBreakdown.map((cat, i) => (
                <View key={cat.id}>
                  <View style={styles.catRow}>
                    <View style={[styles.catIcon, { backgroundColor: cat.color + "18" }]}>
                      <MaterialIcons name={cat.icon as any} size={17} color={cat.color} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={styles.catHeader}>
                        <Text style={styles.catName}>{cat.label}</Text>
                        <View style={styles.catRight}>
                          <Text style={[styles.catAmt, { color: cat.color }]}>
                            {formatCurrency(cat.amount, state.profile.currency)}
                          </Text>
                          <Text style={styles.catPct}>{cat.percentage.toFixed(0)}%</Text>
                        </View>
                      </View>
                      <ProgressBar percentage={cat.percentage} color={cat.color} height={5} />
                    </View>
                  </View>
                  {i < categoryBreakdown.length - 1 && <View style={styles.divider} />}
                </View>
              ))}
            </View>
          </View>
        ) : (
          <View style={styles.emptyWrap}>
            <MaterialIcons name="insert-chart-outlined" size={48} color={Colors.textDisabled} />
            <Text style={styles.emptyText}>No spending data for {activeLabel}</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function StatCard({ label, amount, icon, color, bg }: any) {
  return (
    <View style={[styles.statCard, { borderColor: color + "25" }]}>
      <View style={[styles.statIcon, { backgroundColor: bg }]}>
        <MaterialIcons name={icon} size={18} color={color} />
      </View>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statAmt, { color }]}>{amount}</Text>
    </View>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={styles.legendText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: Spacing["2xl"], paddingTop: 16, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: Colors.borderLight, flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" },
  title: { fontSize: Typography.fontSize["2xl"], fontFamily: Typography.fontFamily.bold, color: Colors.textPrimary, letterSpacing: -0.5 },
  subtitle: { fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.regular, color: Colors.textTertiary, marginTop: 2 },

  modeRow: { flexDirection: "row", margin: Spacing["2xl"], gap: 10, backgroundColor: Colors.backgroundSecondary, borderRadius: BorderRadius.lg, padding: 3 },
  modeBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 9, borderRadius: BorderRadius.md },
  modeBtnActive: { backgroundColor: Colors.surface, ...Shadows.sm },
  modeBtnText: { fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.medium, color: Colors.textTertiary },
  modeBtnTextActive: { color: Colors.primary, fontFamily: Typography.fontFamily.semiBold },

  chipRow: { paddingHorizontal: Spacing["2xl"], paddingBottom: 16, gap: 8 },
  chip: { paddingHorizontal: 18, paddingVertical: 8, borderRadius: BorderRadius.full, backgroundColor: Colors.backgroundSecondary, borderWidth: 1, borderColor: Colors.border, marginRight: 8 },
  chipActive: { backgroundColor: Colors.primaryMuted, borderColor: Colors.primary },
  chipText: { fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.medium, color: Colors.textTertiary },
  chipTextActive: { color: Colors.primary, fontFamily: Typography.fontFamily.semiBold },

  section: { paddingHorizontal: Spacing["2xl"], marginBottom: 24 },
  cardRow: { flexDirection: "row", gap: 12, marginBottom: 12 },
  statCard: { flex: 1, backgroundColor: Colors.surface, borderRadius: BorderRadius.xl, padding: Spacing.base, borderWidth: 1 },
  statIcon: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center", marginBottom: 10 },
  statLabel: { fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.medium, color: Colors.textTertiary, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 3 },
  statAmt: { fontSize: Typography.fontSize.lg, fontFamily: Typography.fontFamily.bold, letterSpacing: -0.3 },

  netCard: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderRadius: BorderRadius.xl, padding: Spacing.base, borderWidth: 1 },
  netLabel: { fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.medium, color: Colors.textTertiary, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 },
  netValue: { fontSize: Typography.fontSize.xl, fontFamily: Typography.fontFamily.bold, letterSpacing: -0.3 },
  netDivider: { width: 1, height: 36, backgroundColor: Colors.divider },

  chartCard: { backgroundColor: Colors.surface, borderRadius: BorderRadius.xl, padding: Spacing.xl, borderWidth: 1, borderColor: Colors.borderLight, ...Shadows.sm },
  chartLegend: { flexDirection: "row", gap: 16, marginBottom: 18 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.regular, color: Colors.textTertiary },
  barChart: { flexDirection: "row", alignItems: "flex-end", height: 134, gap: 4 },
  barGroup: { flex: 1, alignItems: "center", justifyContent: "flex-end", height: "100%" },
  barPair: { flexDirection: "row", gap: 3, alignItems: "flex-end", justifyContent: "center" },
  bar: { width: 11, borderRadius: 4, minHeight: 3 },
  barIndicator: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.primary, marginTop: 4 },
  barLabel: { fontSize: 10, fontFamily: Typography.fontFamily.regular, color: Colors.textTertiary, marginTop: 2 },
  barLabelSel: { color: Colors.primary, fontFamily: Typography.fontFamily.semiBold },

  breakdownCard: { backgroundColor: Colors.surface, borderRadius: BorderRadius.xl, borderWidth: 1, borderColor: Colors.borderLight, paddingHorizontal: Spacing.base, paddingVertical: 4, ...Shadows.sm },
  catRow: { flexDirection: "row", alignItems: "center", paddingVertical: 12, gap: 11 },
  catIcon: { width: 36, height: 36, borderRadius: BorderRadius.sm, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  catHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  catName: { fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.medium, color: Colors.textSecondary },
  catRight: { flexDirection: "row", gap: 8, alignItems: "center" },
  catAmt: { fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.semiBold },
  catPct: { fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.regular, color: Colors.textTertiary, minWidth: 28, textAlign: "right" },
  divider: { height: 1, backgroundColor: Colors.divider, marginLeft: 47 },

  emptyWrap: { alignItems: "center", paddingVertical: 48, paddingHorizontal: Spacing["2xl"] },
  emptyText: { fontSize: Typography.fontSize.base, fontFamily: Typography.fontFamily.medium, color: Colors.textTertiary, marginTop: 14, textAlign: "center" },
});
