import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

import {
  Task,
  useTasks,
} from "../../context/TaskContext";

import {
  COLORS,
  RADIUS,
} from "../../constants/theme";

/* =========================================================
   TIPOS
========================================================= */

type SelectedTask = {
  id: string;
  title: string;
} | null;

type TaskWithCompletedAt =
  Task & {
    completedAt?: string;
  };

type ActivityDay = {
  key: string;
  label: string;
  count: number;
};

/* =========================================================
   UTILIDADES
========================================================= */

function parseTaskDate(
  dateString: string
) {
  const [
    day,
    month,
    year,
  ] = dateString
    .split("/")
    .map(Number);

  return new Date(
    year,
    month - 1,
    day
  );
}

function formatDateKey(
  dateString: string
) {
  const date =
    parseTaskDate(
      dateString
    );

  const today =
    new Date();

  const todayOnly =
    new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );

  const tomorrow =
    new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate() + 1
    );

  const taskDate =
    new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate()
    );

  if (
    taskDate.getTime() ===
    todayOnly.getTime()
  ) {
    return "HOY";
  }

  if (
    taskDate.getTime() ===
    tomorrow.getTime()
  ) {
    return "MAÑANA";
  }

  return taskDate
    .toLocaleDateString(
      "es-SV",
      {
        day: "numeric",
        month: "long",
        year: "numeric",
      }
    )
    .toUpperCase();
}

function getDateOnly(
  date = new Date()
) {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate()
  );
}

function formatClock(
  date: Date
) {
  return date
    .toLocaleTimeString(
      "es-SV",
      {
        hour: "numeric",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      }
    )
    .replace(
      "a. m.",
      "AM"
    )
    .replace(
      "p. m.",
      "PM"
    );
}

function formatLongDate(
  date: Date
) {
  const text =
    date.toLocaleDateString(
      "es-SV",
      {
        weekday: "long",
        day: "numeric",
        month: "long",
      }
    );

  return (
    text.charAt(0)
      .toUpperCase() +
    text.slice(1)
  );
}

function dateToKey(
  date: Date
) {
  const year =
    date.getFullYear();

  const month =
    String(
      date.getMonth() + 1
    ).padStart(
      2,
      "0"
    );

  const day =
    String(
      date.getDate()
    ).padStart(
      2,
      "0"
    );

  return `${year}-${month}-${day}`;
}

function buildActivity(
  tasks: Task[]
): ActivityDay[] {
  const today =
    getDateOnly();

  const days =
    Array.from(
      {
        length: 7,
      },
      (
        _,
        index
      ) => {
        const date =
          new Date(
            today
          );

        date.setDate(
          today.getDate() -
            (6 - index)
        );

        return date;
      }
    );

  return days.map(
    (date) => {
      const key =
        dateToKey(date);

      const count =
        tasks.filter(
          (task) => {
            if (
              !task.completed
            ) {
              return false;
            }

            const completedAt =
              (
                task as TaskWithCompletedAt
              )
                .completedAt;

            if (
              !completedAt
            ) {
              return false;
            }

            const completedDate =
              new Date(
                completedAt
              );

            if (
              Number.isNaN(
                completedDate.getTime()
              )
            ) {
              return false;
            }

            return (
              dateToKey(
                completedDate
              ) === key
            );
          }
        ).length;

      return {
        key,
        label:
          date
            .toLocaleDateString(
              "es-SV",
              {
                weekday:
                  "short",
              }
            )
            .replace(
              ".",
              ""
            )
            .slice(
              0,
              2
            )
            .toUpperCase(),
        count,
      };
    }
  );
}

/* =========================================================
   SCREEN
========================================================= */

export default function TasksScreen() {
  const [
    selectedTab,
    setSelectedTab,
  ] =
    useState<
      | "pending"
      | "completed"
    >("pending");

  const [
    now,
    setNow,
  ] =
    useState(
      new Date()
    );

  const {
    tasks,
    toggleTask,
    deleteTask,
  } =
    useTasks();

  const [
    confirmVisible,
    setConfirmVisible,
  ] =
    useState(false);

  const [
    taskToComplete,
    setTaskToComplete,
  ] =
    useState<
      SelectedTask
    >(null);

  useEffect(() => {
    const timer =
      setInterval(
        () => {
          setNow(
            new Date()
          );
        },
        1000
      );

    return () =>
      clearInterval(
        timer
      );
  }, []);

  /* =========================================================
     LISTAS
  ========================================================= */

  const pendingTasks =
    tasks.filter(
      (task) =>
        !task.completed
    );

  const completedTasks =
    tasks.filter(
      (task) =>
        task.completed
    );

  const todayOnly =
    getDateOnly(
      now
    );

  const visibleTasks =
    selectedTab ===
    "pending"
      ? pendingTasks
      : completedTasks;

  /* =========================================================
     MÉTRICAS
  ========================================================= */

  const totalTasks =
    tasks.length;

  const completedCount =
    completedTasks.length;

  const pendingCount =
    pendingTasks.length;

  const progress =
    totalTasks > 0
      ? Math.round(
          (completedCount /
            totalTasks) *
            100
        )
      : 0;

  const activity =
    useMemo(
      () =>
        buildActivity(
          tasks
        ),
      [tasks]
    );

  const maxActivity =
    Math.max(
      1,
      ...activity.map(
        (item) =>
          item.count
      )
    );

  const completedThisWeek =
    activity.reduce(
      (
        total,
        item
      ) =>
        total +
        item.count,
      0
    );

  /* =========================================================
     AGRUPAR
  ========================================================= */

  const groupedTasks =
    visibleTasks.reduce(
      (
        groups: Record<
          string,
          Task[]
        >,
        task
      ) => {
        const key =
          formatDateKey(
            task.date
          );

        if (
          !groups[key]
        ) {
          groups[key] =
            [];
        }

        groups[
          key
        ].push(
          task
        );

        return groups;
      },
      {}
    );

  const groupedEntries =
    Object.entries(
      groupedTasks
    ).sort(
      (
        [, a],
        [, b]
      ) =>
        parseTaskDate(
          a[0].date
        ).getTime() -
        parseTaskDate(
          b[0].date
        ).getTime()
    );

  /* =========================================================
     EDITAR / COMPLETAR
  ========================================================= */

  const editTask = (
    task: Task
  ) => {
    router.push({
      pathname:
        "/reminder",

      params: {
        taskId:
          task.id,
      },
    });
  };

  const confirmComplete = (
    task: Task
  ) => {
    if (
      task.completed
    ) {
      toggleTask(
        task.id
      );

      return;
    }

    setTaskToComplete({
      id:
        task.id,
      title:
        task.title,
    });

    setConfirmVisible(
      true
    );
  };

  const handleConfirmComplete =
    () => {
      if (
        !taskToComplete
      ) {
        return;
      }

      toggleTask(
        taskToComplete.id
      );

      setConfirmVisible(
        false
      );

      setTaskToComplete(
        null
      );
    };

  /* =========================================================
     UI
  ========================================================= */

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
        {/* HEADER */}

        <View
          style={
            styles.header
          }
        >
          <View
            style={
              styles.clockBox
            }
          >
            <Text
              style={
                styles.clockText
              }
            >
              {formatClock(
                now
              )}
            </Text>
          </View>

          <View
            style={
              styles.headerCenter
            }
          >
            <Text
              style={
                styles.title
              }
            >
              Mis tareas
            </Text>

            <Text
              style={
                styles.currentDate
              }
              numberOfLines={
                1
              }
            >
              {formatLongDate(
                now
              )}
            </Text>
          </View>

          <TouchableOpacity
            style={
              styles.headerAddButton
            }
            onPress={() =>
              router.push(
                "/reminder"
              )
            }
          >
            <Ionicons
              name="add"
              size={23}
              color="#FFFFFF"
            />
          </TouchableOpacity>
        </View>

        {/* LUMI */}

        <View
          style={
            styles.lumiCard
          }
        >
          <Image
            source={require(
              "../../../assets/images/lumi-4.png"
            )}
            style={
              styles.lumiImage
            }
            resizeMode="contain"
          />

          <View
            style={
              styles.lumiContent
            }
          >
            <Text
              style={
                styles.lumiTitle
              }
            >
              Organiza tu día
            </Text>

            <Text
              style={
                styles.lumiText
              }
            >
              Anota lo que no quieras olvidar.
            </Text>

            <Text
              style={
                styles.lumiHint
              }
            >
              {pendingCount ===
              0
                ? "Todo tranquilo por ahora ✨"
                : `${pendingCount} ${
                    pendingCount ===
                    1
                      ? "pendiente"
                      : "pendientes"
                  }`}
            </Text>
          </View>

        </View>

        {/* TABS */}

        <View
          style={
            styles.tabs
          }
        >
          <TouchableOpacity
            style={[
              styles.tab,

              selectedTab ===
                "pending" &&
                styles.activeTab,
            ]}
            onPress={() =>
              setSelectedTab(
                "pending"
              )
            }
          >
            <Text
              style={[
                styles.tabText,

                selectedTab ===
                  "pending" &&
                  styles.activeTabText,
              ]}
            >
              Pendientes
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tab,

              selectedTab ===
                "completed" &&
                styles.activeTab,
            ]}
            onPress={() =>
              setSelectedTab(
                "completed"
              )
            }
          >
            <Text
              style={[
                styles.tabText,

                selectedTab ===
                  "completed" &&
                  styles.activeTabText,
              ]}
            >
              Completadas
            </Text>
          </TouchableOpacity>
        </View>

        {/* DASHBOARD COMPLETADAS */}

        {selectedTab ===
          "completed" && (
          <ScrollView
            style={
              styles.dashboardScroll
            }
            showsVerticalScrollIndicator={
              false
            }
            contentContainerStyle={
              styles.dashboardContent
            }
          >
            <View
              style={
                styles.progressCard
              }
            >
              <View
                style={
                  styles.progressHeader
                }
              >
                <View>
                  <Text
                    style={
                      styles.progressTitle
                    }
                  >
                    Progreso general
                  </Text>

                  <Text
                    style={
                      styles.progressSubtitle
                    }
                  >
                    Tu progreso total
                  </Text>
                </View>

                <Text
                  style={
                    styles.progressPercentage
                  }
                >
                  {progress}%
                </Text>
              </View>

              <View
                style={
                  styles.progressTrack
                }
              >
                <View
                  style={[
                    styles.progressFill,

                    {
                      width:
                        `${progress}%`,
                    },
                  ]}
                />
              </View>
            </View>

            <View
              style={
                styles.chartCard
              }
            >
              <View
                style={
                  styles.chartHeader
                }
              >
                <View>
                  <Text
                    style={
                      styles.chartTitle
                    }
                  >
                    Actividad semanal
                  </Text>

                  <Text
                    style={
                      styles.chartSubtitle
                    }
                  >
                    Últimos 7 días
                  </Text>
                </View>

              </View>

              <View
                style={
                  styles.chartArea
                }
              >
                {activity.map(
                  (item) => {
                    const height =
                      item.count ===
                      0
                        ? 5
                        : Math.max(
                            14,
                            Math.round(
                              (item.count /
                                maxActivity) *
                                68
                            )
                          );

                    return (
                      <View
                        key={
                          item.key
                        }
                        style={
                          styles.chartColumn
                        }
                      >
                        <Text
                          style={
                            styles.chartValue
                          }
                        >
                          {
                            item.count
                          }
                        </Text>

                        <View
                          style={
                            styles.chartTrack
                          }
                        >
                          <View
                            style={[
                              styles.chartBar,

                              {
                                height,
                              },
                            ]}
                          />
                        </View>

                        <Text
                          style={
                            styles.chartLabel
                          }
                        >
                          {
                            item.label
                          }
                        </Text>
                      </View>
                    );
                  }
                )}
              </View>

              <View
                style={
                  styles.chartFooter
                }
              >
                <Ionicons
                  name="sparkles-outline"
                  size={14}
                  color={
                    COLORS.primarySoft
                  }
                />

                <Text
                  style={
                    styles.chartFooterText
                  }
                >
                  {completedThisWeek ===
                  0
                    ? "Completa tareas para ver tu ritmo semanal."
                    : completedThisWeek ===
                      1
                    ? "1 tarea completada esta semana."
                    : `${completedThisWeek} tareas completadas esta semana.`}
                </Text>
              </View>
            </View>

            {/* LISTA COMPLETADAS */}

            <View
              style={
                styles.completedSectionHeader
              }
            >
              <Text
                style={
                  styles.completedSectionTitle
                }
              >
                HISTORIAL
              </Text>

              <Text
                style={
                  styles.completedSectionCount
                }
              >
                {
                  completedCount
                }{" "}
                completadas
              </Text>
            </View>

            {groupedEntries.map(
              ([
                label,
                group,
              ]) => (
                <View
                  key={
                    label
                  }
                  style={
                    styles.dateGroup
                  }
                >
                  <View
                    style={
                      styles.dateHeader
                    }
                  >
                    <Text
                      style={
                        styles.dateTitle
                      }
                    >
                      {
                        label
                      }
                    </Text>

                    <Text
                      style={
                        styles.dateCount
                      }
                    >
                      {
                        group.length
                      }{" "}
                      {group.length ===
                      1
                        ? "tarea"
                        : "tareas"}
                    </Text>
                  </View>

                  {group.map(
                    (
                      task
                    ) => (
                      <TaskCard
                        key={
                          task.id
                        }
                        task={
                          task
                        }
                        onComplete={() =>
                          confirmComplete(
                            task
                          )
                        }
                        onEdit={() =>
                          editTask(
                            task
                          )
                        }
                        onDelete={() =>
                          deleteTask(
                            task.id
                          )
                        }
                      />
                    )
                  )}
                </View>
              )
            )}

            {completedCount ===
              0 && (
              <View
                style={
                  styles.dashboardEmpty
                }
              >
                <Text
                  style={
                    styles.emptyTitle
                  }
                >
                  Aún no hay completadas
                </Text>

                <Text
                  style={
                    styles.emptySubtitle
                  }
                >
                  Cuando completes una tarea aparecerá aquí y también alimentará tu gráfico.
                </Text>
              </View>
            )}
          </ScrollView>
        )}

        {/* LISTA PENDIENTES */}

        {selectedTab ===
          "pending" && (
          <ScrollView
            style={
              styles.list
            }
            showsVerticalScrollIndicator={
              false
            }
            contentContainerStyle={
              groupedEntries.length ===
              0
                ? styles.emptyListContent
                : styles.listContent
            }
          >
            {groupedEntries.map(
              ([
                label,
                group,
              ]) => (
                <View
                  key={
                    label
                  }
                  style={
                    styles.dateGroup
                  }
                >
                  <View
                    style={
                      styles.dateHeader
                    }
                  >
                    <Text
                      style={
                        styles.dateTitle
                      }
                    >
                      {
                        label
                      }
                    </Text>

                    <Text
                      style={
                        styles.dateCount
                      }
                    >
                      {
                        group.length
                      }{" "}
                      {group.length ===
                      1
                        ? "tarea"
                        : "tareas"}
                    </Text>
                  </View>

                  {group.map(
                    (
                      task
                    ) => (
                      <TaskCard
                        key={
                          task.id
                        }
                        task={
                          task
                        }
                        overdue={
                          parseTaskDate(
                            task.date
                          ).getTime() <
                          todayOnly.getTime()
                        }
                        onComplete={() =>
                          confirmComplete(
                            task
                          )
                        }
                        onEdit={() =>
                          editTask(
                            task
                          )
                        }
                        onDelete={() =>
                          deleteTask(
                            task.id
                          )
                        }
                      />
                    )
                  )}
                </View>
              )
            )}

            {groupedEntries.length ===
              0 && (
              <View
                style={
                  styles.emptyContainer
                }
              >
                <Image
                  source={require(
                    "../../../assets/images/lumi-7.png"
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
                  Todo listo por aquí
                </Text>

                <Text
                  style={
                    styles.emptySubtitle
                  }
                >
                  Cuando tengas algo pendiente, lo anotamos juntos.
                </Text>
              </View>
            )}
          </ScrollView>
        )}

        {/* MODAL COMPLETAR */}

        <Modal
          visible={
            confirmVisible
          }
          transparent
          animationType="fade"
          onRequestClose={() =>
            setConfirmVisible(
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
                styles.confirmCard
              }
            >
              <View
                style={
                  styles.modalLumiWrapper
                }
              >
                <Image
                  source={require(
                    "../../../assets/images/lumi-4.png"
                  )}
                  style={
                    styles.modalLumi
                  }
                  resizeMode="contain"
                />
              </View>

              <Text
                style={
                  styles.confirmTitle
                }
              >
                ¿La terminaste?
              </Text>

              <Text
                style={
                  styles.confirmText
                }
              >
                Marcar "
                {
                  taskToComplete?.title
                }
                " como completada.
              </Text>

              <View
                style={
                  styles.confirmActions
                }
              >
                <TouchableOpacity
                  style={
                    styles.cancelButton
                  }
                  onPress={() => {
                    setConfirmVisible(
                      false
                    );

                    setTaskToComplete(
                      null
                    );
                  }}
                >
                  <Text
                    style={
                      styles.cancelText
                    }
                  >
                    Todavía no
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={
                    styles.completeButton
                  }
                  onPress={
                    handleConfirmComplete
                  }
                >
                  <Text
                    style={
                      styles.completeText
                    }
                  >
                    Sí, lista
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </View>
  );
}

/* =========================================================
   COMPONENTES
========================================================= */

function TaskCard({
  task,
  overdue = false,
  onComplete,
  onEdit,
  onDelete,
}: {
  task: Task;
  overdue?: boolean;
  onComplete: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <View
      style={[
        styles.taskCard,

        overdue &&
          styles.taskCardOverdue,
      ]}
    >
      <TouchableOpacity
        style={
          styles.checkButton
        }
        onPress={
          onComplete
        }
      >
        <Ionicons
          name={
            task.completed
              ? "checkmark-circle"
              : "ellipse-outline"
          }
          size={24}
          color={
            task.completed
              ? COLORS.success
              : COLORS.primarySoft
          }
        />
      </TouchableOpacity>

      <TouchableOpacity
        style={
          styles.taskBody
        }
        onPress={
          onEdit
        }
      >
        <View
          style={
            styles.taskTitleRow
          }
        >
          <Text
            style={[
              styles.taskTitle,

              task.completed &&
                styles.completedTask,
            ]}
            numberOfLines={
              1
            }
          >
            {
              task.title
            }
          </Text>

          {overdue && (
            <View
              style={
                styles.overdueBadge
              }
            >
              <Text
                style={
                  styles.overdueBadgeText
                }
              >
                VENCIDA
              </Text>
            </View>
          )}
        </View>

        <View
          style={
            styles.taskMeta
          }
        >
          <Ionicons
            name="calendar-outline"
            size={12}
            color={
              COLORS.textMuted
            }
          />

          <Text
            style={
              styles.taskMetaText
            }
          >
            {
              task.date
            }
          </Text>

          <Ionicons
            name="time-outline"
            size={12}
            color={
              COLORS.textMuted
            }
            style={{
              marginLeft:
                8,
            }}
          />

          <Text
            style={
              styles.taskMetaText
            }
          >
            {
              task.time
            }
          </Text>
        </View>

        {task.notes ? (
          <Text
            style={
              styles.taskNotes
            }
            numberOfLines={
              1
            }
          >
            {
              task.notes
            }
          </Text>
        ) : null}
      </TouchableOpacity>

      <TouchableOpacity
        style={
          styles.actionButton
        }
        onPress={
          onEdit
        }
      >
        <Ionicons
          name="create-outline"
          size={18}
          color={
            COLORS.primarySoft
          }
        />
      </TouchableOpacity>

      <TouchableOpacity
        style={
          styles.actionButton
        }
        onPress={
          onDelete
        }
      >
        <Ionicons
          name="trash-outline"
          size={18}
          color={
            COLORS.danger
          }
        />
      </TouchableOpacity>
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
      maxWidth: 480,
      width: "100%",
      alignSelf:
        "center",
      paddingHorizontal:
        16,
      paddingTop: 24,
    },

    /* HEADER */

    header: {
      flexDirection:
        "row",
      alignItems:
        "center",
      marginBottom: 12,
    },

    clockBox: {
      width: 84,
    },

    clockText: {
      color:
        COLORS.text,
      fontSize: 13,
      fontWeight: "700",
    },




    headerCenter: {
      flex: 1,
      alignItems:
        "center",
      paddingHorizontal: 4,
    },

    title: {
      color:
        COLORS.text,
      fontSize: 21,
      fontWeight: "600",
    },

    currentDate: {
      color:
        COLORS.textMuted,
      fontSize: 9,
      marginTop: 2,
    },

    headerAddButton: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor:
        COLORS.primary,
      alignItems:
        "center",
      justifyContent:
        "center",
      marginLeft: 46,
    },

    /* LUMI */

    lumiCard: {
      minHeight: 96,
      backgroundColor:
        COLORS.surface2,
      borderRadius:
        RADIUS.lg,
      borderWidth: 1,
      borderColor:
        COLORS.border,
      flexDirection:
        "row",
      alignItems:
        "center",
      paddingHorizontal:
        12,
      paddingVertical: 10,
      marginBottom: 14,
    },

    lumiImage: {
      width: 74,
      height: 74,
    },

    lumiContent: {
      flex: 1,
      marginLeft: 7,
      paddingRight: 7,
    },

    lumiTitle: {
      color:
        COLORS.text,
      fontSize: 14,
      fontWeight: "700",
    },

    lumiText: {
      color:
        COLORS.textMuted,
      fontSize: 11,
      marginTop: 4,
      lineHeight: 16,
    },

    lumiHint: {
      color:
        COLORS.primarySoft,
      fontSize: 10,
      fontWeight: "600",
      marginTop: 6,
    },




    /* TABS */

    tabs: {
      height: 44,
      borderWidth: 1,
      borderColor:
        COLORS.border,
      borderRadius:
        RADIUS.md,
      overflow:
        "hidden",
      flexDirection:
        "row",
      marginBottom: 12,
    },

    tab: {
      flex: 1,
      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "center",
      gap: 7,
    },

    activeTab: {
      backgroundColor:
        COLORS.primary,
    },

    tabText: {
      color:
        COLORS.textMuted,
      fontSize: 12,
    },

    activeTabText: {
      color: "#FFFFFF",
      fontWeight: "600",
    },





    /* OVERVIEW PENDIENTES */






    /* DASHBOARD */

    dashboardScroll: {
      flex: 1,
    },

    dashboardContent: {
      paddingBottom: 90,
    },





    progressCard: {
      backgroundColor:
        COLORS.surface2,
      borderRadius:
        RADIUS.md,
      borderWidth: 1,
      borderColor:
        COLORS.border,
      padding: 14,
      marginBottom: 10,
    },

    progressHeader: {
      flexDirection:
        "row",
      justifyContent:
        "space-between",
      alignItems:
        "center",
    },

    progressTitle: {
      color:
        COLORS.text,
      fontSize: 12,
      fontWeight: "600",
    },

    progressSubtitle: {
      color:
        COLORS.textMuted,
      fontSize: 8,
      marginTop: 2,
    },

    progressPercentage: {
      color:
        COLORS.primarySoft,
      fontSize: 16,
      fontWeight: "700",
    },

    progressTrack: {
      height: 8,
      backgroundColor:
        COLORS.surface3,
      marginTop: 11,
      borderRadius: 5,
      overflow:
        "hidden",
    },

    progressFill: {
      height: "100%",
      backgroundColor:
        COLORS.primary,
    },

    /* CHART */

    chartCard: {
      backgroundColor:
        COLORS.surface2,
      borderRadius:
        RADIUS.lg,
      borderWidth: 1,
      borderColor:
        COLORS.border,
      padding: 14,
      marginBottom: 18,
    },

    chartHeader: {
      flexDirection:
        "row",
      justifyContent:
        "space-between",
      alignItems:
        "center",
    },

    chartTitle: {
      color:
        COLORS.text,
      fontSize: 13,
      fontWeight: "700",
    },

    chartSubtitle: {
      color:
        COLORS.textMuted,
      fontSize: 8,
      marginTop: 2,
    },



    chartArea: {
      height: 110,
      flexDirection:
        "row",
      alignItems:
        "flex-end",
      justifyContent:
        "space-between",
      marginTop: 12,
      paddingHorizontal: 4,
    },

    chartColumn: {
      flex: 1,
      alignItems:
        "center",
      justifyContent:
        "flex-end",
    },

    chartValue: {
      color:
        COLORS.textSoft,
      fontSize: 8,
      marginBottom: 3,
    },

    chartTrack: {
      height: 72,
      width: 20,
      backgroundColor:
        COLORS.surface3,
      borderRadius: 6,
      justifyContent:
        "flex-end",
      overflow:
        "hidden",
    },

    chartBar: {
      width: "100%",
      backgroundColor:
        COLORS.primary,
      borderRadius: 6,
    },

    chartLabel: {
      color:
        COLORS.textMuted,
      fontSize: 8,
      marginTop: 5,
    },

    chartFooter: {
      flexDirection:
        "row",
      alignItems:
        "center",
      marginTop: 10,
      borderTopWidth: 1,
      borderTopColor:
        COLORS.border,
      paddingTop: 10,
    },

    chartFooterText: {
      color:
        COLORS.textMuted,
      fontSize: 9,
      marginLeft: 6,
      flex: 1,
    },

    completedSectionHeader: {
      flexDirection:
        "row",
      justifyContent:
        "space-between",
      alignItems:
        "center",
      marginBottom: 9,
    },

    completedSectionTitle: {
      color:
        COLORS.primarySoft,
      fontSize: 10,
      fontWeight: "700",
    },

    completedSectionCount: {
      color:
        COLORS.textMuted,
      fontSize: 9,
    },

    dashboardEmpty: {
      alignItems:
        "center",
      paddingVertical: 26,
      paddingHorizontal: 24,
    },

    /* LIST */

    list: {
      flex: 1,
    },

    listContent: {
      paddingBottom: 80,
    },

    emptyListContent: {
      flexGrow: 1,
      paddingBottom: 80,
    },

    dateGroup: {
      marginBottom: 20,
    },

    dateHeader: {
      flexDirection:
        "row",
      justifyContent:
        "space-between",
      alignItems:
        "center",
      marginBottom: 8,
    },

    dateTitle: {
      color:
        COLORS.primarySoft,
      fontWeight: "700",
      fontSize: 11,
    },

    dateCount: {
      color:
        COLORS.textMuted,
      fontSize: 10,
    },

    /* TASK */

    taskCard: {
      backgroundColor:
        COLORS.surface2,
      borderRadius:
        RADIUS.md,
      marginBottom: 9,
      minHeight: 70,
      paddingHorizontal: 8,
      flexDirection:
        "row",
      alignItems:
        "center",
      borderWidth: 1,
      borderColor:
        "transparent",
    },

    taskCardOverdue: {
      borderColor:
        "rgba(239,68,68,0.45)",
    },

    checkButton: {
      padding: 8,
    },

    taskBody: {
      flex: 1,
      paddingVertical: 10,
    },

    taskTitleRow: {
      flexDirection:
        "row",
      alignItems:
        "center",
    },

    taskTitle: {
      flex: 1,
      color:
        COLORS.text,
      fontSize: 14,
      fontWeight: "500",
    },

    completedTask: {
      textDecorationLine:
        "line-through",
      color:
        COLORS.textMuted,
    },

    overdueBadge: {
      borderRadius: 8,
      backgroundColor:
        "rgba(239,68,68,0.12)",
      paddingHorizontal: 6,
      paddingVertical: 3,
      marginLeft: 6,
    },

    overdueBadgeText: {
      color:
        COLORS.danger,
      fontSize: 7,
      fontWeight: "700",
    },

    taskMeta: {
      flexDirection:
        "row",
      alignItems:
        "center",
      marginTop: 5,
    },

    taskMetaText: {
      color:
        COLORS.textMuted,
      fontSize: 10,
      marginLeft: 3,
    },

    taskNotes: {
      color:
        COLORS.textSoft,
      fontSize: 10,
      marginTop: 4,
    },

    actionButton: {
      padding: 7,
    },

    /* EMPTY */

    emptyContainer: {
      flex: 1,
      alignItems:
        "center",
      justifyContent:
        "center",
      paddingHorizontal:
        30,
      paddingBottom: 40,
    },

    emptyLumi: {
      width: 112,
      height: 112,
      marginBottom: 2,
    },

    emptyTitle: {
      color:
        COLORS.text,
      fontSize: 16,
      fontWeight: "700",
      marginTop: 5,
      textAlign:
        "center",
    },

    emptySubtitle: {
      color:
        COLORS.textMuted,
      fontSize: 11,
      lineHeight: 17,
      textAlign:
        "center",
      marginTop: 6,
      maxWidth: 270,
    },



    /* MODAL */

    modalOverlay: {
      flex: 1,
      backgroundColor:
        "rgba(0,0,0,0.75)",
      alignItems:
        "center",
      justifyContent:
        "center",
      padding: 20,
    },

    confirmCard: {
      width: "100%",
      maxWidth: 350,
      backgroundColor:
        COLORS.surface,
      borderRadius:
        RADIUS.lg,
      alignItems:
        "center",
      padding: 22,
      borderWidth: 1,
      borderColor:
        COLORS.border,
    },

    modalLumiWrapper: {
      width: 80,
      height: 80,
      borderRadius: 24,
      backgroundColor:
        COLORS.surface2,
      alignItems:
        "center",
      justifyContent:
        "center",
    },

    modalLumi: {
      width: 76,
      height: 76,
    },

    confirmTitle: {
      color:
        COLORS.text,
      fontSize: 19,
      fontWeight: "700",
      marginTop: 12,
    },

    confirmText: {
      color:
        COLORS.textMuted,
      marginTop: 8,
      textAlign:
        "center",
      fontSize: 12,
      lineHeight: 18,
    },

    confirmActions: {
      flexDirection:
        "row",
      gap: 10,
      marginTop: 22,
      width: "100%",
    },

    cancelButton: {
      flex: 1,
      padding: 13,
      backgroundColor:
        COLORS.surface2,
      borderRadius:
        RADIUS.md,
      alignItems:
        "center",
    },

    cancelText: {
      color:
        COLORS.text,
      fontSize: 12,
    },

    completeButton: {
      flex: 1,
      padding: 13,
      backgroundColor:
        COLORS.primary,
      borderRadius:
        RADIUS.md,
      alignItems:
        "center",
    },

    completeText: {
      color: "#FFFFFF",
      fontWeight: "600",
      fontSize: 12,
    },
  });
