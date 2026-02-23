const makeWASocket = require("@whiskeysockets/baileys").default;
const { useMultiFileAuthState, fetchLatestBaileysVersion } = require("@whiskeysockets/baileys");
const OWNER_NUMBER = "905454649356";
const P = require("pino");
const express = require("express");

const app = express();
app.get("/", (req, res) => {
  res.send("Bot çalışıyor ✅");
});
app.listen(8080, () => console.log("Server 8080 portunda çalışıyor"));

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState("/tmp/auth");
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    logger: P({ level: "silent" }),
    auth: state,
    browser: ["Railway Bot", "Chrome", "1.0.0"],
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", async (update) => {
    const { connection, qr } = update;

    if (qr) {
      console.log("QR KOD OLUŞTU");
    }

    if (connection === "open") {
      console.log("WhatsApp bot bağlandı ✅");
    }

    if (connection === "close") {
      console.log("Bağlantı kapandı, yeniden başlatılıyor...");
      setTimeout(startBot, 3000);
    }
  });

  // 🔥 Pairing Code'u güvenli şekilde iste
  if (!state.creds.registered) {
    setTimeout(async () => {
      try {
        const code = await sock.requestPairingCode("905454649356"); // numaran
        console.log("PAIRING CODE:", code);
      } catch (err) {
        console.log("Pairing code alınamadı, tekrar denenecek...");
      }
    }, 5000);
  }
}

startBot();
