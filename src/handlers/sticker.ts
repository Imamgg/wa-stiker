import {
  downloadMediaMessage,
  WAMessage,
  WASocket,
} from "@whiskeysockets/baileys";
import sharp from "sharp";

import printLog from "../utils/logger";
import { addStickerExif } from "../utils/stickerExif";

export async function handleSticker(
  sock: WASocket,
  msg: WAMessage,
  stickerName: string | null,
  stickerAuthor: string | null,
) {
  const remoteJid = msg.key?.remoteJid;
  if (!remoteJid) return;

  const phoneNumber = remoteJid.replace("@s.whatsapp.net", "");

  // Prevent empty value
  if (!stickerName) stickerName = "WA Sticker Bot";
  if (!stickerAuthor) stickerAuthor = "Sticker Bot";

  try {
    // Download the image
    const buffer = await downloadMediaMessage(msg, "buffer", {});

    if (!buffer) {
      await sock.sendMessage(remoteJid, {
        text: "Terjadi kesalahan pada saat mendownload gambar",
      });
      return;
    }

    // Convert to WebP format for sticker
    const webpBuffer = await sharp(buffer as Buffer)
      .resize(512, 512, {
        fit: "contain",
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .webp()
      .toBuffer();

    // Add EXIF metadata with sticker name and author
    const stickerBuffer = await addStickerExif(
      webpBuffer,
      stickerName,
      stickerAuthor,
    );

    // Send as sticker
    await sock.sendMessage(remoteJid, {
      sticker: stickerBuffer,
    });

    // Print log
    if (process.env.NODE_ENV !== "production") {
      printLog(phoneNumber, stickerName, stickerAuthor);
    }

    await sock.sendMessage(remoteJid, {
      text: "Bot gabut, pake aja sepuasnya.",
    });
  } catch (error) {
    console.error("Error creating sticker:", error);
    await sock.sendMessage(remoteJid, {
      text: "Terjadi kesalahan pada saat membuat stiker",
    });
  }
}
