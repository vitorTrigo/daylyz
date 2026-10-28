import ContributionGraph from '../../components/ContributionGraph';
import MonthlyCalendar from '../../components/MonthlyCalendar';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

import {
    Habit,
    deleteHabit,
    getHabitById,
    toggleHabitDay,
    updateHabitName,
} from '../../storage/habits';

export default function HabitDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [calendarMode, setCalendarMode] = useState<'monthly' | 'annual'>('monthly');
  const [editing, setEditing] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [processing, setProcessing] = useState(false);
  const [habit, setHabit] = useState<Habit | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      async function loadHabit() {
        if (!id) {
          setLoading(false);
          return;
        }

        try {
          const data = await getHabitById(id);
          if (active) setHabit(data ?? null);
        } catch {
          if (active) {
            Alert.alert('Erro', 'Não foi possível carregar o hábito.');
          }
        } finally {
          if (active) setLoading(false);
        }
      }

      loadHabit();

      return () => {
        active = false;
      };
    }, [id])
  );

  async function handleToggleDay(date: string) {
    if (!id || saving) return;

    setSaving(true);

    try {
      const updatedHabit = await toggleHabitDay(id, date);

      if (updatedHabit) {
        setHabit(updatedHabit);
      }
    } catch {
      Alert.alert('Erro', 'Não foi possível salvar o registro.');
    } finally {
      setSaving(false);
    }
  }
  
    function startEditing() {
    if (!habit) return;

    setEditedName(habit.name);
    setEditing(true);
    }

    async function handleSaveName() {
    if (!id || processing) return;

    if (!editedName.trim()) {
        Alert.alert('Atenção', 'Digite um nome para o hábito.');
        return;
    }

    setProcessing(true);

    try {
        const updatedHabit = await updateHabitName(id, editedName);

        if (!updatedHabit) {
        Alert.alert('Erro', 'Hábito não encontrado.');
        return;
        }

        setHabit(updatedHabit);
        setEditing(false);
    } catch {
        Alert.alert('Erro', 'Não foi possível editar o hábito.');
    } finally {
        setProcessing(false);
    }
    }

    function handleDelete() {
    if (!id || processing) return;

    Alert.alert(
        'Excluir hábito',
        'Tem certeza que deseja excluir este hábito? Todo o histórico será apagado.',
        [
        {
            text: 'Cancelar',
            style: 'cancel',
        },
        {
            text: 'Excluir',
            style: 'destructive',
            onPress: async () => {
            if (processing) return;

            setProcessing(true);

            try {
                await deleteHabit(id);
                router.back();
            } catch {
                Alert.alert('Erro', 'Não foi possível excluir o hábito.');
            } finally {
                setProcessing(false);
            }
            },
        },
        ]
    );
    }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        
        <View style={styles.topBar}>
        <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
        >
            <Text style={styles.backText}>‹ Voltar</Text>
        </TouchableOpacity>

        <View style={styles.topActions}>
            <TouchableOpacity
            style={styles.editButton}
            onPress={startEditing}
            disabled={processing || saving || !habit}
            >
            <Text style={styles.editButtonText}>Editar</Text>
            </TouchableOpacity>

            <TouchableOpacity
            style={styles.deleteButton}
            onPress={handleDelete}
            disabled={processing || saving || !habit}
            >
            <Text style={styles.deleteButtonText}>Excluir</Text>
            </TouchableOpacity>
        </View>
        </View>


        {loading ? (
          <ActivityIndicator color="#3fb950" size="large" />
        ) : !habit ? (
          <Text style={styles.message}>
            Hábito não encontrado.
          </Text>
        ) : (
          <>
            <Text style={styles.subtitle}>SEU PROGRESSO</Text>
            <Text style={styles.title}>{habit.name}</Text>
            
            {editing && (
            <View style={styles.editContainer}>
                <Text style={styles.editLabel}>Nome do hábito</Text>

                <TextInput
                style={styles.editInput}
                value={editedName}
                onChangeText={setEditedName}
                placeholder="Nome do hábito"
                placeholderTextColor="#8b949e"
                maxLength={50}
                autoFocus
                />

                <View style={styles.editActions}>
                <TouchableOpacity
                    style={styles.cancelEditButton}
                    onPress={() => setEditing(false)}
                    disabled={processing}
                >
                    <Text style={styles.cancelEditText}>Cancelar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.confirmEditButton}
                    onPress={handleSaveName}
                    disabled={processing}
                >
                    <Text style={styles.confirmEditText}>
                    {processing ? 'Salvando...' : 'Salvar'}
                    </Text>
                </TouchableOpacity>
                </View>
            </View>
            )}


            <View style={styles.statsCard}>
              <Text style={styles.statsNumber}>
                {habit.completedDays.length}
              </Text>
              <Text style={styles.statsLabel}>
                dias concluídos
              </Text>
            </View>

            
            <View style={styles.calendarSection}>
              <Text style={styles.calendarTitle}>
                Calendário de atividades
              </Text>

              <View style={styles.calendarSwitcher}>
                <TouchableOpacity
                  style={[
                    styles.switchButton,
                    calendarMode === 'monthly' && styles.switchButtonActive,
                  ]}
                  onPress={() => setCalendarMode('monthly')}
                >
                  <Text
                    style={[
                      styles.switchText,
                      calendarMode === 'monthly' && styles.switchTextActive,
                    ]}
                  >
                    Mensal
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.switchButton,
                    calendarMode === 'annual' && styles.switchButtonActive,
                  ]}
                  onPress={() => setCalendarMode('annual')}
                >
                  <Text
                    style={[
                      styles.switchText,
                      calendarMode === 'annual' && styles.switchTextActive,
                    ]}
                  >
                    Anual
                  </Text>
                </TouchableOpacity>
              </View>

              {calendarMode === 'monthly' ? (
                <MonthlyCalendar
                  completedDays={habit.completedDays}
                  onToggleDay={handleToggleDay}
                />
              ) : (
                <ContributionGraph
                  completedDays={habit.completedDays}
                  onToggleDay={handleToggleDay}
                />
              )}
            </View>

            {saving && (
              <Text style={styles.savingText}>
                Salvando registro...
              </Text>
            )}

            <Text style={styles.footer}>
              Cada dia é uma nova oportunidade de evoluir.
            </Text>
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
  backText: {
    color: '#3fb950',
    fontSize: 17,
  },
  subtitle: {
    color: '#3fb950',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  title: {
    color: '#f0f6fc',
    fontSize: 32,
    fontWeight: 'bold',
    marginTop: 8,
    marginBottom: 28,
  },
  statsCard: {
    backgroundColor: '#161b22',
    borderWidth: 1,
    borderColor: '#30363d',
    borderRadius: 14,
    padding: 24,
    marginBottom: 20,
  },
  statsNumber: {
    color: '#3fb950',
    fontSize: 42,
    fontWeight: 'bold',
  },
  statsLabel: {
    color: '#8b949e',
    marginTop: 5,
  },
  message: {
    color: '#f0f6fc',
    fontSize: 16,
  },
  savingText: {
    color: '#8b949e',
    textAlign: 'center',
    marginTop: 12,
  },
  footer: {
    color: '#8b949e',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 32,
  },
  backButton: {
    paddingVertical: 8,
  },

  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
  },

  topActions: {
    flexDirection: 'row',
    gap: 8,
  },

    editButton: {
    backgroundColor: '#21262d',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    },

    editButtonText: {
    color: '#f0f6fc',
    fontSize: 13,
    fontWeight: '600',
    },

    deleteButton: {
    backgroundColor: '#3a2025',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    },

    deleteButtonText: {
    color: '#f85149',
    fontSize: 13,
    fontWeight: '600',
    },

    editContainer: {
    backgroundColor: '#161b22',
    borderWidth: 1,
    borderColor: '#30363d',
    borderRadius: 14,
    padding: 18,
    marginBottom: 24,
    },

    editLabel: {
    color: '#f0f6fc',
    fontSize: 14,
    marginBottom: 10,
    },

    editInput: {
    backgroundColor: '#0d1117',
    borderWidth: 1,
    borderColor: '#30363d',
    borderRadius: 8,
    padding: 12,
    color: '#f0f6fc',
    fontSize: 15,
    },

    editActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 16,
    },

    cancelEditButton: {
    padding: 12,
    },

    cancelEditText: {
    color: '#8b949e',
    },

    confirmEditButton: {
    backgroundColor: '#238636',
    borderRadius: 8,
    paddingHorizontal: 18,
    paddingVertical: 12,
    },

    confirmEditText: {
    color: '#ffffff',
    fontWeight: '600',
    },
    
    calendarSection: {
      marginTop: 12,
    },

    calendarTitle: {
      color: '#f0f6fc',
      fontSize: 18,
      fontWeight: '600',
      marginBottom: 16,
    },

    calendarSwitcher: {
      flexDirection: 'row',
      backgroundColor: '#161b22',
      borderWidth: 1,
      borderColor: '#30363d',
      borderRadius: 10,
      padding: 4,
      marginBottom: 20,
    },

    switchButton: {
      flex: 1,
      paddingVertical: 12,
      alignItems: 'center',
      borderRadius: 7,
    },

    switchButtonActive: {
      backgroundColor: '#238636',
    },

    switchText: {
      color: '#8b949e',
      fontSize: 14,
      fontWeight: '600',
    },

    switchTextActive: {
      color: '#ffffff',
    },

});
