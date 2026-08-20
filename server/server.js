const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();

const server =
  http.createServer(app);

/* =========================================================
   Socket.IO
========================================================= */

const io = new Server(
  server,
  {
    cors: {
      origin: "*",

      methods: [
        "GET",
        "POST",
      ],
    },
  }
);

/* =========================================================
   Players
========================================================= */

const players = {};

/* =========================================================
   Chat
========================================================= */

const chatHistory = [];

const MAX_CHAT_HISTORY =
  50;

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
   Devil Game Rooms
========================================================= */

/*
 * rooms 구조
 *
 * {
 *   "GAMJA-1234": {
 *      id: "GAMJA-1234",
 *      hostId: "...",
 *      status: "waiting",
 *      maxPlayers: 6,
 *      players: ["socketId", ...],
 *      roles: {
 *          socketId: "survivor"
 *      }
 *   }
 * }
 */

const devilRooms = {};

/* =========================================================
   Devil Game Constants
========================================================= */
const DEVIL_GAME_MIN_PLAYERS =
  2;

const DEVIL_GAME_DEFAULT_MAX_PLAYERS =
  5;

const DEVIL_GAME_MAX_PLAYERS =
  5;

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
   Socket.IO Room Name

   Socket.IO 자체 room과
   게임 room id를 구분하기 위한 prefix
========================================================= */

function getSocketRoomName(
  roomId
) {
  return `devil:${roomId}`;
}

/* =========================================================
   Find Player Room
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
   Public Player
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

    characterStyle:
      player.characterStyle,
  };
}

/* =========================================================
   Public Room

   중요:
   roles는 절대로 클라이언트 전체에 보내지 않는다.
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

    players:
      room.players
        .map(
          socketId =>
            getPublicRoomPlayer(
              socketId
            )
        )
        .filter(
          Boolean
        ),
  };
}

/* =========================================================
   All Public Rooms
========================================================= */

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
   Broadcast Room List

   메인 사무실에서
   현재 모집 중인 게임들을 보여주기 위해 사용.
========================================================= */

function broadcastRoomList() {
  io.emit(
    "devilRooms:update",
    getPublicRooms()
  );
}

/* =========================================================
   Broadcast Single Room
========================================================= */

function broadcastRoomUpdate(
  room
) {
  if (!room) {
    return;
  }

  io
    .to(
      getSocketRoomName(
        room.id
      )
    )
    .emit(
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
   * 4 ~ 6명
   * 악마 1명
   *
   * 7 ~ 8명
   * 악마 2명
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
   Remove Player From Devil Room
========================================================= */

function removePlayerFromDevilRoom(
  socket
) {
  const room =
    findPlayerRoom(
      socket.id
    );

  if (!room) {
    return;
  }

  /* =====================================
     방 참가자 제거
  ===================================== */

  room.players =
    room.players.filter(
      id =>
        id !==
        socket.id
    );

  /* =====================================
     역할 데이터 제거
  ===================================== */

  if (room.roles) {
    delete room.roles[
      socket.id
    ];
  }

  /* =====================================
     Socket.IO room에서도 제거
  ===================================== */

  socket.leave(
    getSocketRoomName(
      room.id
    )
  );

  /* =====================================
     아무도 없으면 방 삭제
  ===================================== */

  if (
    room.players.length ===
    0
  ) {
    delete devilRooms[
      room.id
    ];

    console.log(
      "🧹 게임방 삭제:",
      room.id
    );

    broadcastRoomList();

    return;
  }

  /* =====================================
     방장이 나갔으면
     다음 참가자에게 방장 넘김
  ===================================== */

  if (
    room.hostId ===
    socket.id
  ) {
    room.hostId =
      room.players[0];

    console.log(
      "👑 새로운 방장:",
      room.hostId
    );
  }

  broadcastRoomUpdate(
    room
  );
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
       Join Office
    ===================================================== */

    socket.on(
      "player:join",
      playerData => {
        const nickname =
          String(
            playerData.nickname ??
              ""
          ).trim();

        if (!nickname) {
          return;
        }

        players[socket.id] = {
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
            playerData.characterStyle,
        };

        console.log(
          "🥔 입장:",
          `${nickname} 감자`
        );

        /* 기존 채팅 기록 */

        socket.emit(
          "chat:history",
          chatHistory
        );

        /* 전체 플레이어 */

        io.emit(
          "players:update",
          Object.values(
            players
          )
        );

        /*
         * 현재 게임방 목록도
         * 새 접속자에게 전달
         */

        socket.emit(
          "devilRooms:update",
          getPublicRooms()
        );

        /* 시스템 입장 메시지 */

        const systemMessage = {
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
       Player Move
    ===================================================== */

    socket.on(
      "player:move",
      position => {
        const player =
          players[socket.id];

        if (!player) {
          return;
        }

        const x =
          Number(
            position.x
          );

        const y =
          Number(
            position.y
          );

        if (
          !Number.isFinite(x) ||
          !Number.isFinite(y)
        ) {
          return;
        }

        player.x = x;
        player.y = y;

        socket.broadcast.emit(
          "player:moved",
          {
            id:
              socket.id,

            x,

            y,

            duration:
              Number(
                position.duration
              ) || 300,
          }
        );
      }
    );

    /* =====================================================
       Player Style
    ===================================================== */

    socket.on(
      "player:style",
      characterStyle => {
        const player =
          players[socket.id];

        if (!player) {
          return;
        }

        player.characterStyle =
          characterStyle;

        io.emit(
          "players:update",
          Object.values(
            players
          )
        );

        /*
         * 게임방 참가 상태라면
         * 대기방 캐릭터 정보도 갱신
         */

        const room =
          findPlayerRoom(
            socket.id
          );

        if (room) {
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
          players[socket.id];

        if (!player) {
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

        if (!message) {
          return;
        }

        const chatMessage = {
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
       DEVIL ROOM
       현재 방 목록 요청
    ===================================================== */

    socket.on(
      "devilRooms:list",
      callback => {
        if (
          typeof callback ===
          "function"
        ) {
          callback({
            ok: true,

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
       DEVIL ROOM
       방 생성
    ===================================================== */

    socket.on(
      "devilRoom:create",
      (
        options = {},
        callback
      ) => {
        const player =
          players[socket.id];

        if (!player) {
          if (
            typeof callback ===
            "function"
          ) {
            callback({
              ok: false,

              message:
                "먼저 사무실에 입장해주세요.",
            });
          }

          return;
        }

        /* =================================
           이미 다른 방에 참가 중인지
        ================================= */

        const currentRoom =
          findPlayerRoom(
            socket.id
          );

        if (currentRoom) {
          if (
            typeof callback ===
            "function"
          ) {
            callback({
              ok: false,

              message:
                "이미 게임방에 참가 중입니다.",
            });
          }

          return;
        }

        /* =================================
           최대 인원
        ================================= */

        let maxPlayers =
          Number(
            options.maxPlayers
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

        /* =================================
           Room
        ================================= */

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

          /*
           * 역할은 게임 시작 후에만 생성.
           * public room에는 절대 포함되지 않음.
           */
          roles: {},
        };

        devilRooms[
          roomId
        ] = room;

        /* =================================
           Socket.IO room 입장
        ================================= */

        socket.join(
          getSocketRoomName(
            roomId
          )
        );

        console.log(
          "🎮 게임방 생성:",
          roomId,
          `${player.nickname} 감자`
        );

        broadcastRoomUpdate(
          room
        );

        if (
          typeof callback ===
          "function"
        ) {
          callback({
            ok: true,

            room:
              getPublicRoom(
                room
              ),
          });
        }
      }
    );

    /* =====================================================
       DEVIL ROOM
       참가
    ===================================================== */

    socket.on(
      "devilRoom:join",
      (
        roomId,
        callback
      ) => {
        const player =
          players[socket.id];

        if (!player) {
          if (
            typeof callback ===
            "function"
          ) {
            callback({
              ok: false,

              message:
                "먼저 사무실에 입장해주세요.",
            });
          }

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

        if (!room) {
          if (
            typeof callback ===
            "function"
          ) {
            callback({
              ok: false,

              message:
                "존재하지 않는 게임방입니다.",
            });
          }

          return;
        }

        /* =================================
           진행 중
        ================================= */

        if (
          room.status !==
          "waiting"
        ) {
          if (
            typeof callback ===
            "function"
          ) {
            callback({
              ok: false,

              message:
                "이미 게임이 시작된 방입니다.",
            });
          }

          return;
        }

        /* =================================
           다른 방 참가 여부
        ================================= */

        const currentRoom =
          findPlayerRoom(
            socket.id
          );

        if (
          currentRoom &&
          currentRoom.id !==
            room.id
        ) {
          if (
            typeof callback ===
            "function"
          ) {
            callback({
              ok: false,

              message:
                "이미 다른 게임방에 참가 중입니다.",
            });
          }

          return;
        }

        /* =================================
           이미 참가중
        ================================= */

        if (
          room.players.includes(
            socket.id
          )
        ) {
          if (
            typeof callback ===
            "function"
          ) {
            callback({
              ok: true,

              room:
                getPublicRoom(
                  room
                ),
            });
          }

          return;
        }

        /* =================================
           Full
        ================================= */

        if (
          room.players.length >=
          room.maxPlayers
        ) {
          if (
            typeof callback ===
            "function"
          ) {
            callback({
              ok: false,

              message:
                "게임방 인원이 가득 찼습니다.",
            });
          }

          return;
        }

        /* =================================
           Join
        ================================= */

        room.players.push(
          socket.id
        );

        socket.join(
          getSocketRoomName(
            room.id
          )
        );

        console.log(
          "🎮 게임방 참가:",
          room.id,
          `${player.nickname} 감자`
        );

        broadcastRoomUpdate(
          room
        );

        if (
          typeof callback ===
          "function"
        ) {
          callback({
            ok: true,

            room:
              getPublicRoom(
                room
              ),
          });
        }
      }
    );

    /* =====================================================
       DEVIL ROOM
       나가기
    ===================================================== */

    socket.on(
      "devilRoom:leave",
      callback => {
        const room =
          findPlayerRoom(
            socket.id
          );

        if (!room) {
          if (
            typeof callback ===
            "function"
          ) {
            callback({
              ok: true,
            });
          }

          return;
        }

        /*
         * 첫 버전에서는 진행 중인 게임도
         * leave 요청 시 방에서 제거.
         *
         * 추후 게임 중 퇴장 처리는
         * 사망/탈주 처리로 분리 가능.
         */

        removePlayerFromDevilRoom(
          socket
        );

        if (
          typeof callback ===
          "function"
        ) {
          callback({
            ok: true,
          });
        }
      }
    );

    /* =====================================================
       DEVIL ROOM
       게임 시작
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

        if (!room) {
          if (
            typeof callback ===
            "function"
          ) {
            callback({
              ok: false,

              message:
                "게임방을 찾을 수 없습니다.",
            });
          }

          return;
        }

        /* =================================
           방장만 가능
        ================================= */

        if (
          room.hostId !==
          socket.id
        ) {
          if (
            typeof callback ===
            "function"
          ) {
            callback({
              ok: false,

              message:
                "방장만 게임을 시작할 수 있습니다.",
            });
          }

          return;
        }

        /* =================================
           상태
        ================================= */

        if (
          room.status !==
          "waiting"
        ) {
          if (
            typeof callback ===
            "function"
          ) {
            callback({
              ok: false,

              message:
                "이미 게임이 시작되었습니다.",
            });
          }

          return;
        }

        /* =================================
           최소 인원
        ================================= */

        if (
          room.players.length <
          DEVIL_GAME_MIN_PLAYERS
        ) {
          const need =
            DEVIL_GAME_MIN_PLAYERS -
            room.players.length;

          if (
            typeof callback ===
            "function"
          ) {
            callback({
              ok: false,

              message:
                `${need}명이 더 필요합니다.`,
            });
          }

          return;
        }

        /* =================================
           Role
        ================================= */

        room.roles =
          assignRoles(
            room
          );

        room.status =
          "playing";

        room.startedAt =
          Date.now();

        console.log(
          "감자 전쟁 게임 시작:",
          room.id
        );

        /* =================================
           각자에게 자기 역할만 전달

           절대 io.emit으로 역할 전체를
           전송하면 안 됨.
        ================================= */

        room.players.forEach(
          socketId => {
            const role =
              room.roles[
                socketId
              ];

            io
              .to(
                socketId
              )
              .emit(
                "devilGame:role",
                {
                  roomId:
                    room.id,

                  role,
                }
              );
          }
        );

        /* =================================
           공개 상태 갱신
        ================================= */

        broadcastRoomUpdate(
          room
        );

        /* =================================
           게임 시작 알림

           여기에는 역할 정보가 없다.
        ================================= */

        io
          .to(
            getSocketRoomName(
              room.id
            )
          )
          .emit(
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
                  .filter(
                    Boolean
                  ),
            }
          );

        if (
          typeof callback ===
          "function"
        ) {
          callback({
            ok: true,
          });
        }
      }
    );

    /* =====================================================
       Disconnect
    ===================================================== */

    socket.on(
      "disconnect",
      () => {
        const player =
          players[socket.id];

        /* =================================
           게임방에서 먼저 제거
        ================================= */

        removePlayerFromDevilRoom(
          socket
        );

        /* =================================
           Office Player
        ================================= */

        if (player) {
          console.log(
            "🥔 퇴장:",
            `${player.nickname} 감자`
          );

          const systemMessage = {
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

        /* =================================
           플레이어 제거
        ================================= */

        delete players[
          socket.id
        ];

        /* =================================
           플레이어 목록
        ================================= */

        io.emit(
          "players:update",
          Object.values(
            players
          )
        );

        /* =================================
           아무도 없으면 채팅 초기화
        ================================= */

        if (
          Object.keys(
            players
          ).length ===
          0
        ) {
          chatHistory.length =
            0;

          console.log(
            "🧹 사무실이 비어서 채팅 기록을 초기화했습니다."
          );
        }
      }
    );
  }
);

/* =========================================================
   Test
========================================================= */

app.get(
  "/",
  (req, res) => {
    res.send(
      "Gamja Office Socket Server 🥔"
    );
  }
);

/* =========================================================
   Start
========================================================= */

const PORT =
  4000;

server.listen(
  PORT,
  () => {
    console.log(
      `🥔 Gamja Office server running on http://localhost:${PORT}`
    );
  }
);