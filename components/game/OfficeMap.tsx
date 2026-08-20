"use client";

export default function OfficeMap() {
  return (
    <>
      {/* =====================================================
          바닥
      ===================================================== */}

      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundColor: "#e8d8bd",
          backgroundImage: `
            linear-gradient(
              to right,
              rgba(115, 88, 58, 0.10) 1px,
              transparent 1px
            ),
            linear-gradient(
              to bottom,
              rgba(115, 88, 58, 0.10) 1px,
              transparent 1px
            )
          `,
          backgroundSize: "32px 32px",
        }}
      />

      {/* =====================================================
          위쪽 벽
      ===================================================== */}

      <div
        data-no-move
        className="
          absolute
          left-0
          right-0
          top-0
          h-[64px]
          border-b-[5px]
          border-zinc-700
          bg-[#d6d0c5]
        "
      >
        {/* 창문 */}
        <div className="absolute left-[34%] top-[12px] flex gap-1">
          <div className="h-[35px] w-[58px] border-[3px] border-zinc-700 bg-sky-100">
            <div className="h-full w-[2px] bg-white/70" />
          </div>

          <div className="h-[35px] w-[58px] border-[3px] border-zinc-700 bg-sky-100">
            <div className="h-full w-[2px] bg-white/70" />
          </div>
        </div>

        {/* 벽시계 */}
        <div
          className="
            absolute
            left-1/2
            top-[12px]
            flex
            h-[38px]
            w-[38px]
            -translate-x-1/2
            items-center
            justify-center
            rounded-full
            border-[4px]
            border-zinc-700
            bg-white
          "
        >
          <div className="absolute h-[10px] w-[2px] -translate-y-[4px] bg-zinc-700" />
          <div className="absolute h-[2px] w-[8px] translate-x-[3px] bg-zinc-700" />
        </div>
      </div>

      {/* =====================================================
          출입구
      ===================================================== */}

      <div
        data-no-move
        className="
          absolute
          left-[22px]
          top-[10px]
          z-10
          h-[50px]
          w-[48px]
          border-[4px]
          border-zinc-800
          bg-[#805c3f]
        "
      >
        <div className="absolute right-[6px] top-1/2 h-[4px] w-[4px] rounded-full bg-amber-300" />

        <div
          className="
            absolute
            -top-[23px]
            left-1/2
            -translate-x-1/2
            bg-emerald-600
            px-2
            py-0.5
            text-[8px]
            font-bold
            text-white
          "
        >
          EXIT
        </div>
      </div>

      {/* =====================================================
          공지판
      ===================================================== */}

      <div
        data-no-move
        className="
          absolute
          left-[90px]
          top-[10px]
          z-10
          h-[48px]
          w-[120px]
          border-[3px]
          border-[#715942]
          bg-[#fff8e7]
          px-2
          py-1
          text-center
        "
      >
        <div className="text-[8px] font-bold text-zinc-700">
          오늘도
        </div>

        <div className="text-[10px] font-black text-zinc-800">
          감자합니다 🥔
        </div>
      </div>

      {/* =====================================================
          상단 수납장
      ===================================================== */}

      <div
        data-no-move
        className="
          absolute
          left-[25%]
          top-[18px]
          h-[38px]
          w-[90px]
          border-[3px]
          border-zinc-700
          bg-zinc-400
        "
      >
        <div className="absolute left-1/2 top-0 h-full w-[2px] -translate-x-1/2 bg-zinc-600" />
      </div>

      {/* =====================================================
          정수기
      ===================================================== */}

      <div
        data-no-move
        className="
          absolute
          right-[270px]
          top-[11px]
          z-10
          h-[50px]
          w-[32px]
        "
      >
        <div className="mx-auto h-[21px] w-[19px] rounded-t-full border-[2px] border-blue-500 bg-sky-200" />

        <div className="mx-auto h-[29px] w-[28px] border-[3px] border-zinc-600 bg-zinc-300" />
      </div>

      {/* =====================================================
          커피 머신
      ===================================================== */}

      <div
        data-no-move
        className="
          absolute
          right-[175px]
          top-[8px]
          z-10
          h-[55px]
          w-[75px]
          border-[3px]
          border-[#5e4634]
          bg-[#8a6546]
        "
      >
        <div className="absolute -top-[17px] left-1/2 -translate-x-1/2 bg-[#8a6546] px-2 py-0.5 text-[8px] font-bold text-white">
          COFFEE
        </div>

        <div className="absolute left-[10px] top-[10px] h-[31px] w-[31px] border-[3px] border-zinc-800 bg-zinc-700">
          <div className="absolute left-[5px] top-[6px] h-[4px] w-[16px] bg-zinc-400" />
          <div className="absolute left-[9px] top-[15px] h-[8px] w-[10px] bg-zinc-950" />
        </div>

        <div className="absolute right-[8px] bottom-[8px] h-[16px] w-[17px] rounded-b-md border-[2px] border-zinc-700 bg-white" />
      </div>

      {/* =====================================================
          자판기
      ===================================================== */}

      <div
        data-no-move
        className="
          absolute
          right-[90px]
          top-[8px]
          z-10
          h-[55px]
          w-[60px]
          border-[4px]
          border-zinc-700
          bg-[#526d7e]
        "
      >
        <div className="grid grid-cols-3 gap-[2px] p-[6px]">
          {Array.from({ length: 9 }).map((_, index) => (
            <div
              key={index}
              className="h-[7px] bg-amber-300"
            />
          ))}
        </div>
      </div>

      {/* =====================================================
          화분 - 왼쪽 위
      ===================================================== */}

      <div
        data-no-move
        className="absolute left-[230px] top-[54px]"
      >
        <Plant />
      </div>

      {/* =====================================================
          화분 - 오른쪽 위
      ===================================================== */}

      <div
        data-no-move
        className="absolute right-[28px] top-[72px]"
      >
        <Plant />
      </div>

      {/* =====================================================
          업무존 A
      ===================================================== */}

      <ZoneLabel
        className="left-[90px] top-[115px]"
        text="업무존 A"
      />

      <Desk
        className="left-[60px] top-[155px]"
        double
      />

      {/* =====================================================
          업무존 B
      ===================================================== */}

      <ZoneLabel
        className="left-[430px] top-[115px]"
        text="업무존 B"
      />

      <Desk
        className="left-[410px] top-[155px]"
      />

      {/* =====================================================
          휴게존
      ===================================================== */}

      <div
        data-no-move
        className="
          absolute
          right-[38px]
          top-[155px]
          h-[165px]
          w-[220px]
          border-[4px]
          border-[#627f55]
          bg-[#75946a]
          p-5
        "
      >
        <div
          className="
            absolute
            left-1/2
            top-[38px]
            h-[58px]
            w-[130px]
            -translate-x-1/2
            rounded-[5px]
            border-[4px]
            border-[#775a31]
            bg-[#d2a451]
          "
        >
          <div className="absolute left-1/2 top-1/2 h-[2px] w-[90%] -translate-x-1/2 bg-[#b8873f]" />
        </div>

        <div
          className="
            absolute
            bottom-[22px]
            left-1/2
            h-[48px]
            w-[86px]
            -translate-x-1/2
            border-[4px]
            border-[#65482f]
            bg-[#996c45]
          "
        >
          <div className="absolute left-1/2 top-[8px] h-[15px] w-[18px] -translate-x-1/2 rounded-full bg-emerald-700" />
        </div>
      </div>

      <ZoneLabel
        className="right-[85px] top-[305px]"
        text="휴게존"
      />

      {/* =====================================================
          회의실 영역
      ===================================================== */}

      <div
        data-no-move
        className="
          absolute
          left-[270px]
          top-[330px]
          h-[215px]
          w-[440px]
          border-[4px]
          border-[#607086]
          bg-[#76889c]
          opacity-90
        "
      />

      <ZoneLabel
        className="left-[450px] top-[315px]"
        text="회의실"
      />

      {/* 회의 테이블 */}
      <div
        data-no-move
        className="
          absolute
          left-[340px]
          top-[385px]
          h-[105px]
          w-[300px]
          border-[5px]
          border-[#604327]
          bg-[#8e5f37]
        "
      >
        <div className="absolute left-1/2 top-1/2 h-[24px] w-[20px] -translate-x-1/2 -translate-y-1/2 bg-emerald-700" />

        <div className="absolute right-[35px] top-[33px] h-[23px] w-[17px] bg-white" />
      </div>

      {/* 회의실 의자 */}
      <Chair className="left-[330px] top-[355px]" />
      <Chair className="left-[430px] top-[355px]" />
      <Chair className="left-[530px] top-[355px]" />
      <Chair className="left-[630px] top-[355px]" />

      <Chair className="left-[330px] top-[485px]" />
      <Chair className="left-[430px] top-[485px]" />
      <Chair className="left-[530px] top-[485px]" />
      <Chair className="left-[630px] top-[485px]" />

      {/* =====================================================
          복사기
      ===================================================== */}

      <div
        data-no-move
        className="
          absolute
          left-[20px]
          top-[360px]
          h-[105px]
          w-[64px]
          border-[4px]
          border-zinc-700
          bg-zinc-300
        "
      >
        <div className="absolute left-[7px] top-[9px] h-[25px] w-[45px] border-[3px] border-zinc-600 bg-zinc-100" />

        <div className="absolute bottom-[16px] left-[10px] h-[8px] w-[38px] bg-zinc-500" />
      </div>

      <ZoneLabel
        className="left-[88px] top-[390px]"
        text="복사기"
      />

      {/* =====================================================
          탕비실
      ===================================================== */}

      <div
        data-no-move
        className="
          absolute
          bottom-[18px]
          right-[15px]
          h-[150px]
          w-[220px]
          border-[4px]
          border-zinc-700
          bg-[#d7e9f2]
        "
      >
        {/* 싱크대 */}
        <div className="absolute left-[18px] top-[25px] h-[58px] w-[135px] border-[4px] border-zinc-600 bg-[#8b8f88]">
          <div className="absolute left-[15px] top-[10px] h-[25px] w-[42px] border-[3px] border-zinc-600 bg-sky-100" />

          <div className="absolute right-[18px] top-[8px] h-[30px] w-[35px] bg-zinc-700" />
        </div>

        {/* 냉장고 */}
        <div className="absolute right-[10px] top-[12px] h-[102px] w-[48px] border-[4px] border-zinc-600 bg-zinc-200">
          <div className="absolute left-0 top-[38px] h-[3px] w-full bg-zinc-500" />
        </div>

        {/* 바닥 타일 */}
        <div
          className="absolute inset-x-0 bottom-0 h-[45px] opacity-50"
          style={{
            backgroundImage: `
              linear-gradient(
                to right,
                rgba(255,255,255,0.8) 50%,
                rgba(155,200,220,0.7) 50%
              ),
              linear-gradient(
                to bottom,
                rgba(255,255,255,0.8) 50%,
                rgba(155,200,220,0.7) 50%
              )
            `,
            backgroundSize: "24px 24px",
          }}
        />
      </div>

      <ZoneLabel
        className="right-[80px] bottom-[130px]"
        text="탕비실"
      />

      {/* =====================================================
          화장실
      ===================================================== */}

      <div
        data-no-move
        className="
          absolute
          bottom-[18px]
          left-[15px]
          h-[125px]
          w-[150px]
          border-[4px]
          border-zinc-700
          bg-[#a9d4e3]
        "
      >
        <div className="absolute left-[15px] top-[18px] h-[70px] w-[45px] border-[4px] border-zinc-600 bg-[#6fa9c1]">
          <div className="mt-3 text-center text-lg text-white">
            +
          </div>
        </div>

        <div className="absolute right-[15px] top-[18px] h-[70px] w-[45px] border-[4px] border-zinc-600 bg-[#6fa9c1]">
          <div className="mt-3 text-center text-lg text-white">
            +
          </div>
        </div>
      </div>

      <ZoneLabel
        className="left-[165px] bottom-[85px]"
        text="화장실"
      />

      {/* =====================================================
          아래쪽 화분
      ===================================================== */}

      <div
        data-no-move
        className="absolute bottom-[18px] left-[240px]"
      >
        <MiniPlant />
      </div>

      <div
        data-no-move
        className="absolute bottom-[18px] left-[290px]"
      >
        <MiniPlant />
      </div>

      <div
        data-no-move
        className="absolute bottom-[18px] left-[340px]"
      >
        <MiniPlant />
      </div>

      {/* =====================================================
          입구 매트
      ===================================================== */}

      <div
        data-no-move
        className="
          absolute
          bottom-0
          left-1/2
          h-[28px]
          w-[95px]
          -translate-x-1/2
          border-x-[4px]
          border-t-[4px]
          border-[#654332]
          bg-[#a44d31]
          text-center
          text-[10px]
          font-black
          leading-[24px]
          text-amber-200
        "
      >
        WELCOME
      </div>
    </>
  );
}

/* =========================================================
   작은 컴포넌트들
========================================================= */

function ZoneLabel({
  text,
  className,
}: {
  text: string;
  className: string;
}) {
  return (
    <div
      data-no-move
      className={`
        absolute
        z-30
        rounded-md
        border-[3px]
        border-zinc-700
        bg-white
        px-3
        py-1
        text-[11px]
        font-bold
        text-zinc-800
        shadow-sm
        ${className}
      `}
    >
      {text}
    </div>
  );
}

function Desk({
  className,
  double = false,
}: {
  className: string;
  double?: boolean;
}) {
  return (
    <div
      data-no-move
      className={`
        absolute
        h-[90px]
        ${double ? "w-[280px]" : "w-[190px]"}
        border-[4px]
        border-[#65462d]
        bg-[#b78352]
        ${className}
      `}
    >
      <Monitor className="left-[22px]" />

      {double && (
        <Monitor className="right-[22px]" />
      )}

      <div className="absolute bottom-[9px] left-[18px] h-[13px] w-[28px] bg-zinc-200" />

      <div className="absolute bottom-[10px] right-[20px] h-[14px] w-[18px] rounded-sm bg-amber-100" />

      <Chair className="left-[30px] top-[72px]" />

      {double && (
        <Chair className="right-[30px] top-[72px]" />
      )}
    </div>
  );
}

function Monitor({
  className,
}: {
  className: string;
}) {
  return (
    <div
      className={`
        absolute
        top-[14px]
        h-[38px]
        w-[58px]
        border-[4px]
        border-zinc-700
        bg-zinc-300
        ${className}
      `}
    >
      <div className="absolute bottom-[-10px] left-1/2 h-[9px] w-[5px] -translate-x-1/2 bg-zinc-700" />
    </div>
  );
}

function Chair({
  className,
}: {
  className: string;
}) {
  return (
    <div
      data-no-move
      className={`
        absolute
        z-10
        h-[42px]
        w-[35px]
        border-[4px]
        border-zinc-700
        bg-[#5b7185]
        ${className}
      `}
    >
      <div className="absolute -bottom-[8px] left-[4px] h-[7px] w-[4px] bg-zinc-700" />
      <div className="absolute -bottom-[8px] right-[4px] h-[7px] w-[4px] bg-zinc-700" />
    </div>
  );
}

function Plant() {
  return (
    <div className="relative h-[65px] w-[55px]">
      <div className="absolute left-[8px] top-[5px] h-[32px] w-[22px] rotate-[-25deg] rounded-full bg-[#55764c]" />

      <div className="absolute right-[6px] top-[2px] h-[35px] w-[22px] rotate-[25deg] rounded-full bg-[#476942]" />

      <div className="absolute left-[17px] top-0 h-[38px] w-[22px] rounded-full bg-[#63865b]" />

      <div className="absolute bottom-0 left-1/2 h-[28px] w-[28px] -translate-x-1/2 border-[3px] border-[#6b4933] bg-[#9c714f]" />
    </div>
  );
}

function MiniPlant() {
  return (
    <div className="relative h-[48px] w-[38px]">
      <div className="absolute left-[3px] top-[4px] h-[22px] w-[15px] rotate-[-25deg] rounded-full bg-emerald-700" />

      <div className="absolute right-[3px] top-[2px] h-[22px] w-[15px] rotate-[25deg] rounded-full bg-emerald-600" />

      <div className="absolute bottom-0 left-1/2 h-[22px] w-[22px] -translate-x-1/2 bg-[#91623e]" />
    </div>
  );
}