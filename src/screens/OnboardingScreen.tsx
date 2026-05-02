import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Dimensions,
  Image,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Colors,
  Typography,
  Spacing,
  BorderRadius,
  CURRENCIES,
} from "../constants/theme";
import { Button, Input } from "../components/ui";
import { useApp } from "../context/AppContext";

const { height } = Dimensions.get("window");

export default function OnboardingScreen() {
  const { updateProfile, completeOnboarding } = useApp();
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState<"landing" | "setup">("landing");
  const [name, setName] = useState("");
  const [budget, setBudget] = useState("");
  const [currency, setCurrency] = useState("INR");
  const [nameError, setNameError] = useState("");

  const handleStart = () => {
    if (!name.trim()) {
      setNameError("Please enter your name");
      return;
    }
    updateProfile({
      name: name.trim(),
      currency,
      monthlyBudget: parseFloat(budget) || 0,
    });
    completeOnboarding();
  };

  // ── Landing Page ──────────────────────────────────────────────────────────
  if (step === "landing") {
    return (
      <View style={[styles.landingContainer, { paddingBottom: insets.bottom }]}>
        <LinearGradient
          colors={[Colors.background, Colors.backgroundSecondary]}
          style={StyleSheet.absoluteFill}
        />

        {/* Top — logo + tagline: paddingTop uses safe area + extra breathing room */}
        <View style={[styles.landingTop, { paddingTop: insets.top + 40 }]}>
          <Image
            source={require("../../assets/icon.png")}
            style={styles.logoImage}
            resizeMode="contain"
          />
          <Text style={styles.appName}>Expenzo</Text>
          <Text style={styles.tagline}>Your money, beautifully tracked</Text>
        </View>

        {/* Middle — feature list stretches to fill remaining space */}
        <View style={styles.featuresBlock}>
          {[
            {
              icon: "add-circle-outline",
              text: "Add expenses and income in seconds",
            },
            { icon: "insights", text: "Visualise spending with smart charts" },
            {
              icon: "track-changes",
              text: "Set budgets and get instant alerts",
            },
            { icon: "lock", text: "Private & offline — no account needed" },
          ].map((f, i) => (
            <View key={i} style={styles.featureRow}>
              <View style={styles.featureIconWrap}>
                <MaterialIcons
                  name={f.icon as any}
                  size={20}
                  color={Colors.primary}
                />
              </View>
              <Text style={styles.featureText}>{f.text}</Text>
            </View>
          ))}
        </View>

        {/* Bottom — CTA pinned to bottom */}
        <View style={styles.landingBottom}>
          <Button
            label="Get Started"
            onPress={() => setStep("setup")}
            size="lg"
            fullWidth
          />
          <Text style={styles.noAccountText}>
            No account required · 100% offline
          </Text>
        </View>
      </View>
    );
  }

  // ── Setup Screen ──────────────────────────────────────────────────────────
  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <LinearGradient
        colors={[Colors.background, Colors.backgroundSecondary]}
        style={StyleSheet.absoluteFill}
      />
      <ScrollView
        contentContainerStyle={[
          styles.setupContainer,
          { paddingTop: insets.top + 32, paddingBottom: insets.bottom + 32 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => setStep("landing")}
        >
          <MaterialIcons
            name="arrow-back"
            size={22}
            color={Colors.textSecondary}
          />
        </TouchableOpacity>

        <View style={styles.setupHeader}>
          <Text style={styles.setupTitle}>Set up your{"\n"}account</Text>
          <Text style={styles.setupSubtitle}>
            A few quick details to personalise your experience
          </Text>
        </View>

        <Input
          label="Your Name"
          value={name}
          onChangeText={(v) => {
            setName(v);
            setNameError("");
          }}
          placeholder="e.g. Rahul Sharma"
          autoCapitalize="words"
          error={nameError}
          leftIcon={
            <MaterialIcons
              name="person"
              size={20}
              color={Colors.textTertiary}
            />
          }
        />

        <View style={{ height: 28 }} />

        <Text style={styles.formLabel}>Currency</Text>
        <View style={styles.currencyGrid}>
          {CURRENCIES.map((c) => (
            <TouchableOpacity
              key={c.code}
              onPress={() => setCurrency(c.code)}
              style={[
                styles.currencyChip,
                currency === c.code && styles.currencyChipActive,
              ]}
            >
              <Text
                style={[
                  styles.currencySymbol,
                  currency === c.code && styles.currencyTextActive,
                ]}
              >
                {c.symbol}
              </Text>
              <Text
                style={[
                  styles.currencyCode,
                  currency === c.code && styles.currencyTextActive,
                ]}
              >
                {c.code}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ height: 28 }} />

        <Input
          label="Monthly Budget (Optional)"
          value={budget}
          onChangeText={setBudget}
          placeholder="e.g. 30000"
          keyboardType="numeric"
          prefix={CURRENCIES.find((c) => c.code === currency)?.symbol}
        />

        <View style={{ height: 40 }} />

        <Button
          label="Start Tracking"
          onPress={handleStart}
          size="lg"
          fullWidth
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  // ── Landing ────────────────────────────────────────────────────────────────
  landingContainer: {
    flex: 1,
    paddingHorizontal: Spacing["2xl"],
  },

  // Logo + app name block — no flex, sits at top with explicit paddingTop
  landingTop: {
    alignItems: "center",
    paddingBottom: Spacing["2xl"],
  },
  logoImage: {
    width: 88,
    height: 88,
    borderRadius: 20,
    marginBottom: 18,
  },
  appName: {
    fontSize: Typography.fontSize["4xl"],
    fontFamily: Typography.fontFamily.bold,
    color: Colors.textPrimary,
    letterSpacing: -1,
    marginBottom: 8,
  },
  tagline: {
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textSecondary,
    textAlign: "center",
  },

  // Features fill all remaining vertical space between logo and CTA
  featuresBlock: {
    flex: 1,
    justifyContent: "center",
    gap: 16,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  featureIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primaryMuted,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  featureText: {
    flex: 1,
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textSecondary,
    lineHeight: 22,
  },

  // CTA pinned to bottom
  landingBottom: {
    paddingBottom: Spacing.xl,
    paddingTop: Spacing.lg,
    gap: 12,
    alignItems: "center",
  },
  noAccountText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textTertiary,
  },

  // ── Setup ──────────────────────────────────────────────────────────────────
  setupContainer: {
    flexGrow: 1,
    paddingHorizontal: Spacing["2xl"],
  },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.backgroundTertiary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 28,
  },
  setupHeader: {
    marginBottom: 36,
  },
  setupTitle: {
    fontSize: Typography.fontSize["3xl"],
    fontFamily: Typography.fontFamily.bold,
    color: Colors.textPrimary,
    letterSpacing: -0.5,
    lineHeight: 38,
    marginBottom: 10,
  },
  setupSubtitle: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  formLabel: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.textSecondary,
    marginBottom: 12,
    letterSpacing: 0.2,
  },
  currencyGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  currencyChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 6,
  },
  currencyChipActive: {
    backgroundColor: Colors.primaryMuted,
    borderColor: Colors.primary,
  },
  currencySymbol: {
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.textSecondary,
  },
  currencyCode: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.textTertiary,
  },
  currencyTextActive: {
    color: Colors.primary,
  },
});
