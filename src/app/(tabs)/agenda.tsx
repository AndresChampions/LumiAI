import {
  useMemo,
  useState,
} from "react";

import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import {
  Ionicons,
} from "@expo/vector-icons";

import {
  router,
} from "expo-router";

import {
  COLORS,
  RADIUS,
} from "../../constants/theme";

import {
  useTasks,
} from "../../context/TaskContext";

/* =========================================================
   CONSTANTES
========================================================= */

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

/* =========================================================
   TIPOS
========================================================= */

type CalendarDay = {
  day: number;
  month: number;
  year: number;
  currentMonth: boolean;
};

/* =========================================================
   UTILIDADES
========================================================= */

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
    )}/${(
    month + 1
  )
    .toString()
    .padStart(
      2,
      "0"
    )}/${year}`;
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

  /*
   * Domingo = 0
   * lo convertimos a
   * Lunes = 0
   */

  const firstWeekDay =
    (
      firstDay.getDay() +
      6
    ) %
    7;

  const calendarDays:
    CalendarDay[] =
      [];

  /* =========================
     MES ANTERIOR
  ========================= */

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

    calendarDays.push({
      day:
        previousDate.getDate(),

      month:
        previousDate.getMonth(),

      year:
        previousDate.getFullYear(),

      currentMonth:
        false,
    });
  }

  /* =========================
     MES ACTUAL
  ========================= */

  for (
    let day = 1;
    day <=
    daysInMonth;
    day++
  ) {
    calendarDays.push({
      day,
      month,
      year,
      currentMonth:
        true,
    });
  }

  /* =========================
     MES SIGUIENTE
  ========================= */

  let nextDay = 1;

  while (
    calendarDays.length %
      7 !==
    0
  ) {
    const nextDate =
      new Date(
        year,
        month + 1,
        nextDay
      );

    calendarDays.push({
      day:
        nextDate.getDate(),

      month:
        nextDate.getMonth(),

      year:
        nextDate.getFullYear(),

      currentMonth:
        false,
    });

    nextDay++;
  }

  const weeks:
    CalendarDay[][] =
      [];

  for (
    let i = 0;
    i <
    calendarDays.length;
    i += 7
  ) {
    weeks.push(
      calendarDays.slice(
        i,
        i + 7
      )
    );
  }

  return weeks;
}

function getWeekDayName(
  day: number,
  month: number,
  year: number
) {
  return new Date(
    year,
    month,
    day
  ).toLocaleDateString(
    "es-ES",
    {
      weekday:
        "long",
    }
  );
}

/* =========================================================
   SCREEN
========================================================= */

export default function AgendaScreen() {
  const {
    tasks,
  } =
    useTasks();

  const today =
    new Date();

  const [
    visibleMonth,
    setVisibleMonth,
  ] =
    useState(
      today.getMonth()
    );

  const [
    visibleYear,
    setVisibleYear,
  ] =
    useState(
      today.getFullYear()
    );

  const [
    selectedDate,
    setSelectedDate,
  ] =
    useState({
      day:
        today.getDate(),

      month:
        today.getMonth(),

      year:
        today.getFullYear(),
    });

  /* =========================================================
     CALENDARIO
  ========================================================= */

  const calendarWeeks =
    useMemo(
      () =>
        buildCalendar(
          visibleMonth,
          visibleYear
        ),

      [
        visibleMonth,
        visibleYear,
      ]
    );

  const selectedDateString =
    formatDate(
      selectedDate.day,
      selectedDate.month,
      selectedDate.year
    );

  const todayString =
    formatDate(
      today.getDate(),
      today.getMonth(),
      today.getFullYear()
    );

  const agendaItems =
    tasks.filter(
      (
        task
      ) =>
        task.date ===
        selectedDateString
    );

  /* =========================================================
     NAVEGAR MESES
  ========================================================= */

  const goPreviousMonth =
    () => {
      if (
        visibleMonth ===
        0
      ) {
        setVisibleMonth(
          11
        );

        setVisibleYear(
          (
            year
          ) =>
            year - 1
        );
      } else {
        setVisibleMonth(
          (
            month
          ) =>
            month - 1
        );
      }
    };

  const goNextMonth =
    () => {
      if (
        visibleMonth ===
        11
      ) {
        setVisibleMonth(
          0
        );

        setVisibleYear(
          (
            year
          ) =>
            year + 1
        );
      } else {
        setVisibleMonth(
          (
            month
          ) =>
            month + 1
        );
      }
    };

  /* =========================================================
     VOLVER A HOY
  ========================================================= */

  const goToday =
    () => {
      const currentDate =
        new Date();

      setVisibleMonth(
        currentDate.getMonth()
      );

      setVisibleYear(
        currentDate.getFullYear()
      );

      setSelectedDate({
        day:
          currentDate.getDate(),

        month:
          currentDate.getMonth(),

        year:
          currentDate.getFullYear(),
      });
    };

  /* =========================================================
     SELECCIONAR DÍA
  ========================================================= */

  const selectCalendarDay =
    (
      calendarDay:
        CalendarDay
    ) => {
      setSelectedDate({
        day:
          calendarDay.day,

        month:
          calendarDay.month,

        year:
          calendarDay.year,
      });

      /*
       * Si se toca un día del
       * mes anterior o siguiente,
       * navegamos a ese mes.
       */

      if (
        !calendarDay.currentMonth
      ) {
        setVisibleMonth(
          calendarDay.month
        );

        setVisibleYear(
          calendarDay.year
        );
      }
    };

  const isSelected =
    (
      calendarDay:
        CalendarDay
    ) => {
      return (
        calendarDay.day ===
          selectedDate.day &&
        calendarDay.month ===
          selectedDate.month &&
        calendarDay.year ===
          selectedDate.year
      );
    };

  const isToday =
    (
      calendarDay:
        CalendarDay
    ) => {
      return (
        calendarDay.day ===
          today.getDate() &&
        calendarDay.month ===
          today.getMonth() &&
        calendarDay.year ===
          today.getFullYear()
      );
    };

  /* =========================================================
     NUEVA TAREA
  ========================================================= */

  const handleNewReminder =
    () => {
      router.push({
        pathname:
          "/reminder",

        params: {
          date:
            selectedDateString,
        },
      });
    };

  /* =========================================================
     EDITAR TAREA
  ========================================================= */

  const handleEditTask =
    (
      taskId:
        string
    ) => {
      router.push({
        pathname:
          "/reminder",

        params: {
          taskId,
        },
      });
    };

  /* =========================================================
     FECHA SELECCIONADA
  ========================================================= */

  const weekDayName =
    getWeekDayName(
      selectedDate.day,
      selectedDate.month,
      selectedDate.year
    );

  return (
    <View
      style={
        styles.container
      }
    >
      <View
        style={
          styles.content
        }
      >
        {/* =====================================================
            HEADER
        ===================================================== */}

        <View
          style={
            styles.header
          }
        >
          <TouchableOpacity>
            <Ionicons
              name="menu-outline"
              size={28}
              color={
                COLORS.text
              }
            />
          </TouchableOpacity>

          <Text
            style={
              styles.title
            }
          >
            Mi agenda
          </Text>

          <TouchableOpacity
            onPress={
              goToday
            }
          >
            <Ionicons
              name="today-outline"
              size={24}
              color={
                COLORS.text
              }
            />
          </TouchableOpacity>
        </View>

        {/* =====================================================
            SELECTOR DE MES
        ===================================================== */}

        <View
          style={
            styles.monthSelector
          }
        >
          <TouchableOpacity
            style={
              styles.monthButton
            }
            onPress={
              goPreviousMonth
            }
          >
            <Ionicons
              name="chevron-back"
              size={22}
              color={
                COLORS.text
              }
            />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={
              goToday
            }
          >
            <Text
              style={
                styles.monthText
              }
            >
              {
                MONTH_NAMES[
                  visibleMonth
                ]
              }{" "}
              {
                visibleYear
              }
            </Text>

            <Text
              style={
                styles.todayHint
              }
            >
              Toca para volver a hoy
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={
              styles.monthButton
            }
            onPress={
              goNextMonth
            }
          >
            <Ionicons
              name="chevron-forward"
              size={22}
              color={
                COLORS.text
              }
            />
          </TouchableOpacity>
        </View>

        {/* =====================================================
            DÍAS SEMANA
        ===================================================== */}

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

        {/* =====================================================
            CALENDARIO
        ===================================================== */}

        <View
          style={
            styles.calendar
          }
        >
          {calendarWeeks.map(
            (
              week,
              rowIndex
            ) => (
              <View
                key={
                  rowIndex
                }
                style={
                  styles.weekRow
                }
              >
                {week.map(
                  (
                    calendarDay,
                    colIndex
                  ) => {
                    const selected =
                      isSelected(
                        calendarDay
                      );

                    const currentDay =
                      isToday(
                        calendarDay
                      );

                    return (
                      <TouchableOpacity
                        key={`${rowIndex}-${colIndex}`}
                        style={[
                          styles.dayCell,

                          selected &&
                            styles.activeDay,

                          currentDay &&
                            !selected &&
                            styles.todayCell,
                        ]}
                        onPress={() =>
                          selectCalendarDay(
                            calendarDay
                          )
                        }
                      >
                        <Text
                          style={[
                            styles.dayText,

                            !calendarDay.currentMonth &&
                              styles.otherMonthDay,

                            selected &&
                              styles.activeDayText,

                            currentDay &&
                              !selected &&
                              styles.todayText,
                          ]}
                        >
                          {
                            calendarDay.day
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

        {/* =====================================================
            FECHA SELECCIONADA
        ===================================================== */}

        <View
          style={
            styles.dateHeader
          }
        >
          <View>
            <Text
              style={
                styles.selectedDate
              }
            >
              {weekDayName
                .charAt(0)
                .toUpperCase() +
                weekDayName.slice(
                  1
                )}{" "}
              {
                selectedDate.day
              }{" "}
              de{" "}
              {
                MONTH_NAMES[
                  selectedDate.month
                ].toLowerCase()
              }
            </Text>

            <Text
              style={
                styles.selectedDateCode
              }
            >
              {
                selectedDateString
              }
            </Text>
          </View>

          {selectedDateString ===
            todayString && (
            <View
              style={
                styles.todayBadge
              }
            >
              <Text
                style={
                  styles.todayBadgeText
                }
              >
                Hoy
              </Text>
            </View>
          )}
        </View>

        {/* =====================================================
            ACTIVIDADES
        ===================================================== */}

        <ScrollView
          style={
            styles.list
          }
          showsVerticalScrollIndicator={
            false
          }
          contentContainerStyle={
            agendaItems.length ===
            0
              ? styles.emptyListContent
              : styles.listContent
          }
        >
          {agendaItems.length >
          0 ? (
            agendaItems.map(
              (
                item
              ) => (
                <TouchableOpacity
                  key={
                    item.id
                  }
                  style={
                    styles.taskCard
                  }
                  onPress={() =>
                    handleEditTask(
                      item.id
                    )
                  }
                >
                  <View
                    style={
                      styles.taskIcon
                    }
                  >
                    <Ionicons
                      name={
                        item.completed
                          ? "checkmark-circle"
                          : "calendar-outline"
                      }
                      size={22}
                      color={
                        item.completed
                          ? COLORS.success
                          : COLORS.primarySoft
                      }
                    />
                  </View>

                  <View
                    style={
                      styles.taskInfo
                    }
                  >
                    <Text
                      style={[
                        styles.taskTitle,

                        item.completed &&
                          styles.completedTask,
                      ]}
                    >
                      {
                        item.title
                      }
                    </Text>

                    {item.notes ? (
                      <Text
                        style={
                          styles.taskNotes
                        }
                        numberOfLines={
                          1
                        }
                      >
                        {
                          item.notes
                        }
                      </Text>
                    ) : (
                      <Text
                        style={
                          styles.taskNotes
                        }
                      >
                        Toca para editar
                      </Text>
                    )}
                  </View>

                  <View
                    style={
                      styles.taskRight
                    }
                  >
                    <Text
                      style={
                        styles.taskTime
                      }
                    >
                      {
                        item.time
                      }
                    </Text>

                    <Ionicons
                      name="create-outline"
                      size={18}
                      color={
                        COLORS.primarySoft
                      }
                    />
                  </View>
                </TouchableOpacity>
              )
            )
          ) : (
            /* =================================================
               LUMI-5 CUANDO NO HAY ACTIVIDADES
            ================================================= */

            <View
              style={
                styles.emptyAgenda
              }
            >
              <Image
                source={require(
                  "../../../assets/images/lumi-5.png"
                )}
                style={
                  styles.emptyLumi
                }
                resizeMode="contain"
              />

              <Text
                style={
                  styles.emptyTitle
                }
              >
                Día libre por ahora
              </Text>

              <Text
                style={
                  styles.emptyAgendaText
                }
              >
                No tienes nada agendado para este día.
              </Text>

              <Text
                style={
                  styles.emptyLumiText
                }
              >
                ¿Anotamos algo?
              </Text>

              <TouchableOpacity
                style={
                  styles.emptyAddButton
                }
                onPress={
                  handleNewReminder
                }
              >
                <Ionicons
                  name="add"
                  size={18}
                  color="#FFFFFF"
                />

                <Text
                  style={
                    styles.emptyAddText
                  }
                >
                  Agregar tarea
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>

        {/* =====================================================
            BOTÓN FLOTANTE
        ===================================================== */}

        <TouchableOpacity
          style={
            styles.floatingButton
          }
          onPress={
            handleNewReminder
          }
        >
          <Ionicons
            name="add"
            size={30}
            color="#FFFFFF"
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

/* =========================================================
   ESTILOS
========================================================= */

const styles =
  StyleSheet.create({
    container: {
      flex: 1,

      backgroundColor:
        COLORS.background,
    },

    content: {
      flex: 1,

      width: "100%",

      maxWidth: 480,

      alignSelf:
        "center",

      paddingHorizontal:
        16,

      paddingTop: 25,
    },

    /* =====================================================
       HEADER
    ===================================================== */

    header: {
      flexDirection:
        "row",

      justifyContent:
        "space-between",

      alignItems:
        "center",

      marginBottom: 20,
    },

    title: {
      color:
        COLORS.text,

      fontSize: 21,

      fontWeight: "600",
    },

    /* =====================================================
       MES
    ===================================================== */

    monthSelector: {
      minHeight: 58,

      backgroundColor:
        COLORS.surface2,

      borderRadius:
        RADIUS.md,

      flexDirection:
        "row",

      alignItems:
        "center",

      justifyContent:
        "space-between",

      paddingHorizontal: 8,

      marginBottom: 16,
    },

    monthButton: {
      width: 42,

      height: 42,

      justifyContent:
        "center",

      alignItems:
        "center",
    },

    monthText: {
      color:
        COLORS.text,

      fontSize: 15,

      textAlign:
        "center",

      fontWeight: "500",
    },

    todayHint: {
      color:
        COLORS.textSoft,

      fontSize: 9,

      textAlign:
        "center",

      marginTop: 3,
    },

    /* =====================================================
       SEMANA
    ===================================================== */

    weekHeader: {
      flexDirection:
        "row",

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

    /* =====================================================
       CALENDARIO
    ===================================================== */

    calendar: {
      backgroundColor:
        COLORS.surface2,

      borderRadius:
        RADIUS.md,

      paddingVertical: 10,

      paddingHorizontal: 4,

      marginBottom: 20,
    },

    weekRow: {
      flexDirection:
        "row",
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

    todayCell: {
      borderWidth: 1,

      borderColor:
        COLORS.primarySoft,

      borderRadius: 999,
    },

    dayText: {
      color:
        COLORS.text,

      fontSize: 12,
    },

    otherMonthDay: {
      color:
        COLORS.textSoft,

      opacity: 0.45,
    },

    activeDayText: {
      color:
        "#FFFFFF",

      fontWeight: "700",
    },

    todayText: {
      color:
        COLORS.primarySoft,

      fontWeight: "700",
    },

    /* =====================================================
       FECHA
    ===================================================== */

    dateHeader: {
      flexDirection:
        "row",

      justifyContent:
        "space-between",

      alignItems:
        "center",

      marginBottom: 14,
    },

    selectedDate: {
      color:
        COLORS.text,

      fontSize: 14,

      fontWeight: "600",
    },

    selectedDateCode: {
      color:
        COLORS.textMuted,

      fontSize: 10,

      marginTop: 3,
    },

    todayBadge: {
      backgroundColor:
        COLORS.primary,

      borderRadius:
        RADIUS.pill,

      paddingHorizontal: 10,

      paddingVertical: 5,
    },

    todayBadgeText: {
      color:
        "#FFFFFF",

      fontSize: 10,

      fontWeight: "600",
    },

    /* =====================================================
       LISTA
    ===================================================== */

    list: {
      flex: 1,
    },

    listContent: {
      paddingBottom: 95,
    },

    emptyListContent: {
      flexGrow: 1,

      paddingBottom: 95,
    },

    /* =====================================================
       TAREA
    ===================================================== */

    taskCard: {
      minHeight: 70,

      backgroundColor:
        COLORS.surface2,

      borderRadius:
        RADIUS.md,

      flexDirection:
        "row",

      alignItems:
        "center",

      paddingHorizontal: 12,

      paddingVertical: 10,

      marginBottom: 10,
    },

    taskIcon: {
      width: 38,

      height: 38,

      borderRadius: 19,

      backgroundColor:
        COLORS.surface3,

      alignItems:
        "center",

      justifyContent:
        "center",
    },

    taskInfo: {
      flex: 1,

      marginLeft: 11,

      paddingRight: 8,
    },

    taskTitle: {
      color:
        COLORS.text,

      fontSize: 13,

      fontWeight: "500",
    },

    completedTask: {
      color:
        COLORS.textMuted,

      textDecorationLine:
        "line-through",
    },

    taskNotes: {
      color:
        COLORS.textMuted,

      fontSize: 10,

      marginTop: 4,
    },

    taskRight: {
      alignItems:
        "flex-end",

      gap: 8,
    },

    taskTime: {
      color:
        COLORS.text,

      fontSize: 11,

      fontWeight: "500",
    },

    /* =====================================================
       VACÍO CON LUMI-5
    ===================================================== */

    emptyAgenda: {
      flex: 1,

      minHeight: 230,

      backgroundColor:
        COLORS.surface2,

      borderRadius:
        RADIUS.md,

      paddingVertical: 20,

      paddingHorizontal: 18,

      alignItems:
        "center",

      justifyContent:
        "center",

      borderWidth: 1,

      borderColor:
        COLORS.border,
    },

    emptyLumi: {
      width: 115,

      height: 115,

      marginBottom: 2,
    },

    emptyTitle: {
      color:
        COLORS.text,

      fontSize: 15,

      fontWeight: "600",

      marginTop: 4,
    },

    emptyAgendaText: {
      color:
        COLORS.textMuted,

      fontSize: 11,

      marginTop: 4,

      textAlign:
        "center",
    },

    emptyLumiText: {
      color:
        COLORS.primarySoft,

      fontSize: 11,

      fontWeight: "600",

      marginTop: 8,
    },

    emptyAddButton: {
      flexDirection:
        "row",

      alignItems:
        "center",

      justifyContent:
        "center",

      backgroundColor:
        COLORS.primary,

      height: 40,

      borderRadius:
        RADIUS.md,

      paddingHorizontal: 15,

      marginTop: 16,

      gap: 5,
    },

    emptyAddText: {
      color:
        "#FFFFFF",

      fontSize: 12,

      fontWeight: "600",
    },

    /* =====================================================
       FLOAT
    ===================================================== */

    floatingButton: {
      position:
        "absolute",

      right: 18,

      bottom: 22,

      width: 55,

      height: 55,

      borderRadius: 28,

      backgroundColor:
        COLORS.primary,

      justifyContent:
        "center",

      alignItems:
        "center",
    },
  });