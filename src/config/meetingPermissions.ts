export const MEETING_PERMISSION_KEYS = {
  VIEW: ['Meetings.View', 'Meetings.Read', 'Meeting.View', 'Meeting.Read'],
  CREATE: ['Meetings.Create', 'Meeting.Create'],
  EDIT: [
    'Meetings.Edit',
    'Meetings.Update',
    'Meeting.Edit',
    'Meeting.Update',
  ],
  DELETE: ['Meetings.Delete', 'Meeting.Delete'],
} as const;

export type MeetingPermissionAction = keyof typeof MEETING_PERMISSION_KEYS;
