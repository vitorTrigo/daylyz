import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
} from 'react-native';

import {
  getHabitMonthlyGoal,
  type Habit,
} from '../storage/habits';

type MonthlyCalendarProps = {
  completedDays: string[];
  onToggleDay: (date: string) => void;
  monthlyGoals?: Record<string, number>;
  recurringMonthlyGoals?: Habit['recurringMonthlyGoals'];
  onSaveGoal: (
    month: string,
    goal: number | null
  ) => Promise<boolean>;
  savingGoal?: boolean;
};

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril',
  'Maio', 'Junho', 'Julho', 'Agosto',
  'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

const WEEK_DAYS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

function formatDate(
  year: number,
  month: number,
  day: number
): string {
  return [
    year,
    String(month + 1).padStart(2, '0'),
    String(day).padStart(2, '0'),
  ].join('-');
}

export default function MonthlyCalendar({
  completedDays,
  onToggleDay,
  monthlyGoals = {},
  recurringMonthlyGoals = [],
  onSaveGoal,  
  savingGoal = false,
}: MonthlyCalendarProps) {
  const today = new Date();

  const [selectedMonth, setSelectedMonth] = useState(
    () => new Date(today.getFullYear(), today.getMonth(), 1)
  );

  const [editingGoalMonth, setEditingGoalMonth] =
  useState<string | null>(null);

  const [goalInput, setGoalInput] = useState('');

  const year = selectedMonth.getFullYear();
  const month = selectedMonth.getMonth();

  const firstWeekDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const currentDay = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );

  const isCurrentMonth =
    year === today.getFullYear() &&
    month === today.getMonth();

  const daysElapsed = isCurrentMonth
    ? today.getDate()
    : daysInMonth;

  const monthKey = `${year}-${String(month + 1).padStart(2, '0')}-`;

  const completedInMonth = completedDays.filter(
    (date) => date.startsWith(monthKey)
  ).length;

  const frequency =
    daysElapsed > 0
      ? Math.round((completedInMonth / daysElapsed) * 100)
      : 0;

  const selectedMonthKey =
    `${year}-${String(month + 1).padStart(2, '0')}`;

  const configuredGoal = monthlyGoals[selectedMonthKey];

  const monthlyGoal = getHabitMonthlyGoal(
    {
      id: '',
      name: '',
      emoji: '',
      completedDays,
      monthlyGoals,
      recurringMonthlyGoals,
    },
    year,
    month
  );

  const goalProgress =
    monthlyGoal !== null
      ? Math.round((completedInMonth / monthlyGoal) * 100)
      : null;

  const isEditingGoal = editingGoalMonth === selectedMonthKey;

  function startEditingGoal() {
    setGoalInput(
      monthlyGoal === null ? '' : String(monthlyGoal)
    );

    setEditingGoalMonth(selectedMonthKey);
  }

  async function handleSaveGoal() {
    const trimmed = goalInput.trim();

    if (!trimmed) {
      Alert.alert('Atenção', 'Digite uma meta mensal.');
      return;
    }

    const goal = Number(trimmed);

    if (
      !Number.isInteger(goal) ||
      goal < 1 ||
      goal > daysInMonth
    ) {
      Alert.alert(
        'Meta inválida',
        `Digite um número inteiro entre 1 e ${daysInMonth}.`
      );
      return;
    }

    const saved = await onSaveGoal(selectedMonthKey, goal);

    if (saved) {
      setEditingGoalMonth(null);
    }
  }

  async function handleRemoveGoal() {
    // Remove apenas uma meta individual.
    if (configuredGoal === undefined) {
      return;
    }

    const saved = await onSaveGoal(selectedMonthKey, null);

    if (saved) {
      setEditingGoalMonth(null);
    }
  }

  const days = Array.from(
    { length: Math.ceil((firstWeekDay + daysInMonth) / 7) * 7 },
    (_, index) => index - firstWeekDay + 1
  );

  function changeMonth(direction: number) {
    setSelectedMonth(
      new Date(year, month + direction, 1)
    );
  }

  return (
    <View style={styles.wrapper}>

      {/* CARTÃO DO CALENDÁRIO */}
      <View style={styles.container}>

        <View style={styles.navigation}>
          <TouchableOpacity
            style={styles.arrowButton}
            onPress={() => changeMonth(-1)}
            accessibilityLabel="Mês anterior"
          >
            <Text style={styles.arrowText}>‹</Text>
          </TouchableOpacity>

          <Text style={styles.monthTitle}>
            {MONTH_NAMES[month]} {year}
          </Text>

          <TouchableOpacity
            style={[
              styles.arrowButton,
              isCurrentMonth && styles.arrowDisabled,
            ]}
            onPress={() => changeMonth(1)}
            disabled={isCurrentMonth}
            accessibilityLabel="Próximo mês"
          >
            <Text style={styles.arrowText}>›</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.weekHeader}>
          {WEEK_DAYS.map((day, index) => (
            <View key={index} style={styles.dayCell}>
              <Text style={styles.weekDayText}>{day}</Text>
            </View>
          ))}
        </View>

        <View style={styles.daysGrid}>
          {days.map((day, index) => {
            if (day < 1 || day > daysInMonth) {
              return (
                <View
                  key={`empty-${index}`}
                  style={styles.dayCell}
                />
              );
            }

            const dateKey = formatDate(year, month, day);
            const date = new Date(year, month, day);

            if (date.getTime() > currentDay.getTime()) {
              return (
                <View
                  key={dateKey}
                  style={styles.dayCell}
                />
              );
            }

            const isCompleted = completedDays.includes(dateKey);
            const isToday = date.getTime() === currentDay.getTime();

            return (
              <View key={dateKey} style={styles.dayCell}>
                <TouchableOpacity
                  style={[
                    styles.dayButton,
                    isCompleted && styles.completedDay,
                    isToday && styles.todayBorder,
                  ]}
                  onPress={() => onToggleDay(dateKey)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.dayText,
                      isCompleted && styles.completedText,
                    ]}
                  >
                    {day}
                  </Text>
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
      </View>

      <View style={styles.frequencyCard}>
        <View style={styles.goalTitleRow}>
          <Text style={styles.goalTitle}>
            Meta de {MONTH_NAMES[month].toLowerCase()}
          </Text>

          {!isEditingGoal && (
            <TouchableOpacity
              onPress={startEditingGoal}
              disabled={savingGoal}
            >
              <Text style={styles.goalAction}>
                {configuredGoal === undefined
                  ? '+ Meta exclusiva'
                  : 'Editar meta exclusiva'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {isEditingGoal && (
          <View style={styles.goalEditor}>
            <TextInput
              style={styles.goalInput}
              value={goalInput}
              onChangeText={setGoalInput}
              keyboardType="number-pad"
              placeholder="Ex: 16"
              placeholderTextColor="#8b949e"
              maxLength={2}
            />

            <TouchableOpacity
              style={styles.goalSaveButton}
              onPress={handleSaveGoal}
              disabled={savingGoal}
            >
              <Text style={styles.goalSaveText}>
                {savingGoal ? 'Salvando...' : 'Salvar'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setEditingGoalMonth(null)}
              disabled={savingGoal}
            >
              <Text style={styles.goalCancelText}>Cancelar</Text>
            </TouchableOpacity>

            {configuredGoal !== undefined && (
              <TouchableOpacity
                onPress={handleRemoveGoal}
                disabled={savingGoal}
              >
                <Text style={styles.goalRemoveText}>
                  Voltar à meta padrão
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {monthlyGoal !== null && goalProgress !== null && (
          <>
            <View style={styles.frequencyHeader}>
              <Text style={styles.frequencyValue}>
                {goalProgress}%
              </Text>

              <Text style={styles.frequencyDetails}>
                {completedInMonth} de {monthlyGoal} dias
              </Text>
            </View>

            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${Math.min(goalProgress, 100)}%` },
                ]}
              />
            </View>

            <View style={styles.goalProgressFooter}>
              <Text style={styles.frequencyLabel}>
                Progresso da meta
              </Text>

              <Text style={styles.frequencyLabel}>
                {completedInMonth >= monthlyGoal
                  ? 'Meta atingida!'
                  : `Faltam ${monthlyGoal - completedInMonth} dias`}
              </Text>
            </View>
          </>
        )}

        <View
          style={[
            styles.monthlyFrequencyRow,
            monthlyGoal === null && styles.monthlyFrequencyStandalone,
          ]}
        >
          <Text style={styles.frequencyLabel}>
            {isCurrentMonth
              ? 'Frequência até hoje'
              : 'Frequência do mês'}
          </Text>

          <Text style={styles.monthlyFrequencyValue}>
            {frequency}%
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginTop: 12,
    gap: 14,
  },

  container: {
    backgroundColor: '#161b22',
    borderWidth: 1,
    borderColor: '#30363d',
    borderRadius: 14,
    padding: 16,
  },

  navigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },

  arrowButton: {
    width: 38,
    height: 38,
    borderRadius: 8,
    backgroundColor: '#21262d',
    alignItems: 'center',
    justifyContent: 'center',
  },

  arrowDisabled: {
    opacity: 0.3,
  },

  arrowText: {
    color: '#f0f6fc',
    fontSize: 28,
    lineHeight: 32,
  },

  monthTitle: {
    color: '#f0f6fc',
    fontSize: 18,
    fontWeight: '600',
  },

  weekHeader: {
    flexDirection: 'row',
    marginBottom: 10,
  },

  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: 8,
  },

  dayCell: {
    width: '14.285714%',
    alignItems: 'center',
    justifyContent: 'center',
  },

  weekDayText: {
    color: '#8b949e',
    fontSize: 12,
  },

  dayButton: {
    width: '88%',
    maxWidth: 43,
    aspectRatio: 1,
    borderRadius: 7,
    backgroundColor: '#21262d',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },

  completedDay: {
    backgroundColor: '#238636',
  },

  todayBorder: {
    borderColor: '#3fb950',
  },

  dayText: {
    color: '#8b949e',
    fontSize: 12,
    fontWeight: '500',
  },

  completedText: {
    color: '#ffffff',
    fontWeight: 'bold',
  },

  frequencyCard: {
    backgroundColor: '#161b22',
    borderWidth: 1,
    borderColor: '#30363d',
    borderRadius: 14,
    padding: 18,
  },

  frequencyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },

  frequencyLabel: {
    color: '#8b949e',
    fontSize: 12,
  },

  frequencyValue: {
    color: '#3fb950',
    fontSize: 30,
    fontWeight: 'bold',
  },

  frequencyDetails: {
    color: '#8b949e',
    fontSize: 12,
  },

  progressBar: {
    height: 5,
    backgroundColor: '#21262d',
    borderRadius: 5,
    overflow: 'hidden',
  },

  progressFill: {
    height: '100%',
    backgroundColor: '#238636',
    borderRadius: 5,
  },
  
  goalTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },

  goalTitle: {
    color: '#f0f6fc',
    fontSize: 15,
    fontWeight: '600',
  },

  goalAction: {
    color: '#3fb950',
    fontSize: 12,
    fontWeight: '600',
  },

  goalEditor: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },

  goalInput: {
    backgroundColor: '#0d1117',
    borderWidth: 1,
    borderColor: '#30363d',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#f0f6fc',
    minWidth: 75,
  },

  goalSaveButton: {
    backgroundColor: '#238636',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },

  goalSaveText: {
    color: '#ffffff',
    fontWeight: '600',
  },

  goalCancelText: {
    color: '#8b949e',
    fontSize: 13,
  },

  goalRemoveText: {
    color: '#f85149',
    fontSize: 13,
  },

  monthlyFrequencyRow: {
    borderTopWidth: 1,
    borderTopColor: '#30363d',
    marginTop: 20,
    paddingTop: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  monthlyFrequencyStandalone: {
    marginTop: 0,
    paddingTop: 0,
    borderTopWidth: 0,
  },
  monthlyFrequencyValue: {
    color: '#f0f6fc',
    fontSize: 15,
    fontWeight: '600',
  },
  goalProgressLabel: {
    marginTop: 10,
  },
  goalProgressFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  goalTypeLabel: {
    color: '#8b949e',
    fontSize: 12,
    marginBottom: 14,
  },
});
