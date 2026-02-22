const express = require("express");
const app = express();

const PORT = process.env.PORT || 8080;

app.get("/", (req, res) => {
  res.send("Bot çalışıyor 🚀");
});

app.listen(PORT, () => {
  console.log(`Server ${PORT} portunda çalışıyor`);
});

const { default: makeWASocket, useMultiFileAuthState } = require("@whiskeysockets/baileys")
const P = require("pino")
const qrcode = require("qrcode-terminal")

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState("auth")

  const sock = makeWASocket({
    logger: P({ level: "silent" }),
    auth: state
  })

  sock.ev.on("creds.update", saveCreds)

  sock.ev.on("connection.update", (update) => {
    const { connection, qr } = update

    if (qr) {
  console.log("QR KODUNU AŞAĞIDAKİ LİNKTE AÇ:")
  console.log(`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${qr}`)
}

    if (connection === "open") {
      console.log("Bot Bağlandı ✅")
    }
  })

  sock.ev.on("messages.upsert", async ({ messages }) => {
    const msg = messages[0]
    if (!msg.message || msg.key.fromMe) return

    const text = msg.message.conversation || msg.message.extendedTextMessage?.text
    const from = msg.key.remoteJid
    if (!text) return

    if (text === "!ping") {
      await sock.sendMessage(from, { text: "🏓 Pong!" })
    }
  })
}

startBot().catch(err => console.log(err))

const express = require("express")
const app = express()

app.get("/", (req, res) => {
  res.send("Bot çalışıyor ✅")
}) 

const PORT = process.env.PORT || 3000

app.listen(PORT, () => {
  console.log(`Server ${PORT} portunda çalışıyor`)
})
