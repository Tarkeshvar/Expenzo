import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useApp } from "../context/AppContext";
import { Colors, Typography, Spacing, BorderRadius } from "../constants/theme";
import { TransactionItem } from "../components/TransactionItem";
import { EmptyState, Chip } from "../components/ui";
import { groupTransactionsByDate, formatCurrency } from "../utils/formatters";

const FILTERS = ["All", "Expense", "Income"];

export default function TransactionsScreen({ navigation }: any) {
  const { state, deleteTransaction } = useApp();
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");

  const filtered = useMemo(() => {
    return state.transactions
      .filter((t) => {
        const matchSearch =
          !search ||
          t.title.toLowerCase().includes(search.toLowerCase()) ||
          t.category.includes(search.toLowerCase());
        const matchType =
          activeFilter === "All" || t.type === activeFilter.toLowerCase();
        return matchSearch && matchType;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [state.transactions, search, activeFilter]);

  const grouped = useMemo(() => groupTransactionsByDate(filtered), [filtered]);

  const totalShown = filtered.reduce((s, t) => {
    return t.type === "expense" ? s - t.amount : s + t.amount;
  }, 0);

  const handleDelete = (id: string) => {
    Alert.alert("Delete Transaction", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => deleteTransaction(id),
      },
    ]);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Transactions</Text>
          <Text style={styles.subtitle}>{state.transactions.length} total</Text>
        </View>
        <TouchableOpacity
          onPress={() =>
            navigation.navigate("AddTransaction", { type: "expense" })
          }
          style={styles.addBtn}
        >
          <MaterialIcons name="add" size={22} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      {/* ── Search ── */}
      <View style={styles.searchContainer}>
        <MaterialIcons name="search" size={20} color={Colors.textTertiary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search transactions..."
          placeholderTextColor={Colors.textDisabled}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch("")}>
            <MaterialIcons name="close" size={18} color={Colors.textTertiary} />
          </TouchableOpacity>
        )}
      </View>

      {/* ── Filters ── */}
      <View style={styles.filterRow}>
        {FILTERS.map((f) => (
          <Chip
            key={f}
            label={f}
            selected={activeFilter === f}
            onPress={() => setActiveFilter(f)}
            color={
              f === "Expense"
                ? Colors.expense
                : f === "Income"
                  ? Colors.income
                  : Colors.primary
            }
          />
        ))}
      </View>

      {/* ── Summary Bar ── */}
      {filtered.length > 0 && (
        <View style={styles.summaryBar}>
          <Text style={styles.summaryText}>{filtered.length} transactions</Text>
          <Text
            style={[
              styles.summaryAmount,
              { color: totalShown >= 0 ? Colors.income : Colors.expense },
            ]}
          >
            {totalShown >= 0 ? "+" : "−"}
            {formatCurrency(Math.abs(totalShown), state.profile.currency)}
          </Text>
        </View>
      )}

      {/* ── List ── */}
      <FlatList
        data={grouped}
        keyExtractor={(item) => item.date}
        contentContainerStyle={{
          padding: Spacing["2xl"],
          paddingTop: 8,
          paddingBottom: 32,
        }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item: group }) => (
          <View>
            <Text style={styles.dateHeader}>{group.date}</Text>
            {group.items.map((t: any) => (
              <TransactionItem
                key={t.id}
                transaction={t}
                onPress={() =>
                  navigation.navigate("TransactionDetail", { id: t.id })
                }
              />
            ))}
          </View>
        )}
        ListEmptyComponent={
          <EmptyState
            icon={
              <MaterialIcons
                name="receipt-long"
                size={32}
                color={Colors.textTertiary}
              />
            }
            title="No transactions found"
            message={
              search
                ? "Try different search terms"
                : "Add your first transaction"
            }
            action={!search ? "Add Transaction" : undefined}
            onAction={
              !search
                ? () =>
                    navigation.navigate("AddTransaction", { type: "expense" })
                : undefined
            }
          />
        }
      />
    </View>
  );
}

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
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: BorderRadius.lg,
    marginHorizontal: Spacing["2xl"],
    marginTop: 16,
    paddingHorizontal: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    height: 48,
  },
  searchInput: {
    flex: 1,
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textPrimary,
  },
  filterRow: {
    flexDirection: "row",
    paddingHorizontal: Spacing["2xl"],
    paddingVertical: 12,
    gap: 8,
  },
  summaryBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: Spacing["2xl"],
    paddingBottom: 8,
  },
  summaryText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textTertiary,
  },
  summaryAmount: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.semiBold,
  },
  dateHeader: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.textSecondary,
    letterSpacing: 0.3,
    marginBottom: 8,
    marginTop: 4,
  },
});
