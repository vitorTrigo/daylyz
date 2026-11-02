import AsyncStorage from '@react-native-async-storage/async-storage';

export type Habit = {
  id: string;
  name: string;
  emoji: string;
  completedDays: string[];
  monthlyGoals?: Record<string, number>;
};

const STORAGE_KEY = '@dailyz:habits';

const initialHabits: Habit[] = [
  {
    id: '1',
    name: 'Academia',
    emoji: '🏋️',
    completedDays: [],
  },
  {
    id: '2',
    name: 'Corrida',
    emoji: '🏃',
    completedDays: [],
  },
  {
    id: '3',
    name: 'Dormir 8 horas',
    emoji: '😴',
    completedDays: [],
  },
];

export async function getHabits(): Promise<Habit[]> {
  const stored = await AsyncStorage.getItem(STORAGE_KEY);

  if (stored !== null) {
    return JSON.parse(stored) as Habit[];
  }

  // Cria os hábitos de exemplo somente na primeira execução.
  await AsyncStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(initialHabits)
  );

  return initialHabits;
}

export async function saveHabits(habits: Habit[]): Promise<void> {
  await AsyncStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(habits)
  );
}

export async function createHabit(name: string): Promise<Habit> {
  const habits = await getHabits();

  const newHabit: Habit = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    name: name.trim(),
    emoji: '🎯',
    completedDays: [],
    monthlyGoals: {},
  };

  await saveHabits([...habits, newHabit]);

  return newHabit;
}

export async function getHabitById(
  id: string
): Promise<Habit | undefined> {
  const habits = await getHabits();

  return habits.find((habit) => habit.id === id);
}

export async function toggleHabitDay(
  habitId: string,
  date: string
): Promise<Habit | undefined> {
  const habits = await getHabits();

  const habit = habits.find((item) => item.id === habitId);

  if (!habit) return undefined;

  const completed = habit.completedDays.includes(date);

  const updatedHabit: Habit = {
    ...habit,
    completedDays: completed
      ? habit.completedDays.filter((day) => day !== date)
      : [...habit.completedDays, date],
  };

  const updatedHabits = habits.map((item) =>
    item.id === habitId ? updatedHabit : item
  );

  await saveHabits(updatedHabits);

  return updatedHabit;
}

export async function updateHabitName(
  habitId: string,
  newName: string
): Promise<Habit | undefined> {
  const name = newName.trim();

  if (!name) {
    throw new Error('O nome do hábito não pode ficar vazio.');
  }

  const habits = await getHabits();

  const habit = habits.find((item) => item.id === habitId);

  if (!habit) {
    return undefined;
  }

  const updatedHabit: Habit = {
    ...habit,
    name,
  };

  const updatedHabits = habits.map((item) =>
    item.id === habitId ? updatedHabit : item
  );

  await saveHabits(updatedHabits);

  return updatedHabit;
}

export async function deleteHabit(
  habitId: string
): Promise<void> {
  const habits = await getHabits();

  const updatedHabits = habits.filter(
    (item) => item.id !== habitId
  );

  await saveHabits(updatedHabits);
}

export async function updateHabitMonthlyGoal(
  habitId: string,
  month: string,
  goal: number | null
): Promise<Habit | undefined> {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
    throw new Error('Mês inválido.');
  }

  if (
    goal !== null &&
    (!Number.isInteger(goal) || goal < 1 || goal > 31)
  ) {
    throw new Error('A meta deve ser entre 1 e 31 dias.');
  }

  const habits = await getHabits();
  const habit = habits.find((item) => item.id === habitId);

  if (!habit) return undefined;

  const monthlyGoals = { ...(habit.monthlyGoals ?? {}) };

  if (goal === null) {
    delete monthlyGoals[month];
  } else {
    monthlyGoals[month] = goal;
  }

  const updatedHabit: Habit = {
    ...habit,
    monthlyGoals,
  };

  await saveHabits(
    habits.map((item) =>
      item.id === habitId ? updatedHabit : item
    )
  );

  return updatedHabit;
}

export function getHabitMonthlyGoal(
  habit: Habit,
  year: number,
  month: number
): number | null {
  // month utiliza os valores de 0 (janeiro) a 11 (dezembro).
  const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`;

  const goal = habit.monthlyGoals?.[monthKey];

  if (goal === undefined) return null;

  const daysInMonth = new Date(year, month + 1, 0).getDate();

  return Math.min(goal, daysInMonth);
}

