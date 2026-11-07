import type { FieldDefinition, FieldKey } from "./types";

export const MAX_FILE_SIZE = 10 * 1024 * 1024;
export const ERROR_PREVIEW_LIMIT = 8;
export const BUG_PREVIEW_LIMIT = 10;

export const FIELDS: FieldDefinition[] = [
  {
    key: "number",
    label: "מספר תקלה/משימה",
    description: "מזהה ייחודי של התקלה/המשימה",
    aliases: [
      "מספר תקלה/משימה",
      "מספר תקלה",
      "מספר משימה",
      "מספר באג",
      "Bug Number",
      "Issue Number",
    ],

  },
  {
    key: "name",
    label: "שם תקלה/משימה",
    description: "תיאור התקלה",
     aliases: [
      "שם תקלה/משימה",
      "שם תקלה",
      "שם משימה",
      "שם הבאג",
      "Bug Name",
      "Issue Name",
    ],
  },
  {
    key: "team",
    label: "צוות אחראי",
    description: "הצוות האחראי",
    aliases: [
      "צוות", "צוות אחראי", "שם צוות", "team",
      "assigned team", "responsible team", "group",
    ],
  },
  {
    key: "openDate",
    label: "תאריך פתיחה",
    description: "מועד פתיחת הבאג",
    aliases: [
      "תאריך פתיחה", "תאריך יצירה", "תאריך",
      "open date", "created date", "creation date",
      "date created", "created at",
    ],
  },
  {
    key: "status",
    label: "סטטוס",
    description: "מצב הטיפול בבאג",
    aliases: [
      "סטטוס", "מצב", "מצב טיפול", "status",
      "state", "bug status", "current status",
    ],
  },
];

export const EMPTY_MAPPING: Record<FieldKey, number | null> = {
  number: null,
  name: null,
  team: null,
  openDate: null,
  status: null,
};
