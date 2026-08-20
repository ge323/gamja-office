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

import ChatPanel, {
  type ChatMessage,
} from "@/components/game/ChatPanel";

/* =========================================================
   Types
========================================================= */

type Position = {
  x: number;
  y: number;
};

/*
 * page.tsx에서도 사용할 수 있도록 export
 */
export type OnlinePlayer = {
  id: string;
  nickname: string;
};

type GameWorldProps = {
  nickname: string;

  characterStyle:
    CharacterStyle;

  /*
   * 현재 접속자 목록을
   * page.tsx로 전달
   */
  onOnlinePlayersChange?: (
    players: OnlinePlayer[]
  ) => void;
};

type RemotePlayer = {
  id: string;

  nickname: string;

  x: number;

  y: number;

  characterStyle:
    CharacterStyle;

  moveDuration?: number;

  moving?: boolean;
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
   Socket
========================================================= */

const SOCKET_URL =
  "http://localhost:4000";

/* =========================================================
   Name
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
   Chat Bubble
========================================================= */

function PlayerChatBubble({
  text,
}: {
  text: string;
}) {
  if (!text) {
    return null;
  }

  return (
    <div
      className="
        pointer-events-none
        absolute
        bottom-[106px]
        left-1/2
        z-[9000]
        -translate-x-1/2
        whitespace-nowrap
      "
    >
      <div
        className="
          relative
          max-w-[210px]
          rounded-xl
          border
          border-zinc-200
          bg-white
          px-3
          py-2
          text-[11px]
          font-medium
          text-zinc-700
          shadow-md
        "
      >
        {text}

        <div
          className="
            absolute
            left-1/2
            top-full
            h-[8px]
            w-[8px]
            -translate-x-1/2
            -translate-y-1/2
            rotate-45
            border-b
            border-r
            border-zinc-200
            bg-white
          "
        />
      </div>
    </div>
  );
}

/* =========================================================
   GameWorld
========================================================= */

export default function GameWorld({
  nickname,
  characterStyle,
  onOnlinePlayersChange,
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

  /*
   * 플레이어별 채팅 말풍선 타이머
   */
  const chatBubbleTimersRef =
    useRef<
      Record<
        string,
        number
      >
    >({});

  /* ======================================================
     Scale
  ====================================================== */

  const [
    scale,
    setScale,
  ] =
    useState(1);

  /* ======================================================
     Socket ID
  ====================================================== */

  const [
    mySocketId,
    setMySocketId,
  ] =
    useState("");

  /* ======================================================
     Players
  ====================================================== */

  const [
    remotePlayers,
    setRemotePlayers,
  ] =
    useState<
      RemotePlayer[]
    >([]);

  /* ======================================================
     Position
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
     Interaction
  ====================================================== */

  const [
    interactionMessage,
    setInteractionMessage,
  ] =
    useState("");

  /* ======================================================
     Chat
  ====================================================== */

  const [
    chatMessages,
    setChatMessages,
  ] =
    useState<
      ChatMessage[]
    >([]);

  /*
   * playerId → 머리 위 채팅
   */
  const [
    chatBubbles,
    setChatBubbles,
  ] =
    useState<
      Record<
        string,
        string
      >
    >({});

  /* ======================================================
     접속자 목록을 부모로 전달
  ====================================================== */

  useEffect(() => {
    if (
      !onOnlinePlayersChange
    ) {
      return;
    }

    const players:
      OnlinePlayer[] =
      remotePlayers.map(
        player => ({
          id:
            player.id,

          nickname:
            player.nickname,
        })
      );

    onOnlinePlayersChange(
      players
    );
  }, [
    remotePlayers,
    onOnlinePlayersChange,
  ]);

  /* ======================================================
     Chat Bubble
  ====================================================== */

  const showChatBubble = (
    playerId: string,
    text: string
  ) => {
    setChatBubbles(
      previous => ({
        ...previous,

        [playerId]:
          text,
      })
    );

    const previousTimer =
      chatBubbleTimersRef
        .current[
        playerId
      ];

    if (
      previousTimer
    ) {
      window.clearTimeout(
        previousTimer
      );
    }

    chatBubbleTimersRef.current[
      playerId
    ] =
      window.setTimeout(
        () => {
          setChatBubbles(
            previous => {
              const next = {
                ...previous,
              };

              delete next[
                playerId
              ];

              return next;
            }
          );

          delete chatBubbleTimersRef
            .current[
            playerId
          ];
        },
        4000
      );
  };

  /* ======================================================
     Socket
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
       Connect
    ===================================== */

    socket.on(
      "connect",
      () => {
        const socketId =
          socket.id ?? "";

        setMySocketId(
          socketId
        );

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
       Players
    ===================================== */

    socket.on(
      "players:update",
      (
        players:
          RemotePlayer[]
      ) => {
        setRemotePlayers(
          previous => {
            return players.map(
              player => {
                const old =
                  previous.find(
                    item =>
                      item.id ===
                      player.id
                  );

                return {
                  ...player,

                  moveDuration:
                    old?.moveDuration ??
                    300,

                  moving:
                    old?.moving ??
                    false,
                };
              }
            );
          }
        );
      }
    );

    /* =====================================
       Player moved
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

                      moving:
                        true,
                    }
                  : player
            )
        );

        window.setTimeout(
          () => {
            setRemotePlayers(
              previous =>
                previous.map(
                  player =>
                    player.id ===
                      data.id
                      ? {
                          ...player,

                          moving:
                            false,
                        }
                      : player
                )
            );
          },
          data.duration
        );
      }
    );

    /* =====================================
       Chat History
    ===================================== */

    socket.on(
      "chat:history",
      (
        messages:
          ChatMessage[]
      ) => {
        setChatMessages(
          messages
        );
      }
    );

    /* =====================================
       Chat Message
    ===================================== */

    socket.on(
      "chat:message",
      (
        message:
          ChatMessage
      ) => {
        setChatMessages(
          previous => [
            ...previous,
            message,
          ].slice(
            -50
          )
        );

        /*
         * 시스템 메시지는
         * 캐릭터 머리 위에 표시하지 않음
         */
        if (
          message.type !==
            "chat" ||
          !message.playerId
        ) {
          return;
        }

        showChatBubble(
          message.playerId,
          message.message
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

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ======================================================
     Character Style Sync
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
     Scale
  ====================================================== */

  useEffect(() => {
    const updateScale =
      () => {
        const container =
          containerRef.current;

        if (!container) {
          return;
        }

        setScale(
          Math.min(
            1,

            container.clientWidth /
              WORLD_WIDTH
          )
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
     Interaction Bubble
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
     Random Message
  ====================================================== */

  const getRandomMessage = (
    messages: string[]
  ) => {
    return messages[
      Math.floor(
        Math.random() *
          messages.length
      )
    ];
  };

  /* ======================================================
     Object Interaction
  ====================================================== */

  const executeInteraction = (
    type:
      OfficeInteractionType
  ) => {
    /* =====================================
       Coffee
    ===================================== */

    if (
      type ===
      "coffee"
    ) {
      showInteraction(
        getRandomMessage([
          "☕ 커피 충전 완료!",
          "☕ 역시 회사는 커피지.",
          "☕ 따뜻하다...",
          "☕ 한 잔만 더 마실까?",
          "😌 커피 한 모금의 여유.",
        ])
      );

      return;
    }

    /* =====================================
       Chair
    ===================================== */

    if (
      type ===
      "chair"
    ) {
      showInteraction(
        getRandomMessage([
          "💻 열심히 일하는 중!",
          "💭 일하는 척하는 중...",
          "👀 팀장님 지나가신다. 집중!",
          "⌨️ 타닥타닥...",
          "🥱 퇴근하고 싶다...",
          "💭 점심 뭐 먹지?",
        ])
      );

      return;
    }

    /* =====================================
       Copier
    ===================================== */

    if (
      type ===
      "copier"
    ) {
      showInteraction(
        getRandomMessage([
          "📄 복사 완료!",
          "🖨️ 위이잉... 출력 완료.",
          "😵 용지가 걸렸습니다...",
          "🖨️ 왜 하필 지금 고장이지?",
          "🖨️ 복사기가 나를 싫어한다.",
        ])
      );
    }
  };

  /* ======================================================
     Move
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
       이미 목적지 근처
    ===================================== */

    if (
      distance < 8
    ) {
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

    const duration =
      Math.max(
        MIN_MOVE_TIME,

        Math.min(
          MAX_MOVE_TIME,

          (
            distance /
            PLAYER_SPEED
          ) *
            1000
        )
      );

    /* =====================================
       이전 이동 취소
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
       내 위치
    ===================================== */

    setPosition({
      x:
        targetX,

      y:
        targetY,
    });

    /* =====================================
       서버 전송
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
     Object Click
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
     World Click
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

    const target =
      event.target as HTMLElement;

    if (
      target.closest(
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
       World Boundary
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
      targetY
    );
  };

  /* ======================================================
     Chat Send
  ====================================================== */

  const handleSendChat = (
    message: string
  ) => {
    socketRef.current?.emit(
      "chat:send",
      message
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

      Object.values(
        chatBubbleTimersRef.current
      ).forEach(
        timer => {
          window.clearTimeout(
            timer
          );
        }
      );
    };
  }, []);

  /* ======================================================
     다른 플레이어
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
              다른 감자
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
                {/* 채팅 말풍선 */}

                <PlayerChatBubble
                  text={
                    chatBubbles[
                      player.id
                    ] ??
                    ""
                  }
                />

                {/* 감자 */}

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
                    player.moving ??
                    false
                  }
                />
              </div>
            )
          )}

          {/* =========================================
              내 감자
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
            {/* =====================================
                채팅을 치면 채팅 말풍선 우선
            ===================================== */}

            {mySocketId &&
            chatBubbles[
              mySocketId
            ] ? (
              <PlayerChatBubble
                text={
                  chatBubbles[
                    mySocketId
                  ]
                }
              />
            ) : (
              <InteractionBubble
                text={
                  interactionMessage
                }
              />
            )}

            {/* =====================================
                Character
            ===================================== */}

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
              Chat
          ========================================= */}

          <ChatPanel
            messages={
              chatMessages
            }
            onSend={
              handleSendChat
            }
          />
        </div>
      </div>
    </div>
  );
}