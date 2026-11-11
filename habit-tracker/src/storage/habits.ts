import AsyncStorage from '@react-native-async-storage/async-storage';

export type RecurringMonthlyGoal = {
  startMonth: string;
  goal: number | null;
};

export type Habit = {
  id: string;
  name: string;
  emoji: string;
  completedDays: string[];
  monthlyGoals?: Record<string, number>;
  recurringMonthlyGoals?: RecurringMonthlyGoal[];
};

const STORAGE_KEY = '@dailyz:habits';

let pendingWrite: Promise<void> = Promise.resolve();

function enqueueHabitMutation<T>(
  operation: () => Promise<T>
): Promise<T> {
  const result = pendingWrite.then(operation);

  pendingWrite = result.then(
    () => undefined,
    () => undefined
  );

  return result;
}

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

function isValidMonthKey(value: string): boolean {
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(value);
}

function isValidGoal(value: unknown): value is number {
  return (
    typeof value === 'number' &&
    Number.isInteger(value) &&
    value >= 1 &&
    value <= 31
  );
}

function isValidHabit(value: unknown): value is Habit {
  if (
    typeof value !== 'object' ||
    value === null ||
    Array.isArray(value)
  ) {
    return false;
  }

  const habit = value as Record<string, unknown>;

  if (
    typeof habit.id !== 'string' ||
    typeof habit.name !== 'string' ||
    typeof habit.emoji !== 'string' ||
    !Array.isArray(habit.completedDays) ||
    !habit.completedDays.every(
      (day) => typeof day === 'string'
    )
  ) {
    return false;
  }

  if (habit.monthlyGoals !== undefined) {
    if (
      typeof habit.monthlyGoals !== 'object' ||
      habit.monthlyGoals === null ||
      Array.isArray(habit.monthlyGoals)
    ) {
      return false;
    }

    const goals = habit.monthlyGoals as Record<string, unknown>;

    if (
      !Object.entries(goals).every(
        ([month, goal]) =>
          isValidMonthKey(month) && isValidGoal(goal)
      )
    ) {
      return false;
    }
  }

  if (habit.recurringMonthlyGoals !== undefined) {
    if (
      !Array.isArray(habit.recurringMonthlyGoals) ||
      !habit.recurringMonthlyGoals.every((rule: unknown) => {
        if (
          typeof rule !== 'object' ||
          rule === null ||
          Array.isArray(rule)
        ) {
          return false;
        }

        const entry = rule as Record<string, unknown>;

        return (
          typeof entry.startMonth === 'string' &&
          isValidMonthKey(entry.startMonth) &&
          (entry.goal === null || isValidGoal(entry.goal))
        );
      })
    ) {
      return false;
    }
  }

  return true;
}

async function readHabitsFromStorage(): Promise<Habit[]> {
  const stored = await AsyncStorage.getItem(STORAGE_KEY);

  if (stored === null) {
    await AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(initialHabits)
    );

    return initialHabits;
  }

  const parsed: unknown = JSON.parse(stored);

  if (
    !Array.isArray(parsed) ||
    !parsed.every(isValidHabit)
  ) {
    throw new Error(
      'Os dados armazenados dos hábitos são inválidos.'
    );
  }

  return parsed;
}

export function getHabits(): Promise<Habit[]> {
  return enqueueHabitMutation(
    readHabitsFromStorage
  );
}

async function saveHabits(habits: Habit[]): Promise<void> {
  await AsyncStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(habits)
  );
}

export async function createHabit(
  name: string
): Promise<Habit> {
  return enqueueHabitMutation(async () => {
    const habits = await readHabitsFromStorage();

    const newHabit: Habit = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      name: name.trim(),
      emoji: '🎯',
      completedDays: [],
      monthlyGoals: {},
      recurringMonthlyGoals: [],
    };

    await saveHabits([...habits, newHabit]);

    return newHabit;
  });
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
  return enqueueHabitMutation(async () => {
    const habits = await readHabitsFromStorage();

    const habit = habits.find(
      (item) => item.id === habitId
    );

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
  });
}

export async function updateHabitName(
  habitId: string,
  newName: string
): Promise<Habit | undefined> {
  const name = newName.trim();

  if (!name) {
    throw new Error('O nome do hábito não pode ficar vazio.');
  }

  return enqueueHabitMutation(async () => {
    const habits = await readHabitsFromStorage();

    const habit = habits.find(
      (item) => item.id === habitId
    );

    if (!habit) return undefined;

    const updatedHabit: Habit = {
      ...habit,
      name,
    };

    await saveHabits(
      habits.map((item) =>
        item.id === habitId ? updatedHabit : item
      )
    );

    return updatedHabit;
  });
}

export async function deleteHabit(
  habitId: string
): Promise<void> {
  return enqueueHabitMutation(async () => {
    const habits = await readHabitsFromStorage();

    const updatedHabits = habits.filter(
      (item) => item.id !== habitId
    );

    await saveHabits(updatedHabits);
  });
}

export async function updateHabitMonthlyGoal(
  habitId: string,
  month: string,
  goal: number | null
): Promise<Habit | undefined> {
  if (!isValidMonthKey(month)) {
    throw new Error('Mês inválido.');
  }

  const [year, monthNumber] = month.split('-').map(Number);

  const daysInMonth = new Date(
    year,
    monthNumber,
    0
  ).getDate();

  if (
    goal !== null &&
    (!Number.isInteger(goal) || goal < 1 || goal > daysInMonth)
  ) {
    throw new Error(
      `A meta deve ser entre 1 e ${daysInMonth} dias.`
    );
  }

  return enqueueHabitMutation(async () => {
    const habits = await readHabitsFromStorage();
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
  });
}

export function getHabitMonthlyGoal(
  habit: Habit,
  year: number,
  month: number
): number | null {
  const monthKey =
    `${year}-${String(month + 1).padStart(2, '0')}`;

  const daysInMonth =
    new Date(year, month + 1, 0).getDate();

  // Metas individuais têm prioridade.
  const individualGoal = habit.monthlyGoals?.[monthKey];

  if (individualGoal !== undefined) {
    return Math.min(individualGoal, daysInMonth);
  }

  // Procura a regra recorrente mais recente
  // que já estava ativa no mês consultado.
  const applicableRules = (
    habit.recurringMonthlyGoals ?? []
  )
    .filter((rule) => rule.startMonth <= monthKey)
    .sort((a, b) =>
      b.startMonth.localeCompare(a.startMonth)
    );

  const recurringGoal = applicableRules[0]?.goal;

  if (recurringGoal === undefined || recurringGoal === null) {
    return null;
  }

  return Math.min(recurringGoal, daysInMonth);
}

export async function updateRecurringMonthlyGoal(
  habitId: string,
  startMonth: string,
  goal: number | null
): Promise<Habit | undefined> {
  if (!isValidMonthKey(startMonth)) {
    throw new Error('Mês inválido.');
  }

  if (
    goal !== null &&
    (!Number.isInteger(goal) || goal < 1 || goal > 31)
  ) {
    throw new Error('A meta deve ser entre 1 e 31 dias.');
  }

  return enqueueHabitMutation(async () => {
    const habits = await readHabitsFromStorage();
    const habit = habits.find((item) => item.id === habitId);

    if (!habit) return undefined;

    const rules: RecurringMonthlyGoal[] = (
      habit.recurringMonthlyGoals ?? []
    ).filter((rule) => rule.startMonth !== startMonth);

    rules.push({ startMonth, goal });

    rules.sort((a, b) =>
      a.startMonth.localeCompare(b.startMonth)
    );

    const updatedHabit: Habit = {
      ...habit,
      recurringMonthlyGoals: rules,
    };

    await saveHabits(
      habits.map((item) =>
        item.id === habitId ? updatedHabit : item
      )
    );

    return updatedHabit;
  });
}

export async function updateHabitDefaultMonthlyGoal(
  habitId: string,
  goal: number | null
): Promise<Habit | undefined> {
  const today = new Date();

  const currentMonth =
    `${today.getFullYear()}-${String(
      today.getMonth() + 1
    ).padStart(2, '0')}`;

  return updateRecurringMonthlyGoal(
    habitId,
    currentMonth,
    goal
  );
}