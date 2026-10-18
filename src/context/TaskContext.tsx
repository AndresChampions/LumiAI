import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

import {
  supabase,
} from "../lib/supabase";

import {
  useAuth,
} from "./AuthContext";

import {
  useSettings,
} from "./SettingsContext";

import {
  cancelTaskNotification,
  scheduleTaskNotification,
} from "../lib/notifications";

export type Task = {
  id:
    string;

  title:
    string;

  date:
    string;

  time:
    string;

  notes:
    string;

  completed:
    boolean;

  notificationEnabled:
    boolean;

  notificationId?:
    | string
    | null;

  completedAt?:
    | string
    | null;
};

type NewTask = {
  title:
    string;

  date:
    string;

  time:
    string;

  notes?:
    string;

  notificationEnabled?:
    boolean;
};

type TaskContextType = {
  tasks:
    Task[];

  loadingTasks:
    boolean;

  addTask: (
    task:
      NewTask
  ) => Promise<void>;

  updateTask: (
    id:
      string,

    changes:
      Partial<
        Omit<
          Task,
          "id"
        >
      >
  ) => Promise<void>;

  toggleTask: (
    id:
      string
  ) => Promise<void>;

  deleteTask: (
    id:
      string
  ) => Promise<void>;

  getTaskById: (
    id:
      string
  ) =>
    | Task
    | undefined;

  reloadTasks:
    () => Promise<void>;
};

const TaskContext =
  createContext<
    TaskContextType |
      undefined
  >(undefined);

function uiDateToDb(
  value:
    string
) {
  const [
    day,
    month,
    year,
  ] =
    value
      .split("/")
      .map(Number);

  return `${year}-${String(
    month
  ).padStart(
    2,
    "0"
  )}-${String(
    day
  ).padStart(
    2,
    "0"
  )}`;
}

function dbDateToUi(
  value:
    string
) {
  const [
    year,
    month,
    day,
  ] =
    value.split(
      "-"
    );

  return `${day}/${month}/${year}`;
}

function uiTimeToDb(
  value:
    string
) {
  const match =
    value.match(
      /^(\d{1,2}):(\d{2})\s?(AM|PM)$/i
    );

  if (
    !match
  ) {
    return "09:00:00";
  }

  let hour =
    Number(
      match[1]
    );

  const minute =
    Number(
      match[2]
    );

  const period =
    match[3].toUpperCase();

  if (
    period ===
      "PM" &&
    hour !== 12
  ) {
    hour += 12;
  }

  if (
    period ===
      "AM" &&
    hour === 12
  ) {
    hour = 0;
  }

  return `${String(
    hour
  ).padStart(
    2,
    "0"
  )}:${String(
    minute
  ).padStart(
    2,
    "0"
  )}:00`;
}

function dbTimeToUi(
  value?:
    | string
    | null
) {
  if (
    !value
  ) {
    return "9:00 AM";
  }

  const [
    hourString,
    minute,
  ] =
    value.split(
      ":"
    );

  const hour24 =
    Number(
      hourString
    );

  const period =
    hour24 >= 12
      ? "PM"
      : "AM";

  const hour12 =
    hour24 % 12 ||
    12;

  return `${hour12}:${minute} ${period}`;
}

export function TaskProvider({
  children,
}: {
  children:
    ReactNode;
}) {
  const {
    user,
  } =
    useAuth();

  const {
    notificationsEnabled,
  } =
    useSettings();

  const [
    tasks,
    setTasks,
  ] =
    useState<
      Task[]
    >([]);

  const [
    loadingTasks,
    setLoadingTasks,
  ] =
    useState(
      false
    );

  const reloadTasks =
    async () => {
      if (
        !user?.id
      ) {
        setTasks(
          []
        );

        return;
      }

      try {
        setLoadingTasks(
          true
        );

        const {
          data,
          error,
        } =
          await supabase
            .from(
              "tasks"
            )
            .select(
              "*"
            )
            .eq(
              "user_id",
              user.id
            )
            .order(
              "task_date",
              {
                ascending:
                  true,
              }
            )
            .order(
              "task_time",
              {
                ascending:
                  true,
              }
            );

        if (
          error
        ) {
          console.log(
            "TASKS:",
            error.message
          );

          return;
        }

        const mapped =
          (
            data ??
            []
          ).map(
            (
              item
            ): Task => ({
              id:
                item.id,

              title:
                item.title,

              date:
                dbDateToUi(
                  item.task_date
                ),

              time:
                dbTimeToUi(
                  item.task_time
                ),

              notes:
                item.notes ??
                "",

              completed:
                item.completed,

              notificationEnabled:
                item.notification_enabled,

              notificationId:
                item.notification_id ??
                null,

              completedAt:
                item.completed_at,
            })
          );

        setTasks(
          mapped
        );
      } finally {
        setLoadingTasks(
          false
        );
      }
    };

  useEffect(() => {
    reloadTasks();
  }, [
    user?.id,
  ]);

  /*
   * Si el usuario apaga las notificaciones
   * globales desde Perfil, cancelamos todos
   * los recordatorios programados.
   *
   * Si vuelve a encenderlas, programamos
   * las tareas futuras que tengan su
   * notificación individual activada.
   */
  useEffect(() => {
    if (
      !user?.id ||
      loadingTasks
    ) {
      return;
    }

    const syncNotifications =
      async () => {
        let changed =
          false;

        for (
          const task of
          tasks
        ) {
          if (
            !notificationsEnabled
          ) {
            if (
              task.notificationId
            ) {
              await cancelTaskNotification(
                task.notificationId
              );

              await supabase
                .from("tasks")
                .update({
                  notification_id:
                    null,
                })
                .eq(
                  "id",
                  task.id
                )
                .eq(
                  "user_id",
                  user.id
                );

              changed =
                true;
            }

            continue;
          }

          if (
            task.completed ||
            !task.notificationEnabled ||
            task.notificationId
          ) {
            continue;
          }

          const notificationId =
            await scheduleTaskNotification({
              title:
                task.title,
              date:
                task.date,
              time:
                task.time,
              taskId:
                task.id,
            });

          if (
            notificationId
          ) {
            await supabase
              .from("tasks")
              .update({
                notification_id:
                  notificationId,
              })
              .eq(
                "id",
                task.id
              )
              .eq(
                "user_id",
                user.id
              );

            changed =
              true;
          }
        }

        if (
          changed
        ) {
          await reloadTasks();
        }
      };

    syncNotifications();
  }, [
    notificationsEnabled,
  ]);

  const addTask =
    async (
      task:
        NewTask
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
            "tasks"
          )
          .insert({
            user_id:
              user.id,

            title:
              task.title,

            task_date:
              uiDateToDb(
                task.date
              ),

            task_time:
              uiTimeToDb(
                task.time
              ),

            notes:
              task.notes ??
              "",

            completed:
              false,

            notification_enabled:
              task.notificationEnabled ??
              true,

            notification_id:
              null,
          })
          .select(
            "id"
          )
          .single();

      if (
        error
      ) {
        console.log(
          "CREATE TASK:",
          error.message
        );

        return;
      }

      const shouldNotify =
        notificationsEnabled &&
        (
          task.notificationEnabled ??
          true
        );

      if (
        shouldNotify
      ) {
        const notificationId =
          await scheduleTaskNotification({
            title:
              task.title,
            date:
              task.date,
            time:
              task.time,
            taskId:
              data.id,
          });

        if (
          notificationId
        ) {
          const {
            error:
              notificationError,
          } =
            await supabase
              .from(
                "tasks"
              )
              .update({
                notification_id:
                  notificationId,
              })
              .eq(
                "id",
                data.id
              )
              .eq(
                "user_id",
                user.id
              );

          if (
            notificationError
          ) {
            console.log(
              "SAVE NOTIFICATION ID:",
              notificationError.message
            );
          }
        }
      }

      await reloadTasks();
    };

  const updateTask =
    async (
      id:
        string,

      changes:
        Partial<
          Omit<
            Task,
            "id"
          >
        >
    ) => {
      if (
        !user?.id
      ) {
        return;
      }

      const currentTask =
        tasks.find(
          (
            item
          ) =>
            item.id ===
            id
        );

      if (
        !currentTask
      ) {
        return;
      }

      const mergedTask:
        Task = {
          ...currentTask,
          ...changes,
        };

      /*
       * Siempre cancelamos el recordatorio
       * anterior antes de reprogramar.
       * Así editar fecha/hora no deja
       * notificaciones fantasma.
       */
      if (
        currentTask.notificationId
      ) {
        await cancelTaskNotification(
          currentTask.notificationId
        );
      }

      const payload:
        Record<
          string,
          any
        > = {
          updated_at:
            new Date().toISOString(),

          notification_id:
            null,
        };

      if (
        changes.title !==
        undefined
      ) {
        payload.title =
          changes.title;
      }

      if (
        changes.date !==
        undefined
      ) {
        payload.task_date =
          uiDateToDb(
            changes.date
          );
      }

      if (
        changes.time !==
        undefined
      ) {
        payload.task_time =
          uiTimeToDb(
            changes.time
          );
      }

      if (
        changes.notes !==
        undefined
      ) {
        payload.notes =
          changes.notes;
      }

      if (
        changes.completed !==
        undefined
      ) {
        payload.completed =
          changes.completed;
      }

      if (
        changes.completedAt !==
        undefined
      ) {
        payload.completed_at =
          changes.completedAt;
      }

      if (
        changes.notificationEnabled !==
        undefined
      ) {
        payload.notification_enabled =
          changes.notificationEnabled;
      }

      const {
        error,
      } =
        await supabase
          .from(
            "tasks"
          )
          .update(
            payload
          )
          .eq(
            "id",
            id
          )
          .eq(
            "user_id",
            user.id
          );

      if (
        error
      ) {
        console.log(
          "UPDATE TASK:",
          error.message
        );

        return;
      }

      const shouldNotify =
        notificationsEnabled &&
        mergedTask.notificationEnabled &&
        !mergedTask.completed;

      if (
        shouldNotify
      ) {
        const notificationId =
          await scheduleTaskNotification({
            title:
              mergedTask.title,
            date:
              mergedTask.date,
            time:
              mergedTask.time,
            taskId:
              id,
          });

        if (
          notificationId
        ) {
          const {
            error:
              notificationError,
          } =
            await supabase
              .from(
                "tasks"
              )
              .update({
                notification_id:
                  notificationId,
              })
              .eq(
                "id",
                id
              )
              .eq(
                "user_id",
                user.id
              );

          if (
            notificationError
          ) {
            console.log(
              "UPDATE NOTIFICATION ID:",
              notificationError.message
            );
          }
        }
      }

      await reloadTasks();
    };

  const toggleTask =
    async (
      id:
        string
    ) => {
      const task =
        tasks.find(
          (
            item
          ) =>
            item.id ===
            id
        );

      if (
        !task
      ) {
        return;
      }

      const completed =
        !task.completed;

      await updateTask(
        id,
        {
          completed,

          completedAt:
            completed
              ? new Date().toISOString()
              : null,
        }
      );
    };

  const deleteTask =
    async (
      id:
        string
    ) => {
      if (
        !user?.id
      ) {
        return;
      }

      const task =
        tasks.find(
          (
            item
          ) =>
            item.id ===
            id
        );

      if (
        task?.notificationId
      ) {
        await cancelTaskNotification(
          task.notificationId
        );
      }

      const {
        error,
      } =
        await supabase
          .from(
            "tasks"
          )
          .delete()
          .eq(
            "id",
            id
          )
          .eq(
            "user_id",
            user.id
          );

      if (
        error
      ) {
        console.log(
          "DELETE TASK:",
          error.message
        );

        return;
      }

      await reloadTasks();
    };

  const getTaskById =
    (
      id:
        string
    ) =>
      tasks.find(
        (
          task
        ) =>
          task.id ===
          id
      );

  return (
    <TaskContext.Provider
      value={{
        tasks,

        loadingTasks,

        addTask,

        updateTask,

        toggleTask,

        deleteTask,

        getTaskById,

        reloadTasks,
      }}
    >
      {children}
    </TaskContext.Provider>
  );
}

export function useTasks() {
  const context =
    useContext(
      TaskContext
    );

  if (
    !context
  ) {
    throw new Error(
      "useTasks debe usarse dentro de TaskProvider"
    );
  }

  return context;
}
