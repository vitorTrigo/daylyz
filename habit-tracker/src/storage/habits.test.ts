/// <reference types="jest" />

import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  getHabits,
  toggleHabitDay,
} from './habits';

jest.mock(
  '@react-native-async-storage/async-storage',
  () =>
    require(
      '@react-native-async-storage/async-storage/jest/async-storage-mock'
    )
);

describe('Armazenamento dos hábitos', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  test('preserva duas marcações simultâneas', async () => {
    const habits = await getHabits();
    const habitId = habits[0].id;

    await Promise.all([
      toggleHabitDay(habitId, '2026-11-10'),
      toggleHabitDay(habitId, '2026-11-11'),
    ]);

    const updatedHabits = await getHabits();

    const updatedHabit = updatedHabits.find(
      (habit) => habit.id === habitId
    );

    expect(updatedHabit).toBeDefined();

    expect(updatedHabit?.completedDays).toContain(
      '2026-11-10'
    );

    expect(updatedHabit?.completedDays).toContain(
      '2026-11-11'
    );

    expect(updatedHabit?.completedDays).toHaveLength(2);
  });

  test('continua funcionando após uma falha de gravação', async () => {
    const habits = await getHabits();
    const habitId = habits[0]?.id;

    if (!habitId) {
        throw new Error('Nenhum hábito encontrado para o teste.');
    }

    const setItemMock = AsyncStorage.setItem as jest.MockedFunction<
        typeof AsyncStorage.setItem
    >;

    // Apenas a próxima gravação irá falhar.
    setItemMock.mockRejectedValueOnce(
        new Error('Falha simulada de armazenamento')
    );

    // Primeira operação: deve falhar.
    await expect(
        toggleHabitDay(habitId, '2026-11-12')
    ).rejects.toThrow('Falha simulada de armazenamento');

    // Segunda operação: deve funcionar normalmente.
    await toggleHabitDay(habitId, '2026-11-13');

    const updatedHabits = await getHabits();

    const updatedHabit = updatedHabits.find(
        (habit) => habit.id === habitId
    );

    expect(updatedHabit?.completedDays).toContain(
        '2026-11-13'
    );

    expect(updatedHabit?.completedDays).not.toContain(
        '2026-11-12'
    );
  });

  test('inicializa os hábitos com duas leituras simultâneas', async () => {
    const [firstResult, secondResult] = await Promise.all([
        getHabits(),
        getHabits(),
    ]);

    expect(firstResult).toHaveLength(3);
    expect(secondResult).toEqual(firstResult);

    const storedData = await AsyncStorage.getItem(
        '@dailyz:habits'
    );

    expect(storedData).not.toBeNull();

    const storedHabits = JSON.parse(storedData!);

    expect(storedHabits).toEqual(firstResult);
  });
});
