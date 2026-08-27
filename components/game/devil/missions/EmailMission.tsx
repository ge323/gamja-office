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

type MailCategory =
  | "urgent"
  | "normal"
  | "spam";

type MailItem = {
  id: string;

  sender: string;
  subject: string;
  content: string;

  category: MailCategory;

  time: string;
};

/* =========================================================
   Category
========================================================= */

const CATEGORY_META: Record<
  MailCategory,
  {
    label: string;
    icon: string;
    description: string;
  }
> = {
  urgent: {
    label: "긴급",
    icon: "🚨",
    description: "즉시 확인이 필요한 업무",
  },

  normal: {
    label: "일반",
    icon: "📨",
    description: "일반적인 업무 메일",
  },

  spam: {
    label: "스팸",
    icon: "🗑️",
    description: "업무와 관계없는 메일",
  },
};

/* =========================================================
   Mail Pool
========================================================= */

const MAIL_POOL: MailItem[] = [
  {
    id: "server-error",

    sender: "IT인프라팀",
    subject: "[긴급] 사내 서버 장애 발생",

    content:
      "현재 사내 업무 포털 접속 장애가 발생했습니다. 관련 담당자는 즉시 서버 상태를 확인해주시기 바랍니다.",

    category: "urgent",

    time: "09:12",
  },

  {
    id: "security",

    sender: "정보보안팀",
    subject: "[긴급] 의심스러운 로그인 감지",

    content:
      "사내 관리자 계정에서 비정상적인 로그인 시도가 감지되었습니다. 담당자는 즉시 접속 기록을 확인해주세요.",

    category: "urgent",

    time: "10:03",
  },

  {
    id: "meeting-change",

    sender: "경영지원팀",
    subject: "[긴급] 금일 회의시간 변경",

    content:
      "오늘 예정된 부서장 회의가 14시에서 13시로 변경되었습니다. 참석자분들은 일정을 확인해주세요.",

    category: "urgent",

    time: "11:21",
  },

  {
    id: "meeting-material",

    sender: "기획팀",
    subject: "주간회의 자료 공유",

    content:
      "금주 주간회의 자료를 공유드립니다. 회의 전까지 첨부 자료를 확인해주시기 바랍니다.",

    category: "normal",

    time: "09:35",
  },

  {
    id: "vacation",

    sender: "인사팀",
    subject: "하계휴가 일정 안내",

    content:
      "하계휴가 신청기간과 승인 절차를 안내드립니다. 세부 일정은 사내 게시판을 확인해주세요.",

    category: "normal",

    time: "10:47",
  },

  {
    id: "expense",

    sender: "재무팀",
    subject: "법인카드 정산 안내",

    content:
      "이번 달 법인카드 사용내역 정산 마감일을 안내드립니다. 미제출 영수증이 있는 경우 제출해주세요.",

    category: "normal",

    time: "13:02",
  },

  {
    id: "education",

    sender: "인재개발팀",
    subject: "사내 교육 프로그램 안내",

    content:
      "다음 달 진행되는 사내 직무교육 프로그램 일정을 공유드립니다. 참여 희망자는 신청해주세요.",

    category: "normal",

    time: "14:12",
  },

  {
    id: "lottery",

    sender: "행운이벤트",
    subject: "🎉 축하합니다! 5억원 당첨!",

    content:
      "회원님께서 특별 이벤트 당첨자로 선정되었습니다. 지금 바로 링크를 눌러 당첨금을 수령하세요.",

    category: "spam",

    time: "08:31",
  },

  {
    id: "investment",

    sender: "VIP 투자정보",
    subject: "오늘 반드시 오르는 종목 공개",

    content:
      "수익률 500% 보장! 지금 가입하면 특별 종목 정보를 무료로 제공해드립니다.",

    category: "spam",

    time: "11:54",
  },

  {
    id: "advertisement",

    sender: "초특가마켓",
    subject: "[광고] 오늘만 90% 할인!",

    content:
      "오늘 단 하루 진행되는 초특가 이벤트! 지금 구매하시면 추가 할인쿠폰까지 지급됩니다.",

    category: "spam",

    time: "15:17",
  },
];

/* =========================================================
   Shuffle
========================================================= */

function shuffleArray<T>(
  array: T[]
) {
  const copied =
    [...array];

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
   EmailMission
========================================================= */

export default function EmailMission({
  onComplete,
}: Props) {
  /* =======================================================
     Random Emails

     전체 메일 중 6개 사용
  ======================================================= */

  const mails =
    useMemo(
      () =>
        shuffleArray(
          MAIL_POOL
        ).slice(
          0,
          6
        ),
      []
    );

  /* =======================================================
     State
  ======================================================= */

  const [
    currentIndex,
    setCurrentIndex,
  ] =
    useState(0);

  const [
    sortedIds,
    setSortedIds,
  ] =
    useState<string[]>(
      []
    );

  const [
    wrongCategory,
    setWrongCategory,
  ] =
    useState<
      MailCategory | null
    >(null);

  const [
    message,
    setMessage,
  ] =
    useState(
      "메일 내용을 읽고 알맞은 분류함을 선택해주세요."
    );

  const [
    success,
    setSuccess,
  ] =
    useState(false);

  /* =======================================================
     Current Mail
  ======================================================= */

  const currentMail =
    mails[
      currentIndex
    ] ?? null;

  /* =======================================================
     Progress
  ======================================================= */

  const progress =
    mails.length === 0
      ? 0
      : Math.round(
          (
            sortedIds.length /
            mails.length
          ) *
            100
        );

  /* =======================================================
     Sort Mail
  ======================================================= */

  function handleSort(
    category:
      MailCategory
  ) {
    if (
      !currentMail ||
      success
    ) {
      return;
    }

    /* =====================================
       Wrong
    ===================================== */

    if (
      currentMail.category !==
      category
    ) {
      setWrongCategory(
        category
      );

      setMessage(
        `⚠️ '${CATEGORY_META[category].label}' 메일이 아닌 것 같습니다.`
      );

      window.setTimeout(
        () => {
          setWrongCategory(
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

    const nextSorted =
      [
        ...sortedIds,
        currentMail.id,
      ];

    setSortedIds(
      nextSorted
    );

    setMessage(
      `✓ ${CATEGORY_META[category].label} 메일함으로 이동했습니다.`
    );

    /* =====================================
       Complete
    ===================================== */

    if (
      nextSorted.length ===
      mails.length
    ) {
      setSuccess(
        true
      );

      setMessage(
        "📬 모든 메일 정리가 완료되었습니다!"
      );

      window.setTimeout(
        () => {
          onComplete();
        },
        1200
      );

      return;
    }

    setCurrentIndex(
      currentIndex + 1
    );
  }

  /* =======================================================
     Render
  ======================================================= */

  return (
    <div className="w-full">
      {/* =================================================
          Mail Client
      ================================================= */}

      <div
        className="
          overflow-hidden
          rounded-2xl
          border
          border-black/10
          bg-[#f4f6f8]
          shadow-xl
        "
      >
        {/* =================================================
            App Header
        ================================================= */}

        <div
          className="
            flex
            items-center
            justify-between
            gap-3
            bg-[#26364a]
            px-5
            py-4
          "
        >
          <div
            className="
              flex
              items-center
              gap-3
            "
          >
            <div
              className="
                flex
                h-9
                w-9
                items-center
                justify-center
                rounded-lg
                bg-white/10
                text-xl
              "
            >
              ✉️
            </div>

            <div>
              <div
                className="
                  text-[9px]
                  font-black
                  tracking-[0.15em]
                  text-white/35
                "
              >
                GAMJA OFFICE MAIL
              </div>

              <div
                className="
                  mt-0.5
                  text-[14px]
                  font-black
                  text-white
                "
              >
                받은 메일함
              </div>
            </div>
          </div>

          <div
            className="
              rounded-full
              bg-white/10
              px-3
              py-1.5
              text-[9px]
              font-black
              text-white/60
            "
          >
            {success
              ? "정리 완료"
              : `${sortedIds.length} / ${mails.length}`}
          </div>
        </div>

        {/* =================================================
            Progress
        ================================================= */}

        <div
          className="
            border-b
            border-black/5
            bg-white
            px-5
            py-3
          "
        >
          <div
            className="
              flex
              items-center
              justify-between
            "
          >
            <span
              className="
                text-[9px]
                font-black
                tracking-[0.12em]
                text-black/30
              "
            >
              MAIL CLEANUP
            </span>

            <span
              className="
                text-[9px]
                font-black
                text-black/40
              "
            >
              {progress}%
            </span>
          </div>

          <div
            className="
              mt-2
              h-1.5
              overflow-hidden
              rounded-full
              bg-black/5
            "
          >
            <div
              className="
                h-full
                rounded-full
                bg-blue-500
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
            Mail
        ================================================= */}

        {!success &&
        currentMail ? (
          <div className="p-5">
            <div
              className="
                overflow-hidden
                rounded-xl
                border
                border-black/10
                bg-white
                shadow-sm
              "
            >
              {/* Mail Toolbar */}

              <div
                className="
                  flex
                  items-center
                  gap-2
                  border-b
                  border-black/5
                  bg-[#fafafa]
                  px-4
                  py-2
                "
              >
                <div
                  className="
                    h-2
                    w-2
                    rounded-full
                    bg-red-400
                  "
                />

                <div
                  className="
                    h-2
                    w-2
                    rounded-full
                    bg-yellow-400
                  "
                />

                <div
                  className="
                    h-2
                    w-2
                    rounded-full
                    bg-emerald-400
                  "
                />

                <div
                  className="
                    ml-auto
                    text-[8px]
                    font-bold
                    text-black/25
                  "
                >
                  MESSAGE
                  {" "}
                  {currentIndex + 1}
                  /
                  {mails.length}
                </div>
              </div>

              {/* Subject */}

              <div
                className="
                  border-b
                  border-black/5
                  px-5
                  py-4
                "
              >
                <div
                  className="
                    text-[16px]
                    font-black
                    leading-6
                    text-black/80
                  "
                >
                  {
                    currentMail.subject
                  }
                </div>

                <div
                  className="
                    mt-4
                    flex
                    items-center
                    justify-between
                    gap-3
                  "
                >
                  <div
                    className="
                      flex
                      items-center
                      gap-2
                    "
                  >
                    <div
                      className="
                        flex
                        h-8
                        w-8
                        items-center
                        justify-center
                        rounded-full
                        bg-blue-100
                        text-[14px]
                      "
                    >
                      👤
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
                          currentMail.sender
                        }
                      </div>

                      <div
                        className="
                          text-[8px]
                          text-black/30
                        "
                      >
                        to me
                      </div>
                    </div>
                  </div>

                  <div
                    className="
                      text-[9px]
                      font-semibold
                      text-black/30
                    "
                  >
                    {
                      currentMail.time
                    }
                  </div>
                </div>
              </div>

              {/* Content */}

              <div
                className="
                  min-h-[145px]
                  px-5
                  py-5
                "
              >
                <div
                  className="
                    text-[11px]
                    font-medium
                    leading-6
                    text-black/60
                  "
                >
                  안녕하세요.
                </div>

                <div
                  className="
                    mt-3
                    text-[11px]
                    font-medium
                    leading-6
                    text-black/60
                  "
                >
                  {
                    currentMail.content
                  }
                </div>

                <div
                  className="
                    mt-5
                    text-[10px]
                    text-black/35
                  "
                >
                  감사합니다.
                  <br />
                  {
                    currentMail.sender
                  }
                </div>
              </div>
            </div>

            {/* =============================================
                Categories
            ============================================= */}

            <div
              className="
                mt-5
                grid
                grid-cols-3
                gap-2
              "
            >
              {(
                Object.keys(
                  CATEGORY_META
                ) as MailCategory[]
              ).map(
                category => {
                  const meta =
                    CATEGORY_META[
                      category
                    ];

                  const wrong =
                    wrongCategory ===
                    category;

                  return (
                    <button
                      key={
                        category
                      }
                      type="button"
                      onClick={() =>
                        handleSort(
                          category
                        )
                      }
                      className={`
                        min-h-[90px]
                        rounded-xl
                        border-2
                        p-3
                        text-center
                        transition
                        active:scale-[0.97]

                        ${
                          wrong
                            ? `
                              border-red-500
                              bg-red-50
                            `
                            : category ===
                                "urgent"
                              ? `
                                border-red-200
                                bg-red-50
                                hover:border-red-400
                              `
                              : category ===
                                  "normal"
                                ? `
                                  border-blue-200
                                  bg-blue-50
                                  hover:border-blue-400
                                `
                                : `
                                  border-zinc-200
                                  bg-zinc-50
                                  hover:border-zinc-400
                                `
                        }
                      `}
                    >
                      <div
                        className="
                          text-[25px]
                        "
                      >
                        {
                          meta.icon
                        }
                      </div>

                      <div
                        className="
                          mt-1
                          text-[11px]
                          font-black
                          text-black/70
                        "
                      >
                        {
                          meta.label
                        }
                      </div>

                      <div
                        className="
                          mt-1
                          hidden
                          text-[7px]
                          font-semibold
                          leading-3
                          text-black/35
                          sm:block
                        "
                      >
                        {
                          meta.description
                        }
                      </div>
                    </button>
                  );
                }
              )}
            </div>

            {/* =============================================
                Message
            ============================================= */}

            <div
              className="
                mt-4
                min-h-[22px]
                text-center
                text-[10px]
                font-bold
              "
            >
              <span
                className={
                  message.includes(
                    "아닌"
                  )
                    ? "text-red-500"
                    : "text-black/45"
                }
              >
                {message}
              </span>
            </div>
          </div>
        ) : (
          /* =================================================
             Complete
          ================================================= */

          <div
            className="
              flex
              min-h-[390px]
              flex-col
              items-center
              justify-center
              p-8
              text-center
            "
          >
            <div
              className="
                flex
                h-20
                w-20
                items-center
                justify-center
                rounded-full
                bg-emerald-100
                text-[40px]
              "
            >
              📬
            </div>

            <div
              className="
                mt-5
                text-[20px]
                font-black
                text-black/75
              "
            >
              메일함 정리 완료!
            </div>

            <div
              className="
                mt-2
                text-[11px]
                font-semibold
                leading-5
                text-black/40
              "
            >
              모든 메일을 알맞은
              <br />
              분류함으로 이동했습니다.
            </div>

            <div
              className="
                mt-5
                rounded-full
                bg-emerald-500
                px-4
                py-2
                text-[10px]
                font-black
                text-white
              "
            >
              ✓ TASK COMPLETE
            </div>
          </div>
        )}
      </div>

      {/* =================================================
          Help
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
          메일의
          <strong className="mx-1 text-black/60">
            발신자 · 제목 · 내용
          </strong>
          을 확인하고
          `긴급`, `일반`, `스팸` 중 하나를 선택하세요.
        </div>
      )}
    </div>
  );
}