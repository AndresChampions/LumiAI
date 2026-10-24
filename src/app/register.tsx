import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  ActivityIndicator,
  Image,
  Keyboard,
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

export default function RegisterScreen() {
  const {
    signUp,
  } = useAuth();

  const [
    username,
    setUsername,
  ] = useState("");

  const [
    email,
    setEmail,
  ] = useState("");

  const [
    password,
    setPassword,
  ] = useState("");

  const [
    confirmPassword,
    setConfirmPassword,
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

  const [
    successMessage,
    setSuccessMessage,
  ] = useState("");

  const scrollRef =
    useRef<ScrollView>(null);

  const [
    keyboardVisible,
    setKeyboardVisible,
  ] = useState(false);

  useEffect(() => {
    const show =
      Keyboard.addListener(
        "keyboardDidShow",
        () =>
          setKeyboardVisible(
            true
          )
      );

    const hide =
      Keyboard.addListener(
        "keyboardDidHide",
        () =>
          setKeyboardVisible(
            false
          )
      );

    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  const scrollToField =
    (y: number) => {
      setTimeout(() => {
        scrollRef.current?.scrollTo({
          y,
          animated: true,
        });
      }, 180);
    };

  const handleRegister =
    async () => {
      setErrorMessage("");
      setSuccessMessage("");

      if (
        !username.trim() ||
        !email.trim() ||
        !password ||
        !confirmPassword
      ) {
        setErrorMessage(
          "Completa todos los campos."
        );

        return;
      }

      if (
        password.length < 6
      ) {
        setErrorMessage(
          "La contraseña debe tener al menos 6 caracteres."
        );

        return;
      }

      if (
        password !==
        confirmPassword
      ) {
        setErrorMessage(
          "Las contraseñas no coinciden."
        );

        return;
      }

      try {
        setLoading(true);

        const result =
          await signUp(
            username,
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

        if (
          result.needsEmailConfirmation
        ) {
          setSuccessMessage(
            "Cuenta creada. Confirma tu correo para continuar."
          );

          return;
        }

        router.replace(
          "/(tabs)/home"
        );
      } catch {
        setErrorMessage(
          "No se pudo crear la cuenta."
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
          : "height"
      }
    >
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={[
          styles.content,
          keyboardVisible &&
            styles.contentKeyboard,
        ]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode={
          Platform.OS === "ios"
            ? "interactive"
            : "on-drag"
        }
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
          Crear cuenta
        </Text>

        {/* MENSAJES */}

        {errorMessage ? (
          <View
            style={
              styles.errorBox
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

        {successMessage ? (
          <View
            style={
              styles.successBox
            }
          >
            <Ionicons
              name="checkmark-circle-outline"
              size={17}
              color={
                COLORS.success
              }
            />

            <Text
              style={
                styles.successText
              }
            >
              {
                successMessage
              }
            </Text>
          </View>
        ) : null}

        {/* NOMBRE */}

        <Text
          style={
            styles.label
          }
        >
          Nombre
        </Text>

        <View
          style={
            styles.inputContainer
          }
        >
          <Ionicons
            name="person-outline"
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
              username
            }
            onChangeText={
              setUsername
            }
            placeholder="Tu nombre"
            onFocus={() =>
              scrollToField(70)
            }
            placeholderTextColor={
              COLORS.textSoft
            }
          />
        </View>

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
            onFocus={() =>
              scrollToField(135)
            }
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
            onFocus={() =>
              scrollToField(205)
            }
            placeholderTextColor={
              COLORS.textSoft
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

        {/* CONFIRMAR */}

        <Text
          style={
            styles.label
          }
        >
          Confirmar contraseña
        </Text>

        <View
          style={
            styles.inputContainer
          }
        >
          <Ionicons
            name="shield-checkmark-outline"
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
              confirmPassword
            }
            onChangeText={
              setConfirmPassword
            }
            secureTextEntry={
              !showPassword
            }
            placeholder="Repite tu contraseña"
            onFocus={() =>
              scrollToField(275)
            }
            placeholderTextColor={
              COLORS.textSoft
            }
            onSubmitEditing={
              handleRegister
            }
          />
        </View>

        {/* BOTÓN */}

        <TouchableOpacity
          style={[
            styles.button,

            loading &&
              styles.buttonDisabled,
          ]}
          onPress={
            handleRegister
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
              Crear cuenta
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() =>
            router.replace(
              "/login"
            )
          }
        >
          <Text
            style={
              styles.footerText
            }
          >
            ¿Ya tienes cuenta?{" "}
            <Text
              style={
                styles.footerLink
              }
            >
              Inicia sesión
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
      width: "100%",

      maxWidth: 430,

      alignSelf:
        "center",

      paddingHorizontal:
        22,

      paddingTop: 28,

      paddingBottom: 45,
    },

    contentKeyboard: {
      paddingTop: 18,
      paddingBottom: 180,
    },

    robot: {
      width: 125,

      height: 125,

      alignSelf:
        "center",

      marginBottom: 8,
    },

    title: {
      color:
        COLORS.text,

      fontSize: 25,

      fontWeight: "700",

      textAlign:
        "center",

      marginBottom: 27,
    },

    label: {
      color:
        COLORS.text,

      fontSize: 13,

      fontWeight: "600",

      marginBottom: 7,
    },

    inputContainer: {
      height: 52,

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

      marginBottom: 15,
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
      height: 52,

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

      fontWeight: "600",

      fontSize: 14,
    },

    footerText: {
      color:
        COLORS.textMuted,

      textAlign:
        "center",

      fontSize: 12,

      marginTop: 24,
    },

    footerLink: {
      color:
        COLORS.primarySoft,

      fontWeight: "600",
    },

    errorBox: {
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

      padding: 10,

      marginBottom: 17,
    },

    errorText: {
      flex: 1,

      color:
        COLORS.danger,

      fontSize: 12,
    },

    successBox: {
      flexDirection:
        "row",

      alignItems:
        "center",

      gap: 7,

      backgroundColor:
        COLORS.surface2,

      borderWidth: 1,

      borderColor:
        COLORS.success,

      borderRadius:
        RADIUS.md,

      padding: 10,

      marginBottom: 17,
    },

    successText: {
      flex: 1,

      color:
        COLORS.success,

      fontSize: 12,
    },
  });