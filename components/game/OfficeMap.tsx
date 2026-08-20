"use client";

export default function OfficeMap() {
  return (
    <>
      {/* =========================================
          바닥
      ========================================= */}

      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundColor: "#eadfc9",
          backgroundImage: `
            linear-gradient(
              to right,
              rgba(120, 95, 65, 0.10) 1px,
              transparent 1px
            ),
            linear-gradient(
              to bottom,
              rgba(120, 95, 65, 0.10) 1px,
              transparent 1px
            )
          `,
          backgroundSize: "32px 32px",
        }}
      />

      {/* =========================================
          상단 벽
      ========================================= */}

      <div
        data-no-move
        className="
          absolute
          left-0
          right-0
          top-0
          h-[70px]
          border-b-[5px]
          border-zinc-700
          bg-[#d8d2c6]
        "
      >
        {/* 출입문 */}
        <div className="absolute left-[24px] top-[9px]">
          <div className="mb-1 inline-block rounded-sm bg-emerald-600 px-2 py-0.5 text-[8px] font-bold text-white">
            EXIT
          </div>

          <div className="relative h-[50px] w-[44px] rounded-sm border-[4px] border-zinc-800 bg-[#7b593f]">
            <div className="absolute right-[5px] top-1/2 h-[4px] w-[4px] rounded-full bg-amber-300" />
          </div>
        </div>

        {/* 공지판 */}
        <div
          data-no-move
          className="
            absolute
            left-[95px]
            top-[12px]
            h-[48px]
            w-[125px]
            rounded-sm
            border-[3px]
            border-[#72593f]
            bg-[#fff5dc]
            px-2
            py-1
          "
        >
          <div className="text-center text-[8px] text-zinc-500">
            오늘도
          </div>

          <div className="text-center text-[11px] font-bold text-zinc-800">
            감자합니다 🥔
          </div>
        </div>

        {/* 창문 */}
        <div className="absolute left-[320px] top-[15px] flex gap-1">
          <div className="h-[40px] w-[60px] rounded-sm border-[3px] border-zinc-700 bg-sky-100" />
          <div className="h-[40px] w-[60px] rounded-sm border-[3px] border-zinc-700 bg-sky-100" />
        </div>

        {/* 서랍장 */}
        <div className="absolute left-[450px] top-[18px] h-[38px] w-[90px] rounded-sm border-[3px] border-zinc-700 bg-zinc-400">
          <div className="absolute left-1/2 top-0 h-full w-[2px] -translate-x-1/2 bg-zinc-600" />
        </div>

        {/* 시계 */}
        <div
          className="
            absolute
            left-[570px]
            top-[12px]
            flex
            h-[42px]
            w-[42px]
            items-center
            justify-center
            rounded-full
            border-[4px]
            border-zinc-700
            bg-white
          "
        >
          <div className="absolute h-[11px] w-[2px] -translate-y-[4px] bg-zinc-700" />
          <div className="absolute h-[2px] w-[8px] translate-x-[3px] bg-zinc-700" />
        </div>

        {/* 정수기 */}
        <div className="absolute right-[285px] top-[10px]">
          <div className="mx-auto h-[20px] w-[20px] rounded-t-lg border-[2px] border-blue-500 bg-sky-200" />

          <div className="mx-auto h-[38px] w-[30px] rounded-sm border-[3px] border-zinc-600 bg-zinc-300" />
        </div>

        {/* 커피머신 */}
        <div
          data-no-move
          className="
            absolute
            right-[175px]
            top-[8px]
            h-[55px]
            w-[78px]
            rounded-sm
            border-[3px]
            border-[#5f4633]
            bg-[#8d6648]
          "
        >
          <div className="absolute -top-[16px] left-1/2 -translate-x-1/2 bg-[#7a5439] px-2 py-0.5 text-[8px] font-bold text-white">
            COFFEE
          </div>

          <div className="absolute left-[10px] top-[10px] h-[32px] w-[30px] rounded-sm border-[3px] border-zinc-800 bg-zinc-700">
            <div className="absolute left-[6px] top-[6px] h-[4px] w-[14px] bg-zinc-400" />
            <div className="absolute left-[10px] top-[15px] h-[8px] w-[8px] bg-zinc-950" />
          </div>

          <div className="absolute bottom-[8px] right-[8px] h-[16px] w-[16px] rounded-b-md border-[2px] border-zinc-600 bg-white" />
        </div>

        {/* 자판기 */}
        <div
          data-no-move
          className="
            absolute
            right-[90px]
            top-[8px]
            h-[55px]
            w-[58px]
            rounded-sm
            border-[4px]
            border-zinc-700
            bg-[#516b7c]
          "
        >
          <div className="grid grid-cols-3 gap-[2px] p-[6px]">
            {Array.from({ length: 9 }).map((_, index) => (
              <div
                key={index}
                className="h-[7px] rounded-[1px] bg-amber-300"
              />
            ))}
          </div>
        </div>
      </div>

      {/* =========================================
          업무존 A
      ========================================= */}

      <ZoneLabel
        className="left-[95px] top-[115px]"
        text="업무존 A"
      />

      <Desk
        className="left-[60px] top-[155px]"
        double
      />

      {/* =========================================
          업무존 B
      ========================================= */}

      <ZoneLabel
        className="left-[435px] top-[115px]"
        text="업무존 B"
      />

      <Desk className="left-[410px] top-[155px]" />

      {/* =========================================
          휴게존
      ========================================= */}

      <div
        data-no-move
        className="
          absolute
          right-[38px]
          top-[160px]
          h-[165px]
          w-[220px]
          rounded-lg
          border-[4px]
          border-[#627b57]
          bg-[#7f9b75]
        "
      >
        <div
          className="
            absolute
            left-1/2
            top-[34px]
            h-[58px]
            w-[130px]
            -translate-x-1/2
            rounded-md
            border-[4px]
            border-[#76582f]
            bg-[#d6a753]
          "
        >
          <div className="absolute left-[10px] top-[12px] h-[6px] w-[34px] rounded-full bg-[#bf8b3c]" />
          <div className="absolute right-[10px] top-[12px] h-[6px] w-[34px] rounded-full bg-[#bf8b3c]" />
        </div>

        <div
          className="
            absolute
            bottom-[22px]
            left-1/2
            h-[48px]
            w-[88px]
            -translate-x-1/2
            rounded-sm
            border-[4px]
            border-[#664830]
            bg-[#996c46]
          "
        >
          <div className="absolute left-1/2 top-[8px] h-[14px] w-[18px] -translate-x-1/2 rounded-full bg-emerald-700" />
        </div>
      </div>

      <ZoneLabel
        className="right-[82px] top-[312px]"
        text="휴게존"
      />

      {/* =========================================
          회의실
      ========================================= */}

      <div
        data-no-move
        className="
          absolute
          left-[270px]
          top-[330px]
          h-[215px]
          w-[440px]
          rounded-md
          border-[4px]
          border-[#617084]
          bg-[#8796a7]
        "
      />

      <ZoneLabel
        className="left-[450px] top-[315px]"
        text="회의실"
      />

      <div
        data-no-move
        className="
          absolute
          left-[340px]
          top-[385px]
          h-[105px]
          w-[300px]
          rounded-sm
          border-[5px]
          border-[#604329]
          bg-[#93623a]
        "
      >
        <div className="absolute left-1/2 top-1/2 h-[22px] w-[20px] -translate-x-1/2 -translate-y-1/2 rounded-sm bg-emerald-700" />

        <div className="absolute right-[35px] top-[33px] h-[23px] w-[17px] rounded-sm bg-white" />
      </div>

      <Chair className="left-[330px] top-[355px]" />
      <Chair className="left-[430px] top-[355px]" />
      <Chair className="left-[530px] top-[355px]" />
      <Chair className="left-[630px] top-[355px]" />

      <Chair className="left-[330px] top-[485px]" />
      <Chair className="left-[430px] top-[485px]" />
      <Chair className="left-[530px] top-[485px]" />
      <Chair className="left-[630px] top-[485px]" />

      {/* =========================================
          복사기
      ========================================= */}

      <div
        data-no-move
        className="
          absolute
          left-[20px]
          top-[360px]
          h-[105px]
          w-[64px]
          rounded-sm
          border-[4px]
          border-zinc-700
          bg-zinc-300
        "
      >
        <div className="absolute left-[7px] top-[9px] h-[25px] w-[45px] rounded-sm border-[3px] border-zinc-600 bg-zinc-100" />

        <div className="absolute bottom-[16px] left-[10px] h-[8px] w-[38px] bg-zinc-500" />
      </div>

      <ZoneLabel
        className="left-[88px] top-[390px]"
        text="복사기"
      />

      {/* =========================================
          화장실
      ========================================= */}

      <div
        data-no-move
        className="
          absolute
          bottom-[18px]
          left-[15px]
          h-[125px]
          w-[150px]
          rounded-sm
          border-[4px]
          border-zinc-700
          bg-[#a9d4e3]
        "
      >
        <div className="absolute left-[15px] top-[18px] h-[70px] w-[45px] rounded-sm border-[4px] border-zinc-600 bg-[#6fa9c1]">
          <div className="mt-3 text-center text-lg font-bold text-white">
            +
          </div>
        </div>

        <div className="absolute right-[15px] top-[18px] h-[70px] w-[45px] rounded-sm border-[4px] border-zinc-600 bg-[#6fa9c1]">
          <div className="mt-3 text-center text-lg font-bold text-white">
            +
          </div>
        </div>
      </div>

      <ZoneLabel
        className="left-[165px] bottom-[85px]"
        text="화장실"
      />

      {/* =========================================
          탕비실
      ========================================= */}

      <div
        data-no-move
        className="
          absolute
          bottom-[18px]
          right-[15px]
          h-[150px]
          w-[220px]
          rounded-sm
          border-[4px]
          border-zinc-700
          bg-[#d7e9f2]
        "
      >
        <div className="absolute left-[18px] top-[25px] h-[58px] w-[135px] rounded-sm border-[4px] border-zinc-600 bg-[#8b8f88]">
          <div className="absolute left-[15px] top-[10px] h-[25px] w-[42px] rounded-sm border-[3px] border-zinc-600 bg-sky-100" />

          <div className="absolute right-[18px] top-[8px] h-[30px] w-[35px] rounded-sm bg-zinc-700" />
        </div>

        <div className="absolute right-[10px] top-[12px] h-[102px] w-[48px] rounded-sm border-[4px] border-zinc-600 bg-zinc-200">
          <div className="absolute left-0 top-[38px] h-[3px] w-full bg-zinc-500" />
        </div>

        <div
          className="absolute inset-x-0 bottom-0 h-[45px] opacity-60"
          style={{
            backgroundImage: `
              linear-gradient(
                to right,
                #ffffff 50%,
                #add7e8 50%
              ),
              linear-gradient(
                to bottom,
                #ffffff 50%,
                #add7e8 50%
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

      {/* =========================================
          아래 화분
      ========================================= */}

      <MiniPlant className="bottom-[18px] left-[240px]" />
      <MiniPlant className="bottom-[18px] left-[290px]" />
      <MiniPlant className="bottom-[18px] left-[340px]" />

      {/* =========================================
          입구 매트
      ========================================= */}

      <div
        data-no-move
        className="
          absolute
          bottom-0
          left-1/2
          h-[28px]
          w-[95px]
          -translate-x-1/2
          rounded-t-sm
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

/* =========================================
   Components
========================================= */

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
        rounded-sm
        border-[4px]
        border-[#65462d]
        bg-[#b78352]
        ${className}
      `}
    >
      <Monitor className="left-[22px]" />

      {double && <Monitor className="right-[22px]" />}

      <div className="absolute bottom-[9px] left-[18px] h-[13px] w-[28px] rounded-sm bg-zinc-200" />

      <div className="absolute bottom-[10px] right-[20px] h-[14px] w-[18px] rounded-sm bg-amber-100" />

      <Chair className="left-[30px] top-[72px]" />

      {double && <Chair className="right-[30px] top-[72px]" />}
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
        rounded-sm
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
        rounded-sm
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

function MiniPlant({
  className,
}: {
  className: string;
}) {
  return (
    <div
      data-no-move
      className={`absolute h-[48px] w-[38px] ${className}`}
    >
      <div className="absolute left-[3px] top-[4px] h-[22px] w-[15px] rotate-[-25deg] rounded-full bg-emerald-700" />

      <div className="absolute right-[3px] top-[2px] h-[22px] w-[15px] rotate-[25deg] rounded-full bg-emerald-600" />

      <div className="absolute bottom-0 left-1/2 h-[22px] w-[22px] -translate-x-1/2 rounded-b-sm bg-[#91623e]" />
    </div>
  );
}