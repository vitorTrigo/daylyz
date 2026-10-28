import AsyncStorage from '@react-native-async-storage/async-storage';

export type CalendarMode = 'monthly' | 'annual';

const CALENDAR_MODE_KEY = '@dailyz:calendarMode';

export async function getCalendarMode(): Promise<CalendarMode> {
  const savedMode = await AsyncStorage.getItem(CALENDAR_MODE_KEY);

  if (savedMode === 'monthly' || savedMode === 'annual') {
    return savedMode;
  }

  return 'monthly';
}

export async function saveCalendarMode(
  mode: CalendarMode
): Promise<void> {
  await AsyncStorage.setItem(CALENDAR_MODE_KEY, mode);
}