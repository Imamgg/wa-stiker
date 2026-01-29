import { WASocket } from "@whiskeysockets/baileys";

export async function handleHelp(sock: WASocket, jid: string) {
  const helpText = `*User guide*

📷 *STIKER DARI GAMBAR*
Kirim gambar dengan caption:

*Buat stiker biasa*
\`\`\`!sticker\`\`\`

*Buat stiker dengan custom name*
\`\`\`!sticker name="Nama stiker"\`\`\`

*Buat stiker dengan custom author*
\`\`\`!sticker author="Nama author"\`\`\`

*Buat stiker dengan custom name dan author*
\`\`\`!sticker name="Nama stiker" author="Nama author"\`\`\`

✏️ *STIKER DARI TEKS*

*Buat stiker dari teks*
\`\`\`!textsticker Teks yang ingin dijadikan stiker\`\`\`

*Buat stiker teks dengan custom name/author*
\`\`\`!textsticker Teks disini name="Nama" author="Author"\`\`\`

*Alias:* !textsticker, !teksstiker, !ts

❓ *BANTUAN*
\`\`\`!help\`\`\`

*Tampilkan panduan penggunaan bot*`;

  await sock.sendMessage(jid, { text: helpText });
}
