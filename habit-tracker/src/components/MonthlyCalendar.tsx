
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
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

const WEEK_DAYS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

function formatDate(year: number, month: number, day: number) {
  const formattedMonth = String(month + 1).padStart(2, '0');
  const formattedDay = String(day).padStart(2, '0');

  return `${year}-${formattedMonth}-${formattedDay}`;
}

export default function MonthlyCalendar({
  completedDays,
  onToggleDay,
}: MonthlyCalendarProps) {
  const today = new Date();

  const [selectedYear] = useState(today.getFullYear());

  const months = Array.from(
    {
      length:
        selectedYear === today.getFullYear()
          ? today.getMonth() + 1
          : 12,
    },
    (_, index) =>
      (selectedYear === today.getFullYear()
        ? today.getMonth()
        : 11) - index
  );

  return (
    <View style={styles.container}>
      <Text style={styles.yearTitle}>
        Calendário de {selectedYear}
      </Text>

      {months.map((month) => {
        const firstDay = new Date(
          selectedYear,
          month,
          1
        ).getDay();

        const daysInMonth = new Date(
          selectedYear,
          month + 1,
          0
        ).getDate();

        const days = Array.from(
          { length: firstDay + daysInMonth },
          (_, index) => {
            const day = index - firstDay + 1;
            return day > 0 ? day : null;
          }
        );

        const monthKey = `${selectedYear}-${String(
          month + 1
        ).padStart(2, '0')}-`;

        const completedInMonth = completedDays.filter(
          (date) => date.startsWith(monthKey)
        ).length;

        return (
          <View key={month} style={styles.monthCard}>
            <View style={styles.monthHeader}>
              <Text style={styles.monthTitle}>
                {MONTH_NAMES[month]}
              </Text>

              <Text style={styles.monthStats}>
                {completedInMonth} dias
              </Text>
            </View>

            <View style={styles.weekRow}>
              {WEEK_DAYS.map((day, index) => (
                <View key={index} style={styles.dayCell}>
                  <Text style={styles.weekDayText}>
                    {day}
                  </Text>
                </View>
              ))}
            </View>

            <View style={styles.daysGrid}>
              {days.map((day, index) => {
                if (day === null) {
                  return (
                    <View
                      key={`empty-${index}`}
                      style={styles.dayCell}
                    />
                  );
                }

                const dateKey = formatDate(
                  selectedYear,
                  month,
                  day
                );

                const isCompleted =
                  completedDays.includes(dateKey);

                const isFuture =
                  new Date(
                    selectedYear,
                    month,
                    day
                  ).getTime() >
                  new Date(
                    today.getFullYear(),
                    today.getMonth(),
                    today.getDate()
                  ).getTime();

                  if (isFuture) {
                    return (
                      <View
                        key={dateKey}
                        style={styles.dayCell}
                      />
                    );
                  }

                return (
                  <View key={dateKey} style={styles.dayCell}>
                    <TouchableOpacity
                      style={[
                        styles.dayButton,
                        isCompleted && styles.completedDay,
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
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 12,
    gap: 16,
  },

  yearTitle: {
    color: '#f0f6fc',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },

  monthCard: {
    backgroundColor: '#161b22',
    borderWidth: 1,
    borderColor: '#30363d',
    borderRadius: 14,
    padding: 14,
  },

  monthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },

  monthTitle: {
    color: '#f0f6fc',
    fontSize: 18,
    fontWeight: '600',
  },

  monthStats: {
    color: '#8b949e',
    fontSize: 12,
  },

  weekRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },

  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: 7,
  },

  dayCell: {
    width: '14.285714%',
    alignItems: 'center',
    justifyContent: 'center',
  },

  weekDayText: {
    color: '#8b949e',
    fontSize: 12,
    textAlign: 'center',
  },

  dayButton: {
    width: '88%',
    aspectRatio: 1,
    maxWidth: 43,
    borderRadius: 7,
    backgroundColor: '#21262d',
    justifyContent: 'center',
    alignItems: 'center',
  },

  completedDay: {
    backgroundColor: '#238636',
  },

  futureDay: {
    opacity: 0.3,
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
});
