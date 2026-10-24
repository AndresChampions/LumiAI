import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import {
  router,
  useFocusEffect,
} from "expo-router";
import {
  useCallback,
  useMemo,
  useState,
} from "react";
import {
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import Svg, {
  Path as SvgPath,
} from "react-native-svg";

import {
  COLORS,
  RADIUS,
} from "../constants/theme";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";

type Note = {
  id: string;
  user_id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
};

type Stroke = {
  id: string;
  d: string;
  color: string;
  width: number;
  opacity?: number;
};

type BoardImage = {
  id: string;
  url: string;
  path: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
};

type Whiteboard = {
  id: string;
  user_id: string;
  title: string;
  drawing_data: Stroke[] | null;
  image_data: BoardImage[] | null;
  canvas_width: number | null;
  canvas_height: number | null;
  created_at: string;
  updated_at: string;
};

type Section =
  | "notes"
  | "boards";

export default function NotesScreen() {
  const { user } = useAuth();
  const insets =
    useSafeAreaInsets();

  const [
    section,
    setSection,
  ] = useState<Section>(
    "notes"
  );

  const [notes, setNotes] =
    useState<Note[]>([]);
  const [boards, setBoards] =
    useState<Whiteboard[]>(
      []
    );

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    noteEditorOpen,
    setNoteEditorOpen,
  ] = useState(false);

  const [
    editingNote,
    setEditingNote,
  ] = useState<Note | null>(
    null
  );

  const [
    noteTitle,
    setNoteTitle,
  ] = useState("");

  const [
    noteContent,
    setNoteContent,
  ] = useState("");

  const [
    savingNote,
    setSavingNote,
  ] = useState(false);

  const [
    confirmDelete,
    setConfirmDelete,
  ] = useState(false);

  const loadEverything =
    useCallback(
      async () => {
        if (!user?.id) {
          setNotes([]);
          setBoards([]);
          setLoading(false);
          return;
        }

        try {
          setLoading(true);

          const [
            notesResult,
            boardsResult,
          ] =
            await Promise.all([
              supabase
                .from("notes")
                .select("*")
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
                ),

              supabase
                .from(
                  "whiteboards"
                )
                .select("*")
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
                ),
            ]);

          if (
            notesResult.error
          ) {
            throw notesResult.error;
          }

          if (
            boardsResult.error
          ) {
            throw boardsResult.error;
          }

          setNotes(
            (notesResult.data ??
              []) as Note[]
          );

          setBoards(
            (boardsResult.data ??
              []) as Whiteboard[]
          );
        } catch (error) {
          console.log(
            "LOAD NOTES/BOARDS:",
            error
          );
        } finally {
          setLoading(false);
        }
      },
      [user?.id]
    );

  useFocusEffect(
    useCallback(() => {
      loadEverything();
    }, [loadEverything])
  );

  const filteredNotes =
    useMemo(() => {
      const q =
        search
          .trim()
          .toLowerCase();

      if (!q) {
        return notes;
      }

      return notes.filter(
        (note) =>
          note.title
            .toLowerCase()
            .includes(q) ||
          note.content
            .toLowerCase()
            .includes(q)
      );
    }, [notes, search]);

  const newNote = () => {
    setEditingNote(null);
    setNoteTitle("");
    setNoteContent("");
    setConfirmDelete(
      false
    );
    setNoteEditorOpen(
      true
    );
  };

  const openNote =
    (note: Note) => {
      setEditingNote(note);
      setNoteTitle(
        note.title
      );
      setNoteContent(
        note.content
      );
      setConfirmDelete(
        false
      );
      setNoteEditorOpen(
        true
      );
    };

  const saveNote =
    async () => {
      if (!user?.id) {
        return;
      }

      const title =
        noteTitle.trim() ||
        "Sin título";
      const content =
        noteContent.trim();

      if (
        !noteTitle.trim() &&
        !content
      ) {
        return;
      }

      try {
        setSavingNote(true);

        if (editingNote) {
          const {
            error,
          } = await supabase
            .from("notes")
            .update({
              title,
              content,
              updated_at:
                new Date()
                  .toISOString(),
            })
            .eq(
              "id",
              editingNote.id
            )
            .eq(
              "user_id",
              user.id
            );

          if (error) {
            throw error;
          }
        } else {
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
            throw error;
          }
        }

        setNoteEditorOpen(
          false
        );
        await loadEverything();
      } catch (error) {
        console.log(
          "SAVE NOTE:",
          error
        );
      } finally {
        setSavingNote(
          false
        );
      }
    };

  const deleteNote =
    async () => {
      if (
        !user?.id ||
        !editingNote
      ) {
        return;
      }

      try {
        setSavingNote(true);

        const {
          error,
        } = await supabase
          .from("notes")
          .delete()
          .eq(
            "id",
            editingNote.id
          )
          .eq(
            "user_id",
            user.id
          );

        if (error) {
          throw error;
        }

        setNoteEditorOpen(
          false
        );

        await loadEverything();
      } catch (error) {
        console.log(
          "DELETE NOTE:",
          error
        );
      } finally {
        setSavingNote(
          false
        );
      }
    };

  const formatDate =
    (value: string) =>
      new Date(
        value
      ).toLocaleDateString(
        "es-SV",
        {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }
      );

  if (noteEditorOpen) {
    return (
      <View
        style={[
          styles.container,
          {
            paddingTop:
              insets.top,
            paddingBottom:
              insets.bottom,
          },
        ]}
      >
        <View
          style={
            styles.editorHeader
          }
        >
          <TouchableOpacity
            style={
              styles.circleButton
            }
            onPress={() =>
              setNoteEditorOpen(
                false
              )
            }
          >
            <Ionicons
              name="arrow-back"
              size={22}
              color={
                COLORS.text
              }
            />
          </TouchableOpacity>

          <Text
            style={
              styles.editorHeading
            }
          >
            {editingNote
              ? "Editar nota"
              : "Nueva nota"}
          </Text>

          <TouchableOpacity
            style={
              styles.saveButton
            }
            onPress={
              saveNote
            }
            disabled={
              savingNote
            }
          >
            {savingNote ? (
              <ActivityIndicator
                size="small"
                color="#FFFFFF"
              />
            ) : (
              <Ionicons
                name="checkmark"
                size={22}
                color="#FFFFFF"
              />
            )}
          </TouchableOpacity>
        </View>

        <View
          style={
            styles.editorBody
          }
        >
          <TextInput
            style={
              styles.titleInput
            }
            value={
              noteTitle
            }
            onChangeText={
              setNoteTitle
            }
            placeholder="Título"
            placeholderTextColor={
              COLORS.textSoft
            }
          />

          <TextInput
            style={
              styles.bodyInput
            }
            value={
              noteContent
            }
            onChangeText={
              setNoteContent
            }
            placeholder="Escribe aquí..."
            placeholderTextColor={
              COLORS.textSoft
            }
            multiline
            textAlignVertical="top"
          />

          {editingNote &&
            (confirmDelete ? (
              <View
                style={
                  styles.confirmRow
                }
              >
                <Text
                  style={
                    styles.confirmText
                  }
                >
                  ¿Eliminar esta nota?
                </Text>

                <TouchableOpacity
                  onPress={() =>
                    setConfirmDelete(
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
                  onPress={
                    deleteNote
                  }
                >
                  <Text
                    style={
                      styles.deleteConfirmText
                    }
                  >
                    Sí, eliminar
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={
                  styles.deleteRow
                }
                onPress={() =>
                  setConfirmDelete(
                    true
                  )
                }
              >
                <Ionicons
                  name="trash-outline"
                  size={17}
                  color={
                    COLORS.danger
                  }
                />
                <Text
                  style={
                    styles.deleteText
                  }
                >
                  Eliminar nota
                </Text>
              </TouchableOpacity>
            ))}
        </View>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop:
            insets.top,
        },
      ]}
    >
      <View
        style={
          styles.header
        }
      >
        <TouchableOpacity
          style={
            styles.circleButton
          }
          onPress={() =>
            router.back()
          }
        >
          <Ionicons
            name="arrow-back"
            size={22}
            color={
              COLORS.text
            }
          />
        </TouchableOpacity>

        <View
          style={
            styles.headerText
          }
        >
          <Text
            style={
              styles.title
            }
          >
            Notas
          </Text>

          <Text
            style={
              styles.subtitle
            }
          >
            Ideas, apuntes y dibujos
          </Text>
        </View>

        <TouchableOpacity
          style={
            styles.addButton
          }
          onPress={() => {
            if (
              section ===
              "notes"
            ) {
              newNote();
            } else {
              router.push(
                "/whiteboard"
              );
            }
          }}
        >
          <Ionicons
            name="add"
            size={25}
            color="#FFFFFF"
          />
        </TouchableOpacity>
      </View>

      <View style={styles.notesHero}>
        <View style={styles.notesHeroText}>
          <Text style={styles.notesHeroLabel}>LUMI NOTES</Text>
          <Text style={styles.notesHeroTitle}>
            Guarda tus ideas
          </Text>
          <Text style={styles.notesHeroSubtitle}>
            Notas y pizarras en un solo lugar.
          </Text>
        </View>

        <Image
          source={require("../../assets/images/lumi-9.png")}
          style={styles.notesHeroImage}
          resizeMode="contain"
        />
      </View>

      <View
        style={
          styles.modeTabs
        }
      >
          <TouchableOpacity
            style={[
              styles.modeTab,
              section ===
                "notes" &&
                styles.modeTabActive,
            ]}
            onPress={() =>
              setSection(
                "notes"
              )
            }
          >
            <Ionicons
              name="document-text-outline"
              size={22}
              color={
                section ===
                "notes"
                  ? "#FFFFFF"
                  : COLORS.primarySoft
              }
            />

            <View>
              <Text
                style={[
                  styles.modeTitle,
                  section ===
                    "notes" &&
                    styles.modeTitleActive,
                ]}
              >
                Notas
              </Text>

              <Text
                style={[
                  styles.modeSubtitle,
                  section ===
                    "notes" &&
                    styles.modeSubtitleActive,
                ]}
              >
                Escribe ideas
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.modeTab,
              section ===
                "boards" &&
                styles.modeTabActive,
            ]}
            onPress={() =>
              setSection(
                "boards"
              )
            }
          >
            <Ionicons
              name="brush-outline"
              size={22}
              color={
                section ===
                "boards"
                  ? "#FFFFFF"
                  : COLORS.primarySoft
              }
            />

            <View>
              <Text
                style={[
                  styles.modeTitle,
                  section ===
                    "boards" &&
                    styles.modeTitleActive,
                ]}
              >
                Pizarras
              </Text>

              <Text
                style={[
                  styles.modeSubtitle,
                  section ===
                    "boards" &&
                    styles.modeSubtitleActive,
                ]}
              >
                Dibuja libre
              </Text>
            </View>
          </TouchableOpacity>
      </View>

      {section ===
      "notes" ? (
        <>
          <View
            style={
              styles.searchBox
            }
          >
            <Ionicons
              name="search-outline"
              size={19}
              color={
                COLORS.textMuted
              }
            />

            <TextInput
              style={
                styles.searchInput
              }
              value={search}
              onChangeText={
                setSearch
              }
              placeholder="Buscar notas..."
              placeholderTextColor={
                COLORS.textSoft
              }
            />
          </View>

          <ScrollView
            contentContainerStyle={
              styles.content
            }
            showsVerticalScrollIndicator={
              false
            }
          >
            <Text
              style={
                styles.sectionLabel
              }
            >
              MIS NOTAS
            </Text>

            {loading ? (
              <ActivityIndicator
                color={
                  COLORS.primarySoft
                }
              />
            ) : filteredNotes.length ===
              0 ? (
              <View
                style={
                  styles.emptyCard
                }
              >
                <Ionicons
                  name="document-text-outline"
                  size={35}
                  color={
                    COLORS.primarySoft
                  }
                />

                <Text
                  style={
                    styles.emptyTitle
                  }
                >
                  No hay notas todavía
                </Text>

                <Text
                  style={
                    styles.emptyText
                  }
                >
                  Usa el + de arriba para crear una.
                </Text>
              </View>
            ) : (
              <View
                style={
                  styles.list
                }
              >
                {filteredNotes.map(
                  (note) => (
                    <TouchableOpacity
                      key={
                        note.id
                      }
                      style={
                        styles.noteCard
                      }
                      onPress={() =>
                        openNote(
                          note
                        )
                      }
                    >
                      <View
                        style={
                          styles.noteTop
                        }
                      >
                        <View
                          style={
                            styles.itemIcon
                          }
                        >
                          <Ionicons
                            name="document-text-outline"
                            size={19}
                            color={
                              COLORS.primarySoft
                            }
                          />
                        </View>

                        <Text
                          style={
                            styles.noteTitle
                          }
                          numberOfLines={
                            1
                          }
                        >
                          {
                            note.title
                          }
                        </Text>

                        <Ionicons
                          name="chevron-forward"
                          size={17}
                          color={
                            COLORS.textMuted
                          }
                        />
                      </View>

                      {note.content ? (
                        <Text
                          style={
                            styles.notePreview
                          }
                          numberOfLines={
                            2
                          }
                        >
                          {
                            note.content
                          }
                        </Text>
                      ) : null}

                      <Text
                        style={
                          styles.dateText
                        }
                      >
                        {formatDate(
                          note.updated_at
                        )}
                      </Text>
                    </TouchableOpacity>
                  )
                )}
              </View>
            )}
          </ScrollView>
        </>
      ) : (
        <ScrollView
          contentContainerStyle={
            styles.content
          }
          showsVerticalScrollIndicator={
            false
          }
        >
          <View
            style={
              styles.boardsHeading
            }
          >
            <View>
              <Text
                style={
                  styles.sectionLabelNoMargin
                }
              >
                MIS PIZARRAS
              </Text>

              <Text
                style={
                  styles.boardCount
                }
              >
                {boards.length ===
                1
                  ? "1 guardada"
                  : `${boards.length} guardadas`}
              </Text>
            </View>

            <TouchableOpacity
              style={
                styles.newBoardButton
              }
              onPress={() =>
                router.push(
                  "/whiteboard"
                )
              }
            >
              <Ionicons
                name="add"
                size={17}
                color="#FFFFFF"
              />
              <Text
                style={
                  styles.newBoardText
                }
              >
                Nueva
              </Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator
              color={
                COLORS.primarySoft
              }
            />
          ) : boards.length ===
            0 ? (
            <View
              style={
                styles.emptyCard
              }
            >
              <Ionicons
                name="brush-outline"
                size={36}
                color={
                  COLORS.primarySoft
                }
              />

              <Text
                style={
                  styles.emptyTitle
                }
              >
                No hay pizarras
              </Text>

              <Text
                style={
                  styles.emptyText
                }
              >
                Crea una para empezar a dibujar.
              </Text>
            </View>
          ) : (
            <View
              style={
                styles.boardGrid
              }
            >
              {boards.map(
                (board) => {
                  const paths =
                    Array.isArray(
                      board.drawing_data
                    )
                      ? board.drawing_data
                      : [];

                  const images =
                    Array.isArray(
                      board.image_data
                    )
                      ? board.image_data
                      : [];

                  const cw =
                    board.canvas_width ||
                    500;
                  const ch =
                    board.canvas_height ||
                    700;

                  return (
                    <TouchableOpacity
                      key={
                        board.id
                      }
                      style={
                        styles.boardCard
                      }
                      onPress={() =>
                        router.push({
                          pathname:
                            "/whiteboard",
                          params: {
                            id: board.id,
                          },
                        })
                      }
                    >
                      <View
                        style={
                          styles.boardPreview
                        }
                      >
                        {images[0] && (
                          <Image
                            source={{
                              uri:
                                images[0]
                                  .url,
                            }}
                            style={
                              StyleSheet.absoluteFill
                            }
                            resizeMode="cover"
                          />
                        )}

                        <Svg
                          width="100%"
                          height="100%"
                          viewBox={`0 0 ${cw} ${ch}`}
                          preserveAspectRatio="xMidYMid meet"
                        >
                          {paths.map(
                            (
                              stroke
                            ) => (
                              <SvgPath
                                key={
                                  stroke.id
                                }
                                d={
                                  stroke.d
                                }
                                stroke={
                                  stroke.color
                                }
                                strokeWidth={
                                  stroke.width
                                }
                                strokeOpacity={
                                  stroke.opacity ??
                                  1
                                }
                                fill="none"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            )
                          )}
                        </Svg>
                      </View>

                      <View
                        style={
                          styles.boardInfo
                        }
                      >
                        <Text
                          style={
                            styles.boardTitle
                          }
                          numberOfLines={
                            1
                          }
                        >
                          {
                            board.title
                          }
                        </Text>

                        <Text
                          style={
                            styles.dateText
                          }
                        >
                          {formatDate(
                            board.updated_at
                          )}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                }
              )}
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles =
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor:
        COLORS.background,
    },

    header: {
      width: "100%",
      maxWidth: 520,
      alignSelf: "center",
      paddingHorizontal: 18,
      paddingTop: 10,
      paddingBottom: 12,
      flexDirection: "row",
      alignItems: "center",
      minHeight: 82,
    },

    circleButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor:
        COLORS.surface2,
      alignItems: "center",
      justifyContent:
        "center",
    },

    headerText: {
      flex: 1,
      marginLeft: 12,
    },

    title: {
      color:
        COLORS.text,
      fontSize: 22,
      fontWeight: "700",
    },

    subtitle: {
      color:
        COLORS.textMuted,
      fontSize: 10,
      marginTop: 2,
    },

    notesHero: {
      width: "auto",
      maxWidth: 484,
      alignSelf: "center",
      marginHorizontal: 18,
      minHeight: 126,
      borderRadius:
        RADIUS.lg,
      backgroundColor:
        COLORS.surface2,
      borderWidth: 1,
      borderColor:
        COLORS.border,
      flexDirection: "row",
      alignItems: "center",
      overflow: "hidden",
      paddingLeft: 16,
      paddingRight: 8,
      marginBottom: 14,
    },

    notesHeroText: {
      flex: 1,
      paddingVertical: 14,
      zIndex: 2,
    },

    notesHeroLabel: {
      color:
        COLORS.primarySoft,
      fontSize: 10,
      fontWeight: "700",
      letterSpacing: 1,
    },

    notesHeroTitle: {
      color:
        COLORS.text,
      fontSize: 18,
      fontWeight: "700",
      marginTop: 5,
    },

    notesHeroSubtitle: {
      color:
        COLORS.textMuted,
      fontSize: 11,
      lineHeight: 15,
      marginTop: 6,
      maxWidth: 190,
    },

    notesHeroMeta: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginTop: 13,
    },

    notesHeroImage: {
      width: 104,
      height: 104,
      marginRight: -2,
    },

    addButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor:
        COLORS.primary,
      alignItems: "center",
      justifyContent:
        "center",
    },

    modeTabs: {
      width: "100%",
      maxWidth: 270,
      alignSelf: "center",
      flexDirection: "row",
      justifyContent: "center",
      gap: 8,
      marginBottom: 12,
    },

    modeTab: {
      flex: 1,
      minHeight: 54,
      borderRadius:
        RADIUS.md,
      backgroundColor:
        COLORS.surface2,
      borderWidth: 1,
      borderColor:
        COLORS.border,
      paddingHorizontal: 11,
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },

    modeTabActive: {
      backgroundColor:
        COLORS.primary,
      borderColor:
        COLORS.primary,
    },

    modeTitle: {
      color:
        COLORS.text,
      fontSize: 12,
      fontWeight: "700",
    },

    modeTitleActive: {
      color: "#FFFFFF",
    },

    modeSubtitle: {
      color:
        COLORS.textMuted,
      fontSize: 8,
      marginTop: 1,
    },

    modeSubtitleActive: {
      color:
        "rgba(255,255,255,0.76)",
    },

    searchBox: {
      width: "100%",
      maxWidth: 270,
      alignSelf: "center",
      height: 44,
      borderRadius:
        RADIUS.md,
      backgroundColor:
        COLORS.surface2,
      borderWidth: 1,
      borderColor:
        COLORS.border,
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 13,
      marginBottom: 4,
    },

    searchInput: {
      flex: 1,
      color:
        COLORS.text,
      fontSize: 13,
      marginLeft: 9,
      outlineStyle:
        "none" as any,
    },

    content: {
      width: "100%",
      maxWidth: 520,
      alignSelf: "center",
      paddingHorizontal: 18,
      paddingTop: 20,
      paddingBottom: 80,
    },

    sectionLabel: {
      color:
        COLORS.primarySoft,
      fontSize: 11,
      fontWeight: "700",
      letterSpacing: 0.7,
      marginBottom: 12,
    },

    sectionLabelNoMargin: {
      color:
        COLORS.primarySoft,
      fontSize: 11,
      fontWeight: "700",
      letterSpacing: 0.7,
    },

    list: {
      gap: 10,
    },

    noteCard: {
      backgroundColor:
        COLORS.surface2,
      borderRadius:
        RADIUS.lg,
      borderWidth: 1,
      borderColor:
        COLORS.border,
      padding: 15,
    },

    noteTop: {
      flexDirection: "row",
      alignItems: "center",
    },

    itemIcon: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor:
        COLORS.surface3,
      alignItems: "center",
      justifyContent:
        "center",
      marginRight: 10,
    },

    noteTitle: {
      flex: 1,
      color:
        COLORS.text,
      fontSize: 14,
      fontWeight: "600",
    },

    notePreview: {
      color:
        COLORS.textMuted,
      fontSize: 11,
      lineHeight: 17,
      marginTop: 10,
    },

    dateText: {
      color:
        COLORS.textSoft,
      fontSize: 9,
      marginTop: 8,
    },

    emptyCard: {
      minHeight: 210,
      borderRadius:
        RADIUS.lg,
      backgroundColor:
        COLORS.surface2,
      borderWidth: 1,
      borderColor:
        COLORS.border,
      alignItems: "center",
      justifyContent:
        "center",
      padding: 25,
    },

    emptyTitle: {
      color:
        COLORS.text,
      fontSize: 15,
      fontWeight: "700",
      marginTop: 10,
    },

    emptyText: {
      color:
        COLORS.textMuted,
      fontSize: 11,
      marginTop: 5,
    },

    boardsHeading: {
      flexDirection: "row",
      justifyContent:
        "space-between",
      alignItems: "center",
      marginBottom: 14,
    },

    boardCount: {
      color:
        COLORS.textMuted,
      fontSize: 10,
      marginTop: 3,
    },

    newBoardButton: {
      height: 36,
      borderRadius: 18,
      backgroundColor:
        COLORS.primary,
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 12,
      gap: 4,
    },

    newBoardText: {
      color: "#FFFFFF",
      fontSize: 11,
      fontWeight: "600",
    },

    boardGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 12,
    },

    boardCard: {
      width: "48%",
      minWidth: 145,
      backgroundColor:
        COLORS.surface2,
      borderRadius:
        RADIUS.md,
      overflow: "hidden",
      borderWidth: 1,
      borderColor:
        COLORS.border,
    },

    boardPreview: {
      width: "100%",
      height: 190,
      backgroundColor:
        "#FFFFFF",
      overflow: "hidden",
    },

    boardInfo: {
      padding: 11,
    },

    boardTitle: {
      color:
        COLORS.text,
      fontSize: 12,
      fontWeight: "600",
    },

    editorHeader: {
      width: "100%",
      maxWidth: 700,
      alignSelf: "center",
      paddingHorizontal: 18,
      paddingTop: 10,
      paddingBottom: 12,
      flexDirection: "row",
      alignItems: "center",
    },

    editorHeading: {
      flex: 1,
      color:
        COLORS.text,
      textAlign: "center",
      fontSize: 17,
      fontWeight: "700",
    },

    saveButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor:
        COLORS.primary,
      alignItems: "center",
      justifyContent:
        "center",
    },

    editorBody: {
      width: "100%",
      maxWidth: 700,
      alignSelf: "center",
      flex: 1,
      paddingHorizontal: 18,
      paddingBottom: 18,
    },

    titleInput: {
      height: 58,
      borderRadius:
        RADIUS.md,
      backgroundColor:
        COLORS.surface2,
      color:
        COLORS.text,
      paddingHorizontal: 15,
      fontSize: 18,
      fontWeight: "700",
      outlineStyle:
        "none" as any,
    },

    bodyInput: {
      flex: 1,
      minHeight: 300,
      borderRadius:
        RADIUS.md,
      backgroundColor:
        COLORS.surface2,
      color:
        COLORS.text,
      padding: 15,
      fontSize: 14,
      lineHeight: 21,
      marginTop: 10,
      outlineStyle:
        "none" as any,
    },

    deleteRow: {
      alignSelf:
        "flex-start",
      minHeight: 42,
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      marginTop: 10,
      paddingHorizontal: 8,
    },

    deleteText: {
      color:
        COLORS.danger,
      fontSize: 11,
      fontWeight: "600",
    },

    confirmRow: {
      minHeight: 48,
      borderRadius:
        RADIUS.md,
      backgroundColor:
        COLORS.surface2,
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingHorizontal: 12,
      marginTop: 10,
    },

    confirmText: {
      flex: 1,
      color:
        COLORS.text,
      fontSize: 11,
    },

    cancelText: {
      color:
        COLORS.textMuted,
      fontSize: 11,
      fontWeight: "600",
    },

    deleteConfirmText: {
      color:
        COLORS.danger,
      fontSize: 11,
      fontWeight: "700",
    },
  });
