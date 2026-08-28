"use client";

import Potato, {
  type EyeType,
  type HairColor,
  type HairType,
  type MouthType,
  type PotatoColor,
} from "@/components/character/Potato";

import type {
  GlassesType,
  HatType,
  SpecialAccessoryType,
} from "@/components/character/Accessories";

/* =========================================================
   Character Style
========================================================= */

export type CharacterStyle = {
  glasses: GlassesType;
  hat: HatType;
  ribbon: boolean;
  tie: boolean;
  special?: SpecialAccessoryType;
  color: PotatoColor;

  /* 새 꾸미기 옵션은 optional로 두어 기존 저장 데이터와 호환 */
  hair?: HairType;
  hairColor?: HairColor;
  eyes?: EyeType;
  mouth?: MouthType;
  blush?: boolean;
  freckles?: boolean;
};

const POTATO_COLORS: PotatoColor[] = [
  "default",
  "gold",
  "sweet",
  "purple",
  "burnt",
];

const HAIR_TYPES: HairType[] = [
  "none",
  "short",
  "middle",
  "bob",
  "curly",
  "bun",
  "braid",
  "long",
  "crop",
  "comma",
  "twoBlock",
  "slick",
];

const HAIR_COLORS: HairColor[] = [
  "black",
  "brown",
  "blonde",
  "pink",
  "blue",
];

const EYE_TYPES: EyeType[] = [
  "dot",
  "round",
  "smile",
  "sleepy",
  "sparkle",
  "wink",
  "puppy",
];

const MOUTH_TYPES: MouthType[] = [
  "default",
  "smile",
  "open",
  "cat",
  "pout",
  "flat",
];

function pickRandom<T>(items: T[]): T {
  return items[
    Math.floor(
      Math.random() *
        items.length
    )
  ];
}

export function createRandomCharacterStyle(): CharacterStyle {
  return {
    glasses:
      Math.random() < 0.35
        ? pickRandom([
            "round",
            "sunglasses",
          ] as GlassesType[])
        : "none",

    hat:
      Math.random() < 0.25
        ? pickRandom([
            "cap",
            "party",
          ] as HatType[])
        : "none",

    ribbon:
      Math.random() < 0.25,

    tie:
      Math.random() < 0.25,

    special:
      Math.random() < 0.28
        ? pickRandom([
            "headphones",
            "sprout",
            "crown",
            "badge",
          ] as SpecialAccessoryType[])
        : "none",

    color:
      pickRandom(
        POTATO_COLORS
      ),

    hair:
      pickRandom(
        HAIR_TYPES
      ),

    hairColor:
      pickRandom(
        HAIR_COLORS
      ),

    eyes:
      pickRandom(
        EYE_TYPES
      ),

    mouth:
      pickRandom(
        MOUTH_TYPES
      ),

    blush:
      Math.random() < 0.65,

    freckles:
      Math.random() < 0.3,
  };
}

/* =========================================================
   Props
========================================================= */

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

/* =========================================================
   이름 표시 함수
========================================================= */

function getDisplayName(
  nickname: string
) {
  const trimmed =
    nickname.trim();

  if (!trimmed) {
    return "____ 감자";
  }

  return `${trimmed} 감자`;
}

/* =========================================================
   CharacterCustomizer
========================================================= */

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
    nickname.trim().length > 0;

  /* ======================================================
     닉네임 입력 처리
  ====================================================== */

  const handleNicknameChange = (
    value: string
  ) => {
    /*
     * 사용자가 실수로
     * "감자"까지 입력했다면 제거
     *
     * 예:
     * 퇴근 감자
     * →
     * 퇴근
     */
    const cleaned =
      value
        .replace(
          /\s*감자\s*$/g,
          ""
        )
        .slice(
          0,
          10
        );

    setNickname(
      cleaned
    );
  };

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
          <div
            className="
              text-[10px]
              font-semibold
              uppercase
              tracking-[0.22em]
              text-zinc-400
            "
          >
            Character Preview
          </div>

          {/* 캐릭터 */}

          <div className="mt-12 scale-[1.8]">
            <Potato
              name={
                getDisplayName(
                  nickname
                )
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
              special={
                style.special ??
                "none"
              }
              color={
                style.color
              }
              hair={
                style.hair ??
                "none"
              }
              hairColor={
                style.hairColor ??
                "brown"
              }
              eyes={
                style.eyes ??
                "dot"
              }
              mouth={
                style.mouth ??
                "default"
              }
              blush={
                style.blush ??
                true
              }
              freckles={
                style.freckles ??
                false
              }
            />
          </div>

          {/* 설명 */}

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
          <div
            className="
              text-[10px]
              font-bold
              tracking-[0.18em]
              text-zinc-400
            "
          >
            GAMJA OFFICE
          </div>

          <h1
            className="
              mt-2
              text-2xl
              font-bold
            "
          >
            출근 준비
          </h1>

          <p
            className="
              mt-2
              text-sm
              text-zinc-500
            "
          >
            닉네임과 캐릭터를 설정하고 입장하세요.
          </p>

          <button
            type="button"
            onClick={() =>
              setStyle(
                createRandomCharacterStyle()
              )
            }
            className="
              mt-4
              rounded-xl
              border
              border-zinc-200
              bg-zinc-50
              px-4
              py-2.5
              text-xs
              font-semibold
              text-zinc-700
              transition
              hover:bg-zinc-100
            "
          >
            🎲 랜덤으로 꾸미기
          </button>

          {/* =====================================
              닉네임
          ===================================== */}

          <div className="mt-7">
            <label
              htmlFor="nickname"
              className="
                text-xs
                font-semibold
              "
            >
              닉네임
            </label>

            {/* 입력창 */}

            <div
              className="
                mt-2
                flex
                overflow-hidden
                rounded-xl
                border
                border-zinc-300
                bg-white
                transition
                focus-within:border-zinc-500
                focus-within:ring-4
                focus-within:ring-zinc-100
              "
            >
              <input
                id="nickname"
                value={
                  nickname
                }
                onChange={(
                  event
                ) => {
                  handleNicknameChange(
                    event.target
                      .value
                  );
                }}
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
                  10
                }
                placeholder="퇴근"
                className="
                  min-w-0
                  flex-1
                  border-0
                  bg-transparent
                  px-4
                  py-3
                  text-sm
                  outline-none
                "
              />

              {/* 감자 고정 */}

              <div
                className="
                  flex
                  items-center
                  border-l
                  border-zinc-200
                  bg-zinc-50
                  px-4
                  text-sm
                  font-semibold
                  text-zinc-600
                "
              >
                감자
              </div>
            </div>

            {/* 이름 미리보기 */}

            <div
              className="
                mt-2
                flex
                items-center
                justify-between
                gap-3
              "
            >
              <div
                className="
                  min-w-0
                  text-[10px]
                  text-zinc-400
                "
              >
                게임에서는{" "}
                <span
                  className="
                    font-medium
                    text-zinc-600
                  "
                >
                  {getDisplayName(
                    nickname
                  )}
                </span>
                로 표시됩니다.
              </div>

              <div
                className="
                  shrink-0
                  text-[10px]
                  text-zinc-400
                "
              >
                {
                  nickname.length
                }
                /10
              </div>
            </div>
          </div>

          {/* =====================================
              감자 색
          ===================================== */}

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

          {/* =====================================
              헤어 스타일
          ===================================== */}

          <OptionSection title="헤어 스타일">
            {([
              ["none", "없음"],
              ["short", "숏컷"],
              ["crop", "크롭컷"],
              ["comma", "쉼표머리"],
              ["twoBlock", "투블럭"],
              ["slick", "넘긴머리"],
              ["middle", "가운데가르마"],
              ["bob", "C컬 단발"],
              ["curly", "웨이브"],
              ["bun", "올림머리"],
              ["braid", "양갈래 땋기"],
              ["long", "긴 생머리"],
            ] as [HairType, string][]).map(
              ([value, label]) => (
                <OptionButton
                  key={value}
                  active={
                    (style.hair ?? "none") ===
                    value
                  }
                  onClick={() =>
                    updateStyle({
                      hair: value,
                    })
                  }
                >
                  {label}
                </OptionButton>
              )
            )}
          </OptionSection>

          {/* =====================================
              머리색
          ===================================== */}

          <OptionSection title="머리색">
            <ColorButton
              label="검정"
              color="#27272a"
              active={(style.hairColor ?? "brown") === "black"}
              onClick={() => updateStyle({ hairColor: "black" })}
            />
            <ColorButton
              label="갈색"
              color="#6b4423"
              active={(style.hairColor ?? "brown") === "brown"}
              onClick={() => updateStyle({ hairColor: "brown" })}
            />
            <ColorButton
              label="금발"
              color="#e7c56a"
              active={(style.hairColor ?? "brown") === "blonde"}
              onClick={() => updateStyle({ hairColor: "blonde" })}
            />
            <ColorButton
              label="핑크"
              color="#d66d8f"
              active={(style.hairColor ?? "brown") === "pink"}
              onClick={() => updateStyle({ hairColor: "pink" })}
            />
            <ColorButton
              label="블루"
              color="#5f78b8"
              active={(style.hairColor ?? "brown") === "blue"}
              onClick={() => updateStyle({ hairColor: "blue" })}
            />
          </OptionSection>

          {/* =====================================
              눈 모양
          ===================================== */}

          <OptionSection title="눈 모양">
            {([
              ["dot", "기본"],
              ["round", "동그란 눈"],
              ["smile", "웃는 눈"],
              ["sleepy", "졸린 눈"],
              ["sparkle", "반짝 눈"],
              ["wink", "윙크"],
              ["puppy", "초롱 눈"],
            ] as [EyeType, string][]).map(
              ([value, label]) => (
                <OptionButton
                  key={value}
                  active={
                    (style.eyes ?? "dot") ===
                    value
                  }
                  onClick={() =>
                    updateStyle({
                      eyes: value,
                    })
                  }
                >
                  {label}
                </OptionButton>
              )
            )}
          </OptionSection>

          {/* =====================================
              입 모양
          ===================================== */}

          <OptionSection title="입 모양">
            {([
              ["default", "기본"],
              ["smile", "미소"],
              ["open", "활짝 웃음"],
              ["cat", "고양이 입"],
              ["pout", "삐죽"],
              ["flat", "무표정"],
            ] as [MouthType, string][]).map(
              ([value, label]) => (
                <OptionButton
                  key={value}
                  active={
                    (style.mouth ?? "default") ===
                    value
                  }
                  onClick={() =>
                    updateStyle({
                      mouth: value,
                    })
                  }
                >
                  {label}
                </OptionButton>
              )
            )}
          </OptionSection>

          {/* =====================================
              얼굴 포인트
          ===================================== */}

          <OptionSection title="얼굴 포인트">
            <OptionButton
              active={
                style.blush ??
                true
              }
              onClick={() =>
                updateStyle({
                  blush:
                    !(style.blush ?? true),
                })
              }
            >
              😊 볼터치
            </OptionButton>

            <OptionButton
              active={
                style.freckles ??
                false
              }
              onClick={() =>
                updateStyle({
                  freckles:
                    !(style.freckles ?? false),
                })
              }
            >
              ·· 주근깨
            </OptionButton>
          </OptionSection>

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

            {([
              ["none", "추가 장식 없음"],
              ["headphones", "🎧 헤드폰"],
              ["sprout", "🌱 새싹"],
              ["crown", "👑 왕관"],
              ["badge", "🪪 사원증"],
            ] as [
              SpecialAccessoryType,
              string,
            ][]).map(
              ([value, label]) => (
                <OptionButton
                  key={value}
                  active={
                    (style.special ??
                      "none") ===
                    value
                  }
                  onClick={() =>
                    updateStyle({
                      special:
                        value,
                    })
                  }
                >
                  {label}
                </OptionButton>
              )
            )}
          </OptionSection>

          {/* =====================================
              초기화
          ===================================== */}

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

                special:
                  "none",

                color:
                  "default",

                hair:
                  "none",

                hairColor:
                  "brown",

                eyes:
                  "dot",

                mouth:
                  "default",

                blush:
                  true,

                freckles:
                  false,
              })
            }
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

/* =========================================================
   Option Section
========================================================= */

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
      <div
        className="
          mb-2
          text-xs
          font-semibold
        "
      >
        {title}
      </div>

      <div
        className="
          flex
          flex-wrap
          gap-2
        "
      >
        {children}
      </div>
    </div>
  );
}

/* =========================================================
   Option Button
========================================================= */

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
      onClick={
        onClick
      }
      className={`
        rounded-lg
        border
        px-3
        py-2
        text-xs
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

/* =========================================================
   Color Button
========================================================= */

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
      onClick={
        onClick
      }
      className={`
        flex
        items-center
        gap-2
        rounded-lg
        border
        px-3
        py-2
        text-xs
        transition

        ${
          active
            ? `
              border-zinc-900
              bg-zinc-100
              text-zinc-900
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