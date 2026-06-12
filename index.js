const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require("@whiskeysockets/baileys");
const { Boom } = require("@hapi/boom");
const QRCode = require("qrcode");
const http = require("http");
require("dotenv").config();

const WATCHED_GROUPS = process.env.WATCHED_GROUPS
  ? process.env.WATCHED_GROUPS.split(",").map((g) => g.trim())
  : [];

const JOB_KEYWORDS = [
  "job", "work", "hiring", "vacancy", "wanted", "wrk", "requirement", "salary",
  "wage", "worker", "staff", "helper", "driver", "cook", "cleaner",
  "urgent", "apply", "contact", "call",
  "ജോലി", "വേല", "ആവശ്യം", "ശമ്പളം", "തൊഴിൽ",
];

function looksLikeJob(text) {
  const lower = text.toLowerCase();
  return JOB_KEYWORDS.some((kw) => lower.includes(kw.toLowerCase()));
}

let qrImageHtml = "<h2>Waiting for QR code...</h2>";
let botStatus = "starting";

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState("auth_info");

  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: false,
  });

  sock.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      console.log("[*] QR received — open your service URL to scan");
      botStatus = "waiting for scan";
      qrImageHtml = `<img src="${await QRCode.toDataURL(qr)}" />`;
    }

    if (connection === "close") {
      const shouldReconnect =
        new Boom(lastDisconnect?.error)?.output?.statusCode !== DisconnectReason.loggedOut;
      console.log("[!] Connection closed. Reconnecting:", shouldReconnect);
      if (shouldReconnect) {
        startBot();
      } else {
        console.log("[✗] Logged out. Delete auth_info folder and restart.");
        botStatus = "logged out";
      }
    }

    if (connection === "open") {
      console.log("[✓] Bot is ready");
      botStatus = "ready";
    }
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("messages.upsert", async ({ messages }) => {
    for (const message of messages) {
      // Only group messages
      if (!message.key.remoteJid.endsWith("@g.us")) continue;

      // Skip own messages
      if (message.key.fromMe) continue;

      const groupJid = message.key.remoteJid;
      const text =
        message.message?.conversation ||
        message.message?.extendedTextMessage?.text ||
        "";

      if (!text || text.trim().length < 10) continue;
      if (!looksLikeJob(text)) continue;

      // Get group name
      const groupMeta = await sock.groupMetadata(groupJid).catch(() => null);
      const groupName = groupMeta?.subject || groupJid;

      if (!WATCHED_GROUPS.includes(groupName)) continue;

      console.log("── Job-like message detected ────────────");
      console.log("Group   :", groupName);
      console.log("Time    :", new Date(message.messageTimestamp * 1000).toLocaleString());
      console.log("Message :", text);
      console.log("─────────────────────────────────────────\n");
    }
  });
}

// HTTP server for QR code
http.createServer(async (req, res) => {
  res.writeHead(200, { "Content-Type": "text/html" });
  if (botStatus === "ready") {
    res.end("<h2 style='color:green'>✅ Bot is running</h2>");
  } else {
    res.end(`
      <html>
        <body style="display:flex;flex-direction:column;align-items:center;font-family:sans-serif">
          <h2>Scan this QR code with WhatsApp</h2>
          <p>Status: ${botStatus}</p>
          ${qrImageHtml}
          <p>Refresh if QR expires</p>
        </body>
      </html>
    `);
  }
}).listen(process.env.PORT || 3000, () => {
  console.log("[✓] HTTP server started on port 3000");
});

startBot().catch((err) => {
  console.error("[✗] Fatal:", err);
  process.exit(1);
});