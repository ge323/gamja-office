export type MissionType =
  | "copy"
  | "document"
  | "wire";

export type Mission = {
  id: string;

  type: MissionType;

  title: string;

  room: string;

  x: number;
  y: number;

  completed: boolean;
};

export const INITIAL_MISSIONS: Mission[] = [
  {
    id: "copy-01",

    type: "copy",

    title: "회의자료 복사",

    room: "복사실",

    // 나중에 실제 복사기 위치에 맞게 수정
    x: 350,
    y: 1050,

    completed: false,
  },

  {
    id: "document-01",

    type: "document",

    title: "문서 분류",

    room: "자료실",

    x: 350,
    y: 350,

    completed: false,
  },

  {
    id: "wire-01",

    type: "wire",

    title: "회선 연결",

    room: "전력실",

    x: 1100,
    y: 350,

    completed: false,
  },
];