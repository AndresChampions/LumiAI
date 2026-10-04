import {
  ActivityIndicator,
  StyleSheet,
  View,
} from "react-native";

import {
  Redirect,
} from "expo-router";

import {
  useAuth,
} from "../context/AuthContext";

import {
  COLORS,
} from "../constants/theme";

export default function Index() {
  const {
    session,
    loading,
  } = useAuth();

  if (loading) {
    return (
      <View
        style={
          styles.container
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

  if (!session) {
    return (
      <Redirect href="/login" />
    );
  }

  return (
    <Redirect href="/(tabs)/home" />
  );
}

const styles =
  StyleSheet.create({
    container: {
      flex: 1,

      backgroundColor:
        COLORS.background,

      justifyContent:
        "center",

      alignItems:
        "center",
    },
  });