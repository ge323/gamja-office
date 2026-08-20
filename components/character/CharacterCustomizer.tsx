"use client";

import Potato, {
  type PotatoColor,
} from "@/components/character/Potato";

import type {
  GlassesType,
  HatType,
} from "@/components/character/Accessories";

export type CharacterStyle = {
  glasses:
    GlassesType;

  hat:
    HatType;

  ribbon:
    boolean;

  tie:
    boolean;

  color:
    PotatoColor;
};

type CharacterCustomizerProps = {
  nickname:
    string;

  setNickname: (
    nickname: string
  ) => void;

  style:
    CharacterStyle;

  setStyle: (
    style:
      CharacterStyle
  ) => void;

  onEnter:
    () => void;
};

export default function CharacterCustomizer({
  nickname,
  setNickname,
  style,
  setStyle,
  onEnter,
}: CharacterCustomizerProps) {
  const updateStyle = (
    partial:
      Partial<CharacterStyle>
  ) => {
    setStyle({
      ...style,
      ...partial,
    });
  };

  const canEnter =
    nickname.trim().length >
    0;

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
        {/* ===============================
            Preview
        =============================== */}

        <section
          className="
            flex
            min-h-[500px]
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
              color={
                style.color
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
            원하는 모습으로
            꾸며보세요.
          </div>
        </section>

        {/* ===============================
            Settings
        =============================== */}

        <section className="p-7 sm:p-9">
          <div className="text-[10px] font-bold tracking-[0.18em] text-zinc-400">
            GAMJA OFFICE
          </div>

          <h1 className="mt-2 text-2xl font-bold">
            출근 준비
          </h1>

          <p className="mt-2 text-sm text-zinc-500">
            닉네임과 캐릭터를
            설정하고 입장하세요.
          </p>

          {/* 닉네임 */}

          <div className="mt-7">
            <label
              htmlFor="nickname"
              className="text-xs font-semibold"
            >
              닉네임
            </label>

            <input
              id="nickname"
              value={
                nickname
              }
              onChange={(
                event
              ) =>
                setNickname(
                  event.target
                    .value
                )
              }
              onKeyDown={(
                event
              ) => {
                if (
                  event.key ===
                    "Enter" &&
                  canEnter
                ) {
                  onEnter();
                }
              }}
              maxLength={
                12
              }
              placeholder="닉네임을 입력하세요"
              className="
                mt-2
                w-full
                rounded-xl
                border
                border-zinc-300
                px-4
                py-3
                text-sm
                outline-none
                focus:border-zinc-500
                focus:ring-4
                focus:ring-zinc-100
              "
            />

            <div className="mt-1 text-right text-[10px] text-zinc-400">
              {
                nickname.length
              }
              /12
            </div>
          </div>

          {/* ===============================
              감자 색
          =============================== */}
<OptionSection title="감자 색">
  <ColorButton
    label="기본"
    color="#d9a15f"
    active={
      style.color ===
      "default"
    }
    onClick={() =>
      updateStyle({
        color:
          "default",
      })
    }
  />

  <ColorButton
    label="황금"
    color="#e5bb55"
    active={
      style.color ===
      "gold"
    }
    onClick={() =>
      updateStyle({
        color:
          "gold",
      })
    }
  />

  <ColorButton
    label="고구마"
    color="#c98266"
    active={
      style.color ===
      "sweet"
    }
    onClick={() =>
      updateStyle({
        color:
          "sweet",
      })
    }
  />

  <ColorButton
    label="자색"
    color="#9a769c"
    active={
      style.color ===
      "purple"
    }
    onClick={() =>
      updateStyle({
        color:
          "purple",
      })
    }
  />

  <ColorButton
    label="탄감자"
    color="#5c4033"
    active={
      style.color ===
      "burnt"
    }
    onClick={() =>
      updateStyle({
        color:
          "burnt",
      })
    }
  />
</OptionSection>

          {/* 안경 */}

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

          {/* 모자 */}

          <OptionSection title="모자">
            <OptionButton
              active={
                style.hat ===
                "none"
              }
              onClick={() =>
                updateStyle({
                  hat:
                    "none",
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
                  hat:
                    "cap",
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
                  hat:
                    "party",
                })
              }
            >
              🎉 파티
            </OptionButton>
          </OptionSection>

          {/* 장식 */}

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

          <button
            type="button"
            onClick={() =>
              setStyle({
                glasses:
                  "none",
                hat:
                  "none",
                ribbon:
                  false,
                tie:
                  false,
                color:
                  "default",
              })
            }
            className="mt-6 text-[11px] text-zinc-400 underline"
          >
            꾸미기 초기화
          </button>

          <button
            type="button"
            disabled={
              !canEnter
            }
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
              hover:bg-zinc-800
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

function OptionSection({
  title,
  children,
}: {
  title: string;
  children:
    React.ReactNode;
}) {
  return (
    <div className="mt-5">
      <div className="mb-2 text-xs font-semibold">
        {title}
      </div>

      <div className="flex flex-wrap gap-2">
        {children}
      </div>
    </div>
  );
}

function OptionButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children:
    React.ReactNode;
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

        ${
          active
            ? "border-zinc-900 bg-zinc-900 text-white"
            : "border-zinc-200 bg-white text-zinc-600"
        }
      `}
    >
      {children}
    </button>
  );
}

function ColorButton({
  label,
  color,
  active,
  onClick,
}: {
  label: string;
  color: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        flex
        items-center
        gap-2
        rounded-lg
        border
        px-3
        py-2
        text-xs

        ${
          active
            ? "border-zinc-900 bg-zinc-100 text-zinc-900"
            : "border-zinc-200 bg-white text-zinc-600"
        }
      `}
    >
      <span
        className="
          h-4
          w-4
          rounded-full
          border
          border-black/10
        "
        style={{
          backgroundColor:
            color,
        }}
      />

      {label}
    </button>
  );
}