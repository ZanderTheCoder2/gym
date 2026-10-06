import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { getProgramDayIndexForDate, type Program } from '@/data/programs';

export const workoutReminderStorageKey = '@gym/workout-reminder';
const reminderNotificationKind = 'daily-workout-reminder';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export type WorkoutReminder = { enabled: boolean; time: string };

export const defaultWorkoutReminder: WorkoutReminder = { enabled: false, time: '08:00' };

export function isValidReminderTime(value: string): boolean {
  return /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value);
}

export function normalizeWorkoutReminder(value: unknown): WorkoutReminder {
  if (!value || typeof value !== 'object') return defaultWorkoutReminder;
  const candidate = value as Partial<WorkoutReminder>;
  return {
    enabled: candidate.enabled === true,
    time: typeof candidate.time === 'string' && isValidReminderTime(candidate.time) ? candidate.time : defaultWorkoutReminder.time,
  };
}

export async function scheduleDailyWorkoutReminders(time: string, programs: Program[], requestPermission: boolean): Promise<void> {
  if (Platform.OS === 'web') throw new Error('Daily workout reminders are available in the iOS and Android apps.');
  if (!isValidReminderTime(time)) throw new Error('Enter a valid time in 24-hour format, such as 08:30.');

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('workout-reminders', {
      name: 'Workout reminders',
      importance: Notifications.AndroidImportance.DEFAULT,
      sound: 'default',
    });
  }

  let { status } = await Notifications.getPermissionsAsync();
  if (status !== 'granted' && requestPermission) {
    ({ status } = await Notifications.requestPermissionsAsync());
  }
  if (status !== 'granted') {
    throw new Error('Allow notifications in your device settings to receive workout reminders.');
  }

  const [hour, minute] = time.split(':').map(Number);
  const existing = (await Notifications.getAllScheduledNotificationsAsync())
    .filter(notification => notification.content.data?.kind === reminderNotificationKind);
  const createdIds: string[] = [];
  const program = programs[0];
  const now = new Date();

  try {
    for (let weekday = 0; weekday < 7; weekday += 1) {
      let daysUntil = (weekday - now.getDay() + 7) % 7;
      const nextDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + daysUntil);
      nextDate.setHours(hour, minute, 0, 0);
      if (daysUntil === 0 && nextDate.getTime() <= now.getTime()) {
        daysUntil = 7;
        nextDate.setDate(nextDate.getDate() + 7);
      }

      const dayIndex = program
        ? getProgramDayIndexForDate(program.days.length, nextDate, program.startDate, program.trainingWeekdays)
        : undefined;
      const workoutDay = dayIndex === undefined ? undefined : program?.days[dayIndex];
      const exerciseNames = workoutDay?.exercises.slice(0, 4).map(exercise => exercise.name);
      const remainingExercises = (workoutDay?.exercises.length ?? 0) - (exerciseNames?.length ?? 0);
      const body = !program
        ? 'Open Forged Fitness to choose a program for today.'
        : workoutDay
          ? `${program.name}: ${exerciseNames?.join(', ') || 'your planned session'}${remainingExercises > 0 ? `, +${remainingExercises} more` : ''}.`
          : 'No workout is scheduled today. Take time to recover.';

      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: workoutDay ? `Today's training: ${workoutDay.name}` : program ? 'Today is a recovery day' : 'Your workout reminder',
          body,
          data: { kind: reminderNotificationKind },
          sound: 'default',
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
          weekday: weekday + 1,
          hour,
          minute,
          channelId: Platform.OS === 'android' ? 'workout-reminders' : undefined,
        },
      });
      createdIds.push(id);
    }
  } catch (error) {
    await Promise.all(createdIds.map(id => Notifications.cancelScheduledNotificationAsync(id)));
    throw error;
  }

  await Promise.all(existing.map(notification => Notifications.cancelScheduledNotificationAsync(notification.identifier)));
}

export async function cancelDailyWorkoutReminders(): Promise<void> {
  if (Platform.OS === 'web') return;
  const existing = (await Notifications.getAllScheduledNotificationsAsync())
    .filter(notification => notification.content.data?.kind === reminderNotificationKind);
  await Promise.all(existing.map(notification => Notifications.cancelScheduledNotificationAsync(notification.identifier)));
}
