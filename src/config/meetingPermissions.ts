export const MEETING_PERMISSION_KEYS = {
  LIST: ["Meetings.List", "Meeting.List"],
  VIEW: ['Meetings.View', 'Meetings.Read', 'Meeting.View', 'Meeting.Read'],
  CREATE: ['Meetings.Create', 'Meeting.Create'],
  EDIT: [
    'Meetings.Edit',
    'Meetings.Update',
    'Meeting.Edit',
    'Meeting.Update',
  ],
  UPDATE: [
    'Meetings.Update',
    'Meetings.Edit',
    'Meeting.Update',
    'Meeting.Edit',
  ],
  DELETE: ['Meetings.Delete', 'Meeting.Delete'],
  CANCEL: ['Meetings.Cancel', 'Meeting.Cancel'],
  PARTICIPANTS: {
    ADD: [
      'Meetings.Participants.Add',
      'Meeting.Participants.Add',
      'MeetingParticipant.Add',
    ],
    UPDATE_RESPONSE: [
      'Meetings.Participants.UpdateResponse',
      'Meeting.Participants.UpdateResponse',
      'MeetingParticipant.UpdateResponse',
    ],
    LIST: [
      'Meetings.Participants.List',
      'Meeting.Participants.List',
      'MeetingParticipant.List',
    ],
    REMOVE: [
      'Meetings.Participants.Remove',
      'Meeting.Participants.Remove',
      'MeetingParticipant.Remove',
    ],
  },
} as const;

const unique = (permissionKeys: readonly string[]): string[] =>
  Array.from(new Set(permissionKeys));

export const MEETING_ROUTE_PERMISSION_KEYS = {
  HOME: unique([
    ...MEETING_PERMISSION_KEYS.LIST,
    ...MEETING_PERMISSION_KEYS.VIEW,
    ...MEETING_PERMISSION_KEYS.CREATE,
    ...MEETING_PERMISSION_KEYS.UPDATE,
    ...MEETING_PERMISSION_KEYS.DELETE,
    ...MEETING_PERMISSION_KEYS.CANCEL,
    ...MEETING_PERMISSION_KEYS.PARTICIPANTS.ADD,
    ...MEETING_PERMISSION_KEYS.PARTICIPANTS.UPDATE_RESPONSE,
    ...MEETING_PERMISSION_KEYS.PARTICIPANTS.LIST,
    ...MEETING_PERMISSION_KEYS.PARTICIPANTS.REMOVE,
  ]),
  LIST: unique([
    ...MEETING_PERMISSION_KEYS.LIST,
    ...MEETING_PERMISSION_KEYS.VIEW,
  ]),
  CREATE: unique([...MEETING_PERMISSION_KEYS.CREATE]),
  DETAILS: unique([
    ...MEETING_PERMISSION_KEYS.LIST,
    ...MEETING_PERMISSION_KEYS.VIEW,
  ]),
  EXTERNAL_INVITES: unique([
    ...MEETING_PERMISSION_KEYS.CREATE,
    ...MEETING_PERMISSION_KEYS.UPDATE,
    ...MEETING_PERMISSION_KEYS.PARTICIPANTS.ADD,
  ]),
} as const;

export type MeetingPermissionAction = keyof typeof MEETING_PERMISSION_KEYS;
