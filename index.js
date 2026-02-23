import makeWASocket, {
    DisconnectReason,
    useMultiFileAuthState
} from "@whiskeysockets/baileys"
import pino from "pino"
import express from "express"
import { Boom } from "@hapi/boom"
import qrcode from "qrcode-terminal"

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
        const { connection, qr, lastDisconnect } = update

        if (qr) {
            console.log("QR KODU OKUT 👇")
            qrcode.generate(qr, { small: true })
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
            }
        }
    })
}

startBot()

setInterval(() => {
    console.log("Bot aktif...")
}, 30000)
