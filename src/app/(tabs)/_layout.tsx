import { useEffect, useState } from "react";
import { Keyboard } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { withLayoutContext } from "expo-router";
import { createMaterialTopTabNavigator } from "expo-router/js-top-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { Navigator } = createMaterialTopTabNavigator();
const SwipeTabs = withLayoutContext(Navigator);

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const show = Keyboard.addListener("keyboardDidShow", () => {
      setKeyboardVisible(true);
    });

    const hide = Keyboard.addListener("keyboardDidHide", () => {
      setKeyboardVisible(false);
    });

    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  return (
    <SwipeTabs
      tabBarPosition="bottom"
      screenOptions={{
        swipeEnabled: !keyboardVisible,
        animationEnabled: true,
        lazy: false,
        tabBarShowIcon: true,
        tabBarActiveTintColor: "#8B5CF6",
        tabBarInactiveTintColor: "#6B7280",
        tabBarPressColor: "rgba(139, 92, 246, 0.10)",
        tabBarIndicatorStyle: {
          height: 0,
        },
        tabBarStyle: {
          backgroundColor: "#0F1220",
          borderTopWidth: 1,
          borderTopColor: "#1F2937",
          height: 60 + insets.bottom,
          paddingTop: 6,
          paddingBottom: Math.max(insets.bottom, 8),
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarItemStyle: {
          minHeight: 48,
          paddingHorizontal: 0,
          paddingVertical: 3,
        },
        tabBarIconStyle: {
          width: 24,
          height: 24,
          margin: 0,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: "500",
          textTransform: "none",
          margin: 0,
        },
      }}
    >
      <SwipeTabs.Screen
        name="home"
        options={{
          title: "Inicio",
          tabBarIcon: ({ color }) => (
            <Ionicons
              name="home-outline"
              size={21}
              color={color}
            />
          ),
        }}
      />

      <SwipeTabs.Screen
        name="tasks"
        options={{
          title: "Tareas",
          tabBarIcon: ({ color }) => (
            <Ionicons
              name="checkbox-outline"
              size={21}
              color={color}
            />
          ),
        }}
      />

      <SwipeTabs.Screen
        name="agenda"
        options={{
          title: "Agenda",
          tabBarIcon: ({ color }) => (
            <Ionicons
              name="calendar-outline"
              size={21}
              color={color}
            />
          ),
        }}
      />

      <SwipeTabs.Screen
        name="assistant"
        options={{
          title: "LUMI",
          tabBarIcon: ({ color }) => (
            <Ionicons
              name="sparkles-outline"
              size={21}
              color={color}
            />
          ),
        }}
      />

      <SwipeTabs.Screen
        name="profile"
        options={{
          title: "Perfil",
          tabBarIcon: ({ color }) => (
            <Ionicons
              name="person-outline"
              size={21}
              color={color}
            />
          ),
        }}
      />
    </SwipeTabs>
  );
}
