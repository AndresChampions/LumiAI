import {
  useEffect,
  useRef,
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

import * as ImagePicker from "expo-image-picker";

import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  supabase,
} from "../../lib/supabase";

import {
  useAuth,
} from "../../context/AuthContext";

import {
  useTasks,
} from "../../context/TaskContext";

import {
  COLORS
} from "../../constants/theme";

/* =========================================================
   TIPOS
========================================================= */

type Message = {
  id: string;

  text: string;

  sender:
    | "user"
    | "lumi";

  image?: string;

  time: string;
};

type CreateTaskAction = {
  type:
    "create_task";

  task: {
    title: string;

    date: string;

    time: string;

    notes?: string;

    notificationEnabled?: boolean;
  };
};

type CreateNoteAction = {
  type:
    "create_note";

  note: {
    title: string;
    content: string;
  };
};

type UpdateNoteAction = {
  type:
    "update_note";

  note: {
    id: string;
    title?: string;
    content?: string;
  };
};

type DeleteNoteAction = {
  type:
    "delete_note";

  note: {
    id: string;
  };
};

type LumiAction =
  | CreateTaskAction
  | CreateNoteAction
  | UpdateNoteAction
  | DeleteNoteAction;

type NoteContextItem = {
  id: string;
  title: string;
  content: string;
  updated_at: string;
};

type MemoryItem = {
  key: string;

  value: string;
};

type LumiResponse = {
  text: string;

  actions:
    LumiAction[];

  memories:
    MemoryItem[];

  summary:
    string | null;
};

/* =========================================================
   UTILIDADES
========================================================= */

function formatTime(
  date: Date
) {
  return date.toLocaleTimeString(
    [],
    {
      hour:
        "2-digit",

      minute:
        "2-digit",
    }
  );
}

function formatDate() {
  const now =
    new Date();

  const day =
    String(
      now.getDate()
    ).padStart(
      2,
      "0"
    );

  const month =
    String(
      now.getMonth() +
        1
    ).padStart(
      2,
      "0"
    );

  const year =
    now.getFullYear();

  return `${day}/${month}/${year}`;
}

function welcomeMessage(): Message {
  return {
    id:
      "welcome",

    text:
      "¡Hola! 👋 Soy LUMI. Estoy aquí contigo. ¿Qué hacemos hoy? ✨",

    sender:
      "lumi",

    time:
      formatTime(
        new Date()
      ),
  };
}

/* =========================================================
   LIMPIAR RESPUESTA DE GEMINI
========================================================= */

function cleanModelResponse(
  data: any
): LumiResponse {
  let text =
    data?.text ??
    "No pude responder.";

  let actions:
    LumiAction[] =
      [];

  let memories:
    MemoryItem[] =
      [];

  let summary:
    string | null =
      typeof data?.summary ===
      "string"
        ? data.summary
        : null;

  /*
   * Soporta la forma nueva.
   */

  if (
    Array.isArray(
      data?.actions
    )
  ) {
    actions =
      data.actions;
  }

  /*
   * Compatibilidad por si alguna
   * respuesta vieja usa action.
   */

  if (
    data?.action &&
    !Array.isArray(
      data?.actions
    )
  ) {
    actions = [
      data.action,
    ];
  }

  if (
    Array.isArray(
      data?.memories
    )
  ) {
    memories =
      data.memories;
  }

  /*
   * Protección contra el error que
   * viste antes:
   *
   * {
   *   "text": "{ \"text\": ... }"
   * }
   */

  if (
    typeof text ===
    "string"
  ) {
    const cleaned =
      text
        .replace(
          /^```json\s*/i,
          ""
        )
        .replace(
          /^```\s*/i,
          ""
        )
        .replace(
          /```$/i,
          ""
        )
        .trim();

    try {
      if (
        cleaned.startsWith(
          "{"
        )
      ) {
        const nested =
          JSON.parse(
            cleaned
          );

        if (
          typeof nested?.text ===
          "string"
        ) {
          text =
            nested.text;
        }

        if (
          Array.isArray(
            nested?.actions
          )
        ) {
          actions =
            nested.actions;
        } else if (
          nested?.action
        ) {
          actions = [
            nested.action,
          ];
        }

        if (
          Array.isArray(
            nested?.memories
          )
        ) {
          memories =
            nested.memories;
        }

        if (
          typeof nested?.summary ===
          "string"
        ) {
          summary =
            nested.summary;
        }
      } else {
        text =
          cleaned;
      }
    } catch {
      text =
        cleaned;
    }
  }

  return {
    text,
    actions,
    memories,
    summary,
  };
}

/* =========================================================
   SCREEN
========================================================= */

export default function AssistantScreen() {
  const insets =
    useSafeAreaInsets();

  const {
    user,
    profile,
  } =
    useAuth();

  const {
    addTask,
  } =
    useTasks();

  const [
    messages,
    setMessages,
  ] =
    useState<
      Message[]
    >([
      welcomeMessage(),
    ]);

  const [
    conversationId,
    setConversationId,
  ] =
    useState<
      string | null
    >(null);

  const [
    input,
    setInput,
  ] =
    useState("");

  const [
    selectedImage,
    setSelectedImage,
  ] =
    useState<
      string | null
    >(null);

  const [
    loading,
    setLoading,
  ] =
    useState(
      false
    );

  const [
    loadingHistory,
    setLoadingHistory,
  ] =
    useState(
      true
    );

  const scrollRef =
    useRef<ScrollView>(
      null
    );

  /* =========================================================
     INICIAR
  ========================================================= */

  useEffect(() => {
    if (
      user?.id
    ) {
      initializeConversation();
    }
  }, [
    user?.id,
  ]);

  /* =========================================================
     OBTENER CONVERSACIÓN
  ========================================================= */

  const initializeConversation =
    async () => {
      if (
        !user?.id
      ) {
        return;
      }

      try {
        setLoadingHistory(
          true
        );

        const {
          data:
            conversations,

          error:
            conversationError,
        } =
          await supabase
            .from(
              "conversations"
            )
            .select(
              "id"
            )
            .eq(
              "user_id",
              user.id
            )
            .order(
              "updated_at",
              {
                ascending:
                  false,
              }
            )
            .limit(1);

        if (
          conversationError
        ) {
          throw conversationError;
        }

        let id =
          conversations?.[0]
            ?.id;

        /*
         * Primera vez.
         */

        if (!id) {
          const {
            data,
            error,
          } =
            await supabase
              .from(
                "conversations"
              )
              .insert({
                user_id:
                  user.id,

                title:
                  "Conversación con LUMI",
              })
              .select(
                "id"
              )
              .single();

          if (error) {
            throw error;
          }

          id =
            data.id;
        }

        setConversationId(
          id
        );

        await loadMessages(
          id
        );
      } catch (
        error
      ) {
        console.log(
          "CHAT INIT:",
          error
        );
      } finally {
        setLoadingHistory(
          false
        );
      }
    };

  /* =========================================================
     CARGAR MENSAJES
  ========================================================= */

  const loadMessages =
    async (
      id: string
    ) => {
      if (
        !user?.id
      ) {
        return;
      }

      const {
        data,
        error,
      } =
        await supabase
          .from(
            "chat_messages"
          )
          .select(
            "id, role, content, image_url, created_at"
          )
          .eq(
            "conversation_id",
            id
          )
          .eq(
            "user_id",
            user.id
          )
          .order(
            "created_at",
            {
              ascending:
                true,
            }
          )
          .limit(
            200
          );

      if (error) {
        console.log(
          "LOAD CHAT:",
          error.message
        );

        return;
      }

      if (
        !data?.length
      ) {
        setMessages([
          welcomeMessage(),
        ]);

        return;
      }

      setMessages(
        data.map(
          (
            item
          ): Message => ({
            id:
              item.id,

            text:
              item.content,

            sender:
              item.role ===
              "user"
                ? "user"
                : "lumi",

            image:
              item.image_url ??
              undefined,

            time:
              formatTime(
                new Date(
                  item.created_at
                )
              ),
          })
        )
      );
    };

  /* =========================================================
     NUEVO CHAT
  ========================================================= */

  const newConversation =
    async () => {
      if (
        !user?.id ||
        loading
      ) {
        return;
      }

      const {
        data,
        error,
      } =
        await supabase
          .from(
            "conversations"
          )
          .insert({
            user_id:
              user.id,

            title:
              "Nueva conversación",
          })
          .select(
            "id"
          )
          .single();

      if (error) {
        console.log(
          "NEW CHAT:",
          error.message
        );

        return;
      }

      setConversationId(
        data.id
      );

      setMessages([
        welcomeMessage(),
      ]);

      setInput("");

      setSelectedImage(
        null
      );
    };

  /* =========================================================
     SELECCIONAR IMAGEN
  ========================================================= */

  const pickImage =
    async () => {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (
        !permission.granted
      ) {
        return;
      }

      const result =
        await ImagePicker.launchImageLibraryAsync(
          {
            mediaTypes: [
              "images",
            ],

            quality:
              0.7,

            base64:
              true,
          }
        );

      if (
        result.canceled
      ) {
        return;
      }

      const asset =
        result.assets[0];

      if (
        !asset.base64
      ) {
        return;
      }

      const mimeType =
        asset.mimeType ??
        "image/jpeg";

      setSelectedImage(
        `data:${mimeType};base64,${asset.base64}`
      );
    };

  /* =========================================================
     CARGAR MEMORIA
  ========================================================= */

  const loadMemory =
    async () => {
      if (
        !user?.id
      ) {
        return [];
      }

      const {
        data,
        error,
      } =
        await supabase
          .from(
            "user_memory"
          )
          .select(
            "memory_key, memory_value"
          )
          .eq(
            "user_id",
            user.id
          )
          .order(
            "updated_at",
            {
              ascending:
                false,
            }
          )
          .limit(
            100
          );

      if (error) {
        console.log(
          "LOAD MEMORY:",
          error.message
        );

        return [];
      }

      return (
        data ??
        []
      ).map(
        (
          item
        ) => ({
          key:
            item.memory_key,

          value:
            item.memory_value,
        })
      );
    };

  /* =========================================================
     GUARDAR RECUERDOS
  ========================================================= */

  const saveMemories =
    async (
      memories:
        MemoryItem[]
    ) => {
      if (
        !user?.id ||
        !memories.length
      ) {
        return;
      }

      for (
        const memory of
        memories
      ) {
        const key =
          memory?.key
            ?.trim();

        const value =
          memory?.value
            ?.trim();

        if (
          !key ||
          !value
        ) {
          continue;
        }

        const {
          error,
        } =
          await supabase
            .from(
              "user_memory"
            )
            .upsert(
              {
                user_id:
                  user.id,

                memory_key:
                  key,

                memory_value:
                  value,

                updated_at:
                  new Date().toISOString(),
              },
              {
                onConflict:
                  "user_id,memory_key",
              }
            );

        if (error) {
          console.log(
            "SAVE MEMORY:",
            error.message
          );
        }
      }
    };

  /* =========================================================
     RESUMEN DE LARGO PLAZO
  ========================================================= */

  const saveConversationSummary =
    async (
      summary:
        string | null
    ) => {
      if (
        !user?.id ||
        !summary?.trim()
      ) {
        return;
      }

      const {
        error,
      } =
        await supabase
          .from(
            "user_memory"
          )
          .upsert(
            {
              user_id:
                user.id,

              memory_key:
                "conversation_summary",

              memory_value:
                summary.trim(),

              updated_at:
                new Date().toISOString(),
            },
            {
              onConflict:
                "user_id,memory_key",
            }
          );

      if (error) {
        console.log(
          "SAVE SUMMARY:",
          error.message
        );
      }
    };

  const loadNotesContext =
    async (): Promise<
      NoteContextItem[]
    > => {
      if (!user?.id) {
        return [];
      }

      const {
        data,
        error,
      } = await supabase
        .from("notes")
        .select(
          "id, title, content, updated_at"
        )
        .eq(
          "user_id",
          user.id
        )
        .order(
          "updated_at",
          {
            ascending: false,
          }
        )
        .limit(40);

      if (error) {
        console.log(
          "LOAD NOTES CONTEXT:",
          error.message
        );

        return [];
      }

      return (
        data ?? []
      ) as NoteContextItem[];
    };

  /* =========================================================
     EJECUTAR TODAS LAS ACCIONES
  ========================================================= */

  const executeActions =
    async (
      actions:
        LumiAction[]
    ) => {
      for (
        const action of
        actions
      ) {
        if (
          action?.type ===
            "create_task" &&
          action?.task
        ) {
          await addTask({
            title:
              action.task.title,

            date:
              action.task.date,

            time:
              action.task.time,

            notes:
              action.task.notes ??
              "",

            notificationEnabled:
              action.task
                .notificationEnabled ??
              true,
          });

          continue;
        }

        if (
          action?.type ===
            "create_note" &&
          action?.note &&
          user?.id
        ) {
          const title =
            action.note.title
              ?.trim() ||
            "Nota de LUMI";

          const content =
            action.note.content
              ?.trim() ||
            "";

          if (!content) {
            continue;
          }

          const {
            error,
          } = await supabase
            .from("notes")
            .insert({
              user_id:
                user.id,

              title,

              content,
            });

          if (error) {
            console.log(
              "CREATE NOTE:",
              error.message
            );
          }

          continue;
        }

        if (
          action?.type ===
            "update_note" &&
          action?.note?.id &&
          user?.id
        ) {
          const payload:
            Record<
              string,
              string
            > = {
              updated_at:
                new Date()
                  .toISOString(),
            };

          if (
            typeof action.note
              .title ===
            "string"
          ) {
            payload.title =
              action.note.title
                .trim() ||
              "Sin título";
          }

          if (
            typeof action.note
              .content ===
            "string"
          ) {
            payload.content =
              action.note.content
                .trim();
          }

          const {
            error,
          } = await supabase
            .from("notes")
            .update(payload)
            .eq(
              "id",
              action.note.id
            )
            .eq(
              "user_id",
              user.id
            );

          if (error) {
            console.log(
              "UPDATE NOTE:",
              error.message
            );
          }

          continue;
        }

        if (
          action?.type ===
            "delete_note" &&
          action?.note?.id &&
          user?.id
        ) {
          const {
            error,
          } = await supabase
            .from("notes")
            .delete()
            .eq(
              "id",
              action.note.id
            )
            .eq(
              "user_id",
              user.id
            );

          if (error) {
            console.log(
              "DELETE NOTE:",
              error.message
            );
          }
        }
      }
    };

  /* =========================================================
     ENVIAR
  ========================================================= */

  const handleSend =
    async () => {
      const text =
        input.trim();

      if (
        (
          !text &&
          !selectedImage
        ) ||
        loading ||
        !user?.id ||
        !conversationId
      ) {
        return;
      }

      /*
       * Mandamos más contexto que antes.
       *
       * No mandamos 200 mensajes completos
       * para no llenar innecesariamente
       * Gemini.
       *
       * El resumen persistente se encarga
       * de conservar contexto más viejo.
       */

      const history =
        messages
          .filter(
            (
              item
            ) =>
              item.id !==
              "welcome"
          )
          .slice(
            -40
          )
          .map(
            (
              item
            ) => ({
              role:
                item.sender ===
                "user"
                  ? "user"
                  : "model",

              text:
                item.text,
            })
          );

      const userText =
        text ||
        "Analiza esta imagen.";

      const image =
        selectedImage;

      const tempMessage:
        Message = {
        id:
          `temp-${Date.now()}`,

        text:
          userText,

        sender:
          "user",

        image:
          image ??
          undefined,

        time:
          formatTime(
            new Date()
          ),
      };

      /*
       * Mostrar inmediatamente.
       */

      setMessages(
        (
          current
        ) => [
          ...current,
          tempMessage,
        ]
      );

      setInput("");

      setSelectedImage(
        null
      );

      setLoading(
        true
      );

      try {
        /* =====================================================
           1. GUARDAR TODO LO QUE EL USUARIO DICE
        ===================================================== */

        const {
          error:
            userMessageError,
        } =
          await supabase
            .from(
              "chat_messages"
            )
            .insert({
              conversation_id:
                conversationId,

              user_id:
                user.id,

              role:
                "user",

              content:
                userText,
            });

        if (
          userMessageError
        ) {
          console.log(
            "SAVE USER MESSAGE:",
            userMessageError.message
          );
        }

        /*
         * Acá está una diferencia importante:
         *
         * TODO lo que escribís queda en
         * chat_messages, aunque no termine
         * convirtiéndose en una "memoria".
         */

        /* =====================================================
           2. CARGAR MEMORIA DE LARGO PLAZO
        ===================================================== */

        const memories =
          await loadMemory();

        const notesContext =
          await loadNotesContext();

        /* =====================================================
           3. LLAMAR A LUMI
        ===================================================== */

        const {
          data,
          error,
        } =
          await supabase.functions.invoke(
            "lumi-chat",
            {
              body: {
                message:
                  userText,

                image,

                history,

                memory:
                  memories,

                notes:
                  notesContext,

                userName:
                  profile?.username ??
                  null,

                currentDate:
                  formatDate(),

                currentTime:
                  formatTime(
                    new Date()
                  ),

                timezone:
                  Intl.DateTimeFormat()
                    .resolvedOptions()
                    .timeZone,
              },
            }
          );

        if (error) {
          let errorMessage =
            error.message;

          try {
            if (
              (
                error as any
              ).context
            ) {
              const json =
                await (
                  error as any
                ).context.json();

              errorMessage =
                json?.error ??
                errorMessage;
            }
          } catch {}

          throw new Error(
            errorMessage
          );
        }

        if (
          data?.error
        ) {
          throw new Error(
            data.error
          );
        }

        const parsed =
          cleanModelResponse(
            data
          );

        /* =====================================================
           4. EJECUTAR TODAS LAS INSTRUCCIONES ACCIONABLES
        ===================================================== */

        await executeActions(
          parsed.actions
        );

        /* =====================================================
           5. GUARDAR RECUERDOS NUEVOS
        ===================================================== */

        await saveMemories(
          parsed.memories
        );

        /* =====================================================
           6. ACTUALIZAR RESUMEN DE LARGO PLAZO
        ===================================================== */

        await saveConversationSummary(
          parsed.summary
        );

        /* =====================================================
           7. GUARDAR RESPUESTA DE LUMI
        ===================================================== */

        const {
          data:
            savedMessage,

          error:
            savedMessageError,
        } =
          await supabase
            .from(
              "chat_messages"
            )
            .insert({
              conversation_id:
                conversationId,

              user_id:
                user.id,

              role:
                "model",

              content:
                parsed.text,
            })
            .select(
              "id, created_at"
            )
            .single();

        if (
          savedMessageError
        ) {
          console.log(
            "SAVE LUMI:",
            savedMessageError.message
          );
        }

        /* =====================================================
           8. ACTUALIZAR CONVERSACIÓN
        ===================================================== */

        await supabase
          .from(
            "conversations"
          )
          .update({
            updated_at:
              new Date().toISOString(),
          })
          .eq(
            "id",
            conversationId
          );

        /* =====================================================
           9. MOSTRAR RESPUESTA
        ===================================================== */

        setMessages(
          (
            current
          ) => [
            ...current,

            {
              id:
                savedMessage?.id ??
                `lumi-${Date.now()}`,

              text:
                parsed.text,

              sender:
                "lumi",

              time:
                savedMessage
                  ?.created_at
                  ? formatTime(
                      new Date(
                        savedMessage.created_at
                      )
                    )
                  : formatTime(
                      new Date()
                    ),
            },
          ]
        );
      } catch (
        error
      ) {
        console.log(
          "LUMI ERROR:",
          error
        );

        setMessages(
          (
            current
          ) => [
            ...current,

            {
              id:
                `error-${Date.now()}`,

              text:
                "Se me cruzaron los cables 😅. Probá otra vez.",

              sender:
                "lumi",

              time:
                formatTime(
                  new Date()
                ),
            },
          ]
        );
      } finally {
        setLoading(
          false
        );
      }
    };

  /* =========================================================
     UI
  ========================================================= */

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
      keyboardVerticalOffset={
        Platform.OS ===
        "ios"
          ? 0
          : 0
      }
    >
      <View
        style={[
          styles.content,
          {
            paddingBottom:
              Math.max(
                insets.bottom,
                6
              ),
          },
        ]}
      >
        {/* =====================================================
            HEADER
        ===================================================== */}

        <View
          style={
            styles.header
          }
        >
          <View
            style={
              styles.robotContainer
            }
          >
            <Image
              source={require(
                "../../../assets/images/lumi-3.png"
              )}
              style={
                styles.robot
              }
              resizeMode="contain"
            />
          </View>

          <View
            style={
              styles.headerText
            }
          >
            <View
              style={
                styles.titleRow
              }
            >
              <Text
                style={
                  styles.title
                }
              >
                LUMI
              </Text>

              <View
                style={
                  styles.onlineDot
                }
              />
            </View>

            <Text
              style={
                styles.subtitle
              }
            >
              Estoy aquí contigo ✨
            </Text>
          </View>

          <TouchableOpacity
            style={
              styles.newChatButton
            }
            onPress={
              newConversation
            }
            disabled={
              loading
            }
          >
            <Ionicons
              name="add"
              size={17}
              color="#FFFFFF"
            />

            <Text
              style={
                styles.newChatText
              }
            >
              Nuevo
            </Text>
          </TouchableOpacity>
        </View>

        {/* =====================================================
            CHAT
        ===================================================== */}

        {loadingHistory ? (
          <View
            style={
              styles.loadingHistory
            }
          >
            <ActivityIndicator
              color={
                COLORS.primary
              }
            />
          </View>
        ) : (
          <ScrollView
            ref={
              scrollRef
            }
            style={
              styles.chat
            }
            contentContainerStyle={
              styles.chatContent
            }
            showsVerticalScrollIndicator={
              false
            }
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode={
              Platform.OS ===
              "ios"
                ? "interactive"
                : "on-drag"
            }
            onContentSizeChange={() =>
              scrollRef.current?.scrollToEnd(
                {
                  animated:
                    true,
                }
              )
            }
          >
            {messages.map(
              (
                item
              ) => (
                <View
                  key={
                    item.id
                  }
                  style={[
                    styles.bubble,

                    item.sender ===
                    "user"
                      ? styles.userBubble
                      : styles.lumiBubble,
                  ]}
                >
                  {item.image ? (
                    <Image
                      source={{
                        uri:
                          item.image,
                      }}
                      style={
                        styles.messageImage
                      }
                    />
                  ) : null}

                  <Text
                    style={
                      styles.message
                    }
                  >
                    {
                      item.text
                    }
                  </Text>

                  <Text
                    style={
                      styles.time
                    }
                  >
                    {
                      item.time
                    }
                  </Text>
                </View>
              )
            )}

            {/* LUMI PENSANDO */}

            {loading && (
              <View
                style={[
                  styles.bubble,
                  styles.lumiBubble,
                  styles.thinking,
                ]}
              >
                <View
                  style={
                    styles.thinkingAvatar
                  }
                >
                  <Image
                    source={require(
                      "../../../assets/images/lumi-3.png"
                    )}
                    style={
                      styles.thinkingRobot
                    }
                    resizeMode="contain"
                  />
                </View>

                <Text
                  style={
                    styles.thinkingText
                  }
                >
                  Pensando...
                </Text>

                <ActivityIndicator
                  size="small"
                  color={
                    COLORS.primarySoft
                  }
                />
              </View>
            )}
          </ScrollView>
        )}

        {/* =====================================================
            IMAGEN SELECCIONADA
        ===================================================== */}

        {selectedImage && (
          <View
            style={
              styles.previewWrapper
            }
          >
            <Image
              source={{
                uri:
                  selectedImage,
              }}
              style={
                styles.preview
              }
            />

            <TouchableOpacity
              style={
                styles.removePreview
              }
              onPress={() =>
                setSelectedImage(
                  null
                )
              }
            >
              <Ionicons
                name="close"
                size={16}
                color="#FFFFFF"
              />
            </TouchableOpacity>
          </View>
        )}

        {/* =====================================================
            INPUT
        ===================================================== */}

        <View
          style={
            styles.inputContainer
          }
        >
          <TouchableOpacity
            style={
              styles.imageButton
            }
            onPress={
              pickImage
            }
            disabled={
              loading
            }
          >
            <Ionicons
              name="image-outline"
              size={20}
              color={
                COLORS.textMuted
              }
            />
          </TouchableOpacity>

          <TextInput
            value={
              input
            }
            onChangeText={
              setInput
            }
            placeholder="Cuéntame, ¿qué necesitas? ✨"
            placeholderTextColor={
              COLORS.textSoft
            }
            selectionColor={
              COLORS.primarySoft
            }
            style={
              styles.input
            }
            multiline
            editable={
              !loading
            }
            onFocus={() => {
              setTimeout(
                () =>
                  scrollRef.current?.scrollToEnd(
                    {
                      animated:
                        true,
                    }
                  ),
                180
              );
            }}
          />

          <TouchableOpacity
            style={[
              styles.send,

              loading &&
                styles.sendDisabled,
            ]}
            onPress={
              handleSend
            }
            disabled={
              loading
            }
          >
            <Ionicons
              name="arrow-up"
              size={18}
              color="#FFFFFF"
            />
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

/* =========================================================
   ESTILOS
========================================================= */

const styles =
  StyleSheet.create({
    container: {
      flex: 1,

      backgroundColor:
        COLORS.background,
    },

    content: {
      flex: 1,
      width: "100%",
      maxWidth: 500,
      alignSelf: "center",
      paddingHorizontal: 14,
      paddingTop: 10,
    },

    /* HEADER */

    header: {
      minHeight: 76,
      backgroundColor:
        COLORS.surface2,
      borderRadius: 22,
      borderWidth: 1,
      borderColor:
        COLORS.border,
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 11,
      paddingVertical: 9,
      marginBottom: 10,
    },

    robotContainer: {
      width: 56,
      height: 56,
      borderRadius: 18,
      backgroundColor:
        COLORS.surface3,
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
      borderWidth: 1,
      borderColor:
        COLORS.border,
    },

    robot: {
      width: 54,
      height: 54,
    },

    headerText: {
      flex: 1,

      marginLeft: 10,
    },

    titleRow: {
      flexDirection:
        "row",

      alignItems:
        "center",

      gap: 6,
    },

    title: {
      color:
        COLORS.text,
      fontSize: 18,
      fontWeight: "700",
      letterSpacing: 0.2,
    },

    onlineDot: {
      width: 7,

      height: 7,

      borderRadius: 4,

      backgroundColor:
        COLORS.success,
    },

    subtitle: {
      color:
        COLORS.textMuted,
      fontSize: 10,
      marginTop: 3,
    },

    newChatButton: {
      height: 38,
      borderRadius: 19,
      backgroundColor:
        COLORS.primary,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 12,
      gap: 5,
    },

    newChatText: {
      color:
        "#FFFFFF",

      fontSize: 10,

      fontWeight: "600",
    },

    /* CHAT */

    loadingHistory: {
      flex: 1,

      justifyContent:
        "center",

      alignItems:
        "center",
    },

    chat: {
      flex: 1,
    },

    chatContent: {
      paddingTop: 8,

      paddingBottom: 10,
    },

    bubble: {
      maxWidth: "87%",
      borderRadius: 19,
      paddingHorizontal: 14,
      paddingVertical: 11,
      marginBottom: 9,
    },

    userBubble: {
      alignSelf: "flex-end",
      backgroundColor:
        COLORS.primary,
      borderBottomRightRadius: 6,
    },

    lumiBubble: {
      alignSelf: "flex-start",
      backgroundColor:
        COLORS.surface2,
      borderBottomLeftRadius: 6,
      borderWidth: 1,
      borderColor:
        COLORS.border,
    },

    message: {
      color:
        COLORS.text,
      fontSize: 14,
      lineHeight: 21,
    },

    time: {
      color:
        COLORS.textMuted,

      fontSize: 8,

      textAlign:
        "right",

      marginTop: 5,
    },

    messageImage: {
      width: 210,

      height: 155,

      borderRadius: 12,

      marginBottom: 8,
    },

    thinking: {
      flexDirection:
        "row",

      alignItems:
        "center",

      gap: 8,

      paddingVertical: 8,
    },

    thinkingAvatar: {
      width: 28,

      height: 28,

      borderRadius: 10,

      backgroundColor:
        COLORS.surface3,

      alignItems:
        "center",

      justifyContent:
        "center",
    },

    thinkingRobot: {
      width: 27,

      height: 27,
    },

    thinkingText: {
      color:
        COLORS.textMuted,

      fontSize: 11,
    },

    previewWrapper: {
      alignSelf:
        "flex-start",

      position:
        "relative",

      marginBottom: 5,

      marginTop: 3,
    },

    preview: {
      width: 78,
      height: 78,
      borderRadius: 14,

      borderWidth: 1,

      borderColor:
        COLORS.border,
    },

    removePreview: {
      position:
        "absolute",

      right: -6,

      top: -6,

      width: 22,

      height: 22,

      borderRadius: 11,

      backgroundColor:
        COLORS.danger,

      justifyContent:
        "center",

      alignItems:
        "center",
    },

    inputContainer: {
      minHeight: 58,
      backgroundColor:
        COLORS.surface2,
      borderRadius: 22,
      borderWidth: 1,
      borderColor:
        COLORS.border,
      flexDirection: "row",
      alignItems: "flex-end",
      gap: 7,
      paddingHorizontal: 7,
      paddingVertical: 6,
      marginTop: 5,
    },

    imageButton: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor:
        COLORS.surface3,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 1,
    },

    input: {
      flex: 1,
      minHeight: 42,
      maxHeight: 120,
      color:
        COLORS.text,
      paddingHorizontal: 9,
      paddingTop: 10,
      paddingBottom: 9,
      fontSize: 13,
      lineHeight: 18,
      outlineStyle:
        "none" as any,
    },

    send: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor:
        COLORS.primary,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 1,
    },

    sendDisabled: {
      opacity: 0.55,
    },
  });