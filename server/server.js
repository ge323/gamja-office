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
  3;

const DEVIL_GAME_DEFAULT_MAX_PLAYERS =
  6;

const DEVIL_GAME_MAX_PLAYERS =
  6;

/*
 * 방장이 게임 시작을 누른 뒤
 * 실제 게임으로 넘어가기까지의 시간
 */
const POTATO_WAR_START_COUNTDOWN_MS =
  8_000;

/*
 * 개발 테스트용 공격 쿨타임
 */
const POTATO_WAR_KILL_COOLDOWN_MS =
  5_000;

/*
 * 화면 전환 과정에서 Socket 연결이
 * 잠깐 끊어지는 것을 허용하는 시간
 */
const POTATO_WAR_RECONNECT_GRACE_MS =
  15_000;

/*
 * 악마 공격 가능 거리
 */
const POTATO_WAR_KILL_RANGE =
  135;

/*
 * 게임 맵 크기
 */
const POTATO_WAR_MAP_WIDTH =
  2200;

const POTATO_WAR_MAP_HEIGHT =
  1400;

/* =========================================================
   Missions

   실제 미션 UI와 상세 데이터는
   프론트의 missionTypes.ts에서 관리한다.

   서버에서는 미션 ID만 관리한다.
========================================================= */

const POTATO_WAR_MISSION_IDS = [
  "copy-01",
  "archive-01",
  "coffee-01",
  "email-01",
  "meeting-01",
  "power-01",
  "server-01",
];

/*
 * 한 플레이어가 한 게임에서
 * 수행하게 될 미션 개수
 */
const POTATO_WAR_MISSIONS_PER_PLAYER =
  3;

/* =========================================================
   Game Spawn Points

   게임이 시작되면 모든 플레이어가
   한 장소에 몰리지 않고
   서로 다른 장소에서 시작한다.
========================================================= */

const POTATO_WAR_SPAWN_POINTS = [
  {
    id:
      "power",

    x:
      330,

    y:
      240,
  },

  {
    id:
      "lounge",

    x:
      1100,

    y:
      220,
  },

  {
    id:
      "cctv",

    x:
      1880,

    y:
      240,
  },

  {
    id:
      "archive",

    x:
      300,

    y:
      680,
  },

  {
    id:
      "pantry",

    x:
      1850,

    y:
      680,
  },

  {
    id:
      "meeting",

    x:
      1100,

    y:
      1150,
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
     * 꾸민 감자 모습도
     * 대기실에서 유지한다.
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
     * role 정보는 절대 여기에서
     * 공개하지 않는다.
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
   Create Personal Missions

   7개의 미션 중 3개를 무작위로 선택한다.

   플레이어별로 각각 실행되므로
   서로 다른 조합을 갖게 된다.

   일부 미션이 다른 사람과 겹치는 것은
   정상이며 의도된 동작이다.
========================================================= */

function createPersonalMissions() {
  return shuffleArray(
    POTATO_WAR_MISSION_IDS
  ).slice(
    0,
    POTATO_WAR_MISSIONS_PER_PLAYER
  );
}

/* =========================================================
   Assign Roles
========================================================= */

function assignRoles(
  room
) {
  /*
   * 게임 규칙
   *
   * 3~4명:
   * 악마 1명
   *
   * 5~6명:
   * 악마 2명
   */

  const devilCount =
    room.players.length >=
    5
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
   * 매 게임마다 시작 위치 순서를
   * 다시 랜덤으로 섞는다.
   *
   * 역할과 시작 장소는 무관하다.
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

      const spawnPoint =
        spawnPoints[
          index %
            spawnPoints.length
        ];

      /*
       * ★ 여기서 플레이어별
       * 랜덤 미션을 생성한다.
       */
      const missionIds =
        createPersonalMissions();

      room.gamePlayers[
        socketId
      ] = {
        /*
         * 게임 시작 당시의
         * 고정 플레이어 ID
         */
        id:
          socketId,

        /*
         * 현재 연결되어 있는
         * 실제 Socket ID
         */
        connectedSocketId:
          socketId,

        nickname:
          officePlayer.nickname,

        /*
         * 기존 캐릭터 커스텀 정보
         *
         * 안경 / 넥타이 / 모자 등
         * 게임에서도 그대로 유지
         */
        characterStyle:
          officePlayer.characterStyle,

        /*
         * devil / survivor
         */
        role:
          room.roles[
            socketId
          ],

        /*
         * alive / ghost
         */
        state:
          "alive",

        /*
         * 서로 다른 랜덤 시작 위치
         */
        x:
          spawnPoint.x,

        y:
          spawnPoint.y,

        /*
         * 디버깅용 시작 위치 ID
         */
        spawnId:
          spawnPoint.id,

        /*
         * ★ 개인 미션
         *
         * 예:
         * [
         *   "copy-01",
         *   "coffee-01",
         *   "server-01"
         * ]
         */
        missionIds,

        /*
         * 추후 서버에서 미션 완료까지
         * 검증할 때 사용할 수 있도록
         * 완료된 미션도 별도 보관
         */
        completedMissionIds:
          [],

        lastKillAt:
          0,
      };

      console.log(
        "🎯 개인 미션 배정:",
        {
          nickname:
            officePlayer.nickname,

          playerId:
            socketId,

          missionIds,
        }
      );
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
   * 중요:
   *
   * role
   * missionIds
   *
   * 둘 다 다른 사람에게 공개하면 안 된다.
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
   Count Active Players
========================================================= */

function getActiveGamePlayers(
  room
) {
  if (
    !room?.gamePlayers
  ) {
    return [];
  }

  return Object.values(
    room.gamePlayers
  ).filter(
    player =>
      player &&
      player.leftGame !==
        true
  );
}

/* =========================================================
   Count Alive Players
========================================================= */

function getAliveGamePlayers(
  room
) {
  return getActiveGamePlayers(
    room
  ).filter(
    player =>
      player.state ===
      "alive"
  );
}

/* =========================================================
   Finish Game
========================================================= */

function finishPotatoWar(
  room,
  winner,
  reason
) {
  if (!room) {
    return;
  }

  if (
    room.status ===
    "finished"
  ) {
    return;
  }

  room.status =
    "finished";

  room.finishedAt =
    Date.now();

  room.winner =
    winner;

  room.finishReason =
    reason;

  /* =====================================================
     Winner Players
  ===================================================== */

  const winnerPlayers =
    Object.values(
      room.gamePlayers ??
        {}
    )
      .filter(
        player => {
          if (
            player.leftGame ===
            true
          ) {
            return false;
          }

          if (
            winner ===
            "devil"
          ) {
            return (
              player.role ===
              "devil"
            );
          }

          return (
            player.role ===
            "survivor"
          );
        }
      )
      .map(
        player => ({
          id:
            player.id,

          nickname:
            player.nickname,

          characterStyle:
            player.characterStyle,
        })
      );

  const payload = {
    roomId:
      room.id,

    winner,

    reason,

    winnerPlayers,

    finishedAt:
      room.finishedAt,
  };

  console.log(
    "🏆 감자 전쟁 종료:",
    {
      roomId:
        room.id,

      winner,

      reason,

      winnerPlayers:
        winnerPlayers.map(
          player =>
            player.nickname
        ),
    }
  );

  /*
   * 모든 플레이어에게
   * 동일한 결과 화면을 보여준다.
   */
  io
    .to(
      getSocketRoomName(
        room.id
      )
    )
    .emit(
      "devilGame:finished",
      payload
    );

  /*
   * 방 목록에도 상태 반영.
   */
  broadcastRoomList();
}

/* =========================================================
   Check Game End Conditions
========================================================= */

function checkGameEnd(
  room
) {
  if (
    !room ||
    room.status !==
      "playing"
  ) {
    return;
  }

  const activePlayers =
    getActiveGamePlayers(
      room
    );

  /*
   * 게임 중 퇴장 등으로
   * 전체 참가자가 3명 미만이 되면
   * 즉시 게임 종료.
   */
  if (
    activePlayers.length <
    DEVIL_GAME_MIN_PLAYERS
  ) {
    const activeDevils =
      activePlayers.filter(
        player =>
          player.role ===
            "devil"
      );

    const activeSurvivors =
      activePlayers.filter(
        player =>
          player.role ===
            "survivor"
      );

    /*
     * 악마가 한 명도 없다면
     * 생존팀 승리.
     */
    if (
      activeDevils.length ===
      0
    ) {
      finishPotatoWar(
        room,
        "survivor",
        "all-devils-left"
      );

      return;
    }

    /*
     * 생존자가 없거나
     * 악마가 생존자 이상이면
     * 악마 승리.
     */
    if (
      activeSurvivors.length ===
        0 ||
      activeDevils.length >=
        activeSurvivors.length
    ) {
      finishPotatoWar(
        room,
        "devil",
        "not-enough-survivors"
      );

      return;
    }

    /*
     * 그 외에는 인원 부족으로
     * 생존팀 승리 처리.
     */
    finishPotatoWar(
      room,
      "survivor",
      "not-enough-players"
    );

    return;
  }

  /* =====================================================
     살아있는 플레이어
  ===================================================== */

  const alivePlayers =
    activePlayers.filter(
      player =>
        player.state ===
        "alive"
    );

  const aliveDevils =
    alivePlayers.filter(
      player =>
        player.role ===
        "devil"
    );

  const aliveSurvivors =
    alivePlayers.filter(
      player =>
        player.role ===
        "survivor"
    );

  /* =====================================================
     악마 전멸
  ===================================================== */

  if (
    aliveDevils.length ===
    0
  ) {
    finishPotatoWar(
      room,
      "survivor",
      "all-devils-eliminated"
    );

    return;
  }

  /* =====================================================
     생존자 전멸
  ===================================================== */

  if (
    aliveSurvivors.length ===
    0
  ) {
    finishPotatoWar(
      room,
      "devil",
      "all-survivors-eliminated"
    );

    return;
  }

  /* =====================================================
     악마 수 >= 생존자 수
  ===================================================== */

  if (
    aliveDevils.length >=
    aliveSurvivors.length
  ) {
    finishPotatoWar(
      room,
      "devil",
      "devils-outnumber-survivors"
    );
  }
}

/* =========================================================
   Waiting Room Player Remove
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

  room.players =
    room.players.filter(
      playerId =>
        playerId !==
        socket.id
    );

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
   * 아무도 없으면 방 삭제.
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
   * 다음 사람에게 방장 위임.
   */
  if (
    room.hostId ===
    socket.id
  ) {
    room.hostId =
      room.players[
        0
      ];
  }

  broadcastRoomUpdate(
    room
  );
}

/* =========================================================
   Playing Disconnect

   페이지 전환이나 네트워크 순간 끊김 때문에
   즉시 게임 퇴장으로 처리하지 않는다.
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

  if (!gamePlayer) {
    return;
  }

  const stablePlayerId =
    gamePlayer.id;

  /*
   * 현재 연결만 제거.
   * playerId 자체는 유지.
   */
  gamePlayer.connectedSocketId =
    null;

  gamePlayer.disconnectedAt =
    Date.now();

  console.log(
    "⚠️ 게임 연결 끊김:",
    {
      roomId:
        room.id,

      playerId:
        stablePlayerId,

      nickname:
        gamePlayer.nickname,
    }
  );

  /*
   * 일정 시간 안에 재접속하지 않으면
   * 실제 게임 퇴장으로 처리한다.
   */
  setTimeout(
    () => {
      const currentRoom =
        devilRooms[
          room.id
        ];

      if (
        !currentRoom ||
        currentRoom.status !==
          "playing"
      ) {
        return;
      }

      const currentPlayer =
        currentRoom
          .gamePlayers?.[
            stablePlayerId
          ];

      if (
        !currentPlayer
      ) {
        return;
      }

      /*
       * 이미 재접속했다면
       * 아무 처리하지 않는다.
       */
      if (
        currentPlayer
          .connectedSocketId
      ) {
        return;
      }

      /*
       * Grace Time이 지나도
       * 돌아오지 않았다.
       */
      currentPlayer.leftGame =
        true;

      console.log(
        "🚪 재접속 실패 → 게임 퇴장:",
        {
          roomId:
            currentRoom.id,

          playerId:
            currentPlayer.id,

          nickname:
            currentPlayer.nickname,
        }
      );

      broadcastGameState(
        currentRoom
      );

      checkGameEnd(
        currentRoom
      );
    },
    POTATO_WAR_RECONNECT_GRACE_MS
  );
}

/* =========================================================
   Begin Potato War
========================================================= */

function beginPotatoWar(
  room
) {
  if (!room) {
    return;
  }

  /*
   * 이미 시작됐거나
   * countdown 상태가 아니면 무시.
   */
  if (
    room.status !==
    "countdown"
  ) {
    return;
  }

  /*
   * 카운트다운 도중 사람이 빠져
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

    io
      .to(
        getSocketRoomName(
          room.id
        )
      )
      .emit(
        "devilGame:start-cancelled",
        {
          roomId:
            room.id,

          message:
            "참가 인원이 부족해 게임 시작이 취소되었습니다.",
        }
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

  /*
   * 실제 게임 플레이어 데이터 생성.
   *
   * 여기서:
   * - 캐릭터 저장
   * - 랜덤 스폰
   * - 개인 미션 3개
   *
   * 전부 결정된다.
   */
  createGameRuntime(
    room
  );

  room.status =
    "playing";

  room.startedAt =
    Date.now();

  room.countdownEndsAt =
    null;

  console.log(
    "🔥 감자 전쟁 시작:",
    {
      roomId:
        room.id,

      players:
        room.players.length,

      roles:
        room.roles,
    }
  );

  /*
   * 각 플레이어에게는
   * 자기 역할만 따로 전달한다.
   *
   * ★ 미션도 자기 것만 전달.
   */
  Object.values(
    room.gamePlayers
  ).forEach(
    gamePlayer => {
      const targetSocketId =
        gamePlayer
          .connectedSocketId;

      if (
        !targetSocketId
      ) {
        return;
      }

      io
        .to(
          targetSocketId
        )
        .emit(
          "devilGame:started",
          {
            roomId:
              room.id,

            playerId:
              gamePlayer.id,

            role:
              gamePlayer.role,

            missionIds:
              gamePlayer.missionIds,

            x:
              gamePlayer.x,

            y:
              gamePlayer.y,
          }
        );
    }
  );

  broadcastGameState(
    room
  );

  broadcastRoomList();
}

/* =========================================================
   Socket Connection
========================================================= */

io.on(
  "connection",
  socket => {
    console.log(
      "🥔 연결:",
      socket.id
    );

    /* =====================================================
       Initial Data
    ===================================================== */

    socket.emit(
      "players:update",
      Object.values(
        players
      )
    );

    socket.emit(
      "chat:history",
      chatHistory
    );

    socket.emit(
      "devilRooms:update",
      getPublicRooms()
    );

    /* =====================================================
       Player Join Office
    ===================================================== */

    socket.on(
      "player:join",
      payload => {
        const nickname =
          String(
            payload?.nickname ??
              "익명"
          )
            .trim()
            .slice(
              0,
              20
            );

        const x =
          Number(
            payload?.x
          );

        const y =
          Number(
            payload?.y
          );

        players[
          socket.id
        ] = {
          id:
            socket.id,

          nickname:
            nickname ||
            "익명",

          x:
            Number.isFinite(
              x
            )
              ? x
              : 600,

          y:
            Number.isFinite(
              y
            )
              ? y
              : 500,

          /*
           * 감자 외형 정보.
           */
          characterStyle:
            payload
              ?.characterStyle ??
            null,
        };

        io.emit(
          "players:update",
          Object.values(
            players
          )
        );

        console.log(
          "🥔 오피스 입장:",
          {
            id:
              socket.id,

            nickname:
              players[
                socket.id
              ].nickname,
          }
        );
      }
    );

    /* =====================================================
       Update Character Style
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
      }
    );

    /* =====================================================
       Normal Office Move
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

        socket.broadcast.emit(
          "player:moved",
          {
            id:
              socket.id,

            x,

            y,
          }
        );
      }
    );

    /* =====================================================
       Main Office Chat
    ===================================================== */

    socket.on(
      "chat:send",
      (
        payload,
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
          });

          return;
        }

        const text =
          String(
            payload?.message ??
              ""
          )
            .trim()
            .slice(
              0,
              300
            );

        if (!text) {
          callback?.({
            ok:
              false,
          });

          return;
        }

        const message = {
          id:
            createId(),

          type:
            "player",

          playerId:
            socket.id,

          nickname:
            player.nickname,

          message:
            text,

          createdAt:
            Date.now(),
        };

        addChatMessage(
          message
        );

        io.emit(
          "chat:message",
          message
        );

        callback?.({
          ok:
            true,
        });
      }
    );

    /* =====================================================
       Devil Rooms List
    ===================================================== */

    socket.on(
      "devilRooms:list",
      callback => {
        callback?.({
          ok:
            true,

          rooms:
            getPublicRooms(),
        });
      }
    );

    /* =====================================================
       Create Devil Room
    ===================================================== */

    socket.on(
      "devilRoom:create",
      (
        payload = {},
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
         * 이미 다른 대기방에 있다면
         * 먼저 나간다.
         */
        const oldRoom =
          findPlayerRoom(
            socket.id
          );

        if (oldRoom) {
          removePlayerFromWaitingRoom(
            socket
          );
        }

        const requestedMax =
          Number(
            payload
              ?.maxPlayers
          );

        const maxPlayers =
          Number.isFinite(
            requestedMax
          )
            ? Math.max(
                DEVIL_GAME_MIN_PLAYERS,
                Math.min(
                  DEVIL_GAME_MAX_PLAYERS,
                  Math.floor(
                    requestedMax
                  )
                )
              )
            : DEVIL_GAME_DEFAULT_MAX_PLAYERS;

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

          ready: {
            /*
             * 방장도 준비 버튼을 눌러야 한다.
             */
            [socket.id]:
              false,
          },

          countdownEndsAt:
            null,

          roles:
            {},

          gamePlayers:
            null,

          corpses:
            [],
        };

        devilRooms[
          roomId
        ] =
          room;

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
        payload = {},
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

        const roomId =
          String(
            payload?.roomId ??
              ""
          )
            .trim()
            .toUpperCase();

        const room =
          devilRooms[
            roomId
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
         * 다른 방에 들어가 있었다면
         * 먼저 기존 방에서 나간다.
         */
        const oldRoom =
          findPlayerRoom(
            socket.id
          );

        if (
          oldRoom &&
          oldRoom.id !==
            room.id
        ) {
          removePlayerFromWaitingRoom(
            socket
          );
        }

        /*
         * 이미 들어가 있는 경우
         * 중복 추가 방지.
         */
        if (
          !room.players.includes(
            socket.id
          )
        ) {
          room.players.push(
            socket.id
          );
        }

        room.ready[
          socket.id
        ] =
          false;

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
       Leave Waiting Room
    ===================================================== */

    socket.on(
      "devilRoom:leave",
      callback => {
        const room =
          findPlayerRoom(
            socket.id
          );

        if (!room) {
          callback?.({
            ok:
              true,
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
              "게임 진행 중에는 대기실 퇴장을 사용할 수 없습니다.",
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
       Ready
    ===================================================== */

    socket.on(
      "devilRoom:ready",
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

        const room =
          devilRooms[
            roomId
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

        if (
          room.status !==
          "waiting"
        ) {
          callback?.({
            ok:
              false,

            message:
              "현재 준비 상태를 변경할 수 없습니다.",
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
              "이 방의 참가자가 아닙니다.",
          });

          return;
        }

        room.ready[
          socket.id
        ] =
          Boolean(
            payload?.ready
          );

        broadcastRoomUpdate(
          room
        );

        callback?.({
          ok:
            true,

          ready:
            room.ready[
              socket.id
            ],
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
         * 모든 참가자가 준비했는지
         * 서버에서 다시 검증.
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
         * Countdown 시작.
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
         * Countdown 종료 후
         * 실제 게임 시작.
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
       Devil Game Join / Reconnect

       ★ 중요

       여기서 서버가 해당 플레이어에게만
       자신의 role + missionIds를 전달한다.
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
         * gamePlayers의 key는
         * 게임 시작 당시 playerId.
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
         * 이미 게임에서 명시적으로
         * 퇴장한 플레이어라면
         * 다시 입장시키지 않는다.
         */
        if (
          gamePlayer.leftGame ===
          true
        ) {
          callback?.({
            ok:
              false,

            message:
              "이미 퇴장한 게임입니다.",
          });

          return;
        }

        /*
         * 안정적인 playerId는 유지하고
         * 현재 Socket ID만 갱신.
         */
        gamePlayer.connectedSocketId =
          socket.id;

        gamePlayer.disconnectedAt =
          null;

        socket.join(
          getSocketRoomName(
            room.id
          )
        );

        /*
         * 현재 Socket도 일반 players에 등록.
         *
         * 캐릭터는 게임 시작 시
         * 저장했던 characterStyle 사용.
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
          "🎮 게임 입장/재연결:",
          {
            stablePlayerId:
              gamePlayer.id,

            socketId:
              socket.id,

            nickname:
              gamePlayer.nickname,

            role:
              gamePlayer.role,

            /*
             * 서버 로그 확인용.
             */
            missionIds:
              gamePlayer.missionIds,
          }
        );

        callback?.({
          ok:
            true,

          /*
           * ★ 자기 자신에게만
           * role + missionIds 전달.
           */
          self: {
            ...getPublicGamePlayer(
              gamePlayer
            ),

            role:
              gamePlayer.role,

            missionIds:
              gamePlayer.missionIds ??
              [],

            completedMissionIds:
              gamePlayer
                .completedMissionIds ??
              [],
          },

          /*
           * 전체 게임 상태에는
           * role과 missionIds가 없다.
           */
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
      payload => {
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

        if (!gamePlayer) {
          return;
        }

        if (
          gamePlayer.leftGame ===
          true
        ) {
          return;
        }

        const x =
          Number(
            payload?.x
          );

        const y =
          Number(
            payload?.y
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
         * 맵 밖으로 이동하는 것을
         * 서버에서도 방지한다.
         */
        gamePlayer.x =
          Math.max(
            0,
            Math.min(
              POTATO_WAR_MAP_WIDTH,
              x
            )
          );

        gamePlayer.y =
          Math.max(
            0,
            Math.min(
              POTATO_WAR_MAP_HEIGHT,
              y
            )
          );

        /*
         * 다른 플레이어들에게
         * 해당 플레이어의 이동만 전달.
         *
         * 클라이언트에서는 이 값을
         * 보간(interpolation)해서
         * 부드럽게 움직이게 하면 된다.
         */
        socket
          .to(
            getSocketRoomName(
              room.id
            )
          )
          .emit(
            "devilGame:playerMoved",
            {
              id:
                gamePlayer.id,

              x:
                gamePlayer.x,

              y:
                gamePlayer.y,
            }
          );
      }
    );

    /* =====================================================
       Mission Complete

       클라이언트에서 미션을 성공했을 때 호출.

       서버에서:
       1. 실제 배정받은 미션인지 확인
       2. 이미 완료했는지 확인
       3. 완료 목록에 추가

       악마의 가짜 미션도 완료 처리는 가능하지만,
       생존팀 미션 승리 계산에는 포함하지 않는다.
    ===================================================== */

    socket.on(
      "devilGame:missionComplete",
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
              "진행 중인 게임을 찾을 수 없습니다.",
          });

          return;
        }

        if (
          room.status !==
          "playing"
        ) {
          callback?.({
            ok:
              false,

            message:
              "현재 미션을 수행할 수 없습니다.",
          });

          return;
        }

        const gamePlayer =
          findGamePlayerBySocket(
            room,
            socket.id
          );

        if (!gamePlayer) {
          callback?.({
            ok:
              false,

            message:
              "플레이어 정보를 찾을 수 없습니다.",
          });

          return;
        }

        if (
          gamePlayer.leftGame ===
          true
        ) {
          callback?.({
            ok:
              false,

            message:
              "이미 게임에서 퇴장했습니다.",
          });

          return;
        }

        /*
         * 유령 상태에서는
         * 현재 미션 수행 불가.
         *
         * 나중에 Among Us처럼
         * 유령도 미션 가능하게 하고 싶으면
         * 이 조건만 제거하면 된다.
         */
        if (
          gamePlayer.state !==
          "alive"
        ) {
          callback?.({
            ok:
              false,

            message:
              "현재 상태에서는 미션을 수행할 수 없습니다.",
          });

          return;
        }

        const missionId =
          String(
            payload?.missionId ??
              ""
          ).trim();

        if (!missionId) {
          callback?.({
            ok:
              false,

            message:
              "미션 정보가 없습니다.",
          });

          return;
        }

        /*
         * ★ 서버에서 실제로
         * 배정받은 미션인지 검증.
         */
        if (
          !gamePlayer
            .missionIds
            ?.includes(
              missionId
            )
        ) {
          console.log(
            "❌ 배정되지 않은 미션 완료 요청:",
            {
              playerId:
                gamePlayer.id,

              nickname:
                gamePlayer.nickname,

              missionId,

              assigned:
                gamePlayer.missionIds,
            }
          );

          callback?.({
            ok:
              false,

            message:
              "배정되지 않은 미션입니다.",
          });

          return;
        }

        if (
          !Array.isArray(
            gamePlayer
              .completedMissionIds
          )
        ) {
          gamePlayer.completedMissionIds =
            [];
        }

        /*
         * 이미 완료한 경우
         * 중복 완료 방지.
         */
        if (
          gamePlayer
            .completedMissionIds
            .includes(
              missionId
            )
        ) {
          callback?.({
            ok:
              true,

            alreadyCompleted:
              true,

            completedMissionIds:
              gamePlayer
                .completedMissionIds,
          });

          return;
        }

        gamePlayer
          .completedMissionIds
          .push(
            missionId
          );

        console.log(
          "✅ 미션 완료:",
          {
            roomId:
              room.id,

            nickname:
              gamePlayer.nickname,

            role:
              gamePlayer.role,

            missionId,

            completed:
              gamePlayer
                .completedMissionIds
                .length,

            total:
              gamePlayer
                .missionIds
                .length,
          }
        );

        callback?.({
          ok:
            true,

          missionId,

          completedMissionIds:
            gamePlayer
              .completedMissionIds,

          completedCount:
            gamePlayer
              .completedMissionIds
              .length,

          totalCount:
            gamePlayer
              .missionIds
              .length,
        });

        /*
         * 자기 화면에서도 필요할 수 있으므로
         * 별도 이벤트 전달.
         */
        socket.emit(
          "devilGame:missionUpdated",
          {
            missionId,

            completedMissionIds:
              gamePlayer
                .completedMissionIds,
          }
        );

        /*
         * 현재는 미션 완료만 저장한다.
         *
         * 추후:
         *
         * 모든 생존자의 모든 미션 완료
         *        ↓
         * 생존팀 승리
         *
         * 조건을 여기에 추가하면 된다.
         */
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
              "진행 중인 게임을 찾을 수 없습니다.",
          });

          return;
        }

        if (
          room.status !==
          "playing"
        ) {
          callback?.({
            ok:
              false,

            message:
              "현재 공격할 수 없습니다.",
          });

          return;
        }

        const killer =
          findGamePlayerBySocket(
            room,
            socket.id
          );

        if (!killer) {
          callback?.({
            ok:
              false,

            message:
              "공격자 정보를 찾을 수 없습니다.",
          });

          return;
        }

        /* ===============================================
           악마만 공격 가능
        =============================================== */

        if (
          killer.role !==
          "devil"
        ) {
          callback?.({
            ok:
              false,

            message:
              "악마만 공격할 수 있습니다.",
          });

          return;
        }

        /* ===============================================
           살아있는 악마만 공격 가능
        =============================================== */

        if (
          killer.state !==
          "alive"
        ) {
          callback?.({
            ok:
              false,

            message:
              "현재 상태에서는 공격할 수 없습니다.",
          });

          return;
        }

        if (
          killer.leftGame ===
          true
        ) {
          callback?.({
            ok:
              false,

            message:
              "이미 게임에서 퇴장했습니다.",
          });

          return;
        }

        /* ===============================================
           Cooldown
        =============================================== */

        const now =
          Date.now();

        const cooldownEndsAt =
          (
            killer.lastKillAt ??
            0
          ) +
          POTATO_WAR_KILL_COOLDOWN_MS;

        if (
          now <
          cooldownEndsAt
        ) {
          callback?.({
            ok:
              false,

            message:
              "공격 쿨타임입니다.",

            cooldownEndsAt,
          });

          return;
        }

        /* ===============================================
           Target
        =============================================== */

        const victimId =
          String(
            payload?.victimId ??
              ""
          ).trim();

        if (!victimId) {
          callback?.({
            ok:
              false,

            message:
              "공격 대상을 찾을 수 없습니다.",
          });

          return;
        }

        const victim =
          room.gamePlayers[
            victimId
          ];

        if (!victim) {
          callback?.({
            ok:
              false,

            message:
              "공격 대상이 존재하지 않습니다.",
          });

          return;
        }

        if (
          victim.id ===
          killer.id
        ) {
          callback?.({
            ok:
              false,

            message:
              "자기 자신을 공격할 수 없습니다.",
          });

          return;
        }

        if (
          victim.leftGame ===
          true
        ) {
          callback?.({
            ok:
              false,

            message:
              "이미 게임에서 나간 플레이어입니다.",
          });

          return;
        }

        if (
          victim.state !==
          "alive"
        ) {
          callback?.({
            ok:
              false,

            message:
              "이미 제거된 플레이어입니다.",
          });

          return;
        }

        /*
         * 악마끼리는 공격 불가.
         */
        if (
          victim.role ===
          "devil"
        ) {
          callback?.({
            ok:
              false,

            message:
              "같은 악마팀은 공격할 수 없습니다.",
          });

          return;
        }

        /* ===============================================
           Distance Check
        =============================================== */

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
              "공격 대상이 너무 멀리 있습니다.",
          });

          return;
        }

        /* ===============================================
           Kill
        =============================================== */

        killer.lastKillAt =
          now;

        victim.state =
          "ghost";

        const corpse = {
          id:
            createId(),

          victimId:
            victim.id,

          nickname:
            victim.nickname,

          /*
           * 시체에는 당시 캐릭터 스타일도
           * 저장해둘 수 있다.
           */
          characterStyle:
            victim.characterStyle,

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

        const nextCooldownEndsAt =
          now +
          POTATO_WAR_KILL_COOLDOWN_MS;

        console.log(
          "💀 악마 공격:",
          {
            roomId:
              room.id,

            killer:
              killer.nickname,

            victim:
              victim.nickname,
          }
        );

        /* ===============================================
           Everyone
        =============================================== */

        io
          .to(
            getSocketRoomName(
              room.id
            )
          )
          .emit(
            "devilGame:killConfirmed",
            {
              roomId:
                room.id,

              killerId:
                killer.id,

              victimId:
                victim.id,

              corpse,

              cooldownEndsAt:
                nextCooldownEndsAt,
            }
          );

        broadcastGameState(
          room
        );

        callback?.({
          ok:
            true,

          corpse,

          cooldownEndsAt:
            nextCooldownEndsAt,
        });

        /* ===============================================
           승리 조건 검사
        =============================================== */

        checkGameEnd(
          room
        );
      }
    );

    /* =====================================================
       Leave Game

       게임 중 '게임 퇴장' 버튼을 눌렀을 때.
    ===================================================== */

    socket.on(
      "devilGame:leave",
      (
        payload = {},
        callback
      ) => {
        const requestedRoomId =
          String(
            payload?.roomId ??
              ""
          )
            .trim()
            .toUpperCase();

        let room =
          requestedRoomId
            ? devilRooms[
                requestedRoomId
              ]
            : null;

        /*
         * roomId가 없거나 잘못되었다면
         * 현재 socket 기준으로 찾는다.
         */
        if (
          !room ||
          room.status !==
            "playing"
        ) {
          room =
            findGameRoomBySocket(
              socket.id
            );
        }

        if (!room) {
          callback?.({
            ok:
              true,
          });

          return;
        }

        const gamePlayer =
          findGamePlayerBySocket(
            room,
            socket.id
          );

        if (!gamePlayer) {
          callback?.({
            ok:
              true,
          });

          return;
        }

        /*
         * 명시적인 퇴장.
         *
         * disconnect와 달리
         * grace time을 주지 않는다.
         */
        gamePlayer.leftGame =
          true;

        gamePlayer.connectedSocketId =
          null;

        gamePlayer.leftAt =
          Date.now();

        socket.leave(
          getSocketRoomName(
            room.id
          )
        );

        console.log(
          "🚪 게임 퇴장:",
          {
            roomId:
              room.id,

            playerId:
              gamePlayer.id,

            nickname:
              gamePlayer.nickname,

            role:
              gamePlayer.role,
          }
        );

        /*
         * 나머지 사람들의 화면에서
         * 퇴장한 플레이어 제거.
         */
        broadcastGameState(
          room
        );

        callback?.({
          ok:
            true,
        });

        /*
         * 퇴장 직후 승리조건 확인.
         *
         * - 3명 미만
         * - 악마 전원 퇴장
         * - 악마 >= 생존자
         */
        checkGameEnd(
          room
        );
      }
    );

    /* =====================================================
       Return To Office

       결과 화면에서
       '사무실로 돌아가기' 버튼을 눌렀을 때.
    ===================================================== */

    socket.on(
      "devilGame:returnOffice",
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

        const room =
          devilRooms[
            roomId
          ];

        if (!room) {
          callback?.({
            ok:
              true,
          });

          return;
        }

        /*
         * finished 상태에서만
         * 결과 화면 복귀용으로 사용.
         */
        if (
          room.status !==
          "finished"
        ) {
          callback?.({
            ok:
              false,

            message:
              "아직 게임이 종료되지 않았습니다.",
          });

          return;
        }

        /*
         * 현재 socket이 어떤
         * stable player인지 확인.
         */
        let gamePlayer =
          findGamePlayerBySocket(
            room,
            socket.id
          );

        /*
         * 결과 화면 재접속 등으로
         * connectedSocketId가 없다면
         * playerId로 찾는다.
         */
        if (
          !gamePlayer &&
          payload?.playerId
        ) {
          gamePlayer =
            room.gamePlayers?.[
              String(
                payload.playerId
              )
            ];
        }

        if (
          gamePlayer
        ) {
          gamePlayer.returnedToOffice =
            true;

          gamePlayer.connectedSocketId =
            null;
        }

        socket.leave(
          getSocketRoomName(
            room.id
          )
        );

        callback?.({
          ok:
            true,
        });

        /*
         * 모든 플레이어가 결과 화면에서
         * 빠져나갔다면 방 삭제.
         */
        const gamePlayers =
          Object.values(
            room.gamePlayers ??
              {}
          );

        const everyoneDone =
          gamePlayers.every(
            player =>
              player.returnedToOffice ===
                true ||
              player.leftGame ===
                true
          );

        if (
          everyoneDone
        ) {
          delete devilRooms[
            room.id
          ];

          broadcastRoomList();
        }
      }
    );

    /* =====================================================
       Disconnect
    ===================================================== */

    socket.on(
      "disconnect",
      () => {
        console.log(
          "🥔 연결 종료:",
          socket.id
        );

        /*
         * 먼저 진행 중 게임인지 확인한다.
         *
         * 게임 중이라면 즉시 퇴장시키지 않고
         * reconnect grace time을 적용한다.
         */
        const gameRoom =
          findGameRoomBySocket(
            socket.id
          );

        if (
          gameRoom &&
          gameRoom.status ===
            "playing"
        ) {
          handlePlayingDisconnect(
            gameRoom,
            socket.id
          );
        } else {
          /*
           * 대기실에 있다면
           * 바로 제거.
           */
          const waitingRoom =
            findPlayerRoom(
              socket.id
            );

          if (
            waitingRoom
          ) {
            removePlayerFromWaitingRoom(
              socket
            );
          }
        }

        /*
         * 일반 사무실 플레이어 목록에서는
         * 현재 Socket 제거.
         *
         * 게임 데이터는 room.gamePlayers에
         * 별도로 남아 있기 때문에
         * 게임 재접속에는 영향 없음.
         */
        delete players[
          socket.id
        ];

        io.emit(
          "players:update",
          Object.values(
            players
          )
        );

        broadcastRoomList();
      }
    );
  }
);

/* =========================================================
   Health Check
========================================================= */

app.get(
  "/",
  (
    req,
    res
  ) => {
    res.send(
      "🥔 GAMJA OFFICE SOCKET SERVER"
    );
  }
);

app.get(
  "/health",
  (
    req,
    res
  ) => {
    res.json({
      ok:
        true,

      players:
        Object.keys(
          players
        ).length,

      rooms:
        Object.keys(
          devilRooms
        ).length,

      timestamp:
        Date.now(),
    });
  }
);

/* =========================================================
   Start Server
========================================================= */

server.listen(
  PORT,
  "0.0.0.0",
  () => {
    console.log(
      `🥔 GAMJA OFFICE SERVER RUNNING : ${PORT}`
    );

    console.log(
      `🎯 개인 미션: ${POTATO_WAR_MISSIONS_PER_PLAYER}개 / 전체 ${POTATO_WAR_MISSION_IDS.length}개`
    );

    console.log(
      `😈 악마 규칙: 3~4명 = 1명 / 5~6명 = 2명`
    );
  }
);