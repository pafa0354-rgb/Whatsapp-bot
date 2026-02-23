import makeWASocket, {
    DisconnectReason,
    useMultiFileAuthState
} from "@whiskeysockets/baileys"
import pino from "pino"
import express from "express"
import { Boom } from "@hapi/boom"

const OWNER_NUMBER = "905454649356" // numara + yok, 0 yok

const app = express()
app.get("/", (req, res) => res.send("Bot aktif"))
app.listen(8080, () => console.log("Server 8080 portunda çalışıyor"))

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState("auth")

    const sock = makeWASocket({
        auth: state,
        logger: pino({ level: "silent" }),
        browser: ["Railway Bot", "Chrome", "1.0"]
    })

    sock.ev.on("creds.update", saveCreds)

    sock.ev.on("connection.update", async (update) => {
        const { connection, lastDisconnect } = update

        if (connection === "connecting") {
            console.log("WhatsApp bağlanıyor...")
        }

        if (connection === "open") {
            console.log("✅ Bot başarıyla bağlandı!")
        }

        if (connection === "close") {
            const shouldReconnect =
                new Boom(lastDisconnect?.error)?.output?.statusCode !==
                DisconnectReason.loggedOut

            console.log("❌ Bağlantı kapandı.")

            if (shouldReconnect) {
                console.log("🔄 Yeniden bağlanıyor...")
                startBot()
            } else {
                console.log("🚪 Oturum kapatıldı.")
            }
        }
    })

    // ⚠️ BURASI DEĞİŞTİ
    if (!state.creds.registered) {
        sock.ev.once("connection.update", async (update) => {
            if (update.connection === "connecting") {
                try {
                    const code = await sock.requestPairingCode(OWNER_NUMBER)
                    console.log("PAIRING CODE:", code)
                } catch (err) {
                    console.log("Pairing hatası:", err.message)
                }
            }
        })
    }

    // Mesaj sistemi
    sock.ev.on("messages.upsert", async (m) => {
        const msg = m.messages[0]
        if (!msg.message) return

        const sender = msg.key.remoteJid
        const isOwner = sender.includes(OWNER_NUMBER)

        const text =
            msg.message.conversation ||
            msg.message.extendedTextMessage?.text ||
            ""

        if (!text.startsWith("!")) return

        const command = text.slice(1).split(" ")[0].toLowerCase()

        switch (command) {
            case "ping":
                await sock.sendMessage(sender, { text: "🏓 Pong!" })
                break

            case "menu":
                await sock.sendMessage(sender, {
                    text:
                        "📌 *Bot Menü*\n\n" +
                        "!ping\n!menu\n!owner\n!info\n!restart"
                })
                break

            case "owner":
                await sock.sendMessage(sender, {
                    text: "👑 Owner: +" + OWNER_NUMBER
                })
                break

            case "info":
                await sock.sendMessage(sender, {
                    text: "🤖 VIOLENTxARYA WhatsApp Bot\n⚡ Baileys\n🚀 Aktif"
                })
                break

            case "restart":
                if (!isOwner)
                    return sock.sendMessage(sender, {
                        text: "❌ Sadece owner kullanabilir."
                    })

                await sock.sendMessage(sender, {
                    text: "♻️ Yeniden başlatılıyor..."
                })

                process.exit(0)
                break
        }
    })
}

startBot()

// Railway kapanmasın
setInterval(() => {
    console.log("Bot aktif...")
}, 30000)
