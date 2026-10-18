import {
    createContext,
    ReactNode,
    useContext,
    useState,
} from "react";

type ThemeMode = "dark" | "light";

type SettingsContextType = {
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;

  notificationsEnabled: boolean;
  setNotificationsEnabled: (value: boolean) => void;

  voiceEnabled: boolean;
  setVoiceEnabled: (value: boolean) => void;

  locationEnabled: boolean;
  setLocationEnabled: (value: boolean) => void;
};

const SettingsContext =
  createContext<SettingsContextType | undefined>(
    undefined
  );

export function SettingsProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [themeMode, setThemeMode] =
    useState<ThemeMode>("dark");

  const [
    notificationsEnabled,
    setNotificationsEnabled,
  ] = useState(false);

  const [
    voiceEnabled,
    setVoiceEnabled,
  ] = useState(false);

  const [
    locationEnabled,
    setLocationEnabled,
  ] = useState(false);

  return (
    <SettingsContext.Provider
      value={{
        themeMode,
        setThemeMode,

        notificationsEnabled,
        setNotificationsEnabled,

        voiceEnabled,
        setVoiceEnabled,

        locationEnabled,
        setLocationEnabled,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context =
    useContext(SettingsContext);

  if (!context) {
    throw new Error(
      "useSettings debe utilizarse dentro de SettingsProvider"
    );
  }

  return context;
}