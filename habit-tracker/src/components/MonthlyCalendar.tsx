import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';

type MonthlyCalendarProps = {
  completedDays: string[];
  onToggleDay: (date: string) => void;
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
}: MonthlyCalendarProps) {
  const today = new Date();

  const [selectedMonth, setSelectedMonth] = useState(
    () => new Date(today.getFullYear(), today.getMonth(), 1)
  );

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
        <View style={styles.frequencyHeader}>
          <Text style={styles.frequencyValue}>
            {frequency}%
          </Text>

          <Text style={styles.frequencyDetails}>
            {completedInMonth} de {daysElapsed} dias
          </Text>
        </View>

        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { width: `${Math.min(frequency, 100)}%` },
            ]}
          />
        </View>

        <Text style={styles.frequencyLabel}>
          Frequência do mês
        </Text>
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
});
