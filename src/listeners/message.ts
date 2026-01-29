import { WAMessage, WASocket } from "@whiskeysockets/baileys";

import { handleHelp } from "../handlers/help";
import { handleSticker } from "../handlers/sticker";
import parseOptions from "../utils/parseOptions";
import { handleTextSticker } from "../handlers/textSticker";

export async function handleMessage(sock: WASocket, msg: WAMessage) {
  const remoteJid = msg.key?.remoteJid;
  if (!remoteJid) return;

  // Get message content
  const messageContent = msg.message;
  if (!messageContent) return;

  // Check message type - handle various message formats
  const textMessage =
    messageContent.conversation ||
    messageContent.extendedTextMessage?.text ||
    messageContent.imageMessage?.caption ||
    messageContent.videoMessage?.caption ||
    messageContent.documentMessage?.caption ||
    messageContent.buttonsResponseMessage?.selectedDisplayText ||
    messageContent.listResponseMessage?.title ||
    messageContent.templateButtonReplyMessage?.selectedDisplayText ||
    "";

  const isImage = !!messageContent.imageMessage;

  // Skip empty messages (like read receipts, notifications, etc.)
  if (!textMessage && !isImage) {
    console.log("[DEBUG] Pesan kosong atau bukan text/image, skip...");
    return;
  }

  console.log(`[DEBUG] Pesan: "${textMessage}" | isImage: ${isImage}`);

  // Parse command
  const [command, ...rest] = textMessage.split(" ").map((cmd) => cmd.trim());

  // Parse options
  const options = rest
    .join(" ")
    .replaceAll(" name", "|name")
    .replaceAll(" author", "|author")
    .split("|");
  const { stickerName, stickerAuthor } = parseOptions(options);

  // Handle !help command
  if (command.toLowerCase().includes("!help")) {
    console.log("[DEBUG] Menjalankan help handler");
    await handleHelp(sock, remoteJid);
    return;
  }

  // Handle !textsticker command
  if (["!textsticker", "!teksstiker", "!ts"].includes(command.toLowerCase())) {
    console.log("[DEBUG] Menjalankan text sticker handler");
    // Get text after command (excluding name/author options)
    const textParts = rest.filter(
      (part) => !part.startsWith("name=") && !part.startsWith("author="),
    );
    const text = textParts.join(" ").split("|")[0].trim();
    await handleTextSticker(sock, remoteJid, text, stickerName, stickerAuthor);
    return;
  }

  // Handle !sticker command
  if (["!sticker", "!stiker"].includes(command.toLowerCase()) && isImage) {
    console.log("[DEBUG] Menjalankan sticker handler");
    await handleSticker(sock, msg, stickerName, stickerAuthor);
    return;
  } else if (
    command.toLowerCase().includes("sticker") ||
    command.toLowerCase().includes("stiker")
  ) {
    await sock.sendMessage(remoteJid, { text: "Gambarnya mana? anjaii" });
    return;
  }

  // Only reply if command starts with !
  if (command.startsWith("!")) {
    await sock.sendMessage(remoteJid, {
      text: "*Command salah*, coba cek kembali command yang Anda kirim\n\nKetik *!help* untuk melihat daftar command",
    });
  }
}
