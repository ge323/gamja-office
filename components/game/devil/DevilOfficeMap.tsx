"use client";

export const DEVIL_MAP_WIDTH = 2200;
export const DEVIL_MAP_HEIGHT = 1400;

type RoomProps = {
  name: string;
  left: number;
  top: number;
  width: number;
  height: number;
  color: string;
};

export default function DevilOfficeMap() {
  return (
    <div
      className="absolute left-0 top-0 bg-[#ded3bc]"
      style={{
        width: DEVIL_MAP_WIDTH,
        height: DEVIL_MAP_HEIGHT,

        backgroundImage: `
          linear-gradient(
            to right,
            rgba(70, 60, 45, 0.12) 1px,
            transparent 1px
          ),
          linear-gradient(
            to bottom,
            rgba(70, 60, 45, 0.12) 1px,
            transparent 1px
          )
        `,

        backgroundSize: "32px 32px",
      }}
    >
      {/* ================================
          복도
      ================================= */}

      <div
        className="
          absolute
          border-[6px]
          border-zinc-700
          bg-[#c2b8a5]
        "
        style={{
          left: 550,
          top: 540,
          width: 1100,
          height: 250,
        }}
      />

      <div
        className="
          absolute
          border-[6px]
          border-zinc-700
          bg-[#c2b8a5]
        "
        style={{
          left: 975,
          top: 250,
          width: 250,
          height: 900,
        }}
      />

      {/* ================================
          방
      ================================= */}

      <Room
        name="⚡ 전력실"
        left={80}
        top={100}
        width={480}
        height={300}
        color="#a99b79"
      />

      <Room
        name="🛋 휴게실"
        left={760}
        top={70}
        width={680}
        height={330}
        color="#91a886"
      />

      <Room
        name="📹 CCTV실"
        left={1640}
        top={100}
        width={480}
        height={300}
        color="#76838a"
      />

      <Room
        name="📁 자료실"
        left={80}
        top={500}
        width={520}
        height={360}
        color="#b49b7c"
      />

      <Room
        name="💻 중앙 사무실"
        left={700}
        top={460}
        width={800}
        height={430}
        color="#e3cda8"
      />

      <Room
        name="☕ 탕비실"
        left={1600}
        top={500}
        width={520}
        height={360}
        color="#add0d8"
      />

      <Room
        name="🖨 복사실"
        left={80}
        top={960}
        width={520}
        height={330}
        color="#c7c8c5"
      />

      <Room
        name="🪑 회의실"
        left={760}
        top={1000}
        width={680}
        height={330}
        color="#8c9aaa"
      />

      <Room
        name="🖥 서버실"
        left={1600}
        top={960}
        width={520}
        height={330}
        color="#718495"
      />

      {/* ================================
          중앙 사무실 책상
      ================================= */}

      <Desk
        left={820}
        top={590}
      />

      <Desk
        left={1120}
        top={590}
      />

      <Desk
        left={820}
        top={745}
      />

      <Desk
        left={1120}
        top={745}
      />

      {/* ================================
          회의실 테이블
      ================================= */}

      <div
        className="
          absolute
          z-20
          rounded-xl
          border-[6px]
          border-[#60432b]
          bg-[#98673e]
        "
        style={{
          left: 900,
          top: 1120,
          width: 400,
          height: 100,
        }}
      />

      {/* ================================
          서버 랙
      ================================= */}

      {Array.from({
        length: 4,
      }).map((_, index) => (
        <div
          key={index}
          className="
            absolute
            z-20
            border-[5px]
            border-zinc-900
            bg-zinc-700
          "
          style={{
            left: 1660 + index * 105,
            top: 1070,
            width: 70,
            height: 150,
          }}
        >
          <div className="mx-auto mt-5 h-[5px] w-[35px] bg-emerald-400" />

          <div className="mx-auto mt-4 h-[5px] w-[35px] bg-amber-300" />
        </div>
      ))}

      {/* ================================
          시작 위치 표시
      ================================= */}

      <div
        className="
          absolute
          z-30
          flex
          h-[100px]
          w-[100px]
          items-center
          justify-center
          rounded-full
          border-[4px]
          border-dashed
          border-zinc-500/50
          text-[11px]
          font-bold
          text-zinc-500
        "
        style={{
          left: 1050,
          top: 650,
        }}
      >
        START
      </div>
    </div>
  );
}

function Room({
  name,
  left,
  top,
  width,
  height,
  color,
}: RoomProps) {
  return (
    <div
      className="
        absolute
        z-10
        rounded-xl
        border-[8px]
        border-zinc-800
      "
      style={{
        left,
        top,
        width,
        height,
        backgroundColor: color,
      }}
    >
      <div
        className="
          absolute
          left-5
          top-5
          rounded-lg
          border
          border-zinc-300
          bg-white/90
          px-4
          py-2
          text-[14px]
          font-bold
          text-zinc-800
          shadow
        "
      >
        {name}
      </div>
    </div>
  );
}

function Desk({
  left,
  top,
}: {
  left: number;
  top: number;
}) {
  return (
    <div
      className="
        absolute
        z-20
        border-[5px]
        border-[#65462d]
        bg-[#b78352]
      "
      style={{
        left,
        top,
        width: 210,
        height: 85,
      }}
    >
      <div
        className="
          absolute
          left-[25px]
          top-[15px]
          h-[35px]
          w-[60px]
          border-[4px]
          border-zinc-700
          bg-zinc-300
        "
      />

      <div
        className="
          absolute
          right-[25px]
          top-[15px]
          h-[35px]
          w-[60px]
          border-[4px]
          border-zinc-700
          bg-zinc-300
        "
      />
    </div>
  );
}