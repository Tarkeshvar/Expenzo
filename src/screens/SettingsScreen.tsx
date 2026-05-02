import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Alert,
  Linking,
  Modal,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
} from "date-fns";
import { File, Paths } from "expo-file-system/next";
import * as Sharing from "expo-sharing";
import { useApp } from "../context/AppContext";
import {
  Colors,
  Typography,
  Spacing,
  BorderRadius,
  Shadows,
  CURRENCIES,
  CATEGORY_LIST,
} from "../constants/theme";
import { Input, Divider } from "../components/ui";

// ─── Static content ───────────────────────────────────────────────────────────
const PRIVACY_SECTIONS = [
  {
    title: "1. Information We Collect",
    body: "Expenzo does not collect, transmit, or store any personal data on external servers. All data you enter — transactions, budgets, reminders, and profile info — is stored locally on your device only.",
  },
  {
    title: "2. Data Storage",
    body: "All app data is saved using your device's local AsyncStorage. We have zero access to this data. Uninstalling the app permanently deletes everything.",
  },
  {
    title: "3. Third-Party Services",
    body: "Expenzo does not integrate with any analytics, advertising, or tracking services. No data is ever shared with any third party.",
  },
  {
    title: "4. Permissions",
    body: "The app does not request access to your camera, microphone, contacts, location, or any other sensitive device permissions.",
  },
  {
    title: "5. Children's Privacy",
    body: "Expenzo does not knowingly collect data from children under 13. The app contains no user accounts or data transmission.",
  },
  {
    title: "6. Contact",
    body: "Questions? Email us at infinityxmani@gmail.com",
  },
];

const HELP_SECTIONS = [
  {
    title: "Getting Started",
    items: [
      {
        q: "How do I add a transaction?",
        a: "Tap 'Add Expense' or 'Add Income' on the Home screen quick actions.",
      },
      {
        q: "How do I set a monthly budget?",
        a: "Settings → tap Edit → enter your Monthly Budget amount and save.",
      },
      {
        q: "How do I change currency?",
        a: "Settings → Edit → scroll the currency row and tap your preferred currency.",
      },
    ],
  },
  {
    title: "Transactions",
    items: [
      {
        q: "Can I edit a transaction?",
        a: "Yes. Tap any transaction to open its detail, then tap the pencil (edit) icon.",
      },
      {
        q: "Can I delete a transaction?",
        a: "Yes. Open the transaction detail and tap the delete icon.",
      },
      {
        q: "How do I filter transactions?",
        a: "Go to the Spends tab — use the search bar and filters at the top.",
      },
    ],
  },
  {
    title: "Budgets & Analytics",
    items: [
      {
        q: "How are budgets calculated?",
        a: "Budgets track spending per category for the current month and reset at the start of each new month.",
      },
      {
        q: "Why does my balance look wrong?",
        a: "Net Balance = Total Income − Total Expenses for the selected period.",
      },
      {
        q: "Can I view yearly data?",
        a: "Yes. On Home and Analytics, use the Yearly/Monthly toggle.",
      },
    ],
  },
  {
    title: "Reminders",
    items: [
      {
        q: "What are reminders?",
        a: "Reminders track money IOUs — money you gave someone or borrowed from someone.",
      },
      {
        q: "How do I mark a reminder as settled?",
        a: "Tap 'Mark Settled' on any pending reminder card.",
      },
    ],
  },
  {
    title: "Data & Export",
    items: [
      {
        q: "Is my data safe?",
        a: "Yes. All data lives only on your device. Nothing is uploaded.",
      },
      {
        q: "What does Export Data do?",
        a: "It writes a real .csv or .txt file to your device and opens the native share sheet so you can save it to Files, email it, or open it in Excel.",
      },
      {
        q: "What happens if I reset all data?",
        a: "Everything is permanently deleted. This cannot be undone.",
      },
    ],
  },
];

// ─── Export types ─────────────────────────────────────────────────────────────
type ExportScope =
  | "all"
  | "transactions"
  | "budgets"
  | "reminders"
  | "this_month"
  | "this_year";
type ExportFormat = "csv" | "txt" | "both";

const SCOPE_OPTIONS: {
  key: ExportScope;
  label: string;
  sub: string;
  icon: string;
}[] = [
  {
    key: "all",
    label: "All Data",
    sub: "Transactions, budgets & reminders",
    icon: "folder",
  },
  {
    key: "transactions",
    label: "Transactions Only",
    sub: "Every transaction ever recorded",
    icon: "receipt-long",
  },
  {
    key: "budgets",
    label: "Budgets Only",
    sub: "All category budget limits",
    icon: "pie-chart",
  },
  {
    key: "reminders",
    label: "Reminders Only",
    sub: "All money IOUs (gave / took)",
    icon: "sticky-note-2",
  },
  {
    key: "this_month",
    label: "This Month",
    sub: format(new Date(), "MMMM yyyy"),
    icon: "calendar-today",
  },
  {
    key: "this_year",
    label: "This Year",
    sub: format(new Date(), "yyyy"),
    icon: "calendar-month",
  },
];

// ─── CSV / report builders ────────────────────────────────────────────────────
function filterTxns(transactions: any[], scope: ExportScope): any[] {
  if (scope === "this_month") {
    const now = new Date();
    const start = format(startOfMonth(now), "yyyy-MM-dd");
    const end = format(endOfMonth(now), "yyyy-MM-dd");
    return transactions.filter((t) => t.date >= start && t.date <= end);
  }
  if (scope === "this_year") {
    const now = new Date();
    const start = format(startOfYear(now), "yyyy-MM-dd");
    const end = format(endOfYear(now), "yyyy-MM-dd");
    return transactions.filter((t) => t.date >= start && t.date <= end);
  }
  return transactions;
}

function csvEscape(val: string): string {
  return `"${String(val ?? "").replace(/"/g, "'")}"`;
}

function buildTransactionCSV(transactions: any[]): string {
  const header = "Date,Type,Title,Category,Amount,Note\n";
  const rows = [...transactions]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((t) => {
      const cat =
        CATEGORY_LIST.find((c) => c.id === t.category)?.label ??
        t.category ??
        "";
      return [t.date, t.type, t.title, cat, t.amount, t.note ?? ""]
        .map((v) => csvEscape(String(v)))
        .join(",");
    });
  return header + rows.join("\n");
}

function buildBudgetCSV(budgets: any[]): string {
  const header = "Category,Limit,Period\n";
  const rows = budgets.map((b) => {
    const cat =
      CATEGORY_LIST.find((c) => c.id === b.category)?.label ?? b.category;
    return [cat, b.limit, b.period ?? "monthly"]
      .map((v) => csvEscape(String(v)))
      .join(",");
  });
  return header + rows.join("\n");
}

function buildReminderCSV(reminders: any[]): string {
  const header = "Date,Type,Person,Amount,Note,Status\n";
  const rows = [...reminders]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((r) =>
      [r.date, r.type, r.person, r.amount, r.note ?? "", r.status]
        .map((v) => csvEscape(String(v)))
        .join(","),
    );
  return header + rows.join("\n");
}

function buildSummaryTxt(state: any, scope: ExportScope, txns: any[]): string {
  const { budgets = [], reminders = [], profile } = state;
  const currency = profile.currency ?? "INR";
  const currSymbol = CURRENCIES.find((c) => c.code === currency)?.symbol ?? "₹";
  const fmt = (n: number) =>
    `${currSymbol}${Number(n).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const generatedAt = format(new Date(), "dd MMM yyyy, HH:mm");
  const scopeLabel =
    SCOPE_OPTIONS.find((s) => s.key === scope)?.label ?? "All Data";

  const income = txns
    .filter((t) => t.type === "income")
    .reduce((s, t) => s + t.amount, 0);
  const expense = txns
    .filter((t) => t.type === "expense")
    .reduce((s, t) => s + t.amount, 0);

  // category breakdown
  const byCat: Record<string, number> = {};
  txns
    .filter((t) => t.type === "expense")
    .forEach((t) => {
      byCat[t.category] = (byCat[t.category] ?? 0) + t.amount;
    });
  const catLines =
    Object.entries(byCat).length === 0
      ? "  (no expense data)"
      : Object.entries(byCat)
          .sort((a, b) => b[1] - a[1])
          .map(
            ([id, amt]) =>
              `  ${(CATEGORY_LIST.find((c) => c.id === id)?.label ?? id).padEnd(22)}${fmt(amt)}`,
          )
          .join("\n");

  // pending reminders
  const pending = reminders.filter((r: any) => r.status === "pending");
  const reminderLines =
    pending.length === 0
      ? "  None"
      : pending
          .map(
            (r: any) =>
              `  ${r.type === "gave" ? "Gave to  " : "Took from"} ${r.person}: ${fmt(r.amount)}${r.note ? ` (${r.note})` : ""}`,
          )
          .join("\n");

  // budgets
  const budgetLines =
    budgets.length === 0
      ? "  None"
      : budgets
          .map(
            (b: any) =>
              `  ${(CATEGORY_LIST.find((c) => c.id === b.category)?.label ?? b.category).padEnd(22)}${fmt(b.limit)} / ${b.period ?? "monthly"}`,
          )
          .join("\n");

  return [
    "╔════════════════════════════════════════╗",
    "║        EXPENZO  —  FINANCIAL REPORT    ║",
    "╚════════════════════════════════════════╝",
    "",
    `  Generated : ${generatedAt}`,
    `  Name      : ${profile.name || "—"}`,
    `  Currency  : ${currency}`,
    `  Scope     : ${scopeLabel}`,
    "",
    "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
    "  SUMMARY",
    "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
    `  Total Income         ${fmt(income)}`,
    `  Total Expenses       ${fmt(expense)}`,
    `  Net Balance          ${fmt(income - expense)}`,
    `  Total Transactions   ${txns.length}`,
    "",
    "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
    "  SPENDING BY CATEGORY",
    "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
    catLines,
    "",
    "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
    "  BUDGETS",
    "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
    budgetLines,
    "",
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    `  PENDING REMINDERS (${pending.length})`,
    "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
    reminderLines,
    "",
    "────────────────────────────────────────",
    "  Exported from Expenzo",
    "  Contact: infinityxmani@gmail.com",
  ].join("\n");
}

// ─── Write file to cache and share ───────────────────────────────────────────
async function writeAndShare(
  filename: string,
  content: string,
  mimeType: string,
) {
  // expo-file-system v55 (next) API
  const file = new File(Paths.cache, filename);
  file.write(content);

  const canShare = await Sharing.isAvailableAsync();
  if (!canShare) {
    Alert.alert(
      "Sharing Unavailable",
      "Your device does not support file sharing.",
    );
    return;
  }
  await Sharing.shareAsync(file.uri, {
    mimeType,
    dialogTitle: `Save ${filename}`,
    UTI:
      mimeType === "text/csv"
        ? "public.comma-separated-values-text"
        : "public.plain-text",
  });
}

async function doExport(
  state: any,
  scope: ExportScope,
  exportFormat: ExportFormat,
) {
  const { transactions = [], budgets = [], reminders = [] } = state;
  const txns = filterTxns(transactions, scope);
  const stamp = format(new Date(), "yyyyMMdd_HHmm");

  try {
    if (exportFormat === "csv" || exportFormat === "both") {
      let content = "";
      const filename = `expenzo_${scope}_${stamp}.csv`;

      if (scope === "budgets") {
        content = buildBudgetCSV(budgets);
      } else if (scope === "reminders") {
        content = buildReminderCSV(reminders);
      } else if (scope === "all") {
        content =
          "=== TRANSACTIONS ===\n" +
          buildTransactionCSV(txns) +
          "\n\n=== BUDGETS ===\n" +
          buildBudgetCSV(budgets) +
          "\n\n=== REMINDERS ===\n" +
          buildReminderCSV(reminders);
      } else {
        content = buildTransactionCSV(txns);
      }
      await writeAndShare(filename, content, "text/csv");
    }

    if (exportFormat === "txt" || exportFormat === "both") {
      const content = buildSummaryTxt(state, scope, txns);
      const filename = `expenzo_report_${stamp}.txt`;
      await writeAndShare(filename, content, "text/plain");
    }
  } catch (err: any) {
    Alert.alert(
      "Export Failed",
      err?.message ?? "Something went wrong. Please try again.",
    );
  }
}

// ─── Info Modal (Privacy / Help) ──────────────────────────────────────────────
function InfoModal({
  visible,
  type,
  onClose,
}: {
  visible: boolean;
  type: "privacy" | "help" | null;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  if (!type) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={im.backdrop} />
      <View style={[im.sheet, { paddingBottom: Math.max(insets.bottom, 20) }]}>
        {/* Header */}
        <View style={im.header}>
          <View
            style={[
              im.headerIcon,
              {
                backgroundColor:
                  type === "privacy"
                    ? Colors.primaryMuted
                    : Colors.savingsLight,
              },
            ]}
          >
            <MaterialIcons
              name={type === "privacy" ? "privacy-tip" : "help-outline"}
              size={20}
              color={type === "privacy" ? Colors.primary : Colors.savings}
            />
          </View>
          <Text style={im.title}>
            {type === "privacy" ? "Privacy Policy" : "Help & Support"}
          </Text>
          <TouchableOpacity onPress={onClose} style={im.closeBtn}>
            <MaterialIcons
              name="close"
              size={18}
              color={Colors.textSecondary}
            />
          </TouchableOpacity>
        </View>

        {/* Body */}
        <ScrollView
          contentContainerStyle={im.body}
          showsVerticalScrollIndicator={false}
        >
          {type === "privacy" ? (
            <>
              <Text style={im.intro}>
                Last updated: April 2025 · All data stays on your device,
                always.
              </Text>
              {PRIVACY_SECTIONS.map((s, i) => (
                <View key={i} style={im.pSection}>
                  <Text style={im.pTitle}>{s.title}</Text>
                  <Text style={im.pBody}>{s.body}</Text>
                </View>
              ))}
            </>
          ) : (
            HELP_SECTIONS.map((section, si) => (
              <View key={si} style={im.hSection}>
                <Text style={im.hGroupTitle}>{section.title}</Text>
                {section.items.map((item, ii) => (
                  <View key={ii} style={im.hItem}>
                    <View style={im.hQ}>
                      <MaterialIcons
                        name="help"
                        size={13}
                        color={Colors.primary}
                        style={{ marginTop: 2 }}
                      />
                      <Text style={im.hQText}>{item.q}</Text>
                    </View>
                    <Text style={im.hAText}>{item.a}</Text>
                  </View>
                ))}
              </View>
            ))
          )}
          <TouchableOpacity
            style={im.contactBtn}
            onPress={() => Linking.openURL("mailto:infinityxmani@gmail.com")}
            activeOpacity={0.8}
          >
            <MaterialIcons
              name="mail-outline"
              size={15}
              color={Colors.primary}
            />
            <Text style={im.contactText}>infinityxmani@gmail.com</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );
}

const im = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  sheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    top: 56,
    backgroundColor: Colors.background,
    borderTopLeftRadius: BorderRadius["3xl"],
    borderTopRightRadius: BorderRadius["3xl"],
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: Spacing["2xl"],
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    backgroundColor: Colors.surface,
  },
  headerIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    flex: 1,
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.textPrimary,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.backgroundSecondary,
    alignItems: "center",
    justifyContent: "center",
  },
  body: { padding: Spacing["2xl"], paddingBottom: 32 },
  intro: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textTertiary,
    lineHeight: 20,
    marginBottom: 20,
    fontStyle: "italic",
  },
  pSection: { marginBottom: 18 },
  pTitle: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.textPrimary,
    marginBottom: 5,
  },
  pBody: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  hSection: { marginBottom: 22 },
  hGroupTitle: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primary,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 10,
    paddingBottom: 5,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  hItem: { marginBottom: 12 },
  hQ: { flexDirection: "row", gap: 6, marginBottom: 3 },
  hQText: {
    flex: 1,
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.textPrimary,
  },
  hAText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textSecondary,
    lineHeight: 20,
    paddingLeft: 20,
  },
  contactBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 20,
    paddingVertical: 14,
    borderRadius: BorderRadius.xl,
    backgroundColor: Colors.primaryMuted,
    borderWidth: 1,
    borderColor: Colors.primary + "30",
  },
  contactText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.primary,
  },
});

// ─── Export Modal ─────────────────────────────────────────────────────────────
function ExportModal({
  visible,
  onClose,
  state,
}: {
  visible: boolean;
  onClose: () => void;
  state: any;
}) {
  const insets = useSafeAreaInsets();
  const [scope, setScope] = useState<ExportScope>("all");
  const [scopeOpen, setScopeOpen] = useState(false);
  const [exporting, setExporting] = useState<ExportFormat | null>(null);

  const txCount = (state.transactions ?? []).length;
  const budgetCount = (state.budgets ?? []).length;
  const reminderCount = (state.reminders ?? []).length;
  const selectedScope = SCOPE_OPTIONS.find((s) => s.key === scope)!;

  const handleExport = async (fmt: ExportFormat) => {
    setExporting(fmt);
    await doExport(state, scope, fmt);
    setExporting(null);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={ex.backdrop} />
      <View
        style={[ex.sheet, { paddingBottom: Math.max(insets.bottom, 16) + 8 }]}
      >
        {/* Handle */}
        <View style={ex.handle} />

        {/* Header */}
        <View style={ex.header}>
          <View style={ex.headerIconWrap}>
            <MaterialIcons
              name="file-download"
              size={20}
              color={Colors.primary}
            />
          </View>
          <Text style={ex.title}>Export Data</Text>
          <TouchableOpacity onPress={onClose} style={ex.closeBtn}>
            <MaterialIcons
              name="close"
              size={18}
              color={Colors.textSecondary}
            />
          </TouchableOpacity>
        </View>

        {/* Stats bar */}
        <View style={ex.statsBar}>
          <StatPill icon="receipt-long" label="Transactions" value={txCount} />
          <View style={ex.statsDivider} />
          <StatPill icon="pie-chart" label="Budgets" value={budgetCount} />
          <View style={ex.statsDivider} />
          <StatPill
            icon="sticky-note-2"
            label="Reminders"
            value={reminderCount}
          />
        </View>

        {/* Scope label */}
        <Text style={ex.sectionLabel}>What to export</Text>

        {/* Scope selector */}
        <TouchableOpacity
          style={ex.scopeSelector}
          onPress={() => setScopeOpen((v) => !v)}
          activeOpacity={0.85}
        >
          <View
            style={[ex.scopeIcon, { backgroundColor: Colors.primaryMuted }]}
          >
            <MaterialIcons
              name={selectedScope.icon as any}
              size={18}
              color={Colors.primary}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={ex.scopeLabel}>{selectedScope.label}</Text>
            <Text style={ex.scopeSub}>{selectedScope.sub}</Text>
          </View>
          <MaterialIcons
            name={scopeOpen ? "keyboard-arrow-up" : "keyboard-arrow-down"}
            size={20}
            color={Colors.textTertiary}
          />
        </TouchableOpacity>

        {/* Scope dropdown */}
        {scopeOpen && (
          <View style={ex.scopeDropdown}>
            {SCOPE_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.key}
                style={[
                  ex.scopeOption,
                  scope === opt.key && ex.scopeOptionActive,
                ]}
                onPress={() => {
                  setScope(opt.key);
                  setScopeOpen(false);
                }}
              >
                <MaterialIcons
                  name={opt.icon as any}
                  size={16}
                  color={
                    scope === opt.key ? Colors.primary : Colors.textTertiary
                  }
                />
                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      ex.scopeOptionLabel,
                      scope === opt.key && ex.scopeOptionLabelActive,
                    ]}
                  >
                    {opt.label}
                  </Text>
                  <Text style={ex.scopeOptionSub}>{opt.sub}</Text>
                </View>
                {scope === opt.key && (
                  <MaterialIcons
                    name="check"
                    size={15}
                    color={Colors.primary}
                  />
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Format buttons — hidden while dropdown is open */}
        {!scopeOpen && (
          <>
            <Text style={[ex.sectionLabel, { marginTop: 16 }]}>
              Choose file format
            </Text>

            {/* CSV + TXT side by side */}
            <View style={ex.formatRow}>
              <TouchableOpacity
                style={[ex.fmtCard, { borderColor: Colors.income + "50" }]}
                onPress={() => handleExport("csv")}
                disabled={exporting !== null}
                activeOpacity={0.8}
              >
                <View
                  style={[ex.fmtIcon, { backgroundColor: Colors.incomeLight }]}
                >
                  <MaterialIcons
                    name="table-chart"
                    size={24}
                    color={Colors.income}
                  />
                </View>
                <Text style={ex.fmtTitle}>CSV File</Text>
                <Text style={ex.fmtSub}>Excel / Sheets</Text>
                {exporting === "csv" && (
                  <Text style={ex.fmtLoading}>Preparing…</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[ex.fmtCard, { borderColor: Colors.savings + "50" }]}
                onPress={() => handleExport("txt")}
                disabled={exporting !== null}
                activeOpacity={0.8}
              >
                <View
                  style={[ex.fmtIcon, { backgroundColor: Colors.savingsLight }]}
                >
                  <MaterialIcons
                    name="description"
                    size={24}
                    color={Colors.savings}
                  />
                </View>
                <Text style={ex.fmtTitle}>Report .txt</Text>
                <Text style={ex.fmtSub}>Readable summary</Text>
                {exporting === "txt" && (
                  <Text style={ex.fmtLoading}>Preparing…</Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Both button */}
            <TouchableOpacity
              style={[ex.bothBtn, exporting !== null && { opacity: 0.65 }]}
              onPress={() => handleExport("both")}
              disabled={exporting !== null}
              activeOpacity={0.85}
            >
              <MaterialIcons
                name="file-download"
                size={18}
                color={Colors.surface}
              />
              <Text style={ex.bothBtnText}>
                {exporting === "both"
                  ? "Preparing files…"
                  : "Export Both Files"}
              </Text>
            </TouchableOpacity>

            <Text style={ex.footNote}>
              Files are written to your device and opened via the share sheet —
              save to Files, email, or open in Excel directly.
            </Text>
          </>
        )}
      </View>
    </Modal>
  );
}

function StatPill({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: number;
}) {
  return (
    <View style={ex.statPill}>
      <MaterialIcons name={icon as any} size={15} color={Colors.primary} />
      <Text style={ex.statValue}>{value}</Text>
      <Text style={ex.statLabel}>{label}</Text>
    </View>
  );
}

const ex = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.42)",
  },
  sheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.surface,
    borderTopLeftRadius: BorderRadius["3xl"],
    borderTopRightRadius: BorderRadius["3xl"],
    paddingHorizontal: Spacing["2xl"],
    paddingTop: 12,
    ...Shadows.lg,
  },
  handle: {
    alignSelf: "center",
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
    marginBottom: 18,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  headerIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.primaryMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    flex: 1,
    fontSize: Typography.fontSize.xl,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.textPrimary,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.backgroundSecondary,
    alignItems: "center",
    justifyContent: "center",
  },

  statsBar: {
    flexDirection: "row",
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: BorderRadius.xl,
    padding: 14,
    marginBottom: 20,
    alignItems: "center",
  },
  statPill: { flex: 1, alignItems: "center", gap: 3 },
  statsDivider: { width: 1, height: 32, backgroundColor: Colors.divider },
  statValue: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.textPrimary,
  },
  statLabel: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textTertiary,
  },

  sectionLabel: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.textTertiary,
    textTransform: "uppercase",
    letterSpacing: 0.7,
    marginBottom: 10,
  },

  scopeSelector: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.xl,
    padding: 14,
    borderWidth: 1.5,
    borderColor: Colors.primary + "40",
    marginBottom: 4,
  },
  scopeIcon: {
    width: 38,
    height: 38,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  scopeLabel: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.textPrimary,
  },
  scopeSub: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textTertiary,
    marginTop: 1,
  },

  scopeDropdown: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    overflow: "hidden",
    marginBottom: 4,
  },
  scopeOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  scopeOptionActive: { backgroundColor: Colors.primaryMuted },
  scopeOptionLabel: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.textSecondary,
  },
  scopeOptionLabelActive: {
    color: Colors.primary,
    fontFamily: Typography.fontFamily.semiBold,
  },
  scopeOptionSub: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textTertiary,
    marginTop: 1,
  },

  formatRow: { flexDirection: "row", gap: 12, marginBottom: 12 },
  fmtCard: {
    flex: 1,
    alignItems: "center",
    gap: 6,
    padding: 16,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.xl,
    borderWidth: 1.5,
  },
  fmtIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  fmtTitle: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.textPrimary,
  },
  fmtSub: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textTertiary,
  },
  fmtLoading: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.primary,
    fontStyle: "italic",
  },

  bothBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.xl,
    paddingVertical: 14,
    marginBottom: 12,
  },
  bothBtnText: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.surface,
  },
  footNote: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textDisabled,
    textAlign: "center",
    lineHeight: 18,
  },
});

// ─── Main Settings Screen ─────────────────────────────────────────────────────
export default function SettingsScreen({ navigation }: any) {
  const { state, updateProfile, resetAll } = useApp();
  const insets = useSafeAreaInsets();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(state.profile.name);
  const [budget, setBudget] = useState(
    state.profile.monthlyBudget?.toString() ?? "",
  );
  const [currency, setCurrency] = useState(state.profile.currency);
  const [infoModal, setInfoModal] = useState<"privacy" | "help" | null>(null);
  const [exportModal, setExportModal] = useState(false);

  const handleSave = () => {
    updateProfile({
      name: name.trim() || state.profile.name,
      monthlyBudget: parseFloat(budget) || 0,
      currency,
    });
    setEditing(false);
  };

  const handleReset = () => {
    Alert.alert(
      "Reset All Data",
      "This will permanently delete all transactions, budgets, reminders, and settings. Cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Reset Everything", style: "destructive", onPress: resetAll },
      ],
    );
  };

  const currSymbol =
    CURRENCIES.find((c) => c.code === state.profile.currency)?.symbol ?? "₹";

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
        >
          <MaterialIcons
            name="arrow-back"
            size={22}
            color={Colors.textPrimary}
          />
        </TouchableOpacity>
        <Text style={styles.title}>Settings</Text>
        <TouchableOpacity
          onPress={() => (editing ? handleSave() : setEditing(true))}
          style={styles.editBtn}
        >
          <Text style={styles.editBtnText}>{editing ? "Save" : "Edit"}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile section */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Profile</Text>
          <View style={styles.profileCard}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {(state.profile.name || "U")[0].toUpperCase()}
              </Text>
            </View>
            {!editing ? (
              <View style={{ flex: 1 }}>
                <Text style={styles.profileName}>
                  {state.profile.name || "User"}
                </Text>
                <Text style={styles.profileSub}>
                  {state.profile.currency} · {(state.transactions ?? []).length}{" "}
                  transactions
                </Text>
              </View>
            ) : (
              <View style={{ flex: 1 }}>
                <Input
                  value={name}
                  onChangeText={setName}
                  placeholder="Your name"
                  containerStyle={{ marginBottom: 0 }}
                />
              </View>
            )}
          </View>
        </View>

        <Divider style={{ marginHorizontal: Spacing["2xl"] }} />

        {/* Financial section */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Financial</Text>
          {editing ? (
            <>
              <Text style={styles.fieldLabel}>Currency</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={{ marginBottom: 16 }}
              >
                <View style={{ flexDirection: "row", gap: 8 }}>
                  {CURRENCIES.map((c) => (
                    <TouchableOpacity
                      key={c.code}
                      onPress={() => setCurrency(c.code)}
                      style={[
                        styles.currChip,
                        currency === c.code && styles.currChipActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.currSymbol,
                          currency === c.code && { color: Colors.primary },
                        ]}
                      >
                        {c.symbol}
                      </Text>
                      <Text
                        style={[
                          styles.currCode,
                          currency === c.code && { color: Colors.primary },
                        ]}
                      >
                        {c.code}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
              <Input
                label="Monthly Budget"
                value={budget}
                onChangeText={setBudget}
                placeholder="e.g. 30000"
                keyboardType="numeric"
                prefix={CURRENCIES.find((c) => c.code === currency)?.symbol}
              />
            </>
          ) : (
            <>
              <SettingsRow
                icon="currency-rupee"
                label="Currency"
                value={`${state.profile.currency} (${currSymbol})`}
              />
              <SettingsRow
                icon="account-balance-wallet"
                label="Monthly Budget"
                value={
                  state.profile.monthlyBudget > 0
                    ? `${currSymbol}${state.profile.monthlyBudget.toLocaleString()}`
                    : "Not set"
                }
              />
            </>
          )}
        </View>

        <Divider style={{ marginHorizontal: Spacing["2xl"] }} />

        {/* Data section */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Data</Text>

          <TouchableOpacity
            style={styles.exportCard}
            onPress={() => setExportModal(true)}
            activeOpacity={0.85}
          >
            <View style={styles.exportIconWrap}>
              <MaterialIcons
                name="file-download"
                size={22}
                color={Colors.primary}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.exportTitle}>Export Data</Text>
              <Text style={styles.exportSub}>
                Download CSV or text report of your records
              </Text>
            </View>
            <MaterialIcons
              name="chevron-right"
              size={20}
              color={Colors.primary}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.dangerRow}
            onPress={handleReset}
            activeOpacity={0.85}
          >
            <View style={styles.dangerIconWrap}>
              <MaterialIcons
                name="delete-forever"
                size={20}
                color={Colors.expense}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.dangerLabel}>Reset All Data</Text>
              <Text style={styles.dangerSub}>
                Permanently delete all records and settings
              </Text>
            </View>
            <MaterialIcons
              name="chevron-right"
              size={20}
              color={Colors.textDisabled}
            />
          </TouchableOpacity>
        </View>

        <Divider style={{ marginHorizontal: Spacing["2xl"] }} />

        {/* About section */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>About</Text>
          <SettingsRow icon="info-outline" label="Version" value="1.0.0" />
          <SettingsRow
            icon="help-outline"
            label="Help & Support"
            onPress={() => setInfoModal("help")}
          />
          <SettingsRow
            icon="privacy-tip"
            label="Privacy Policy"
            onPress={() => setInfoModal("privacy")}
          />
          <SettingsRow
            icon="mail-outline"
            label="Contact Us"
            onPress={() => Linking.openURL("mailto:infinityxmani@gmail.com")}
          />
        </View>
      </ScrollView>

      <InfoModal
        visible={infoModal !== null}
        type={infoModal}
        onClose={() => setInfoModal(null)}
      />
      <ExportModal
        visible={exportModal}
        onClose={() => setExportModal(false)}
        state={state}
      />
    </View>
  );
}

// ─── Settings row component ───────────────────────────────────────────────────
function SettingsRow({
  icon,
  label,
  value,
  onPress,
}: {
  icon: string;
  label: string;
  value?: string;
  onPress?: () => void;
}) {
  const Row = (
    <View style={styles.settingsRow}>
      <View style={styles.settingsIconWrap}>
        <MaterialIcons
          name={icon as any}
          size={18}
          color={Colors.textSecondary}
        />
      </View>
      <Text style={styles.settingsLabel}>{label}</Text>
      <View style={{ flex: 1 }} />
      {value && (
        <Text style={styles.settingsValue} numberOfLines={1}>
          {value}
        </Text>
      )}
      {onPress && (
        <MaterialIcons
          name="chevron-right"
          size={19}
          color={Colors.textDisabled}
        />
      )}
    </View>
  );
  return onPress ? (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      {Row}
    </TouchableOpacity>
  ) : (
    Row
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing["2xl"],
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.backgroundSecondary,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    flex: 1,
    textAlign: "center",
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.textPrimary,
  },
  editBtn: { paddingHorizontal: 4, paddingVertical: 4 },
  editBtnText: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.primary,
  },

  section: { padding: Spacing["2xl"], paddingBottom: 12 },
  sectionLabel: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.textTertiary,
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 14,
  },

  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.primaryMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: Typography.fontSize["2xl"],
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primary,
  },
  profileName: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.textPrimary,
  },
  profileSub: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textTertiary,
    marginTop: 2,
  },

  fieldLabel: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.textSecondary,
    marginBottom: 10,
  },
  currChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  currChipActive: {
    backgroundColor: Colors.primaryMuted,
    borderColor: Colors.primary,
  },
  currSymbol: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.textSecondary,
  },
  currCode: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.textTertiary,
  },

  exportCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.base,
    borderWidth: 1.5,
    borderColor: Colors.primary + "35",
    marginBottom: 10,
    ...Shadows.sm,
  },
  exportIconWrap: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.primaryMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  exportTitle: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.primary,
  },
  exportSub: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textTertiary,
    marginTop: 2,
  },

  dangerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  dangerIconWrap: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.expenseLight,
    alignItems: "center",
    justifyContent: "center",
  },
  dangerLabel: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.expense,
  },
  dangerSub: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textTertiary,
    marginTop: 2,
  },

  settingsRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  settingsIconWrap: {
    width: 34,
    height: 34,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.backgroundSecondary,
    alignItems: "center",
    justifyContent: "center",
  },
  settingsLabel: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textPrimary,
  },
  settingsValue: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.textTertiary,
    marginRight: 4,
    maxWidth: 160,
  },
});
