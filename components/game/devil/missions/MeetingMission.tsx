"use client";

import {
  useMemo,
  useState,
} from "react";

/* =========================================================
   Types
========================================================= */

type Props = {
  onComplete: () => void;
};

type MeetingPage = {
  id: string;
  order: number;
  title: string;
  subtitle: string;
  icon: string;
};

/* =========================================================
   Meeting Pages
========================================================= */

const MEETING_PAGES: MeetingPage[] = [
  {
    id: "cover",
    order: 1,
    title: "표지",
    subtitle: "2026년 하반기 업무회의",
    icon: "📘",
  },

  {
    id: "agenda",
    order: 2,
    title: "회의 안건",
    subtitle: "금일 논의사항 및 진행 순서",
    icon: "📋",
  },

  {
    id: "performance",
    order: 3,
    title: "상반기 실적",
    subtitle: "부서별 주요 업무성과",
    icon: "📊",
  },

  {
    id: "plan",
    order: 4,
    title: "향후 계획",
    subtitle: "하반기 업무 추진계획",
    icon: "🗓️",
  },

  {
    id: "conclusion",
    order: 5,
    title: "결론 및 요청사항",
    subtitle: "결정사항과 후속 업무",
    icon: "✅",
  },
];

/* =========================================================
   Shuffle
========================================================= */

function shuffleArray<T>(
  array: T[]
) {
  const copied = [...array];

  for (
    let index =
      copied.length - 1;
    index > 0;
    index -= 1
  ) {
    const randomIndex =
      Math.floor(
        Math.random() *
          (index + 1)
      );

    [
      copied[index],
      copied[randomIndex],
    ] = [
      copied[randomIndex],
      copied[index],
    ];
  }

  return copied;
}

/* =========================================================
   MeetingMission
========================================================= */

export default function MeetingMission({
  onComplete,
}: Props) {
  /* =======================================================
     Shuffled Documents
  ======================================================= */

  const shuffledPages =
    useMemo(
      () =>
        shuffleArray(
          MEETING_PAGES
        ),
      []
    );

  /* =======================================================
     State
  ======================================================= */

  const [
    arrangedPages,
    setArrangedPages,
  ] = useState<MeetingPage[]>(
    []
  );

  const [
    wrongPageId,
    setWrongPageId,
  ] = useState<
    string | null
  >(null);

  const [
    message,
    setMessage,
  ] = useState(
    "회의자료를 올바른 순서대로 선택해주세요."
  );

  const [
    success,
    setSuccess,
  ] = useState(false);

  /* =======================================================
     Current Expected Page
  ======================================================= */

  const nextOrder =
    arrangedPages.length + 1;

  /* =======================================================
     Remaining Pages
  ======================================================= */

  const remainingPages =
    shuffledPages.filter(
      page =>
        !arrangedPages.some(
          arranged =>
            arranged.id ===
            page.id
        )
    );

  /* =======================================================
     Progress
  ======================================================= */

  const progress =
    Math.round(
      (
        arrangedPages.length /
        MEETING_PAGES.length
      ) *
        100
    );

  /* =======================================================
     Select Page
  ======================================================= */

  function handlePage(
    page: MeetingPage
  ) {
    if (success) {
      return;
    }

    /* =====================================
       Wrong Order
    ===================================== */

    if (
      page.order !==
      nextOrder
    ) {
      setWrongPageId(
        page.id
      );

      setMessage(
        "⚠️ 이 자료는 아직 들어갈 순서가 아닙니다."
      );

      window.setTimeout(
        () => {
          setWrongPageId(
            null
          );
        },
        500
      );

      return;
    }

    /* =====================================
       Correct
    ===================================== */

    const nextPages = [
      ...arrangedPages,
      page,
    ];

    setArrangedPages(
      nextPages
    );

    setMessage(
      `✓ ${page.title} 정리 완료`
    );

    /* =====================================
       Complete
    ===================================== */

    if (
      nextPages.length ===
      MEETING_PAGES.length
    ) {
      setSuccess(true);

      setMessage(
        "📚 회의자료 정리가 완료되었습니다!"
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

    setArrangedPages([]);

    setWrongPageId(null);

    setMessage(
      "회의자료를 처음부터 다시 정리합니다."
    );
  }

  /* =======================================================
     Render
  ======================================================= */

  return (
    <div className="w-full">
      {/* =================================================
          Meeting Table
      ================================================= */}

      <div
        className="
          overflow-hidden
          rounded-2xl
          border
          border-black/10
          bg-[#e7dcc9]
          shadow-lg
        "
      >
        {/* Header */}

        <div
          className="
            flex
            items-center
            justify-between
            gap-3
            border-b
            border-black/10
            bg-[#58483b]
            px-5
            py-4
          "
        >
          <div>
            <div
              className="
                text-[9px]
                font-black
                tracking-[0.16em]
                text-white/35
              "
            >
              GAMJA OFFICE
              MEETING ROOM
            </div>

            <div
              className="
                mt-1
                text-[15px]
                font-black
                text-white
              "
            >
              📚 회의자료 준비
            </div>
          </div>

          <div
            className={`
              rounded-full
              px-3
              py-1.5
              text-[9px]
              font-black

              ${
                success
                  ? `
                    bg-emerald-400/20
                    text-emerald-200
                  `
                  : `
                    bg-amber-300/20
                    text-amber-100
                  `
              }
            `}
          >
            {success
              ? "READY"
              : `${arrangedPages.length} / ${MEETING_PAGES.length}`}
          </div>
        </div>

        {/* =================================================
            Instruction Sheet
        ================================================= */}

        <div className="p-5">
          <div
            className="
              rotate-[-0.5deg]
              rounded-sm
              border
              border-black/10
              bg-[#fffdf7]
              p-4
              shadow-md
            "
          >
            <div
              className="
                flex
                items-start
                justify-between
                gap-3
              "
            >
              <div>
                <div
                  className="
                    text-[9px]
                    font-black
                    tracking-[0.14em]
                    text-black/30
                  "
                >
                  MEETING DOCUMENT GUIDE
                </div>

                <div
                  className="
                    mt-1
                    text-[14px]
                    font-black
                    text-black/75
                  "
                >
                  회의자료 편철 순서
                </div>
              </div>

              <div
                className="
                  rounded
                  border
                  border-red-300
                  px-2
                  py-1
                  text-[8px]
                  font-black
                  text-red-400
                "
              >
                사내문서
              </div>
            </div>

            <div
              className="
                mt-4
                flex
                flex-wrap
                items-center
                gap-1.5
              "
            >
              {MEETING_PAGES.map(
                (
                  page,
                  index
                ) => (
                  <div
                    key={
                      page.id
                    }
                    className="
                      flex
                      items-center
                      gap-1.5
                    "
                  >
                    <div
                      className="
                        rounded-md
                        bg-black/5
                        px-2
                        py-1.5
                        text-[9px]
                        font-bold
                        text-black/55
                      "
                    >
                      {page.order}.{" "}
                      {page.title}
                    </div>

                    {index <
                      MEETING_PAGES.length -
                        1 && (
                      <span
                        className="
                          text-[9px]
                          text-black/20
                        "
                      >
                        →
                      </span>
                    )}
                  </div>
                )
              )}
            </div>
          </div>

          {/* =================================================
              Progress
          ================================================= */}

          <div className="mt-5">
            <div
              className="
                flex
                items-center
                justify-between
              "
            >
              <div
                className="
                  text-[9px]
                  font-black
                  tracking-[0.12em]
                  text-black/35
                "
              >
                DOCUMENT PROGRESS
              </div>

              <div
                className="
                  text-[10px]
                  font-black
                  text-black/50
                "
              >
                {progress}%
              </div>
            </div>

            <div
              className="
                mt-2
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
          </div>

          {/* =================================================
              Main Area
          ================================================= */}

          <div
            className="
              mt-5
              grid
              grid-cols-1
              gap-5
              md:grid-cols-2
            "
          >
            {/* =============================================
                Messy Documents
            ============================================= */}

            <div>
              <div
                className="
                  mb-2
                  text-[9px]
                  font-black
                  tracking-[0.12em]
                  text-black/35
                "
              >
                흩어진 자료
              </div>

              <div
                className="
                  min-h-[290px]
                  rounded-xl
                  border
                  border-dashed
                  border-black/15
                  bg-black/5
                  p-3
                "
              >
                {remainingPages.length >
                0 ? (
                  <div
                    className="
                      grid
                      grid-cols-1
                      gap-2
                    "
                  >
                    {remainingPages.map(
                      (
                        page,
                        index
                      ) => {
                        const wrong =
                          wrongPageId ===
                          page.id;

                        return (
                          <button
                            key={
                              page.id
                            }
                            type="button"
                            disabled={
                              success
                            }
                            onClick={() =>
                              handlePage(
                                page
                              )
                            }
                            className={`
                              relative
                              flex
                              min-h-[58px]
                              items-center
                              gap-3
                              border
                              px-3
                              py-2
                              text-left
                              shadow-sm
                              transition
                              active:scale-[0.98]

                              ${
                                wrong
                                  ? `
                                    border-red-400
                                    bg-red-50
                                  `
                                  : `
                                    border-black/10
                                    bg-[#fffdf7]
                                    hover:bg-white
                                  `
                              }
                            `}
                            style={{
                              transform:
                                index %
                                  2 ===
                                0
                                  ? "rotate(-0.5deg)"
                                  : "rotate(0.5deg)",
                            }}
                          >
                            <div
                              className="
                                flex
                                h-9
                                w-9
                                shrink-0
                                items-center
                                justify-center
                                rounded
                                bg-black/5
                                text-xl
                              "
                            >
                              {
                                page.icon
                              }
                            </div>

                            <div>
                              <div
                                className="
                                  text-[11px]
                                  font-black
                                  text-black/70
                                "
                              >
                                {
                                  page.title
                                }
                              </div>

                              <div
                                className="
                                  mt-0.5
                                  text-[8px]
                                  font-semibold
                                  text-black/35
                                "
                              >
                                {
                                  page.subtitle
                                }
                              </div>
                            </div>

                            <div
                              className="
                                ml-auto
                                text-[16px]
                                text-black/15
                              "
                            >
                              +
                            </div>
                          </button>
                        );
                      }
                    )}
                  </div>
                ) : (
                  <div
                    className="
                      flex
                      min-h-[260px]
                      flex-col
                      items-center
                      justify-center
                      text-center
                    "
                  >
                    <div className="text-4xl">
                      ✨
                    </div>

                    <div
                      className="
                        mt-2
                        text-[12px]
                        font-black
                        text-black/55
                      "
                    >
                      자료 정리 완료
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* =============================================
                Binder
            ============================================= */}

            <div>
              <div
                className="
                  mb-2
                  text-[9px]
                  font-black
                  tracking-[0.12em]
                  text-black/35
                "
              >
                회의용 파일
              </div>

              <div
                className="
                  relative
                  min-h-[290px]
                  overflow-hidden
                  rounded-r-xl
                  border
                  border-black/15
                  border-l-[12px]
                  border-l-[#394d67]
                  bg-[#f8f6ef]
                  p-4
                  shadow-md
                "
              >
                {/* Binder rings */}

                <div
                  className="
                    absolute
                    bottom-0
                    left-[-7px]
                    top-0
                    flex
                    flex-col
                    justify-around
                    py-8
                  "
                >
                  {Array.from({
                    length: 4,
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
                          h-3
                          w-3
                          rounded-full
                          border-2
                          border-zinc-500
                          bg-zinc-200
                        "
                      />
                    )
                  )}
                </div>

                <div
                  className="
                    border-b
                    border-black/10
                    pb-3
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
                    2026 MEETING FILE
                  </div>

                  <div
                    className="
                      mt-1
                      text-[13px]
                      font-black
                      text-black/70
                    "
                  >
                    하반기 업무회의
                  </div>
                </div>

                {/* Added Pages */}

                <div
                  className="
                    mt-3
                    space-y-2
                  "
                >
                  {arrangedPages.map(
                    page => (
                      <div
                        key={
                          page.id
                        }
                        className="
                          flex
                          items-center
                          gap-3
                          rounded-lg
                          border
                          border-emerald-500/20
                          bg-emerald-50
                          px-3
                          py-2.5
                        "
                      >
                        <div
                          className="
                            flex
                            h-7
                            w-7
                            shrink-0
                            items-center
                            justify-center
                            rounded-full
                            bg-emerald-500
                            text-[10px]
                            font-black
                            text-white
                          "
                        >
                          {
                            page.order
                          }
                        </div>

                        <div>
                          <div
                            className="
                              text-[10px]
                              font-black
                              text-black/65
                            "
                          >
                            {
                              page.title
                            }
                          </div>

                          <div
                            className="
                              mt-0.5
                              text-[8px]
                              text-black/30
                            "
                          >
                            편철 완료
                          </div>
                        </div>

                        <div
                          className="
                            ml-auto
                            text-emerald-500
                          "
                        >
                          ✓
                        </div>
                      </div>
                    )
                  )}

                  {/* Empty slots */}

                  {Array.from({
                    length:
                      MEETING_PAGES.length -
                      arrangedPages.length,
                  }).map(
                    (
                      _,
                      index
                    ) => (
                      <div
                        key={
                          `empty-${index}`
                        }
                        className="
                          flex
                          h-[50px]
                          items-center
                          justify-center
                          rounded-lg
                          border
                          border-dashed
                          border-black/10
                          text-[8px]
                          font-bold
                          text-black/20
                        "
                      >
                        {arrangedPages.length +
                          index +
                          1}
                        번째 자료
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* =================================================
              Message
          ================================================= */}

          <div
            className="
              mt-5
              min-h-[24px]
              text-center
              text-[11px]
              font-bold
            "
          >
            <span
              className={
                success
                  ? "text-emerald-600"
                  : message.includes(
                        "아직"
                      )
                    ? "text-red-500"
                    : "text-black/50"
              }
            >
              {message}
            </span>
          </div>

          {/* =================================================
              Reset
          ================================================= */}

          {!success && (
            <button
              type="button"
              onClick={
                handleReset
              }
              disabled={
                arrangedPages.length ===
                0
              }
              className="
                mt-2
                w-full
                rounded-xl
                border
                border-black/10
                bg-white
                py-2.5
                text-[10px]
                font-black
                text-black/50
                transition
                enabled:hover:bg-black/5
                disabled:cursor-not-allowed
                disabled:opacity-30
              "
            >
              처음부터 다시 정리
            </button>
          )}
        </div>
      </div>

      {/* =================================================
          Mobile-friendly Instruction
      ================================================= */}

      {!success && (
        <div
          className="
            mt-4
            rounded-lg
            bg-black/5
            px-4
            py-3
            text-center
            text-[9px]
            font-semibold
            leading-4
            text-black/40
          "
        >
          위쪽의
          <strong className="mx-1 text-black/60">
            편철 순서
          </strong>
          를 확인하고, 왼쪽에 흩어진 자료를
          순서대로 선택하세요.
        </div>
      )}
    </div>
  );
}