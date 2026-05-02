import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState } from '../constants/types';

const STORAGE_KEY = '@expenzo_data';
const VERSION_KEY = '@expenzo_version';
const APP_VERSION = '1.0.0';

export const defaultState: AppState = {
  transactions: [],
  budgets: [],
  reminders: [],
  profile: {
    name: '',
    currency: 'INR',
    monthlyBudget: 0,
    createdAt: new Date().toISOString(),
  },
  onboardingComplete: false,
};

export async function loadState(): Promise<AppState> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...defaultState };
    const parsed = JSON.parse(raw);
    // Merge with defaults to handle new fields in updates
    return {
      ...defaultState,
      ...parsed,
      profile: { ...defaultState.profile, ...parsed.profile },
      reminders: parsed.reminders || [],
    };
  } catch {
    return { ...defaultState };
  }
}

export async function saveState(state: AppState): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.error('Failed to save state:', err);
  }
}

export async function clearAllData(): Promise<void> {
  try {
    await AsyncStorage.multiRemove([STORAGE_KEY, VERSION_KEY]);
  } catch (err) {
    console.error('Failed to clear data:', err);
  }
}

export async function exportData(state: AppState): Promise<string> {
  return JSON.stringify(state, null, 2);
}

export async function importData(jsonString: string): Promise<AppState | null> {
  try {
    const parsed = JSON.parse(jsonString);
    if (parsed.transactions && parsed.profile) {
      return parsed as AppState;
    }
    return null;
  } catch {
    return null;
  }
}
