"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";

/* =========================================================
   Types
========================================================= */

export type ChatMessage = {
  id: string;

  type:
  | "chat"
  | "system";

  playerId?: string;

  nickname?: string;

  message: string;

  createdAt: number;
};

type ChatPanelProps = {
  messages: ChatMessage[];

  onSend: (
    message: string
  ) => void;
};

/* =========================================================
   ChatPanel
========================================================= */

export default function ChatPanel({
  messages,
  onSend,
}: ChatPanelProps) {
  const [
    input,
    setInput,
  ] =
    useState("");

  const [
    isAtBottom,
    setIsAtBottom,
  ] =
    useState(true);

  const scrollRef =
    useRef<HTMLDivElement | null>(
      null
    );

  /* ======================================================
     스크롤 위치 확인
  ====================================================== */

  const checkScrollPosition =
    () => {
      const element =
        scrollRef.current;

      if (!element) {
        return;
      }

      const distanceFromBottom =
        element.scrollHeight -
        element.scrollTop -
        element.clientHeight;

      setIsAtBottom(
        distanceFromBottom <
        20
      );
    };

  /* ======================================================
     처음에는 최신 채팅으로
  ====================================================== */

  useEffect(() => {
    const element =
      scrollRef.current;

    if (!element) {
      return;
    }

    element.scrollTop =
      element.scrollHeight;
  }, []);

  /* ======================================================
     새 메시지 자동 스크롤
  ====================================================== */

  useEffect(() => {
    const element =
      scrollRef.current;

    if (
      !element ||
      !isAtBottom
    ) {
      return;
    }

    window.requestAnimationFrame(
      () => {
        element.scrollTo({
          top:
            element.scrollHeight,

          behavior:
            "smooth",
        });
      }
    );
  }, [
    messages,
    isAtBottom,
  ]);

  /* ======================================================
     메시지 보내기
  ====================================================== */

  const handleSend =
    () => {
      const message =
        input
          .trim()
          .slice(
            0,
            100
          );

      if (!message) {
        return;
      }

      onSend(
        message
      );

      setInput("");

      setIsAtBottom(
        true
      );

      window.setTimeout(
        () => {
          const element =
            scrollRef.current;

          if (!element) {
            return;
          }

          element.scrollTo({
            top:
              element.scrollHeight,

            behavior:
              "smooth",
          });
        },
        30
      );
    };

  /* ======================================================
     마우스 휠
  ====================================================== */

  const handleWheel = (
    event:
      React.WheelEvent<HTMLDivElement>
  ) => {
    const element =
      scrollRef.current;

    if (!element) {
      return;
    }

    /*
     * 게임 화면까지 휠 이벤트가 전달되지 않게 차단
     */
    event.stopPropagation();

    element.scrollTop +=
      event.deltaY;

    window.requestAnimationFrame(
      checkScrollPosition
    );
  };

  /* ======================================================
     최신 대화
  ====================================================== */

  const moveToLatest =
    () => {
      const element =
        scrollRef.current;

      if (!element) {
        return;
      }

      element.scrollTo({
        top:
          element.scrollHeight,

        behavior:
          "smooth",
      });

      setIsAtBottom(
        true
      );
    };

  /* ======================================================
     Render
  ====================================================== */

  return (
    <div
      data-no-move
      className="
        absolute
        bottom-[18px]
        left-[18px]
        z-[5000]
        w-[340px]
        max-w-[calc(100vw-36px)]
      "

      /*
       * 이 영역을 클릭했을 때
       * GameWorld의 이동 클릭으로 전달되지 않게 차단
       */
      onPointerDown={(
        event
      ) => {
        event.stopPropagation();
      }}

      onMouseDown={(
        event
      ) => {
        event.stopPropagation();
      }}

      onClick={(
        event
      ) => {
        event.stopPropagation();
      }}
    >
      {/* =========================================
          채팅창
      ========================================= */}

      <div
        className="
          relative
          mb-2
          h-[155px]
          overflow-hidden
          rounded-lg
          bg-black/35
          shadow-md
          backdrop-blur-[2px]
        "
      >
        {/* =====================================
            채팅 내용
        ===================================== */}

        <div
          ref={
            scrollRef
          }

          onScroll={
            checkScrollPosition
          }

          onWheel={
            handleWheel
          }

          onPointerDown={(
            event
          ) => {
            event.stopPropagation();
          }}

          onMouseDown={(
            event
          ) => {
            event.stopPropagation();
          }}

          onClick={(
            event
          ) => {
            event.stopPropagation();
          }}

          className="
            h-full
            overflow-y-auto
            px-3
            py-3
            text-[11px]
            leading-[19px]

            [scrollbar-width:none]
            [-ms-overflow-style:none]

            [&::-webkit-scrollbar]:hidden
          "
        >
          {messages.length ===
            0 ? (
            <div
              className="
                text-white/40
              "
            >
              아직 대화가 없습니다.
            </div>
          ) : (
            messages.map(
              message => {
                /* =============================
                   시스템 메시지
                ============================= */

                if (
                  message.type ===
                  "system"
                ) {
                  return (
                    <div
                      key={
                        message.id
                      }
                      className="
                        text-[10px]
                        text-amber-300/80
                      "
                    >
                      {
                        message.message
                      }
                    </div>
                  );
                }

                /* =============================
                   일반 채팅
                ============================= */

                return (
                  <div
                    key={
                      message.id
                    }
                    className="
                      break-words
                      text-white/90
                    "
                  >
                    <span
                      className="
                        font-semibold
                        text-emerald-300
                      "
                    >
                      {
                        message.nickname
                      }{" "}
                      감자
                    </span>

                    <span
                      className="
                        text-white/40
                      "
                    >
                      :
                    </span>{" "}

                    <span>
                      {
                        message.message
                      }
                    </span>
                  </div>
                );
              }
            )
          )}
        </div>

        {/* =====================================
            최신 대화 버튼
        ===================================== */}

        {!isAtBottom && (
          <button
            type="button"

            onPointerDown={(
              event
            ) => {
              event.stopPropagation();
            }}

            onMouseDown={(
              event
            ) => {
              event.stopPropagation();
            }}

            onClick={(
              event
            ) => {
              event.stopPropagation();

              moveToLatest();
            }}

            className="
              absolute
              bottom-[7px]
              left-1/2
              z-20
              -translate-x-1/2

              rounded-full

              border
              border-white/10

              bg-black/80

              px-3
              py-1

              text-[9px]
              font-medium
              text-white/80

              shadow

              transition

              hover:bg-black
              hover:text-white
            "
          >
            최신 대화 ↓
          </button>
        )}
      </div>

      {/* =========================================
          채팅 입력창
      ========================================= */}

      <form
        data-no-move

        onSubmit={(
          event
        ) => {
          event.preventDefault();
          event.stopPropagation();

          handleSend();
        }}

        onPointerDown={(
          event
        ) => {
          event.stopPropagation();
        }}

        onMouseDown={(
          event
        ) => {
          event.stopPropagation();
        }}

        onClick={(
          event
        ) => {
          event.stopPropagation();
        }}

        className="
          flex
          overflow-hidden

          rounded-lg

          border
          border-white/10

          bg-black/60

          shadow-md

          backdrop-blur-[2px]
        "
      >
        <input
          value={
            input
          }

          onChange={(
            event
          ) => {
            setInput(
              event.target.value
            );
          }}

          /* =====================================
             중요:
             키보드 이벤트가 GameWorld로 전달되면
             WASD / E / Q 등의 게임 단축키와 충돌할 수 있음
          ===================================== */

          onKeyDown={(
            event
          ) => {
            event.stopPropagation();

            if (
              event.key ===
              "Enter" &&
              !event.nativeEvent
                .isComposing
            ) {
              event.preventDefault();

              handleSend();
            }
          }}

          onKeyUp={(
            event
          ) => {
            event.stopPropagation();
          }}

          onKeyPress={(
            event
          ) => {
            event.stopPropagation();
          }}

          onPointerDown={(
            event
          ) => {
            event.stopPropagation();
          }}

          onPointerUp={(
            event
          ) => {
            event.stopPropagation();
          }}

          onMouseDown={(
            event
          ) => {
            event.stopPropagation();
          }}

          onMouseUp={(
            event
          ) => {
            event.stopPropagation();
          }}

          onClick={(
            event
          ) => {
            event.stopPropagation();
          }}

          maxLength={
            100
          }

          autoComplete="off"

          placeholder="대화를 입력하세요..."

          className="
            min-w-0
            flex-1

            bg-transparent

            px-3
            py-2

            text-[11px]
            text-white

            outline-none

            placeholder:text-white/35
          "
        />

        <button
          type="submit"

          disabled={
            !input.trim()
          }

          onPointerDown={(
            event
          ) => {
            event.stopPropagation();
          }}

          onMouseDown={(
            event
          ) => {
            event.stopPropagation();
          }}

          onClick={(
            event
          ) => {
            event.stopPropagation();
          }}

          className="
            border-l
            border-white/10

            px-3

            text-[9px]
            font-medium
            text-white/60

            transition

            hover:bg-white/10
            hover:text-white

            disabled:cursor-not-allowed
            disabled:opacity-30
          "
        >
          Enter
        </button>
      </form>
    </div>
  );
}