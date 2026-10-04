import {
  Stack,
  useRouter,
  useSegments,
} from "expo-router";

import {
  ActivityIndicator,
  StyleSheet,
  View,
} from "react-native";

import {
  useEffect,
} from "react";

import {
  AuthProvider,
  useAuth,
} from "../context/AuthContext";

import {
  TaskProvider,
} from "../context/TaskContext";

import {
  SettingsProvider,
} from "../context/SettingsContext";

import {
  COLORS,
} from "../constants/theme";

function AppNavigator() {
  const {
    session,
    loading,
  } =
    useAuth();

  const router =
    useRouter();

  const segments =
    useSegments();

  useEffect(() => {
    if (
      loading
    ) {
      return;
    }

    const firstSegment =
      segments[0];

    const isAuthScreen =
      firstSegment ===
        "login" ||
      firstSegment ===
        "register";

    if (
      !session &&
      !isAuthScreen
    ) {
      router.replace(
        "/login"
      );

      return;
    }

    if (
      session &&
      isAuthScreen
    ) {
      router.replace(
        "/(tabs)/home"
      );
    }
  }, [
    session,
    loading,
    segments,
  ]);

  if (
    loading
  ) {
    return (
      <View
        style={
          styles.loading
        }
      >
        <ActivityIndicator
          size="large"
          color={
            COLORS.primary
          }
        />
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerShown:
          false,
      }}
    />
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <SettingsProvider>
        <TaskProvider>
          <AppNavigator />
        </TaskProvider>
      </SettingsProvider>
    </AuthProvider>
  );
}

const styles =
  StyleSheet.create({
    loading: {
      flex: 1,

      backgroundColor:
        COLORS.background,

      justifyContent:
        "center",

      alignItems:
        "center",
    },
  });