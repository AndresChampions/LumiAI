import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { COLORS, RADIUS } from "../../constants/theme";
import { useAuth } from "../../context/AuthContext";
import { useSettings } from "../../context/SettingsContext";
import { useTasks } from "../../context/TaskContext";

function formatToday() {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, "0");
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${day}/${month}/${now.getFullYear()}`;
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Buenos días";
  if (hour < 18) return "Buenas tardes";
  return "Buenas noches";
}

function parseTaskDate(value?: string | null) {
  if (!value) return null;
  const [day, month, year] = value.split("/").map(Number);
  if (!day || !month || !year) return null;
  const date = new Date(year, month - 1, day);
  date.setHours(12, 0, 0, 0);
  return date;
}

function getWeekBounds() {
  const now = new Date();
  now.setHours(12, 0, 0, 0);
  const day = now.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const start = new Date(now);
  start.setDate(now.getDate() + mondayOffset);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return { start, end };
}

type WeatherData = {
  temperature: number;
  apparentTemperature: number;
  description: string;
  max: number;
  min: number;
  city: string;
  weatherCode: number;
};

function getWeatherDescription(code: number) {
  if (code === 0) return "Despejado";
  if (code === 1) return "Mayormente despejado";
  if (code === 2) return "Parcialmente nublado";
  if (code === 3) return "Nublado";
  if (code === 45 || code === 48) return "Con niebla";
  if ([51, 53, 55, 56, 57].includes(code)) return "Llovizna";
  if ([61, 63, 65, 66, 67].includes(code)) return "Lluvia";
  if ([71, 73, 75, 77].includes(code)) return "Nieve";
  if ([80, 81, 82].includes(code)) return "Chubascos";
  if ([95, 96, 99].includes(code)) return "Tormenta";
  return "Condición variable";
}

function getWeatherIcon(code: number): keyof typeof Ionicons.glyphMap {
  if (code === 0) return "sunny-outline";
  if (code === 1 || code === 2) return "partly-sunny-outline";
  if (code === 3 || code === 45 || code === 48) return "cloudy-outline";
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return "rainy-outline";
  if (code >= 71 && code <= 77) return "snow-outline";
  if (code >= 95) return "thunderstorm-outline";
  return "partly-sunny-outline";
}

export default function HomeScreen() {
  const { tasks, loadingTasks } = useTasks();
  const { profile, user } = useAuth();
  const { locationEnabled } = useSettings();

  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loadingWeather, setLoadingWeather] = useState(false);
  const [weatherError, setWeatherError] = useState<string | null>(null);
  const [weatherRefreshKey, setWeatherRefreshKey] = useState(0);

  const todayString = formatToday();

  const pendingToday = useMemo(
    () =>
      tasks
        .filter((task) => !task.completed && task.date === todayString)
        .slice(0, 3),
    [tasks, todayString]
  );

  const pendingTodayCount = useMemo(
    () => tasks.filter((task) => !task.completed && task.date === todayString).length,
    [tasks, todayString]
  );

  const weeklyStats = useMemo(() => {
    const { start, end } = getWeekBounds();
    const weekTasks = tasks.filter((task) => {
      const date = parseTaskDate(task.date);
      return !!date && date >= start && date <= end;
    });
    const completed = weekTasks.filter((task) => task.completed).length;
    const total = weekTasks.length;
    const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);
    return { completed, total, percentage };
  }, [tasks]);

  const displayName = profile?.username ?? user?.email?.split("@")[0] ?? "Usuario";
  const nextTask = pendingToday[0];

  const daySummary = useMemo(() => {
    if (pendingTodayCount === 0) return "No tienes pendientes para hoy.";
    if (pendingTodayCount === 1) {
      return nextTask?.time
        ? `Tienes 1 pendiente. Lo próximo es ${nextTask.title} a las ${nextTask.time}.`
        : `Tienes 1 pendiente para hoy.`;
    }
    if (nextTask?.time) {
      return `Tienes ${pendingTodayCount} pendientes. Lo próximo es ${nextTask.title} a las ${nextTask.time}.`;
    }
    return `Tienes ${pendingTodayCount} pendientes para hoy.`;
  }, [pendingTodayCount, nextTask]);

  useEffect(() => {
    let mounted = true;

    const loadWeather = async () => {
      if (!locationEnabled) {
        if (mounted) {
          setWeather(null);
          setWeatherError(null);
          setLoadingWeather(false);
        }
        return;
      }

      try {
        if (mounted) {
          setLoadingWeather(true);
          setWeatherError(null);
        }

        let permission = await Location.getForegroundPermissionsAsync();
        if (permission.status !== "granted") {
          permission = await Location.requestForegroundPermissionsAsync();
        }
        if (permission.status !== "granted") {
          throw new Error("Permiso de ubicación no concedido.");
        }

        let position = await Location.getLastKnownPositionAsync({
          maxAge: 5 * 60 * 1000,
          requiredAccuracy: 5000,
        });

        if (!position) {
          position = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
        }

        const { latitude, longitude } = position.coords;
        let city = "Tu ubicación";

        if (Platform.OS !== "web") {
          try {
            const addresses = await Location.reverseGeocodeAsync({ latitude, longitude });
            const address = addresses[0];
            city = address?.city ?? address?.district ?? address?.region ?? "Tu ubicación";
          } catch (error) {
            console.log("REVERSE GEOCODE:", error);
          }
        }

        const url =
          `https://api.open-meteo.com/v1/forecast` +
          `?latitude=${latitude}` +
          `&longitude=${longitude}` +
          `&current=temperature_2m,apparent_temperature,weather_code` +
          `&daily=temperature_2m_max,temperature_2m_min` +
          `&temperature_unit=celsius` +
          `&timezone=auto` +
          `&forecast_days=1`;

        const response = await fetch(url);
        if (!response.ok) throw new Error("No se pudo consultar el clima.");

        const data = await response.json();
        const current = data?.current;
        const daily = data?.daily;

        if (
          typeof current?.temperature_2m !== "number" ||
          typeof current?.weather_code !== "number" ||
          !Array.isArray(daily?.temperature_2m_max) ||
          !Array.isArray(daily?.temperature_2m_min)
        ) {
          throw new Error("El servicio del clima devolvió datos incompletos.");
        }

        if (!mounted) return;

        setWeather({
          temperature: Math.round(current.temperature_2m),
          apparentTemperature: Math.round(current.apparent_temperature ?? current.temperature_2m),
          description: getWeatherDescription(current.weather_code),
          max: Math.round(daily.temperature_2m_max[0]),
          min: Math.round(daily.temperature_2m_min[0]),
          city,
          weatherCode: current.weather_code,
        });
      } catch (error) {
        console.log("WEATHER ERROR:", error);
        if (mounted) {
          setWeather(null);
          setWeatherError(error instanceof Error ? error.message : "No se pudo cargar el clima.");
        }
      } finally {
        if (mounted) setLoadingWeather(false);
      }
    };

    loadWeather();
    return () => {
      mounted = false;
    };
  }, [locationEnabled, weatherRefreshKey]);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.greeting}>{getGreeting()},</Text>
            <Text style={styles.userName}>{displayName} 👋</Text>
          </View>

          <TouchableOpacity activeOpacity={0.82} onPress={() => router.push("/(tabs)/profile")}>
            {profile?.avatar_url ? (
              <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={22} color={COLORS.textMuted} />
              </View>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.lumiCard}>
          <View style={styles.lumiContent}>
            <Text style={styles.lumiLabel}>LUMI</Text>
            <Text style={styles.lumiTitle}>
              {pendingTodayCount === 0
                ? "Todo bajo control"
                : pendingTodayCount === 1
                ? "Tienes 1 pendiente"
                : `Tienes ${pendingTodayCount} pendientes`}
            </Text>
            <Text style={styles.lumiSubtitle} numberOfLines={2}>
              {nextTask
                ? `Lo siguiente es ${nextTask.title}${nextTask.time ? ` · ${nextTask.time}` : ""}`
                : "Puedes preguntarme algo o planear tu día."}
            </Text>
            <TouchableOpacity
              style={styles.lumiButton}
              activeOpacity={0.86}
              onPress={() => router.push("/(tabs)/assistant")}
            >
              <Text style={styles.lumiButtonText}>Hablar con LUMI</Text>
              <Ionicons name="arrow-forward" size={15} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <Image
            source={require("../../../assets/images/lumi-2.png")}
            style={styles.lumiImage}
            resizeMode="contain"
          />
        </View>

        <View style={styles.quickGrid}>
          <QuickAction
            icon="document-text-outline"
            title="Notas y Pizarra"
            subtitle="Ideas y apuntes"
            onPress={() => router.push("/notes")}
          />
          <QuickAction
            icon="timer-outline"
            title="Tiempo"
            subtitle="Enfoque y reloj"
            onPress={() => router.push("/time")}
          />
        </View>

        <View style={styles.briefCard}>
          <Text style={styles.briefLabel}>HOY</Text>
          <Text style={styles.briefText}>{daySummary}</Text>
        </View>

        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>TAREAS DE HOY</Text>
            <Text style={styles.sectionSubtitle}>
              {pendingTodayCount === 0
                ? "Sin pendientes"
                : pendingTodayCount === 1
                ? "1 tarea pendiente"
                : `${pendingTodayCount} tareas pendientes`}
            </Text>
          </View>
          <TouchableOpacity activeOpacity={0.8} onPress={() => router.push("/(tabs)/tasks")}>
            <Text style={styles.viewAllText}>Ver todas</Text>
          </TouchableOpacity>
        </View>

        {loadingTasks ? (
          <View style={styles.emptyToday}>
            <ActivityIndicator color={COLORS.primarySoft} />
            <Text style={styles.emptyText}>Cargando tareas...</Text>
          </View>
        ) : pendingToday.length > 0 ? (
          <View style={styles.tasksContainer}>
            {pendingToday.map((task) => (
              <TouchableOpacity
                key={task.id}
                style={styles.taskCard}
                activeOpacity={0.82}
                onPress={() =>
                  router.push({ pathname: "/reminder", params: { taskId: task.id } })
                }
              >
                <View style={styles.taskDot} />
                <View style={styles.taskInfo}>
                  <Text style={styles.taskTitle} numberOfLines={1}>
                    {task.title}
                  </Text>
                  <Text style={styles.taskTime}>
                    {task.time || "Sin hora"}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={17} color={COLORS.textMuted} />
              </TouchableOpacity>
            ))}

            {pendingTodayCount > 3 && (
              <TouchableOpacity
                style={styles.moreTasksButton}
                onPress={() => router.push("/(tabs)/tasks")}
              >
                <Text style={styles.moreTasksText}>Ver {pendingTodayCount - 3} más</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View style={styles.emptyToday}>
            <View style={styles.emptyIcon}>
              <Ionicons name="checkmark" size={21} color={COLORS.success} />
            </View>
            <View style={styles.emptyInfo}>
              <Text style={styles.emptyTitle}>Todo listo</Text>
              <Text style={styles.emptyText}>No tienes tareas pendientes para hoy.</Text>
            </View>
          </View>
        )}

        <TouchableOpacity
          style={styles.newTaskButton}
          activeOpacity={0.86}
          onPress={() => router.push({ pathname: "/reminder", params: { date: todayString } })}
        >
          <Ionicons name="add" size={20} color="#FFFFFF" />
          <Text style={styles.newTaskText}>Nueva tarea</Text>
        </TouchableOpacity>

        <View style={styles.infoRow}>
          <View style={styles.infoCard}>
            <View style={styles.infoTop}>
              <Ionicons name="stats-chart-outline" size={18} color={COLORS.primarySoft} />
              <Text style={styles.infoTitle}>Semana</Text>
            </View>
            <Text style={styles.infoValue}>{weeklyStats.percentage}%</Text>
            <Text style={styles.infoCaption}>
              {weeklyStats.completed}/{weeklyStats.total} completadas
            </Text>
          </View>

          <TouchableOpacity
            style={styles.infoCard}
            activeOpacity={0.85}
            onPress={
              !locationEnabled
                ? () => router.push("/(tabs)/profile")
                : weatherError
                ? () => setWeatherRefreshKey((value) => value + 1)
                : undefined
            }
          >
            <View style={styles.infoTop}>
              {loadingWeather ? (
                <ActivityIndicator size="small" color={COLORS.primarySoft} />
              ) : (
                <Ionicons
                  name={
                    weather
                      ? getWeatherIcon(weather.weatherCode)
                      : locationEnabled
                      ? "cloud-outline"
                      : "location-outline"
                  }
                  size={18}
                  color={COLORS.primarySoft}
                />
              )}
              <Text style={styles.infoTitle}>Clima</Text>
            </View>
            <Text style={styles.infoValue}>
              {loadingWeather ? "..." : weather ? `${weather.temperature}°` : "--"}
            </Text>
            <Text style={styles.infoCaption} numberOfLines={2}>
              {!locationEnabled
                ? "Activa ubicación"
                : weatherError
                ? "Toca para reintentar"
                : weather
                ? `${weather.description} · ${weather.city}`
                : "Cargando clima"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

type QuickActionProps = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  onPress: () => void;
};

function QuickAction({ icon, title, subtitle, onPress }: QuickActionProps) {
  return (
    <TouchableOpacity style={styles.quickCard} activeOpacity={0.82} onPress={onPress}>
      <View style={styles.quickIcon}>
        <Ionicons name={icon} size={21} color={COLORS.primarySoft} />
      </View>
      <Text style={styles.quickTitle}>{title}</Text>
      <Text style={styles.quickSubtitle} numberOfLines={1}>
        {subtitle}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    width: "100%",
    maxWidth: 480,
    alignSelf: "center",
    paddingHorizontal: 18,
    paddingTop: 24,
    paddingBottom: 110,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 18,
  },
  headerText: {
    flex: 1,
    paddingRight: 12,
  },
  greeting: {
    color: COLORS.textMuted,
    fontSize: 13,
  },
  userName: {
    color: COLORS.text,
    fontSize: 24,
    fontWeight: "700",
    marginTop: 2,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  avatarPlaceholder: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: COLORS.surface2,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
  },
  lumiCard: {
    minHeight: 170,
    backgroundColor: COLORS.surface2,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: "row",
    alignItems: "center",
    overflow: "hidden",
    paddingLeft: 18,
    marginBottom: 14,
  },
  lumiContent: {
    flex: 1,
    zIndex: 2,
    paddingVertical: 18,
  },
  lumiLabel: {
    color: COLORS.primarySoft,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
  },
  lumiTitle: {
    color: COLORS.text,
    fontSize: 21,
    lineHeight: 25,
    fontWeight: "700",
    marginTop: 8,
  },
  lumiSubtitle: {
    color: COLORS.textMuted,
    fontSize: 11,
    lineHeight: 16,
    marginTop: 6,
    marginBottom: 14,
    maxWidth: 205,
  },
  lumiButton: {
    alignSelf: "flex-start",
    height: 40,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 14,
    gap: 7,
  },
  lumiButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
  lumiImage: {
    width: 144,
    height: 158,
    marginRight: -4,
    marginBottom: -8,
  },
  quickGrid: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 14,
  },
  quickCard: {
    width: "48.5%",
    minHeight: 102,
    backgroundColor: COLORS.surface2,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 13,
  },
  quickIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.surface3,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  quickTitle: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: "600",
  },
  quickSubtitle: {
    color: COLORS.textMuted,
    fontSize: 10,
    marginTop: 3,
  },
  briefCard: {
    backgroundColor: COLORS.surface2,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
    marginBottom: 18,
  },
  briefLabel: {
    color: COLORS.primarySoft,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  briefText: {
    color: COLORS.textMuted,
    fontSize: 12,
    lineHeight: 18,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  sectionTitle: {
    color: COLORS.primarySoft,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.8,
  },
  sectionSubtitle: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginTop: 4,
  },
  viewAllText: {
    color: COLORS.primarySoft,
    fontSize: 11,
    fontWeight: "600",
  },
  tasksContainer: {
    marginBottom: 10,
  },
  taskCard: {
    minHeight: 60,
    backgroundColor: COLORS.surface2,
    borderRadius: RADIUS.md,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 13,
    marginBottom: 8,
  },
  taskDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: COLORS.primarySoft,
    marginRight: 12,
  },
  taskInfo: {
    flex: 1,
    paddingVertical: 10,
  },
  taskTitle: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: "500",
  },
  taskTime: {
    color: COLORS.textMuted,
    fontSize: 10,
    marginTop: 4,
  },
  moreTasksButton: {
    alignSelf: "center",
    paddingVertical: 5,
    paddingHorizontal: 12,
  },
  moreTasksText: {
    color: COLORS.primarySoft,
    fontSize: 11,
  },
  emptyToday: {
    minHeight: 72,
    backgroundColor: COLORS.surface2,
    borderRadius: RADIUS.md,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    marginBottom: 10,
    gap: 11,
  },
  emptyIcon: {
    width: 39,
    height: 39,
    borderRadius: 20,
    backgroundColor: COLORS.surface3,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyInfo: {
    flex: 1,
  },
  emptyTitle: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: "600",
  },
  emptyText: {
    color: COLORS.textMuted,
    fontSize: 10,
    marginTop: 3,
  },
  newTaskButton: {
    height: 44,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginBottom: 18,
  },
  newTaskText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
  infoRow: {
    flexDirection: "row",
    gap: 10,
  },
  infoCard: {
    width: "48.5%",
    minHeight: 108,
    backgroundColor: COLORS.surface2,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 13,
  },
  infoTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginBottom: 12,
  },
  infoTitle: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: "600",
  },
  infoValue: {
    color: COLORS.text,
    fontSize: 22,
    fontWeight: "700",
  },
  infoCaption: {
    color: COLORS.textMuted,
    fontSize: 10,
    lineHeight: 14,
    marginTop: 4,
  },
});
