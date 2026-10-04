import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

import { useAuth } from "../../context/AuthContext";
import { useTasks } from "../../context/TaskContext";

import {
  COLORS,
  RADIUS,
} from "../../constants/theme";

/* =========================
   UTILIDADES
========================= */

function formatToday() {
  const now = new Date();

  const day = String(
    now.getDate()
  ).padStart(2, "0");

  const month = String(
    now.getMonth() + 1
  ).padStart(2, "0");

  const year =
    now.getFullYear();

  return `${day}/${month}/${year}`;
}

function getGreeting() {
  const hour =
    new Date().getHours();

  if (hour < 12) {
    return "Buenos días";
  }

  if (hour < 18) {
    return "Buenas tardes";
  }

  return "Buenas noches";
}

/* =========================
   SCREEN
========================= */

export default function HomeScreen() {
  const {
    tasks,
    loadingTasks,
  } = useTasks();

  const {
    profile,
    user,
  } = useAuth();

  const todayString =
    formatToday();

  const pendingToday =
    tasks
      .filter(
        (task) =>
          !task.completed &&
          task.date ===
            todayString
      )
      .slice(0, 4);

  const pendingTodayCount =
    tasks.filter(
      (task) =>
        !task.completed &&
        task.date ===
          todayString
    ).length;

  const displayName =
    profile?.username ??
    user?.email?.split("@")[0] ??
    "Usuario";

  /*
   * Sigue temporal.
   * Luego hacemos clima real.
   */
  const weather = {
    temperature: 28,
    description:
      "Parcialmente nublado",
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={
          styles.content
        }
        showsVerticalScrollIndicator={
          false
        }
      >
        {/* =========================
            HEADER
        ========================= */}

        <View style={styles.header}>
          <View>
            <Text
              style={
                styles.greeting
              }
            >
              {getGreeting()},
            </Text>

            <Text
              style={
                styles.userName
              }
            >
              {displayName} 👋
            </Text>
          </View>

          <TouchableOpacity
            onPress={() =>
              router.push(
                "/(tabs)/profile"
              )
            }
          >
            {profile?.avatar_url ? (
              <Image
                source={{
                  uri:
                    profile.avatar_url,
                }}
                style={
                  styles.avatar
                }
              />
            ) : (
              <View
                style={
                  styles.avatarPlaceholder
                }
              >
                <Ionicons
                  name="person"
                  size={22}
                  color={
                    COLORS.textMuted
                  }
                />
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* =========================
            LUMI
        ========================= */}

        <View
          style={
            styles.lumiCard
          }
        >
          <View
            style={
              styles.lumiContent
            }
          >
            <Text
              style={
                styles.lumiLabel
              }
            >
              LUMI
            </Text>

            <Text
              style={
                styles.lumiTitle
              }
            >
              ¿Qué hacemos hoy?
            </Text>

            <Text
              style={
                styles.lumiSubtitle
              }
            >
              Estoy por aquí.
            </Text>

            <TouchableOpacity
              style={
                styles.lumiButton
              }
              onPress={() =>
                router.push(
                  "/(tabs)/assistant"
                )
              }
            >
              <Text
                style={
                  styles.lumiButtonText
                }
              >
                Hablar con LUMI
              </Text>

              <Ionicons
                name="arrow-forward"
                size={17}
                color="#FFFFFF"
              />
            </TouchableOpacity>
          </View>

          <Image
            source={require(
              "../../../assets/images/lumi-2.png"
            )}
            style={
              styles.lumiImage
            }
            resizeMode="contain"
          />
        </View>

        {/* =========================
            PREGUNTA RÁPIDA
        ========================= */}

        <TouchableOpacity
          style={
            styles.quickCard
          }
          onPress={() =>
            router.push(
              "/(tabs)/assistant"
            )
          }
        >
          <View
            style={
              styles.quickIcon
            }
          >
            <Ionicons
              name="chatbubble-ellipses-outline"
              size={21}
              color={
                COLORS.primarySoft
              }
            />
          </View>

          <View
            style={
              styles.quickInfo
            }
          >
            <Text
              style={
                styles.quickTitle
              }
            >
              Pregunta rápida
            </Text>

            <Text
              style={
                styles.quickText
              }
            >
              Escribe algo a LUMI
            </Text>
          </View>

          <Ionicons
            name="chevron-forward"
            size={19}
            color={
              COLORS.textMuted
            }
          />
        </TouchableOpacity>

        {/* =========================
            PENDIENTES
        ========================= */}

        <View
          style={
            styles.sectionHeader
          }
        >
          <View>
            <Text
              style={
                styles.sectionLabel
              }
            >
              PENDIENTES DE HOY
            </Text>

            <Text
              style={
                styles.sectionCount
              }
            >
              {pendingTodayCount ===
              0
                ? "Sin pendientes"
                : pendingTodayCount ===
                  1
                ? "1 tarea pendiente"
                : `${pendingTodayCount} tareas pendientes`}
            </Text>
          </View>

          <TouchableOpacity
            onPress={() =>
              router.push(
                "/(tabs)/tasks"
              )
            }
          >
            <Text
              style={
                styles.viewAllText
              }
            >
              Ver todas
            </Text>
          </TouchableOpacity>
        </View>

        <Text
          style={
            styles.todayTitle
          }
        >
          HOY
        </Text>

        {/* =========================
            TAREAS
        ========================= */}

        {loadingTasks ? (
          <View
            style={
              styles.emptyToday
            }
          >
            <Text
              style={
                styles.emptyText
              }
            >
              Cargando...
            </Text>
          </View>
        ) : pendingToday.length >
          0 ? (
          <View
            style={
              styles.tasksContainer
            }
          >
            {pendingToday.map(
              (task) => (
                <TouchableOpacity
                  key={
                    task.id
                  }
                  style={
                    styles.taskCard
                  }
                  onPress={() =>
                    router.push({
                      pathname:
                        "/reminder",

                      params: {
                        taskId:
                          task.id,
                      },
                    })
                  }
                >
                  <View
                    style={
                      styles.taskIcon
                    }
                  >
                    <Ionicons
                      name="ellipse-outline"
                      size={20}
                      color={
                        COLORS.primarySoft
                      }
                    />
                  </View>

                  <View
                    style={
                      styles.taskInfo
                    }
                  >
                    <Text
                      style={
                        styles.taskTitle
                      }
                      numberOfLines={1}
                    >
                      {
                        task.title
                      }
                    </Text>

                    <View
                      style={
                        styles.taskMetaRow
                      }
                    >
                      <Ionicons
                        name="time-outline"
                        size={12}
                        color={
                          COLORS.textMuted
                        }
                      />

                      <Text
                        style={
                          styles.taskTime
                        }
                      >
                        {
                          task.time
                        }
                      </Text>
                    </View>
                  </View>

                  <Ionicons
                    name="chevron-forward"
                    size={18}
                    color={
                      COLORS.textMuted
                    }
                  />
                </TouchableOpacity>
              )
            )}

            {pendingTodayCount >
              4 && (
              <TouchableOpacity
                style={
                  styles.moreTasksButton
                }
                onPress={() =>
                  router.push(
                    "/(tabs)/tasks"
                  )
                }
              >
                <Text
                  style={
                    styles.moreTasksText
                  }
                >
                  Ver{" "}
                  {pendingTodayCount -
                    4}{" "}
                  más
                </Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View
            style={
              styles.emptyToday
            }
          >
            <View
              style={
                styles.emptyIcon
              }
            >
              <Ionicons
                name="checkmark-circle-outline"
                size={32}
                color={
                  COLORS.success
                }
              />
            </View>

            <View
              style={
                styles.emptyInfo
              }
            >
              <Text
                style={
                  styles.emptyTitle
                }
              >
                Todo listo
              </Text>

              <Text
                style={
                  styles.emptyText
                }
              >
                No hay tareas para hoy.
              </Text>
            </View>
          </View>
        )}

        {/* =========================
            NUEVA TAREA
        ========================= */}

        <TouchableOpacity
          style={
            styles.newTaskButton
          }
          onPress={() =>
            router.push({
              pathname:
                "/reminder",

              params: {
                date:
                  todayString,
              },
            })
          }
        >
          <Ionicons
            name="add"
            size={20}
            color="#FFFFFF"
          />

          <Text
            style={
              styles.newTaskText
            }
          >
            Nueva tarea
          </Text>
        </TouchableOpacity>

        {/* =========================
            CLIMA
        ========================= */}

        <Text
          style={
            styles.weatherLabel
          }
        >
          CLIMA
        </Text>

        <View
          style={
            styles.weatherCard
          }
        >
          <View
            style={
              styles.weatherIcon
            }
          >
            <Ionicons
              name="partly-sunny-outline"
              size={35}
              color={
                COLORS.primarySoft
              }
            />
          </View>

          <View>
            <Text
              style={
                styles.temperature
              }
            >
              {
                weather.temperature
              }
              °C
            </Text>

            <Text
              style={
                styles.weatherDescription
              }
            >
              {
                weather.description
              }
            </Text>
          </View>
        </View>
      </ScrollView>
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
      alignSelf: "center",
      paddingHorizontal: 18,
      paddingTop: 28,
      paddingBottom: 100,
    },

    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "space-between",
      marginBottom: 24,
    },

    greeting: {
      color:
        COLORS.textMuted,
      fontSize: 13,
    },

    userName: {
      color:
        COLORS.text,
      fontSize: 24,
      fontWeight: "700",
      marginTop: 2,
    },

    avatar: {
      width: 48,
      height: 48,
      borderRadius: 24,
      borderWidth: 2,
      borderColor:
        COLORS.primary,
    },

    avatarPlaceholder: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor:
        COLORS.surface2,
      borderWidth: 2,
      borderColor:
        COLORS.border,
      alignItems: "center",
      justifyContent:
        "center",
    },

    /* LUMI */

    lumiCard: {
      minHeight: 180,
      backgroundColor:
        COLORS.surface2,
      borderRadius:
        RADIUS.lg,
      borderWidth: 1,
      borderColor:
        COLORS.border,
      flexDirection: "row",
      alignItems: "center",
      overflow: "hidden",
      marginBottom: 12,
      paddingLeft: 18,
    },

    lumiContent: {
      flex: 1,
      zIndex: 2,
      paddingVertical: 18,
    },

    lumiLabel: {
      color:
        COLORS.primarySoft,
      fontSize: 11,
      fontWeight: "700",
      letterSpacing: 1.3,
    },

    lumiTitle: {
      color:
        COLORS.text,
      fontSize: 19,
      fontWeight: "700",
      marginTop: 5,
    },

    lumiSubtitle: {
      color:
        COLORS.textMuted,
      fontSize: 11,
      marginTop: 4,
      marginBottom: 16,
    },

    lumiButton: {
      alignSelf:
        "flex-start",
      height: 42,
      borderRadius:
        RADIUS.md,
      backgroundColor:
        COLORS.primary,
      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "center",
      paddingHorizontal: 15,
      gap: 7,
    },

    lumiButtonText: {
      color: "#FFFFFF",
      fontSize: 12,
      fontWeight: "600",
    },

    lumiImage: {
      width: 145,
      height: 160,
      marginRight: -5,
      marginBottom: -8,
    },

    /* QUICK */

    quickCard: {
      minHeight: 68,
      backgroundColor:
        COLORS.surface2,
      borderRadius:
        RADIUS.md,
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 13,
      marginBottom: 26,
    },

    quickIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor:
        COLORS.surface3,
      alignItems: "center",
      justifyContent:
        "center",
    },

    quickInfo: {
      flex: 1,
      marginLeft: 11,
    },

    quickTitle: {
      color:
        COLORS.text,
      fontSize: 13,
      fontWeight: "600",
    },

    quickText: {
      color:
        COLORS.textMuted,
      fontSize: 10,
      marginTop: 3,
    },

    /* SECTION */

    sectionHeader: {
      flexDirection: "row",
      alignItems:
        "flex-end",
      justifyContent:
        "space-between",
      marginBottom: 15,
    },

    sectionLabel: {
      color:
        COLORS.primarySoft,
      fontSize: 11,
      fontWeight: "700",
    },

    sectionCount: {
      color:
        COLORS.textMuted,
      fontSize: 11,
      marginTop: 4,
    },

    viewAllText: {
      color:
        COLORS.primarySoft,
      fontSize: 11,
      fontWeight: "500",
    },

    todayTitle: {
      color:
        COLORS.text,
      fontSize: 12,
      fontWeight: "700",
      marginBottom: 9,
    },

    /* TASKS */

    tasksContainer: {
      marginBottom: 12,
    },

    taskCard: {
      minHeight: 66,
      backgroundColor:
        COLORS.surface2,
      borderRadius:
        RADIUS.md,
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 12,
      marginBottom: 8,
    },

    taskIcon: {
      width: 34,
      alignItems: "center",
      justifyContent:
        "center",
    },

    taskInfo: {
      flex: 1,
      paddingVertical: 10,
      marginLeft: 6,
    },

    taskTitle: {
      color:
        COLORS.text,
      fontSize: 13,
      fontWeight: "500",
    },

    taskMetaRow: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: 5,
    },

    taskTime: {
      color:
        COLORS.textMuted,
      fontSize: 10,
      marginLeft: 4,
    },

    moreTasksButton: {
      alignSelf:
        "center",
      paddingVertical: 7,
      paddingHorizontal: 12,
    },

    moreTasksText: {
      color:
        COLORS.primarySoft,
      fontSize: 11,
    },

    /* EMPTY */

    emptyToday: {
      minHeight: 78,
      backgroundColor:
        COLORS.surface2,
      borderRadius:
        RADIUS.md,
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 14,
      marginBottom: 12,
    },

    emptyIcon: {
      width: 43,
      height: 43,
      borderRadius: 22,
      backgroundColor:
        COLORS.surface3,
      alignItems: "center",
      justifyContent:
        "center",
    },

    emptyInfo: {
      flex: 1,
      marginLeft: 11,
    },

    emptyTitle: {
      color:
        COLORS.text,
      fontSize: 13,
      fontWeight: "600",
    },

    emptyText: {
      color:
        COLORS.textMuted,
      fontSize: 10,
      marginTop: 3,
    },

    /* NUEVA */

    newTaskButton: {
      height: 46,
      backgroundColor:
        COLORS.primary,
      borderRadius:
        RADIUS.md,
      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "center",
      gap: 6,
      marginBottom: 28,
    },

    newTaskText: {
      color: "#FFFFFF",
      fontSize: 13,
      fontWeight: "600",
    },

    /* CLIMA */

    weatherLabel: {
      color:
        COLORS.primarySoft,
      fontSize: 11,
      fontWeight: "700",
      marginBottom: 10,
    },

    weatherCard: {
      minHeight: 90,
      backgroundColor:
        COLORS.surface2,
      borderRadius:
        RADIUS.lg,
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      borderWidth: 1,
      borderColor:
        COLORS.border,
    },

    weatherIcon: {
      width: 58,
      height: 58,
      borderRadius: 29,
      backgroundColor:
        COLORS.surface3,
      alignItems: "center",
      justifyContent:
        "center",
      marginRight: 15,
    },

    temperature: {
      color:
        COLORS.text,
      fontSize: 25,
      fontWeight: "600",
    },

    weatherDescription: {
      color:
        COLORS.textMuted,
      fontSize: 11,
      marginTop: 2,
    },
  });