import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

type Props = {
  completedDays: string[];
  onToggleDay: (date: string) => void;
};

function formatDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

export default function ContributionGraph({
  completedDays,
  onToggleDay,
}: Props) {
  const now = new Date();
  const year = now.getFullYear();
  const today = formatDate(now);

  const firstDay = new Date(year, 0, 1);
  const lastDay = new Date(year, 11, 31);

  const totalDays =
    Math.round(
      (Date.UTC(year + 1, 0, 1) -
        Date.UTC(year, 0, 1)) /
        86400000
    );

  const offset = firstDay.getDay();

  const days = [
    ...Array.from({ length: offset }, () => null),
    ...Array.from({ length: totalDays }, (_, index) =>
      formatDate(new Date(year, 0, index + 1))
    ),
  ];

  const weeks = Array.from(
    { length: Math.ceil(days.length / 7) },
    (_, index) => days.slice(index * 7, index * 7 + 7)
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Atividades em {year}</Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.graph}>
          {weeks.map((week, weekIndex) => (
            <View key={weekIndex} style={styles.column}>
              {week.map((day, dayIndex) => {
                if (!day) {
                  return (
                    <View
                      key={`empty-${dayIndex}`}
                      style={styles.emptySquare}
                    />
                  );
                }

                const completed = completedDays.includes(day);
                const future = day > today;

                return (
                  <TouchableOpacity
                    key={day}
                    disabled={future}
                    onPress={() => onToggleDay(day)}
                    style={[
                      styles.square,
                      completed && styles.completed,
                      future && styles.future,
                    ]}
                    accessibilityLabel={`${day}: ${
                      completed ? 'concluído' : 'não concluído'
                    }`}
                  />
                );
              })}
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={styles.legend}>
        <Text style={styles.legendText}>Não registrado</Text>
        <View style={styles.square} />
        <View style={[styles.square, styles.completed]} />
        <Text style={styles.legendText}>Concluído</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#161b22',
    borderRadius: 14,
    padding: 18,
    borderWidth: 1,
    borderColor: '#30363d',
  },
  title: {
    color: '#f0f6fc',
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 20,
  },
  graph: {
    flexDirection: 'row',
    gap: 4,
  },
  column: {
    flexDirection: 'column',
    gap: 4,
  },
  square: {
    width: 13,
    height: 13,
    backgroundColor: '#21262d',
    borderRadius: 3,
  },
  emptySquare: {
    width: 13,
    height: 13,
  },
  completed: {
    backgroundColor: '#3fb950',
  },
  future: {
    opacity: 0.3,
  },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 20,
  },
  legendText: {
    color: '#8b949e',
    fontSize: 11,
  },
});




