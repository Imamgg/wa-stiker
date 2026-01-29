import { WASocket } from "@whiskeysockets/baileys";
import sharp from "sharp";

import { addStickerExif } from "../utils/stickerExif";

/**
 * Handle text to sticker conversion
 */
export async function handleTextSticker(
  sock: WASocket,
  remoteJid: string,
  text: string,
  stickerName: string | null,
  stickerAuthor: string | null,
) {
  if (!text || text.trim() === "") {
    await sock.sendMessage(remoteJid, {
      text: "Teksnya mana? Contoh: `!textsticker Teks disini yaa`",
    });
    return;
  }

  // Prevent empty value
  if (!stickerName) stickerName = "WA Sticker Bot";
  if (!stickerAuthor) stickerAuthor = "Sticker Bot";

  try {
    // Create SVG with text
    const svgText = createTextSvg(text.trim());

    // Convert SVG to WebP
    const webpBuffer = await sharp(Buffer.from(svgText))
      .resize(512, 512, {
        fit: "contain",
        background: { r: 255, g: 255, b: 255, alpha: 1 },
      })
      .webp()
      .toBuffer();

    // Add EXIF metadata
    const stickerBuffer = await addStickerExif(
      webpBuffer,
      stickerName,
      stickerAuthor,
    );

    // Send as sticker
    await sock.sendMessage(remoteJid, {
      sticker: stickerBuffer,
    });
  } catch (error) {
    console.error("Error creating text sticker:", error);
    await sock.sendMessage(remoteJid, {
      text: "Terjadi kesalahan saat membuat stiker teks",
    });
  }
}

/**
 * Creates an SVG with the given text, with automatic word wrapping
 */
function createTextSvg(text: string): string {
  const width = 512;
  const height = 512;
  const padding = 40;
  const maxWidth = width - padding * 2;

  // Split text into words
  const words = text.split(/\s+/);

  // Calculate font size based on text length
  let fontSize = 72;
  if (text.length > 50) fontSize = 48;
  if (text.length > 100) fontSize = 36;
  if (text.length > 200) fontSize = 28;

  // Estimate characters per line (rough estimate: 0.6 * fontSize per character)
  const charsPerLine = Math.floor(maxWidth / (fontSize * 0.5));

  // Wrap text into lines
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    if (testLine.length <= charsPerLine) {
      currentLine = testLine;
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  }
  if (currentLine) lines.push(currentLine);

  // Calculate line height and starting Y position
  const lineHeight = fontSize * 1.3;
  const totalTextHeight = lines.length * lineHeight;
  const startY = (height - totalTextHeight) / 2 + fontSize;

  // Escape special XML characters
  const escapeXml = (str: string) =>
    str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");

  // Create text elements for each line
  const textElements = lines
    .map((line, index) => {
      const y = startY + index * lineHeight;
      return `<text x="50%" y="${y}" text-anchor="middle" dominant-baseline="middle" font-family="Arial, sans-serif" font-size="${fontSize}" font-weight="bold" fill="#000000">${escapeXml(line)}</text>`;
    })
    .join("\n    ");

  return `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="white"/>
  <style>
    text {
      font-family: Arial, Helvetica, sans-serif;
    }
  </style>
  ${textElements}
</svg>`;
}
