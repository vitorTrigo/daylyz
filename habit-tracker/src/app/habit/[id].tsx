import ContributionGraph from '../../components/ContributionGraph';
import MonthlyCalendar from '../../components/MonthlyCalendar';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Modal,
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
    updateHabitMonthlyGoal,
    getHabitMonthlyGoal,
    updateHabitDefaultMonthlyGoal,
} from '../../storage/habits';

import {
  CalendarMode,
  getCalendarMode,
  saveCalendarMode,
} from '../../storage/preferences';

export default function HabitDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [calendarMode, setCalendarMode] = useState<CalendarMode>('monthly');
  const [editing, setEditing] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [processing, setProcessing] = useState(false);
  const [habit, setHabit] = useState<Habit | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingGoal, setSavingGoal] = useState(false);
  const [defaultGoalInput, setDefaultGoalInput] = useState('');
  const [menuVisible, setMenuVisible] = useState(false);
  const [defaultGoalModalVisible, setDefaultGoalModalVisible] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadPreference() {
      try {
        const savedMode = await getCalendarMode();

        if (active) {
          setCalendarMode(savedMode);
        }
      } catch {
        console.log('Não foi possível carregar a preferência.');
      }
    }

    loadPreference();

    return () => {
      active = false;
    };
  }, []);

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

    async function changeCalendarMode(mode: CalendarMode) {
      setCalendarMode(mode);

      try {
        await saveCalendarMode(mode);
      } catch {
        Alert.alert(
          'Erro',
          'Não foi possível salvar a preferência do calendário.'
        );
      }
    }

  async function handleSaveMonthlyGoal(
    month: string,
    goal: number | null
  ): Promise<boolean> {
    if (!id || savingGoal || saving || processing) {
      return false;
    }

    setSavingGoal(true);

    try {
      const updatedHabit = await updateHabitMonthlyGoal(
        id,
        month,
        goal
      );

      if (!updatedHabit) {
        Alert.alert('Erro', 'Hábito não encontrado.');
        return false;
      }

      setHabit(updatedHabit);
      return true;
    } catch {
      Alert.alert('Erro', 'Não foi possível salvar a meta.');
      return false;
    } finally {
      setSavingGoal(false);
    }
  }

    function getCurrentDefaultGoal(): number | null {
      if (!habit) return null;

      const today = new Date();

      // Não considera metas exclusivas de um mês.
      return getHabitMonthlyGoal(
        {
          ...habit,
          monthlyGoals: {},
        },
        today.getFullYear(),
        today.getMonth()
      );
    }

    function startEditingDefaultGoal() {
      const currentGoal = getCurrentDefaultGoal();

      setDefaultGoalInput(
        currentGoal === null ? '' : String(currentGoal)
      );

      setDefaultGoalModalVisible(true);
    }

    async function handleSaveDefaultGoal(goal: number | null) {
      if (!id || savingGoal || saving || processing) return;

      if (
        goal !== null &&
        (!Number.isInteger(goal) || goal < 1 || goal > 31)
      ) {
        Alert.alert('Atenção', 'Digite uma meta entre 1 e 31 dias.');
        return;
      }

      setSavingGoal(true);

      try {
        const updatedHabit = await updateHabitDefaultMonthlyGoal(
          id,
          goal
        );

        if (!updatedHabit) {
          Alert.alert('Erro', 'Hábito não encontrado.');
          return;
        }

        setHabit(updatedHabit);
        setDefaultGoalModalVisible(false);
      } catch {
        Alert.alert('Erro', 'Não foi possível salvar a meta padrão.');
      } finally {
        setSavingGoal(false);
      }
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

          <View style={styles.menuContainer}>
            <TouchableOpacity
              style={styles.menuButton}
              onPress={() => setMenuVisible(!menuVisible)}
              disabled={processing || saving || savingGoal || !habit}
              accessibilityRole="button"
              accessibilityLabel="Abrir opções do hábito"
            >
              <Text style={styles.menuButtonText}>•••</Text>
            </TouchableOpacity>

            {menuVisible && (
              <View style={styles.menuDropdown}>
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => {
                    setMenuVisible(false);
                    startEditing();
                  }}
                >
                  <Text style={styles.menuItemText}>Editar nome</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => {
                    setMenuVisible(false);
                    startEditingDefaultGoal();
                  }}
                >
                  <Text style={styles.menuItemText}>
                    Configurar meta padrão
                  </Text>
                </TouchableOpacity>

                <View style={styles.menuDivider} />

                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => {
                    setMenuVisible(false);
                    handleDelete();
                  }}
                >
                  <Text style={styles.menuDeleteText}>
                    Excluir hábito
                  </Text>
                </TouchableOpacity>
              </View>
            )}
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

            <View style={styles.defaultGoalIndicator}>
              <Text style={styles.defaultGoalIndicatorIcon}>◎</Text>

              <Text style={styles.defaultGoalIndicatorText}>
                {getCurrentDefaultGoal() === null
                  ? 'Meta padrão não definida'
                  : `Meta padrão: ${getCurrentDefaultGoal()} dias/mês`}
              </Text>
            </View>
            
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
                Dias concluídos
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
                  onPress={() => changeCalendarMode('monthly')}
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
                  onPress={() => changeCalendarMode('annual')}
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
                  monthlyGoals={habit.monthlyGoals}
                  recurringMonthlyGoals={habit.recurringMonthlyGoals}
                  onSaveGoal={handleSaveMonthlyGoal}
                  savingGoal={savingGoal}
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
          </>
        )}
            </ScrollView>

            <Modal
              visible={defaultGoalModalVisible}
              transparent
              animationType="fade"
              onRequestClose={() => {
                if (!savingGoal) {
                  setDefaultGoalModalVisible(false);
                }
              }}
            >
              <View style={styles.modalOverlay}>
                <View style={styles.modalCard}>
                  <Text style={styles.modalTitle}>
                    Meta mensal padrão
                  </Text>

                  <Text style={styles.modalDescription}>
                    Define a meta para o mês atual e os próximos,
                    sem alterar meses anteriores. Metas exclusivas
                    têm prioridade.
                  </Text>

                  <Text style={styles.editLabel}>
                    Quantos dias por mês?
                  </Text>

                  <TextInput
                    style={styles.editInput}
                    value={defaultGoalInput}
                    onChangeText={setDefaultGoalInput}
                    keyboardType="number-pad"
                    placeholder="Ex.: 20"
                    placeholderTextColor="#8b949e"
                    maxLength={2}
                  />

                  <View style={styles.editActions}>
                    <TouchableOpacity
                      style={styles.cancelEditButton}
                      onPress={() => {
                        setDefaultGoalModalVisible(false);
                      }}
                      disabled={savingGoal}
                    >
                      <Text style={styles.cancelEditText}>
                        Cancelar
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.confirmEditButton}
                      onPress={() => {
                        const value = defaultGoalInput.trim();

                        if (!/^\d+$/.test(value)) {
                          Alert.alert(
                            'Atenção',
                            'Digite uma meta válida.'
                          );
                          return;
                        }

                        handleSaveDefaultGoal(Number(value));
                      }}
                      disabled={savingGoal}
                    >
                      <Text style={styles.confirmEditText}>
                        {savingGoal ? 'Salvando...' : 'Salvar'}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {getCurrentDefaultGoal() !== null && (
                    <TouchableOpacity
                      style={styles.removeDefaultGoalButton}
                      onPress={() => handleSaveDefaultGoal(null)}
                      disabled={savingGoal}
                    >
                      <Text style={styles.removeDefaultGoalText}>
                        Remover meta padrão
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </Modal>
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
    marginBottom: 8,
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

  removeDefaultGoalButton: {
    paddingVertical: 12,
    marginTop: 10,
    alignItems: 'center',
  },

  removeDefaultGoalText: {
    color: '#f85149',
    fontSize: 13,
    fontWeight: '600',
  },
  menuContainer: {
    position: 'relative',
    zIndex: 10,
  },

  menuButton: {
    backgroundColor: '#21262d',
    borderRadius: 8,
    width: 44,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },

  menuButtonText: {
    color: '#f0f6fc',
    fontSize: 22,
    fontWeight: 'bold',
    lineHeight: 26,
  },

  menuDropdown: {
    position: 'absolute',
    top: 46,
    right: 0,
    width: 220,
    backgroundColor: '#161b22',
    borderWidth: 1,
    borderColor: '#30363d',
    borderRadius: 10,
    paddingVertical: 6,
    zIndex: 20,
    elevation: 8,
  },

  menuItem: {
    paddingHorizontal: 16,
    paddingVertical: 14,
  },

  menuItemText: {
    color: '#f0f6fc',
    fontSize: 14,
  },

  menuDivider: {
    height: 1,
    backgroundColor: '#30363d',
    marginVertical: 4,
  },

  menuDeleteText: {
    color: '#f85149',
    fontSize: 14,
    fontWeight: '600',
  },
  defaultGoalIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 24,
  },

  defaultGoalIndicatorIcon: {
    color: '#3fb950',
    fontSize: 20,
    fontWeight: 'bold',
  },

  defaultGoalIndicatorText: {
    color: '#8b949e',
    fontSize: 14,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    padding: 24,
  },

  modalCard: {
    backgroundColor: '#161b22',
    borderWidth: 1,
    borderColor: '#30363d',
    borderRadius: 16,
    padding: 24,
  },

  modalTitle: {
    color: '#f0f6fc',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
  },

  modalDescription: {
    color: '#8b949e',
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 24,
  },
});
