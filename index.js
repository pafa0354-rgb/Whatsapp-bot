const express = require("express");
const { default: makeWASocket, useMultiFileAuthState } = require("@whiskeysockets/baileys");
const P = require("pino");
const QRCode = require("qrcode");

const app = express();
const port = process.env.PORT || 10000;

app.get("/", (req, res) => {
  res.send("Bot çalışıyor 🚀");
});

app.listen(port, () => {
  console.log(`Server ${port} portunda çalışıyor`);
});

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState("/tmp/auth");

  const sock = makeWASocket({
    logger: P({ level: "silent" }),
    auth: state,
    printQRInTerminal: false
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect } = update;

    if (connection === "open") {
      console.log("WhatsApp bot bağlandı ✅");
    }

    if (connection === "close") {
      console.log("Bağlantı kapandı, yeniden bağlanıyor...");
      startBot();
    }
  });

  // 📌 PAIRING CODE
  if (!sock.authState.creds.registered) {
    const code = await sock.requestPairingCode("905454649356"); 
    console.log("PAIRING CODE:", code);
  }
}

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
