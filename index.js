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
      qrcode.generate(qr, { small: true })
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

app.listen(3000, () => {
  console.log("Server 3000 portunda çalışıyor")
})
