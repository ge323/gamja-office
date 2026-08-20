"use client";

import Accessories, {
  type GlassesType,
  type HatType,
} from "./Accessories";

type PotatoProps = {
  name?: string;
  glasses?: GlassesType;
  hat?: HatType;
  ribbon?: boolean;
  tie?: boolean;
  moving?: boolean;
};

export default function Potato({
  name = "감자",
  glasses = "none",
  hat = "none",
  ribbon = false,
  tie = false,
  moving = false,
}: PotatoProps) {
  return (
    <div className="flex flex-col items-center">
      {/* 닉네임 */}
      <div className="mb-1 text-[11px] font-medium text-zinc-600">
        {name}
      </div>

      {/* 캐릭터 전체 */}
      <div
        className={`relative h-[100px] w-[80px] ${
          moving ? "potato-bounce" : ""
        }`}
      >
        {/* 왼팔 */}
        <div
          className={`
            absolute
            left-[5px]
            top-[49px]
            h-[4px]
            w-[17px]
            origin-right
            rounded-full
            bg-zinc-900
            ${
              moving
                ? "potato-arm-left"
                : "rotate-[30deg]"
            }
          `}
        />

        {/* 오른팔 */}
        <div
          className={`
            absolute
            right-[5px]
            top-[49px]
            h-[4px]
            w-[17px]
            origin-left
            rounded-full
            bg-zinc-900
            ${
              moving
                ? "potato-arm-right"
                : "-rotate-[30deg]"
            }
          `}
        />

        {/* 왼쪽 다리 */}
        <div
          className={`
            absolute
            bottom-[4px]
            left-[28px]
            h-[20px]
            w-[4px]
            origin-top
            rounded-full
            bg-zinc-900
            ${
              moving
                ? "potato-leg-left"
                : ""
            }
          `}
        />

        {/* 오른쪽 다리 */}
        <div
          className={`
            absolute
            bottom-[4px]
            right-[28px]
            h-[20px]
            w-[4px]
            origin-top
            rounded-full
            bg-zinc-900
            ${
              moving
                ? "potato-leg-right"
                : ""
            }
          `}
        />

        {/* 감자 몸 */}
        <div
          className="
            absolute
            left-1/2
            top-[8px]
            h-[75px]
            w-[58px]
            -translate-x-1/2
            rounded-[48%_52%_46%_54%/42%_46%_54%_58%]
            border-[4px]
            border-zinc-900
            bg-[#d9a15f]
          "
        >
          {/* 감자 무늬 */}
          <div className="absolute left-[10px] top-[12px] h-[3px] w-[3px] rounded-full bg-[#ae743c]" />

          <div className="absolute right-[9px] top-[17px] h-[3px] w-[3px] rounded-full bg-[#ae743c]" />

          <div className="absolute left-[7px] top-[42px] h-[3px] w-[3px] rounded-full bg-[#ae743c]" />

          <div className="absolute bottom-[10px] right-[10px] h-[3px] w-[3px] rounded-full bg-[#ae743c]" />

          <div className="absolute left-[24px] top-[9px] h-[2px] w-[2px] rounded-full bg-[#ae743c]" />

          {/* 눈 */}
          <div className="absolute left-[12px] top-[30px] h-[6px] w-[6px] rounded-[1px] bg-zinc-900" />

          <div className="absolute right-[12px] top-[30px] h-[6px] w-[6px] rounded-[1px] bg-zinc-900" />

          {/* 입 */}
          <div className="absolute left-1/2 top-[44px] h-[5px] w-[12px] -translate-x-1/2 border-b-[3px] border-zinc-900" />

          {/* 액세서리 */}
          <Accessories
            glasses={glasses}
            hat={hat}
            ribbon={ribbon}
            tie={tie}
          />
        </div>
      </div>
    </div>
  );
}