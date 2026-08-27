"use client";

import {
  useMemo,
  useState,
} from "react";

/* =========================================================
   Types
========================================================= */

type Props = {
  onComplete:
    () => void;
};

type Ingredient =
  | "cup"
  | "espresso"
  | "water"
  | "milk"
  | "ice";

type CoffeeRecipe = {
  id: string;

  name: string;

  icon: string;

  description: string;

  steps:
    Ingredient[];
};

/* =========================================================
   Ingredient Meta
========================================================= */

const INGREDIENT_META: Record<
  Ingredient,
  {
    label: string;
    icon: string;
    description: string;
  }
> = {
  cup: {
    label:
      "컵",

    icon:
      "🥤",

    description:
      "컵 준비",
  },

  espresso: {
    label:
      "에스프레소",

    icon:
      "☕",

    description:
      "샷 추출",
  },

  water: {
    label:
      "물",

    icon:
      "💧",

    description:
      "온수 추가",
  },

  milk: {
    label:
      "우유",

    icon:
      "🥛",

    description:
      "스팀 우유",
  },

  ice: {
    label:
      "얼음",

    icon:
      "🧊",

    description:
      "얼음 추가",
  },
};

/* =========================================================
   Coffee Recipes
========================================================= */

const COFFEE_RECIPES:
  CoffeeRecipe[] = [
  {
    id:
      "americano",

    name:
      "아메리카노",

    icon:
      "☕",

    description:
      "회의 참석자용 따뜻한 아메리카노",

    steps: [
      "cup",
      "espresso",
      "water",
    ],
  },

  {
    id:
      "latte",

    name:
      "카페라떼",

    icon:
      "🥛",

    description:
      "부드러운 우유가 들어간 카페라떼",

    steps: [
      "cup",
      "espresso",
      "milk",
    ],
  },

  {
    id:
      "iced-americano",

    name:
      "아이스 아메리카노",

    icon:
      "🧊",

    description:
      "차가운 회의용 아메리카노",

    steps: [
      "cup",
      "ice",
      "espresso",
      "water",
    ],
  },

  {
    id:
      "iced-latte",

    name:
      "아이스 카페라떼",

    icon:
      "🧋",

    description:
      "얼음과 우유가 들어간 아이스 라떼",

    steps: [
      "cup",
      "ice",
      "espresso",
      "milk",
    ],
  },
];

/* =========================================================
   CoffeeMission
========================================================= */

export default function CoffeeMission({
  onComplete,
}: Props) {
  /* =======================================================
     Random Order
  ======================================================= */

  const recipe =
    useMemo(
      () => {
        const randomIndex =
          Math.floor(
            Math.random() *
              COFFEE_RECIPES.length
          );

        return COFFEE_RECIPES[
          randomIndex
        ];
      },
      []
    );

  /* =======================================================
     Current Steps
  ======================================================= */

  const [
    currentSteps,
    setCurrentSteps,
  ] =
    useState<
      Ingredient[]
    >([]);

  /* =======================================================
     Status
  ======================================================= */

  const [
    message,
    setMessage,
  ] =
    useState("");

  const [
    success,
    setSuccess,
  ] =
    useState(false);

  const [
    wrongIngredient,
    setWrongIngredient,
  ] =
    useState<
      Ingredient | null
    >(
      null
    );

  /* =======================================================
     Current Expected Ingredient
  ======================================================= */

  const nextIngredient =
    recipe.steps[
      currentSteps.length
    ];

  /* =======================================================
     Progress
  ======================================================= */

  const progress =
    Math.round(
      (
        currentSteps.length /
        recipe.steps.length
      ) *
        100
    );

  /* =======================================================
     Ingredient Click
  ======================================================= */

  function handleIngredient(
    ingredient:
      Ingredient
  ) {
    if (success) {
      return;
    }

    /* =====================================
       Wrong
    ===================================== */

    if (
      ingredient !==
      nextIngredient
    ) {
      setWrongIngredient(
        ingredient
      );

      setMessage(
        "제조 순서가 맞지 않습니다."
      );

      window.setTimeout(
        () => {
          setWrongIngredient(
            null
          );
        },
        450
      );

      return;
    }

    /* =====================================
       Correct
    ===================================== */

    const nextSteps =
      [
        ...currentSteps,
        ingredient,
      ];

    setCurrentSteps(
      nextSteps
    );

    setMessage(
      `${INGREDIENT_META[ingredient].label} 추가 완료`
    );

    /* =====================================
       Mission Complete
    ===================================== */

    if (
      nextSteps.length ===
      recipe.steps.length
    ) {
      setSuccess(
        true
      );

      setMessage(
        `${recipe.name} 완성!`
      );

      window.setTimeout(
        () => {
          onComplete();
        },
        1200
      );
    }
  }

  /* =======================================================
     Reset
  ======================================================= */

  function handleReset() {
    if (success) {
      return;
    }

    setCurrentSteps(
      []
    );

    setMessage(
      "처음부터 다시 제조합니다."
    );
  }

  /* =======================================================
     Render
  ======================================================= */

  return (
    <div
      className="
        w-full
      "
    >
      {/* =================================================
          Order Sheet
      ================================================= */}

      <div
        className="
          rounded-xl

          border
          border-black/10

          bg-amber-50

          p-5
        "
      >
        <div
          className="
            flex

            items-start
            justify-between

            gap-4
          "
        >
          <div>
            <div
              className="
                text-[10px]
                font-black

                tracking-[0.16em]

                text-black/35
              "
            >
              COFFEE ORDER
            </div>

            <div
              className="
                mt-1

                text-[18px]
                font-black

                text-black/80
              "
            >
              {
                recipe.icon
              }{" "}
              {
                recipe.name
              }
            </div>

            <div
              className="
                mt-2

                text-[11px]
                font-semibold

                text-black/45
              "
            >
              {
                recipe.description
              }
            </div>
          </div>

          <div
            className="
              rounded-lg

              bg-black

              px-3
              py-2

              text-[10px]
              font-black

              text-white
            "
          >
            회의용
          </div>
        </div>

        {/* Recipe Hint */}

        <div
          className="
            mt-4

            rounded-lg

            border
            border-black/10

            bg-white

            p-3
          "
        >
          <div
            className="
              text-[9px]
              font-black

              tracking-[0.12em]

              text-black/30
            "
          >
            RECIPE CARD
          </div>

          <div
            className="
              mt-2

              flex

              flex-wrap

              items-center

              gap-2
            "
          >
            {recipe.steps.map(
              (
                step,
                index
              ) => (
                <div
                  key={
                    `${step}-${index}`
                  }
                  className="
                    flex

                    items-center

                    gap-2
                  "
                >
                  <div
                    className="
                      rounded-lg

                      bg-black/5

                      px-2.5
                      py-2

                      text-[11px]
                      font-bold

                      text-black/60
                    "
                  >
                    {
                      INGREDIENT_META[
                        step
                      ].icon
                    }{" "}
                    {
                      INGREDIENT_META[
                        step
                      ].label
                    }
                  </div>

                  {index <
                    recipe.steps.length -
                      1 && (
                    <div
                      className="
                        text-[11px]

                        text-black/25
                      "
                    >
                      →
                    </div>
                  )}
                </div>
              )
            )}
          </div>
        </div>
      </div>

      {/* =================================================
          Coffee Machine
      ================================================= */}

      <div
        className="
          mt-5

          rounded-2xl

          bg-[#34363b]

          p-5

          shadow-xl
        "
      >
        {/* Header */}

        <div
          className="
            flex

            items-center
            justify-between
          "
        >
          <div
            className="
              text-[14px]
              font-black

              text-white
            "
          >
            ☕ GAMJA BARISTA 01
          </div>

          <div
            className="
              flex

              items-center

              gap-2

              text-[9px]
              font-bold

              text-white/45
            "
          >
            <div
              className="
                h-2
                w-2

                rounded-full

                bg-emerald-400
              "
            />

            READY
          </div>
        </div>

        {/* =================================================
            Machine Screen
        ================================================= */}

        <div
          className="
            mt-4

            rounded-xl

            bg-[#dce8df]

            p-4
          "
        >
          <div
            className="
              flex

              items-center
              justify-between
            "
          >
            <div>
              <div
                className="
                  text-[9px]
                  font-black

                  text-black/35
                "
              >
                CURRENT ORDER
              </div>

              <div
                className="
                  mt-1

                  text-[15px]
                  font-black

                  text-black/70
                "
              >
                {
                  recipe.name
                }
              </div>
            </div>

            <div
              className="
                text-[24px]
              "
            >
              {
                recipe.icon
              }
            </div>
          </div>

          {/* Progress */}

          <div
            className="
              mt-4

              h-2

              overflow-hidden

              rounded-full

              bg-black/10
            "
          >
            <div
              className="
                h-full

                rounded-full

                bg-emerald-500

                transition-all
                duration-300
              "
              style={{
                width:
                  `${progress}%`,
              }}
            />
          </div>

          <div
            className="
              mt-2

              text-right

              text-[9px]
              font-bold

              text-black/40
            "
          >
            {
              currentSteps.length
            }
            /
            {
              recipe.steps.length
            }
          </div>
        </div>

        {/* =================================================
            Cup Preview
        ================================================= */}

        <div
          className="
            relative

            mx-auto
            mt-5

            h-[170px]
            max-w-[230px]
          "
        >
          {/* Machine Head */}

          <div
            className="
              absolute

              left-1/2
              top-0

              h-[45px]
              w-[120px]

              -translate-x-1/2

              rounded-b-xl

              bg-[#202126]
            "
          >
            <div
              className="
                absolute

                bottom-[-15px]
                left-1/2

                h-[18px]
                w-[9px]

                -translate-x-1/2

                rounded-b-md

                bg-zinc-700
              "
            />
          </div>

          {/* Coffee Stream */}

          {currentSteps.includes(
            "espresso"
          ) &&
            !success && (
              <div
                className="
                  absolute

                  left-1/2
                  top-[57px]

                  h-[30px]
                  w-[3px]

                  -translate-x-1/2

                  bg-amber-900/70
                "
              />
            )}

          {/* Cup */}

          <div
            className="
              absolute

              bottom-0
              left-1/2

              h-[90px]
              w-[105px]

              -translate-x-1/2

              overflow-hidden

              rounded-b-[30px]

              border-[5px]
              border-white

              bg-white/20
            "
          >
            {/* Ice */}

            {currentSteps.includes(
              "ice"
            ) && (
              <div
                className="
                  absolute

                  left-2
                  right-2
                  top-2

                  flex
                  flex-wrap

                  gap-1
                "
              >
                {Array.from({
                  length: 6,
                }).map(
                  (
                    _,
                    index
                  ) => (
                    <div
                      key={
                        index
                      }
                      className="
                        h-5
                        w-5

                        rotate-12

                        rounded-sm

                        border
                        border-sky-200

                        bg-sky-100/80
                      "
                    />
                  )
                )}
              </div>
            )}

            {/* Coffee */}

            {currentSteps.includes(
              "espresso"
            ) && (
              <div
                className="
                  absolute

                  bottom-0
                  left-0
                  right-0

                  h-[34%]

                  bg-[#5d321d]
                "
              />
            )}

            {/* Water */}

            {currentSteps.includes(
              "water"
            ) && (
              <div
                className="
                  absolute

                  bottom-0
                  left-0
                  right-0

                  h-[62%]

                  bg-[#8c5b3a]/80
                "
              />
            )}

            {/* Milk */}

            {currentSteps.includes(
              "milk"
            ) && (
              <div
                className="
                  absolute

                  bottom-0
                  left-0
                  right-0

                  h-[66%]

                  bg-[#eadfc5]
                "
              />
            )}
          </div>

          {/* Handle */}

          <div
            className="
              absolute

              bottom-[20px]
              left-[calc(50%+44px)]

              h-[45px]
              w-[40px]

              rounded-r-full

              border-[8px]
              border-white
              border-l-0
            "
          />
        </div>

        {/* =================================================
            Ingredient Buttons
        ================================================= */}

        <div
          className="
            mt-5

            grid

            grid-cols-2

            gap-2

            sm:grid-cols-5
          "
        >
          {(
            Object.keys(
              INGREDIENT_META
            ) as Ingredient[]
          ).map(
            ingredient => {
              const meta =
                INGREDIENT_META[
                  ingredient
                ];

              const wrong =
                wrongIngredient ===
                ingredient;

              return (
                <button
                  key={
                    ingredient
                  }
                  type="button"
                  disabled={
                    success
                  }
                  onClick={() =>
                    handleIngredient(
                      ingredient
                    )
                  }
                  className={`
                    rounded-xl

                    border

                    px-2
                    py-3

                    text-center

                    transition

                    active:scale-[0.97]

                    ${
                      wrong
                        ? `
                          border-red-500
                          bg-red-100
                        `
                        : `
                          border-white/10
                          bg-white

                          hover:bg-zinc-100
                        `
                    }

                    disabled:cursor-default
                    disabled:opacity-50
                  `}
                >
                  <div
                    className="
                      text-[24px]
                    "
                  >
                    {
                      meta.icon
                    }
                  </div>

                  <div
                    className="
                      mt-1

                      text-[10px]
                      font-black

                      text-black/65
                    "
                  >
                    {
                      meta.label
                    }
                  </div>
                </button>
              );
            }
          )}
        </div>

        {/* =================================================
            Message
        ================================================= */}

        <div
          className="
            mt-4

            min-h-[22px]

            text-center

            text-[11px]
            font-bold
          "
        >
          {message && (
            <span
              className={
                success
                  ? "text-emerald-400"
                  : message.includes(
                        "맞지"
                      )
                    ? "text-red-400"
                    : "text-white/60"
              }
            >
              {
                message
              }
            </span>
          )}
        </div>

        {/* =================================================
            Controls
        ================================================= */}

        {!success && (
          <button
            type="button"
            onClick={
              handleReset
            }
            className="
              mt-2

              w-full

              rounded-xl

              border
              border-white/10

              bg-white/5

              py-2.5

              text-[10px]
              font-black

              text-white/60

              transition

              hover:bg-white/10
              hover:text-white
            "
          >
            처음부터 다시 만들기
          </button>
        )}
      </div>
    </div>
  );
}