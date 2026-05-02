import React, { useState, useCallback } from "react";
import { View, StyleSheet } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useApp } from "../context/AppContext";
import { CustomTabBar } from "../components/TabBar";
import { Colors } from "../constants/theme";

import OnboardingScreen from "../screens/OnboardingScreen";
import HomeScreen from "../screens/HomeScreen";
import TransactionsScreen from "../screens/TransactionsScreen";
import AnalyticsScreen from "../screens/AnalyticsScreen";
import BudgetsScreen from "../screens/BudgetsScreen";
import RemindersScreen from "../screens/RemindersScreen";
import SettingsScreen from "../screens/SettingsScreen";
import AddTransactionScreen from "../screens/AddTransactionScreen";
import TransactionDetailScreen from "../screens/TransactionDetailScreen";

const Stack = createNativeStackNavigator();

// Shared period context so Home & Analytics stay in sync
export type SharedPeriod =
  | { mode: "yearly"; value: number }
  | { mode: "monthly"; value: string };

function MainTabView({ navigation }: any) {
  const [activeTab, setActiveTab] = useState("Home");
  const [visited, setVisited] = useState<Set<string>>(new Set(["Home"]));
  const insets = useSafeAreaInsets();

  // Shared period state — lifted here so Home & Analytics share it
  const [sharedPeriod, setSharedPeriod] = useState<SharedPeriod>({
    mode: "yearly",
    value: new Date().getFullYear(),
  });

  const handleTabPress = useCallback((key: string) => {
    setVisited((prev) => new Set([...prev, key]));
    setActiveTab(key);
  }, []);

  const handlePeriodChange = useCallback((p: SharedPeriod) => {
    setSharedPeriod(p);
  }, []);

  const screenVisible = (key: string) => ({
    opacity: activeTab === key ? 1 : 0,
    zIndex: activeTab === key ? 1 : 0,
  });

  return (
    <View style={styles.root}>
      <View style={styles.screenArea}>
        <View
          style={[styles.screen, screenVisible("Home")]}
          pointerEvents={activeTab === "Home" ? "auto" : "none"}
        >
          {visited.has("Home") && (
            <HomeScreen
              navigation={navigation}
              onNavigateTab={handleTabPress}
              sharedPeriod={sharedPeriod}
              onPeriodChange={handlePeriodChange}
            />
          )}
        </View>

        <View
          style={[styles.screen, screenVisible("Transactions")]}
          pointerEvents={activeTab === "Transactions" ? "auto" : "none"}
        >
          {visited.has("Transactions") && (
            <TransactionsScreen navigation={navigation} />
          )}
        </View>

        <View
          style={[styles.screen, screenVisible("Analytics")]}
          pointerEvents={activeTab === "Analytics" ? "auto" : "none"}
        >
          {visited.has("Analytics") && (
            <AnalyticsScreen
              navigation={navigation}
              sharedPeriod={sharedPeriod}
              onPeriodChange={handlePeriodChange}
            />
          )}
        </View>

        <View
          style={[styles.screen, screenVisible("Budgets")]}
          pointerEvents={activeTab === "Budgets" ? "auto" : "none"}
        >
          {visited.has("Budgets") && <BudgetsScreen navigation={navigation} />}
        </View>

        <View
          style={[styles.screen, screenVisible("Reminders")]}
          pointerEvents={activeTab === "Reminders" ? "auto" : "none"}
        >
          {visited.has("Reminders") && <RemindersScreen />}
        </View>
      </View>

      <CustomTabBar
        activeTab={activeTab}
        onTabPress={handleTabPress}
        bottomInset={insets.bottom}
      />
    </View>
  );
}

export default function AppNavigator() {
  const { state, isLoading } = useApp();
  if (isLoading) return null;

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{ headerShown: false, animation: "slide_from_right" }}
      >
        {!state.onboardingComplete ? (
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        ) : (
          <>
            <Stack.Screen name="Main" component={MainTabView} />
            <Stack.Screen
              name="AddTransaction"
              component={AddTransactionScreen}
              options={{ animation: "slide_from_bottom" }}
            />
            <Stack.Screen
              name="TransactionDetail"
              component={TransactionDetailScreen}
            />
            <Stack.Screen name="Settings" component={SettingsScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, flexDirection: "column", backgroundColor: Colors.background },
  screenArea: { flex: 1, position: "relative" },
  screen: { ...StyleSheet.absoluteFillObject },
});
