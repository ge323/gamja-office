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
 *
 * 나중에 실제 게임에서는
 * 20~30초 정도로 늘려도 됨.
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
   Game Spawn Points

   참가자들이 게임 시작 시 서로 겹치지 않도록
   맵의 서로 다른 방에서 시작한다.

   좌표는 DevilOfficeMap의 WALKABLE_AREAS 안쪽에
   들어오도록 잡아두었다.
========================================================= */

const POTATO_WAR_SPAWN_POINTS = [
  {
    id: "power",
    x: 330,
    y: 240,
  },

  {
    id: "lounge",
    x: 1100,
    y: 220,
  },

  {
    id: "cctv",
    x: 1880,
    y: 240,
  },

  {
    id: "archive",
    x: 300,
    y: 680,
  },

  {
    id: "pantry",
    x: 1850,
    y: 680,
  },

  {
    id: "meeting",
    x: 1100,
    y: 1150,
  },
];

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

    /*
     * 대기실에서도
     * 사용자가 꾸민 감자 모습을 유지.
     */
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
     * roles는 절대 전달하지 않는다.
     *
     * 악마가 누군지 다른 사용자에게
     * 노출되면 안 됨.
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
               * 대기실 준비 상태도
               * 모든 참가자에게 동기화.
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
  /*
   * 현재 최대 인원이 5명이므로
   * 악마는 기본 1명.
   *
   * 추후 최대 인원을 늘린다면
   * 7명 이상부터 악마 2명.
   */
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

  /*
   * 매 게임마다 시작 위치 순서를 다시 섞는다.
   *
   * 역할과 시작 위치는 서로 무관하게 배정되므로
   * 특정 장소에서 시작했다고 악마라는 힌트를
   * 얻을 수 없도록 한다.
   */
  const spawnPoints =
    shuffleArray(
      POTATO_WAR_SPAWN_POINTS
    );

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
       * 최대 인원은 현재 6명이므로
       * 참가자마다 서로 다른 스폰 포인트를 사용한다.
       *
       * 혹시 추후 최대 인원을 늘려도 서버가 깨지지 않도록
       * modulo fallback은 유지한다.
       */
      const spawnPoint =
        spawnPoints[
          index %
            spawnPoints.length
        ];

      room.gamePlayers[
        socketId
      ] = {
        /*
         * 게임 내에서 유지되는 ID
         */
        id:
          socketId,

        /*
         * 실제 현재 Socket ID
         */
        connectedSocketId:
          socketId,

        nickname:
          officePlayer.nickname,

        /*
         * 기존 캐릭터 커스텀 유지
         */
        characterStyle:
          officePlayer.characterStyle,

        role:
          room.roles[
            socketId
          ],

        /*
         * alive
         * ghost
         */
        state:
          "alive",

        /*
         * 참가자마다 서로 다른 랜덤 시작 위치.
         */
        x:
          spawnPoint.x,

        y:
          spawnPoint.y,

        /*
         * 디버깅할 때 시작 위치를 확인하기 위한 값.
         * 클라이언트에는 공개하지 않아도 된다.
         */
        spawnId:
          spawnPoint.id,

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
   * role은 다른 플레이어에게 공개하지 않음.
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

  /*
   * 카운트다운 도중 누군가 나가서
   * 최소 인원이 안 되면 시작 취소.
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
   * 본 게임 데이터 생성
   */
  createGameRuntime(
    room
  );

  /*
   * 자기 자신의 역할만 전송.
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

            /*
             * 게임 시작 당시의 고정 플레이어 ID.
             * 이후 Socket이 바뀌어도 이 ID로 재연결한다.
             */
            playerId:
              socketId,
          }
        );
    }
  );

  /*
   * 공개 가능한 방 정보 갱신.
   */
  broadcastRoomUpdate(
    room
  );

  /*
   * 참가자 전원에게
   * 게임 시작 알림.
   *
   * 여기에는 역할 정보 없음.
   */
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

  /*
   * 이미 playing 상태인 경우는
   * 일반 대기실 제거 함수에서 처리하지 않는다.
   */
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

  /*
   * 남은 참가자가 없으면 방 삭제.
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
   * 방장이 나갔으면
   * 다음 사람을 자동 방장으로 지정.
   */
  if (
    room.hostId ===
    socket.id
  ) {
    room.hostId =
      room.players[0];
  }

  /*
   * 카운트다운 중 인원이 부족해지면
   * 다시 waiting.
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
   * 새 페이지로 이동할 때
   * Socket ID가 변경될 수 있으므로
   * 즉시 삭제하지 않는다.
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

      /*
       * 이미 새 Socket으로
       * 연결됐다면 삭제하지 않는다.
       */
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

      /*
       * 아무도 없으면 방 삭제.
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

        /*
         * 기존 일반 채팅 기록.
         */
        socket.emit(
          "chat:history",
          chatHistory
        );

        /*
         * 현재 오피스 접속자.
         */
        io.emit(
          "players:update",
          Object.values(
            players
          )
        );

        /*
         * 현재 감자 전쟁 방 목록.
         */
        socket.emit(
          "devilRooms:update",
          getPublicRooms()
        );

        /*
         * 시스템 입장 메시지.
         */
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

        /*
         * 오피스 캐릭터 업데이트.
         */
        io.emit(
          "players:update",
          Object.values(
            players
          )
        );

        /*
         * 대기실에도 꾸민 모습 실시간 반영.
         */
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

       같은 게임 대기실 안의 사람에게만 전달.
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

        /*
         * 서버에 저장된 실제 참가방과
         * 클라이언트 roomId가 같은지 검사.
         */
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

        /*
         * 게임 대기 중 / 카운트다운 중에만
         * 로비 채팅 허용.
         */
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

        /*
         * io.emit이 아니라
         * 이 게임방 참가자에게만 전송.
         */
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

        /*
         * 이미 다른 방 참가 중.
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
             * 대기실 준비 상태.
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

        /*
         * waiting일 때만 새 참가자 가능.
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
         * 이미 이 방에 들어온 경우.
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
         * 인원 초과.
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
         * 같은 방에서 닉네임 중복 방지.
         */
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

       준비 / 준비 취소 상태를 서버에서 관리하고
       참가자 전체에게 실시간 동기화.
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

       방장이 버튼을 누르면
       즉시 역할 배정이 아니라
       먼저 countdown 상태로 전환.
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
         * 방장만 시작 가능.
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
         * 화면에서 버튼을 막더라도
         * 서버에서 다시 전원 준비 여부를 검증한다.
         */
        const allReady =
          room.players.every(
            stablePlayerId =>
              room.ready?.[
                stablePlayerId
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

        /*
         * 카운트다운 종료 후
         * 실제 역할 분배 및 게임 시작.
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
       Devil Game Reconnect / Join

       중요:
       닉네임이 아니라 게임 시작 당시의 고정 playerId로
       원래 캐릭터를 다시 찾는다.
    ===================================================== */

    socket.on(
      "devilGame:join",
      (
        payload = {},
        callback
      ) => {
        const roomId =
          String(
            payload?.roomId ??
              ""
          )
            .trim()
            .toUpperCase();

        const playerId =
          String(
            payload?.playerId ??
              ""
          ).trim();

        if (!roomId) {
          callback?.({
            ok:
              false,

            message:
              "게임방 정보가 없습니다.",
          });

          return;
        }

        if (!playerId) {
          callback?.({
            ok:
              false,

            message:
              "플레이어 정보가 없습니다.",
          });

          return;
        }

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
         * gamePlayers의 key 자체가 게임 시작 당시 playerId다.
         * Socket ID가 바뀌어도 이 값은 유지된다.
         */
        const gamePlayer =
          room.gamePlayers[
            playerId
          ];

        if (!gamePlayer) {
          console.log(
            "❌ 게임 플레이어 찾기 실패:",
            {
              roomId,
              playerId,
              availablePlayerIds:
                Object.keys(
                  room.gamePlayers
                ),
            }
          );

          callback?.({
            ok:
              false,

            message:
              "이 게임의 참가자 정보를 찾을 수 없습니다.",
          });

          return;
        }

        /*
         * 안정적인 playerId는 그대로 두고
         * 현재 연결된 Socket ID만 갱신한다.
         */
        gamePlayer.connectedSocketId =
          socket.id;

        socket.join(
          getSocketRoomName(
            room.id
          )
        );

        /*
         * 현재 Socket도 일반 player 목록에 등록하되,
         * 캐릭터 정보는 게임 시작 시 저장해둔 값을 사용한다.
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

        console.log(
          "🎮 게임 재연결:",
          {
            stablePlayerId:
              gamePlayer.id,
            socketId:
              socket.id,
            nickname:
              gamePlayer.nickname,
          }
        );

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

        /*
         * 게임 맵 밖으로 이동 방지.
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

        /*
         * 유령 포함 모든 게임 플레이어 이동 가능.
         * 벽 충돌 여부는 클라이언트에서 관리.
         */
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

        /*
         * 악마 + 생존 상태만 처치 가능.
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
         * 대상 검증.
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

        /*
         * Kill Cooldown
         */
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

        /*
         * 거리 검사.
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
         * 생존자 → 유령.
         */
        victim.state =
          "ghost";

        /*
         * 시체 생성.
         */
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

        /*
         * 악마의 공격 모션과
         * 생존자의 피격/유령 전환을
         * 모든 클라이언트가 동일하게 재생.
         */
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

        /*
         * 상태도 갱신.
         */
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

        /*
         * 본 게임 중이라면
         * 즉시 플레이어를 삭제하지 않는다.
         */
        if (
          playingRoom
        ) {
          handlePlayingDisconnect(
            playingRoom,
            socket.id
          );
        } else {
          /*
           * 대기실이면 방에서 제거.
           */
          removePlayerFromWaitingRoom(
            socket
          );
        }

        /*
         * 일반 오피스 퇴장 메시지.
         */
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
         * 오피스에 아무도 없으면
         * 일반 채팅 기록 초기화.
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