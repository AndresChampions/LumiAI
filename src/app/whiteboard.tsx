import {
  ActivityIndicator,
  Image,
  PanResponder,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";

import {
  Ionicons,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import {
  router,
  useLocalSearchParams,
} from "expo-router";
import * as ImagePicker from "expo-image-picker";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Svg, {
  Path as SvgPath,
} from "react-native-svg";
import {
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";
import {
  COLORS,
  RADIUS,
} from "../constants/theme";

type Tool =
  | "pencil"
  | "marker"
  | "highlighter"
  | "eraser";

type Stroke = {
  id: string;
  d: string;
  color: string;
  width: number;
  opacity: number;
  tool: Tool;
};

type BoardImage = {
  id: string;
  url: string;
  path: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
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

const BG =
  "#FFFFFF";

const COLORS_LIST = [
  "#111827",
  "#475569",
  "#7C3AED",
  "#A855F7",
  "#2563EB",
  "#06B6D4",
  "#059669",
  "#84CC16",
  "#EAB308",
  "#F97316",
  "#DC2626",
  "#EC4899",
];

function clamp(
  value: number,
  min: number,
  max: number
) {
  return Math.max(
    min,
    Math.min(max, value)
  );
}

type MovableImageProps = {
  item: BoardImage;
  selected: boolean;
  canvasWidth: number;
  canvasHeight: number;
  onSelect: () => void;
  onChange: (
    next: BoardImage
  ) => void;
};

function MovableImage({
  item,
  selected,
  canvasWidth,
  canvasHeight,
  onSelect,
  onChange,
}: MovableImageProps) {
  const start =
    useRef({
      x: item.x,
      y: item.y,
    });

  useEffect(() => {
    start.current = {
      x: item.x,
      y: item.y,
    };
  }, [item.x, item.y]);

  const responder =
    useMemo(
      () =>
        PanResponder.create({
          onStartShouldSetPanResponder:
            () => true,

          onMoveShouldSetPanResponder:
            () => true,

          onPanResponderGrant:
            () => {
              onSelect();

              start.current = {
                x: item.x,
                y: item.y,
              };
            },

          onPanResponderMove:
            (
              _event,
              gesture
            ) => {
              const nextX =
                clamp(
                  start.current
                    .x +
                    gesture.dx,
                  0,
                  Math.max(
                    0,
                    canvasWidth -
                      item.width
                  )
                );

              const nextY =
                clamp(
                  start.current
                    .y +
                    gesture.dy,
                  0,
                  Math.max(
                    0,
                    canvasHeight -
                      item.height
                  )
                );

              onChange({
                ...item,
                x: nextX,
                y: nextY,
              });
            },
        }),
      [
        item,
        canvasWidth,
        canvasHeight,
        onSelect,
        onChange,
      ]
    );

  return (
    <View
      style={[
        styles.movableImage,
        {
          left: item.x,
          top: item.y,
          width: item.width,
          height:
            item.height,
          transform: [
            {
              rotate:
                `${item.rotation}deg`,
            },
          ],
        },
        selected &&
          styles.movableImageSelected,
      ]}
      {...responder.panHandlers}
    >
      <Image
        source={{
          uri: item.url,
        }}
        style={
          styles.imageFill
        }
        resizeMode="contain"
        pointerEvents="none"
      />

      {selected && (
        <View
          style={
            styles.imageMoveBadge
          }
          pointerEvents="none"
        >
          <MaterialCommunityIcons
            name="cursor-move"
            size={15}
            color="#FFFFFF"
          />
        </View>
      )}
    </View>
  );
}

export default function WhiteboardScreen() {
  const { user } = useAuth();
  const insets =
    useSafeAreaInsets();

  const params =
    useLocalSearchParams<{
      id?: string;
    }>();

  const {
    height:
      windowHeight,
  } = useWindowDimensions();

  const [
    boardId,
    setBoardId,
  ] = useState<
    string | null
  >(
    typeof params.id ===
      "string"
      ? params.id
      : null
  );

  const [
    loading,
    setLoading,
  ] = useState(
    !!params.id
  );

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    uploadingImage,
    setUploadingImage,
  ] = useState(false);

  const [
    title,
    setTitle,
  ] = useState(
    "Nueva pizarra"
  );

  const [
    strokes,
    setStrokes,
  ] = useState<Stroke[]>(
    []
  );

  const [
    redoStrokes,
    setRedoStrokes,
  ] = useState<Stroke[]>(
    []
  );

  const [
    images,
    setImages,
  ] = useState<
    BoardImage[]
  >([]);

  const [
    selectedImageId,
    setSelectedImageId,
  ] = useState<
    string | null
  >(null);

  const [
    tool,
    setTool,
  ] = useState<Tool>(
    "pencil"
  );

  const [
    color,
    setColor,
  ] = useState(
    COLORS_LIST[0]
  );

  const [
    pencilWidth,
    setPencilWidth,
  ] = useState(4);

  const [
    canvasSize,
    setCanvasSize,
  ] = useState({
    width: 1,
    height: 1,
  });

  const [
    status,
    setStatus,
  ] = useState(
    boardId
      ? "Cargando..."
      : "Sin guardar"
  );

  const [
    confirmDelete,
    setConfirmDelete,
  ] = useState(false);

  const loadedRef =
    useRef(false);

  const currentPath =
    useRef("");

  const currentStrokeId =
    useRef("");

  const toolRef =
    useRef({
      tool:
        "pencil" as Tool,
      color:
        COLORS_LIST[0],
      width: 4,
      opacity: 1,
    });

  const canvasHeight =
    Math.max(
      520,
      Math.min(
        windowHeight -
          insets.top -
          insets.bottom -
          245,
        820
      )
    );

  useEffect(() => {
    if (!boardId) {
      loadedRef.current =
        true;
      return;
    }

    loadBoard(boardId);
  }, [boardId]);

  useEffect(() => {
    let width =
      pencilWidth;
    let opacity = 1;
    let drawColor =
      color;

    if (
      tool === "marker"
    ) {
      width =
        Math.max(
          9,
          pencilWidth * 2
        );
      opacity = 0.78;
    }

    if (
      tool ===
      "highlighter"
    ) {
      width =
        Math.max(
          20,
          pencilWidth * 5
        );
      opacity = 0.28;
    }

    if (
      tool === "eraser"
    ) {
      width =
        Math.max(
          26,
          pencilWidth * 6
        );
      opacity = 1;
      drawColor = BG;
    }

    toolRef.current = {
      tool,
      color:
        drawColor,
      width,
      opacity,
    };
  }, [
    tool,
    color,
    pencilWidth,
  ]);

  useEffect(() => {
    if (
      !loadedRef.current
    ) {
      return;
    }

    setStatus(
      "Cambios sin guardar"
    );
  }, [
    title,
    strokes,
    images,
  ]);

  useEffect(() => {
    if (
      !boardId ||
      !loadedRef.current ||
      status !==
        "Cambios sin guardar"
    ) {
      return;
    }

    const timer =
      setTimeout(() => {
        saveBoard(true);
      }, 1800);

    return () =>
      clearTimeout(timer);
  }, [
    boardId,
    title,
    strokes,
    images,
    status,
  ]);

  const loadBoard =
    async (
      id: string
    ) => {
      if (!user?.id) {
        return;
      }

      try {
        setLoading(true);

        const {
          data,
          error,
        } = await supabase
          .from(
            "whiteboards"
          )
          .select("*")
          .eq("id", id)
          .eq(
            "user_id",
            user.id
          )
          .single();

        if (error) {
          throw error;
        }

        const board =
          data as Whiteboard;

        setTitle(
          board.title ||
            "Mi pizarra"
        );

        setStrokes(
          Array.isArray(
            board.drawing_data
          )
            ? board.drawing_data
            : []
        );

        setImages(
          Array.isArray(
            board.image_data
          )
            ? board.image_data
            : []
        );

        setRedoStrokes([]);
        setStatus("Guardado");
        loadedRef.current =
          true;
      } catch (error) {
        console.log(
          "LOAD BOARD:",
          error
        );
        setStatus(
          "Error al cargar"
        );
      } finally {
        setLoading(false);
      }
    };

  const saveBoard =
    async (
      silent = false
    ) => {
      if (
        !user?.id ||
        saving
      ) {
        return;
      }

      try {
        setSaving(true);

        if (!silent) {
          setStatus(
            "Guardando..."
          );
        }

        const payload = {
          user_id:
            user.id,
          title:
            title.trim() ||
            "Mi pizarra",
          drawing_data:
            strokes,
          image_data:
            images,
          canvas_width:
            canvasSize.width,
          canvas_height:
            canvasSize.height,
          updated_at:
            new Date()
              .toISOString(),
        };

        if (boardId) {
          const {
            error,
          } = await supabase
            .from(
              "whiteboards"
            )
            .update(
              payload
            )
            .eq(
              "id",
              boardId
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
            data,
            error,
          } = await supabase
            .from(
              "whiteboards"
            )
            .insert(
              payload
            )
            .select(
              "id"
            )
            .single();

          if (error) {
            throw error;
          }

          setBoardId(
            data.id
          );
        }

        setStatus(
          "Guardado"
        );
      } catch (error) {
        console.log(
          "SAVE BOARD:",
          error
        );

        setStatus(
          "Error al guardar"
        );
      } finally {
        setSaving(false);
      }
    };

  const updateImage =
    (
      next: BoardImage
    ) => {
      setImages(
        (current) =>
          current.map(
            (item) =>
              item.id ===
              next.id
                ? next
                : item
          )
      );
    };

  const selectedImage =
    images.find(
      (item) =>
        item.id ===
        selectedImageId
    ) ?? null;

  const resizeSelectedImage =
    (
      factor: number
    ) => {
      if (!selectedImage) {
        return;
      }

      const newWidth =
        clamp(
          selectedImage.width *
            factor,
          70,
          Math.max(
            80,
            canvasSize.width *
              0.9
          )
        );

      const ratio =
        selectedImage.height /
        selectedImage.width;

      const newHeight =
        newWidth * ratio;

      updateImage({
        ...selectedImage,
        width:
          newWidth,
        height:
          newHeight,
        x: clamp(
          selectedImage.x,
          0,
          Math.max(
            0,
            canvasSize.width -
              newWidth
          )
        ),
        y: clamp(
          selectedImage.y,
          0,
          Math.max(
            0,
            canvasSize.height -
              newHeight
          )
        ),
      });
    };

  const rotateSelectedImage =
    (
      amount: number
    ) => {
      if (!selectedImage) {
        return;
      }

      updateImage({
        ...selectedImage,
        rotation:
          (selectedImage.rotation +
            amount) %
          360,
      });
    };

  const removeSelectedImage =
    async () => {
      if (!selectedImage) {
        return;
      }

      const target =
        selectedImage;

      setImages(
        (current) =>
          current.filter(
            (item) =>
              item.id !==
              target.id
          )
      );

      setSelectedImageId(
        null
      );

      if (target.path) {
        const {
          error,
        } = await supabase
          .storage
          .from(
            "whiteboard-assets"
          )
          .remove([
            target.path,
          ]);

        if (error) {
          console.log(
            "REMOVE IMAGE:",
            error
          );
        }
      }
    };

  const pickImage =
    async () => {
      if (!user?.id) {
        return;
      }

      try {
        const permission =
          await ImagePicker
            .requestMediaLibraryPermissionsAsync();

        if (
          !permission.granted
        ) {
          setStatus(
            "Permiso de fotos requerido"
          );
          return;
        }

        const result =
          await ImagePicker
            .launchImageLibraryAsync({
              mediaTypes: [
                "images",
              ],
              quality: 0.82,
            });

        if (
          result.canceled
        ) {
          return;
        }

        setUploadingImage(
          true
        );

        const asset =
          result.assets[0];

        const response =
          await fetch(
            asset.uri
          );

        const buffer =
          await response
            .arrayBuffer();

        if (
          buffer.byteLength >
          10 * 1024 * 1024
        ) {
          setStatus(
            "La imagen supera 10 MB"
          );
          return;
        }

        const mime =
          asset.mimeType ||
          "image/jpeg";

        const extension =
          mime ===
          "image/png"
            ? "png"
            : mime ===
              "image/webp"
            ? "webp"
            : "jpg";

        const fileName =
          `${Date.now()}-${Math.random()
            .toString(36)
            .slice(2)}.${extension}`;

        const path =
          `${user.id}/${fileName}`;

        const {
          error:
            uploadError,
        } = await supabase
          .storage
          .from(
            "whiteboard-assets"
          )
          .upload(
            path,
            buffer,
            {
              contentType:
                mime,
              upsert: false,
            }
          );

        if (uploadError) {
          throw uploadError;
        }

        const {
          data:
            publicData,
        } = supabase
          .storage
          .from(
            "whiteboard-assets"
          )
          .getPublicUrl(
            path
          );

        const baseWidth =
          Math.min(
            220,
            Math.max(
              130,
              canvasSize.width *
                0.42
            )
          );

        const ratio =
          asset.width &&
          asset.height
            ? asset.height /
              asset.width
            : 0.75;

        const item: BoardImage =
          {
            id:
              `${Date.now()}-${Math.random()}`,
            url:
              `${publicData.publicUrl}?v=${Date.now()}`,
            path,
            x: 24,
            y: 24,
            width:
              baseWidth,
            height:
              baseWidth *
              ratio,
            rotation: 0,
          };

        setImages(
          (current) => [
            ...current,
            item,
          ]
        );

        setSelectedImageId(
          item.id
        );

        setStatus(
          "Imagen agregada"
        );
      } catch (error) {
        console.log(
          "ADD BOARD IMAGE:",
          error
        );

        setStatus(
          "No se pudo subir la imagen"
        );
      } finally {
        setUploadingImage(
          false
        );
      }
    };

  const undo = () => {
    if (
      strokes.length ===
      0
    ) {
      return;
    }

    const last =
      strokes[
        strokes.length - 1
      ];

    setStrokes(
      (current) =>
        current.slice(
          0,
          -1
        )
    );

    setRedoStrokes(
      (current) => [
        ...current,
        last,
      ]
    );
  };

  const redo = () => {
    if (
      redoStrokes.length ===
      0
    ) {
      return;
    }

    const last =
      redoStrokes[
        redoStrokes.length -
          1
      ];

    setRedoStrokes(
      (current) =>
        current.slice(
          0,
          -1
        )
    );

    setStrokes(
      (current) => [
        ...current,
        last,
      ]
    );
  };

  const appendPoint =
    (
      x: number,
      y: number
    ) => {
      const next =
        `${currentPath.current} L ${x.toFixed(
          1
        )} ${y.toFixed(
          1
        )}`;

      currentPath.current =
        next;

      setStrokes(
        (current) =>
          current.map(
            (stroke) =>
              stroke.id ===
              currentStrokeId.current
                ? {
                    ...stroke,
                    d: next,
                  }
                : stroke
          )
      );
    };

  const panResponder =
    useMemo(
      () =>
        PanResponder.create({
          onStartShouldSetPanResponder:
            () =>
              selectedImageId ===
              null,

          onMoveShouldSetPanResponder:
            () =>
              selectedImageId ===
              null,

          onPanResponderGrant:
            (event) => {
              const {
                locationX,
                locationY,
              } =
                event.nativeEvent;

              const id =
                `${Date.now()}-${Math.random()}`;

              const d =
                `M ${locationX.toFixed(
                  1
                )} ${locationY.toFixed(
                  1
                )}`;

              currentStrokeId.current =
                id;

              currentPath.current =
                d;

              const active =
                toolRef.current;

              setRedoStrokes(
                []
              );

              setStrokes(
                (current) => [
                  ...current,
                  {
                    id,
                    d,
                    color:
                      active.color,
                    width:
                      active.width,
                    opacity:
                      active.opacity,
                    tool:
                      active.tool,
                  },
                ]
              );
            },

          onPanResponderMove:
            (event) => {
              const {
                locationX,
                locationY,
              } =
                event.nativeEvent;

              appendPoint(
                clamp(
                  locationX,
                  0,
                  canvasSize.width
                ),
                clamp(
                  locationY,
                  0,
                  canvasSize.height
                )
              );
            },

          onPanResponderRelease:
            () => {
              currentPath.current =
                "";
              currentStrokeId.current =
                "";
            },
        }),
      [
        selectedImageId,
        canvasSize.width,
        canvasSize.height,
      ]
    );

  const deleteBoard =
    async () => {
      if (
        !user?.id ||
        !boardId
      ) {
        router.back();
        return;
      }

      try {
        setSaving(true);

        const paths =
          images
            .map(
              (item) =>
                item.path
            )
            .filter(
              Boolean
            );

        if (
          paths.length >
          0
        ) {
          await supabase
            .storage
            .from(
              "whiteboard-assets"
            )
            .remove(paths);
        }

        const {
          error,
        } = await supabase
          .from(
            "whiteboards"
          )
          .delete()
          .eq(
            "id",
            boardId
          )
          .eq(
            "user_id",
            user.id
          );

        if (error) {
          throw error;
        }

        router.back();
      } catch (error) {
        console.log(
          "DELETE BOARD:",
          error
        );

        setStatus(
          "No se pudo eliminar"
        );
      } finally {
        setSaving(false);
      }
    };

  if (loading) {
    return (
      <View
        style={
          styles.loadingScreen
        }
      >
        <ActivityIndicator
          color={
            COLORS.primarySoft
          }
        />
        <Text
          style={
            styles.loadingText
          }
        >
          Cargando pizarra...
        </Text>
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
          paddingBottom:
            insets.bottom,
        },
      ]}
    >
      <View
        style={
          styles.topBar
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
            styles.titleArea
          }
        >
          <TextInput
            style={
              styles.titleInput
            }
            value={title}
            onChangeText={
              setTitle
            }
            placeholder="Nombre de la pizarra"
            placeholderTextColor={
              COLORS.textSoft
            }
          />

          <Text
            style={[
              styles.statusText,
              status ===
                "Guardado" &&
                styles.statusSaved,
            ]}
          >
            {saving
              ? "Guardando..."
              : status}
          </Text>
        </View>

        <TouchableOpacity
          style={
            styles.saveButton
          }
          onPress={() =>
            saveBoard(false)
          }
          disabled={
            saving
          }
        >
          {saving ? (
            <ActivityIndicator
              size="small"
              color="#FFFFFF"
            />
          ) : (
            <Ionicons
              name="save-outline"
              size={20}
              color="#FFFFFF"
            />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={
          false
        }
        contentContainerStyle={
          styles.toolsScroll
        }
        style={
          styles.toolsContainer
        }
      >
        <ToolButton
          label="Lápiz"
          active={
            tool === "pencil"
          }
          onPress={() => {
            setTool(
              "pencil"
            );
            setSelectedImageId(
              null
            );
          }}
        >
          <MaterialCommunityIcons
            name="pencil-outline"
            size={20}
            color={
              tool ===
              "pencil"
                ? "#FFFFFF"
                : COLORS.textMuted
            }
          />
        </ToolButton>

        <ToolButton
          label="Marcador"
          active={
            tool === "marker"
          }
          onPress={() => {
            setTool(
              "marker"
            );
            setSelectedImageId(
              null
            );
          }}
        >
          <MaterialCommunityIcons
            name="marker"
            size={20}
            color={
              tool ===
              "marker"
                ? "#FFFFFF"
                : COLORS.textMuted
            }
          />
        </ToolButton>

        <ToolButton
          label="Resaltador"
          active={
            tool ===
            "highlighter"
          }
          onPress={() => {
            setTool(
              "highlighter"
            );
            setSelectedImageId(
              null
            );
          }}
        >
          <MaterialCommunityIcons
            name="format-color-highlight"
            size={20}
            color={
              tool ===
              "highlighter"
                ? "#FFFFFF"
                : COLORS.textMuted
            }
          />
        </ToolButton>

        <ToolButton
          label="Borrador"
          active={
            tool === "eraser"
          }
          onPress={() => {
            setTool(
              "eraser"
            );
            setSelectedImageId(
              null
            );
          }}
        >
          <MaterialCommunityIcons
            name="eraser"
            size={21}
            color={
              tool ===
              "eraser"
                ? "#FFFFFF"
                : COLORS.textMuted
            }
          />
        </ToolButton>

        <View
          style={
            styles.toolDivider
          }
        />

        <TouchableOpacity
          style={
            styles.iconTool
          }
          onPress={undo}
        >
          <Ionicons
            name="arrow-undo-outline"
            size={19}
            color={
              strokes.length
                ? COLORS.text
                : COLORS.textSoft
            }
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={
            styles.iconTool
          }
          onPress={redo}
        >
          <Ionicons
            name="arrow-redo-outline"
            size={19}
            color={
              redoStrokes.length
                ? COLORS.text
                : COLORS.textSoft
            }
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={
            styles.imageButton
          }
          onPress={
            pickImage
          }
          disabled={
            uploadingImage
          }
        >
          {uploadingImage ? (
            <ActivityIndicator
              size="small"
              color={
                COLORS.primarySoft
              }
            />
          ) : (
            <Ionicons
              name="image-outline"
              size={20}
              color={
                COLORS.primarySoft
              }
            />
          )}

          <Text
            style={
              styles.imageButtonText
            }
          >
            Foto
          </Text>
        </TouchableOpacity>
      </ScrollView>

      <View
        style={
          styles.optionsRow
        }
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={
            false
          }
          contentContainerStyle={
            styles.palette
          }
        >
          {COLORS_LIST.map(
            (item) => (
              <TouchableOpacity
                key={item}
                style={[
                  styles.colorDot,
                  {
                    backgroundColor:
                      item,
                  },
                  color ===
                    item &&
                    tool !==
                      "eraser" &&
                    styles.colorDotSelected,
                ]}
                onPress={() => {
                  setColor(item);

                  if (
                    tool ===
                    "eraser"
                  ) {
                    setTool(
                      "pencil"
                    );
                  }

                  setSelectedImageId(
                    null
                  );
                }}
              />
            )
          )}
        </ScrollView>

        <View
          style={
            styles.widthChoices
          }
        >
          {[3, 5, 8].map(
            (width) => (
              <TouchableOpacity
                key={width}
                style={[
                  styles.widthButton,
                  pencilWidth ===
                    width &&
                    styles.widthButtonActive,
                ]}
                onPress={() => {
                  setPencilWidth(
                    width
                  );
                  setSelectedImageId(
                    null
                  );
                }}
              >
                <View
                  style={{
                    width:
                      width + 3,
                    height:
                      width + 3,
                    borderRadius:
                      20,
                    backgroundColor:
                      pencilWidth ===
                      width
                        ? "#FFFFFF"
                        : COLORS.textMuted,
                  }}
                />
              </TouchableOpacity>
            )
          )}
        </View>
      </View>

      {selectedImage && (
        <View
          style={
            styles.imageControls
          }
        >
          <Text
            style={
              styles.imageControlsLabel
            }
          >
            Imagen seleccionada
          </Text>

          <TouchableOpacity
            style={
              styles.imageControlButton
            }
            onPress={() =>
              resizeSelectedImage(
                0.85
              )
            }
          >
            <MaterialCommunityIcons
              name="arrow-collapse"
              size={18}
              color={
                COLORS.text
              }
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={
              styles.imageControlButton
            }
            onPress={() =>
              resizeSelectedImage(
                1.18
              )
            }
          >
            <MaterialCommunityIcons
              name="arrow-expand"
              size={18}
              color={
                COLORS.text
              }
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={
              styles.imageControlButton
            }
            onPress={() =>
              rotateSelectedImage(
                -15
              )
            }
          >
            <MaterialCommunityIcons
              name="rotate-left"
              size={18}
              color={
                COLORS.text
              }
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={
              styles.imageControlButton
            }
            onPress={() =>
              rotateSelectedImage(
                15
              )
            }
          >
            <MaterialCommunityIcons
              name="rotate-right"
              size={18}
              color={
                COLORS.text
              }
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.imageControlButton,
              styles.imageDeleteButton,
            ]}
            onPress={
              removeSelectedImage
            }
          >
            <Ionicons
              name="trash-outline"
              size={18}
              color={
                COLORS.danger
              }
            />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() =>
              setSelectedImageId(
                null
              )
            }
          >
            <Ionicons
              name="close"
              size={20}
              color={
                COLORS.textMuted
              }
            />
          </TouchableOpacity>
        </View>
      )}

      <View
        style={[
          styles.canvas,
          {
            height:
              canvasHeight,
          },
        ]}
        onLayout={(
          event
        ) => {
          const {
            width,
            height,
          } =
            event.nativeEvent
              .layout;

          setCanvasSize({
            width,
            height,
          });
        }}
        onTouchStart={() => {
          if (
            selectedImageId
          ) {
            setSelectedImageId(
              null
            );
          }
        }}
        {...panResponder.panHandlers}
      >
        {images.map(
          (item) => (
            <MovableImage
              key={item.id}
              item={item}
              selected={
                selectedImageId ===
                item.id
              }
              canvasWidth={
                canvasSize.width
              }
              canvasHeight={
                canvasSize.height
              }
              onSelect={() =>
                setSelectedImageId(
                  item.id
                )
              }
              onChange={
                updateImage
              }
            />
          )
        )}

        <Svg
          width="100%"
          height="100%"
          pointerEvents="none"
          style={
            styles.drawingLayer
          }
        >
          {strokes.map(
            (stroke) => (
              <SvgPath
                key={
                  stroke.id
                }
                d={stroke.d}
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
          styles.bottomBar
        }
      >
        <TouchableOpacity
          style={
            styles.clearButton
          }
          onPress={() => {
            setStrokes([]);
            setRedoStrokes(
              []
            );
          }}
        >
          <Ionicons
            name="sparkles-outline"
            size={17}
            color={
              COLORS.textMuted
            }
          />

          <Text
            style={
              styles.clearText
            }
          >
            Limpiar trazos
          </Text>
        </TouchableOpacity>

        {boardId &&
          (confirmDelete ? (
            <View
              style={
                styles.deleteConfirm
              }
            >
              <TouchableOpacity
                onPress={() =>
                  setConfirmDelete(
                    false
                  )
                }
              >
                <Text
                  style={
                    styles.cancelDelete
                  }
                >
                  Cancelar
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={
                  deleteBoard
                }
              >
                <Text
                  style={
                    styles.confirmDelete
                  }
                >
                  Eliminar
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={
                styles.deleteBoardButton
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
            </TouchableOpacity>
          ))}
      </View>
    </View>
  );
}

function ToolButton({
  label,
  active,
  onPress,
  children,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  children:
    React.ReactNode;
}) {
  return (
    <TouchableOpacity
      style={[
        styles.toolButton,
        active &&
          styles.toolButtonActive,
      ]}
      onPress={onPress}
    >
      {children}

      <Text
        style={[
          styles.toolLabel,
          active &&
            styles.toolLabelActive,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles =
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor:
        COLORS.background,
    },

    loadingScreen: {
      flex: 1,
      backgroundColor:
        COLORS.background,
      alignItems: "center",
      justifyContent:
        "center",
    },

    loadingText: {
      color:
        COLORS.textMuted,
      fontSize: 11,
      marginTop: 10,
    },

    topBar: {
      width: "100%",
      maxWidth: 950,
      alignSelf: "center",
      paddingHorizontal: 12,
      paddingTop: 8,
      paddingBottom: 7,
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },

    circleButton: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor:
        COLORS.surface2,
      alignItems: "center",
      justifyContent:
        "center",
    },

    titleArea: {
      flex: 1,
    },

    titleInput: {
      height: 35,
      color:
        COLORS.text,
      fontSize: 15,
      fontWeight: "700",
      paddingHorizontal: 4,
      outlineStyle:
        "none" as any,
    },

    statusText: {
      color:
        COLORS.textMuted,
      fontSize: 9,
      paddingHorizontal: 4,
      marginTop: -2,
    },

    statusSaved: {
      color:
        COLORS.success,
    },

    saveButton: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor:
        COLORS.primary,
      alignItems: "center",
      justifyContent:
        "center",
    },

    toolsContainer: {
      flexGrow: 0,
      maxHeight: 62,
    },

    toolsScroll: {
      width: "auto",
      minWidth: "100%",
      maxWidth: 950,
      alignSelf: "center",
      paddingHorizontal: 12,
      alignItems: "center",
      gap: 6,
    },

    toolButton: {
      minWidth: 66,
      height: 50,
      borderRadius:
        RADIUS.md,
      backgroundColor:
        COLORS.surface2,
      alignItems: "center",
      justifyContent:
        "center",
      paddingHorizontal: 7,
    },

    toolButtonActive: {
      backgroundColor:
        COLORS.primary,
    },

    toolLabel: {
      color:
        COLORS.textMuted,
      fontSize: 8,
      marginTop: 2,
      fontWeight: "600",
    },

    toolLabelActive: {
      color: "#FFFFFF",
    },

    toolDivider: {
      width: 1,
      height: 32,
      backgroundColor:
        COLORS.border,
      marginHorizontal: 2,
    },

    iconTool: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor:
        COLORS.surface2,
      alignItems: "center",
      justifyContent:
        "center",
    },

    imageButton: {
      minWidth: 62,
      height: 40,
      borderRadius: 20,
      backgroundColor:
        COLORS.surface2,
      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "center",
      gap: 5,
      paddingHorizontal: 9,
    },

    imageButtonText: {
      color:
        COLORS.primarySoft,
      fontSize: 9,
      fontWeight: "600",
    },

    optionsRow: {
      width: "100%",
      maxWidth: 950,
      alignSelf: "center",
      minHeight: 45,
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 12,
      gap: 8,
    },

    palette: {
      alignItems: "center",
      gap: 6,
      paddingRight: 4,
    },

    colorDot: {
      width: 24,
      height: 24,
      borderRadius: 12,
      borderWidth: 2,
      borderColor:
        COLORS.background,
    },

    colorDotSelected: {
      borderColor:
        COLORS.primarySoft,
      transform: [
        {
          scale: 1.15,
        },
      ],
    },

    widthChoices: {
      flexDirection: "row",
      gap: 4,
    },

    widthButton: {
      width: 30,
      height: 28,
      borderRadius: 14,
      backgroundColor:
        COLORS.surface2,
      alignItems: "center",
      justifyContent:
        "center",
    },

    widthButtonActive: {
      backgroundColor:
        COLORS.primary,
    },

    imageControls: {
      width: "100%",
      maxWidth: 950,
      alignSelf: "center",
      minHeight: 44,
      paddingHorizontal: 12,
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },

    imageControlsLabel: {
      color:
        COLORS.textMuted,
      fontSize: 9,
      marginRight: 3,
    },

    imageControlButton: {
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor:
        COLORS.surface2,
      alignItems: "center",
      justifyContent:
        "center",
    },

    imageDeleteButton: {
      borderWidth: 1,
      borderColor:
        COLORS.danger,
    },

    canvas: {
      width: "100%",
      maxWidth: 950,
      alignSelf: "center",
      backgroundColor:
        BG,
      borderRadius:
        RADIUS.md,
      overflow: "hidden",
      borderWidth: 1,
      borderColor:
        COLORS.border,
      position: "relative",
    },

    drawingLayer: {
      ...StyleSheet.absoluteFillObject,
      zIndex: 4,
    },

    movableImage: {
      position: "absolute",
      zIndex: 2,
      borderWidth: 2,
      borderColor:
        "transparent",
    },

    movableImageSelected: {
      borderColor:
        COLORS.primary,
      zIndex: 3,
    },

    imageFill: {
      width: "100%",
      height: "100%",
    },

    imageMoveBadge: {
      position: "absolute",
      right: -10,
      top: -10,
      width: 26,
      height: 26,
      borderRadius: 13,
      backgroundColor:
        COLORS.primary,
      alignItems: "center",
      justifyContent:
        "center",
    },

    bottomBar: {
      width: "100%",
      maxWidth: 950,
      alignSelf: "center",
      minHeight: 48,
      paddingHorizontal: 12,
      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "space-between",
    },

    clearButton: {
      minHeight: 36,
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      paddingHorizontal: 8,
    },

    clearText: {
      color:
        COLORS.textMuted,
      fontSize: 9,
    },

    deleteBoardButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor:
        COLORS.surface2,
      borderWidth: 1,
      borderColor:
        COLORS.danger,
      alignItems: "center",
      justifyContent:
        "center",
    },

    deleteConfirm: {
      minHeight: 36,
      borderRadius: 18,
      backgroundColor:
        COLORS.surface2,
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingHorizontal: 12,
    },

    cancelDelete: {
      color:
        COLORS.textMuted,
      fontSize: 10,
      fontWeight: "600",
    },

    confirmDelete: {
      color:
        COLORS.danger,
      fontSize: 10,
      fontWeight: "700",
    },
  });
