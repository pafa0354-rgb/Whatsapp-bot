import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion
} from "@whiskeysockets/baileys"
import pino from "pino"

const ownerNumber = "905454649356" // BURAYA KENDİ NUMARANI YAZ

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState("session")
  const { version } = await fetchLatestBaileysVersion()

  const sock = makeWASocket({
    version,
    logger: pino({ level: "silent" }),
    auth: state,
    printQRInTerminal: true
  })

  sock.ev.on("creds.update", saveCreds)

  sock.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect } = update
    if (connection === "close") {
      const shouldReconnect =
        lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut
      if (shouldReconnect) startBot()
    } else if (connection === "open") {
      console.log("✅ Bot bağlandı!")
    }
  })

  sock.ev.on("messages.upsert", async ({ messages }) => {
    const msg = messages[0]
    if (!msg.message) return

    const from = msg.key.remoteJid
    const isGroup = from.endsWith("@g.us")
    const sender = isGroup ? msg.key.participant : from
    const text =
      msg.message.conversation ||
      msg.message.extendedTextMessage?.text ||
      ""

    if (!text.startsWith(".")) return

    const args = text.trim().split(" ")
    const command = args[0].toLowerCase()

    // ===== MENU =====
    if (command === ".menu") {
      await sock.sendMessage(from, {
        text: `🔥 BOT MENU 🔥

.menu
.ping
.owner
.tagall (group)
.kick @etiket (admin)
.add 90xxxx (admin)
.promote @etiket (admin)
.demote @etiket (admin)
`
      })
    }

    // ===== PING =====
    if (command === ".ping") {
      await sock.sendMessage(from, { text: "🏓 Pong!" })
    }

    // ===== OWNER =====
    if (command === ".owner") {
      await sock.sendMessage(from, {
        text: `👑 Owner: wa.me/${ownerNumber}`
      })
    }

    // ===== GROUP FEATURES =====
    if (isGroup) {
      const metadata = await sock.groupMetadata(from)
      const admins = metadata.participants
        .filter(p => p.admin)
        .map(p => p.id)

      const isAdmin = admins.includes(sender)

      // TAGALL
      if (command === ".tagall") {
        let teks = "📢 Herkes buraya!\n\n"
        let mentions = []

        metadata.participants.forEach(p => {
          teks += `@${p.id.split("@")[0]}\n`
          mentions.push(p.id)
        })

        await sock.sendMessage(from, {
          text: teks,
          mentions
        })
      }

      // ADMIN KOMUTLARI
      if (!isAdmin) return

      // KICK
      if (command === ".kick" && msg.message.extendedTextMessage?.contextInfo?.mentionedJid) {
        const user = msg.message.extendedTextMessage.contextInfo.mentionedJid
        await sock.groupParticipantsUpdate(from, user, "remove")
      }

      // ADD
      if (command === ".add" && args[1]) {
        const number = args[1].replace(/[^0-9]/g, "") + "@s.whatsapp.net"
        await sock.groupParticipantsUpdate(from, [number], "add")
      }

      // PROMOTE
      if (command === ".promote" && msg.message.extendedTextMessage?.contextInfo?.mentionedJid) {
        const user = msg.message.extendedTextMessage.contextInfo.mentionedJid
        await sock.groupParticipantsUpdate(from, user, "promote")
      }

      // DEMOTE
      if (command === ".demote" && msg.message.extendedTextMessage?.contextInfo?.mentionedJid) {
        const user = msg.message.extendedTextMessage.contextInfo.mentionedJid
        await sock.groupParticipantsUpdate(from, user, "demote")
      }
    }
  })
}

startBot()
