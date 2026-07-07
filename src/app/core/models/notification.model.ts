/** Mirrors the backend NotificationType union — new backend types render fine untyped-wise via string fallback. */
export type NotificationType = 'comment' | 'favorite' | 'clone' | 'purchase';

export interface AppNotification {
  notificationId: string;
  type:           NotificationType;
  title:          string;
  body:           string;
  url:            string;   // relative deep link, e.g. /?share=abc
  read:           boolean;
  createdAt:      string;   // ISO-8601
}

export interface NotificationStatus {
  count: number;   // unread
  muted: boolean;
}
