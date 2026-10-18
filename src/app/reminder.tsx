import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import {
  router,
  useLocalSearchParams,
} from "expo-router";

import { Ionicons } from "@expo/vector-icons";

import {
  useTasks,
} from "../context/TaskContext";

import {
  COLORS,
  RADIUS,
} from "../constants/theme";

/* =========================
   CONSTANTES
========================= */

const MONTH_NAMES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

const WEEK_DAYS = [
  "L",
  "M",
  "M",
  "J",
  "V",
  "S",
  "D",
];

type CalendarDay = {
  day: number;

  month: number;

  year: number;

  currentMonth: boolean;
};

/* =========================
   UTILIDADES
========================= */

function formatDate(
  day: number,
  month: number,
  year: number
) {
  return `${day
    .toString()
    .padStart(
      2,
      "0"
    )}/${(month + 1)
    .toString()
    .padStart(
      2,
      "0"
    )}/${year}`;
}

function parseDate(
  value?: string
) {
  if (!value) {
    return null;
  }

  const [
    day,
    month,
    year,
  ] =
    value
      .split("/")
      .map(Number);

  if (
    !day ||
    !month ||
    !year
  ) {
    return null;
  }

  return new Date(
    year,
    month - 1,
    day
  );
}

function parseTime(
  value?: string
) {
  if (!value) {
    const now =
      new Date();

    return {
      hour:
        now.getHours(),

      minute:
        Math.floor(
          now.getMinutes() /
            5
        ) * 5,
    };
  }

  const match =
    value.match(
      /^(\d{1,2}):(\d{2})\s?(AM|PM)$/i
    );

  if (!match) {
    const now =
      new Date();

    return {
      hour:
        now.getHours(),

      minute:
        now.getMinutes(),
    };
  }

  let hour =
    Number(match[1]);

  const minute =
    Number(match[2]);

  const period =
    match[3].toUpperCase();

  if (
    period === "PM" &&
    hour !== 12
  ) {
    hour += 12;
  }

  if (
    period === "AM" &&
    hour === 12
  ) {
    hour = 0;
  }

  return {
    hour,
    minute,
  };
}

function formatTime(
  hour24: number,
  minute: number
) {
  const period =
    hour24 >= 12
      ? "PM"
      : "AM";

  const hour12 =
    hour24 % 12 || 12;

  return `${hour12}:${minute
    .toString()
    .padStart(
      2,
      "0"
    )} ${period}`;
}

function buildCalendar(
  month: number,
  year: number
): CalendarDay[][] {
  const firstDay =
    new Date(
      year,
      month,
      1
    );

  const daysInMonth =
    new Date(
      year,
      month + 1,
      0
    ).getDate();

  const firstWeekDay =
    (firstDay.getDay() +
      6) %
    7;

  const days: CalendarDay[] =
    [];

  /* MES ANTERIOR */

  for (
    let i =
      firstWeekDay - 1;
    i >= 0;
    i--
  ) {
    const previousDate =
      new Date(
        year,
        month,
        -i
      );

    days.push({
      day:
        previousDate.getDate(),

      month:
        previousDate.getMonth(),

      year:
        previousDate.getFullYear(),

      currentMonth: false,
    });
  }

  /* MES ACTUAL */

  for (
    let day = 1;
    day <=
    daysInMonth;
    day++
  ) {
    days.push({
      day,

      month,

      year,

      currentMonth: true,
    });
  }

  /* MES SIGUIENTE */

  let nextDay = 1;

  while (
    days.length % 7 !==
    0
  ) {
    const nextDate =
      new Date(
        year,
        month + 1,
        nextDay
      );

    days.push({
      day:
        nextDate.getDate(),

      month:
        nextDate.getMonth(),

      year:
        nextDate.getFullYear(),

      currentMonth: false,
    });

    nextDay++;
  }

  const weeks: CalendarDay[][] =
    [];

  for (
    let i = 0;
    i <
    days.length;
    i += 7
  ) {
    weeks.push(
      days.slice(
        i,
        i + 7
      )
    );
  }

  return weeks;
}

/* =========================
   SCREEN
========================= */

export default function ReminderScreen() {
  const params =
    useLocalSearchParams<{
      date?: string;

      taskId?: string;
    }>();

  const {
    addTask,

    updateTask,

    getTaskById,
  } = useTasks();

  const editingTask =
    params.taskId
      ? getTaskById(
          params.taskId
        )
      : undefined;

  const isEditing =
    !!editingTask;

  const initialDate =
    editingTask
      ? parseDate(
          editingTask.date
        )
      : parseDate(
          params.date
        );

  const safeInitialDate =
    initialDate ??
    new Date();

  const initialTime =
    parseTime(
      editingTask?.time
    );

  /* =========================
     CAMPOS
  ========================= */

  const [
    title,
    setTitle,
  ] =
    useState(
      editingTask?.title ??
        ""
    );

  const [
    notes,
    setNotes,
  ] =
    useState(
      editingTask?.notes ??
        ""
    );

  const [
    notificationEnabled,
    setNotificationEnabled,
  ] =
    useState(
      editingTask
        ?.notificationEnabled ??
        true
    );

  /* =========================
     FECHA
  ========================= */

  const [
    selectedDate,
    setSelectedDate,
  ] =
    useState({
      day:
        safeInitialDate.getDate(),

      month:
        safeInitialDate.getMonth(),

      year:
        safeInitialDate.getFullYear(),
    });

  const [
    calendarMonth,
    setCalendarMonth,
  ] =
    useState(
      safeInitialDate.getMonth()
    );

  const [
    calendarYear,
    setCalendarYear,
  ] =
    useState(
      safeInitialDate.getFullYear()
    );

  /* =========================
     HORA
  ========================= */

  const [
    selectedHour,
    setSelectedHour,
  ] =
    useState(
      initialTime.hour
    );

  const [
    selectedMinute,
    setSelectedMinute,
  ] =
    useState(
      initialTime.minute
    );

  /* =========================
     MODALES
  ========================= */

  const [
    dateModalVisible,
    setDateModalVisible,
  ] =
    useState(false);

  const [
    timeModalVisible,
    setTimeModalVisible,
  ] =
    useState(false);

  /*
   * Por si taskId llega
   * después del primer render.
   */

  useEffect(() => {
    if (!editingTask) {
      return;
    }

    setTitle(
      editingTask.title
    );

    setNotes(
      editingTask.notes
    );

    setNotificationEnabled(
      editingTask.notificationEnabled
    );

    const taskDate =
      parseDate(
        editingTask.date
      );

    if (taskDate) {
      setSelectedDate({
        day:
          taskDate.getDate(),

        month:
          taskDate.getMonth(),

        year:
          taskDate.getFullYear(),
      });

      setCalendarMonth(
        taskDate.getMonth()
      );

      setCalendarYear(
        taskDate.getFullYear()
      );
    }

    const taskTime =
      parseTime(
        editingTask.time
      );

    setSelectedHour(
      taskTime.hour
    );

    setSelectedMinute(
      taskTime.minute
    );
  }, [
    editingTask?.id,
  ]);

  const date =
    formatDate(
      selectedDate.day,
      selectedDate.month,
      selectedDate.year
    );

  const time =
    formatTime(
      selectedHour,
      selectedMinute
    );

  const calendarWeeks =
    useMemo(
      () =>
        buildCalendar(
          calendarMonth,
          calendarYear
        ),
      [
        calendarMonth,
        calendarYear,
      ]
    );

  /* =========================
     MESES
  ========================= */

  const goPreviousMonth =
    () => {
      if (
        calendarMonth ===
        0
      ) {
        setCalendarMonth(
          11
        );

        setCalendarYear(
          (year) =>
            year - 1
        );
      } else {
        setCalendarMonth(
          (month) =>
            month - 1
        );
      }
    };

  const goNextMonth =
    () => {
      if (
        calendarMonth ===
        11
      ) {
        setCalendarMonth(
          0
        );

        setCalendarYear(
          (year) =>
            year + 1
        );
      } else {
        setCalendarMonth(
          (month) =>
            month + 1
        );
      }
    };

  const selectDay = (
    day:
      CalendarDay
  ) => {
    setSelectedDate({
      day:
        day.day,

      month:
        day.month,

      year:
        day.year,
    });

    setCalendarMonth(
      day.month
    );

    setCalendarYear(
      day.year
    );

    setDateModalVisible(
      false
    );
  };

  const isSelectedDay = (
    day:
      CalendarDay
  ) =>
    day.day ===
      selectedDate.day &&
    day.month ===
      selectedDate.month &&
    day.year ===
      selectedDate.year;

  /* =========================
     HORA
  ========================= */

  const increaseHour =
    () => {
      setSelectedHour(
        (hour) =>
          (hour + 1) %
          24
      );
    };

  const decreaseHour =
    () => {
      setSelectedHour(
        (hour) =>
          (hour -
            1 +
            24) %
          24
      );
    };

  const increaseMinute =
    () => {
      setSelectedMinute(
        (minute) => {
          const next =
            minute + 5;

          if (
            next >= 60
          ) {
            setSelectedHour(
              (hour) =>
                (hour +
                  1) %
                24
            );

            return 0;
          }

          return next;
        }
      );
    };

  const decreaseMinute =
    () => {
      setSelectedMinute(
        (minute) => {
          const next =
            minute - 5;

          if (
            next < 0
          ) {
            setSelectedHour(
              (hour) =>
                (hour -
                  1 +
                  24) %
                24
            );

            return 55;
          }

          return next;
        }
      );
    };

  const togglePeriod =
    () => {
      setSelectedHour(
        (hour) =>
          hour >= 12
            ? hour - 12
            : hour + 12
      );
    };

  /* =========================
     GUARDAR
  ========================= */

  const handleSave =
    async () => {
      if (
        !title.trim()
      ) {
        alert(
          "Debes escribir un título."
        );

        return;
      }

      if (
        isEditing &&
        editingTask
      ) {
        await updateTask(
          editingTask.id,
          {
            title:
              title.trim(),

            date,

            time,

            notes:
              notes.trim(),

            notificationEnabled,
          }
        );
      } else {
        await addTask({
          title:
            title.trim(),

          date,

          time,

          notes:
            notes.trim(),

          notificationEnabled,
        });
      }

      router.back();
    };

  return (
    <View
      style={
        styles.container
      }
    >
      <ScrollView
        contentContainerStyle={
          styles.content
        }
        showsVerticalScrollIndicator={
          false
        }
      >
        {/* HEADER */}

        <View
          style={
            styles.header
          }
        >
          <TouchableOpacity
            onPress={() =>
              router.back()
            }
          >
            <Ionicons
              name="arrow-back"
              size={26}
              color={
                COLORS.text
              }
            />
          </TouchableOpacity>

          <Text
            style={
              styles.headerTitle
            }
          >
            {isEditing
              ? "Editar recordatorio"
              : "Nuevo recordatorio"}
          </Text>

          <View
            style={{
              width: 26,
            }}
          />
        </View>

        {/* ICONO */}

        <View
          style={
            styles.iconWrapper
          }
        >
          <View
            style={
              styles.iconCircle
            }
          >
            <Ionicons
              name={
                isEditing
                  ? "create-outline"
                  : "notifications-outline"
              }
              size={28}
              color="#FFFFFF"
            />
          </View>
        </View>

        {/* TITULO */}

        <Text
          style={
            styles.label
          }
        >
          Título
        </Text>

        <TextInput
          style={
            styles.input
          }
          value={title}
          onChangeText={
            setTitle
          }
          placeholder="Título"
          placeholderTextColor={
            COLORS.textSoft
          }
        />

        {/* FECHA */}

        <Text
          style={
            styles.label
          }
        >
          Fecha
        </Text>

        <TouchableOpacity
          style={
            styles.inputRow
          }
          onPress={() =>
            setDateModalVisible(
              true
            )
          }
        >
          <Text
            style={
              styles.inputText
            }
          >
            {date}
          </Text>

          <Ionicons
            name="calendar-outline"
            size={21}
            color={
              COLORS.text
            }
          />
        </TouchableOpacity>

        {/* HORA */}

        <Text
          style={
            styles.label
          }
        >
          Hora
        </Text>

        <TouchableOpacity
          style={
            styles.inputRow
          }
          onPress={() =>
            setTimeModalVisible(
              true
            )
          }
        >
          <Text
            style={
              styles.inputText
            }
          >
            {time}
          </Text>

          <Ionicons
            name="time-outline"
            size={22}
            color={
              COLORS.text
            }
          />
        </TouchableOpacity>

        {/* NOTAS */}

        <Text
          style={
            styles.label
          }
        >
          Notas
        </Text>

        <TextInput
          style={[
            styles.input,
            styles.notesInput,
          ]}
          value={notes}
          onChangeText={
            setNotes
          }
          placeholder="Notas"
          placeholderTextColor={
            COLORS.textSoft
          }
          multiline
        />

        {/* NOTIFICACIÓN */}

        <Text
          style={
            styles.label
          }
        >
          Notificación
        </Text>

        <View
          style={
            styles.notificationRow
          }
        >
          <View>
            <Text
              style={
                styles.notificationText
              }
            >
              {notificationEnabled
                ? "Recordarme esta tarea"
                : "Sin recordatorio"}
            </Text>

            <Text
              style={
                styles.notificationHint
              }
            >
              {notificationEnabled
                ? "LUMI te avisará a la hora indicada"
                : "No se programará ninguna alerta"}
            </Text>
          </View>

          <Switch
            value={
              notificationEnabled
            }
            onValueChange={
              setNotificationEnabled
            }
            trackColor={{
              false:
                "#3A4158",

              true:
                COLORS.primary,
            }}
            thumbColor={
              Platform.OS ===
              "android"
                ? "#FFFFFF"
                : undefined
            }
          />
        </View>

        {/* GUARDAR */}

        <TouchableOpacity
          style={
            styles.saveButton
          }
          onPress={
            handleSave
          }
        >
          <Ionicons
            name={
              isEditing
                ? "checkmark-outline"
                : "save-outline"
            }
            size={21}
            color="#FFFFFF"
          />

          <Text
            style={
              styles.saveButtonText
            }
          >
            {isEditing
              ? "Guardar cambios"
              : "Guardar recordatorio"}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* MODAL FECHA */}

      <Modal
        visible={
          dateModalVisible
        }
        transparent
        animationType="fade"
        onRequestClose={() =>
          setDateModalVisible(
            false
          )
        }
      >
        <View
          style={
            styles.modalOverlay
          }
        >
          <View
            style={
              styles.modalCard
            }
          >
            <View
              style={
                styles.modalHeader
              }
            >
              <Text
                style={
                  styles.modalTitle
                }
              >
                Seleccionar fecha
              </Text>

              <TouchableOpacity
                onPress={() =>
                  setDateModalVisible(
                    false
                  )
                }
              >
                <Ionicons
                  name="close"
                  size={24}
                  color={
                    COLORS.text
                  }
                />
              </TouchableOpacity>
            </View>

            <View
              style={
                styles.monthSelector
              }
            >
              <TouchableOpacity
                onPress={
                  goPreviousMonth
                }
              >
                <Ionicons
                  name="chevron-back"
                  size={23}
                  color={
                    COLORS.text
                  }
                />
              </TouchableOpacity>

              <Text
                style={
                  styles.monthText
                }
              >
                {
                  MONTH_NAMES[
                    calendarMonth
                  ]
                }{" "}
                {
                  calendarYear
                }
              </Text>

              <TouchableOpacity
                onPress={
                  goNextMonth
                }
              >
                <Ionicons
                  name="chevron-forward"
                  size={23}
                  color={
                    COLORS.text
                  }
                />
              </TouchableOpacity>
            </View>

            <View
              style={
                styles.weekHeader
              }
            >
              {WEEK_DAYS.map(
                (
                  day,
                  index
                ) => (
                  <Text
                    key={
                      index
                    }
                    style={
                      styles.weekText
                    }
                  >
                    {day}
                  </Text>
                )
              )}
            </View>

            <View
              style={
                styles.calendar
              }
            >
              {calendarWeeks.map(
                (
                  week,
                  weekIndex
                ) => (
                  <View
                    key={
                      weekIndex
                    }
                    style={
                      styles.weekRow
                    }
                  >
                    {week.map(
                      (
                        day,
                        dayIndex
                      ) => {
                        const active =
                          isSelectedDay(
                            day
                          );

                        return (
                          <TouchableOpacity
                            key={`${weekIndex}-${dayIndex}`}
                            style={[
                              styles.dayCell,

                              active &&
                                styles.activeDay,
                            ]}
                            onPress={() =>
                              selectDay(
                                day
                              )
                            }
                          >
                            <Text
                              style={[
                                styles.dayText,

                                !day.currentMonth &&
                                  styles.otherMonthDay,

                                active &&
                                  styles.activeDayText,
                              ]}
                            >
                              {
                                day.day
                              }
                            </Text>
                          </TouchableOpacity>
                        );
                      }
                    )}
                  </View>
                )
              )}
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL HORA */}

      <Modal
        visible={
          timeModalVisible
        }
        transparent
        animationType="fade"
        onRequestClose={() =>
          setTimeModalVisible(
            false
          )
        }
      >
        <View
          style={
            styles.modalOverlay
          }
        >
          <View
            style={[
              styles.modalCard,
              styles.timeModalCard,
            ]}
          >
            <View
              style={
                styles.modalHeader
              }
            >
              <Text
                style={
                  styles.modalTitle
                }
              >
                Seleccionar hora
              </Text>

              <TouchableOpacity
                onPress={() =>
                  setTimeModalVisible(
                    false
                  )
                }
              >
                <Ionicons
                  name="close"
                  size={24}
                  color={
                    COLORS.text
                  }
                />
              </TouchableOpacity>
            </View>

            <View
              style={
                styles.timePicker
              }
            >
              <View
                style={
                  styles.timeColumn
                }
              >
                <TouchableOpacity
                  onPress={
                    increaseHour
                  }
                >
                  <Ionicons
                    name="chevron-up"
                    size={28}
                    color={
                      COLORS.text
                    }
                  />
                </TouchableOpacity>

                <Text
                  style={
                    styles.timeNumber
                  }
                >
                  {(
                    selectedHour %
                      12 ||
                    12
                  )
                    .toString()
                    .padStart(
                      2,
                      "0"
                    )}
                </Text>

                <TouchableOpacity
                  onPress={
                    decreaseHour
                  }
                >
                  <Ionicons
                    name="chevron-down"
                    size={28}
                    color={
                      COLORS.text
                    }
                  />
                </TouchableOpacity>
              </View>

              <Text
                style={
                  styles.timeSeparator
                }
              >
                :
              </Text>

              <View
                style={
                  styles.timeColumn
                }
              >
                <TouchableOpacity
                  onPress={
                    increaseMinute
                  }
                >
                  <Ionicons
                    name="chevron-up"
                    size={28}
                    color={
                      COLORS.text
                    }
                  />
                </TouchableOpacity>

                <Text
                  style={
                    styles.timeNumber
                  }
                >
                  {selectedMinute
                    .toString()
                    .padStart(
                      2,
                      "0"
                    )}
                </Text>

                <TouchableOpacity
                  onPress={
                    decreaseMinute
                  }
                >
                  <Ionicons
                    name="chevron-down"
                    size={28}
                    color={
                      COLORS.text
                    }
                  />
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={
                  styles.periodButton
                }
                onPress={
                  togglePeriod
                }
              >
                <Text
                  style={
                    styles.periodText
                  }
                >
                  {selectedHour >=
                  12
                    ? "PM"
                    : "AM"}
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={
                styles.confirmButton
              }
              onPress={() =>
                setTimeModalVisible(
                  false
                )
              }
            >
              <Text
                style={
                  styles.confirmButtonText
                }
              >
                Confirmar
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

/* =========================
   ESTILOS
========================= */

const styles =
  StyleSheet.create({
    container: {
      flex: 1,

      backgroundColor:
        COLORS.background,
    },

    content: {
      width: "100%",

      maxWidth: 480,

      alignSelf:
        "center",

      paddingHorizontal:
        18,

      paddingTop: 24,

      paddingBottom: 30,
    },

    header: {
      flexDirection: "row",

      alignItems:
        "center",

      justifyContent:
        "space-between",

      marginBottom: 24,
    },

    headerTitle: {
      color: COLORS.text,

      fontSize: 21,

      fontWeight: "500",
    },

    iconWrapper: {
      alignItems:
        "center",

      marginBottom: 24,
    },

    iconCircle: {
      width: 56,

      height: 56,

      borderRadius: 28,

      backgroundColor:
        COLORS.primary,

      justifyContent:
        "center",

      alignItems:
        "center",
    },

    label: {
      color: COLORS.text,

      fontSize: 14,

      marginBottom: 8,

      marginTop: 6,
    },

    input: {
      width: "100%",

      minHeight: 50,

      backgroundColor:
        COLORS.surface2,

      borderRadius:
        RADIUS.md,

      color: COLORS.text,

      paddingHorizontal:
        14,

      marginBottom: 14,

      borderWidth: 1,

      borderColor:
        COLORS.border,

      outlineStyle:
        "none" as any,
    },

    notesInput: {
      minHeight: 88,

      textAlignVertical:
        "top",

      paddingTop: 14,
    },

    inputRow: {
      width: "100%",

      height: 50,

      backgroundColor:
        COLORS.surface2,

      borderRadius:
        RADIUS.md,

      flexDirection: "row",

      alignItems:
        "center",

      justifyContent:
        "space-between",

      paddingHorizontal:
        14,

      marginBottom: 14,

      borderWidth: 1,

      borderColor:
        COLORS.border,
    },

    inputText: {
      color: COLORS.text,

      fontSize: 14,
    },

    notificationRow: {
      width: "100%",

      height: 52,

      backgroundColor:
        COLORS.surface2,

      borderRadius:
        RADIUS.md,

      flexDirection: "row",

      alignItems:
        "center",

      justifyContent:
        "space-between",

      paddingHorizontal:
        14,

      marginBottom: 26,

      borderWidth: 1,

      borderColor:
        COLORS.border,
    },

    notificationText: {
      color:
        COLORS.text,

      fontSize: 13,

      fontWeight: "500",
    },

    notificationHint: {
      color:
        COLORS.textMuted,

      fontSize: 9,

      marginTop: 3,
    },

    saveButton: {
      width: "100%",

      height: 52,

      backgroundColor:
        COLORS.primary,

      borderRadius:
        RADIUS.md,

      flexDirection: "row",

      alignItems:
        "center",

      justifyContent:
        "center",

      gap: 8,
    },

    saveButtonText: {
      color: "#FFFFFF",

      fontSize: 15,

      fontWeight: "600",
    },

    modalOverlay: {
      flex: 1,

      backgroundColor:
        "rgba(0,0,0,0.72)",

      justifyContent:
        "center",

      alignItems:
        "center",

      padding: 20,
    },

    modalCard: {
      width: "100%",

      maxWidth: 420,

      backgroundColor:
        COLORS.surface,

      borderRadius:
        RADIUS.lg,

      padding: 18,

      borderWidth: 1,

      borderColor:
        COLORS.border,
    },

    modalHeader: {
      flexDirection: "row",

      alignItems:
        "center",

      justifyContent:
        "space-between",

      marginBottom: 20,
    },

    modalTitle: {
      color: COLORS.text,

      fontSize: 18,

      fontWeight: "600",
    },

    monthSelector: {
      flexDirection: "row",

      justifyContent:
        "space-between",

      alignItems:
        "center",

      marginBottom: 18,
    },

    monthText: {
      color: COLORS.text,

      fontSize: 15,

      fontWeight: "500",
    },

    weekHeader: {
      flexDirection: "row",

      marginBottom: 8,
    },

    weekText: {
      flex: 1,

      textAlign:
        "center",

      color:
        COLORS.textMuted,

      fontSize: 12,
    },

    calendar: {
      backgroundColor:
        COLORS.surface2,

      borderRadius:
        RADIUS.md,

      padding: 7,
    },

    weekRow: {
      flexDirection: "row",
    },

    dayCell: {
      flex: 1,

      aspectRatio: 1,

      justifyContent:
        "center",

      alignItems:
        "center",

      margin: 2,
    },

    activeDay: {
      backgroundColor:
        COLORS.primary,

      borderRadius: 999,
    },

    dayText: {
      color: COLORS.text,

      fontSize: 12,
    },

    otherMonthDay: {
      color:
        COLORS.textSoft,

      opacity: 0.4,
    },

    activeDayText: {
      color: "#FFFFFF",

      fontWeight: "700",
    },

    timeModalCard: {
      maxWidth: 340,
    },

    timePicker: {
      flexDirection: "row",

      alignItems:
        "center",

      justifyContent:
        "center",

      marginVertical: 16,
    },

    timeColumn: {
      alignItems:
        "center",
    },

    timeNumber: {
      color: COLORS.text,

      fontSize: 40,

      fontWeight: "300",

      minWidth: 60,

      textAlign:
        "center",
    },

    timeSeparator: {
      color: COLORS.text,

      fontSize: 36,

      marginHorizontal:
        6,
    },

    periodButton: {
      backgroundColor:
        COLORS.primary,

      borderRadius:
        RADIUS.md,

      marginLeft: 16,

      paddingHorizontal:
        14,

      paddingVertical:
        12,
    },

    periodText: {
      color: "#FFFFFF",

      fontSize: 15,

      fontWeight: "600",
    },

    confirmButton: {
      backgroundColor:
        COLORS.primary,

      borderRadius:
        RADIUS.md,

      height: 46,

      justifyContent:
        "center",

      alignItems:
        "center",

      marginTop: 10,
    },

    confirmButtonText: {
      color: "#FFFFFF",

      fontSize: 14,

      fontWeight: "600",
    },
  });