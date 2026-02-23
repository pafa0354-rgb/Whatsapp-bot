import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion
} from "@whiskeysockets/baileys"

import P from "pino"
import express from "express"
import fs from "fs"

const OWNER_NUMBER = "905454649356" // Kendi numaran (90 ile başlasın)

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState("auth")
  const { version } = await fetchLatestBaileysVersion()

  const sock = makeWASocket({
    version,
    logger: P({ level: "silent" }),
    auth: state,
    printQRInTerminal: false
  })

  sock.ev.on("creds.update", saveCreds)

  sock.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect } = update

    if (connection === "connecting") {
      try {
        const code = await sock.requestPairingCode(OWNER_NUMBER)
        console.log("📱 Pairing Code:", code)
      } catch (err) {
        console.log("Pairing alınamadı:", err.message)
      }
    }

    if (connection === "open") {
      console.log("✅ WhatsApp Bağlandı")
    }

    if (connection === "close") {
      const shouldReconnect =
        lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut

      console.log("❌ Bağlantı kapandı")

      if (shouldReconnect) {
        console.log("🔄 Yeniden bağlanıyor...")
        startBot()
      }
    }
  })

  // ===============================
  // 📩 MESAJ SİSTEMİ
  // ===============================
  sock.ev.on("messages.upsert", async ({ messages }) => {
    const msg = messages[0]
    if (!msg.message || msg.key.fromMe) return

    const from = msg.key.remoteJid
    const sender = msg.key.participant || from
    const isOwner = sender.includes(OWNER_NUMBER)

    const body =
      msg.message.conversation ||
      msg.message.extendedTextMessage?.text ||
      ""

    const args = body.trim().split(" ")
    const command = args[0].toLowerCase()

    // ===============================
    // 📜 MENÜ
    // ===============================
    if (command === "!menu") {
      await sock.sendMessage(from, {
        text: `
🤖 *BOT MENÜ*

!menu
!ping
!owner
!info
!grupbilgi
!kick
!tagall
`
      })
    }

    // ===============================
    // 🏓 PING
    // ===============================
    if (command === "!ping") {
      await sock.sendMessage(from, { text: "🏓 Pong!" })
    }

    // ===============================
    // 👑 OWNER
    // ===============================
    if (command === "!owner") {
      await sock.sendMessage(from, {
        text: `👑 Bot Sahibi: wa.me/${OWNER_NUMBER}`
      })
    }

    // ===============================
    // ℹ️ BOT INFO
    // ===============================
    if (command === "!info") {
      await sock.sendMessage(from, {
        text: `
🤖 VIOLENTxARYA WhatsApp Bot
⚡ Hızlı ve Güçlü
🚀 7/24 Aktif
`
      })
    }

    // ===============================
    // 👥 GRUP BİLGİ
    // ===============================
    if (command === "!grupbilgi") {
      if (!from.endsWith("@g.us")) return

      const metadata = await sock.groupMetadata(from)

      await sock.sendMessage(from, {
        text: `
📌 Grup Adı: ${metadata.subject}
👥 Üye Sayısı: ${metadata.participants.length}
`
      })
    }

    // ===============================
    // 🚫 KICK (Owner)
    // ===============================
    if (command === "!kick") {
      if (!from.endsWith("@g.us")) return
      if (!isOwner) return

      const mentioned =
        msg.message.extendedTextMessage?.contextInfo?.mentionedJid

      if (!mentioned) return

      await sock.groupParticipantsUpdate(from, mentioned, "remove")
    }

    // ===============================
    // 📢 TAGALL (Owner)
    // ===============================
    if (command === "!tagall") {
      if (!from.endsWith("@g.us")) return
      if (!isOwner) return

      const metadata = await sock.groupMetadata(from)
      const participants = metadata.participants

      let text = "📢 Herkes buraya!\n\n"
      let mentions = []

      for (let p of participants) {
        text += `@${p.id.split("@")[0]}\n`
        mentions.push(p.id)
      }

      await sock.sendMessage(from, {
        text,
        mentions
      })
    }
  })
}

startBot()

// ===============================
// 🌐 EXPRESS (Railway için)
// ===============================
const app = express()
app.get("/", (req, res) => res.send("Bot çalışıyor"))
app.listen(8080, () => console.log("Server 8080 portunda çalışıyor"))
