"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  io,
  type Socket,
} from "socket.io-client";

import Potato from "@/components/character/Potato";

import type {
  CharacterStyle,
} from "@/components/character/CharacterCustomizer";

import OfficeMap, {
  type OfficeInteraction,
  type OfficeInteractionType,
} from "@/components/game/OfficeMap";

import InteractionBubble from "@/components/game/InteractionBubble";

/* =========================================================
   Types
========================================================= */

type Position = {
  x: number;
  y: number;
};

type GameWorldProps = {
  nickname: string;

  characterStyle:
    CharacterStyle;
};

type RemotePlayer = {
  id: string;

  nickname: string;

  x: number;

  y: number;

  characterStyle:
    CharacterStyle;

  moveDuration?: number;
};

/* =========================================================
   World
========================================================= */

const WORLD_WIDTH =
  1100;

const WORLD_HEIGHT =
  650;

/* =========================================================
   Player
========================================================= */

const PLAYER_SPEED =
  260;

const MIN_MOVE_TIME =
  180;

const MAX_MOVE_TIME =
  1800;

/* =========================================================
   Socket Server
========================================================= */

const SOCKET_URL =
  "http://localhost:4000";

/* =========================================================
   이름
========================================================= */

function getDisplayName(
  nickname: string
) {
  const trimmed =
    nickname.trim();

  return trimmed
    ? `${trimmed} 감자`
    : "감자";
}

/* =========================================================
   GameWorld
========================================================= */

export default function GameWorld({
  nickname,
  characterStyle,
}: GameWorldProps) {
  /* ======================================================
     Refs
  ====================================================== */

  const containerRef =
    useRef<HTMLDivElement | null>(
      null
    );

  const worldRef =
    useRef<HTMLDivElement | null>(
      null
    );

  const socketRef =
    useRef<Socket | null>(
      null
    );

  const moveTimerRef =
    useRef<number | null>(
      null
    );

  const interactionTimerRef =
    useRef<number | null>(
      null
    );

  const pendingInteractionRef =
    useRef<OfficeInteractionType | null>(
      null
    );

  /* ======================================================
     Scale
  ====================================================== */

  const [
    scale,
    setScale,
  ] =
    useState(1);

  /* ======================================================
     내 Socket ID
  ====================================================== */

  const [
    mySocketId,
    setMySocketId,
  ] =
    useState("");

  /* ======================================================
     다른 플레이어
  ====================================================== */

  const [
    remotePlayers,
    setRemotePlayers,
  ] =
    useState<
      RemotePlayer[]
    >([]);

  /* ======================================================
     내 위치
  ====================================================== */

  const [
    position,
    setPosition,
  ] =
    useState<Position>({
      x: 735,
      y: 565,
    });

  const [
    moving,
    setMoving,
  ] =
    useState(false);

  const [
    moveDuration,
    setMoveDuration,
  ] =
    useState(600);

  /* ======================================================
     상호작용 말풍선
  ====================================================== */

  const [
    interactionMessage,
    setInteractionMessage,
  ] =
    useState("");

  /* ======================================================
     Socket 연결
  ====================================================== */

  useEffect(() => {
    const socket =
      io(
        SOCKET_URL,
        {
          transports: [
            "websocket",
          ],
        }
      );

    socketRef.current =
      socket;

    /* =====================================
       연결 성공
    ===================================== */

    socket.on(
      "connect",
      () => {
        console.log(
          "🥔 서버 연결:",
          socket.id
        );

        setMySocketId(
          socket.id ?? ""
        );

        /* ===============================
           입장 정보 전송
        =============================== */

        socket.emit(
          "player:join",
          {
            nickname,

            x:
              position.x,

            y:
              position.y,

            characterStyle,
          }
        );
      }
    );

    /* =====================================
       전체 플레이어 목록
    ===================================== */

    socket.on(
      "players:update",
      (
        players:
          RemotePlayer[]
      ) => {
        setRemotePlayers(
          players
        );
      }
    );

    /* =====================================
       다른 플레이어 이동
    ===================================== */

    socket.on(
      "player:moved",
      (data: {
        id: string;
        x: number;
        y: number;
        duration: number;
      }) => {
        setRemotePlayers(
          previous =>
            previous.map(
              player =>
                player.id ===
                data.id
                  ? {
                      ...player,

                      x:
                        data.x,

                      y:
                        data.y,

                      moveDuration:
                        data.duration,
                    }
                  : player
            )
        );
      }
    );

    /* =====================================
       연결 종료
    ===================================== */

    socket.on(
      "disconnect",
      () => {
        console.log(
          "서버 연결 종료"
        );
      }
    );

    /* =====================================
       Cleanup
    ===================================== */

    return () => {
      socket.disconnect();

      socketRef.current =
        null;
    };

    /*
     * 게임 입장할 때 한 번만 연결
     */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ======================================================
     꾸미기 정보 서버 동기화
  ====================================================== */

  useEffect(() => {
    const socket =
      socketRef.current;

    if (
      !socket ||
      !socket.connected
    ) {
      return;
    }

    socket.emit(
      "player:style",
      characterStyle
    );
  }, [
    characterStyle,
  ]);

  /* ======================================================
     반응형 Scale
  ====================================================== */

  useEffect(() => {
    const updateScale =
      () => {
        const container =
          containerRef.current;

        if (!container) {
          return;
        }

        const availableWidth =
          container.clientWidth;

        const nextScale =
          Math.min(
            1,

            availableWidth /
              WORLD_WIDTH
          );

        setScale(
          nextScale
        );
      };

    updateScale();

    window.addEventListener(
      "resize",
      updateScale
    );

    return () => {
      window.removeEventListener(
        "resize",
        updateScale
      );
    };
  }, []);

  /* ======================================================
     말풍선
  ====================================================== */

  const showInteraction = (
    text: string
  ) => {
    setInteractionMessage(
      text
    );

    if (
      interactionTimerRef.current
    ) {
      window.clearTimeout(
        interactionTimerRef.current
      );
    }

    interactionTimerRef.current =
      window.setTimeout(
        () => {
          setInteractionMessage(
            ""
          );
        },
        2200
      );
  };

  /* ======================================================
     랜덤 메시지
  ====================================================== */

  const getRandomMessage = (
    messages: string[]
  ) => {
    const index =
      Math.floor(
        Math.random() *
          messages.length
      );

    return messages[
      index
    ];
  };

  /* ======================================================
     오브젝트 상호작용
  ====================================================== */

  const executeInteraction = (
    type:
      OfficeInteractionType
  ) => {
    /* =====================================
       커피
    ===================================== */

    if (
      type ===
      "coffee"
    ) {
      const messages = [
        "☕ 커피 충전 완료!",
        "☕ 역시 회사는 커피지.",
        "☕ 따뜻하다...",
        "☕ 한 잔만 더 마실까?",
        "⚡ 카페인이 온몸에 퍼진다!",
        "☕ 나는 이제 감자가 아니라 커피콩이다...",
        "😌 커피 한 모금의 여유.",
        "☕ 오늘 몇 잔째더라...?",
      ];

      showInteraction(
        getRandomMessage(
          messages
        )
      );

      return;
    }

    /* =====================================
       업무
    ===================================== */

    if (
      type ===
      "chair"
    ) {
      const messages = [
        "💻 열심히 일하는 중!",
        "💭 일하는 척하는 중...",
        "👀 팀장님 지나가신다. 집중!",
        "⌨️ 타닥타닥...",
        "🥱 퇴근하고 싶다...",
        "💼 오늘도 월급값 하는 감자.",
        "📊 이 자료는 언제 끝나지...",
        "🫠 집에 가고 싶다.",
        "🧠 갑자기 집중력이 생겼다!",
        "💭 점심 뭐 먹지?",
      ];

      showInteraction(
        getRandomMessage(
          messages
        )
      );

      return;
    }

    /* =====================================
       복사기
    ===================================== */

    if (
      type ===
      "copier"
    ) {
      const messages = [
        "📄 복사 완료!",
        "🖨️ 위이잉... 출력 완료.",
        "😵 용지가 걸렸습니다...",
        "🖨️ 왜 하필 지금 고장이지?",
        "📄 종이가 어디로 사라진 거지?",
        "🖨️ 복사기가 나를 싫어한다.",
        "📑 서류가 한 장 늘어났다.",
        "🖨️ 오늘은 말을 잘 듣네.",
      ];

      showInteraction(
        getRandomMessage(
          messages
        )
      );
    }
  };

  /* ======================================================
     공통 이동
  ====================================================== */

  const moveTo = (
    targetX: number,
    targetY: number,

    interaction:
      OfficeInteractionType | null =
      null
  ) => {
    const dx =
      targetX -
      position.x;

    const dy =
      targetY -
      position.y;

    const distance =
      Math.sqrt(
        dx * dx +
          dy * dy
      );

    /* =====================================
       이미 근처
    ===================================== */

    if (
      distance < 8
    ) {
      setMoving(
        false
      );

      if (
        interaction
      ) {
        executeInteraction(
          interaction
        );
      }

      return;
    }

    /* =====================================
       이동시간
    ===================================== */

    const calculatedDuration =
      (
        distance /
        PLAYER_SPEED
      ) *
      1000;

    const duration =
      Math.max(
        MIN_MOVE_TIME,

        Math.min(
          MAX_MOVE_TIME,
          calculatedDuration
        )
      );

    /* =====================================
       기존 이동 취소
    ===================================== */

    if (
      moveTimerRef.current
    ) {
      window.clearTimeout(
        moveTimerRef.current
      );
    }

    setInteractionMessage(
      ""
    );

    pendingInteractionRef.current =
      interaction;

    setMoveDuration(
      duration
    );

    setMoving(
      true
    );

    /* =====================================
       내 위치 변경
    ===================================== */

    setPosition({
      x:
        targetX,

      y:
        targetY,
    });

    /* =====================================
       ★ 다른 사람에게 이동 전달
    ===================================== */

    socketRef.current?.emit(
      "player:move",
      {
        x:
          targetX,

        y:
          targetY,

        duration,
      }
    );

    /* =====================================
       도착
    ===================================== */

    moveTimerRef.current =
      window.setTimeout(
        () => {
          setMoving(
            false
          );

          const pending =
            pendingInteractionRef.current;

          pendingInteractionRef.current =
            null;

          if (
            pending
          ) {
            executeInteraction(
              pending
            );
          }
        },
        duration
      );
  };

  /* ======================================================
     오브젝트 클릭
  ====================================================== */

  const handleInteract = (
    interaction:
      OfficeInteraction
  ) => {
    moveTo(
      interaction.targetX,
      interaction.targetY,
      interaction.type
    );
  };

  /* ======================================================
     바닥 클릭
  ====================================================== */

  const handleWorldClick = (
    event:
      React.MouseEvent<HTMLDivElement>
  ) => {
    const world =
      worldRef.current;

    if (!world) {
      return;
    }

    const clickedElement =
      event.target as HTMLElement;

    if (
      clickedElement.closest(
        "[data-no-move]"
      )
    ) {
      return;
    }

    const rect =
      world.getBoundingClientRect();

    let targetX =
      (
        event.clientX -
        rect.left
      ) /
      scale;

    let targetY =
      (
        event.clientY -
        rect.top
      ) /
      scale;

    /* =====================================
       경계
    ===================================== */

    targetX =
      Math.max(
        45,

        Math.min(
          WORLD_WIDTH -
            45,

          targetX
        )
      );

    targetY =
      Math.max(
        110,

        Math.min(
          WORLD_HEIGHT -
            25,

          targetY
        )
      );

    pendingInteractionRef.current =
      null;

    moveTo(
      targetX,
      targetY,
      null
    );
  };

  /* ======================================================
     Cleanup
  ====================================================== */

  useEffect(() => {
    return () => {
      if (
        moveTimerRef.current
      ) {
        window.clearTimeout(
          moveTimerRef.current
        );
      }

      if (
        interactionTimerRef.current
      ) {
        window.clearTimeout(
          interactionTimerRef.current
        );
      }
    };
  }, []);

  /* ======================================================
     다른 사용자만 추출
  ====================================================== */

  const otherPlayers =
    remotePlayers.filter(
      player =>
        player.id !==
        mySocketId
    );

  /* ======================================================
     Render
  ====================================================== */

  return (
    <div
      ref={
        containerRef
      }
      className="
        flex
        w-full
        justify-center
        overflow-hidden
        bg-[#ece7dd]
        px-4
        py-4
      "
    >
      <div
        style={{
          width:
            WORLD_WIDTH *
            scale,

          height:
            WORLD_HEIGHT *
            scale,
        }}
      >
        <div
          ref={
            worldRef
          }
          onClick={
            handleWorldClick
          }
          className="
            relative
            origin-top-left
            cursor-pointer
            overflow-hidden
            rounded-xl
            border-[6px]
            border-zinc-800
            bg-[#eadfc9]
            shadow-lg
          "
          style={{
            width:
              WORLD_WIDTH,

            height:
              WORLD_HEIGHT,

            transform:
              `scale(${scale})`,
          }}
        >
          {/* =========================================
              Office
          ========================================= */}

          <OfficeMap
            onInteract={
              handleInteract
            }
          />

          {/* =========================================
              다른 플레이어
          ========================================= */}

          {otherPlayers.map(
            player => (
              <div
                key={
                  player.id
                }
                className="
                  pointer-events-none
                  absolute
                "
                style={{
                  left:
                    player.x,

                  top:
                    player.y,

                  transform:
                    "translate(-50%, -100%)",

                  transitionProperty:
                    "left, top",

                  transitionDuration:
                    `${
                      player.moveDuration ??
                      300
                    }ms`,

                  transitionTimingFunction:
                    "linear",

                  zIndex:
                    Math.round(
                      player.y
                    ) +
                    100,
                }}
              >
                <Potato
                  name={
                    getDisplayName(
                      player.nickname
                    )
                  }
                  glasses={
                    player
                      .characterStyle
                      ?.glasses ??
                    "none"
                  }
                  hat={
                    player
                      .characterStyle
                      ?.hat ??
                    "none"
                  }
                  ribbon={
                    player
                      .characterStyle
                      ?.ribbon ??
                    false
                  }
                  tie={
                    player
                      .characterStyle
                      ?.tie ??
                    false
                  }
                  color={
                    player
                      .characterStyle
                      ?.color ??
                    "default"
                  }
                  moving={
                    false
                  }
                />
              </div>
            )
          )}

          {/* =========================================
              내 플레이어
          ========================================= */}

          <div
            className="absolute"
            style={{
              left:
                position.x,

              top:
                position.y,

              transform:
                "translate(-50%, -100%)",

              transitionProperty:
                "left, top",

              transitionDuration:
                `${moveDuration}ms`,

              transitionTimingFunction:
                "linear",

              zIndex:
                Math.round(
                  position.y
                ) +
                100,
            }}
          >
            <InteractionBubble
              text={
                interactionMessage
              }
            />

            <Potato
              name={
                getDisplayName(
                  nickname
                )
              }
              glasses={
                characterStyle.glasses
              }
              hat={
                characterStyle.hat
              }
              ribbon={
                characterStyle.ribbon
              }
              tie={
                characterStyle.tie
              }
              color={
                characterStyle.color
              }
              moving={
                moving
              }
            />
          </div>

          {/* =========================================
              접속 인원
          ========================================= */}

          <div
            data-no-move
            className="
              absolute
              right-[16px]
              bottom-[16px]
              z-[4000]
              rounded-lg
              border
              border-zinc-200
              bg-white/90
              px-3
              py-2
              text-[10px]
              text-zinc-500
              shadow-sm
            "
          >
            🟢{" "}
            {
              remotePlayers.length
            }
            명 접속
          </div>

          {/* =========================================
              안내
          ========================================= */}

          <div
            data-no-move
            className="
              absolute
              bottom-[35px]
              left-1/2
              z-[3000]
              -translate-x-1/2
              rounded-lg
              border
              border-zinc-200
              bg-white/90
              px-3
              py-2
              text-[10px]
              text-zinc-500
              shadow-sm
            "
          >
            바닥을 클릭해 이동하거나 사무실 물건을 눌러보세요.
          </div>
        </div>
      </div>
    </div>
  );
}