/**

 * Direct Telegram test with logo watermark — no DB required.

 * Usage: tsx scripts/send-horeca-direct.ts [chatId] [count]

 */

import { readFileSync, existsSync } from "node:fs";

import { resolve } from "node:path";

import { formatHorecaPostHtml } from "../../../packages/shared/dist/format-horeca-post.js";

import { telegramSendPhotoBuffer } from "../src/telegram-api.js";

import { applyHorecaWatermark } from "../src/watermark.js";



const CHAT_ID = process.argv[2] ?? "-1004475927547";

const COUNT = Math.max(1, Number(process.argv[3] ?? 3));



function loadEnv() {

  const envPath = resolve(process.cwd(), "../../.env");

  if (!existsSync(envPath)) return;

  for (const line of readFileSync(envPath, "utf8").split("\n")) {

    const m = line.match(/^([^#=]+)=(.*)$/);

    if (!m) continue;

    const key = m[1]!.trim();

    const val = m[2]!.trim().replace(/^["']|["']$/g, "");

    if (!process.env[key]) process.env[key] = val;

  }

}



const tests = [

  {

    title: "Татар Бунар",

    businessType: "ресторан",

    address: "вул. Леонтовича, 13",

    benefits:

      "- навчаємо, допомагаємо зростати\n- висока та вчасна оплата\n- смачне харчування та форма\n- дружня команда 🤗",

    contactPhone: "+38 (068) 662 93 57",

    photo: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200",

    positions: [

      {

        title: "Су шеф",

        experience: "від 2 років",

        salary: "2000 грн. ставка\n+2% від каси",

        schedule: "4/2, 5/2",

        workTime: "12 годин",

      },

      {

        title: "Гарячий цех",

        experience: "від 1 року",

        salary: "1800 грн. ставка",

        schedule: "5/2",

        workTime: "10 годин",

      },

    ],

  },

  {

    title: "Alaska",

    businessType: "ресторан",

    address: "вул. Хрещатик, 22",

    benefits:

      "- офіційне оформлення\n- кар'єрний ріст\n- зручний графік\n- дружній колектив",

    contactPhone: "+38 (050) 123 45 67",

    photo: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1200",

    positions: [

      {

        title: "Офіціант",

        experience: "від 6 місяців",

        salary: "25000 грн на місяць + чайові",

        schedule: "2/2",

        workTime: "10 годин",

      },

      {

        title: "Бармен",

        experience: "від 1 року",

        salary: "30000 грн + бонуси",

        schedule: "5/2",

        workTime: "8 годин",

      },

    ],

  },

  {

    title: "Jord",

    businessType: "бар",

    address: "вул. Саксаганського, 7",

    benefits:

      "- навчання на місці\n- гнучкий графік\n- чайові + бонуси\n- молодий колектив",

    contactPhone: "+38 (067) 555 12 34",

    photo: "https://images.unsplash.com/photo-1572116469696-31de0f17cc34?w=1200",

    positions: [

      {

        title: "Бармен",

        experience: "від 1 року",

        salary: "35000 грн + % від бару",

        schedule: "3/3",

        workTime: "12 годин",

      },

    ],

  },

];



async function main() {

  loadEnv();

  let token = process.env.TELEGRAM_BOT_TOKEN?.trim();

  if (!token) {

    const logPath = resolve(process.cwd(), "../../.local/bot-telegram-live.log");

    if (existsSync(logPath)) {

      const m = readFileSync(logPath, "utf8").match(/token: '([^']+)'/g);

      const last = m?.at(-1)?.match(/'([^']+)'/);

      token = last?.[1]?.trim();

    }

  }

  if (!token) {

    console.error("TELEGRAM_BOT_TOKEN missing");

    process.exit(1);

  }



  const ids: number[] = [];

  for (let i = 0; i < Math.min(COUNT, tests.length); i++) {

    const tc = tests[i]!;

    const caption = formatHorecaPostHtml({

      businessType: tc.businessType,

      title: tc.title,

      address: tc.address,

      benefits: tc.benefits,

      contactPhone: tc.contactPhone,

      positions: tc.positions,

    });



    console.log(`\n--- Test ${i + 1}: ${tc.title} (watermark) ---`);

    const rawRes = await fetch(tc.photo);

    if (!rawRes.ok) throw new Error(`Photo fetch failed: ${tc.photo}`);

    const raw = Buffer.from(await rawRes.arrayBuffer());

    const watermarked = await applyHorecaWatermark(raw, { title: tc.title });

    const msgId = await telegramSendPhotoBuffer(token, CHAT_ID, watermarked, caption);

    console.log(`Sent message_id=${msgId}`);

    ids.push(msgId);

    if (i + 1 < COUNT) await new Promise((r) => setTimeout(r, 1500));

  }



  console.log(`\nDone. ${ids.length} watermarked post(s) → ${CHAT_ID}`);

  console.log("Message IDs:", ids.join(", "));

}



main().catch((err) => {

  console.error(err);

  process.exit(1);

});


