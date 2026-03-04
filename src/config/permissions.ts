/**
 * Permission Constants
 * Centralized location for all permission strings
 * Easy to update permission names from one place
 */

export const PERMISSIONS = {
  // Notification Permissions
  NOTIFICATIONS_CREATE: 'Notifications.Create',
  NOTIFICATIONS_DELETE: 'Notifications.Delete',
  NOTIFICATIONS_EDIT: 'Notifications.Edit',
  NOTIFICATIONS_MARK_READ: 'Notifications.MarkRead.Create',
  NOTIFICATIONS_UNREAD_COUNT: 'Notifications.UnreadCount.View',
  NOTIFICATIONS_VIEW: 'Notifications.View',

  // Preferences Permissions
  PREFERENCES_CREATE: 'Preferences.Create',
  PREFERENCES_EDIT: 'Preferences.Edit',
  PREFERENCES_VIEW: 'Preferences.View',
  PREFERENCES_CATEGORIES_CREATE: 'Preferences.Categories.Create',

  // Queue Permissions
  QUEUE_VIEW: 'Queue.View',

  // Templates Permissions
  TEMPLATES_CREATE: 'Templates.Create',
  TEMPLATES_DELETE: 'Templates.Delete',
  TEMPLATES_EDIT: 'Templates.Edit',
  TEMPLATES_VIEW: 'Templates.View',

  // Webhooks Permissions
  WEBHOOKS_CREATE: 'Webhooks.Create',
  WEBHOOKS_VIEW: 'Webhooks.View',
} as const;

/**
 * Feature Permissions Map
 * Maps UI features to their required permissions
 * Update this when permission requirements change
 */
export const FEATURE_PERMISSIONS = {
  // Notification Features
  DELETE_NOTIFICATION: PERMISSIONS.NOTIFICATIONS_DELETE,
  CREATE_NOTIFICATION: PERMISSIONS.NOTIFICATIONS_CREATE,
  EDIT_NOTIFICATION: PERMISSIONS.NOTIFICATIONS_EDIT,
  MARK_NOTIFICATION_READ: PERMISSIONS.NOTIFICATIONS_MARK_READ,
  VIEW_UNREAD_COUNT: PERMISSIONS.NOTIFICATIONS_UNREAD_COUNT,
  VIEW_NOTIFICATIONS: PERMISSIONS.NOTIFICATIONS_VIEW,

  // Preferences Features
  CREATE_PREFERENCE: PERMISSIONS.PREFERENCES_CREATE,
  EDIT_PREFERENCE: PERMISSIONS.PREFERENCES_EDIT,
  VIEW_PREFERENCES: PERMISSIONS.PREFERENCES_VIEW,

  // Queue Features
  VIEW_QUEUE: PERMISSIONS.QUEUE_VIEW,

  // Templates Features
  CREATE_TEMPLATE: PERMISSIONS.TEMPLATES_CREATE,
  DELETE_TEMPLATE: PERMISSIONS.TEMPLATES_DELETE,
  EDIT_TEMPLATE: PERMISSIONS.TEMPLATES_EDIT,
  VIEW_TEMPLATES: PERMISSIONS.TEMPLATES_VIEW,

  // Webhooks Features
  CREATE_WEBHOOK: PERMISSIONS.WEBHOOKS_CREATE,
  VIEW_WEBHOOKS: PERMISSIONS.WEBHOOKS_VIEW,
} as const;

export type FeaturePermissionType = keyof typeof FEATURE_PERMISSIONS;
export type PermissionType = typeof PERMISSIONS[keyof typeof PERMISSIONS];
