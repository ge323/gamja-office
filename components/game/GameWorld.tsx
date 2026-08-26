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

import Potato, {
  type PotatoDirection,
} from "@/components/character/Potato";

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

import DevilLobby, {
  type DevilLobbyRoom,
  type DevilLobbyChatMessage,
} from "@/components/game/devil/DevilLobby";

import type {
  DevilRole,
} from "@/components/game/devil/RoleReveal";

/* =========================================================
   Types
========================================================= */

type Position = {
  x: number;
  y: number;
};

/*
 * page.tsx에서도 사용
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
   * 현재 접속자 목록
   */
  onOnlinePlayersChange?: (
    players: OnlinePlayer[]
  ) => void;

  /*
   * 악마 게임 역할을 받으면
   * page.tsx에 전달
   */
  onDevilRole?: (
    role: DevilRole,
    roomId: string
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

  direction?: PotatoDirection;
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
  process.env.NEXT_PUBLIC_SOCKET_URL ||
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

function getMoveDirection(
  dx: number,
  dy: number,
  fallback: PotatoDirection = "down"
): PotatoDirection {
  if (
    Math.abs(dx) < 0.001 &&
    Math.abs(dy) < 0.001
  ) {
    return fallback;
  }

  if (Math.abs(dx) > Math.abs(dy)) {
    return dx > 0
      ? "right"
      : "left";
  }

  return dy > 0
    ? "down"
    : "up";
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
  onDevilRole,
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

  /*
   * 게임 화면으로 넘어가기 직전까지
   * 가장 최신 캐릭터 꾸미기 상태를 보관한다.
   *
   * GameWorld가 언마운트되는 순간에도 서버에
   * 최신 안경/모자/리본/넥타이/색상을 넘기기 위함.
   */
  const characterStyleRef =
    useRef<CharacterStyle>(
      characterStyle
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
    direction,
    setDirection,
  ] =
    useState<PotatoDirection>(
      "down"
    );

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
     Devil Game
  ====================================================== */

  /*
   * 오른쪽 게임 메뉴
   */
  const [
    gameMenuOpen,
    setGameMenuOpen,
  ] =
    useState(false);

  /*
   * 서버에 존재하는 게임방
   */
  const [
    devilRooms,
    setDevilRooms,
  ] =
    useState<
      DevilLobbyRoom[]
    >([]);

  /*
   * 내가 현재 참가한 방
   */
  const [
    currentDevilRoom,
    setCurrentDevilRoom,
  ] =
    useState<
      DevilLobbyRoom | null
    >(null);

/* ======================================================
   Devil Lobby Chat
====================================================== */

const [
  devilLobbyMessages,
  setDevilLobbyMessages,
] =
  useState<
    DevilLobbyChatMessage[]
  >([]);

  /*
   * 게임 시작 카운트다운
   */
  const [
    gameCountdown,
    setGameCountdown,
  ] = useState<number | null>(null);

  useEffect(() => {
    const endsAt =
      currentDevilRoom?.status === "countdown"
        ? Number(currentDevilRoom.countdownEndsAt ?? 0)
        : 0;

    if (!endsAt) {
      setGameCountdown(null);
      return;
    }

    const update = () => {
      const seconds = Math.max(
        0,
        Math.ceil((endsAt - Date.now()) / 1000)
      );
      setGameCountdown(seconds);
    };

    update();
    const timer = window.setInterval(update, 200);

    return () => window.clearInterval(timer);
  }, [
    currentDevilRoom?.status,
    currentDevilRoom?.countdownEndsAt,
  ]);

  /*
   * 게임방 에러
   */
  const [
    gameError,
    setGameError,
  ] =
    useState("");

  /*
   * 중복 방 생성 방지
   */
  const [
    creatingRoom,
    setCreatingRoom,
  ] =
    useState(false);

  /* ======================================================
     접속자 목록 부모 전달
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

            characterStyle:
              characterStyleRef.current,
          }
        );

        /*
         * 서버에 있는 게임방 목록 요청
         */
        socket.emit(
          "devilRooms:list"
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

                  direction:
                    old?.direction ??
                    player.direction ??
                    "down",
                };
              }
            );
          }
        );
      }
    );

    /* =====================================
       Player Moved
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
              player => {
                if (
                  player.id !==
                  data.id
                ) {
                  return player;
                }

                const nextDirection =
                  getMoveDirection(
                    data.x -
                      player.x,

                    data.y -
                      player.y,

                    player.direction ??
                      "down"
                  );

                return {
                  ...player,

                  x:
                    data.x,

                  y:
                    data.y,

                  moveDuration:
                    data.duration,

                  moving:
                    true,

                  direction:
                    nextDirection,
                };
              }
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
         * 캐릭터 머리 위 표시 X
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
       Devil Game
       전체 방 목록
    ===================================== */

    socket.on(
      "devilRooms:update",
      (
        rooms:
          DevilLobbyRoom[]
      ) => {
        setDevilRooms(
          rooms
        );

        /*
         * 현재 참가한 방의 정보도
         * 새로운 방 목록 내용으로 갱신
         */
        setCurrentDevilRoom(
          previous => {
            if (!previous) {
              return null;
            }

            const updated =
              rooms.find(
                room =>
                  room.id ===
                  previous.id
              );

            /*
             * 전체 방 목록 broadcast 과정에서
             * 잠깐 없어지는 경우를 고려하여
             * 기존 값 유지
             */
            return (
              updated ??
              previous
            );
          }
        );
      }
    );

    /* =====================================
       Devil Game
       내가 참가한 방 실시간 갱신
    ===================================== */

    socket.on(
      "devilRoom:update",
      (
        room:
          DevilLobbyRoom
      ) => {
        setCurrentDevilRoom(
          room
        );

        setDevilRooms(
          previous => {
            const exists =
              previous.some(
                item =>
                  item.id ===
                  room.id
              );

            if (!exists) {
              return [
                ...previous,
                room,
              ];
            }

            return previous.map(
              item =>
                item.id ===
                room.id
                  ? room
                  : item
            );
          }
        );
      }
    );

    /* =====================================
       Devil Lobby Chat
    ===================================== */

    socket.on(
      "devilLobby:chat",
      (
        message:
          DevilLobbyChatMessage
      ) => {
        setDevilLobbyMessages(
          previous => {
            const exists =
              previous.some(
                item =>
                  item.id ===
                  message.id
              );

            if (exists) {
              return previous;
            }

            return [
              ...previous,
              message,
            ].slice(-50);
          }
        );
      }
    );

    /* =====================================
       Devil Game
       개인 역할 수신

       서버가 나에게만
       내 역할을 보내준다.
    ===================================== */

    socket.on(
      "devilGame:role",
      (data: {
        roomId: string;

        role:
          DevilRole;
      }) => {
        console.log(
          "🎭 내 역할:",
          data.role
        );

        /*
         * 게임 메뉴 닫기
         */
        setGameMenuOpen(
          false
        );

        setDevilLobbyMessages(
          []
        );

        /*
         * page.tsx로 전달
         *
         * page.tsx에서
         * RoleReveal → DevilGameWorld로 전환
         */
        onDevilRole?.(
          data.role,
          data.roomId
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
    /*
     * ref는 Socket 연결 여부와 관계없이 항상 최신값으로 갱신한다.
     */
    characterStyleRef.current =
      characterStyle;

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
      characterStyleRef.current
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

        const availableWidth =
          Math.max(
            1,
            container.clientWidth -
              8
          );

        const availableHeight =
          Math.max(
            1,
            container.clientHeight -
              8
          );

        const widthScale =
          availableWidth /
          WORLD_WIDTH;

        const heightScale =
          availableHeight /
          WORLD_HEIGHT;

        setScale(
          Math.min(
            1,
            widthScale,
            heightScale
          )
        );
      };

    updateScale();

    window.addEventListener(
      "resize",
      updateScale
    );

    window.addEventListener(
      "orientationchange",
      updateScale
    );

    window.visualViewport
      ?.addEventListener(
        "resize",
        updateScale
      );

    return () => {
      window.removeEventListener(
        "resize",
        updateScale
      );

      window.removeEventListener(
        "orientationchange",
        updateScale
      );

      window.visualViewport
        ?.removeEventListener(
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

    const nextDirection =
      getMoveDirection(
        dx,
        dy,
        direction
      );

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

    setDirection(
      nextDirection
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
     Devil Game
     Create Room
  ====================================================== */

  const handleCreateDevilRoom =
    () => {
      const socket =
        socketRef.current;

      if (
        !socket ||
        !socket.connected ||
        creatingRoom
      ) {
        return;
      }

      setCreatingRoom(
        true
      );

      setGameError(
        ""
      );

      socket.emit(
        "devilRoom:create",

        {
          maxPlayers: 6,
        },

        (response: {
          ok: boolean;

          room?:
            DevilLobbyRoom;

          message?:
            string;
        }) => {
          setCreatingRoom(
            false
          );

          if (
            !response.ok ||
            !response.room
          ) {
            setGameError(
              response.message ??
                "게임방을 만들지 못했습니다."
            );

            return;
          }

          setCurrentDevilRoom(
            response.room
          );

          setDevilLobbyMessages(
            []
          );

          setGameMenuOpen(
            false
          );
        }
      );
    };

  /* ======================================================
     Devil Game
     Join Room
  ====================================================== */

  const handleJoinDevilRoom =
    (
      roomId: string
    ) => {
      const socket =
        socketRef.current;

      if (
        !socket ||
        !socket.connected
      ) {
        return;
      }

      setGameError(
        ""
      );

      socket.emit(
        "devilRoom:join",

        roomId,

        (response: {
          ok: boolean;

          room?:
            DevilLobbyRoom;

          message?:
            string;
        }) => {
          if (
            !response.ok ||
            !response.room
          ) {
            setGameError(
              response.message ??
                "게임방에 참가하지 못했습니다."
            );

            return;
          }

          setCurrentDevilRoom(
            response.room
          );

          setDevilLobbyMessages(
            []
          );

          setGameMenuOpen(
            false
          );
        }
      );
    };

  /* ======================================================
     Devil Game
     Leave Room
  ====================================================== */

  const handleLeaveDevilRoom =
    () => {
      const socket =
        socketRef.current;

      if (!socket) {
        return;
      }

      socket.emit(
        "devilRoom:leave",

        (response: {
          ok: boolean;
        }) => {
          if (
            !response.ok
          ) {
            return;
          }

          setCurrentDevilRoom(
            null
          );

          setDevilLobbyMessages(
            []
          );

          setGameError(
            ""
          );
        }
      );
    };

  /* ======================================================
     Devil Game
     Lobby Chat Send
  ====================================================== */

  const handleSendDevilLobbyMessage =
    (
      message: string
    ) => {
      const socket =
        socketRef.current;

      if (
        !socket ||
        !socket.connected ||
        !currentDevilRoom
      ) {
        return;
      }

      const text =
        message
          .trim()
          .slice(
            0,
            100
          );

      if (!text) {
        return;
      }

      socket.emit(
        "devilLobby:chat",
        {
          roomId:
            currentDevilRoom.id,

          message:
            text,
        }
      );
    };


/* ======================================================
   Devil Game
   Ready Toggle
====================================================== */

const handleToggleDevilReady =
  () => {
    const socket =
      socketRef.current;

    if (
      !socket ||
      !socket.connected ||
      !currentDevilRoom
    ) {
      return;
    }

    /*
     * 게임 대기 상태에서만
     * 준비 상태를 변경할 수 있다.
     */
    if (
      currentDevilRoom.status !==
      "waiting"
    ) {
      return;
    }

    /*
     * 현재 내 플레이어 정보
     */
    const me =
      currentDevilRoom.players.find(
        player =>
          player.id ===
          mySocketId
      );

    /*
     * 현재 준비 상태의 반대로 변경
     *
     * false → true
     * true  → false
     */
    const nextReady =
      !Boolean(
        me?.ready
      );

    setGameError(
      ""
    );

    socket.emit(
      "devilRoom:ready",

      nextReady,

      (response: {
        ok: boolean;
        message?: string;
      }) => {
        if (
          !response.ok
        ) {
          setGameError(
            response.message ??
              "준비 상태를 변경하지 못했습니다."
          );
        }
      }
    );
  };

  /* ======================================================
     Devil Game
     Start
  ====================================================== */

  const handleStartDevilGame =
    () => {
      const socket =
        socketRef.current;

      if (
        !socket ||
        !currentDevilRoom
      ) {
        return;
      }

      setGameError(
        ""
      );

      /*
       * 역할 배정 직전에 서버에 최신 캐릭터 상태를 한 번 더 보낸다.
       * Socket.IO는 같은 연결에서 보낸 이벤트 순서를 보장하므로
       * player:style 처리 후 devilRoom:start가 처리된다.
       */
      socket.emit(
        "player:style",
        characterStyleRef.current
      );

      socket.emit(
        "devilRoom:start",

        currentDevilRoom.id,

        (response: {
          ok: boolean;
          message?: string;
        }) => {
          if (
            !response.ok
          ) {
            setGameError(
              response.message ??
                "게임을 시작하지 못했습니다."
            );
          }
        }
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
     Other Players
  ====================================================== */

  const otherPlayers =
    remotePlayers.filter(
      player =>
        player.id !==
        mySocketId
    );

  /* ======================================================
     Waiting Rooms
  ====================================================== */

  const waitingDevilRooms =
    devilRooms.filter(
      room =>
        room.status ===
        "waiting"
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
        relative
        flex
        h-[calc(100dvh-80px)]
        min-h-[420px]
        w-full
        items-center
        justify-center
        overflow-hidden
        bg-[#ece7dd]
        p-2

        max-[900px]:h-[100dvh]
        max-[900px]:min-h-0
        max-[900px]:p-0
      "
    >
      {/* =================================================
          GAME BUTTON
      ================================================= */}

      {!currentDevilRoom && (
        <div
          data-no-move
          className="
            absolute
            right-6
            top-6
            z-[12000]
          "
        >
          <button
            type="button"
            onClick={() => {
              setGameMenuOpen(
                previous =>
                  !previous
              );

              setGameError(
                ""
              );

              socketRef.current?.emit(
                "devilRooms:list"
              );
            }}
            className="
              rounded-xl
              border
              border-zinc-200
              bg-white
              px-4
              py-2.5
              text-[11px]
              font-bold
              text-zinc-700
              shadow-md
              transition
              hover:-translate-y-0.5
              hover:shadow-lg
            "
          >
            🎮 게임
          </button>
        </div>
      )}

      {/* =================================================
          GAME MENU
      ================================================= */}

      {gameMenuOpen &&
        !currentDevilRoom && (
          <div
            data-no-move
            className="
              absolute
              right-6
              top-[70px]
              z-[13000]
              w-[330px]
              overflow-hidden
              rounded-2xl
              border
              border-zinc-200
              bg-[#f8f5ef]
              shadow-2xl
            "
          >
            {/* Header */}

            <div
              className="
                border-b
                border-zinc-200
                px-5
                py-4
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
                      text-[9px]
                      font-bold
                      tracking-[0.16em]
                      text-zinc-400
                    "
                  >
                    OFFICE GAME
                  </div>

                  <div
                    className="
                      mt-1
                      text-sm
                      font-black
                      text-zinc-800
                    "
                  >
                    😈 악마 감자
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setGameMenuOpen(
                      false
                    );

                    setGameError(
                      ""
                    );
                  }}
                  className="
                    flex
                    h-7
                    w-7
                    items-center
                    justify-center
                    rounded-full
                    text-xs
                    text-zinc-400
                    transition
                    hover:bg-zinc-100
                    hover:text-zinc-700
                  "
                >
                  ✕
                </button>
              </div>

              <p
                className="
                  mt-2
                  text-[10px]
                  leading-5
                  text-zinc-400
                "
              >
                업무를 완료하거나
                숨어있는 악마 감자를
                찾아내세요.
              </p>
            </div>

            {/* =====================================
                Create Room
            ===================================== */}

            <div
              className="
                border-b
                border-zinc-200
                p-4
              "
            >
              <button
                type="button"
                disabled={
                  creatingRoom
                }
                onClick={
                  handleCreateDevilRoom
                }
                className="
                  w-full
                  rounded-xl
                  bg-zinc-900
                  px-4
                  py-3
                  text-[11px]
                  font-bold
                  text-white
                  transition
                  enabled:hover:bg-zinc-700
                  disabled:cursor-not-allowed
                  disabled:bg-zinc-400
                "
              >
                {creatingRoom
                  ? "방 만드는 중..."
                  : "＋ 게임 방 만들기"}
              </button>

              <div
                className="
                  mt-2
                  text-center
                  text-[9px]
                  text-zinc-400
                "
              >
                최대 6명 · 최소 4명부터 시작
              </div>
            </div>

            {/* =====================================
                Room List
            ===================================== */}

            <div
              className="
                max-h-[300px]
                overflow-y-auto
                p-4
              "
            >
              <div
                className="
                  mb-3
                  flex
                  items-center
                  justify-between
                "
              >
                <span
                  className="
                    text-[10px]
                    font-bold
                    text-zinc-600
                  "
                >
                  모집 중인 방
                </span>

                <span
                  className="
                    text-[9px]
                    text-zinc-400
                  "
                >
                  {
                    waitingDevilRooms.length
                  }
                  개
                </span>
              </div>

              {waitingDevilRooms.length ===
              0 ? (
                <div
                  className="
                    rounded-xl
                    border
                    border-dashed
                    border-zinc-200
                    px-4
                    py-8
                    text-center
                  "
                >
                  <div
                    className="
                      text-2xl
                    "
                  >
                    🥔
                  </div>

                  <div
                    className="
                      mt-2
                      text-[10px]
                      text-zinc-400
                    "
                  >
                    아직 모집 중인
                    게임이 없어요.
                  </div>

                  <div
                    className="
                      mt-1
                      text-[9px]
                      text-zinc-300
                    "
                  >
                    직접 방을 만들어보세요.
                  </div>
                </div>
              ) : (
                <div
                  className="
                    space-y-2
                  "
                >
                  {waitingDevilRooms.map(
                    room => {
                      const host =
                        room.players.find(
                          player =>
                            player.id ===
                            room.hostId
                        );

                      const full =
                        room.players
                          .length >=
                        room.maxPlayers;

                      return (
                        <div
                          key={
                            room.id
                          }
                          className="
                            rounded-xl
                            border
                            border-zinc-200
                            bg-white
                            p-3
                            shadow-sm
                          "
                        >
                          <div
                            className="
                              flex
                              items-center
                              justify-between
                              gap-3
                            "
                          >
                            <div
                              className="
                                min-w-0
                                flex-1
                              "
                            >
                              <div
                                className="
                                  truncate
                                  text-[10px]
                                  font-bold
                                  text-zinc-700
                                "
                              >
                                😈{" "}
                                {host
                                  ? `${host.nickname} 감자의 방`
                                  : "악마 감자 방"}
                              </div>

                              <div
                                className="
                                  mt-1
                                  font-mono
                                  text-[8px]
                                  tracking-wider
                                  text-zinc-400
                                "
                              >
                                {
                                  room.id
                                }
                              </div>
                            </div>

                            <div
                              className="
                                shrink-0
                                text-right
                              "
                            >
                              <div
                                className="
                                  mb-1
                                  text-[9px]
                                  text-zinc-400
                                "
                              >
                                {
                                  room.players
                                    .length
                                }
                                {" / "}
                                {
                                  room.maxPlayers
                                }
                              </div>

                              <button
                                type="button"
                                disabled={
                                  full
                                }
                                onClick={() => {
                                  handleJoinDevilRoom(
                                    room.id
                                  );
                                }}
                                className="
                                  rounded-lg
                                  bg-zinc-900
                                  px-3
                                  py-1.5
                                  text-[9px]
                                  font-bold
                                  text-white
                                  transition
                                  enabled:hover:bg-zinc-700
                                  disabled:cursor-not-allowed
                                  disabled:bg-zinc-300
                                "
                              >
                                {full
                                  ? "가득 참"
                                  : "참가하기"}
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    }
                  )}
                </div>
              )}

              {/* Error */}

              {gameError && (
                <div
                  className="
                    mt-3
                    rounded-lg
                    border
                    border-red-100
                    bg-red-50
                    px-3
                    py-2
                    text-[9px]
                    leading-4
                    text-red-500
                  "
                >
                  ⚠️ {gameError}
                </div>
              )}
            </div>
          </div>
        )}

      {/* =================================================
          DEVIL LOBBY

          방에 참가하면
          기존 사무실 화면 위에 표시
      ================================================= */}

      {currentDevilRoom?.status === "waiting" && (
        <DevilLobby
          room={
            currentDevilRoom
          }
          mySocketId={
            mySocketId
          }
          onLeave={
            handleLeaveDevilRoom
          }
          onStart={
            handleStartDevilGame
          }
          messages={
            devilLobbyMessages
          }
          onSendMessage={
            handleSendDevilLobbyMessage
          }
          onToggleReady={
            handleToggleDevilReady
          }
        />
      )}

      {currentDevilRoom?.status === "countdown" && (
        <div
          data-no-move
          className="pointer-events-none absolute inset-0 z-[19000] flex items-center justify-center"
        >
          <div className="rounded-3xl border border-white/20 bg-black/75 px-10 py-7 text-center text-white shadow-2xl backdrop-blur-sm">
            <div className="text-[10px] font-bold tracking-[0.24em] text-amber-300">
              감자 전쟁 준비
            </div>
            <div className="mt-2 text-[48px] font-black leading-none">
              {gameCountdown ?? "…"}
            </div>
            <div className="mt-3 text-[12px] font-bold">
              사무실에서 잠시 대기하세요
            </div>
            <div className="mt-1 text-[10px] text-white/55">
              카운트다운이 끝나면 역할이 배정되고 게임이 시작됩니다.
            </div>
            <div className="mt-3 text-[9px] text-emerald-300">
              참가자 {currentDevilRoom.players.length}명 모두 같은 게임으로 이동합니다.
            </div>
          </div>
        </div>
      )}

      {/* =================================================
          ORIGINAL OFFICE WORLD
      ================================================= */}

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
                  direction={
                    player.direction ??
                    "down"
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
                채팅 말풍선 우선
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
              direction={
                direction
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