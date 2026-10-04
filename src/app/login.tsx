import {
  useState,
} from "react";

import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import {
  Ionicons,
} from "@expo/vector-icons";

import {
  router,
} from "expo-router";

import {
  useAuth,
} from "../context/AuthContext";

import {
  COLORS,
  RADIUS,
} from "../constants/theme";

export default function LoginScreen() {
  const {
    signIn,
  } = useAuth();

  const [
    email,
    setEmail,
  ] = useState("");

  const [
    password,
    setPassword,
  ] = useState("");

  const [
    showPassword,
    setShowPassword,
  ] = useState(false);

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  const handleLogin =
    async () => {
      setErrorMessage("");

      if (
        !email.trim() ||
        !password
      ) {
        setErrorMessage(
          "Ingresa tu correo y contraseña."
        );

        return;
      }

      try {
        setLoading(true);

        const result =
          await signIn(
            email,
            password
          );

        if (
          result.error
        ) {
          setErrorMessage(
            result.error
          );

          return;
        }

        router.replace(
          "/(tabs)/home"
        );
      } catch (error) {
        setErrorMessage(
          "No se pudo iniciar sesión."
        );
      } finally {
        setLoading(false);
      }
    };

  return (
    <KeyboardAvoidingView
      style={
        styles.container
      }
      behavior={
        Platform.OS ===
        "ios"
          ? "padding"
          : undefined
      }
    >
      <ScrollView
        contentContainerStyle={
          styles.content
        }
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={
          false
        }
      >
        {/* ROBOT */}

        <Image
          source={require(
            "../../assets/images/lumi-bot.png"
          )}
          style={
            styles.robot
          }
          resizeMode="contain"
        />

        <Text
          style={
            styles.title
          }
        >
          Iniciar sesión
        </Text>

        {/* ERROR */}

        {errorMessage ? (
          <View
            style={
              styles.messageBox
            }
          >
            <Ionicons
              name="alert-circle-outline"
              size={17}
              color={
                COLORS.danger
              }
            />

            <Text
              style={
                styles.errorText
              }
            >
              {
                errorMessage
              }
            </Text>
          </View>
        ) : null}

        {/* CORREO */}

        <Text
          style={
            styles.label
          }
        >
          Correo
        </Text>

        <View
          style={
            styles.inputContainer
          }
        >
          <Ionicons
            name="mail-outline"
            size={19}
            color={
              COLORS.textMuted
            }
          />

          <TextInput
            style={
              styles.input
            }
            value={email}
            onChangeText={
              setEmail
            }
            autoCapitalize="none"
            autoCorrect={
              false
            }
            keyboardType="email-address"
            placeholder="correo@ejemplo.com"
            placeholderTextColor={
              COLORS.textSoft
            }
          />
        </View>

        {/* PASSWORD */}

        <Text
          style={
            styles.label
          }
        >
          Contraseña
        </Text>

        <View
          style={
            styles.inputContainer
          }
        >
          <Ionicons
            name="lock-closed-outline"
            size={19}
            color={
              COLORS.textMuted
            }
          />

          <TextInput
            style={
              styles.input
            }
            value={
              password
            }
            onChangeText={
              setPassword
            }
            secureTextEntry={
              !showPassword
            }
            placeholder="Contraseña"
            placeholderTextColor={
              COLORS.textSoft
            }
            onSubmitEditing={
              handleLogin
            }
          />

          <TouchableOpacity
            onPress={() =>
              setShowPassword(
                !showPassword
              )
            }
          >
            <Ionicons
              name={
                showPassword
                  ? "eye-off-outline"
                  : "eye-outline"
              }
              size={20}
              color={
                COLORS.textMuted
              }
            />
          </TouchableOpacity>
        </View>

        {/* BOTON */}

        <TouchableOpacity
          style={[
            styles.button,

            loading &&
              styles.buttonDisabled,
          ]}
          onPress={
            handleLogin
          }
          disabled={
            loading
          }
        >
          {loading ? (
            <ActivityIndicator
              color="#FFFFFF"
            />
          ) : (
            <Text
              style={
                styles.buttonText
              }
            >
              Iniciar sesión
            </Text>
          )}
        </TouchableOpacity>

        {/* REGISTER */}

        <TouchableOpacity
          onPress={() =>
            router.push(
              "/register"
            )
          }
        >
          <Text
            style={
              styles.footerText
            }
          >
            ¿No tienes cuenta?{" "}
            <Text
              style={
                styles.footerLink
              }
            >
              Regístrate
            </Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles =
  StyleSheet.create({
    container: {
      flex: 1,

      backgroundColor:
        COLORS.background,
    },

    content: {
      flexGrow: 1,

      width: "100%",

      maxWidth: 430,

      alignSelf:
        "center",

      justifyContent:
        "center",

      paddingHorizontal:
        22,

      paddingVertical:
        45,
    },

    robot: {
      width: 150,

      height: 150,

      alignSelf:
        "center",

      marginBottom: 12,
    },

    title: {
      color:
        COLORS.text,

      fontSize: 25,

      fontWeight: "700",

      textAlign:
        "center",

      marginBottom: 30,
    },

    label: {
      color:
        COLORS.text,

      fontSize: 13,

      fontWeight: "600",

      marginBottom: 7,
    },

    inputContainer: {
      height: 54,

      backgroundColor:
        COLORS.surface2,

      borderRadius:
        RADIUS.md,

      borderWidth: 1,

      borderColor:
        COLORS.border,

      flexDirection:
        "row",

      alignItems:
        "center",

      gap: 10,

      paddingHorizontal:
        14,

      marginBottom: 18,
    },

    input: {
      flex: 1,

      color:
        COLORS.text,

      fontSize: 14,

      outlineStyle:
        "none" as any,
    },

    button: {
      height: 53,

      backgroundColor:
        COLORS.primary,

      borderRadius:
        RADIUS.md,

      alignItems:
        "center",

      justifyContent:
        "center",

      marginTop: 8,
    },

    buttonDisabled: {
      opacity: 0.6,
    },

    buttonText: {
      color:
        "#FFFFFF",

      fontSize: 14,

      fontWeight: "600",
    },

    footerText: {
      color:
        COLORS.textMuted,

      fontSize: 12,

      textAlign:
        "center",

      marginTop: 25,
    },

    footerLink: {
      color:
        COLORS.primarySoft,

      fontWeight: "600",
    },

    messageBox: {
      flexDirection:
        "row",

      alignItems:
        "center",

      gap: 7,

      backgroundColor:
        COLORS.surface2,

      borderWidth: 1,

      borderColor:
        COLORS.danger,

      borderRadius:
        RADIUS.md,

      paddingHorizontal:
        12,

      paddingVertical:
        10,

      marginBottom: 20,
    },

    errorText: {
      color:
        COLORS.danger,

      flex: 1,

      fontSize: 12,
    },
  });