# Telegram Business (منشی پروفایل)

برای اینکه بات **به‌جای پروفایل شخصی/بیزنس شما** جواب بدهد (نه فقط چت با @bot):

## پیش‌نیاز تلگرام

1. در [@BotFather](https://t.me/BotFather) برای بات خود:
   - `/mybots` → بات → **Business** / **Telegram Business Mode** را فعال کنید
   - دسترسی‌های لازم (خواندن پیام / پاسخ) را بدهید
2. در اپ تلگرام (اکانت بیزنس):
   - Settings → Telegram Business → Chatbots
   - بات را به‌عنوان منشی متصل کنید و اجازه Reply بدهید

## رفتار سیستم

- پیام مشتری به **پروفایل شما** → آپدیت `business_message`
- پاسخ با پارامتر `business_connection_id` → از دید مشتری پیام از **شما** می‌آید
- چت مستقیم با `@bot` همچنان جداگانه کار می‌کند

## تست

1. API را روشن نگه دارید (`node apps/api/dist/main.js` یا `npm run dev:api`)
2. از یک اکانت دیگر به پروفایل خودتان پیام بدهید (نه به یوزرنیم بات)
3. در لاگ API باید ببینید: `Business reply sent to chat ...`
4. اگر جواب نیامد: اتصال Business را یک‌بار قطع/وصل کنید تا `business_connection` بیاید

## محدودیت‌ها

- `sendChatAction` (typing) در حالت Business پشتیبانی نمی‌شود
- اگر نمونهٔ دیگری از همین توکن polling داشته باشد → خطای 409 Conflict

## شورت‌کد کنترل دستی + هشدار تماس

جزئیات: [telegram-shortcodes.md](./telegram-shortcodes.md)

داخل چت مشتری (از اکانت ادمین): `#من` = کنترل دستی، `#ربات` = برگشت AI.  
هر handoff به `TELEGRAM_ADMIN_CHAT_ID` با نام/شماره/آیدی برای تماس می‌رود.
