import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  Pressable,
  Alert,
  FlatList,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { format, parseISO } from "date-fns";
import { useApp } from "../context/AppContext";
import {
  Colors,
  Typography,
  Spacing,
  BorderRadius,
  Shadows,
  CURRENCIES,
} from "../constants/theme";
import { formatCurrency } from "../utils/formatters";
import { Reminder } from "../constants/types";
import { Button, EmptyState } from "../components/ui";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const safeFormat = (iso: string, fmt: string) => {
  try {
    return format(parseISO(iso), fmt);
  } catch {
    return iso;
  }
};
const todayISO = () => new Date().toISOString().split("T")[0];
const nowISO = () => new Date().toISOString();

// ─── Money Modal ──────────────────────────────────────────────────────────────
interface MoneyModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (data: Omit<Reminder, "id" | "createdAt">) => void;
  editing: Reminder | null;
  currency: string;
}

function MoneyModal({
  visible,
  onClose,
  onSave,
  editing,
  currency,
}: MoneyModalProps) {
  const insets = useSafeAreaInsets();
  const amountRef = useRef<TextInput>(null);
  const personRef = useRef<TextInput>(null);
  const noteRef = useRef<TextInput>(null);

  const [moneyType, setMoneyType] = useState<"gave" | "took">("gave");
  const [amount, setAmount] = useState("");
  const [person, setPerson] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (visible) {
      if (editing && (editing.type === "gave" || editing.type === "took")) {
        setMoneyType(editing.type);
        setAmount(String(editing.amount));
        setPerson(editing.person);
        setNote(editing.note || "");
      } else {
        setMoneyType("gave");
        setAmount("");
        setPerson("");
        setNote("");
      }
      setError("");
      const t = setTimeout(() => amountRef.current?.focus(), 350);
      return () => clearTimeout(t);
    }
  }, [visible, editing]);

  const currSymbol = CURRENCIES.find((c) => c.code === currency)?.symbol ?? "₹";

  const handleSave = () => {
    const amt = parseFloat(amount);
    if (!amount.trim() || isNaN(amt) || amt <= 0) {
      setError("Enter a valid amount");
      return;
    }
    if (!person.trim()) {
      setError("Enter person's name");
      return;
    }

    onSave({
      type: moneyType,
      amount: amt,
      person: person.trim(),
      note: note.trim() || undefined,
      date: editing?.date ?? todayISO(),
      status: editing?.status ?? "pending",
      settledAt: editing?.settledAt,
      noteTitle: undefined,
      noteBody: undefined,
    });
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={mm.flex}
      >
        <Pressable
          style={[StyleSheet.absoluteFillObject, mm.backdrop]}
          onPress={onClose}
        />
        <View style={mm.sheet}>
          <View style={mm.handle} />
          <View style={mm.header}>
            <Text style={mm.title}>
              {editing ? "Edit Reminder" : "Add Reminder"}
            </Text>
            <TouchableOpacity onPress={onClose} style={mm.closeBtn}>
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
            {/* Type toggle */}
            <View style={mm.typeRow}>
              <TouchableOpacity
                style={[mm.typeBtn, moneyType === "gave" && mm.typeBtnGave]}
                onPress={() => {
                  setMoneyType("gave");
                  setError("");
                }}
              >
                <MaterialIcons
                  name="arrow-upward"
                  size={16}
                  color={
                    moneyType === "gave" ? Colors.expense : Colors.textTertiary
                  }
                />
                <Text
                  style={[
                    mm.typeBtnText,
                    moneyType === "gave" && { color: Colors.expense },
                  ]}
                >
                  I Gave
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[mm.typeBtn, moneyType === "took" && mm.typeBtnTook]}
                onPress={() => {
                  setMoneyType("took");
                  setError("");
                }}
              >
                <MaterialIcons
                  name="arrow-downward"
                  size={16}
                  color={
                    moneyType === "took" ? Colors.income : Colors.textTertiary
                  }
                />
                <Text
                  style={[
                    mm.typeBtnText,
                    moneyType === "took" && { color: Colors.income },
                  ]}
                >
                  I Took
                </Text>
              </TouchableOpacity>
            </View>

            {/* Amount */}
            <View style={mm.amountRow}>
              <View style={mm.symbolBox}>
                <Text style={mm.symbol}>{currSymbol}</Text>
              </View>
              <TextInput
                ref={amountRef}
                style={mm.amountInput}
                value={amount}
                onChangeText={(v) => {
                  setAmount(
                    v.replace(/[^0-9.]/g, "").replace(/(\..*)\./g, "$1"),
                  );
                  setError("");
                }}
                placeholder="0.00"
                placeholderTextColor={Colors.textDisabled}
                keyboardType="decimal-pad"
                returnKeyType="next"
                onSubmitEditing={() => personRef.current?.focus()}
              />
            </View>

            {/* Person */}
            <Text style={mm.label}>
              {moneyType === "gave" ? "Given to" : "Received from"}
            </Text>
            <TextInput
              ref={personRef}
              style={mm.textInput}
              value={person}
              onChangeText={(v) => {
                setPerson(v);
                setError("");
              }}
              placeholder="Person's name"
              placeholderTextColor={Colors.textDisabled}
              returnKeyType="next"
              onSubmitEditing={() => noteRef.current?.focus()}
            />

            {/* Note */}
            <Text style={[mm.label, { marginTop: 14 }]}>Note (Optional)</Text>
            <TextInput
              ref={noteRef}
              style={[mm.textInput, { height: 72, textAlignVertical: "top" }]}
              value={note}
              onChangeText={setNote}
              placeholder="What's this for?"
              placeholderTextColor={Colors.textDisabled}
              multiline
            />

            {error ? (
              <Text style={mm.error}>{error}</Text>
            ) : (
              <View style={{ height: 16 }} />
            )}

            <View style={mm.actions}>
              <Button
                label="Cancel"
                variant="secondary"
                onPress={onClose}
                style={{ flex: 1 }}
              />
              <Button
                label={editing ? "Update" : "Save"}
                onPress={handleSave}
                style={{ flex: 1.5 }}
              />
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Note Modal ───────────────────────────────────────────────────────────────
interface NoteModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (data: Omit<Reminder, "id" | "createdAt">) => void;
  editing: Reminder | null;
}

function NoteModal({ visible, onClose, onSave, editing }: NoteModalProps) {
  const insets = useSafeAreaInsets();
  const titleRef = useRef<TextInput>(null);
  const bodyRef = useRef<TextInput>(null);

  const [noteTitle, setNoteTitle] = useState("");
  const [noteBody, setNoteBody] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (visible) {
      if (editing && editing.type === "note") {
        setNoteTitle(editing.noteTitle ?? "");
        setNoteBody(editing.noteBody ?? "");
      } else {
        setNoteTitle("");
        setNoteBody("");
      }
      setError("");
      const t = setTimeout(() => titleRef.current?.focus(), 350);
      return () => clearTimeout(t);
    }
  }, [visible, editing]);

  const handleSave = () => {
    if (!noteTitle.trim()) {
      setError("Enter a title");
      return;
    }
    if (!noteBody.trim()) {
      setError("Write something in the note");
      return;
    }

    onSave({
      type: "note",
      noteTitle: noteTitle.trim(),
      noteBody: noteBody.trim(),
      date: editing?.date ?? todayISO(),
      amount: 0,
      person: "",
      status: "pending",
      settledAt: undefined,
      note: undefined,
    });
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={mm.flex}
      >
        <Pressable
          style={[StyleSheet.absoluteFillObject, mm.backdrop]}
          onPress={onClose}
        />
        <View style={mm.sheet}>
          <View style={mm.handle} />
          <View style={mm.header}>
            <Text style={mm.title}>{editing ? "Edit Note" : "New Note"}</Text>
            <TouchableOpacity onPress={onClose} style={mm.closeBtn}>
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
            <Text style={mm.label}>Title</Text>
            <TextInput
              ref={titleRef}
              style={mm.textInput}
              value={noteTitle}
              onChangeText={(v) => {
                setNoteTitle(v);
                setError("");
              }}
              placeholder="Note title"
              placeholderTextColor={Colors.textDisabled}
              returnKeyType="next"
              onSubmitEditing={() => bodyRef.current?.focus()}
            />

            <Text style={[mm.label, { marginTop: 14 }]}>Note</Text>
            <TextInput
              ref={bodyRef}
              style={[mm.textInput, { height: 130, textAlignVertical: "top" }]}
              value={noteBody}
              onChangeText={(v) => {
                setNoteBody(v);
                setError("");
              }}
              placeholder="Write anything here..."
              placeholderTextColor={Colors.textDisabled}
              multiline
            />

            {error ? (
              <Text style={mm.error}>{error}</Text>
            ) : (
              <View style={{ height: 16 }} />
            )}

            <View style={mm.actions}>
              <Button
                label="Cancel"
                variant="secondary"
                onPress={onClose}
                style={{ flex: 1 }}
              />
              <Button
                label={editing ? "Update" : "Save"}
                onPress={handleSave}
                style={{ flex: 1.5 }}
              />
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Shared Modal Styles ──────────────────────────────────────────────────────
const mm = StyleSheet.create({
  flex: { flex: 1, justifyContent: "flex-end" },
  backdrop: { backgroundColor: "rgba(0,0,0,0.45)" },
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
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
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
  typeRow: { flexDirection: "row", gap: 12, marginBottom: 16 },
  typeBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.backgroundSecondary,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  typeBtnGave: {
    backgroundColor: Colors.expenseLight,
    borderColor: Colors.expense,
  },
  typeBtnTook: {
    backgroundColor: Colors.incomeLight,
    borderColor: Colors.income,
  },
  typeBtnText: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.textTertiary,
  },
  amountRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    borderColor: Colors.border,
    overflow: "hidden",
    marginBottom: 16,
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
  symbol: {
    fontSize: Typography.fontSize.xl,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.textSecondary,
  },
  amountInput: {
    flex: 1,
    fontSize: Typography.fontSize["2xl"],
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.textPrimary,
    paddingHorizontal: 16,
  },
  label: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textPrimary,
  },
  error: {
    fontSize: Typography.fontSize.xs,
    color: Colors.error,
    marginTop: 6,
    marginBottom: 4,
  },
  actions: { flexDirection: "row", gap: 12, marginTop: 8 },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────
type TabType = "money" | "notes";
type FilterType = "all" | "pending" | "settled";

const FILTERS: { key: FilterType; label: string }[] = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "settled", label: "Settled" },
];

export default function RemindersScreen() {
  const { state, addReminder, updateReminder, deleteReminder } = useApp();
  const insets = useSafeAreaInsets();

  const currency = state.profile.currency;
  const reminders: Reminder[] = state.reminders ?? [];

  const [tab, setTab] = useState<TabType>("money");
  const [filter, setFilter] = useState<FilterType>("all");
  const [moneyModalVisible, setMoneyModalVisible] = useState(false);
  const [noteModalVisible, setNoteModalVisible] = useState(false);
  const [editing, setEditing] = useState<Reminder | null>(null);

  // ── Derived lists ───────────────────────────────────────────────────────────
  const moneyReminders = useMemo(
    () =>
      reminders
        .filter((r) => r.type === "gave" || r.type === "took")
        .filter((r) => filter === "all" || r.status === filter)
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        ),
    [reminders, filter],
  );

  const noteReminders = useMemo(
    () =>
      reminders
        .filter((r) => r.type === "note")
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        ),
    [reminders],
  );

  const pendingGave = useMemo(
    () =>
      reminders
        .filter((r) => r.type === "gave" && r.status === "pending")
        .reduce((s, r) => s + r.amount, 0),
    [reminders],
  );

  const pendingTook = useMemo(
    () =>
      reminders
        .filter((r) => r.type === "took" && r.status === "pending")
        .reduce((s, r) => s + r.amount, 0),
    [reminders],
  );

  const moneyCount = reminders.filter(
    (r) => r.type === "gave" || r.type === "took",
  ).length;
  const noteCount = noteReminders.length;

  // ── Handlers ────────────────────────────────────────────────────────────────
  const openAdd = () => {
    setEditing(null);
    if (tab === "money") setMoneyModalVisible(true);
    else setNoteModalVisible(true);
  };

  const openEdit = (r: Reminder) => {
    setEditing(r);
    if (r.type === "note") setNoteModalVisible(true);
    else setMoneyModalVisible(true);
  };

  const closeModals = () => {
    setMoneyModalVisible(false);
    setNoteModalVisible(false);
    setEditing(null);
  };

  // This is the single save handler — works for both add and edit.
  // We capture `editing` into a local const BEFORE closeModals() nulls it.
  const handleSave = (data: Omit<Reminder, "id" | "createdAt">) => {
    const current = editing; // snapshot before closeModals resets state
    closeModals();
    if (current) {
      updateReminder({ ...current, ...data });
    } else {
      addReminder(data);
    }
  };

  const handleSettle = (r: Reminder) => {
    const newStatus: Reminder["status"] =
      r.status === "pending" ? "settled" : "pending";
    updateReminder({
      ...r,
      status: newStatus,
      settledAt: newStatus === "settled" ? nowISO() : undefined,
    });
  };

  const handleDelete = (r: Reminder) => {
    const label = r.type === "note" ? "note" : "reminder";
    Alert.alert(
      `Delete ${label.charAt(0).toUpperCase() + label.slice(1)}`,
      `Are you sure you want to remove this ${label}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => deleteReminder(r.id),
        },
      ],
    );
  };

  // ── Render: money card ──────────────────────────────────────────────────────
  const renderMoneyCard = ({ item: r }: { item: Reminder }) => {
    const isGave = r.type === "gave";
    const isPending = r.status === "pending";
    const accent = isGave ? Colors.expense : Colors.income;

    return (
      <View
        style={[
          s.card,
          { borderLeftColor: accent, borderLeftWidth: 3 },
          !isPending && s.cardSettled,
        ]}
      >
        <View style={s.cardTop}>
          <View style={[s.cardIcon, { backgroundColor: accent + "18" }]}>
            <MaterialIcons
              name={isGave ? "arrow-upward" : "arrow-downward"}
              size={20}
              color={accent}
            />
          </View>
          <View style={s.cardBody}>
            <View style={s.cardTitleRow}>
              <Text style={s.cardPerson} numberOfLines={1}>
                {r.person}
              </Text>
              <Text style={[s.cardAmount, { color: accent }]}>
                {isGave ? "−" : "+"}
                {formatCurrency(r.amount, currency)}
              </Text>
            </View>
            <Text style={s.cardMeta}>
              {isGave ? "You gave" : "You took"} ·{" "}
              {safeFormat(r.date, "dd MMM yyyy")}
            </Text>
            {r.note ? (
              <Text style={s.cardNote} numberOfLines={2}>
                {r.note}
              </Text>
            ) : null}
          </View>
        </View>

        <View style={s.cardFooter}>
          <TouchableOpacity
            style={[s.settleBtn, isPending ? s.settlePending : s.settleDone]}
            onPress={() => handleSettle(r)}
            activeOpacity={0.7}
          >
            <MaterialIcons
              name={isPending ? "check-circle-outline" : "replay"}
              size={14}
              color={isPending ? Colors.income : Colors.textTertiary}
            />
            <Text
              style={[
                s.settleBtnText,
                { color: isPending ? Colors.income : Colors.textTertiary },
              ]}
            >
              {isPending ? "Mark Settled" : "Reopen"}
            </Text>
          </TouchableOpacity>
          <View style={s.rowActions}>
            <TouchableOpacity onPress={() => openEdit(r)} style={s.iconBtn}>
              <MaterialIcons
                name="edit"
                size={16}
                color={Colors.textTertiary}
              />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleDelete(r)} style={s.iconBtn}>
              <MaterialIcons
                name="delete-outline"
                size={16}
                color={Colors.textDisabled}
              />
            </TouchableOpacity>
          </View>
        </View>

        {!isPending && r.settledAt && (
          <View style={s.settledBadge}>
            <MaterialIcons
              name="check-circle"
              size={12}
              color={Colors.income}
            />
            <Text style={s.settledText}>
              Settled {safeFormat(r.settledAt, "dd MMM")}
            </Text>
          </View>
        )}
      </View>
    );
  };

  // ── Render: note card ───────────────────────────────────────────────────────
  const renderNoteCard = ({ item: r }: { item: Reminder }) => (
    <View style={[s.card, s.noteCard]}>
      <View style={s.noteHeader}>
        <View style={s.noteIconWrap}>
          <MaterialIcons
            name="sticky-note-2"
            size={18}
            color={Colors.primary}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.noteTitle} numberOfLines={1}>
            {r.noteTitle}
          </Text>
          <Text style={s.noteMeta}>{safeFormat(r.date, "dd MMM yyyy")}</Text>
        </View>
        <View style={s.rowActions}>
          <TouchableOpacity onPress={() => openEdit(r)} style={s.iconBtn}>
            <MaterialIcons name="edit" size={16} color={Colors.textTertiary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleDelete(r)} style={s.iconBtn}>
            <MaterialIcons
              name="delete-outline"
              size={16}
              color={Colors.textDisabled}
            />
          </TouchableOpacity>
        </View>
      </View>
      <Text style={s.noteBody}>{r.noteBody}</Text>
    </View>
  );

  // ── UI ──────────────────────────────────────────────────────────────────────
  const TABS = [
    {
      key: "money" as TabType,
      icon: "account-balance-wallet",
      label: "Money",
      count: moneyCount,
    },
    {
      key: "notes" as TabType,
      icon: "sticky-note-2",
      label: "Notes",
      count: noteCount,
    },
  ] as const;

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={s.title}>Reminders</Text>
          <Text style={s.subtitle}>
            {tab === "money" ? "Money you gave or took" : "Your personal notes"}
          </Text>
        </View>
        <TouchableOpacity
          onPress={openAdd}
          style={s.addBtn}
          activeOpacity={0.75}
        >
          <MaterialIcons name="add" size={22} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Tab toggle */}
      <View style={s.tabRow}>
        {TABS.map((t) => (
          <TouchableOpacity
            key={t.key}
            style={[s.tabBtn, tab === t.key && s.tabBtnActive]}
            onPress={() => setTab(t.key)}
            activeOpacity={0.75}
          >
            <MaterialIcons
              name={t.icon as any}
              size={16}
              color={tab === t.key ? Colors.primary : Colors.textTertiary}
            />
            <Text style={[s.tabText, tab === t.key && s.tabTextActive]}>
              {t.label}
            </Text>
            {t.count > 0 && (
              <View style={[s.badge, tab === t.key && s.badgeActive]}>
                <Text style={[s.badgeText, tab === t.key && s.badgeTextActive]}>
                  {t.count}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* ── MONEY TAB ── */}
      {tab === "money" && (
        <>
          {(pendingGave > 0 || pendingTook > 0) && (
            <View style={s.summaryRow}>
              <View
                style={[s.summaryCard, { borderColor: Colors.expense + "40" }]}
              >
                <MaterialIcons
                  name="arrow-upward"
                  size={16}
                  color={Colors.expense}
                />
                <View>
                  <Text style={s.summaryLabel}>To Receive</Text>
                  <Text style={[s.summaryAmt, { color: Colors.expense }]}>
                    {formatCurrency(pendingGave, currency)}
                  </Text>
                </View>
              </View>
              <View
                style={[s.summaryCard, { borderColor: Colors.income + "40" }]}
              >
                <MaterialIcons
                  name="arrow-downward"
                  size={16}
                  color={Colors.income}
                />
                <View>
                  <Text style={s.summaryLabel}>To Pay Back</Text>
                  <Text style={[s.summaryAmt, { color: Colors.income }]}>
                    {formatCurrency(pendingTook, currency)}
                  </Text>
                </View>
              </View>
            </View>
          )}

          <View style={s.filterRow}>
            {FILTERS.map((f) => (
              <TouchableOpacity
                key={f.key}
                style={[s.chip, filter === f.key && s.chipActive]}
                onPress={() => setFilter(f.key)}
              >
                <Text
                  style={[s.chipText, filter === f.key && s.chipTextActive]}
                >
                  {f.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <FlatList
            data={moneyReminders}
            keyExtractor={(r) => r.id}
            renderItem={renderMoneyCard}
            contentContainerStyle={s.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <EmptyState
                icon={
                  <MaterialIcons
                    name="account-balance-wallet"
                    size={32}
                    color={Colors.textTertiary}
                  />
                }
                title="No money reminders"
                message="Track money you gave or borrowed from people"
                action="Add Reminder"
                onAction={openAdd}
              />
            }
          />
        </>
      )}

      {/* ── NOTES TAB ── */}
      {tab === "notes" && (
        <FlatList
          data={noteReminders}
          keyExtractor={(r) => r.id}
          renderItem={renderNoteCard}
          contentContainerStyle={s.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <EmptyState
              icon={
                <MaterialIcons
                  name="sticky-note-2"
                  size={32}
                  color={Colors.textTertiary}
                />
              }
              title="No notes yet"
              message="Jot down anything — tasks, ideas, info you don't want to forget"
              action="Add Note"
              onAction={openAdd}
            />
          }
        />
      )}

      {/* Modals */}
      <MoneyModal
        visible={moneyModalVisible}
        onClose={closeModals}
        onSave={handleSave}
        editing={editing}
        currency={currency}
      />
      <NoteModal
        visible={noteModalVisible}
        onClose={closeModals}
        onSave={handleSave}
        editing={editing}
      />
    </View>
  );
}

// ─── Screen Styles ────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  // Header
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

  // Tabs
  tabRow: {
    flexDirection: "row",
    marginHorizontal: Spacing["2xl"],
    marginTop: 16,
    marginBottom: 4,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: BorderRadius.lg,
    padding: 3,
  },
  tabBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 9,
    borderRadius: BorderRadius.md,
  },
  tabBtnActive: { backgroundColor: Colors.surface, ...Shadows.sm },
  tabText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.textTertiary,
  },
  tabTextActive: {
    color: Colors.primary,
    fontFamily: Typography.fontFamily.semiBold,
  },
  badge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  badgeActive: { backgroundColor: Colors.primaryMuted },
  badgeText: {
    fontSize: 10,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.textTertiary,
  },
  badgeTextActive: { color: Colors.primary },

  // Summary
  summaryRow: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: Spacing["2xl"],
    paddingTop: 14,
  },
  summaryCard: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: 14,
    ...Shadows.sm,
  },
  summaryLabel: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textTertiary,
  },
  summaryAmt: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.bold,
    letterSpacing: -0.3,
  },

  // Filters
  filterRow: {
    flexDirection: "row",
    paddingHorizontal: Spacing["2xl"],
    paddingVertical: 12,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipActive: {
    backgroundColor: Colors.primaryMuted,
    borderColor: Colors.primary,
  },
  chipText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.textTertiary,
  },
  chipTextActive: {
    color: Colors.primary,
    fontFamily: Typography.fontFamily.semiBold,
  },

  // List
  listContent: { padding: Spacing["2xl"], paddingBottom: 48, flexGrow: 1 },

  // Money card
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    marginBottom: 12,
    ...Shadows.sm,
    overflow: "hidden",
  },
  cardSettled: { opacity: 0.7 },
  cardTop: { flexDirection: "row", gap: 12, marginBottom: 12 },
  cardIcon: {
    width: 42,
    height: 42,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  cardBody: { flex: 1 },
  cardTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  cardPerson: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.textPrimary,
    flex: 1,
    marginRight: 8,
  },
  cardAmount: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.bold,
  },
  cardMeta: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textTertiary,
    marginBottom: 2,
  },
  cardNote: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
    paddingTop: 10,
  },
  settleBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
  },
  settlePending: { backgroundColor: Colors.incomeLight },
  settleDone: { backgroundColor: Colors.backgroundSecondary },
  settleBtnText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.semiBold,
  },
  settledBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 8,
  },
  settledText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.income,
  },

  // Note card
  noteCard: { borderLeftWidth: 3, borderLeftColor: Colors.primary },
  noteHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },
  noteIconWrap: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.primaryMuted,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  noteTitle: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.textPrimary,
  },
  noteMeta: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textTertiary,
    marginTop: 2,
  },
  noteBody: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textSecondary,
    lineHeight: 20,
  },

  // Shared
  rowActions: { flexDirection: "row", gap: 4 },
  iconBtn: { padding: 6 },
});
