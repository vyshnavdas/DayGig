const { Client, RemoteAuth } = require("whatsapp-web.js");
const { MongoStore } = require("wwebjs-mongo");
const mongoose = require("mongoose");
const qrcode = require("qrcode-terminal");
const chromium = require("chromium");
const http = require("http");

require("dotenv").config();

const MONGO_URI = process.env.MONGO_URI;
const WATCHED_GROUPS = process.env.WATCHED_GROUPS
  ? process.env.WATCHED_GROUPS.split(",").map((g) => g.trim())
  : [];

const JOB_KEYWORDS = [
  "job", "work", "hiring", "vacancy", "wanted", "requirement", "salary",
  "wage", "worker", "staff", "helper", "driver", "cook", "cleaner",
  "urgent", "apply", "contact", "call",
  "ജോലി", "വേല", "ആവശ്യം", "ശമ്പളം", "തൊഴിൽ",
];

function looksLikeJob(text) {
  const lower = text.toLowerCase();
  return JOB_KEYWORDS.some((kw) => lower.includes(kw.toLowerCase()));
}

async function main() {
  console.log("[*] Connecting to MongoDB...");
  await mongoose.connect(MONGO_URI);
  console.log("[✓] MongoDB connected");

  const store = new MongoStore({ mongoose });

  http.createServer((req, res) => {
    res.writeHead(200);
    res.end("Bot is running");
    }).listen(process.env.PORT || 3000, () => {
      console.log("[✓] HTTP server started");
  });

  const client = new Client({
    authStrategy: new RemoteAuth({
      store,
      backupSyncIntervalMs: 300000,
    }),
    puppeteer: {
      headless: true,
      executablePath: chromium.path,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
      ],
    },
  });

  client.on("qr", (qr) => {
    console.log("\n[*] Scan this QR code:\n");
    qrcode.generate(qr, { small: true });
  });

  client.on("authenticated", () => console.log("[✓] Authenticated"));
  client.on("auth_failure", (msg) => {
    console.error("[✗] Auth failed:", msg);
    process.exit(1);
  });

  client.on("ready", async () => {
    console.log("[✓] Bot is ready\n");

    const chats = await client.getChats();
    const groups = chats.filter((c) => c.isGroup);
    console.log("── Your groups ──────────────────────────");
    groups.forEach((g) => console.log(" •", g.name));
    console.log("─────────────────────────────────────────\n");
  });

  client.on("message", async (message) => {
    if (!message.from.endsWith("@g.us")) return;

    const chat = await message.getChat();
    const groupName = chat.name;

    if (!WATCHED_GROUPS.includes(groupName)) return;
    if (!message.body || message.body.trim().length < 10) return;
    if (!looksLikeJob(message.body)) return;

    console.log("── Job-like message detected ────────────");
    console.log("Group   :", groupName);
    console.log("Time    :", new Date(message.timestamp * 1000).toLocaleString());
    console.log("Message :", message.body);
    console.log("─────────────────────────────────────────\n");
  });

  client.on("disconnected", (reason) => {
    console.warn("[!] Disconnected:", reason);
    process.exit(1);
  });

  client.initialize();
}

main().catch((err) => {
  console.error("[✗] Fatal:", err);
  process.exit(1);
});