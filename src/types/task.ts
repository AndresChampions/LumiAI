export type Task = {
  id: string;
  title: string;
  date: string;
  time: string;
  notes?: string;
  completed: boolean;
  notificationEnabled: boolean;
};