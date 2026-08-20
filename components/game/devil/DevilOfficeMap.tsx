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
   이동 가능한 공간

   핵심:
   - 방 내부
   - 복도
   - 문
   만 이동 가능
========================================================= */

export const WALKABLE_AREAS:
  WalkableRect[] = [
  /* =====================================================
     중앙 복도
  ===================================================== */

  {
    id: "hall-horizontal",
    x: 500,
    y: 610,
    width: 1200,
    height: 180,
  },

  {
    id: "hall-vertical",
    x: 1010,
    y: 300,
    width: 180,
    height: 800,
  },

  /* =====================================================
     전력실
  ===================================================== */

  {
    id: "room-power",
    x: 100,
    y: 100,
    width: 460,
    height: 280,
  },

  /* =====================================================
     휴게실
  ===================================================== */

  {
    id: "room-lounge",
    x: 780,
    y: 80,
    width: 640,
    height: 300,
  },

  /* =====================================================
     CCTV
  ===================================================== */

  {
    id: "room-cctv",
    x: 1660,
    y: 100,
    width: 440,
    height: 280,
  },

  /* =====================================================
     자료실
  ===================================================== */

  {
    id: "room-archive",
    x: 100,
    y: 520,
    width: 480,
    height: 320,
  },

  /* =====================================================
     중앙 사무실
  ===================================================== */

  {
    id: "room-main",
    x: 720,
    y: 480,
    width: 760,
    height: 390,
  },

  /* =====================================================
     탕비실
  ===================================================== */

  {
    id: "room-pantry",
    x: 1620,
    y: 520,
    width: 480,
    height: 320,
  },

  /* =====================================================
     복사실
  ===================================================== */

  {
    id: "room-copy",
    x: 100,
    y: 980,
    width: 480,
    height: 290,
  },

  /* =====================================================
     회의실
  ===================================================== */

  {
    id: "room-meeting",
    x: 780,
    y: 1020,
    width: 640,
    height: 290,
  },

  /* =====================================================
     서버실
  ===================================================== */

  {
    id: "room-server",
    x: 1620,
    y: 980,
    width: 480,
    height: 290,
  },
];

/* =========================================================
   문 영역

   방과 복도를 연결하는 좁은 통로
========================================================= */

export const DOOR_AREAS:
  WalkableRect[] = [
  /* 전력실 */

  {
    id: "door-power",
    x: 280,
    y: 370,
    width: 100,
    height: 170,
  },

  /* 휴게실 */

  {
    id: "door-lounge",
    x: 1040,
    y: 360,
    width: 120,
    height: 140,
  },

  /* CCTV */

  {
    id: "door-cctv",
    x: 1820,
    y: 370,
    width: 100,
    height: 170,
  },

  /* 자료실 */

  {
    id: "door-archive",
    x: 560,
    y: 630,
    width: 120,
    height: 100,
  },

  /* 중앙 사무실 왼쪽 */

  {
    id: "door-main-left",
    x: 660,
    y: 640,
    width: 100,
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
    y: 830,
    width: 120,
    height: 150,
  },

  /* 탕비실 */

  {
    id: "door-pantry",
    x: 1520,
    y: 630,
    width: 120,
    height: 100,
  },

  /* 복사실 */

  {
    id: "door-copy",
    x: 280,
    y: 900,
    width: 100,
    height: 100,
  },

  /* 회의실 */

  {
    id: "door-meeting",
    x: 1040,
    y: 940,
    width: 120,
    height: 100,
  },

  /* 서버실 */

  {
    id: "door-server",
    x: 1820,
    y: 900,
    width: 100,
    height: 100,
  },
];

/* =========================================================
   Map
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
        width:
          DEVIL_MAP_WIDTH,

        height:
          DEVIL_MAP_HEIGHT,
      }}
    >
      {/* =========================================
          이동 불가능 영역 배경
      ========================================= */}

      <div
        className="
          absolute
          inset-0
          bg-[#3d3936]
        "
      />

      {/* =========================================
          복도
      ========================================= */}

      <Floor
        x={500}
        y={610}
        width={1200}
        height={180}
        color="#bdb2a0"
      />

      <Floor
        x={1010}
        y={300}
        width={180}
        height={800}
        color="#bdb2a0"
      />

      {/* =========================================
          방
      ========================================= */}

      <Room
        name="전력실"
        x={80}
        y={80}
        width={500}
        height={320}
        color="#9f9375"
        door="bottom"
      />

      <Room
        name="휴게실"
        x={760}
        y={60}
        width={680}
        height={340}
        color="#91a587"
        door="bottom"
      />

      <Room
        name="CCTV실"
        x={1640}
        y={80}
        width={480}
        height={320}
        color="#77868d"
        door="bottom"
      />

      <Room
        name="자료실"
        x={80}
        y={500}
        width={520}
        height={360}
        color="#b29a7d"
        door="right"
      />

      <Room
        name="중앙 사무실"
        x={700}
        y={460}
        width={800}
        height={430}
        color="#e1cba7"
        door="multi"
      />

      <Room
        name="탕비실"
        x={1600}
        y={500}
        width={520}
        height={360}
        color="#afd3dc"
        door="left"
      />

      <Room
        name="복사실"
        x={80}
        y={960}
        width={520}
        height={330}
        color="#c8c8c4"
        door="top"
      />

      <Room
        name="회의실"
        x={760}
        y={1000}
        width={680}
        height={330}
        color="#8c9aa8"
        door="top"
      />

      <Room
        name="서버실"
        x={1600}
        y={960}
        width={520}
        height={330}
        color="#718392"
        door="top"
      />

      {/* =========================================
          문 연결 통로
      ========================================= */}

      {DOOR_AREAS.map(
        door => (
          <div
            key={
              door.id
            }
            className="
              absolute
              z-[8]
              bg-[#bdb2a0]
            "
            style={{
              left:
                door.x,

              top:
                door.y,

              width:
                door.width,

              height:
                door.height,
            }}
          />
        )
      )}

      {/* =========================================
          중앙 사무실
      ========================================= */}

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

      {/* =========================================
          탕비실
      ========================================= */}

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

      {/* =========================================
          자료실
      ========================================= */}

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

      {/* =========================================
          복사실
      ========================================= */}

      <ObjectBox
        label="복사기"
        x={240}
        y={1050}
        width={160}
        height={140}
        color="#d1d3d6"
      />

      {/* =========================================
          회의실
      ========================================= */}

      <ObjectBox
        label="회의 테이블"
        x={900}
        y={1110}
        width={390}
        height={100}
        color="#9a663d"
      />

      {/* =========================================
          서버실
      ========================================= */}

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

      {/* =========================================
          CCTV
      ========================================= */}

      <ObjectBox
        label="MONITOR"
        x={1740}
        y={160}
        width={250}
        height={110}
        color="#313b41"
      />

      {/* =========================================
          전력실
      ========================================= */}

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

function Room({
  name,
  x,
  y,
  width,
  height,
  color,
  door,
}: {
  name: string;

  x: number;
  y: number;

  width: number;
  height: number;

  color: string;

  door:
    | "top"
    | "bottom"
    | "left"
    | "right"
    | "multi";
}) {
  return (
    <>
      {/* =====================================
          방 바닥
      ===================================== */}

      <div
        className="
          absolute
          z-[5]
        "
        style={{
          left:
            x,

          top:
            y,

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
            bg-white/80
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

      {/* =====================================
          벽
      ===================================== */}

      <RoomWalls
        x={x}
        y={y}
        width={width}
        height={height}
        door={door}
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
  door,
}: {
  x: number;
  y: number;
  width: number;
  height: number;

  door:
    | "top"
    | "bottom"
    | "left"
    | "right"
    | "multi";
}) {
  const wall = 18;

  const doorWidth =
    120;

  const centerX =
    x +
    width / 2;

  const centerY =
    y +
    height / 2;

  return (
    <>
      {/* =====================================
          TOP
      ===================================== */}

      {door === "top" ||
      door === "multi" ? (
        <>
          <Wall
            x={x}
            y={y}
            width={
              width / 2 -
              doorWidth / 2
            }
            height={wall}
          />

          <Wall
            x={
              centerX +
              doorWidth / 2
            }
            y={y}
            width={
              width / 2 -
              doorWidth / 2
            }
            height={wall}
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

      {/* =====================================
          BOTTOM
      ===================================== */}

      {door === "bottom" ||
      door === "multi" ? (
        <>
          <Wall
            x={x}
            y={
              y +
              height -
              wall
            }
            width={
              width / 2 -
              doorWidth / 2
            }
            height={wall}
          />

          <Wall
            x={
              centerX +
              doorWidth / 2
            }
            y={
              y +
              height -
              wall
            }
            width={
              width / 2 -
              doorWidth / 2
            }
            height={wall}
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

      {/* =====================================
          LEFT
      ===================================== */}

      {door === "left" ||
      door === "multi" ? (
        <>
          <Wall
            x={x}
            y={y}
            width={wall}
            height={
              height / 2 -
              doorWidth / 2
            }
          />

          <Wall
            x={x}
            y={
              centerY +
              doorWidth / 2
            }
            width={wall}
            height={
              height / 2 -
              doorWidth / 2
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

      {/* =====================================
          RIGHT
      ===================================== */}

      {door === "right" ||
      door === "multi" ? (
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
              height / 2 -
              doorWidth / 2
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
              doorWidth / 2
            }
            width={wall}
            height={
              height / 2 -
              doorWidth / 2
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
        absolute
        z-[30]
        bg-zinc-800
      "
      style={{
        left:
          x,

        top:
          y,

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
        absolute
        z-[4]
      "
      style={{
        left:
          x,

        top:
          y,

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
        absolute
        z-[20]
        border-[5px]
        border-[#5e422e]
        bg-[#b98755]
      "
      style={{
        left:
          x,

        top:
          y,

        width:
          210,

        height:
          85,
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
        absolute
        z-[20]
        border-[5px]
        border-[#574535]
        bg-[#7f654f]
      "
      style={{
        left:
          x,

        top:
          y,

        width:
          80,

        height:
          190,
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
        left:
          x,

        top:
          y,

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
        absolute
        z-[20]
        border-[5px]
        border-zinc-950
        bg-zinc-700
      "
      style={{
        left:
          x,

        top:
          y,

        width:
          80,

        height:
          170,
      }}
    >
      <div className="mx-auto mt-5 h-[5px] w-[38px] bg-emerald-400" />

      <div className="mx-auto mt-4 h-[5px] w-[38px] bg-amber-300" />

      <div className="mx-auto mt-4 h-[5px] w-[38px] bg-red-400" />
    </div>
  );
}