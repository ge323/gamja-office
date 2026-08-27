const express = require("express");
const http = require("http");

const {
  Server,
} = require("socket.io");

/* =========================================================
   Express / HTTP
========================================================= */

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
   Port
========================================================= */

const PORT =
  process.env.PORT ||
  4000;

/* =========================================================
   Main Office
========================================================= */

const players = {};

const chatHistory = [];

const MAX_CHAT_HISTORY =
  50;

/* =========================================================
   Devil Game Rooms
========================================================= */

const devilRooms = {};

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
 * 방장이 시작을 누른 뒤
 * 실제 게임으로 전환되기까지의 시간.
 */
const POTATO_WAR_START_COUNTDOWN_MS =
  8_000;

/*
 * 테스트용 처치 쿨타임.
 */
const POTATO_WAR_KILL_COOLDOWN_MS =
  5_000;

/*
 * 페이지 전환 중 Socket이 잠깐 끊어지는 것을
 * 허용하기 위한 재접속 유예시간.
 */
const POTATO_WAR_RECONNECT_GRACE_MS =
  15_000;

/*
 * 악마 공격 가능 거리.
 */
const POTATO_WAR_KILL_RANGE =
  135;

/*
 * 맵 크기.
 */
const POTATO_WAR_MAP_WIDTH =
  2200;

const POTATO_WAR_MAP_HEIGHT =
  1400;

/* =========================================================
   Emergency Meeting Constants
========================================================= */

/*
 * 시체 신고 가능 거리.
 */
const POTATO_WAR_REPORT_DISTANCE =
  150;

/*
 * 토론 시간.
 */
const POTATO_WAR_DISCUSSION_MS =
  30_000;

/*
 * 투표 시간.
 */
const POTATO_WAR_VOTING_MS =
  20_000;

/*
 * 투표 결과 표시 시간.
 */
const POTATO_WAR_VOTE_RESULT_MS =
  3_000;

/* =========================================================
   Spawn Points
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
   Personal Missions
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

const POTATO_WAR_MISSIONS_PER_PLAYER =
  3;

/* =========================================================
   Helpers
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

function getDistance(
  a,
  b
) {
  const dx =
    a.x - b.x;

  const dy =
    a.y - b.y;

  return Math.sqrt(
    dx * dx +
      dy * dy
  );
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
   Socket Room Name
========================================================= */

function getSocketRoomName(
  roomId
) {
  return `devil:${roomId}`;
}

/* =========================================================
   Find Lobby Room
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
   Lobby Player
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
        .filter(Boolean),
  };
}

function getPublicRooms() {
  return Object.values(
    devilRooms
  )
    .map(getPublicRoom)
    .filter(Boolean);
}

/* =========================================================
   Broadcast Lobby
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
      getPublicRoom(room)
    );

  broadcastRoomList();
}

/* =========================================================
   Personal Mission Assignment
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
   Role Assignment
========================================================= */

function assignRoles(
  room
) {
  /*
   * 3~4명 : 악마 1명
   * 5~6명 : 악마 2명
   */

  const devilCount =
    room.players.length >= 5
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
   Game Runtime
========================================================= */

function createGameRuntime(
  room
) {
  room.gamePlayers = {};

  room.corpses = [];

  room.meeting = null;

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
        players[socketId];

      if (!officePlayer) {
        return;
      }

      const spawn =
        spawnPoints[
          index %
            spawnPoints.length
        ];

      const missionIds =
        createPersonalMissions();

      room.gamePlayers[
        socketId
      ] = {
        id:
          socketId,

        connectedSocketId:
          socketId,

        nickname:
          officePlayer.nickname,

        characterStyle:
          officePlayer.characterStyle,

        role:
          room.roles[
            socketId
          ],

        state:
          "alive",

        x:
          spawn.x,

        y:
          spawn.y,

        spawnId:
          spawn.id,

        missionIds,

        completedMissionIds:
          [],

        lastKillAt:
          0,

        leftGame:
          false,

        returnedToOffice:
          false,
      };

      console.log(
        "🎯 미션 배정:",
        officePlayer.nickname,
        missionIds
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
  if (!gamePlayer) {
    return null;
  }

  /*
   * role / missionIds는
   * 다른 플레이어에게 공개하지 않는다.
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

    moving:
      Boolean(
        gamePlayer.moving
      ),
  };
}

/* =========================================================
   Public Meeting
========================================================= */

function getPublicMeeting(
  room
) {
  const meeting =
    room?.meeting;

  if (
    !meeting ||
    !meeting.active
  ) {
    return null;
  }

  return {
    id:
      meeting.id,

    active:
      true,

    phase:
      meeting.phase,

    reporterId:
      meeting.reporterId,

    reporterNickname:
      meeting.reporterNickname,

    corpseId:
      meeting.corpseId,

    victimId:
      meeting.victimId,

    victimNickname:
      meeting.victimNickname,

    startedAt:
      meeting.startedAt,

    phaseEndsAt:
      meeting.phaseEndsAt,

    messages:
      meeting.messages ??
      [],

    /*
     * 투표한 사람 ID만 공개.
     * 누구에게 투표했는지는 비공개.
     */
    votedPlayerIds:
      Object.keys(
        meeting.votes ??
          {}
      ),
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
        .filter(
          player =>
            player.leftGame !==
            true
        )
        .map(
          getPublicGamePlayer
        )
        .filter(Boolean),

    corpses:
      room.corpses ??
      [],

    meeting:
      getPublicMeeting(
        room
      ),
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
   Find Game Room
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
          player
            .connectedSocketId ===
          socketId
      );
    }
  );
}

function findGamePlayerBySocket(
  room,
  socketId
) {
  if (!room?.gamePlayers) {
    return null;
  }

  return (
    Object.values(
      room.gamePlayers
    ).find(
      player =>
        player
          .connectedSocketId ===
        socketId
    ) ??
    null
  );
}

/* =========================================================
   Active Players
========================================================= */

function getActiveGamePlayers(
  room
) {
  return Object.values(
    room.gamePlayers ??
      {}
  ).filter(
    player =>
      player.leftGame !==
      true
  );
}

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
  winningTeam,
  reason = ""
) {
  if (
    !room ||
    room.status !==
      "playing"
  ) {
    return;
  }

  room.status =
    "finished";

  room.finishedAt =
    Date.now();

  /*
   * 게임 종료 시 진행 중 회의도 종료.
   */
  if (room.meeting) {
    room.meeting.active =
      false;
  }

  const winners =
    Object.values(
      room.gamePlayers ??
        {}
    )
      .filter(
        player =>
          player.role ===
            winningTeam &&
          player.leftGame !==
            true
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

  const result = {
    roomId:
      room.id,

    winningTeam,

    reason,

    winners,

    finishedAt:
      room.finishedAt,
  };

  room.result =
    result;

  console.log(
    "🏆 GAME OVER:",
    room.id,
    winningTeam,
    reason
  );

  /*
   * 현재 DevilGameWorld는 두 이벤트 모두
   * 받을 수 있으므로 호환을 위해 둘 다 전달.
   */
  io
    .to(
      getSocketRoomName(
        room.id
      )
    )
    .emit(
      "devilGame:end",
      result
    );

  io
    .to(
      getSocketRoomName(
        room.id
      )
    )
    .emit(
      "devilGame:finished",
      result
    );

  broadcastRoomList();

  /*
   * 결과창을 볼 수 있게 일정 시간 방 유지.
   */
  setTimeout(
    () => {
      const currentRoom =
        devilRooms[
          room.id
        ];

      if (
        currentRoom &&
        currentRoom.status ===
          "finished"
      ) {
        delete devilRooms[
          room.id
        ];

        broadcastRoomList();
      }
    },
    60_000
  );
}

/* =========================================================
   Winner Check
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

  if (
    activePlayers.length ===
    0
  ) {
    delete devilRooms[
      room.id
    ];

    broadcastRoomList();

    return;
  }

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

  /*
   * 악마 전멸.
   */
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

  /*
   * 전체 참가자 3명 미만.
   */
  if (
    activePlayers.length <
    DEVIL_GAME_MIN_PLAYERS
  ) {
    if (
      aliveDevils.length >=
      aliveSurvivors.length
    ) {
      finishPotatoWar(
        room,
        "devil",
        "not-enough-players"
      );
    } else {
      finishPotatoWar(
        room,
        "survivor",
        "not-enough-players"
      );
    }

    return;
  }

  /*
   * 생존자 전멸.
   */
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

  /*
   * 악마 수 >= 살아있는 생존자 수.
   */
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
   Remove Waiting Player
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

  delete room.ready?.[
    socket.id
  ];

  delete room.roles?.[
    socket.id
  ];

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
   Disconnect During Game
========================================================= */

function handlePlayingDisconnect(
  room,
  socketId
) {
  const player =
    findGamePlayerBySocket(
      room,
      socketId
    );

  if (!player) {
    return;
  }

  player.connectedSocketId =
    null;

  player.disconnectedAt =
    Date.now();

  const stablePlayerId =
    player.id;

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

      if (!currentPlayer) {
        return;
      }

      /*
       * 이미 새 Socket으로 재접속.
       */
      if (
        currentPlayer
          .connectedSocketId
      ) {
        return;
      }

      currentPlayer.leftGame =
        true;

      /*
       * 회의 중 나간 경우
       * 해당 플레이어의 투표 제거.
       */
      if (
        currentRoom
          .meeting?.active
      ) {
        delete currentRoom
          .meeting
          .votes?.[
            stablePlayerId
          ];
      }

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
   Start Game
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

  createGameRuntime(
    room
  );

  room.status =
    "playing";

  room.startedAt =
    Date.now();

  room.countdownEndsAt =
    null;

  /*
   * 각자에게 자기 역할/미션만 전달.
   */
  Object.values(
    room.gamePlayers
  ).forEach(
    player => {
      if (
        !player
          .connectedSocketId
      ) {
        return;
      }

      io
        .to(
          player
            .connectedSocketId
        )
        .emit(
          "devilGame:started",
          {
            roomId:
              room.id,

            playerId:
              player.id,

            role:
              player.role,

            missionIds:
              player.missionIds,

            x:
              player.x,

            y:
              player.y,
          }
        );

      /*
       * 이전 프론트 호환용.
       */
      io
        .to(
          player
            .connectedSocketId
        )
        .emit(
          "devilGame:role",
          {
            roomId:
              room.id,

            playerId:
              player.id,

            role:
              player.role,
          }
        );
    }
  );

  broadcastRoomUpdate(
    room
  );

  broadcastGameState(
    room
  );
}

/* =========================================================
   Meeting: Start Voting
========================================================= */

function startMeetingVoting(
  room,
  meetingId
) {
  if (
    !room ||
    room.status !==
      "playing"
  ) {
    return;
  }

  const meeting =
    room.meeting;

  if (
    !meeting ||
    !meeting.active ||
    meeting.id !==
      meetingId ||
    meeting.phase !==
      "discussion"
  ) {
    return;
  }

  meeting.phase =
    "voting";

  meeting.phaseEndsAt =
    Date.now() +
    POTATO_WAR_VOTING_MS;

  io
    .to(
      getSocketRoomName(
        room.id
      )
    )
    .emit(
      "devilGame:meeting-phase",
      {
        phase:
          "voting",

        phaseEndsAt:
          meeting.phaseEndsAt,
      }
    );

  broadcastGameState(
    room
  );

  setTimeout(
    () => {
      const currentRoom =
        devilRooms[
          room.id
        ];

      if (
        !currentRoom ||
        !currentRoom.meeting ||
        currentRoom
          .meeting.id !==
          meetingId
      ) {
        return;
      }

      finishMeetingVote(
        currentRoom
      );
    },
    POTATO_WAR_VOTING_MS
  );
}

/* =========================================================
   Meeting: Finish Vote
========================================================= */

function finishMeetingVote(
  room
) {
  const meeting =
    room?.meeting;

  if (
    !room ||
    !meeting ||
    !meeting.active ||
    meeting.phase ===
      "result"
  ) {
    return;
  }

  meeting.phase =
    "result";

  meeting.phaseEndsAt =
    Date.now() +
    POTATO_WAR_VOTE_RESULT_MS;

  const voteCounts = {};

  Object.values(
    meeting.votes ??
      {}
  ).forEach(
    targetId => {
      voteCounts[targetId] =
        (
          voteCounts[
            targetId
          ] ??
          0
        ) + 1;
    }
  );

  const entries =
    Object.entries(
      voteCounts
    ).sort(
      (
        [, a],
        [, b]
      ) =>
        b - a
    );

  let skipped =
    false;

  let expelledPlayer =
    null;

  if (
    entries.length ===
    0
  ) {
    skipped =
      true;
  } else {
    const [
      topTarget,
      topVotes,
    ] =
      entries[0];

    const secondVotes =
      entries[1]?.[1] ??
      0;

    /*
     * 동률.
     */
    if (
      entries.length > 1 &&
      topVotes ===
        secondVotes
    ) {
      skipped =
        true;
    } else if (
      topTarget ===
      "skip"
    ) {
      skipped =
        true;
    } else {
      const target =
        room
          .gamePlayers?.[
            topTarget
          ];

      if (
        target &&
        target.state ===
          "alive" &&
        target.leftGame !==
          true
      ) {
        target.state =
          "ghost";

        expelledPlayer = {
          id:
            target.id,

          nickname:
            target.nickname,

          /*
           * 투표 결과에서 역할 공개.
           */
          role:
            target.role,
        };
      } else {
        skipped =
          true;
      }
    }
  }

  const result = {
    roomId:
      room.id,

    skipped,

    expelledPlayer,

    voteCounts,

    resultEndsAt:
      meeting.phaseEndsAt,
  };

  io
    .to(
      getSocketRoomName(
        room.id
      )
    )
    .emit(
      "devilGame:meeting-result",
      result
    );

  broadcastGameState(
    room
  );

  /*
   * 퇴출로 승패가 결정될 수 있음.
   */
  checkGameEnd(
    room
  );

  if (
    room.status !==
    "playing"
  ) {
    return;
  }

  setTimeout(
    () => {
      const currentRoom =
        devilRooms[
          room.id
        ];

      if (
        !currentRoom ||
        currentRoom.status !==
          "playing" ||
        !currentRoom.meeting ||
        currentRoom
          .meeting.id !==
          meeting.id
      ) {
        return;
      }

      currentRoom.meeting =
        null;

      io
        .to(
          getSocketRoomName(
            currentRoom.id
          )
        )
        .emit(
          "devilGame:meeting-ended",
          {
            roomId:
              currentRoom.id,
          }
        );

      broadcastGameState(
        currentRoom
      );
    },
    POTATO_WAR_VOTE_RESULT_MS
  );
}

/* =========================================================
   Socket
========================================================= */

io.on(
  "connection",
  socket => {
    console.log(
      "🥔 연결:",
      socket.id
    );

    /* =====================================================
       Office Join
    ===================================================== */

    socket.on(
      "player:join",
      data => {
        const nickname =
          String(
            data?.nickname ??
              ""
          )
            .trim()
            .slice(
              0,
              20
            );

        if (!nickname) {
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
              data?.x
            ) || 735,

          y:
            Number(
              data?.y
            ) || 565,

          characterStyle:
            data?.characterStyle ??
            null,
        };

        socket.emit(
          "chat:history",
          chatHistory
        );

        socket.emit(
          "devilRooms:update",
          getPublicRooms()
        );

        io.emit(
          "players:update",
          Object.values(
            players
          )
        );

        const message = {
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
          message
        );

        io.emit(
          "chat:message",
          message
        );
      }
    );

    /* =====================================================
       Office Move
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
          !Number.isFinite(x) ||
          !Number.isFinite(y)
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
       Character Style
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
       Main Chat

       기존 문자열 방식과
       { message } 방식 모두 허용.
    ===================================================== */

    socket.on(
      "chat:send",
      raw => {
        const player =
          players[
            socket.id
          ];

        if (!player) {
          return;
        }

        const rawMessage =
          typeof raw ===
          "string"
            ? raw
            : raw?.message;

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
       Lobby Chat
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

        if (
          room.status !==
            "waiting" &&
          room.status !==
            "countdown"
        ) {
          return;
        }

        const requestedRoomId =
          String(
            payload?.roomId ??
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

        const message =
          String(
            payload?.message ??
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

        const lobbyMessage = {
          id:
            createId(),

          playerId:
            socket.id,

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
       Rooms List
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
       Create Room
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
            options?.maxPlayers
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

          ready: {
            [socket.id]:
              false,
          },

          roles: {},

          countdownEndsAt:
            null,

          startedAt:
            null,

          gamePlayers:
            null,

          corpses: [],

          meeting:
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
       Join Room

       { roomId } 최신 방식과
       문자열 구버전 둘 다 허용.
    ===================================================== */

    socket.on(
      "devilRoom:join",
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

            message:
              "먼저 사무실에 입장해주세요.",
          });

          return;
        }

        const rawRoomId =
          typeof payload ===
          "string"
            ? payload
            : payload?.roomId;

        const roomId =
          String(
            rawRoomId ??
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

        const duplicate =
          room.players.some(
            id =>
              players[id]
                ?.nickname ===
              player.nickname
          );

        if (duplicate) {
          callback?.({
            ok:
              false,

            message:
              "게임방에서는 같은 닉네임을 사용할 수 없습니다.",
          });

          return;
        }

        room.players.push(
          socket.id
        );

        room.ready ??= {};

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
       Ready
    ===================================================== */

    socket.on(
      "devilRoom:ready",
      (
        payload,
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
              "현재 준비 상태를 변경할 수 없습니다.",
          });

          return;
        }

        const ready =
          typeof payload ===
          "boolean"
            ? payload
            : Boolean(
                payload?.ready
              );

        const requestedRoomId =
          typeof payload ===
          "object"
            ? String(
                payload?.roomId ??
                  ""
              )
                .trim()
                .toUpperCase()
            : "";

        if (
          requestedRoomId &&
          requestedRoomId !==
            room.id
        ) {
          callback?.({
            ok:
              false,

            message:
              "잘못된 게임방입니다.",
          });

          return;
        }

        room.ready[
          socket.id
        ] =
          ready;

        broadcastRoomUpdate(
          room
        );

        callback?.({
          ok:
            true,

          ready,
        });
      }
    );

    /* =====================================================
       Leave Lobby
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
       Start Game
    ===================================================== */

    socket.on(
      "devilRoom:start",
      (
        payload,
        callback
      ) => {
        const rawRoomId =
          typeof payload ===
          "string"
            ? payload
            : payload?.roomId;

        const roomId =
          String(
            rawRoomId ??
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
          callback?.({
            ok:
              false,

            message:
              `${DEVIL_GAME_MIN_PLAYERS -
              room.players.length}명이 더 필요합니다.`,
          });

          return;
        }

        const allReady =
          room.players.every(
            id =>
              room.ready?.[
                id
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
            beginPotatoWar(
              devilRooms[
                room.id
              ]
            );
          },
          POTATO_WAR_START_COUNTDOWN_MS
        );
      }
    );

    /* =====================================================
       Game Join / Reconnect
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
          room.gamePlayers[
            playerId
          ];

        if (
          !gamePlayer ||
          gamePlayer.leftGame ===
            true
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

        gamePlayer.disconnectedAt =
          null;

        socket.join(
          getSocketRoomName(
            room.id
          )
        );

        /*
         * 새로운 Socket도 일반 player 목록에 등록.
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
       Game Move
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

        /*
         * 회의 중에는 이동 불가.
         */
        if (
          room.meeting?.active
        ) {
          return;
        }

        const player =
          findGamePlayerBySocket(
            room,
            socket.id
          );

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
          !Number.isFinite(x) ||
          !Number.isFinite(y)
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

        player.x =
          x;

        player.y =
          y;

        player.moving =
          Boolean(
            position?.moving
          );

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
                player.id,

              x,

              y,

              moving:
                player.moving,
            }
          );
      }
    );

    /* =====================================================
       Mission Complete
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
              "게임방을 찾을 수 없습니다.",
          });

          return;
        }

        if (
          room.meeting?.active
        ) {
          callback?.({
            ok:
              false,

            message:
              "긴급회의 중에는 미션을 수행할 수 없습니다.",
          });

          return;
        }

        const player =
          findGamePlayerBySocket(
            room,
            socket.id
          );

        if (
          !player ||
          player.state !==
            "alive"
        ) {
          callback?.({
            ok:
              false,

            message:
              "현재 미션을 수행할 수 없습니다.",
          });

          return;
        }

        const missionId =
          String(
            payload?.missionId ??
              ""
          ).trim();

        if (
          !player
            .missionIds
            ?.includes(
              missionId
            )
        ) {
          callback?.({
            ok:
              false,

            message:
              "배정되지 않은 미션입니다.",
          });

          return;
        }

        player.completedMissionIds ??=
          [];

        if (
          player
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
              player
                .completedMissionIds,

            completedCount:
              player
                .completedMissionIds
                .length,

            totalCount:
              player
                .missionIds
                .length,
          });

          return;
        }

        player
          .completedMissionIds
          .push(
            missionId
          );

        callback?.({
          ok:
            true,

          missionId,

          completedMissionIds:
            player
              .completedMissionIds,

          completedCount:
            player
              .completedMissionIds
              .length,

          totalCount:
            player
              .missionIds
              .length,
        });
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

        if (
          room.meeting?.active
        ) {
          callback?.({
            ok:
              false,

            message:
              "긴급회의 중에는 처치할 수 없습니다.",
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
            payload?.victimId ??
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
            "survivor" ||
          victim.leftGame ===
            true
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

        const distance =
          getDistance(
            killer,
            victim
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

        victim.state =
          "ghost";

        const corpse = {
          id:
            createId(),

          victimId:
            victim.id,

          nickname:
            victim.nickname,

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

        const eventPayload = {
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

        /*
         * 기존 게임 규칙에 따라
         * 처치 후 승리 조건 확인.
         */
        checkGameEnd(
          room
        );
      }
    );

    /* =====================================================
       Report Corpse
    ===================================================== */

    socket.on(
      "devilGame:report-corpse",
      (
        payload = {},
        callback
      ) => {
        const room =
          findGameRoomBySocket(
            socket.id
          );

        if (
          !room ||
          room.status !==
            "playing"
        ) {
          callback?.({
            ok:
              false,

            message:
              "진행 중인 게임을 찾을 수 없습니다.",
          });

          return;
        }

        if (
          room.meeting?.active
        ) {
          callback?.({
            ok:
              false,

            message:
              "이미 긴급회의가 진행 중입니다.",
          });

          return;
        }

        const reporter =
          findGamePlayerBySocket(
            room,
            socket.id
          );

        if (
          !reporter ||
          reporter.state !==
            "alive"
        ) {
          callback?.({
            ok:
              false,

            message:
              "살아있는 감자만 시체를 신고할 수 있습니다.",
          });

          return;
        }

        const corpseId =
          String(
            payload?.corpseId ??
              ""
          );

        const corpse =
          room.corpses.find(
            item =>
              item.id ===
              corpseId
          );

        if (!corpse) {
          callback?.({
            ok:
              false,

            message:
              "신고할 수 있는 시체가 없습니다.",
          });

          return;
        }

        const distance =
          getDistance(
            reporter,
            corpse
          );

        if (
          distance >
          POTATO_WAR_REPORT_DISTANCE
        ) {
          callback?.({
            ok:
              false,

            message:
              "시체에 더 가까이 가야 합니다.",
          });

          return;
        }

        /*
         * 신고된 시체는 맵에서 제거.
         */
        room.corpses =
          room.corpses.filter(
            item =>
              item.id !==
              corpse.id
          );

        const meetingId =
          createId();

        room.meeting = {
          id:
            meetingId,

          active:
            true,

          phase:
            "discussion",

          reporterId:
            reporter.id,

          reporterNickname:
            reporter.nickname,

          corpseId:
            corpse.id,

          victimId:
            corpse.victimId,

          victimNickname:
            corpse.nickname,

          messages: [],

          votes: {},

          startedAt:
            Date.now(),

          phaseEndsAt:
            Date.now() +
            POTATO_WAR_DISCUSSION_MS,
        };

        /*
         * 전원 이동 중지.
         */
        Object.values(
          room.gamePlayers
        ).forEach(
          player => {
            player.moving =
              false;
          }
        );

        io
          .to(
            getSocketRoomName(
              room.id
            )
          )
          .emit(
            "devilGame:meeting-started",
            getPublicMeeting(
              room
            )
          );

        broadcastGameState(
          room
        );

        callback?.({
          ok:
            true,
        });

        setTimeout(
          () => {
            startMeetingVoting(
              devilRooms[
                room.id
              ],
              meetingId
            );
          },
          POTATO_WAR_DISCUSSION_MS
        );
      }
    );

    /* =====================================================
       Meeting Chat
    ===================================================== */

    socket.on(
      "devilGame:meeting-chat",
      (
        payload = {},
        callback
      ) => {
        const room =
          findGameRoomBySocket(
            socket.id
          );

        const meeting =
          room?.meeting;

        if (
          !room ||
          !meeting ||
          !meeting.active
        ) {
          callback?.({
            ok:
              false,

            message:
              "진행 중인 회의가 없습니다.",
          });

          return;
        }

        const player =
          findGamePlayerBySocket(
            room,
            socket.id
          );

        if (
          !player ||
          player.state !==
            "alive"
        ) {
          callback?.({
            ok:
              false,

            message:
              "유령은 회의 채팅에 참여할 수 없습니다.",
          });

          return;
        }

        const message =
          String(
            payload?.message ??
              ""
          )
            .trim()
            .slice(
              0,
              160
            );

        if (!message) {
          callback?.({
            ok:
              false,
          });

          return;
        }

        const chatMessage = {
          id:
            createId(),

          playerId:
            player.id,

          nickname:
            player.nickname,

          message,

          createdAt:
            Date.now(),
        };

        meeting.messages.push(
          chatMessage
        );

        /*
         * 회의 기록 무한 증가 방지.
         */
        if (
          meeting.messages.length >
          100
        ) {
          meeting.messages.shift();
        }

        io
          .to(
            getSocketRoomName(
              room.id
            )
          )
          .emit(
            "devilGame:meeting-message",
            chatMessage
          );

        callback?.({
          ok:
            true,
        });
      }
    );

    /* =====================================================
       Meeting Vote
    ===================================================== */

    socket.on(
      "devilGame:meeting-vote",
      (
        payload = {},
        callback
      ) => {
        const room =
          findGameRoomBySocket(
            socket.id
          );

        const meeting =
          room?.meeting;

        if (
          !room ||
          !meeting ||
          !meeting.active ||
          meeting.phase !==
            "voting"
        ) {
          callback?.({
            ok:
              false,

            message:
              "현재 투표할 수 없습니다.",
          });

          return;
        }

        const voter =
          findGamePlayerBySocket(
            room,
            socket.id
          );

        if (
          !voter ||
          voter.state !==
            "alive"
        ) {
          callback?.({
            ok:
              false,

            message:
              "살아있는 감자만 투표할 수 있습니다.",
          });

          return;
        }

        if (
          meeting.votes[
            voter.id
          ]
        ) {
          callback?.({
            ok:
              false,

            message:
              "이미 투표했습니다.",
          });

          return;
        }

        const targetId =
          String(
            payload?.targetId ??
              ""
          );

        if (
          targetId !==
          "skip"
        ) {
          const target =
            room
              .gamePlayers?.[
                targetId
              ];

          if (
            !target ||
            target.state !==
              "alive" ||
            target.leftGame ===
              true
          ) {
            callback?.({
              ok:
                false,

              message:
                "투표할 수 없는 대상입니다.",
            });

            return;
          }
        }

        meeting.votes[
          voter.id
        ] =
          targetId;

        io
          .to(
            getSocketRoomName(
              room.id
            )
          )
          .emit(
            "devilGame:meeting-voted",
            {
              playerId:
                voter.id,
            }
          );

        callback?.({
          ok:
            true,
        });

        /*
         * 현재 살아있는 플레이어가 전부 투표했다면
         * 타이머 기다리지 않고 즉시 결과.
         */
        const alivePlayers =
          getAliveGamePlayers(
            room
          );

        if (
          Object.keys(
            meeting.votes
          ).length >=
          alivePlayers.length
        ) {
          finishMeetingVote(
            room
          );
        }
      }
    );

    /* =====================================================
       Leave Game
    ===================================================== */

    socket.on(
      "devilGame:leave",
      (
        payload = {},
        callback
      ) => {
        let room =
          findGameRoomBySocket(
            socket.id
          );

        if (
          !room &&
          payload?.roomId
        ) {
          room =
            devilRooms[
              String(
                payload.roomId
              )
                .trim()
                .toUpperCase()
            ];
        }

        if (!room) {
          callback?.({
            ok:
              true,
          });

          return;
        }

        const player =
          findGamePlayerBySocket(
            room,
            socket.id
          );

        if (!player) {
          callback?.({
            ok:
              true,
          });

          return;
        }

        player.leftGame =
          true;

        player.connectedSocketId =
          null;

        player.leftAt =
          Date.now();

        if (
          room.meeting?.active
        ) {
          delete room
            .meeting
            .votes?.[
              player.id
            ];
        }

        socket.leave(
          getSocketRoomName(
            room.id
          )
        );

        broadcastGameState(
          room
        );

        callback?.({
          ok:
            true,
        });

        checkGameEnd(
          room
        );
      }
    );

    /* =====================================================
       Return To Office
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

        const playerId =
          String(
            payload?.playerId ??
              ""
          );

        const gamePlayer =
          room
            .gamePlayers?.[
              playerId
            ];

        if (gamePlayer) {
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

        const gamePlayers =
          Object.values(
            room.gamePlayers ??
              {}
          );

        const everyoneDone =
          gamePlayers.every(
            player =>
              player
                .returnedToOffice ===
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

        if (player) {
          const message = {
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
            message
          );

          io.emit(
            "chat:message",
            message
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
   Health Check
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
   Start
========================================================= */

server.listen(
  PORT,
  "0.0.0.0",
  () => {
    console.log(
      `🥔 Gamja Office server running on port ${PORT}`
    );

    console.log(
      "😈 악마 규칙: 3~4명 1명 / 5~6명 2명"
    );

    console.log(
      `🎯 개인 미션: ${POTATO_WAR_MISSIONS_PER_PLAYER}개`
    );

    console.log(
      "🚨 시체 신고 / 긴급회의 / 회의채팅 / 투표 활성화"
    );
  }
);