import { useState } from "react";

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
      "es-ES",
      {
        day: "numeric",
        month: "long",
        year: "numeric",
      }
    )
    .toUpperCase();
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
      "pending" |
      "completed"
    >("pending");

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

        groups[key].push(
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
     EDITAR
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

  /* =========================================================
     COMPLETAR
  ========================================================= */

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
          <Ionicons
            name="menu-outline"
            size={27}
            color={
              COLORS.text
            }
          />

          <Text
            style={
              styles.title
            }
          >
            Mis tareas
          </Text>

          {/* ÚNICO + */}

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

        {/* =====================================================
            LUMI
        ===================================================== */}

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

            {pendingCount > 0 ? (
              <Text
                style={
                  styles.lumiHint
                }
              >
                Tienes{" "}
                {pendingCount}{" "}
                {pendingCount ===
                1
                  ? "pendiente"
                  : "pendientes"}.
              </Text>
            ) : (
              <Text
                style={
                  styles.lumiHint
                }
              >
                Todo tranquilo por ahora ✨
              </Text>
            )}
          </View>

          {/*
           * Este espacio conserva el balance visual
           * que tenía el botón + anterior,
           * pero NO muestra nada.
           */}

          <View
            style={
              styles.lumiSpacer
            }
          />
        </View>

        {/* =====================================================
            TABS
        ===================================================== */}

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

        {/* =====================================================
            MÉTRICAS
        ===================================================== */}

        {selectedTab ===
          "completed" && (
          <View
            style={
              styles.metricsContainer
            }
          >
            <View
              style={
                styles.metricRow
              }
            >
              <MetricCard
                icon="list-outline"
                value={
                  totalTasks
                }
                label="Total"
              />

              <MetricCard
                icon="checkmark-circle-outline"
                value={
                  completedCount
                }
                label="Completadas"
              />

              <MetricCard
                icon="time-outline"
                value={
                  pendingCount
                }
                label="Pendientes"
              />
            </View>

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
                <Text
                  style={
                    styles.progressTitle
                  }
                >
                  Progreso general
                </Text>

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
          </View>
        )}

        {/* =====================================================
            LISTA
        ===================================================== */}

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
                    {label}
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
                  (task) => (
                    <View
                      key={
                        task.id
                      }
                      style={
                        styles.taskCard
                      }
                    >
                      {/* COMPLETAR */}

                      <TouchableOpacity
                        style={
                          styles.checkButton
                        }
                        onPress={() =>
                          confirmComplete(
                            task
                          )
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

                      {/* EDITAR */}

                      <TouchableOpacity
                        style={
                          styles.taskBody
                        }
                        onPress={() =>
                          editTask(
                            task
                          )
                        }
                      >
                        <Text
                          style={[
                            styles.taskTitle,

                            task.completed &&
                              styles.completedTask,
                          ]}
                        >
                          {
                            task.title
                          }
                        </Text>

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

                      {/* EDIT ICON */}

                      <TouchableOpacity
                        style={
                          styles.actionButton
                        }
                        onPress={() =>
                          editTask(
                            task
                          )
                        }
                      >
                        <Ionicons
                          name="create-outline"
                          size={19}
                          color={
                            COLORS.primarySoft
                          }
                        />
                      </TouchableOpacity>

                      {/* DELETE */}

                      <TouchableOpacity
                        style={
                          styles.actionButton
                        }
                        onPress={() =>
                          deleteTask(
                            task.id
                          )
                        }
                      >
                        <Ionicons
                          name="trash-outline"
                          size={19}
                          color={
                            COLORS.danger
                          }
                        />
                      </TouchableOpacity>
                    </View>
                  )
                )}
              </View>
            )
          )}

          {/* EMPTY */}

          {groupedEntries.length ===
            0 && (
            <View
              style={
                styles.emptyContainer
              }
            >
              <Image
                source={require(
                  "../../../assets/images/lumi-4.png"
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
                {selectedTab ===
                "pending"
                  ? "Todo listo por aquí"
                  : "Aún no hay completadas"}
              </Text>

              <Text
                style={
                  styles.emptySubtitle
                }
              >
                {selectedTab ===
                "pending"
                  ? "Cuando tengas algo pendiente, lo anotamos juntos."
                  : "Cuando completes una tarea aparecerá aquí."}
              </Text>

              {selectedTab ===
                "pending" && (
                <TouchableOpacity
                  style={
                    styles.emptyButton
                  }
                  onPress={() =>
                    router.push(
                      "/reminder"
                    )
                  }
                >
                  <Ionicons
                    name="add"
                    size={18}
                    color="#FFFFFF"
                  />

                  <Text
                    style={
                      styles.emptyButtonText
                    }
                  >
                    Anotar tarea
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </ScrollView>

        {/* =====================================================
            MODAL COMPLETAR
        ===================================================== */}

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
   METRIC CARD
========================================================= */

function MetricCard({
  icon,
  value,
  label,
}: {
  icon:
    keyof typeof Ionicons.glyphMap;

  value: number;

  label: string;
}) {
  return (
    <View
      style={
        styles.metricCard
      }
    >
      <Ionicons
        name={icon}
        size={22}
        color={
          COLORS.primarySoft
        }
      />

      <Text
        style={
          styles.metricNumber
        }
      >
        {value}
      </Text>

      <Text
        style={
          styles.metricLabel
        }
      >
        {label}
      </Text>
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

      paddingTop: 25,
    },

    /* HEADER */

    header: {
      flexDirection:
        "row",

      justifyContent:
        "space-between",

      alignItems:
        "center",

      marginBottom: 16,
    },

    title: {
      color:
        COLORS.text,

      fontSize: 21,

      fontWeight: "600",
    },

    headerAddButton: {
      width: 36,

      height: 36,

      borderRadius: 18,

      backgroundColor:
        COLORS.primary,

      alignItems:
        "center",

      justifyContent:
        "center",
    },

    /* LUMI */

    lumiCard: {
      minHeight: 104,

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

      marginBottom: 16,
    },

    lumiImage: {
      width: 82,

      height: 82,
    },

    lumiContent: {
      flex: 1,

      marginLeft: 7,

      paddingRight: 6,
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

    /*
     * IMPORTANTE:
     * Conserva exactamente el espacio
     * del botón anterior, pero no se ve.
     */

    lumiSpacer: {
      width: 36,

      height: 36,

      marginLeft: 4,
    },

    /* TABS */

    tabs: {
      height: 42,

      borderWidth: 1,

      borderColor:
        COLORS.border,

      borderRadius:
        RADIUS.md,

      overflow:
        "hidden",

      flexDirection:
        "row",

      marginBottom: 18,
    },

    tab: {
      flex: 1,

      alignItems:
        "center",

      justifyContent:
        "center",
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
      color:
        "#FFFFFF",

      fontWeight: "600",
    },

    /* METRICS */

    metricsContainer: {
      marginBottom: 16,
    },

    metricRow: {
      flexDirection:
        "row",

      gap: 8,

      marginBottom: 10,
    },

    metricCard: {
      flex: 1,

      backgroundColor:
        COLORS.surface2,

      borderRadius:
        RADIUS.md,

      alignItems:
        "center",

      padding: 12,
    },

    metricNumber: {
      color:
        COLORS.text,

      fontSize: 21,

      fontWeight: "700",
    },

    metricLabel: {
      color:
        COLORS.textMuted,

      fontSize: 9,
    },

    progressCard: {
      backgroundColor:
        COLORS.surface2,

      borderRadius:
        RADIUS.md,

      padding: 14,
    },

    progressHeader: {
      flexDirection:
        "row",

      justifyContent:
        "space-between",
    },

    progressTitle: {
      color:
        COLORS.text,

      fontSize: 12,
    },

    progressPercentage: {
      color:
        COLORS.primarySoft,

      fontSize: 12,

      fontWeight: "600",
    },

    progressTrack: {
      height: 8,

      backgroundColor:
        COLORS.surface3,

      marginTop: 10,

      borderRadius: 5,

      overflow:
        "hidden",
    },

    progressFill: {
      height: "100%",

      backgroundColor:
        COLORS.primary,
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
    },

    checkButton: {
      padding: 8,
    },

    taskBody: {
      flex: 1,

      paddingVertical: 10,
    },

    taskTitle: {
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
      width: 120,

      height: 120,

      marginBottom: 4,
    },

    emptyTitle: {
      color:
        COLORS.text,

      fontSize: 16,

      fontWeight: "700",

      marginTop: 5,
    },

    emptySubtitle: {
      color:
        COLORS.textMuted,

      fontSize: 11,

      lineHeight: 17,

      textAlign:
        "center",

      marginTop: 6,

      maxWidth: 260,
    },

    emptyButton: {
      height: 42,

      backgroundColor:
        COLORS.primary,

      borderRadius:
        RADIUS.md,

      flexDirection:
        "row",

      alignItems:
        "center",

      justifyContent:
        "center",

      paddingHorizontal: 16,

      gap: 6,

      marginTop: 16,
    },

    emptyButtonText: {
      color:
        "#FFFFFF",

      fontSize: 12,

      fontWeight: "600",
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
      color:
        "#FFFFFF",

      fontWeight: "600",

      fontSize: 12,
    },
  });