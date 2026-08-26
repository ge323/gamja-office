const express =
  require("express");

const http =
  require("http");

const {
  Server,
} =
  require("socket.io");

/* =========================================================
   Express / HTTP
========================================================= */

const app =
  express();

const server =
  http.createServer(
    app
  );

/* =========================================================
   Socket.IO
========================================================= */

const io =
  new Server(
    server,
    {
      cors: {
        origin:
          "*",

        methods: [
          "GET",
          "POST",
        ],
      },
    }
  );

/* =========================================================
   PORT
========================================================= */

const PORT =
  process.env.PORT ||
  4000;

/* =========================================================
   Players
========================================================= */

const players =
  {};

/* =========================================================
   Main Chat
========================================================= */

const chatHistory =
  [];

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

const devilRooms =
  {};

/* =========================================================
   Devil Game Constants
========================================================= */

const DEVIL_GAME_MIN_PLAYERS =
  2;

const DEVIL_GAME_DEFAULT_MAX_PLAYERS =
  6;

const DEVIL_GAME_MAX_PLAYERS =
  6;

/*
 * 방장이 게임 시작을 누른 후
 * 역할 공개 전까지 기다리는 시간.
 */
const POTATO_WAR_START_COUNTDOWN_MS =
  8_000;

/*
 * 개발 테스트용 처치 쿨타임.
 */
const POTATO_WAR_KILL_COOLDOWN_MS =
  5_000;

/*
 * 화면 전환 과정에서
 * Socket이 잠깐 끊겼다가 다시 연결되는 것을
 * 허용하기 위한 시간.
 */
const POTATO_WAR_RECONNECT_GRACE_MS =
  15_000;

/*
 * 악마가 생존자를 죽일 수 있는 거리.
 */
const POTATO_WAR_KILL_RANGE =
  135;

/*
 * 실제 감자 전쟁 맵 크기.
 */
const POTATO_WAR_MAP_WIDTH =
  2200;

const POTATO_WAR_MAP_HEIGHT =
  1400;

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
    devilRooms[
      roomId
    ]
  );

  return roomId;
}

/* =========================================================
   Socket.IO Room Name
========================================================= */

function getSocketRoomName(
  roomId
) {
  return `devil:${roomId}`;
}

/* =========================================================
   Find Waiting / Lobby Room
========================================================= */

function findPlayerRoom(
  socketId
) {
  return Object.values(
    devilRooms
  ).find(
    room =>
      Array.isArray(
        room.players
      ) &&
      room.players.includes(
        socketId
      )
  );
}

/* =========================================================
   Public Lobby Player
========================================================= */

function getPublicRoomPlayer(
  socketId
) {
  const player =
    players[
      socketId
    ];

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
   Public Lobby Room
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

    countdownEndsAt:
      room.countdownEndsAt ??
      null,

    /*
     * 악마 역할은 공개하지 않는다.
     */
    players:
      room.players
        .map(
          socketId => {
            const player =
              getPublicRoomPlayer(
                socketId
              );

            if (!player) {
              return null;
            }

            return {
              ...player,

              /*
               * 대기실 준비 상태
               */
              ready:
                Boolean(
                  room.ready?.[
                    socketId
                  ]
                ),
            };
          }
        )
        .filter(
          Boolean
        ),
  };
}

/* =========================================================
   Public Rooms
========================================================= */

function getPublicRooms() {
  return Object.values(
    devilRooms
  )
    .map(
      room =>
        getPublicRoom(
          room
        )
    )
    .filter(
      Boolean
    );
}

/* =========================================================
   Broadcast Lobby Rooms
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
   Assign Roles
========================================================= */

function assignRoles(
  room
) {
  const devilCount =
    room.players.length >=
    7
      ? 2
      : 1;

  const shuffled =
    shuffleArray(
      room.players
    );

  const devilIds =
    new Set(
      shuffled.slice(
        0,
        devilCount
      )
    );

  const roles =
    {};

  room.players.forEach(
    socketId => {
      roles[
        socketId
      ] =
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
   Create Game Runtime
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

      const row =
        Math.floor(
          index / 3
        );

      const column =
        index % 3;

      room.gamePlayers[
        socketId
      ] = {
        id:
          socketId,

        connectedSocketId:
          socketId,

        nickname:
          officePlayer.nickname,

        /*
         * 게임 시작 후에도
         * 각 참가자의 꾸민 감자 상태 유지
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
          gamePlayer =>
            getPublicGamePlayer(
              gamePlayer
            )
        )
        .filter(
          Boolean
        ),

    corpses:
      room.corpses ??
      [],
  };
}

/* =========================================================
   Broadcast Game State
========================================================= */

function broadcastGameState(
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
      "devilGame:state",
      getPublicGameState(
        room
      )
    );
}

/* =========================================================
   Find Playing Room By Socket
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
        gamePlayer =>
          gamePlayer
            .connectedSocketId ===
          socketId
      );
    }
  );
}

/* =========================================================
   Find Game Player By Socket
========================================================= */

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
      gamePlayer =>
        gamePlayer
          .connectedSocketId ===
        socketId
    ) ??
    null
  );
}

/* =========================================================
   Find Game Player By Nickname
========================================================= */

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
      gamePlayer =>
        gamePlayer.nickname ===
        nickname
    ) ??
    null
  );
}

/* =========================================================
   Begin Potato War
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

  createGameRuntime(
    room
  );

  /*
   * 자신의 역할만 각자에게 전달
   */
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

  broadcastRoomUpdate(
    room
  );

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
              socketId =>
                getPublicRoomPlayer(
                  socketId
                )
            )
            .filter(
              Boolean
            ),
      }
    );
}

/* =========================================================
   Remove Player From Lobby Room
========================================================= */

function removePlayerFromWaitingRoom(
  socket
) {
  const room =
    findPlayerRoom(
      socket.id
    );

  if (!room) {
    return;
  }

  if (
    room.status ===
    "playing"
  ) {
    return;
  }

  room.players =
    room.players.filter(
      id =>
        id !==
        socket.id
    );

  if (
    room.roles
  ) {
    delete room.roles[
      socket.id
    ];
  }

  /*
   * 나간 참가자의
   * 준비 상태도 제거
   */
  if (
    room.ready
  ) {
    delete room.ready[
      socket.id
    ];
  }

  socket.leave(
    getSocketRoomName(
      room.id
    )
  );

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
   * 방장이 나가면
   * 다음 참가자가 방장
   */
  if (
    room.hostId ===
    socket.id
  ) {
    room.hostId =
      room.players[0];
  }

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
        !currentRoom ||
        !currentRoom
          .gamePlayers ||
        !currentRoom
          .gamePlayers[
            stablePlayerId
          ]
      ) {
        return;
      }

      const currentGamePlayer =
        currentRoom
          .gamePlayers[
            stablePlayerId
          ];

      if (
        currentGamePlayer
          .connectedSocketId
      ) {
        return;
      }

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
            Number(
              playerData
                ?.x
            ) ||
            735,

          y:
            Number(
              playerData
                ?.y
            ) ||
            565,

          characterStyle:
            playerData
              ?.characterStyle,
        };

        console.log(
          "🥔 입장:",
          nickname
        );

        socket.emit(
          "chat:history",
          chatHistory
        );

        io.emit(
          "players:update",
          Object.values(
            players
          )
        );

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

        if (!player) {
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

        socket
          .broadcast
          .emit(
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
       Character Style Sync
    ===================================================== */

    socket.on(
      "player:style",
      characterStyle => {
        const player =
          players[
            socket.id
          ];

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

        const room =
          findPlayerRoom(
            socket.id
          );

        if (
          room &&
          room.status !==
            "playing"
        ) {
          broadcastRoomUpdate(
            room
          );
        }
      }
    );

    /* =====================================================
       Main Office Chat
    ===================================================== */

    socket.on(
      "chat:send",
      rawMessage => {
        const player =
          players[
            socket.id
          ];

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
       Devil Lobby Chat
    ===================================================== */

    socket.on(
      "devilLobby:chat",
      payload => {
        const player =
          players[
            socket.id
          ];

        if (!player) {
          return;
        }

        const room =
          findPlayerRoom(
            socket.id
          );

        if (!room) {
          return;
        }

        const requestedRoomId =
          String(
            payload
              ?.roomId ??
              ""
          )
            .trim()
            .toUpperCase();

        if (
          requestedRoomId &&
          requestedRoomId !==
            room.id
        ) {
          return;
        }

        if (
          room.status !==
            "waiting" &&
          room.status !==
            "countdown"
        ) {
          return;
        }

        const message =
          String(
            payload
              ?.message ??
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

        const lobbyMessage =
          {
            id:
              createId(),

            nickname:
              player.nickname,

            message,

            createdAt:
              Date.now(),
          };

        io
          .to(
            getSocketRoomName(
              room.id
            )
          )
          .emit(
            "devilLobby:chat",
            lobbyMessage
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

          return;
        }

        socket.emit(
          "devilRooms:update",
          getPublicRooms()
        );
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

        if (!player) {
          callback?.({
            ok:
              false,

            message:
              "먼저 사무실에 입장해주세요.",
          });

          return;
        }

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
              ?.maxPlayers
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

        const room =
          {
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
             * 각 참가자의 준비 상태
             */
            ready: {
              [socket.id]:
                false,
            },

            roles:
              {},

            countdownEndsAt:
              null,

            startedAt:
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

        console.log(
          "🎮 게임방 생성:",
          roomId
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

        if (!player) {
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

        if (!room) {
          callback?.({
            ok:
              false,

            message:
              "존재하지 않는 게임방입니다.",
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

        const duplicateNickname =
          room.players.some(
            id =>
              players[
                id
              ]?.nickname ===
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

        /*
         * 새 참가자는 준비 안 된 상태
         */
        room.ready ??=
          {};

        room.ready[
          socket.id
        ] = false;

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
       Devil Room Ready

       준비 / 준비 취소 상태 실시간 동기화
    ===================================================== */

    socket.on(
      "devilRoom:ready",
      (
        ready,
        callback
      ) => {
        const room =
          findPlayerRoom(
            socket.id
          );

        if (!room) {
          callback?.({
            ok:
              false,

            message:
              "참가 중인 게임방을 찾을 수 없습니다.",
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
              "현재는 준비 상태를 변경할 수 없습니다.",
          });

          return;
        }

        if (
          !room.players.includes(
            socket.id
          )
        ) {
          callback?.({
            ok:
              false,

            message:
              "이 게임방의 참가자가 아닙니다.",
          });

          return;
        }

        room.ready ??=
          {};

        room.ready[
          socket.id
        ] =
          Boolean(
            ready
          );

        /*
         * 참가자 전체에게
         * 준비상태 즉시 반영
         */
        broadcastRoomUpdate(
          room
        );

        callback?.({
          ok:
            true,
        });
      }
    );

    /* =====================================================
       Leave Devil Room
    ===================================================== */

    socket.on(
      "devilRoom:leave",
      callback => {
        const room =
          findPlayerRoom(
            socket.id
          );

        if (
          room?.status ===
          "playing"
        ) {
          callback?.({
            ok:
              false,

            message:
              "진행 중인 게임에서는 대기실 나가기를 사용할 수 없습니다.",
          });

          return;
        }

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

        if (!room) {
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
         * 최소 인원 체크
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
         * 방장을 포함한
         * 전원 준비 여부 확인
         */
        const allReady =
          room.players.every(
            playerId =>
              room.ready?.[
                playerId
              ] === true
          );

        if (!allReady) {
          callback?.({
            ok:
              false,

            message:
              "아직 준비하지 않은 참가자가 있습니다.",
          });

          return;
        }

        /*
         * 게임 시작 카운트다운
         */
        room.status =
          "countdown";

        room.countdownEndsAt =
          Date.now() +
          POTATO_WAR_START_COUNTDOWN_MS;

        broadcastRoomUpdate(
          room
        );

        io
          .to(
            getSocketRoomName(
              room.id
            )
          )
          .emit(
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
       Devil Game Reconnect / Join
    ===================================================== */

    socket.on(
      "devilGame:join",
      (
        payload = {},
        callback
      ) => {
        const roomId =
          String(
            payload
              ?.roomId ??
              ""
          )
            .trim()
            .toUpperCase();

        const nickname =
          String(
            payload
              ?.nickname ??
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

        gamePlayer.connectedSocketId =
          socket.id;

        socket.join(
          getSocketRoomName(
            room.id
          )
        );

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
       Devil Game Move
    ===================================================== */

    socket.on(
      "devilGame:move",
      position => {
        const room =
          findGameRoomBySocket(
            socket.id
          );

        if (!room) {
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

        if (!room) {
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

        const victimId =
          String(
            payload
              ?.victimId ??
              ""
          );

        const victim =
          room
            .gamePlayers?.[
              victimId
            ];

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
            killer
              .lastKillAt ??
              0
          );

        if (
          elapsed <
          POTATO_WAR_KILL_COOLDOWN_MS
        ) {
          callback?.({
            ok:
              false,

            message:
              "처치 쿨타임입니다.",

            remainingMs:
              POTATO_WAR_KILL_COOLDOWN_MS -
              elapsed,
          });

          return;
        }

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
         * 생존자 → 유령
         */
        victim.state =
          "ghost";

        const corpse =
          {
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

        io
          .to(
            getSocketRoomName(
              room.id
            )
          )
          .emit(
            "devilGame:kill-confirmed",
            eventPayload
          );

        broadcastGameState(
          room
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
          handlePlayingDisconnect(
            playingRoom,
            socket.id
          );
        } else {
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

        if (
          Object.keys(
            players
          ).length ===
          0
        ) {
          chatHistory.length =
            0;
        }

        console.log(
          "🥔 연결 종료:",
          socket.id
        );
      }
    );
  }
);

/* =========================================================
   Render Health Check
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