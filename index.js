const express = require("express");
const { Client, LocalAuth } = require("whatsapp-web.js");
const qrcode = require("qrcode");

const app = express();
const port = process.env.PORT || 10000;

app.get("/", (req, res) => {
  res.send("Bot çalışıyor 🚀");
});

app.listen(port, () => {
  console.log(`Server ${port} portunda çalışıyor`);
});

const client = new Client({
  authStrategy: new LocalAuth()
  puppeteer: {
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  }
});

client.on("qr", async (qr) => {
  console.log("QR KODUNU AŞAĞIDAKİ LİNKTE AÇ:");
  const qrUrl = await qrcode.toDataURL(qr);
  console.log(qrUrl);
});

client.on("ready", () => {
  console.log("WhatsApp bot hazır ✅");
});

client.initialize();
