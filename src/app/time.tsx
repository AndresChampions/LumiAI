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
import { useEffect, useMemo, useRef, useState } from "react";

import { COLORS } from "../constants/theme";

type Mode = "stopwatch" | "timer" | "focus";

const TIMER_PRESETS = [5, 10, 15, 30];
const FOCUS_PRESETS = [25, 45, 60];

function formatSeconds(totalSeconds: number) {
  const safeSeconds = Math.max(0, totalSeconds);
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;

  const mm = String(minutes).padStart(2, "0");
  const ss = String(seconds).padStart(2, "0");

  if (hours > 0) {
    return `${String(hours).padStart(2, "0")}:${mm}:${ss}`;
  }

  return `${mm}:${ss}`;
}

function formatClockDate(date = new Date()) {
  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function TimeScreen() {
  const [mode, setMode] = useState<Mode>("stopwatch");
  const [now, setNow] = useState(() => formatClockDate());

  const [stopwatchSeconds, setStopwatchSeconds] = useState(0);
  const [stopwatchRunning, setStopwatchRunning] = useState(false);
  const [laps, setLaps] = useState<number[]>([]);

  const [timerMinutes, setTimerMinutes] = useState(15);
  const [timerSeconds, setTimerSeconds] = useState(15 * 60);
  const [timerRunning, setTimerRunning] = useState(false);

  const [focusMinutes, setFocusMinutes] = useState(25);
  const [focusSeconds, setFocusSeconds] = useState(25 * 60);
  const [focusRunning, setFocusRunning] = useState(false);
  const [focusSessions, setFocusSessions] = useState(0);

  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const focusIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(formatClockDate());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!stopwatchRunning) return;

    const interval = setInterval(() => {
      setStopwatchSeconds((value) => value + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [stopwatchRunning]);

  useEffect(() => {
    if (!timerRunning) {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      return;
    }

    timerIntervalRef.current = setInterval(() => {
      setTimerSeconds((value) => {
        if (value <= 1) {
          setTimerRunning(false);
          return 0;
        }
        return value - 1;
      });
    }, 1000);

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    };
  }, [timerRunning]);

  useEffect(() => {
    if (!focusRunning) {
      if (focusIntervalRef.current) {
        clearInterval(focusIntervalRef.current);
        focusIntervalRef.current = null;
      }
      return;
    }

    focusIntervalRef.current = setInterval(() => {
      setFocusSeconds((value) => {
        if (value <= 1) {
          setFocusRunning(false);
          setFocusSessions((count) => count + 1);
          return 0;
        }
        return value - 1;
      });
    }, 1000);

    return () => {
      if (focusIntervalRef.current) {
        clearInterval(focusIntervalRef.current);
        focusIntervalRef.current = null;
      }
    };
  }, [focusRunning]);

  const selectedTime = useMemo(() => {
    if (mode === "stopwatch") return formatSeconds(stopwatchSeconds);
    if (mode === "timer") return formatSeconds(timerSeconds);
    return formatSeconds(focusSeconds);
  }, [mode, stopwatchSeconds, timerSeconds, focusSeconds]);

  const isRunning =
    mode === "stopwatch"
      ? stopwatchRunning
      : mode === "timer"
      ? timerRunning
      : focusRunning;

  const heroTitle =
    mode === "stopwatch"
      ? "Mide tu ritmo"
      : mode === "timer"
      ? "Cuenta regresiva"
      : "Entra en enfoque";

  const heroText =
    mode === "stopwatch"
      ? "Controla tu tiempo con un cronómetro limpio y rápido."
      : mode === "timer"
      ? `Temporizador listo para ${timerMinutes} min.`
      : `Sesión de enfoque activa para ${focusMinutes} min.`;

  const chipText =
    mode === "stopwatch"
      ? `${laps.length} vueltas`
      : mode === "timer"
      ? `${timerMinutes} min`
      : `${focusSessions} sesiones`;

  const toggleRunning = () => {
    if (mode === "stopwatch") {
      setStopwatchRunning((value) => !value);
      return;
    }

    if (mode === "timer") {
      if (timerSeconds === 0) setTimerSeconds(timerMinutes * 60);
      setTimerRunning((value) => !value);
      return;
    }

    if (focusSeconds === 0) setFocusSeconds(focusMinutes * 60);
    setFocusRunning((value) => !value);
  };

  const resetCurrent = () => {
    if (mode === "stopwatch") {
      setStopwatchRunning(false);
      setStopwatchSeconds(0);
      setLaps([]);
      return;
    }

    if (mode === "timer") {
      setTimerRunning(false);
      setTimerSeconds(timerMinutes * 60);
      return;
    }

    setFocusRunning(false);
    setFocusSeconds(focusMinutes * 60);
  };

  const chooseTimerPreset = (minutes: number) => {
    setTimerRunning(false);
    setTimerMinutes(minutes);
    setTimerSeconds(minutes * 60);
  };

  const chooseFocusPreset = (minutes: number) => {
    setFocusRunning(false);
    setFocusMinutes(minutes);
    setFocusSeconds(minutes * 60);
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color={COLORS.text} />
          </TouchableOpacity>

          <View style={styles.headerText}>
            <Text style={styles.title}>Tiempo</Text>
            <Text style={styles.subtitle}>Cronómetro, temporizador y enfoque</Text>
          </View>
        </View>

        <View style={styles.heroCard}>
          <View style={styles.heroInfo}>
            <Text style={styles.heroEyebrow}>TU TIEMPO</Text>
            <Text style={styles.heroTitle}>{heroTitle}</Text>
            <Text style={styles.heroDescription}>{heroText}</Text>

            <View style={styles.heroMetaRow}>
              <View style={styles.heroChip}>
                <Text style={styles.heroChipText}>{chipText}</Text>
              </View>
              <Text style={styles.liveClock}>{now}</Text>
            </View>
          </View>

          <Image source={require("../../assets/images/lumi-8.png")} style={styles.heroImage} resizeMode="contain" />
        </View>

        <View style={styles.modeRow}>
          <ModeButton
            active={mode === "stopwatch"}
            icon="stopwatch-outline"
            title="Cronómetro"
            subtitle="Mide tiempo"
            onPress={() => setMode("stopwatch")}
          />
          <ModeButton
            active={mode === "timer"}
            icon="timer-outline"
            title="Timer"
            subtitle="Cuenta atrás"
            onPress={() => setMode("timer")}
          />
          <ModeButton
            active={mode === "focus"}
            icon="sparkles-outline"
            title="Enfoque"
            subtitle="Pomodoro"
            onPress={() => setMode("focus")}
          />
        </View>

        <View style={styles.clockCard}>
          <Text style={styles.clockLabel}>
            {mode === "stopwatch" ? "CRONÓMETRO" : mode === "timer" ? "TEMPORIZADOR" : "ENFOQUE"}
          </Text>
          <Text style={styles.clockValue}>{selectedTime}</Text>
          <Text style={styles.clockHint}>
            {mode === "stopwatch"
              ? "Ideal para medir estudio, ejercicio o cualquier actividad."
              : mode === "timer"
              ? "Elige un tiempo rápido y deja correr la cuenta atrás."
              : "Mantén una sesión limpia de enfoque con un solo toque."}
          </Text>

          <View style={styles.controlsRow}>
            <TouchableOpacity style={styles.sideAction} onPress={resetCurrent}>
              <Ionicons name="refresh-outline" size={18} color={COLORS.text} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.mainAction} onPress={toggleRunning}>
              <Ionicons name={isRunning ? "pause" : "play"} size={24} color="#FFFFFF" />
            </TouchableOpacity>

            {mode === "stopwatch" ? (
              <TouchableOpacity
                style={styles.sideAction}
                disabled={stopwatchSeconds === 0}
                onPress={() => setLaps((current) => [stopwatchSeconds, ...current])}
              >
                <Ionicons
                  name="flag-outline"
                  size={18}
                  color={stopwatchSeconds === 0 ? COLORS.textMuted : COLORS.text}
                />
              </TouchableOpacity>
            ) : (
              <View style={styles.sideActionPlaceholder} />
            )}
          </View>
        </View>

        {mode === "timer" && (
          <>
            <Text style={styles.sectionTitle}>TIEMPOS RÁPIDOS</Text>
            <View style={styles.presetRow}>
              {TIMER_PRESETS.map((minutes) => (
                <PresetButton
                  key={minutes}
                  active={timerMinutes === minutes}
                  label={`${minutes} min`}
                  onPress={() => chooseTimerPreset(minutes)}
                />
              ))}
            </View>
          </>
        )}

        {mode === "focus" && (
          <>
            <View style={styles.sessionCard}>
              <View style={styles.sessionIconWrap}>
                <Ionicons name="sparkles-outline" size={18} color={COLORS.primarySoft} />
              </View>
              <View style={styles.sessionInfo}>
                <Text style={styles.sessionTitle}>Sesiones completadas</Text>
                <Text style={styles.sessionText}>{focusSessions} completadas</Text>
              </View>
            </View>

            <Text style={styles.sectionTitle}>DURACIÓN DE ENFOQUE</Text>
            <View style={styles.presetRow}>
              {FOCUS_PRESETS.map((minutes) => (
                <PresetButton
                  key={minutes}
                  active={focusMinutes === minutes}
                  label={`${minutes} min`}
                  onPress={() => chooseFocusPreset(minutes)}
                />
              ))}
            </View>
          </>
        )}

        {mode === "stopwatch" && laps.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>MIS VUELTAS</Text>
            <View style={styles.listCard}>
              {laps.slice(0, 8).map((lap, index) => (
                <View
                  key={`${lap}-${index}`}
                  style={[
                    styles.lapRow,
                    index === Math.min(laps.length, 8) - 1 && styles.lapRowLast,
                  ]}
                >
                  <Text style={styles.lapLabel}>Vuelta {laps.length - index}</Text>
                  <Text style={styles.lapTime}>{formatSeconds(lap)}</Text>
                </View>
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

type ModeButtonProps = {
  active: boolean;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  onPress: () => void;
};

function ModeButton({ active, icon, title, subtitle, onPress }: ModeButtonProps) {
  return (
    <TouchableOpacity
      style={[styles.modeButton, active && styles.modeButtonActive]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <Ionicons name={icon} size={19} color={active ? "#FFFFFF" : COLORS.primarySoft} />
      <Text style={[styles.modeButtonTitle, active && styles.modeButtonTitleActive]} numberOfLines={1}>
        {title}
      </Text>
      <Text style={[styles.modeButtonSubtitle, active && styles.modeButtonSubtitleActive]} numberOfLines={1}>
        {subtitle}
      </Text>
    </TouchableOpacity>
  );
}

type PresetButtonProps = {
  active: boolean;
  label: string;
  onPress: () => void;
};

function PresetButton({ active, label, onPress }: PresetButtonProps) {
  return (
    <TouchableOpacity style={[styles.presetButton, active && styles.presetButtonActive]} onPress={onPress}>
      <Text style={[styles.presetButtonText, active && styles.presetButtonTextActive]}>{label}</Text>
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
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 80,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.surface2,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  headerText: {
    flex: 1,
  },
  title: {
    color: COLORS.text,
    fontSize: 22,
    fontWeight: "700",
  },
  subtitle: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  heroCard: {
    backgroundColor: COLORS.surface2,
    borderRadius: 24,
    paddingVertical: 18,
    paddingLeft: 18,
    paddingRight: 12,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
  },
  heroInfo: {
    flex: 1,
    paddingRight: 8,
  },
  heroEyebrow: {
    color: COLORS.primarySoft,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    marginBottom: 8,
  },
  heroTitle: {
    color: COLORS.text,
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 6,
  },
  heroDescription: {
    color: COLORS.textMuted,
    fontSize: 12,
    lineHeight: 18,
  },
  heroMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 14,
    gap: 10,
  },
  heroChip: {
    backgroundColor: COLORS.surface3,
    paddingHorizontal: 12,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  heroChipText: {
    color: COLORS.primarySoft,
    fontSize: 11,
    fontWeight: "700",
  },
  liveClock: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: "700",
  },
  heroImage: {
    width: 118,
    height: 118,
  },
  modeRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 18,
  },
  modeButton: {
    flex: 1,
    backgroundColor: COLORS.surface2,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 8,
  },
  modeButtonActive: {
    backgroundColor: COLORS.primary,
  },
  modeButtonTitle: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: "700",
    marginTop: 8,
  },
  modeButtonTitleActive: {
    color: "#FFFFFF",
  },
  modeButtonSubtitle: {
    color: COLORS.textMuted,
    fontSize: 10,
    marginTop: 2,
  },
  modeButtonSubtitleActive: {
    color: "rgba(255,255,255,0.82)",
  },
  clockCard: {
    backgroundColor: COLORS.surface2,
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingVertical: 22,
    marginBottom: 18,
    alignItems: "center",
  },
  clockLabel: {
    color: COLORS.primarySoft,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    marginBottom: 10,
  },
  clockValue: {
    color: COLORS.text,
    fontSize: 52,
    fontWeight: "300",
    lineHeight: 58,
  },
  clockHint: {
    color: COLORS.textMuted,
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
    marginTop: 10,
    maxWidth: 290,
  },
  controlsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 18,
    marginTop: 22,
  },
  mainAction: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  sideAction: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.surface3,
    alignItems: "center",
    justifyContent: "center",
  },
  sideActionPlaceholder: {
    width: 44,
    height: 44,
  },
  sectionTitle: {
    color: COLORS.primarySoft,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  presetRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 18,
  },
  presetButton: {
    flex: 1,
    height: 44,
    borderRadius: 14,
    backgroundColor: COLORS.surface2,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  presetButtonActive: {
    backgroundColor: COLORS.surface3,
  },
  presetButtonText: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: "700",
  },
  presetButtonTextActive: {
    color: COLORS.text,
  },
  sessionCard: {
    backgroundColor: COLORS.surface2,
    borderRadius: 20,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
  },
  sessionIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.surface3,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  sessionInfo: {
    flex: 1,
  },
  sessionTitle: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: "700",
  },
  sessionText: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 3,
  },
  listCard: {
    backgroundColor: COLORS.surface2,
    borderRadius: 22,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  lapRow: {
    minHeight: 54,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  lapRowLast: {
    borderBottomWidth: 0,
  },
  lapLabel: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "600",
  },
  lapTime: {
    color: COLORS.textMuted,
    fontSize: 13,
    fontWeight: "600",
  },
});
