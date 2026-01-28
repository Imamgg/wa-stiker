import { WASocket } from '@whiskeysockets/baileys';

export async function handleHelp(sock: WASocket, jid: string) {
  const helpText = `*User guide*
Kirim gambar dengan deskripsi sebagai berikut:

*Buat stiker biasa*
\`\`\`!sticker\`\`\`

*Buat stiker dengan custom name*
\`\`\`!sticker name="Nama stiker"\`\`\`

*Buat stiker dengan custom author*
\`\`\`!sticker author="Nama author"\`\`\`

*Buat stiker dengan custom name dan author*
\`\`\`!sticker name="Nama stiker" author="Nama author"\`\`\`

*Tampilkan user guide*
\`\`\`!help\`\`\`


_Saat ini bot belum mendukung gambar png_`;

  await sock.sendMessage(jid, { text: helpText });
}
