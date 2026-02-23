const express = require("express");
const { default: makeWASocket, useMultiFileAuthState } = require("@whiskeysockets/baileys");
const P = require("pino");
const qrcode = require("qrcode-terminal");

const app = express();
const port = process.env.PORT || 10000;

app.get("/", (req, res) => {
  res.send("Bot çalışıyor 🚀");
});

app.listen(port, () => {
  console.log(`Server ${port} portunda çalışıyor`);
});

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState("auth");

  const sock = makeWASocket({
    logger: P({ level: "info" }),
    auth: state
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", (update) => {
    const { connection, qr } = update;

    if (qr) {
      console.log("QR KODU:");
      qrcode.generate(qr, { small: true });
    }

    if (connection === "open") {
      console.log("WhatsApp bot bağlandı ✅");
    }
  });

  sock.ev.on("messages.upsert", async ({ messages }) => {
    const msg = messages[0];
    if (!msg.message || msg.key.fromMe) return;

    const text =
      msg.message.conversation ||
      msg.message.extendedTextMessage?.text;

    if (text === "!ping") {
      await sock.sendMessage(msg.key.remoteJid, { text: "🏓 Pong!" });
    }
  });
}

startBot().catch(err => {
  console.error("Bot başlatılırken hata:", err);
});
