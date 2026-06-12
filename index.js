const {
  default: makeWASocket,
  DisconnectReason,
} = require("@whiskeysockets/baileys");

const { Boom } = require("@hapi/boom");
const QRCode = require("qrcode");
const http = require("http");
const mongoose = require("mongoose");
const crypto = require("crypto");

require("dotenv").config();

/* =========================================================
   CONFIG
========================================================= */

const PORT = process.env.PORT || 3000;

const WATCHED_GROUPS = process.env.WATCHED_GROUPS
  ? process.env.WATCHED_GROUPS.split(",").map((g) => g.trim())
  : [];

const JOB_KEYWORDS = [
  "job",
  "work",
  "hiring",
  "vacancy",
  "wanted",
  "worker",
  "staff",
  "helper",
  "driver",
  "cook",
  "cleaner",
  "salary",
  "urgent",
  "contact",
  "call",

  // Malayalam
  "ജോലി",
  "വേല",
  "ആവശ്യം",
  "ശമ്പളം",
  "തൊഴിൽ",
];

/* =========================================================
   MONGODB
========================================================= */

mongoose.connect(process.env.MONGO_URI);

const authSchema = new mongoose.Schema({
  key: String,
  value: mongoose.Schema.Types.Mixed,
});

const AuthState = mongoose.model("AuthState", authSchema);

/* =========================================================
   REMOTE AUTH STATE
========================================================= */

async function useMongoAuthState() {
  const writeData = async (key, value) => {
    await AuthState.findOneAndUpdate(
      { key },
      { value },
      { upsert: true }
    );
  };

  const readData = async (key) => {
    const data = await AuthState.findOne({ key });
    return data?.value || null;
  };

  const removeData = async (key) => {
    await AuthState.deleteOne({ key });
  };

  const creds = (await readData("creds")) || {};

  return {
    state: {
      creds,
      keys: {
        get: async (type, ids) => {
          const data = {};

          for (const id of ids) {
            const value = await readData(`${type}-${id}`);
            data[id] = value;
          }

          return data;
        },

        set: async (data) => {
          const tasks = [];

          for (const category in data) {
            for (const id in data[category]) {
              const value = data[category][id];

              const key = `${category}-${id}`;

              tasks.push(
                value
                  ? writeData(key, value)
                  : removeData(key)
              );
            }
          }

          await Promise.all(tasks);
        },
      },
    },

    saveCreds: async () => {
      await writeData("creds", state.state.creds);
    },
  };
}

/* =========================================================
   HELPERS
========================================================= */

function looksLikeJob(text = "") {
  const lower = text.toLowerCase();

  return JOB_KEYWORDS.some((kw) =>
    lower.includes(kw.toLowerCase())
  );
}

function hashMessage(text) {
  return crypto
    .createHash("sha256")
    .update(text.trim())
    .digest("hex");
}

/* =========================================================
   CACHE
========================================================= */

const groupCache = new Map();
const processedMessages = new Set();

/* =========================================================
   QR STATUS
========================================================= */

let qrImageHtml = "<h2>Waiting for QR...</h2>";
let botStatus = "starting";

/* =========================================================
   START BOT
========================================================= */

async function startBot() {
  const state = await useMongoAuthState();

  const sock = makeWASocket({
    auth: state.state,
    printQRInTerminal: false,
    syncFullHistory: false,
    markOnlineOnConnect: false,
  });

  sock.ev.on("creds.update", state.saveCreds);

  /* =====================================================
     CONNECTION EVENTS
  ===================================================== */

  sock.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      console.log("[*] QR received");

      botStatus = "waiting for scan";

      qrImageHtml = `
        <img src="${await QRCode.toDataURL(qr)}" />
      `;
    }

    if (connection === "open") {
      console.log("[✓] Bot connected");

      botStatus = "ready";
    }

    if (connection === "close") {
      const shouldReconnect =
        new Boom(lastDisconnect?.error)?.output?.statusCode !==
        DisconnectReason.loggedOut;

      console.log("[!] Connection closed");

      if (shouldReconnect) {
        console.log("[*] Reconnecting...");
        startBot();
      } else {
        console.log("[✗] Logged out");
        botStatus = "logged out";
      }
    }
  });

  /* =====================================================
     MESSAGE HANDLER
  ===================================================== */

  sock.ev.on("messages.upsert", async ({ messages }) => {
    try {
      for (const message of messages) {
        /* -----------------------------------------
           SAFETY CHECKS
        ----------------------------------------- */

        if (!message?.key?.remoteJid) continue;

        if (!message.key.remoteJid.endsWith("@g.us"))
          continue;

        if (message.key.fromMe) continue;

        const text =
          message.message?.conversation ||
          message.message?.extendedTextMessage?.text ||
          "";

        if (!text || text.trim().length < 10)
          continue;

        /* -----------------------------------------
           QUICK FILTER
        ----------------------------------------- */

        if (!looksLikeJob(text)) continue;

        const groupJid = message.key.remoteJid;

        /* -----------------------------------------
           GROUP CACHE
        ----------------------------------------- */

        let groupName = groupCache.get(groupJid);

        if (!groupName) {
          const meta = await sock
            .groupMetadata(groupJid)
            .catch(() => null);

          groupName = meta?.subject || groupJid;

          groupCache.set(groupJid, groupName);
        }

        if (
          WATCHED_GROUPS.length &&
          !WATCHED_GROUPS.includes(groupName)
        ) {
          continue;
        }

        /* -----------------------------------------
           DUPLICATE DETECTION
        ----------------------------------------- */

        const msgHash = hashMessage(text);

        if (processedMessages.has(msgHash)) {
          continue;
        }

        processedMessages.add(msgHash);

        /* -----------------------------------------
           LOGGING
        ----------------------------------------- */

        console.log(
          "── Job-like message detected ────────────"
        );

        console.log("Group   :", groupName);

        console.log(
          "Time    :",
          new Date(
            Number(message.messageTimestamp) * 1000
          ).toLocaleString()
        );

        console.log("Message :", text);

        console.log(
          "─────────────────────────────────────────\n"
        );
      }
    } catch (err) {
      console.error("[MESSAGE ERROR]", err);
    }
  });
}

/* =========================================================
   HTTP SERVER
========================================================= */

http
  .createServer(async (req, res) => {
    res.writeHead(200, {
      "Content-Type": "text/html",
    });

    if (botStatus === "ready") {
      res.end(`
        <h2 style="color:green">
          ✅ Bot is running
        </h2>
      `);
    } else {
      res.end(`
        <html>
          <body
            style="
              display:flex;
              flex-direction:column;
              align-items:center;
              font-family:sans-serif;
            "
          >
            <h2>Scan QR Code</h2>

            <p>Status: ${botStatus}</p>

            ${qrImageHtml}

            <p>
              Refresh page if QR expires
            </p>
          </body>
        </html>
      `);
    }
  })
  .listen(PORT, () => {
    console.log(
      `[✓] HTTP server started on ${PORT}`
    );
  });

/* =========================================================
   START
========================================================= */

startBot().catch((err) => {
  console.error("[FATAL]", err);
  process.exit(1);
});
