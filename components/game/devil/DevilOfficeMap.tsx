"use client";

/* =========================================================
   Map Size
========================================================= */

export const DEVIL_MAP_WIDTH = 2200;
export const DEVIL_MAP_HEIGHT = 1400;

/* =========================================================
   Types
========================================================= */

export type WalkableRect = {
  id: string;

  x: number;
  y: number;

  width: number;
  height: number;
};

/* =========================================================
   Hall Areas

   화면에 보이는 복도와
   실제 이동 가능한 복도의 좌표를 동일하게 관리한다.
========================================================= */

const HALL_AREAS: WalkableRect[] = [
  /* 중앙 가로 복도 */

  {
    id: "hall-horizontal",
    x: 500,
    y: 610,
    width: 1200,
    height: 180,
  },

  /* 중앙 세로 복도 */

  {
    id: "hall-vertical",
    x: 1010,
    y: 300,
    width: 180,
    height: 800,
  },

  /* 복사실 방향 가로 복도 */

  {
    id: "hall-copy-horizontal",
    x: 260,
    y: 700,
    width: 260,
    height: 90,
  },

  /* 복사실 방향 세로 복도 */

  {
    id: "hall-copy-vertical",
    x: 260,
    y: 700,
    width: 140,
    height: 260,
  },

  /* 서버실 방향 가로 복도 */

  {
    id: "hall-server-horizontal",
    x: 1680,
    y: 700,
    width: 260,
    height: 90,
  },

  /* 서버실 방향 세로 복도 */

  {
    id: "hall-server-vertical",
    x: 1800,
    y: 700,
    width: 140,
    height: 260,
  },
];

/* =========================================================
   Room Areas
========================================================= */

const ROOM_AREAS: WalkableRect[] = [
  {
    id: "room-power",
    x: 98,
    y: 98,
    width: 464,
    height: 284,
  },

  {
    id: "room-lounge",
    x: 778,
    y: 78,
    width: 644,
    height: 304,
  },

  {
    id: "room-cctv",
    x: 1658,
    y: 98,
    width: 444,
    height: 284,
  },

  {
    id: "room-archive",
    x: 98,
    y: 518,
    width: 484,
    height: 324,
  },

  {
    id: "room-main",
    x: 718,
    y: 478,
    width: 764,
    height: 394,
  },

  {
    id: "room-pantry",
    x: 1618,
    y: 518,
    width: 484,
    height: 324,
  },

  {
    id: "room-copy",
    x: 98,
    y: 978,
    width: 484,
    height: 294,
  },

  {
    id: "room-meeting",
    x: 778,
    y: 1018,
    width: 644,
    height: 294,
  },

  {
    id: "room-server",
    x: 1618,
    y: 978,
    width: 484,
    height: 294,
  },
];

/* =========================================================
   Walkable Areas

   DevilGameWorld에서 사용하는 이동 가능 영역.
========================================================= */

export const WALKABLE_AREAS: WalkableRect[] = [
  ...HALL_AREAS,
  ...ROOM_AREAS,
];

/* =========================================================
   Door Areas

   방과 복도를 실제로 연결하는 영역.

   중요:
   화면에 그리는 문과 이동 판정 좌표를
   반드시 동일하게 유지한다.
========================================================= */

export const DOOR_AREAS: WalkableRect[] = [
  /* 전력실 */

  {
    id: "door-power",
    x: 280,
    y: 365,
    width: 100,
    height: 175,
  },

  /* 휴게실 */

  {
    id: "door-lounge",
    x: 1040,
    y: 360,
    width: 120,
    height: 130,
  },

  /* CCTV */

  {
    id: "door-cctv",
    x: 1820,
    y: 365,
    width: 100,
    height: 175,
  },

  /* 자료실 */

  {
    id: "door-archive",
    x: 560,
    y: 640,
    width: 130,
    height: 100,
  },

  /* 중앙 사무실 왼쪽 */

  {
    id: "door-main-left",
    x: 665,
    y: 640,
    width: 95,
    height: 100,
  },

  /* 중앙 사무실 오른쪽 */

  {
    id: "door-main-right",
    x: 1440,
    y: 640,
    width: 100,
    height: 100,
  },

  /* 중앙 사무실 위 */

  {
    id: "door-main-top",
    x: 1040,
    y: 420,
    width: 120,
    height: 100,
  },

  /* 중앙 사무실 아래 */

  {
    id: "door-main-bottom",
    x: 1040,
    y: 850,
    width: 120,
    height: 140,
  },

  /* 탕비실 */

  {
    id: "door-pantry",
    x: 1510,
    y: 640,
    width: 130,
    height: 100,
  },

  /* =====================================================
     복사실

     세로 복도:
     y = 700 ~ 960

     복사실:
     y = 960 ~

     문 영역이 둘 사이를 겹쳐 연결한다.
  ===================================================== */

  {
    id: "door-copy",
    x: 280,
    y: 930,
    width: 120,
    height: 80,
  },

  /* 회의실 */

  {
    id: "door-meeting",
    x: 1040,
    y: 940,
    width: 120,
    height: 100,
  },

  /* =====================================================
     서버실

     복사실과 동일하게 y = 930으로 통일.
  ===================================================== */

  {
    id: "door-server",
    x: 1810,
    y: 930,
    width: 120,
    height: 80,
  },
];

/* =========================================================
   DevilOfficeMap
========================================================= */

export default function DevilOfficeMap() {
  return (
    <div
      className="
        absolute
        left-0
        top-0
        overflow-hidden
        bg-[#383532]
      "
      style={{
        width: DEVIL_MAP_WIDTH,
        height: DEVIL_MAP_HEIGHT,
      }}
    >
      {/* =================================================
          Background
      ================================================= */}

      <div
        className="
          absolute
          inset-0
          bg-[#3d3936]
        "
      />

      {/* =================================================
          Halls

          HALL_AREAS 좌표를 그대로 사용해서
          화면과 이동 판정이 어긋나지 않게 한다.
      ================================================= */}

      {HALL_AREAS.map((hall) => (
        <Floor
          key={hall.id}
          x={hall.x}
          y={hall.y}
          width={hall.width}
          height={hall.height}
          color="#c5baa7"
        />
      ))}

      {/* =================================================
          Door Floors

          복도/방 사이의 연결 부분.
      ================================================= */}

      {DOOR_AREAS.map((door) => (
        <Floor
          key={`floor-${door.id}`}
          x={door.x}
          y={door.y}
          width={door.width}
          height={door.height}
          color="#c5baa7"
        />
      ))}

      {/* =================================================
          Rooms
      ================================================= */}

      <Room
        name="전력실"
        x={80}
        y={80}
        width={500}
        height={320}
        color="#9f9375"
        doors={[
          "bottom",
        ]}
      />

      <Room
        name="휴게실"
        x={760}
        y={60}
        width={680}
        height={340}
        color="#91a587"
        doors={[
          "bottom",
        ]}
      />

      <Room
        name="CCTV"
        x={1640}
        y={80}
        width={480}
        height={320}
        color="#77868d"
        doors={[
          "bottom",
        ]}
      />

      <Room
        name="자료실"
        x={80}
        y={500}
        width={520}
        height={360}
        color="#b29a7d"
        doors={[
          "right",
        ]}
      />

      <Room
        name="중앙 사무실"
        x={700}
        y={460}
        width={800}
        height={430}
        color="#e1cba7"
        doors={[
          "top",
          "bottom",
          "left",
          "right",
        ]}
      />

      <Room
        name="탕비실"
        x={1600}
        y={500}
        width={520}
        height={360}
        color="#afd3dc"
        doors={[
          "left",
        ]}
      />

      {/* =================================================
          복사실

          위쪽 중앙에 문이 있다.
      ================================================= */}

      <Room
        name="복사실"
        x={80}
        y={960}
        width={520}
        height={330}
        color="#c8c8c4"
        doors={[
          "top",
        ]}
      />

      <Room
        name="회의실"
        x={760}
        y={1000}
        width={680}
        height={330}
        color="#8c9aa8"
        doors={[
          "top",
        ]}
      />

      <Room
        name="서버실"
        x={1600}
        y={960}
        width={520}
        height={330}
        color="#718392"
        doors={[
          "top",
        ]}
      />

      {/* =================================================
          Central Office Desks
      ================================================= */}

      <Desk
        x={820}
        y={580}
      />

      <Desk
        x={1130}
        y={580}
      />

      <Desk
        x={820}
        y={730}
      />

      <Desk
        x={1130}
        y={730}
      />

      {/* =================================================
          Pantry
      ================================================= */}

      <ObjectBox
        label="냉장고"
        x={1660}
        y={560}
        width={90}
        height={120}
        color="#d7d9dc"
      />

      <ObjectBox
        label="☕"
        x={1960}
        y={560}
        width={80}
        height={80}
        color="#80604a"
      />

      <ObjectBox
        label="싱크대"
        x={1770}
        y={740}
        width={230}
        height={60}
        color="#9dbbc0"
      />

      {/* =================================================
          Archive
      ================================================= */}

      <Shelf
        x={150}
        y={570}
      />

      <Shelf
        x={270}
        y={570}
      />

      <Shelf
        x={390}
        y={570}
      />

      {/* =================================================
          Copy Room

          입구 바로 앞은 비워두고
          복사기는 방 안쪽에 둔다.
      ================================================= */}

      <ObjectBox
        label="🖨 복사기"
        x={250}
        y={1080}
        width={160}
        height={120}
        color="#d1d3d6"
      />

      {/* =================================================
          Meeting Room
      ================================================= */}

      <ObjectBox
        label="회의 테이블"
        x={900}
        y={1110}
        width={390}
        height={100}
        color="#9a663d"
      />

      {/* =================================================
          Server Room
      ================================================= */}

      <ServerRack
        x={1660}
        y={1040}
      />

      <ServerRack
        x={1770}
        y={1040}
      />

      <ServerRack
        x={1880}
        y={1040}
      />

      <ServerRack
        x={1990}
        y={1040}
      />

      {/* =================================================
          CCTV
      ================================================= */}

      <ObjectBox
        label="MONITOR"
        x={1740}
        y={160}
        width={250}
        height={110}
        color="#313b41"
      />

      {/* =================================================
          Power Room
      ================================================= */}

      <ObjectBox
        label="⚡ PANEL"
        x={210}
        y={160}
        width={240}
        height={110}
        color="#d7bb68"
      />
    </div>
  );
}

/* =========================================================
   Room
========================================================= */

type DoorDirection =
  | "top"
  | "bottom"
  | "left"
  | "right";

function Room({
  name,
  x,
  y,
  width,
  height,
  color,
  doors,
}: {
  name: string;

  x: number;
  y: number;

  width: number;
  height: number;

  color: string;

  doors: DoorDirection[];
}) {
  return (
    <>
      {/* Room Floor */}

      <div
        className="
          absolute
          z-[5]
        "
        style={{
          left: x,
          top: y,

          width,
          height,

          backgroundColor:
            color,
        }}
      >
        <div
          className="
            absolute
            left-5
            top-5
            z-[20]
            rounded-md
            bg-white/85
            px-3
            py-2
            text-[12px]
            font-bold
            text-zinc-700
          "
        >
          {name}
        </div>
      </div>

      {/* Walls */}

      <RoomWalls
        x={x}
        y={y}
        width={width}
        height={height}
        doors={doors}
      />
    </>
  );
}

/* =========================================================
   Room Walls
========================================================= */

function RoomWalls({
  x,
  y,
  width,
  height,
  doors,
}: {
  x: number;
  y: number;

  width: number;
  height: number;

  doors: DoorDirection[];
}) {
  const wall = 18;

  const horizontalDoorWidth =
    120;

  const verticalDoorHeight =
    100;

  const hasTopDoor =
    doors.includes("top");

  const hasBottomDoor =
    doors.includes("bottom");

  const hasLeftDoor =
    doors.includes("left");

  const hasRightDoor =
    doors.includes("right");

  const centerX =
    x +
    width / 2;

  const centerY =
    y +
    height / 2;

  const horizontalSegment =
    width / 2 -
    horizontalDoorWidth / 2;

  const verticalSegment =
    height / 2 -
    verticalDoorHeight / 2;

  return (
    <>
      {/* =================================================
          Top
      ================================================= */}

      {hasTopDoor ? (
        <>
          <Wall
            x={x}
            y={y}
            width={
              horizontalSegment
            }
            height={wall}
          />

          <Wall
            x={
              centerX +
              horizontalDoorWidth / 2
            }
            y={y}
            width={
              horizontalSegment
            }
            height={wall}
          />

          <DoorThreshold
            x={
              centerX -
              horizontalDoorWidth / 2
            }
            y={y - 3}
            width={
              horizontalDoorWidth
            }
            height={7}
          />
        </>
      ) : (
        <Wall
          x={x}
          y={y}
          width={width}
          height={wall}
        />
      )}

      {/* =================================================
          Bottom
      ================================================= */}

      {hasBottomDoor ? (
        <>
          <Wall
            x={x}
            y={
              y +
              height -
              wall
            }
            width={
              horizontalSegment
            }
            height={wall}
          />

          <Wall
            x={
              centerX +
              horizontalDoorWidth / 2
            }
            y={
              y +
              height -
              wall
            }
            width={
              horizontalSegment
            }
            height={wall}
          />

          <DoorThreshold
            x={
              centerX -
              horizontalDoorWidth / 2
            }
            y={
              y +
              height -
              4
            }
            width={
              horizontalDoorWidth
            }
            height={7}
          />
        </>
      ) : (
        <Wall
          x={x}
          y={
            y +
            height -
            wall
          }
          width={width}
          height={wall}
        />
      )}

      {/* =================================================
          Left
      ================================================= */}

      {hasLeftDoor ? (
        <>
          <Wall
            x={x}
            y={y}
            width={wall}
            height={
              verticalSegment
            }
          />

          <Wall
            x={x}
            y={
              centerY +
              verticalDoorHeight / 2
            }
            width={wall}
            height={
              verticalSegment
            }
          />

          <DoorThreshold
            x={x - 3}
            y={
              centerY -
              verticalDoorHeight / 2
            }
            width={7}
            height={
              verticalDoorHeight
            }
          />
        </>
      ) : (
        <Wall
          x={x}
          y={y}
          width={wall}
          height={height}
        />
      )}

      {/* =================================================
          Right
      ================================================= */}

      {hasRightDoor ? (
        <>
          <Wall
            x={
              x +
              width -
              wall
            }
            y={y}
            width={wall}
            height={
              verticalSegment
            }
          />

          <Wall
            x={
              x +
              width -
              wall
            }
            y={
              centerY +
              verticalDoorHeight / 2
            }
            width={wall}
            height={
              verticalSegment
            }
          />

          <DoorThreshold
            x={
              x +
              width -
              4
            }
            y={
              centerY -
              verticalDoorHeight / 2
            }
            width={7}
            height={
              verticalDoorHeight
            }
          />
        </>
      ) : (
        <Wall
          x={
            x +
            width -
            wall
          }
          y={y}
          width={wall}
          height={height}
        />
      )}
    </>
  );
}

/* =========================================================
   Wall
========================================================= */

function Wall({
  x,
  y,
  width,
  height,
}: {
  x: number;
  y: number;

  width: number;
  height: number;
}) {
  return (
    <div
      className="
        pointer-events-none
        absolute
        z-[30]
        bg-zinc-800
        shadow-[0_3px_0_rgba(0,0,0,0.2)]
      "
      style={{
        left: x,
        top: y,

        width,
        height,
      }}
    />
  );
}

/* =========================================================
   Door Threshold
========================================================= */

function DoorThreshold({
  x,
  y,
  width,
  height,
}: {
  x: number;
  y: number;

  width: number;
  height: number;
}) {
  return (
    <div
      className="
        pointer-events-none
        absolute
        z-[31]
        bg-emerald-200/45
      "
      style={{
        left: x,
        top: y,

        width,
        height,
      }}
    />
  );
}

/* =========================================================
   Floor
========================================================= */

function Floor({
  x,
  y,
  width,
  height,
  color,
}: {
  x: number;
  y: number;

  width: number;
  height: number;

  color: string;
}) {
  return (
    <div
      className="
        pointer-events-none
        absolute
        z-[4]
      "
      style={{
        left: x,
        top: y,

        width,
        height,

        backgroundColor:
          color,
      }}
    />
  );
}

/* =========================================================
   Desk
========================================================= */

function Desk({
  x,
  y,
}: {
  x: number;
  y: number;
}) {
  return (
    <div
      className="
        pointer-events-none
        absolute
        z-[20]
        border-[5px]
        border-[#5e422e]
        bg-[#b98755]
      "
      style={{
        left: x,
        top: y,

        width: 210,
        height: 85,
      }}
    />
  );
}

/* =========================================================
   Shelf
========================================================= */

function Shelf({
  x,
  y,
}: {
  x: number;
  y: number;
}) {
  return (
    <div
      className="
        pointer-events-none
        absolute
        z-[20]
        border-[5px]
        border-[#574535]
        bg-[#7f654f]
      "
      style={{
        left: x,
        top: y,

        width: 80,
        height: 190,
      }}
    />
  );
}

/* =========================================================
   Object
========================================================= */

function ObjectBox({
  label,
  x,
  y,
  width,
  height,
  color,
}: {
  label: string;

  x: number;
  y: number;

  width: number;
  height: number;

  color: string;
}) {
  return (
    <div
      className="
        pointer-events-none
        absolute
        z-[20]
        flex
        items-center
        justify-center
        border-[5px]
        border-zinc-700
        text-[10px]
        font-bold
        text-zinc-700
      "
      style={{
        left: x,
        top: y,

        width,
        height,

        backgroundColor:
          color,
      }}
    >
      {label}
    </div>
  );
}

/* =========================================================
   Server Rack
========================================================= */

function ServerRack({
  x,
  y,
}: {
  x: number;
  y: number;
}) {
  return (
    <div
      className="
        pointer-events-none
        absolute
        z-[20]
        border-[5px]
        border-zinc-950
        bg-zinc-700
      "
      style={{
        left: x,
        top: y,

        width: 80,
        height: 170,
      }}
    >
      <div
        className="
          mx-auto
          mt-5
          h-[5px]
          w-[38px]
          bg-emerald-400
        "
      />

      <div
        className="
          mx-auto
          mt-4
          h-[5px]
          w-[38px]
          bg-amber-300
        "
      />

      <div
        className="
          mx-auto
          mt-4
          h-[5px]
          w-[38px]
          bg-red-400
        "
      />
    </div>
  );
}