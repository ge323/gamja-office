const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();

const server = http.createServer(app);

/* =========================================================
   Socket.IO
========================================================= */

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

/* =========================================================
   Players
========================================================= */

const players = {};

/* =========================================================
   Chat
========================================================= */

const chatHistory = [];

const MAX_CHAT_HISTORY = 50;

function createId() {
  return `${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}`;
}

function addChatMessage(message) {
  chatHistory.push(message);

  if (
    chatHistory.length >
    MAX_CHAT_HISTORY
  ) {
    chatHistory.shift();
  }
}

/* =========================================================
   Socket Connection
========================================================= */

io.on("connection", (socket) => {
  console.log(
    "🥔 감자 서버 연결:",
    socket.id
  );

  /* =======================================================
     Join
  ======================================================= */

  socket.on(
    "player:join",
    (playerData) => {
      const nickname =
        String(
          playerData.nickname ??
            ""
        ).trim();

      if (!nickname) {
        return;
      }

      players[socket.id] = {
        id: socket.id,

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

      /* 기존 채팅 기록 전달 */

      socket.emit(
        "chat:history",
        chatHistory
      );

      /* 전체 플레이어 갱신 */

      io.emit(
        "players:update",
        Object.values(
          players
        )
      );

      /* 시스템 입장 메시지 */

      const systemMessage = {
        id: createId(),

        type: "system",

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

  /* =======================================================
     Move
  ======================================================= */

  socket.on(
    "player:move",
    (position) => {
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

  /* =======================================================
     Style
  ======================================================= */

  socket.on(
    "player:style",
    (characterStyle) => {
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
    }
  );

  /* =======================================================
     Chat
  ======================================================= */

  socket.on(
    "chat:send",
    (rawMessage) => {
      const player =
        players[socket.id];

      if (!player) {
        return;
      }

      const message =
        String(
          rawMessage ?? ""
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

  /* =======================================================
   Disconnect
======================================================= */

socket.on(
  "disconnect",
  () => {
    const player =
      players[socket.id];

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

    /* =====================================
       플레이어 제거
    ===================================== */

    delete players[
      socket.id
    ];

    /* =====================================
       플레이어 목록 갱신
    ===================================== */

    io.emit(
      "players:update",
      Object.values(
        players
      )
    );

    /* =====================================
       아무도 없으면 채팅 초기화
    ===================================== */

    if (
      Object.keys(
        players
      ).length === 0
    ) {
      chatHistory.length =
        0;

      console.log(
        "🧹 사무실이 비어서 채팅 기록을 초기화했습니다."
      );
    }
  }
);
});

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

const PORT = 4000;

server.listen(
  PORT,
  () => {
    console.log(
      `🥔 Gamja Office server running on http://localhost:${PORT}`
    );
  }
);