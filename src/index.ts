import { Boom } from "@hapi/boom";
import makeWASocket, {
  DisconnectReason,
  fetchLatestBaileysVersion,
  useMultiFileAuthState,
  WASocket,
} from "@whiskeysockets/baileys";
import * as fs from "node:fs/promises";
import pino from "pino";
import * as qrcode from "qrcode-terminal";

import { handleMessage } from "./listeners/message";

const logger = pino({ level: "silent" });
const AUTH_DIR = "auth_info_baileys";

let reconnectTimer: NodeJS.Timeout | null = null;

let sock: WASocket;

async function resetAuthState() {
  try {
    await fs.rm(AUTH_DIR, { recursive: true, force: true });
    await fs.mkdir(AUTH_DIR, { recursive: true });
    console.log("🔐 Sesi login lama dibersihkan. Silakan scan QR baru.");
  } catch (error) {
    console.error("❌ Gagal mereset auth state:", error);
  }
}

function scheduleReconnect(delayMs: number) {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
  }

  console.log(`⏳ Reconnecting in ${delayMs / 1000}s...`);
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    connectToWhatsApp();
  }, delayMs);
}

async function connectToWhatsApp() {
  const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
  const { version } = await fetchLatestBaileysVersion();
  console.log(`📡 Using WA version: ${version.join(".")}`);

  sock = makeWASocket({
    auth: state,
    version,
    printQRInTerminal: false,
    logger,
  });

  // Handle connection updates
  sock.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      console.log("\n📱 Scan QR Code ini dengan WhatsApp Anda:\n");
      qrcode.generate(qr, { small: true });
    }

    if (connection === "close") {
      const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode;
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
      const isUnauthorized = statusCode === 401;

      console.log(
        "Connection closed due to",
        lastDisconnect?.error,
        ", reconnecting:",
        shouldReconnect,
      );

      if (statusCode === DisconnectReason.loggedOut || isUnauthorized) {
        await resetAuthState();
        scheduleReconnect(3000);
        return;
      }

      if (shouldReconnect) {
        // Add delay before reconnecting to avoid rate limiting (405 errors)
        const delay = statusCode === 405 ? 10000 : 3000;
        scheduleReconnect(delay);
      }
    } else if (connection === "open") {
      console.log("✅ Bot berhasil terhubung ke WhatsApp!");
      console.log("🤖 Bot siap menerima pesan. Coba kirim !help");
    }
  });

  // Save credentials when updated
  sock.ev.on("creds.update", saveCreds);

  // Handle incoming messages
  sock.ev.on("messages.upsert", async (m) => {
    if (m.type !== "notify") return;

    for (const msg of m.messages) {
      // Skip jika pesan dari diri sendiri
      if (msg.key.fromMe) continue;
      // Skip jika tidak ada pesan
      if (!msg.message) continue;

      console.log("[DEBUG] Pesan diterima dari:", msg.key.remoteJid);

      await handleMessage(sock, msg);
    }
  });
}

console.log("🚀 Initializing WhatsApp Bot...");
connectToWhatsApp().catch((error) => {
  console.error("❌ Gagal menginisialisasi koneksi WhatsApp:", error);
  scheduleReconnect(5000);
});
