import makeWASocket, {
    DisconnectReason,
    useMultiFileAuthState
} from "@whiskeysockets/baileys"
import pino from "pino"
import express from "express"
import { Boom } from "@hapi/boom"

const OWNER_NUMBER = "905454649356" // kendi numaran (başında + yok)

const app = express()
app.get("/", (req, res) => res.send("Bot aktif"))
app.listen(8080, () => console.log("Server 8080 portunda çalışıyor"))

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState("auth")

    const sock = makeWASocket({
        auth: state,
        logger: pino({ level: "silent" }),
        printQRInTerminal: false
    })

    // Pairing Code
    if (!state.creds.registered) {
        setTimeout(async () => {
            try {
                const code = await sock.requestPairingCode(OWNER_NUMBER)
                console.log("PAIRING CODE:", code)
            } catch (err) {
                console.log("Pairing hatası:", err)
            }
        }, 3000)
    }

    // Bağlantı kontrolü
    sock.ev.on("connection.update", async (update) => {
        const { connection, lastDisconnect } = update

        if (connection === "close") {
            const shouldReconnect =
                new Boom(lastDisconnect?.error)?.output?.statusCode !==
                DisconnectReason.loggedOut

            console.log("Bağlantı kapandı.")

            if (shouldReconnect) {
                console.log("Yeniden bağlanılıyor...")
                startBot()
            } else {
                console.log("Çıkış yapıldı.")
            }
        } else if (connection === "open") {
            console.log("Bot başarıyla bağlandı!")
        }
    })

    sock.ev.on("creds.update", saveCreds)

    // Mesaj sistemi
    sock.ev.on("messages.upsert", async (m) => {
        const msg = m.messages[0]
        if (!msg.message) return

        const sender = msg.key.remoteJid
        const isOwner = sender.includes(OWNER_NUMBER)

        const messageText =
            msg.message.conversation ||
            msg.message.extendedTextMessage?.text ||
            ""

        // Prefix sistemi
        if (!messageText.startsWith("!")) return
        const command = messageText.slice(1).split(" ")[0].toLowerCase()

        // Komutlar
        switch (command) {
            case "ping":
                await sock.sendMessage(sender, { text: "🏓 Pong!" })
                break

            case "menu":
                await sock.sendMessage(sender, {
                    text:
                        "📌 *Bot Menü*\n\n" +
                        "!ping\n" +
                        "!menu\n" +
                        "!owner\n" +
                        "!info"
                })
                break

            case "owner":
                await sock.sendMessage(sender, {
                    text: "👑 Bot sahibi: +" + OWNER_NUMBER
                })
                break

            case "info":
                await sock.sendMessage(sender, {
                    text:
                        "🤖 Railway WhatsApp Bot\n" +
                        "⚡ Baileys altyapı\n" +
                        "🚀 Aktif ve çalışıyor"
                })
                break

            case "restart":
                if (!isOwner)
                    return sock.sendMessage(sender, {
                        text: "❌ Bu komut sadece owner içindir."
                    })

                await sock.sendMessage(sender, {
                    text: "♻️ Bot yeniden başlatılıyor..."
                })
                process.exit(0)
                break

            default:
                await sock.sendMessage(sender, {
                    text: "❓ Bilinmeyen komut. !menu yaz."
                })
        }
    })
}

startBot()

// Railway kapanmasın diye
setInterval(() => {
    console.log("Bot aktif...")
}, 30000)
