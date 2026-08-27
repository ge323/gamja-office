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

type Department =
  | "hr"
  | "finance"
  | "development";

type ArchiveDocument = {
  id: string;

  title: string;

  description: string;

  department:
    Department;

  icon: string;
};

/* =========================================================
   Department Meta
========================================================= */

const DEPARTMENT_META: Record<
  Department,
  {
    label: string;
    icon: string;
    description: string;
  }
> = {
  hr: {
    label:
      "인사팀",

    icon:
      "👥",

    description:
      "인사 · 채용 · 근태",
  },

  finance: {
    label:
      "회계팀",

    icon:
      "💰",

    description:
      "정산 · 비용 · 세금",
  },

  development: {
    label:
      "개발팀",

    icon:
      "💻",

    description:
      "개발 · 장애 · 배포",
  },
};

/* =========================================================
   Document Problems
========================================================= */

const DOCUMENT_POOL:
  ArchiveDocument[] = [
  {
    id:
      "annual-leave",

    title:
      "연차 신청서",

    description:
      "직원 연차 사용 승인 요청",

    department:
      "hr",

    icon:
      "🗓️",
  },

  {
    id:
      "resume",

    title:
      "입사지원서",

    description:
      "신입 개발자 채용 지원서",

    department:
      "hr",

    icon:
      "📄",
  },

  {
    id:
      "attendance",

    title:
      "근태 현황표",

    description:
      "월간 출퇴근 기록",

    department:
      "hr",

    icon:
      "⏰",
  },

  {
    id:
      "expense",

    title:
      "법인카드 사용내역",

    description:
      "출장비 및 회의비 정산 자료",

    department:
      "finance",

    icon:
      "💳",
  },

  {
    id:
      "tax",

    title:
      "세금계산서",

    description:
      "외부 업체 거래 증빙 자료",

    department:
      "finance",

    icon:
      "🧾",
  },

  {
    id:
      "budget",

    title:
      "분기 예산안",

    description:
      "부서별 예산 편성 자료",

    department:
      "finance",

    icon:
      "📊",
  },

  {
    id:
      "bug-report",

    title:
      "서비스 오류 보고서",

    description:
      "로그인 장애 발생 내역",

    department:
      "development",

    icon:
      "🐛",
  },

  {
    id:
      "deploy",

    title:
      "배포 체크리스트",

    description:
      "운영 서버 배포 전 확인 항목",

    department:
      "development",

    icon:
      "🚀",
  },

  {
    id:
      "api-spec",

    title:
      "API 명세서",

    description:
      "신규 기능 연동 규격 문서",

    department:
      "development",

    icon:
      "🔧",
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
      copied[
        index
      ],
      copied[
        randomIndex
      ],
    ] = [
      copied[
        randomIndex
      ],
      copied[
        index
      ],
    ];
  }

  return copied;
}

/* =========================================================
   ArchiveMission
========================================================= */

export default function ArchiveMission({
  onComplete,
}: Props) {
  /* =======================================================
     Documents

     매번 전체 9개 중 6개 랜덤 선택
  ======================================================= */

  const documents =
    useMemo(
      () =>
        shuffleArray(
          DOCUMENT_POOL
        ).slice(
          0,
          6
        ),
      []
    );

  /* =======================================================
     Selected Document
  ======================================================= */

  const [
    selectedDocumentId,
    setSelectedDocumentId,
  ] =
    useState<
      string | null
    >(
      documents[0]
        ?.id ??
        null
    );

  /* =======================================================
     Sorted
  ======================================================= */

  const [
    sortedDocumentIds,
    setSortedDocumentIds,
  ] =
    useState<
      string[]
    >([]);

  /* =======================================================
     Message
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
    wrongDepartment,
    setWrongDepartment,
  ] =
    useState<
      Department | null
    >(
      null
    );

  /* =======================================================
     Current Document
  ======================================================= */

  const selectedDocument =
    documents.find(
      document =>
        document.id ===
        selectedDocumentId
    ) ??
    null;

  /* =======================================================
     Remaining Documents
  ======================================================= */

  const remainingDocuments =
    documents.filter(
      document =>
        !sortedDocumentIds.includes(
          document.id
        )
    );

  /* =======================================================
     Progress
  ======================================================= */

  const progress =
    documents.length ===
    0
      ? 0
      : Math.round(
          (
            sortedDocumentIds.length /
            documents.length
          ) *
            100
        );

  /* =======================================================
     Select Next
  ======================================================= */

  function selectNextDocument(
    completedId:
      string
  ) {
    const nextDocument =
      documents.find(
        document =>
          document.id !==
            completedId &&
          !sortedDocumentIds.includes(
            document.id
          )
      );

    setSelectedDocumentId(
      nextDocument
        ?.id ??
        null
    );
  }

  /* =======================================================
     Sort
  ======================================================= */

  function handleSort(
    department:
      Department
  ) {
    if (
      !selectedDocument ||
      success
    ) {
      return;
    }

    /* =====================================
       Wrong
    ===================================== */

    if (
      selectedDocument.department !==
      department
    ) {
      setWrongDepartment(
        department
      );

      setMessage(
        `${DEPARTMENT_META[department].label} 문서가 아닌 것 같습니다.`
      );

      window.setTimeout(
        () => {
          setWrongDepartment(
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

    const nextSortedIds =
      [
        ...sortedDocumentIds,
        selectedDocument.id,
      ];

    setSortedDocumentIds(
      nextSortedIds
    );

    setMessage(
      `${selectedDocument.title} → ${DEPARTMENT_META[department].label} 정리 완료`
    );

    /* =====================================
       Mission Complete
    ===================================== */

    if (
      nextSortedIds.length ===
      documents.length
    ) {
      setSuccess(
        true
      );

      setSelectedDocumentId(
        null
      );

      setMessage(
        "모든 문서 분류가 완료되었습니다!"
      );

      window.setTimeout(
        () => {
          onComplete();
        },
        1200
      );

      return;
    }

    /*
     * 현재 sortedDocumentIds는 아직 이전 state이기 때문에
     * nextSortedIds를 기준으로 다음 문서를 직접 찾는다.
     */
    const nextDocument =
      documents.find(
        document =>
          !nextSortedIds.includes(
            document.id
          )
      );

    setSelectedDocumentId(
      nextDocument
        ?.id ??
        null
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
          Progress
      ================================================= */}

      <div
        className="
          mb-5

          rounded-xl

          border
          border-black/10

          bg-white

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
                text-[10px]
                font-black

                tracking-[0.14em]

                text-black/35
              "
            >
              ARCHIVE STATUS
            </div>

            <div
              className="
                mt-1

                text-[14px]
                font-black

                text-black/75
              "
            >
              📁 자료실 문서 정리
            </div>
          </div>

          <div
            className="
              text-right
            "
          >
            <div
              className="
                text-[18px]
                font-black

                text-black/75
              "
            >
              {
                sortedDocumentIds.length
              }
              /
              {
                documents.length
              }
            </div>

            <div
              className="
                text-[9px]

                text-black/35
              "
            >
              정리 완료
            </div>
          </div>
        </div>

        <div
          className="
            mt-3

            h-2

            overflow-hidden

            rounded-full

            bg-black/5
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
          Main Layout
      ================================================= */}

      <div
        className="
          grid

          grid-cols-1

          gap-4

          md:grid-cols-[1fr_210px]
        "
      >
        {/* =============================================
            Current Document
        ============================================= */}

        <div
          className="
            rounded-2xl

            bg-[#d8c5a5]

            p-5

            shadow-inner
          "
        >
          <div
            className="
              text-[10px]
              font-black

              tracking-[0.16em]

              text-black/35
            "
          >
            DOCUMENT DESK
          </div>

          {!success &&
          selectedDocument ? (
            <div
              className="
                mt-4

                flex

                min-h-[250px]

                items-center
                justify-center
              "
            >
              <div
                className="
                  relative

                  w-full
                  max-w-[310px]

                  rotate-[-1deg]

                  border

                  border-black/10

                  bg-[#fffdf7]

                  p-5

                  shadow-[0_12px_28px_rgba(0,0,0,0.16)]
                "
              >
                {/* Paper Clip */}

                <div
                  className="
                    absolute

                    right-4
                    top-[-8px]

                    h-8
                    w-3

                    rotate-[8deg]

                    rounded-full

                    border-2
                    border-zinc-400
                  "
                />

                <div
                  className="
                    text-[38px]
                  "
                >
                  {
                    selectedDocument.icon
                  }
                </div>

                <div
                  className="
                    mt-3

                    text-[18px]
                    font-black

                    text-black/80
                  "
                >
                  {
                    selectedDocument.title
                  }
                </div>

                <div
                  className="
                    mt-2

                    text-[11px]
                    font-semibold
                    leading-5

                    text-black/45
                  "
                >
                  {
                    selectedDocument.description
                  }
                </div>

                <div
                  className="
                    mt-5

                    border-t
                    border-dashed
                    border-black/15

                    pt-4

                    text-[9px]
                    font-bold

                    tracking-[0.1em]

                    text-black/30
                  "
                >
                  GAMJA OFFICE
                  INTERNAL DOCUMENT
                </div>
              </div>
            </div>
          ) : (
            <div
              className="
                flex

                min-h-[250px]

                flex-col

                items-center
                justify-center

                text-center
              "
            >
              <div
                className="
                  text-[50px]
                "
              >
                ✅
              </div>

              <div
                className="
                  mt-3

                  text-[18px]
                  font-black

                  text-black/75
                "
              >
                자료실 정리 완료!
              </div>

              <div
                className="
                  mt-1

                  text-[11px]

                  text-black/40
                "
              >
                모든 문서를 알맞은 파일함에 넣었습니다.
              </div>
            </div>
          )}

          {/* =============================================
              Waiting Documents
          ============================================= */}

          {!success && (
            <div
              className="
                mt-4

                flex

                flex-wrap

                gap-2
              "
            >
              {remainingDocuments.map(
                document => {
                  const selected =
                    document.id ===
                    selectedDocumentId;

                  return (
                    <button
                      key={
                        document.id
                      }
                      type="button"
                      onClick={() => {
                        setSelectedDocumentId(
                          document.id
                        );

                        setMessage(
                          ""
                        );
                      }}
                      className={`
                        flex

                        items-center
                        gap-1.5

                        rounded-lg

                        border

                        px-2.5
                        py-2

                        text-[10px]
                        font-bold

                        transition

                        ${
                          selected
                            ? `
                              border-black
                              bg-black
                              text-white
                            `
                            : `
                              border-black/10
                              bg-white/70
                              text-black/55

                              hover:bg-white
                            `
                        }
                      `}
                    >
                      <span>
                        {
                          document.icon
                        }
                      </span>

                      <span>
                        {
                          document.title
                        }
                      </span>
                    </button>
                  );
                }
              )}
            </div>
          )}
        </div>

        {/* =============================================
            Filing Cabinet
        ============================================= */}

        <div
          className="
            rounded-2xl

            border-[5px]
            border-[#5b4937]

            bg-[#876d50]

            p-3

            shadow-[inset_0_0_0_2px_rgba(255,255,255,0.08)]
          "
        >
          <div
            className="
              mb-3

              text-center

              text-[10px]
              font-black

              tracking-[0.12em]

              text-white/60
            "
          >
            FILE CABINET
          </div>

          <div
            className="
              space-y-3
            "
          >
            {(
              Object.keys(
                DEPARTMENT_META
              ) as Department[]
            ).map(
              department => {
                const meta =
                  DEPARTMENT_META[
                    department
                  ];

                const wrong =
                  wrongDepartment ===
                  department;

                return (
                  <button
                    key={
                      department
                    }
                    type="button"
                    disabled={
                      success
                    }
                    onClick={() =>
                      handleSort(
                        department
                      )
                    }
                    className={`
                      relative

                      w-full

                      overflow-hidden

                      rounded-lg

                      border-2

                      bg-[#c9ad83]

                      p-3

                      text-left

                      shadow

                      transition

                      active:scale-[0.98]

                      ${
                        wrong
                          ? `
                            border-red-500
                            bg-red-100
                            animate-[shake_0.2s_ease-in-out_0s_2]
                          `
                          : `
                            border-[#564432]

                            hover:bg-[#d5bd98]
                          `
                      }

                      disabled:cursor-default
                      disabled:opacity-50
                    `}
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

                          rounded-md

                          bg-white/50

                          text-lg
                        "
                      >
                        {
                          meta.icon
                        }
                      </div>

                      <div>
                        <div
                          className="
                            text-[12px]
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
                            mt-0.5

                            text-[8px]
                            font-semibold

                            text-black/35
                          "
                        >
                          {
                            meta.description
                          }
                        </div>
                      </div>
                    </div>

                    {/* Drawer Handle */}

                    <div
                      className="
                        absolute

                        bottom-2
                        right-3

                        h-1.5
                        w-7

                        rounded-full

                        bg-[#6b5540]/60
                      "
                    />
                  </button>
                );
              }
            )}
          </div>
        </div>
      </div>

      {/* =================================================
          Status Message
      ================================================= */}

      <div
        className="
          mt-4

          min-h-[24px]

          text-center

          text-[11px]
          font-bold
        "
      >
        {message && (
          <span
            className={
              success
                ? "text-emerald-600"
                : message.includes(
                      "아닌"
                    )
                  ? "text-red-500"
                  : "text-black/50"
            }
          >
            {
              message
            }
          </span>
        )}
      </div>

      {/* =================================================
          Instruction
      ================================================= */}

      {!success && (
        <div
          className="
            mt-1

            rounded-lg

            bg-black/5

            px-3
            py-2.5

            text-center

            text-[9px]
            font-semibold
            leading-4

            text-black/40
          "
        >
          문서를 선택한 뒤,
          오른쪽의 알맞은 부서 파일함을 선택하세요.
        </div>
      )}
    </div>
  );
}