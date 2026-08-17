const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
} = require("@whiskeysockets/baileys");

const { Boom } = require("@hapi/boom");
const qrcode = require("qrcode-terminal");
const extractAndResolveLocation = require("./helpers/extractAndResolveLocation");
const extractJob =
  require("./llm/extractJob");
const extractWorkDateTime = require("./llm/extractJobTime")
const { insertJob } = require("./helpers/insertJob");
const mongoose = require("mongoose");

const JOB_KEYWORDS = [
  "job",
  "wrk",
  "work",
  "helper",
  "salary",
  "urgent",
  "driver",
  "staff",
  "ജോലി",
  "വേല",
];

function looksLikeJob(text) {
  return JOB_KEYWORDS.some((k) =>
    text.toLowerCase().includes(k)
  );
}

async function startBot() {
  const { state, saveCreds } =
    await useMultiFileAuthState(
      "./auth_info"
    );

  const sock = makeWASocket({
    auth: state,

    browser: [
      "Job Bot",
      "Chrome",
      "1.0.0",
    ],
  });

  sock.ev.on(
    "creds.update",
    saveCreds
  );

  sock.ev.on(
    "connection.update",
    ({ connection, qr, lastDisconnect }) => {
      if (qr) {
        console.log("Scan this QR:");

        qrcode.generate(qr, {
          small: true
        });
      }

      if (connection === "open") {
        console.log(
          "✅ Bot connected"
        );
      }

      if (connection === "close") {
        const shouldReconnect =
          new Boom(lastDisconnect?.error)
            ?.output?.statusCode !==
          DisconnectReason.loggedOut;

        console.log(
          "❌ Connection closed"
        );

        if (shouldReconnect) {
          console.log(
            "🔄 Reconnecting..."
          );

          setTimeout(() => {
            startBot();
          }, 5000);
        }
      }
    }
  );

  
  sock.ev.on(
    "messages.upsert",
    async ({ messages }) => {
      for (const msg of messages) {
        try {
          // Only group messages
          if (
            !msg.key?.remoteJid?.endsWith(
              "@g.us"
            )
          ) {
            continue;
          }

          // Ignore own messages
          if (msg.key.fromMe) {
            continue;
          }

          // Extract message text
          const text =
            msg.message?.conversation ||
            msg.message
              ?.extendedTextMessage?.text ||
            "";

          if (!text.trim()) {
            continue;
          }

          if (!looksLikeJob(text)) {
            continue;
          }

          // Extract sender number
          const participant = msg.key.participantAlt || "";
          const senderPhone = participant.split("@")[0];

          // Get group name
          const meta =
            await sock
              .groupMetadata(
                msg.key.remoteJid
              )
              .catch(() => null);

          const groupName =
            meta?.subject || "Unknown";

          //Get Location
          const locationData = await extractAndResolveLocation(text);
          
          //Get expring time
          const { work_date, work_time, job_expire_time } = await extractWorkDateTime(text);

          // Create JSON payload
          const payload = {
            sender_phone:
              senderPhone,

            timestamp: new Date(
              Number(
                msg.messageTimestamp
              ) * 1000
            ).toISOString(),

            group_name: groupName,

            raw_message: text,

            message_id: msg.key.id,

            locationData: locationData,

            job_expire_time: job_expire_time,

            work_date: work_date,

            work_time: work_time
          };

          const job_details =
            await extractJob(payload);

          console.log(
            "\n========== NEW MESSAGE =========="
          );

          console.log(
            JSON.stringify(
              job_details,
              null,
              2
            )
          );

          console.log(
            "=================================\n"
          );

          if (job_details?.is_job) {
            await insertJob(job_details);
          }
        } catch (err) {
          console.error(
            "[MESSAGE ERROR]",
            err
          );
        }
      }
    }
  );
}

mongoose.connect(process.env.MONGO_URI).then(() => {
  console.log("[✓] MongoDB connected");
  startBot();
}).catch(err => {
  console.error("[✗] MongoDB error:", err);
  process.exit(1);
});