/**
 * Utility to add EXIF metadata to WebP stickers for WhatsApp
 * WhatsApp reads sticker pack name and author from EXIF data
 */

// eslint-disable-next-line @typescript-eslint/no-require-imports
const webpmux = require("node-webpmux");

/**
 * Creates EXIF metadata buffer with sticker pack info
 */
function createExifBuffer(packName: string, packAuthor: string): Buffer {
  const json = JSON.stringify({
    "sticker-pack-id": "com.wa-sticker-bot",
    "sticker-pack-name": packName,
    "sticker-pack-publisher": packAuthor,
    emojis: ["🤖"],
  });

  // EXIF header for WhatsApp sticker metadata
  const exifHeader = Buffer.from([
    0x49, 0x49, 0x2a, 0x00, 0x08, 0x00, 0x00, 0x00, 0x01, 0x00, 0x41, 0x57,
    0x07, 0x00, 0x00, 0x00, 0x00, 0x00, 0x16, 0x00, 0x00, 0x00,
  ]);

  const jsonBuffer = Buffer.from(json, "utf-8");
  const exifBuffer = Buffer.concat([exifHeader, jsonBuffer]);

  // Update length field in header (offset 14, 4 bytes LE)
  exifBuffer.writeUInt32LE(jsonBuffer.length, 14);

  return exifBuffer;
}

/**
 * Adds EXIF metadata to a WebP buffer for WhatsApp sticker
 */
export async function addStickerExif(
  webpBuffer: Buffer,
  packName: string,
  packAuthor: string,
): Promise<Buffer> {
  const image = new webpmux.Image();
  await image.load(webpBuffer);

  const exifBuffer = createExifBuffer(packName, packAuthor);
  image.exif = exifBuffer;

  return await image.save(null);
}
