import React, { useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { Colors, Typography } from "../constants/theme";

const { width } = Dimensions.get("window");
const TAB_BAR_HORIZONTAL_MARGIN = 32;
const TAB_BAR_WIDTH = width - TAB_BAR_HORIZONTAL_MARGIN * 2;

interface TabItem {
  key: string;
  label: string;
  icon: keyof typeof MaterialIcons.glyphMap;
}

const TABS: TabItem[] = [
  { key: "Home", label: "Home", icon: "home" },
  { key: "Transactions", label: "Spends", icon: "receipt-long" },
  { key: "Analytics", label: "Analytics", icon: "insights" },
  { key: "Budgets", label: "Budgets", icon: "pie-chart" },
  { key: "Reminders", label: "Reminders", icon: "sticky-note-2" },
];

const TAB_WIDTH = TAB_BAR_WIDTH / TABS.length;

interface CustomTabBarProps {
  activeTab: string;
  onTabPress: (key: string) => void;
  bottomInset: number;
}

export function CustomTabBar({
  activeTab,
  onTabPress,
  bottomInset,
}: CustomTabBarProps) {
  return (
    <View
      style={[
        styles.wrapper,
        { paddingBottom: bottomInset > 0 ? bottomInset + 6 : 14 },
      ]}
    >
      <View style={styles.card}>
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, { width: TAB_WIDTH }]}
              onPress={() => onTabPress(tab.key)}
              activeOpacity={0.7}
            >
              <MaterialIcons
                name={tab.icon}
                size={22}
                color={isActive ? Colors.primary : Colors.textDisabled}
              />
              <Text style={[styles.label, isActive && styles.labelActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: TAB_BAR_HORIZONTAL_MARGIN,
    paddingTop: 8,
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  card: {
    flexDirection: "row",
    backgroundColor: Colors.surface,
    borderRadius: 20,
    height: 56,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  tab: {
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    height: "100%",
    position: "relative",
  },
  label: {
    fontSize: 9.5,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.textDisabled,
    letterSpacing: 0.2,
  },
  labelActive: {
    color: Colors.primary,
    fontFamily: Typography.fontFamily.semiBold,
  },
});
