import {
  Platform,
} from "react-native";

import * as Notifications from "expo-notifications";

/* =========================================================
   LUMI - NOTIFICACIONES LOCALES
========================================================= */

if (
  Platform.OS !==
  "web"
) {
  Notifications.setNotificationHandler({
    handleNotification:
      async () => ({
        shouldShowBanner:
          true,
        shouldShowList:
          true,
        shouldPlaySound:
          true,
        shouldSetBadge:
          false,
      }),
  });
}

export async function configureNotificationChannel() {
  if (
    Platform.OS !==
    "android"
  ) {
    return;
  }

  await Notifications.setNotificationChannelAsync(
    "tasks",
    {
      name:
        "Recordatorios de tareas",
      importance:
        Notifications.AndroidImportance.HIGH,
      sound:
        "default",
      vibrationPattern: [
        0,
        250,
        150,
        250,
      ],
    }
  );
}

export async function requestNotificationPermission() {
  if (
    Platform.OS ===
    "web"
  ) {
    return false;
  }

  await configureNotificationChannel();

  const current =
    await Notifications.getPermissionsAsync();

  if (
    current.granted
  ) {
    return true;
  }

  const result =
    await Notifications.requestPermissionsAsync();

  return result.granted;
}

export async function sendTestNotification() {
  if (
    Platform.OS ===
    "web"
  ) {
    return null;
  }

  await configureNotificationChannel();

  return Notifications.scheduleNotificationAsync({
    content: {
      title:
        "LUMI ✨",
      body:
        "Listo, te avisaré sobre tus tareas.",
      sound:
        "default",
    },

    trigger: {
      type:
        Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 2,
      channelId:
        "tasks",
    },
  });
}

function parseTaskDateTime(
  dateString: string,
  timeString: string
) {
  const [
    day,
    month,
    year,
  ] = dateString
    .split("/")
    .map(Number);

  const match =
    timeString
      .trim()
      .match(
        /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i
      );

  if (
    !match
  ) {
    return null;
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
    match[3]
      .toUpperCase();

  if (
    period === "AM" &&
    hour === 12
  ) {
    hour = 0;
  }

  if (
    period === "PM" &&
    hour !== 12
  ) {
    hour += 12;
  }

  const date =
    new Date(
      year,
      month - 1,
      day,
      hour,
      minute,
      0,
      0
    );

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return null;
  }

  return date;
}

export async function scheduleTaskNotification({
  title,
  date,
  time,
  taskId,
  minutesBefore = 0,
}: {
  title: string;
  date: string;
  time: string;
  taskId?: string;
  minutesBefore?: number;
}) {
  if (
    Platform.OS ===
    "web"
  ) {
    return null;
  }

  const granted =
    await requestNotificationPermission();

  if (
    !granted
  ) {
    return null;
  }

  const taskDate =
    parseTaskDateTime(
      date,
      time
    );

  if (
    !taskDate
  ) {
    return null;
  }

  const triggerDate =
    new Date(
      taskDate.getTime() -
        minutesBefore *
          60 *
          1000
    );

  if (
    triggerDate.getTime() <=
    Date.now()
  ) {
    return null;
  }

  await configureNotificationChannel();

  const body =
    minutesBefore > 0
      ? `Tu tarea "${title}" empieza en ${minutesBefore} min.`
      : `Es hora de: ${title}`;

  return Notifications.scheduleNotificationAsync({
    content: {
      title:
        "Recordatorio de tarea ✨",
      body,
      sound:
        "default",
      data: {
        taskId:
          taskId ??
          null,
      },
    },

    trigger: {
      type:
        Notifications.SchedulableTriggerInputTypes.DATE,
      date:
        triggerDate,
      channelId:
        "tasks",
    },
  });
}

export async function cancelTaskNotification(
  notificationId:
    string | null | undefined
) {
  if (
    Platform.OS ===
      "web" ||
    !notificationId
  ) {
    return;
  }

  await Notifications.cancelScheduledNotificationAsync(
    notificationId
  );
}
