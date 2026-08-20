"use client";

import Potato from "@/components/character/Potato";

import type {
  GlassesType,
  HatType,
} from "@/components/character/Accessories";

export type CharacterStyle = {
  glasses: GlassesType;
  hat: HatType;
  ribbon: boolean;
  tie: boolean;
};

type CharacterCustomizerProps = {
  nickname: string;

  setNickname: (
    nickname: string
  ) => void;

  style: CharacterStyle;

  setStyle: (
    style: CharacterStyle
  ) => void;

  onEnter: () => void;
};

export default function CharacterCustomizer({
  nickname,
  setNickname,
  style,
  setStyle,
  onEnter,
}: CharacterCustomizerProps) {
  const updateStyle = (
    partial: Partial<CharacterStyle>
  ) => {
    setStyle({
      ...style,
      ...partial,
    });
  };

  const canEnter =
    nickname.trim().length > 0;

  return (
    <main
      className="
        flex
        min-h-screen
        items-center
        justify-center
        bg-[#ece7dd]
        px-5
        py-8
        text-zinc-900
      "
    >
      <div
        className="
          grid
          w-full
          max-w-[850px]
          overflow-hidden
          rounded-3xl
          border
          border-zinc-200
          bg-white
          shadow-xl
          md:grid-cols-[0.9fr_1.1fr]
        "
      >
        {/* =========================================
            캐릭터 미리보기
        ========================================= */}

        <section
          className="
            flex
            min-h-[470px]
            flex-col
            items-center
            justify-center
            border-b
            border-zinc-200
            bg-[#f4efe6]
            p-8
            md:border-b-0
            md:border-r
          "
        >
          <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-400">
            Character Preview
          </div>

          <div className="mt-12 scale-[1.8]">
            <Potato
              name={
                nickname.trim() ||
                "감자"
              }
              glasses={
                style.glasses
              }
              hat={
                style.hat
              }
              ribbon={
                style.ribbon
              }
              tie={
                style.tie
              }
            />
          </div>

          <div
            className="
              mt-20
              rounded-xl
              border
              border-zinc-200
              bg-white/80
              px-4
              py-3
              text-center
              text-[11px]
              leading-5
              text-zinc-500
            "
          >
            오늘 출근할 감자를
            <br />
            원하는 모습으로 꾸며보세요.
          </div>
        </section>

        {/* =========================================
            설정
        ========================================= */}

        <section className="p-7 sm:p-9">
          <div>
            <div className="text-[10px] font-bold tracking-[0.18em] text-zinc-400">
              GAMJA OFFICE
            </div>

            <h1 className="mt-2 text-2xl font-bold tracking-tight">
              출근 준비
            </h1>

            <p className="mt-2 text-sm leading-6 text-zinc-500">
              닉네임과 캐릭터를 설정하고
              사무실에 입장하세요.
            </p>
          </div>

          {/* =====================================
              닉네임
          ===================================== */}

          <div className="mt-7">
            <label
              htmlFor="nickname"
              className="text-xs font-semibold text-zinc-700"
            >
              닉네임
            </label>

            <input
              id="nickname"
              value={nickname}
              onChange={(event) => {
                setNickname(
                  event.target.value
                );
              }}
              onKeyDown={(event) => {
                if (
                  event.key ===
                    "Enter" &&
                  canEnter
                ) {
                  onEnter();
                }
              }}
              maxLength={12}
              placeholder="닉네임을 입력하세요"
              className="
                mt-2
                w-full
                rounded-xl
                border
                border-zinc-300
                bg-white
                px-4
                py-3
                text-sm
                outline-none
                transition
                focus:border-zinc-500
                focus:ring-4
                focus:ring-zinc-100
              "
            />

            <div className="mt-1 text-right text-[10px] text-zinc-400">
              {nickname.length}/12
            </div>
          </div>

          {/* =====================================
              안경
          ===================================== */}

          <OptionSection title="안경">
            <OptionButton
              active={
                style.glasses ===
                "none"
              }
              onClick={() =>
                updateStyle({
                  glasses:
                    "none",
                })
              }
            >
              없음
            </OptionButton>

            <OptionButton
              active={
                style.glasses ===
                "round"
              }
              onClick={() =>
                updateStyle({
                  glasses:
                    "round",
                })
              }
            >
              👓 안경
            </OptionButton>

            <OptionButton
              active={
                style.glasses ===
                "sunglasses"
              }
              onClick={() =>
                updateStyle({
                  glasses:
                    "sunglasses",
                })
              }
            >
              😎 선글라스
            </OptionButton>
          </OptionSection>

          {/* =====================================
              모자
          ===================================== */}

          <OptionSection title="모자">
            <OptionButton
              active={
                style.hat ===
                "none"
              }
              onClick={() =>
                updateStyle({
                  hat: "none",
                })
              }
            >
              없음
            </OptionButton>

            <OptionButton
              active={
                style.hat ===
                "cap"
              }
              onClick={() =>
                updateStyle({
                  hat: "cap",
                })
              }
            >
              🧢 캡
            </OptionButton>

            <OptionButton
              active={
                style.hat ===
                "party"
              }
              onClick={() =>
                updateStyle({
                  hat: "party",
                })
              }
            >
              🎉 파티
            </OptionButton>
          </OptionSection>

          {/* =====================================
              장식
          ===================================== */}

          <OptionSection title="장식">
            <OptionButton
              active={
                style.ribbon
              }
              onClick={() =>
                updateStyle({
                  ribbon:
                    !style.ribbon,
                })
              }
            >
              🎀 리본
            </OptionButton>

            <OptionButton
              active={
                style.tie
              }
              onClick={() =>
                updateStyle({
                  tie:
                    !style.tie,
                })
              }
            >
              👔 넥타이
            </OptionButton>
          </OptionSection>

          {/* =====================================
              초기화
          ===================================== */}

          <button
            type="button"
            onClick={() => {
              setStyle({
                glasses:
                  "none",
                hat:
                  "none",
                ribbon:
                  false,
                tie:
                  false,
              });
            }}
            className="
              mt-6
              text-[11px]
              text-zinc-400
              underline
              underline-offset-4
              transition
              hover:text-zinc-700
            "
          >
            꾸미기 초기화
          </button>

          {/* =====================================
              입장
          ===================================== */}

          <button
            type="button"
            disabled={!canEnter}
            onClick={
              onEnter
            }
            className="
              mt-7
              w-full
              rounded-xl
              bg-zinc-900
              px-4
              py-3.5
              text-sm
              font-semibold
              text-white
              transition
              hover:bg-zinc-800
              disabled:cursor-not-allowed
              disabled:bg-zinc-300
            "
          >
            사무실 입장
          </button>
        </section>
      </div>
    </main>
  );
}

/* =========================================
   Option Section
========================================= */

function OptionSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-5">
      <div className="mb-2 text-xs font-semibold text-zinc-700">
        {title}
      </div>

      <div className="flex flex-wrap gap-2">
        {children}
      </div>
    </div>
  );
}

/* =========================================
   Option Button
========================================= */

function OptionButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        rounded-lg
        border
        px-3
        py-2
        text-xs
        font-medium
        transition

        ${
          active
            ? `
              border-zinc-900
              bg-zinc-900
              text-white
            `
            : `
              border-zinc-200
              bg-white
              text-zinc-600
              hover:border-zinc-300
              hover:bg-zinc-50
            `
        }
      `}
    >
      {children}
    </button>
  );
}