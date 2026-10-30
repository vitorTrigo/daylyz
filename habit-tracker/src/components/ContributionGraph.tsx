import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';

type ContributionGraphProps = {
  completedDays: string[];
  onToggleDay: (date: string) => void;
};

const WEEK_DAYS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

const MONTH_NAMES = [
  'Jan', 'Fev', 'Mar', 'Abr',
  'Mai', 'Jun', 'Jul', 'Ago',
  'Set', 'Out', 'Nov', 'Dez',
];

type CalendarDay = {
  date: string;
  month: number;
};

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

export default function ContributionGraph({
  completedDays,
  onToggleDay,
}: ContributionGraphProps) {
  const today = new Date();

  const [selectedYear] = useState(today.getFullYear());

  const firstDay = new Date(selectedYear, 0, 1);
  const lastDay = new Date(selectedYear, 11, 31);

  // Começa no domingo anterior ao primeiro dia do ano.
  const calendarStart = new Date(firstDay);
  calendarStart.setDate(
    calendarStart.getDate() - calendarStart.getDay()
  );

  // Termina no sábado seguinte ao último dia do ano.
  const calendarEnd = new Date(lastDay);
  calendarEnd.setDate(
    calendarEnd.getDate() + (6 - calendarEnd.getDay())
  );

  const totalDays = Math.round(
    (Date.UTC(
      calendarEnd.getFullYear(),
      calendarEnd.getMonth(),
      calendarEnd.getDate()
    ) -
      Date.UTC(
        calendarStart.getFullYear(),
        calendarStart.getMonth(),
        calendarStart.getDate()
      )) /
      86400000
  ) + 1;

  const days: (CalendarDay | null)[] = Array.from(
    { length: totalDays },
    (_, index) => {
      const date = new Date(calendarStart);
      date.setDate(calendarStart.getDate() + index);

      // Dias de outros anos aparecem como espaços vazios.
      if (date.getFullYear() !== selectedYear) {
        return null;
      }

      const currentDay = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate()
      );

      if (date.getTime() > currentDay.getTime()) {
        return null;
      }

      return {
        date: formatDate(date),
        month: date.getMonth(),
      };
    }
  );

  // Divide os dias em semanas de sete posições.
  const weeks: (CalendarDay | null)[][] = [];

  for (let index = 0; index < days.length; index += 7) {
    weeks.push(days.slice(index, index + 7));
  }

  // Coloca as semanas mais recentes primeiro.
  // Remove semanas sem nenhum dia válido.
  const visibleWeeks = weeks
    .filter((week) => week.some((day) => day !== null))
    .reverse();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        Contribuições de {selectedYear}
      </Text>

      <View style={styles.calendar}>
        <View style={styles.weekHeader}>
          <View style={styles.monthLabelSpace} />

          {WEEK_DAYS.map((day, index) => (
            <View key={index} style={styles.dayCell}>
              <Text style={styles.weekDayText}>{day}</Text>
            </View>
          ))}
        </View>

        {visibleWeeks.map((week, weekIndex) => {
          // Identifica se um mês começa nesta semana.
          const currentMonth = week.find((day) => day !== null)?.month;

          const previousWeek = visibleWeeks[weekIndex - 1];

          const previousMonth = previousWeek?.find(
            (day) => day !== null
          )?.month;

          const monthLabel =
            currentMonth !== undefined &&
            currentMonth !== previousMonth
              ? MONTH_NAMES[currentMonth]
              : '';

          return (
            <View key={weekIndex} style={styles.weekRow}>
              <View style={styles.monthLabelSpace}>
                <Text style={styles.monthText}>
                  {monthLabel}
                </Text>
              </View>

              {week.map((day, dayIndex) => {
                if (!day) {
                  return (
                    <View
                      key={`empty-${dayIndex}`}
                      style={styles.dayCell}
                    />
                  );
                }

                const isCompleted =
                  completedDays.includes(day.date);

                return (
                  <View
                    key={day.date}
                    style={styles.dayCell}
                  >
                    <TouchableOpacity
                      style={[
                        styles.daySquare,
                        isCompleted && styles.completedSquare,
                      ]}
                      onPress={() => onToggleDay(day.date)}
                      activeOpacity={0.7}
                      accessibilityLabel={`${day.date}, ${
                        isCompleted ? 'concluído' : 'não concluído'
                      }`}
                    />
                  </View>
                );
              })}
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#161b22',
    borderWidth: 1,
    borderColor: '#30363d',
    borderRadius: 14,
    padding: 12,
    marginTop: 12,
  },

  title: {
    color: '#f0f6fc',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 20,
  },

  calendar: {
    width: '100%',
  },

  weekHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },

  weekRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },

  monthLabelSpace: {
    width: 36,
    justifyContent: 'center',
  },

  monthText: {
    color: '#8b949e',
    fontSize: 11,
    fontWeight: '600',
  },

  dayCell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  weekDayText: {
    color: '#8b949e',
    fontSize: 11,
    textAlign: 'center',
  },

  daySquare: {
    width: '90%',
    maxWidth: 35,
    aspectRatio: 1,
    borderRadius: 4,
    backgroundColor: '#21262d',
  },

  completedSquare: {
    backgroundColor: '#3fb950',
  },

  futureSquare: {
    opacity: 0.3,
  },
});