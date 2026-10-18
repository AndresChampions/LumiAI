import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";

import { COLORS, RADIUS } from "../constants/theme";

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

export default function TimeScreen() {
  const [mode, setMode] = useState<Mode>("stopwatch");

  const [stopwatchSeconds, setStopwatchSeconds] = useState(0);
  const [stopwatchRunning, setStopwatchRunning] = useState(false);
  const [laps, setLaps] = useState<number[]>([]);

  const [timerMinutes, setTimerMinutes] = useState(15);
  const [timerSeconds, setTimerSeconds] = useState(timerMinutes * 60);
  const [timerRunning, setTimerRunning] = useState(false);

  const [focusMinutes, setFocusMinutes] = useState(25);
  const [focusSeconds, setFocusSeconds] = useState(focusMinutes * 60);
  const [focusRunning, setFocusRunning] = useState(false);
  const [focusSessions, setFocusSessions] = useState(0);

  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const focusIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

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

  const activeSubtitle =
    mode === "stopwatch"
      ? "Mide exactamente cuánto te toma una actividad."
      : mode === "timer"
      ? `Temporizador de ${timerMinutes} minutos.`
      : `Sesión de enfoque de ${focusMinutes} minutos.`;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={22} color={COLORS.text} />
          </TouchableOpacity>

          <View style={styles.headerText}>
            <Text style={styles.title}>Tiempo</Text>
            <Text style={styles.subtitle}>Cronometra, enfócate y toma descansos.</Text>
          </View>
        </View>

        <View style={styles.modeRow}>
          <ModeButton active={mode === "stopwatch"} icon="stopwatch-outline" label="Cronómetro" onPress={() => setMode("stopwatch")} />
          <ModeButton active={mode === "timer"} icon="timer-outline" label="Temporizador" onPress={() => setMode("timer")} />
          <ModeButton active={mode === "focus"} icon="leaf-outline" label="Enfoque" onPress={() => setMode("focus")} />
        </View>

        <View style={styles.clockCard}>
          <View style={styles.clockIcon}>
            <Ionicons
              name={mode === "stopwatch" ? "stopwatch-outline" : mode === "timer" ? "timer-outline" : "leaf-outline"}
              size={27}
              color={COLORS.primarySoft}
            />
          </View>

          <Text style={styles.clockValue}>{selectedTime}</Text>
          <Text style={styles.clockSubtitle}>{activeSubtitle}</Text>

          <View style={styles.controlsRow}>
            <TouchableOpacity style={styles.secondaryControl} onPress={resetCurrent}>
              <Ionicons name="refresh-outline" size={19} color={COLORS.text} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.primaryControl} onPress={toggleRunning}>
              <Ionicons name={isRunning ? "pause" : "play"} size={24} color="#FFFFFF" />
            </TouchableOpacity>

            {mode === "stopwatch" ? (
              <TouchableOpacity
                style={styles.secondaryControl}
                disabled={stopwatchSeconds === 0}
                onPress={() => setLaps((current) => [stopwatchSeconds, ...current])}
              >
                <Ionicons
                  name="flag-outline"
                  size={19}
                  color={stopwatchSeconds === 0 ? COLORS.textMuted : COLORS.text}
                />
              </TouchableOpacity>
            ) : (
              <View style={styles.controlSpacer} />
            )}
          </View>
        </View>

        {mode === "timer" && (
          <>
            <Text style={styles.sectionLabel}>TIEMPOS RÁPIDOS</Text>
            <View style={styles.presetGrid}>
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
            <View style={styles.focusStats}>
              <View>
                <Text style={styles.focusStatsLabel}>SESIONES TERMINADAS</Text>
                <Text style={styles.focusStatsValue}>{focusSessions}</Text>
              </View>
              <Ionicons name="sparkles-outline" size={25} color={COLORS.primarySoft} />
            </View>

            <Text style={styles.sectionLabel}>DURACIÓN DE ENFOQUE</Text>
            <View style={styles.presetGrid}>
              {FOCUS_PRESETS.map((minutes) => (
                <PresetButton
                  key={minutes}
                  active={focusMinutes === minutes}
                  label={`${minutes} min`}
                  onPress={() => chooseFocusPreset(minutes)}
                />
              ))}
            </View>

            <View style={styles.tipCard}>
              <View style={styles.tipIcon}>
                <Ionicons name="heart-outline" size={20} color={COLORS.primarySoft} />
              </View>
              <View style={styles.tipInfo}>
                <Text style={styles.tipTitle}>Consejo de LUMI</Text>
                <Text style={styles.tipText}>
                  Una sesión de 25 minutos con una pausa corta ayuda a mantener el enfoque sin saturarte.
                </Text>
              </View>
            </View>
          </>
        )}

        {mode === "stopwatch" && laps.length > 0 && (
          <>
            <Text style={styles.sectionLabel}>VUELTAS</Text>
            <View style={styles.lapsCard}>
              {laps.slice(0, 8).map((lap, index) => (
                <View key={`${lap}-${index}`} style={styles.lapRow}>
                  <Text style={styles.lapLabel}>Vuelta {laps.length - index}</Text>
                  <Text style={styles.lapTime}>{formatSeconds(lap)}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        <View style={styles.miniGrid}>
          <View style={styles.miniCard}>
            <Ionicons name="moon-outline" size={21} color={COLORS.primarySoft} />
            <Text style={styles.miniTitle}>Descansos</Text>
            <Text style={styles.miniText}>Haz una pausa breve entre sesiones largas.</Text>
          </View>

          <View style={styles.miniCard}>
            <Ionicons name="checkmark-done-outline" size={21} color={COLORS.primarySoft} />
            <Text style={styles.miniTitle}>Productividad</Text>
            <Text style={styles.miniText}>Combina Tiempo con tus tareas de LUMI.</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

type ModeButtonProps = {
  active: boolean;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
};

function ModeButton({ active, icon, label, onPress }: ModeButtonProps) {
  return (
    <TouchableOpacity style={[styles.modeButton, active && styles.modeButtonActive]} onPress={onPress} activeOpacity={0.82}>
      <Ionicons name={icon} size={18} color={active ? COLORS.primarySoft : COLORS.textMuted} />
      <Text style={[styles.modeText, active && styles.modeTextActive]} numberOfLines={1}>{label}</Text>
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
      <Text style={[styles.presetText, active && styles.presetTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { width: "100%", maxWidth: 480, alignSelf: "center", paddingHorizontal: 18, paddingTop: 22, paddingBottom: 80 },
  header: { flexDirection: "row", alignItems: "center", marginBottom: 22 },
  backButton: { width: 42, height: 42, borderRadius: 21, backgroundColor: COLORS.surface2, borderWidth: 1, borderColor: COLORS.border, alignItems: "center", justifyContent: "center", marginRight: 12 },
  headerText: { flex: 1 },
  title: { color: COLORS.text, fontSize: 24, fontWeight: "700" },
  subtitle: { color: COLORS.textMuted, fontSize: 11, marginTop: 3 },
  modeRow: { flexDirection: "row", backgroundColor: COLORS.surface2, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border, padding: 5, gap: 5, marginBottom: 18 },
  modeButton: { flex: 1, minHeight: 58, borderRadius: RADIUS.md, alignItems: "center", justifyContent: "center", gap: 4, paddingHorizontal: 4 },
  modeButtonActive: { backgroundColor: COLORS.surface3 },
  modeText: { color: COLORS.textMuted, fontSize: 9, fontWeight: "600" },
  modeTextActive: { color: COLORS.text },
  clockCard: { minHeight: 290, backgroundColor: COLORS.surface2, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.border, alignItems: "center", justifyContent: "center", paddingHorizontal: 18, paddingVertical: 28, marginBottom: 24 },
  clockIcon: { width: 50, height: 50, borderRadius: 25, backgroundColor: COLORS.surface3, alignItems: "center", justifyContent: "center", marginBottom: 18 },
  clockValue: { color: COLORS.text, fontSize: 52, lineHeight: 60, fontWeight: "300", letterSpacing: 1 },
  clockSubtitle: { color: COLORS.textMuted, fontSize: 11, lineHeight: 16, textAlign: "center", marginTop: 8, maxWidth: 280 },
  controlsRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 22, marginTop: 28 },
  primaryControl: { width: 64, height: 64, borderRadius: 32, backgroundColor: COLORS.primary, alignItems: "center", justifyContent: "center" },
  secondaryControl: { width: 46, height: 46, borderRadius: 23, backgroundColor: COLORS.surface3, alignItems: "center", justifyContent: "center" },
  controlSpacer: { width: 46, height: 46 },
  sectionLabel: { color: COLORS.primarySoft, fontSize: 10, fontWeight: "700", letterSpacing: 0.8, marginBottom: 10 },
  presetGrid: { flexDirection: "row", flexWrap: "wrap", gap: 9, marginBottom: 24 },
  presetButton: { minWidth: "22.8%", flexGrow: 1, height: 42, borderRadius: RADIUS.md, backgroundColor: COLORS.surface2, borderWidth: 1, borderColor: COLORS.border, alignItems: "center", justifyContent: "center", paddingHorizontal: 10 },
  presetButtonActive: { backgroundColor: COLORS.surface3, borderColor: COLORS.primary },
  presetText: { color: COLORS.textMuted, fontSize: 11, fontWeight: "600" },
  presetTextActive: { color: COLORS.text },
  focusStats: { minHeight: 82, backgroundColor: COLORS.surface2, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, marginBottom: 22 },
  focusStatsLabel: { color: COLORS.textMuted, fontSize: 9, fontWeight: "600", letterSpacing: 0.6 },
  focusStatsValue: { color: COLORS.text, fontSize: 25, fontWeight: "700", marginTop: 4 },
  tipCard: { backgroundColor: COLORS.surface2, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border, flexDirection: "row", padding: 14, marginBottom: 24 },
  tipIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.surface3, alignItems: "center", justifyContent: "center", marginRight: 12 },
  tipInfo: { flex: 1 },
  tipTitle: { color: COLORS.text, fontSize: 12, fontWeight: "600" },
  tipText: { color: COLORS.textMuted, fontSize: 10, lineHeight: 15, marginTop: 4 },
  lapsCard: { backgroundColor: COLORS.surface2, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: 14, marginBottom: 24 },
  lapRow: { minHeight: 46, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: COLORS.border },
  lapLabel: { color: COLORS.textMuted, fontSize: 11 },
  lapTime: { color: COLORS.text, fontSize: 12, fontWeight: "600" },
  miniGrid: { flexDirection: "row", gap: 10 },
  miniCard: { width: "48.5%", minHeight: 126, backgroundColor: COLORS.surface2, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border, padding: 14 },
  miniTitle: { color: COLORS.text, fontSize: 12, fontWeight: "600", marginTop: 10 },
  miniText: { color: COLORS.textMuted, fontSize: 9, lineHeight: 14, marginTop: 5 },
});
