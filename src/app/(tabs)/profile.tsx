import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";

import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";

import {
  requestNotificationPermission,
  sendTestNotification,
} from "../../lib/notifications";

import { useAuth } from "../../context/AuthContext";
import { useSettings } from "../../context/SettingsContext";

import { supabase } from "../../lib/supabase";

import {
  COLORS,
  RADIUS,
} from "../../constants/theme";

const MAX_AVATAR_SIZE =
  5 * 1024 * 1024;

/* =========================
   SCREEN
========================= */

export default function ProfileScreen() {
  const {
    user,
    profile,
    updateProfile,
    signOut,
  } = useAuth();

  const {
    notificationsEnabled,
    setNotificationsEnabled,

    locationEnabled,
    setLocationEnabled,
  } = useSettings();

  const [
    editNameVisible,
    setEditNameVisible,
  ] = useState(false);

  const [
    name,
    setName,
  ] = useState("");

  const [
    uploadingAvatar,
    setUploadingAvatar,
  ] = useState(false);

  // Mantiene la foto visible inmediatamente aunque el contexto
  // tarde un momento en refrescar el perfil desde Supabase.
  const [avatarUrl, setAvatarUrl] = useState<string | null>(
    profile?.avatar_url ?? null
  );

  useEffect(() => {
    setAvatarUrl(profile?.avatar_url ?? null);
  }, [profile?.avatar_url]);

  /* =========================
     NOMBRE
  ========================= */

  const openEditName =
    () => {
      setName(
        profile?.username ??
          ""
      );

      setEditNameVisible(
        true
      );
    };

  const saveName =
    async () => {
      if (
        !name.trim()
      ) {
        Alert.alert(
          "Nombre",
          "Escribe un nombre válido."
        );

        return;
      }

      const result =
        await updateProfile({
          username:
            name.trim(),
        });

      if (
        result.error
      ) {
        Alert.alert(
          "Error",
          result.error
        );

        return;
      }

      setEditNameVisible(
        false
      );
    };

  /* =========================
     AVATAR
  ========================= */

  const changeAvatar =
    async () => {
      if (
        !user?.id
      ) {
        return;
      }

      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (
        !permission.granted
      ) {
        Alert.alert(
          "Permiso requerido",
          "LUMI necesita acceso a tus fotos."
        );

        return;
      }

      const result =
        await ImagePicker.launchImageLibraryAsync(
          {
            mediaTypes: [
              "images",
            ],

            allowsEditing:
              true,

            aspect: [
              1,
              1,
            ],

            quality: 0.8,
          }
        );

      if (
        result.canceled
      ) {
        return;
      }

      const asset =
        result.assets[0];

      /*
       * Validación inicial,
       * cuando ImagePicker
       * devuelve fileSize.
       */
      if (
        asset.fileSize &&
        asset.fileSize >
          MAX_AVATAR_SIZE
      ) {
        Alert.alert(
          "Imagen demasiado grande",
          "La foto no puede superar los 5 MB."
        );

        return;
      }

      try {
        setUploadingAvatar(
          true
        );

        const response =
          await fetch(
            asset.uri
          );

        const buffer =
          await response.arrayBuffer();

        /*
         * Segunda validación:
         * funciona aunque fileSize
         * venga vacío.
         */
        if (
          buffer.byteLength >
          MAX_AVATAR_SIZE
        ) {
          throw new Error(
            "La foto no puede superar los 5 MB."
          );
        }

        const mimeType =
          asset.mimeType ??
          "image/jpeg";

        let extension =
          "jpg";

        if (
          mimeType ===
          "image/png"
        ) {
          extension =
            "png";
        }

        if (
          mimeType ===
          "image/webp"
        ) {
          extension =
            "webp";
        }

        const filePath =
          `${user.id}/profile.${extension}`;

        const {
          error:
            uploadError,
        } =
          await supabase.storage
            .from(
              "avatars"
            )
            .upload(
              filePath,
              buffer,
              {
                upsert:
                  true,

                contentType:
                  mimeType,
              }
            );

        if (
          uploadError
        ) {
          throw uploadError;
        }

        const {
          data,
        } =
          supabase.storage
            .from(
              "avatars"
            )
            .getPublicUrl(
              filePath
            );

        /*
         * Timestamp para evitar
         * que navegador/app enseñe
         * la imagen anterior.
         */
        const avatarUrl =
          `${data.publicUrl}?v=${Date.now()}`;

        const updateResult =
          await updateProfile({
            avatar_url:
              avatarUrl,
          });

        if (
          updateResult.error
        ) {
          throw new Error(
            updateResult.error
          );
        }

        // Actualiza la pantalla de Perfil de inmediato.
        setAvatarUrl(avatarUrl);

        Alert.alert(
          "Foto actualizada",
          "Tu foto de perfil se guardó correctamente."
        );
      } catch (
        error
      ) {
        console.log(
          "AVATAR ERROR:",
          error
        );

        Alert.alert(
          "No se pudo cambiar la foto",
          error instanceof Error
            ? error.message
            : "Inténtalo nuevamente."
        );
      } finally {
        setUploadingAvatar(
          false
        );
      }
    };

  /* =========================
     NOTIFICACIONES
  ========================= */

  const handleNotifications =
    async (
      enabled: boolean
    ) => {
      if (
        !enabled
      ) {
        setNotificationsEnabled(
          false
        );

        return;
      }

      const granted =
        await requestNotificationPermission();

      if (
        !granted
      ) {
        setNotificationsEnabled(
          false
        );

        Alert.alert(
          "Notificaciones",
          "No se concedió permiso para mostrar notificaciones."
        );

        return;
      }

      setNotificationsEnabled(
        true
      );

      if (
        Platform.OS !==
        "web"
      ) {
        await sendTestNotification();
      }

      Alert.alert(
        "Notificaciones activadas",
        "LUMI podrá recordarte tus tareas en el teléfono."
      );
    };

  /* =========================
     UBICACIÓN
  ========================= */

  const handleLocation =
    async (
      enabled: boolean
    ) => {
      if (
        !enabled
      ) {
        setLocationEnabled(
          false
        );

        return;
      }

      const result =
        await Location.requestForegroundPermissionsAsync();

      if (
        result.status ===
        "granted"
      ) {
        setLocationEnabled(
          true
        );
      } else {
        setLocationEnabled(
          false
        );

        Alert.alert(
          "Ubicación",
          "No se concedió permiso de ubicación."
        );
      }
    };

  /* =========================
     LOGOUT
  ========================= */

  const handleLogout =
    async () => {
      const result =
        await signOut();

      if (
        result?.error
      ) {
        Alert.alert(
          "Error",
          result.error
        );

        return;
      }

      router.replace(
        "/login"
      );
    };

  return (
    <View
      style={
        styles.container
      }
    >
      <ScrollView
        contentContainerStyle={
          styles.content
        }
        showsVerticalScrollIndicator={
          false
        }
      >
        {/* HEADER */}

        <Text
          style={
            styles.title
          }
        >
          Perfil
        </Text>

        {/* AVATAR */}

        <View
          style={
            styles.avatarWrapper
          }
        >
          <TouchableOpacity
            style={
              styles.avatarButton
            }
            onPress={
              changeAvatar
            }
            disabled={
              uploadingAvatar
            }
          >
            {avatarUrl ? (
              <Image
                key={avatarUrl}
                source={{
                  uri:
                    avatarUrl,
                }}
                style={
                  styles.avatar
                }
                onError={(event) =>
                  console.log(
                    "AVATAR IMAGE ERROR:",
                    event.nativeEvent
                  )
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
                  size={45}
                  color={
                    COLORS.textMuted
                  }
                />
              </View>
            )}

            <View
              style={
                styles.cameraButton
              }
            >
              {uploadingAvatar ? (
                <ActivityIndicator
                  size="small"
                  color="#FFFFFF"
                />
              ) : (
                <Ionicons
                  name="camera"
                  size={17}
                  color="#FFFFFF"
                />
              )}
            </View>
          </TouchableOpacity>
        </View>

        {/* USUARIO */}

        <Text
          style={
            styles.username
          }
        >
          {profile?.username ??
            "Usuario"}
        </Text>

        <Text
          style={
            styles.email
          }
        >
          {profile?.email ??
            user?.email ??
            ""}
        </Text>

        {/* EDITAR */}

        <TouchableOpacity
          style={
            styles.editProfileButton
          }
          onPress={
            openEditName
          }
        >
          <Ionicons
            name="create-outline"
            size={18}
            color={
              COLORS.primarySoft
            }
          />

          <Text
            style={
              styles.editProfileText
            }
          >
            Editar nombre
          </Text>
        </TouchableOpacity>

        {/* =========================
            PREFERENCIAS
        ========================= */}

        <Text
          style={
            styles.sectionTitle
          }
        >
          Preferencias
        </Text>

        <SettingRow
          icon="notifications-outline"
          title="Notificaciones"
          value={
            notificationsEnabled
          }
          onValueChange={
            handleNotifications
          }
        />

        <SettingRow
          icon="location-outline"
          title="Ubicación"
          value={
            locationEnabled
          }
          onValueChange={
            handleLocation
          }
        />

        {/* =========================
            FOTO
        ========================= */}

        <TouchableOpacity
          style={
            styles.photoOption
          }
          onPress={
            changeAvatar
          }
        >
          <View
            style={
              styles.settingLeft
            }
          >
            <Ionicons
              name="image-outline"
              size={21}
              color={
                COLORS.primarySoft
              }
            />

            <Text
              style={
                styles.settingText
              }
            >
              Cambiar foto
            </Text>
          </View>

          <Text
            style={
              styles.fileLimit
            }
          >
            Máx. 5 MB
          </Text>
        </TouchableOpacity>

        {/* LOGOUT */}

        <TouchableOpacity
          style={
            styles.logoutButton
          }
          onPress={
            handleLogout
          }
        >
          <Ionicons
            name="log-out-outline"
            size={20}
            color={
              COLORS.danger
            }
          />

          <Text
            style={
              styles.logoutText
            }
          >
            Cerrar sesión
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* =========================
          EDIT NAME MODAL
      ========================= */}

      <Modal
        visible={
          editNameVisible
        }
        transparent
        animationType="fade"
        onRequestClose={() =>
          setEditNameVisible(
            false
          )
        }
      >
        <View
          style={
            styles.modalOverlay
          }
        >
          <View
            style={
              styles.modalCard
            }
          >
            <Text
              style={
                styles.modalTitle
              }
            >
              Editar nombre
            </Text>

            <TextInput
              style={
                styles.input
              }
              value={name}
              onChangeText={
                setName
              }
              placeholder="Tu nombre"
              placeholderTextColor={
                COLORS.textSoft
              }
            />

            <View
              style={
                styles.modalActions
              }
            >
              <TouchableOpacity
                style={
                  styles.cancelButton
                }
                onPress={() =>
                  setEditNameVisible(
                    false
                  )
                }
              >
                <Text
                  style={
                    styles.cancelText
                  }
                >
                  Cancelar
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={
                  styles.saveButton
                }
                onPress={
                  saveName
                }
              >
                <Text
                  style={
                    styles.saveText
                  }
                >
                  Guardar
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

/* =========================
   SETTING ROW
========================= */

function SettingRow({
  icon,
  title,
  value,
  onValueChange,
}: {
  icon:
    keyof typeof Ionicons.glyphMap;

  title:
    string;

  value:
    boolean;

  onValueChange:
    (
      value:
        boolean
    ) => void;
}) {
  return (
    <View
      style={
        styles.settingRow
      }
    >
      <View
        style={
          styles.settingLeft
        }
      >
        <Ionicons
          name={icon}
          size={21}
          color={
            COLORS.primarySoft
          }
        />

        <Text
          style={
            styles.settingText
          }
        >
          {title}
        </Text>
      </View>

      <Switch
        value={value}
        onValueChange={
          onValueChange
        }
      />
    </View>
  );
}

/* =========================
   STYLES
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
      paddingTop: 26,
      paddingBottom: 40,
    },

    title: {
      color:
        COLORS.text,
      fontSize: 21,
      fontWeight: "600",
      textAlign: "center",
      marginBottom: 26,
    },

    avatarWrapper: {
      alignItems: "center",
    },

    avatarButton: {
      position: "relative",
    },

    avatar: {
      width: 105,
      height: 105,
      borderRadius: 53,
    },

    avatarPlaceholder: {
      width: 105,
      height: 105,
      borderRadius: 53,
      backgroundColor:
        COLORS.surface2,
      alignItems: "center",
      justifyContent:
        "center",
    },

    cameraButton: {
      position: "absolute",
      right: 0,
      bottom: 2,
      width: 33,
      height: 33,
      borderRadius: 17,
      backgroundColor:
        COLORS.primary,
      alignItems: "center",
      justifyContent:
        "center",
    },

    username: {
      color:
        COLORS.text,
      textAlign: "center",
      fontSize: 20,
      fontWeight: "600",
      marginTop: 14,
    },

    email: {
      color:
        COLORS.textMuted,
      textAlign: "center",
      marginTop: 4,
    },

    editProfileButton: {
      height: 45,
      borderRadius:
        RADIUS.md,
      backgroundColor:
        COLORS.surface2,
      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "center",
      gap: 7,
      marginTop: 18,
    },

    editProfileText: {
      color:
        COLORS.text,
      fontSize: 13,
    },

    sectionTitle: {
      color:
        COLORS.textMuted,
      fontSize: 12,
      fontWeight: "700",
      marginTop: 30,
      marginBottom: 10,
      textTransform:
        "uppercase",
    },

    settingRow: {
      minHeight: 58,
      backgroundColor:
        COLORS.surface2,
      borderRadius:
        RADIUS.md,
      flexDirection: "row",
      justifyContent:
        "space-between",
      alignItems: "center",
      paddingHorizontal: 14,
      marginBottom: 8,
    },

    photoOption: {
      minHeight: 58,
      backgroundColor:
        COLORS.surface2,
      borderRadius:
        RADIUS.md,
      flexDirection: "row",
      justifyContent:
        "space-between",
      alignItems: "center",
      paddingHorizontal: 14,
      marginTop: 12,
    },

    settingLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },

    settingText: {
      color:
        COLORS.text,
    },

    fileLimit: {
      color:
        COLORS.textMuted,
      fontSize: 10,
    },

    logoutButton: {
      height: 50,
      borderRadius:
        RADIUS.md,
      backgroundColor:
        COLORS.surface2,
      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "center",
      gap: 8,
      marginTop: 28,
      borderWidth: 1,
      borderColor:
        COLORS.danger,
    },

    logoutText: {
      color:
        COLORS.danger,
      fontWeight: "600",
    },

    modalOverlay: {
      flex: 1,
      backgroundColor:
        "rgba(0,0,0,0.72)",
      alignItems: "center",
      justifyContent:
        "center",
      padding: 20,
    },

    modalCard: {
      width: "100%",
      maxWidth: 360,
      backgroundColor:
        COLORS.surface,
      borderRadius:
        RADIUS.lg,
      padding: 20,
    },

    modalTitle: {
      color:
        COLORS.text,
      fontSize: 18,
      fontWeight: "600",
      marginBottom: 15,
    },

    input: {
      height: 50,
      backgroundColor:
        COLORS.surface2,
      borderRadius:
        RADIUS.md,
      paddingHorizontal: 13,
      color:
        COLORS.text,
      outlineStyle:
        "none" as any,
    },

    modalActions: {
      flexDirection: "row",
      gap: 10,
      marginTop: 18,
    },

    cancelButton: {
      flex: 1,
      height: 45,
      backgroundColor:
        COLORS.surface2,
      borderRadius:
        RADIUS.md,
      alignItems: "center",
      justifyContent:
        "center",
    },

    saveButton: {
      flex: 1,
      height: 45,
      backgroundColor:
        COLORS.primary,
      borderRadius:
        RADIUS.md,
      alignItems: "center",
      justifyContent:
        "center",
    },

    cancelText: {
      color:
        COLORS.text,
    },

    saveText: {
      color: "#FFFFFF",
      fontWeight: "600",
    },
  });