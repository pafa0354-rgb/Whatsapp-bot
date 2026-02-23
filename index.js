const makeWASocket = require("@whiskeysockets/baileys").default;
const { useMultiFileAuthState } = require("@whiskeysockets/baileys");
const P = require("pino");
const express = require("express");

const app = express();
app.get("/", (req, res) => {
  res.send("Bot çalışıyor ✅");
});
app.listen(8080, () => console.log("Server 8080 portunda çalışıyor"));

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState("/tmp/auth");

  const sock = makeWASocket({
    logger: P({ level: "silent" }),
    auth: state,
    printQRInTerminal: false,
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", async (update) => {
    const { connection } = update;

    if (connection === "open") {
      console.log("WhatsApp bot bağlandı ✅");
    }

    if (connection === "close") {
      console.log("Bağlantı kapandı, yeniden bağlanıyor...");
      startBot();
    }
  });

  // 📌 Pairing Code
  if (!sock.authState.creds.registered) {
    const code = await sock.requestPairingCode("905454649356"); // NUMARANI YAZ
    console.log("PAIRING CODE:", code);
  }
}

startBot();
