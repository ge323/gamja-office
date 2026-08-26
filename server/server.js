const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

const PORT =
  process.env.PORT || 4000;

/* =========================================================
   Global State
========================================================= */

const players = {};
const chatHistory = [];
const devilRooms = {};

const MAX_CHAT_HISTORY = 50;

/* =========================================================
   Potato War Constants
========================================================= */

const DEVIL_GAME_MIN_PLAYERS = 2;

const DEVIL_GAME_DEFAULT_MAX_PLAYERS = 5;

const DEVIL_GAME_MAX_PLAYERS = 5;

const POTATO_WAR_KILL_RANGE = 135;

/*
 * 방장이 게임 시작을 누른 뒤
 * 참가자들이 사무실에서 기다리는 시간
 */
const POTATO_WAR_START_COUNTDOWN_MS =
  8_000;

/*
 * 개발 중에는 5초.
 * 실제 배포 시에는
 * 20~30초 정도 권장.
 */
const POTATO_WAR_KILL_COOLDOWN_MS =
  5_000;

/*
 * RoleReveal -> DevilGameWorld로 넘어갈 때
 * 기존 소켓이 끊겼다가 새 소켓이 연결되므로
 * 재접속 유예 시간을 둔다.
 */
const POTATO_WAR_RECONNECT_GRACE_MS =
  15_000;

/*
 * 감자 전쟁 맵 크기
 */
const POTATO_WAR_MAP_WIDTH =
  2200;

const POTATO_WAR_MAP_HEIGHT =
  1400;

/* =========================================================
   Common Helpers
========================================================= */

function createId() {
  return `${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}`;
}

function addChatMessage(
  message
) {
  chatHistory.push(
    message
  );

  if (
    chatHistory.length >
    MAX_CHAT_HISTORY
  ) {
    chatHistory.shift();
  }
}

/* =========================================================
   Room Code
========================================================= */

function createRoomCode() {
  let roomId;

  do {
    const number =
      Math.floor(
        1000 +
          Math.random() *
            9000
      );

    roomId =
      `GAMJA-${number}`;
  } while (
    devilRooms[roomId]
  );

  return roomId;
}

/* =========================================================
   Socket.IO Room
========================================================= */

function getSocketRoomName(
  roomId
) {
  return `devil:${roomId}`;
}

/* =========================================================
   Find Waiting Room
========================================================= */

function findPlayerRoom(
  socketId
) {
  return Object.values(
    devilRooms
  ).find(
    room =>
      room.players.includes(
        socketId
      )
  );
}

/* =========================================================
   Public Waiting Player
========================================================= */

function getPublicRoomPlayer(
  socketId
) {
  const player =
    players[socketId];

  if (!player) {
    return null;
  }

  return {
    id:
      player.id,

    nickname:
      player.nickname,

    /*
     * 중요:
     * 로비에서도 꾸민 감자 그대로 보여주기 위해
     * characterStyle을 전달한다.
     */
    characterStyle:
      player.characterStyle,
  };
}

/* =========================================================
   Public Room
========================================================= */

function getPublicRoom(
  room
) {
  if (!room) {
    return null;
  }

  return {
    id:
      room.id,

    hostId:
      room.hostId,

    status:
      room.status,

    maxPlayers:
      room.maxPlayers,

    /*
     * 게임 시작 카운트다운 종료 시간
     */
    countdownEndsAt:
      room.countdownEndsAt ??
      null,

    /*
     * 역할 정보는 절대 공개하지 않는다.
     */
    players:
      room.players
        .map(
          socketId =>
            getPublicRoomPlayer(
              socketId
            )
        )
        .filter(Boolean),
  };
}

function getPublicRooms() {
  return Object.values(
    devilRooms
  ).map(
    room =>
      getPublicRoom(
        room
      )
  );
}

/* =========================================================
   Room Broadcast
========================================================= */

function broadcastRoomList() {
  io.emit(
    "devilRooms:update",
    getPublicRooms()
  );
}

function broadcastRoomUpdate(
  room
) {
  if (!room) {
    return;
  }

  io.to(
    getSocketRoomName(
      room.id
    )
  ).emit(
    "devilRoom:update",
    getPublicRoom(
      room
    )
  );

  broadcastRoomList();
}

/* =========================================================
   Shuffle
========================================================= */

function shuffleArray(
  array
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
   Role Assignment
========================================================= */

function assignRoles(
  room
) {
  /*
   * 현재 최대 5명이므로
   * 기본적으로 악마 1명.
   *
   * 추후 최대 인원을 늘리면
   * 7명 이상 = 악마 2명
   */
  const devilCount =
    room.players.length >= 7
      ? 2
      : 1;

  const shuffledPlayers =
    shuffleArray(
      room.players
    );

  const devilIds =
    new Set(
      shuffledPlayers.slice(
        0,
        devilCount
      )
    );

  const roles = {};

  room.players.forEach(
    socketId => {
      roles[socketId] =
        devilIds.has(
          socketId
        )
          ? "devil"
          : "survivor";
    }
  );

  return roles;
}

/* =========================================================
   Potato War Start
========================================================= */

function beginPotatoWar(
  room
) {
  if (
    !room ||
    room.status !==
      "countdown"
  ) {
    return;
  }

  /*
   * 카운트다운 도중 사람이 빠졌다면
   * 최소 인원을 다시 확인.
   */
  if (
    room.players.length <
    DEVIL_GAME_MIN_PLAYERS
  ) {
    room.status =
      "waiting";

    room.countdownEndsAt =
      null;

    broadcastRoomUpdate(
      room
    );

    return;
  }

  /*
   * 역할 배정
   */
  room.roles =
    assignRoles(
      room
    );

  room.status =
    "playing";

  room.startedAt =
    Date.now();

  room.countdownEndsAt =
    null;

  /*
   * 실제 게임 런타임 생성
   */
  createGameRuntime(
    room
  );

  /*
   * 각 참가자에게 자신의 역할만 전달
   */
  room.players.forEach(
    socketId => {
      io.to(
        socketId
      ).emit(
        "devilGame:role",
        {
          roomId:
            room.id,

          role:
            room.roles[
              socketId
            ],
        }
      );
    }
  );

  broadcastRoomUpdate(
    room
  );

  /*
   * 같은 게임에 참가한 모든 사용자에게
   * 게임 시작 알림
   */
  io.to(
    getSocketRoomName(
      room.id
    )
  ).emit(
    "devilGame:start",
    {
      roomId:
        room.id,

      startedAt:
        room.startedAt,

      players:
        room.players
          .map(
            id =>
              getPublicRoomPlayer(
                id
              )
          )
          .filter(Boolean),
    }
  );
}

/* =========================================================
   Potato War Runtime
========================================================= */

function createGameRuntime(
  room
) {
  room.gamePlayers =
    {};

  room.corpses =
    [];

  room.players.forEach(
    (
      socketId,
      index
    ) => {
      const officePlayer =
        players[
          socketId
        ];

      if (
        !officePlayer
      ) {
        return;
      }

      /*
       * 참가자들이 시작할 때
       * 중앙 사무실 주변에 배치.
       */
      const row =
        Math.floor(
          index / 3
        );

      const column =
        index % 3;

      room.gamePlayers[
        socketId
      ] = {
        /*
         * 게임 내 고정 ID
         */
        id:
          socketId,

        /*
         * 화면 전환 과정에서
         * Socket ID는 변경될 수 있음.
         */
        connectedSocketId:
          socketId,

        nickname:
          officePlayer.nickname,

        /*
         * 기존에 꾸민 감자 모습 유지
         */
        characterStyle:
          officePlayer.characterStyle,

        role:
          room.roles[
            socketId
          ],

        state:
          "alive",

        x:
          1050 +
          column * 55,

        y:
          680 +
          row * 55,

        lastKillAt:
          0,
      };
    }
  );
}

/* =========================================================
   Public Game Player
========================================================= */

function getPublicGamePlayer(
  gamePlayer
) {
  if (
    !gamePlayer
  ) {
    return null;
  }

  /*
   * 다른 플레이어의 역할은 절대 공개하지 않는다.
   */
  return {
    id:
      gamePlayer.id,

    nickname:
      gamePlayer.nickname,

    characterStyle:
      gamePlayer.characterStyle,

    state:
      gamePlayer.state,

    x:
      gamePlayer.x,

    y:
      gamePlayer.y,
  };
}

/* =========================================================
   Public Game State
========================================================= */

function getPublicGameState(
  room
) {
  return {
    roomId:
      room.id,

    players:
      Object.values(
        room.gamePlayers ??
          {}
      )
        .map(
          getPublicGamePlayer
        )
        .filter(Boolean),

    corpses:
      room.corpses ??
      [],
  };
}

/* =========================================================
   Find Playing Room
========================================================= */

function findGameRoomBySocket(
  socketId
) {
  return Object.values(
    devilRooms
  ).find(
    room => {
      if (
        room.status !==
          "playing" ||
        !room.gamePlayers
      ) {
        return false;
      }

      return Object.values(
        room.gamePlayers
      ).some(
        player =>
          player.connectedSocketId ===
          socketId
      );
    }
  );
}

function findGamePlayerBySocket(
  room,
  socketId
) {
  if (
    !room?.gamePlayers
  ) {
    return null;
  }

  return (
    Object.values(
      room.gamePlayers
    ).find(
      player =>
        player.connectedSocketId ===
        socketId
    ) ??
    null
  );
}

function findGamePlayerByNickname(
  room,
  nickname
) {
  if (
    !room?.gamePlayers
  ) {
    return null;
  }

  return (
    Object.values(
      room.gamePlayers
    ).find(
      player =>
        player.nickname ===
        nickname
    ) ??
    null
  );
}

/* =========================================================
   Game State Broadcast
========================================================= */

function broadcastGameState(
  room
) {
  io.to(
    getSocketRoomName(
      room.id
    )
  ).emit(
    "devilGame:state",
    getPublicGameState(
      room
    )
  );
}

/* =========================================================
   Leave Waiting Room
========================================================= */

function removePlayerFromWaitingRoom(
  socket
) {
  const room =
    findPlayerRoom(
      socket.id
    );

  if (
    !room
  ) {
    return;
  }

  /*
   * 참가자 제거
   */
  room.players =
    room.players.filter(
      id =>
        id !==
        socket.id
    );

  /*
   * 역할 정보 제거
   */
  if (
    room.roles
  ) {
    delete room.roles[
      socket.id
    ];
  }

  socket.leave(
    getSocketRoomName(
      room.id
    )
  );

  /*
   * 아무도 없으면 방 삭제
   */
  if (
    room.players.length ===
    0
  ) {
    delete devilRooms[
      room.id
    ];

    broadcastRoomList();

    return;
  }

  /*
   * 방장이 나갔다면
   * 다음 참가자가 방장.
   */
  if (
    room.hostId ===
    socket.id
  ) {
    room.hostId =
      room.players[0];
  }

  /*
   * 카운트다운 중 참가자가 빠져
   * 최소 인원이 안 되면 취소.
   */
  if (
    room.status ===
      "countdown" &&
    room.players.length <
      DEVIL_GAME_MIN_PLAYERS
  ) {
    room.status =
      "waiting";

    room.countdownEndsAt =
      null;
  }

  broadcastRoomUpdate(
    room
  );
}

/* =========================================================
   Playing Disconnect
========================================================= */

function handlePlayingDisconnect(
  room,
  socketId
) {
  const gamePlayer =
    findGamePlayerBySocket(
      room,
      socketId
    );

  if (
    !gamePlayer
  ) {
    return false;
  }

  /*
   * 바로 플레이어를 지우지 않고
   * 재접속을 기다린다.
   */
  gamePlayer.connectedSocketId =
    null;

  const stablePlayerId =
    gamePlayer.id;

  setTimeout(
    () => {
      const currentRoom =
        devilRooms[
          room.id
        ];

      if (
        !currentRoom
          ?.gamePlayers
          ?.[stablePlayerId]
      ) {
        return;
      }

      const currentGamePlayer =
        currentRoom
          .gamePlayers[
            stablePlayerId
          ];

      /*
       * 새 소켓으로 재접속했다면
       * 그대로 유지.
       */
      if (
        currentGamePlayer
          .connectedSocketId
      ) {
        return;
      }

      /*
       * 실제로 나간 사용자 제거
       */
      delete currentRoom
        .gamePlayers[
          stablePlayerId
        ];

      currentRoom.players =
        currentRoom.players.filter(
          id =>
            id !==
            stablePlayerId
        );

      /*
       * 아무도 남지 않았다면 방 삭제
       */
      if (
        currentRoom
          .players
          .length ===
        0
      ) {
        delete devilRooms[
          currentRoom.id
        ];

        broadcastRoomList();

        return;
      }

      broadcastGameState(
        currentRoom
      );
    },
    POTATO_WAR_RECONNECT_GRACE_MS
  );

  return true;
}

/* =========================================================
   Socket Connection
========================================================= */

io.on(
  "connection",
  socket => {
    console.log(
      "🥔 감자 서버 연결:",
      socket.id
    );

    /* =====================================================
       Main Office Join
    ===================================================== */

    socket.on(
      "player:join",
      playerData => {
        const nickname =
          String(
            playerData
              ?.nickname ??
              ""
          ).trim();

        if (
          !nickname
        ) {
          return;
        }

        players[
          socket.id
        ] = {
          id:
            socket.id,

          nickname,

          x:
            playerData.x ??
            735,

          y:
            playerData.y ??
            565,

          characterStyle:
            playerData
              .characterStyle,
        };

        /*
         * 기존 채팅 기록
         */
        socket.emit(
          "chat:history",
          chatHistory
        );

        /*
         * 현재 접속자 정보
         */
        io.emit(
          "players:update",
          Object.values(
            players
          )
        );

        /*
         * 현재 게임방 목록
         */
        socket.emit(
          "devilRooms:update",
          getPublicRooms()
        );

        const systemMessage =
          {
            id:
              createId(),

            type:
              "system",

            message:
              `${nickname} 감자가 입장했습니다.`,

            createdAt:
              Date.now(),
          };

        addChatMessage(
          systemMessage
        );

        io.emit(
          "chat:message",
          systemMessage
        );
      }
    );

    /* =====================================================
       Main Office Move
    ===================================================== */

    socket.on(
      "player:move",
      position => {
        const player =
          players[
            socket.id
          ];

        if (
          !player
        ) {
          return;
        }

        const x =
          Number(
            position?.x
          );

        const y =
          Number(
            position?.y
          );

        if (
          !Number.isFinite(
            x
          ) ||
          !Number.isFinite(
            y
          )
        ) {
          return;
        }

        player.x =
          x;

        player.y =
          y;

        socket.broadcast.emit(
          "player:moved",
          {
            id:
              socket.id,

            x,
            y,

            duration:
              Number(
                position
                  ?.duration
              ) ||
              300,
          }
        );
      }
    );

    /* =====================================================
       Character Style
    ===================================================== */

    socket.on(
      "player:style",
      characterStyle => {
        const player =
          players[
            socket.id
          ];

        if (
          !player
        ) {
          return;
        }

        player.characterStyle =
          characterStyle;

        /*
         * 사무실 참가자 갱신
         */
        io.emit(
          "players:update",
          Object.values(
            players
          )
        );

        /*
         * 게임 로비에 참가 중이라면
         * 로비 캐릭터도 즉시 갱신
         */
        const room =
          findPlayerRoom(
            socket.id
          );

        if (
          room
        ) {
          broadcastRoomUpdate(
            room
          );
        }
      }
    );

    /* =====================================================
       Chat
    ===================================================== */

    socket.on(
      "chat:send",
      rawMessage => {
        const player =
          players[
            socket.id
          ];

        if (
          !player
        ) {
          return;
        }

        const message =
          String(
            rawMessage ??
            ""
          )
            .trim()
            .slice(
              0,
              100
            );

        if (
          !message
        ) {
          return;
        }

        const chatMessage =
          {
            id:
              createId(),

            type:
              "chat",

            playerId:
              socket.id,

            nickname:
              player.nickname,

            message,

            createdAt:
              Date.now(),
          };

        addChatMessage(
          chatMessage
        );

        io.emit(
          "chat:message",
          chatMessage
        );
      }
    );

    /* =====================================================
       Devil Rooms List
    ===================================================== */

    socket.on(
      "devilRooms:list",
      callback => {
        if (
          typeof callback ===
          "function"
        ) {
          callback({
            ok:
              true,

            rooms:
              getPublicRooms(),
          });
        } else {
          socket.emit(
            "devilRooms:update",
            getPublicRooms()
          );
        }
      }
    );

    /* =====================================================
       Create Devil Room
    ===================================================== */

    socket.on(
      "devilRoom:create",
      (
        options = {},
        callback
      ) => {
        const player =
          players[
            socket.id
          ];

        if (
          !player
        ) {
          callback?.({
            ok:
              false,

            message:
              "먼저 사무실에 입장해주세요.",
          });

          return;
        }

        /*
         * 이미 다른 게임방에 참가 중인지 확인
         */
        if (
          findPlayerRoom(
            socket.id
          )
        ) {
          callback?.({
            ok:
              false,

            message:
              "이미 게임방에 참가 중입니다.",
          });

          return;
        }

        let maxPlayers =
          Number(
            options
              .maxPlayers
          );

        if (
          !Number.isFinite(
            maxPlayers
          )
        ) {
          maxPlayers =
            DEVIL_GAME_DEFAULT_MAX_PLAYERS;
        }

        maxPlayers =
          Math.max(
            DEVIL_GAME_MIN_PLAYERS,

            Math.min(
              DEVIL_GAME_MAX_PLAYERS,

              Math.floor(
                maxPlayers
              )
            )
          );

        const roomId =
          createRoomCode();

        const room = {
          id:
            roomId,

          hostId:
            socket.id,

          status:
            "waiting",

          maxPlayers,

          players: [
            socket.id,
          ],

          roles:
            {},

          countdownEndsAt:
            null,
        };

        devilRooms[
          roomId
        ] = room;

        socket.join(
          getSocketRoomName(
            roomId
          )
        );

        broadcastRoomUpdate(
          room
        );

        callback?.({
          ok:
            true,

          room:
            getPublicRoom(
              room
            ),
        });
      }
    );

    /* =====================================================
       Join Devil Room
    ===================================================== */

    socket.on(
      "devilRoom:join",
      (
        roomId,
        callback
      ) => {
        const player =
          players[
            socket.id
          ];

        if (
          !player
        ) {
          callback?.({
            ok:
              false,

            message:
              "먼저 사무실에 입장해주세요.",
          });

          return;
        }

        const normalizedRoomId =
          String(
            roomId ??
            ""
          )
            .trim()
            .toUpperCase();

        const room =
          devilRooms[
            normalizedRoomId
          ];

        if (
          !room
        ) {
          callback?.({
            ok:
              false,

            message:
              "존재하지 않는 게임방입니다.",
          });

          return;
        }

        /*
         * waiting 상태에서만 새 참가자 입장 가능
         */
        if (
          room.status !==
          "waiting"
        ) {
          callback?.({
            ok:
              false,

            message:
              "이미 게임이 시작된 방입니다.",
          });

          return;
        }

        const currentRoom =
          findPlayerRoom(
            socket.id
          );

        if (
          currentRoom &&
          currentRoom.id !==
            room.id
        ) {
          callback?.({
            ok:
              false,

            message:
              "이미 다른 게임방에 참가 중입니다.",
          });

          return;
        }

        /*
         * 이미 참가 중인 경우
         */
        if (
          room.players.includes(
            socket.id
          )
        ) {
          callback?.({
            ok:
              true,

            room:
              getPublicRoom(
                room
              ),
          });

          return;
        }

        /*
         * 인원 초과
         */
        if (
          room.players.length >=
          room.maxPlayers
        ) {
          callback?.({
            ok:
              false,

            message:
              "게임방 인원이 가득 찼습니다.",
          });

          return;
        }

        /*
         * 한 방 안에서 닉네임 중복 방지
         */
        const duplicateNickname =
          room.players.some(
            id =>
              players[id]
                ?.nickname ===
              player.nickname
          );

        if (
          duplicateNickname
        ) {
          callback?.({
            ok:
              false,

            message:
              "게임방 안에서는 같은 닉네임을 사용할 수 없습니다.",
          });

          return;
        }

        room.players.push(
          socket.id
        );

        socket.join(
          getSocketRoomName(
            room.id
          )
        );

        broadcastRoomUpdate(
          room
        );

        callback?.({
          ok:
            true,

          room:
            getPublicRoom(
              room
            ),
        });
      }
    );

    /* =====================================================
       Leave Devil Room
    ===================================================== */

    socket.on(
      "devilRoom:leave",
      callback => {
        removePlayerFromWaitingRoom(
          socket
        );

        callback?.({
          ok:
            true,
        });
      }
    );

    /* =====================================================
       Start Devil Game
    ===================================================== */

    socket.on(
      "devilRoom:start",
      (
        roomId,
        callback
      ) => {
        const normalizedRoomId =
          String(
            roomId ??
            ""
          )
            .trim()
            .toUpperCase();

        const room =
          devilRooms[
            normalizedRoomId
          ];

        if (
          !room
        ) {
          callback?.({
            ok:
              false,

            message:
              "게임방을 찾을 수 없습니다.",
          });

          return;
        }

        /*
         * 방장만 시작 가능
         */
        if (
          room.hostId !==
          socket.id
        ) {
          callback?.({
            ok:
              false,

            message:
              "방장만 게임을 시작할 수 있습니다.",
          });

          return;
        }

        if (
          room.status !==
          "waiting"
        ) {
          callback?.({
            ok:
              false,

            message:
              "이미 게임이 시작되었습니다.",
          });

          return;
        }

        /*
         * 최소 인원
         */
        if (
          room.players.length <
          DEVIL_GAME_MIN_PLAYERS
        ) {
          const need =
            DEVIL_GAME_MIN_PLAYERS -
            room.players.length;

          callback?.({
            ok:
              false,

            message:
              `${need}명이 더 필요합니다.`,
          });

          return;
        }

        /*
         * 바로 게임 시작 X
         *
         * 먼저 사무실 대기 화면에서
         * 카운트다운 시작.
         */
        room.status =
          "countdown";

        room.countdownEndsAt =
          Date.now() +
          POTATO_WAR_START_COUNTDOWN_MS;

        broadcastRoomUpdate(
          room
        );

        io.to(
          getSocketRoomName(
            room.id
          )
        ).emit(
          "devilGame:countdown",
          {
            roomId:
              room.id,

            countdownEndsAt:
              room.countdownEndsAt,
          }
        );

        callback?.({
          ok:
            true,

          countdownEndsAt:
            room.countdownEndsAt,
        });

        /*
         * 카운트다운 종료 후
         * 역할 배정 및 게임 시작
         */
        setTimeout(
          () => {
            const currentRoom =
              devilRooms[
                room.id
              ];

            beginPotatoWar(
              currentRoom
            );
          },
          POTATO_WAR_START_COUNTDOWN_MS
        );
      }
    );

    /* =====================================================
       Potato War Reconnect
    ===================================================== */

    socket.on(
      "devilGame:join",
      (
        payload = {},
        callback
      ) => {
        const roomId =
          String(
            payload.roomId ??
            ""
          )
            .trim()
            .toUpperCase();

        const nickname =
          String(
            payload.nickname ??
            ""
          ).trim();

        const room =
          devilRooms[
            roomId
          ];

        if (
          !room ||
          room.status !==
            "playing" ||
          !room.gamePlayers
        ) {
          callback?.({
            ok:
              false,

            message:
              "진행 중인 감자 전쟁을 찾을 수 없습니다.",
          });

          return;
        }

        /*
         * 기존 닉네임으로
         * 게임 참가자를 찾아 재연결
         */
        const gamePlayer =
          findGamePlayerByNickname(
            room,
            nickname
          );

        if (
          !gamePlayer
        ) {
          callback?.({
            ok:
              false,

            message:
              "이 게임의 참가자 정보를 찾을 수 없습니다.",
          });

          return;
        }

        /*
         * 새로운 Socket ID 연결
         */
        gamePlayer.connectedSocketId =
          socket.id;

        socket.join(
          getSocketRoomName(
            room.id
          )
        );

        /*
         * 게임 화면용 새 소켓도
         * players에 연결
         */
        players[
          socket.id
        ] = {
          id:
            socket.id,

          nickname:
            gamePlayer.nickname,

          x:
            gamePlayer.x,

          y:
            gamePlayer.y,

          characterStyle:
            gamePlayer.characterStyle,
        };

        callback?.({
          ok:
            true,

          self: {
            ...getPublicGamePlayer(
              gamePlayer
            ),

            /*
             * 자신의 역할만 반환
             */
            role:
              gamePlayer.role,
          },

          state:
            getPublicGameState(
              room
            ),
        });

        broadcastGameState(
          room
        );
      }
    );

    /* =====================================================
       Potato War Move
    ===================================================== */

    socket.on(
      "devilGame:move",
      position => {
        const room =
          findGameRoomBySocket(
            socket.id
          );

        if (
          !room
        ) {
          return;
        }

        const gamePlayer =
          findGamePlayerBySocket(
            room,
            socket.id
          );

        if (
          !gamePlayer
        ) {
          return;
        }

        const x =
          Number(
            position?.x
          );

        const y =
          Number(
            position?.y
          );

        if (
          !Number.isFinite(
            x
          ) ||
          !Number.isFinite(
            y
          )
        ) {
          return;
        }

        /*
         * 맵 밖으로 이동 방지
         */
        if (
          x < 0 ||
          x >
            POTATO_WAR_MAP_WIDTH ||
          y < 0 ||
          y >
            POTATO_WAR_MAP_HEIGHT
        ) {
          return;
        }

        gamePlayer.x =
          x;

        gamePlayer.y =
          y;

        /*
         * 같은 게임 참가자에게 이동 전달
         */
        socket
          .to(
            getSocketRoomName(
              room.id
            )
          )
          .emit(
            "devilGame:player-moved",
            {
              id:
                gamePlayer.id,

              x,
              y,
            }
          );
      }
    );

    /* =====================================================
       Devil Kill
    ===================================================== */

    socket.on(
      "devilGame:kill",
      (
        payload = {},
        callback
      ) => {
        const room =
          findGameRoomBySocket(
            socket.id
          );

        if (
          !room
        ) {
          callback?.({
            ok:
              false,

            message:
              "게임방을 찾을 수 없습니다.",
          });

          return;
        }

        const killer =
          findGamePlayerBySocket(
            room,
            socket.id
          );

        const victim =
          room.gamePlayers?.[
            String(
              payload
                .victimId ??
              ""
            )
          ];

        /*
         * 악마만 처치 가능
         */
        if (
          !killer ||
          killer.role !==
            "devil" ||
          killer.state !==
            "alive"
        ) {
          callback?.({
            ok:
              false,

            message:
              "처치할 수 없는 상태입니다.",
          });

          return;
        }

        /*
         * 살아있는 생존자만 가능
         */
        if (
          !victim ||
          victim.id ===
            killer.id ||
          victim.state !==
            "alive" ||
          victim.role !==
            "survivor"
        ) {
          callback?.({
            ok:
              false,

            message:
              "대상을 처치할 수 없습니다.",
          });

          return;
        }

        const now =
          Date.now();

        const elapsed =
          now -
          Number(
            killer.lastKillAt ??
            0
          );

        /*
         * 처치 쿨타임
         */
        if (
          elapsed <
          POTATO_WAR_KILL_COOLDOWN_MS
        ) {
          const remainingMs =
            POTATO_WAR_KILL_COOLDOWN_MS -
            elapsed;

          callback?.({
            ok:
              false,

            message:
              "처치 쿨타임입니다.",

            remainingMs,
          });

          return;
        }

        /*
         * 거리 계산
         */
        const dx =
          killer.x -
          victim.x;

        const dy =
          killer.y -
          victim.y;

        const distance =
          Math.sqrt(
            dx * dx +
            dy * dy
          );

        if (
          distance >
          POTATO_WAR_KILL_RANGE
        ) {
          callback?.({
            ok:
              false,

            message:
              "생존자에게 더 가까이 가야 합니다.",
          });

          return;
        }

        killer.lastKillAt =
          now;

        /*
         * 서버 기준 사망 처리
         */
        victim.state =
          "ghost";

        /*
         * 시체 생성
         */
        const corpse = {
          id:
            createId(),

          victimId:
            victim.id,

          nickname:
            victim.nickname,

          x:
            victim.x,

          y:
            victim.y,

          createdAt:
            now,
        };

        room.corpses.push(
          corpse
        );

        const eventPayload =
          {
            roomId:
              room.id,

            killerId:
              killer.id,

            victimId:
              victim.id,

            corpse,

            cooldownEndsAt:
              now +
              POTATO_WAR_KILL_COOLDOWN_MS,
          };

        /*
         * 게임 참가자 모두에게
         * 동일한 처치 장면 전달
         */
        io.to(
          getSocketRoomName(
            room.id
          )
        ).emit(
          "devilGame:kill-confirmed",
          eventPayload
        );

        callback?.({
          ok:
            true,

          cooldownEndsAt:
            eventPayload
              .cooldownEndsAt,
        });
      }
    );

    /* =====================================================
       Disconnect
    ===================================================== */

    socket.on(
      "disconnect",
      () => {
        const player =
          players[
            socket.id
          ];

        const playingRoom =
          findGameRoomBySocket(
            socket.id
          );

        if (
          playingRoom
        ) {
          /*
           * 게임 중이라면 바로 삭제하지 않고
           * 재접속 대기
           */
          handlePlayingDisconnect(
            playingRoom,
            socket.id
          );
        } else {
          /*
           * 대기방이라면 정상적으로 방 나가기
           */
          removePlayerFromWaitingRoom(
            socket
          );
        }

        if (
          player
        ) {
          const systemMessage =
            {
              id:
                createId(),

              type:
                "system",

              message:
                `${player.nickname} 감자가 퇴장했습니다.`,

              createdAt:
                Date.now(),
            };

          addChatMessage(
            systemMessage
          );

          io.emit(
            "chat:message",
            systemMessage
          );
        }

        delete players[
          socket.id
        ];

        io.emit(
          "players:update",
          Object.values(
            players
          )
        );

        /*
         * 아무도 없으면
         * 채팅 기록 초기화
         */
        if (
          Object.keys(
            players
          ).length ===
          0
        ) {
          chatHistory.length =
            0;
        }
      }
    );
  }
);

/* =========================================================
   Render Health / Test
========================================================= */

app.get(
  "/",
  (
    req,
    res
  ) => {
    res.send(
      "Gamja Office Socket Server 🥔"
    );
  }
);

/* =========================================================
   Server Start
========================================================= */

server.listen(
  PORT,
  "0.0.0.0",
  () => {
    console.log(
      `🥔 Gamja Office server running on port ${PORT}`
    );
  }
);