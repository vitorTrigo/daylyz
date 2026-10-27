import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import {
  Habit,
  createHabit,
  getHabits,
} from '../storage/habits';

export default function HomeScreen() {
  const router = useRouter();

  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInput, setShowInput] = useState(false);
  const [habitName, setHabitName] = useState('');
  const [saving, setSaving] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      async function loadHabits() {
        try {
          const data = await getHabits();

          console.log('HÁBITOS CARREGADOS NA HOME:', data);

          if (active) {
            setHabits([...data]);
          }
        } catch {
          if (active) {
            Alert.alert('Erro', 'Não foi possível carregar os hábitos.');
          }
        } finally {
          if (active) setLoading(false);
        }
      }

      loadHabits();

      return () => {
        active = false;
      };
    }, [])
  );

  async function addHabit() {
    if (!habitName.trim()) {
      Alert.alert('Atenção', 'Digite o nome do hábito.');
      return;
    }

    if (saving) return;

    setSaving(true);

    try {
      const newHabit = await createHabit(habitName);

      setHabits((previous) => [...previous, newHabit]);
      setHabitName('');
      setShowInput(false);
    } catch {
      Alert.alert('Erro', 'Não foi possível salvar o hábito.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.logo}>daily.</Text>
          <Text style={styles.subtitle}>
            Pequenos passos, grandes mudanças.
          </Text>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Meus hábitos</Text>
          <Text style={styles.counter}>
            {habits.length} hábitos
          </Text>
        </View>

        {loading ? (
          <ActivityIndicator color="#3fb950" size="large" />
        ) : (
          <>
            {habits.map((habit) => (
              <TouchableOpacity
                key={habit.id}
                style={styles.habitCard}
                activeOpacity={0.8}
                onPress={() =>
                  router.push({
                    pathname: '/habit/[id]',
                    params: { id: habit.id },
                  })
                }
              >
                <View style={styles.habitHeader}>
                  <View style={styles.habitInfo}>
                    <Text style={styles.emoji}>
                      {habit.emoji}
                    </Text>

                    <View style={styles.habitText}>
                      <Text style={styles.habitName}>
                        {habit.name}
                      </Text>
                      <Text style={styles.habitStats}>
                        {habit.completedDays.length} dias concluídos
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.arrow}>›</Text>
                </View>

                <View style={styles.graph}>
                  {Array.from({ length: 14 }, (_, index) => {
                    const date = new Date();
                    date.setHours(12, 0, 0, 0);
                    date.setDate(date.getDate() - (13 - index));

                    const dateKey = [
                      date.getFullYear(),
                      String(date.getMonth() + 1).padStart(2, '0'),
                      String(date.getDate()).padStart(2, '0'),
                    ].join('-');

                    const completed =
                      habit.completedDays.includes(dateKey);

                    return (
                      <View
                        key={dateKey}
                        style={[
                          styles.graphSquare,
                          completed && styles.graphSquareActive,
                        ]}
                      />
                    );
                  })}
                </View>
              </TouchableOpacity>
            ))}

            {showInput ? (
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>
                  Nome do novo hábito
                </Text>

                <TextInput
                  style={styles.input}
                  placeholder="Ex: Ler 20 páginas"
                  placeholderTextColor="#8b949e"
                  value={habitName}
                  onChangeText={setHabitName}
                  maxLength={50}
                />

                <View style={styles.inputActions}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => {
                      setShowInput(false);
                      setHabitName('');
                    }}
                  >
                    <Text style={styles.cancelText}>
                      Cancelar
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.saveButton,
                      saving && { opacity: 0.5 },
                    ]}
                    onPress={addHabit}
                    disabled={saving}
                  >
                    <Text style={styles.saveText}>
                      {saving ? 'Salvando...' : 'Salvar hábito'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => setShowInput(true)}
              >
                <Text style={styles.addButtonText}>
                  + Criar novo hábito
                </Text>
              </TouchableOpacity>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0d1117',
  },
  content: {
    padding: 24,
    paddingTop: 60,
    paddingBottom: 50,
  },
  header: {
    marginBottom: 42,
  },
  logo: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#3fb950',
  },
  subtitle: {
    fontSize: 14,
    color: '#8b949e',
    marginTop: 6,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#f0f6fc',
  },
  counter: {
    fontSize: 13,
    color: '#8b949e',
  },
  habitCard: {
    backgroundColor: '#161b22',
    borderWidth: 1,
    borderColor: '#30363d',
    borderRadius: 14,
    padding: 18,
    marginBottom: 14,
  },
  habitHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  habitInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  habitText: {
    flexShrink: 1,
  },
  emoji: {
    fontSize: 27,
  },
  habitName: {
    color: '#f0f6fc',
    fontSize: 17,
    fontWeight: '600',
  },
  habitStats: {
    color: '#8b949e',
    fontSize: 12,
    marginTop: 5,
  },
  arrow: {
    fontSize: 30,
    color: '#8b949e',
    marginLeft: 10,
  },
  graph: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 20,
  },
  graphSquare: {
    width: 15,
    height: 15,
    borderRadius: 3,
    backgroundColor: '#21262d',
  },
  graphSquareActive: {
    backgroundColor: '#3fb950',
  },
  addButton: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#3fb950',
    borderRadius: 14,
    padding: 20,
    alignItems: 'center',
    marginTop: 12,
  },
  addButtonText: {
    color: '#3fb950',
    fontSize: 15,
    fontWeight: '600',
  },
  inputContainer: {
    backgroundColor: '#161b22',
    borderRadius: 14,
    padding: 18,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#30363d',
  },
  inputLabel: {
    color: '#f0f6fc',
    fontSize: 14,
    marginBottom: 12,
  },
  input: {
    backgroundColor: '#0d1117',
    borderWidth: 1,
    borderColor: '#30363d',
    borderRadius: 8,
    padding: 12,
    color: '#f0f6fc',
  },
  inputActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 16,
  },
  cancelButton: {
    padding: 12,
  },
  cancelText: {
    color: '#8b949e',
  },
  saveButton: {
    backgroundColor: '#238636',
    borderRadius: 8,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  saveText: {
    color: '#ffffff',
    fontWeight: '600',
  },
});
