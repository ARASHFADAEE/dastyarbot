اهنمای شروع سریع
این راهنما به شما کمک می‌کند تا در عرض چند دقیقه با پلتفرم AvalAI شروع به کار کنید.

مسیر پیشنهادی برای اولین اجرا:

یک SDK نصب کنید.
متغیر محیطی AVALAI_API_KEY را تنظیم کنید.
سبک API را انتخاب کنید: /v1/responses برای برنامه‌های جدید متنی، استدلالی و ابزارمحور؛ /v1/chat/completions برای ادغام‌های چت موجود و بیشترین سازگاری با ارائه‌دهندگان.
اولین درخواست را ارسال کنید، سپس از /v1/models و avalai-request-id برای کشف مدل‌ها و ردیابی هزینه استفاده کنید.
۱. ساخت و محافظت از کلید API
در داشبورد AvalAI یک حساب کاربری ایجاد کنید.
به بخش کلیدهای API بروید.
یک کلید API جدید ایجاد کنید.
کلید API خود را به صورت امن نگهداری کنید - فقط یک بار نمایش داده می‌شود!
تنظیم متغیر محیطی کلید API
پیش از اجرای مثال‌های SDK یا curl، مقدار AVALAI_API_KEY را تنظیم کنید. آن را در shell profile، secret manager یا محیط deployment نگه دارید؛ کلید API را داخل source code، screenshot، issue report یا JavaScript سمت مرورگر قرار ندهید.


# macOS / Linux
export AVALAI_API_KEY="sk-..."
1
2

# Windows PowerShell
setx AVALAI_API_KEY "sk-..."
1
2
پس از تنظیم متغیر، یک terminal جدید باز کنید یا shell profile را reload کنید و سپس مثال‌های زیر را اجرا کنید.

۲. نصب و پیکربندی کلاینت
نصب یک SDK سازگار با OpenAI
AvalAI از سه رویکرد SDK پشتیبانی می‌کند:

ادغام‌های جایگزین با SDK رسمی
زبان مورد نظر خود را انتخاب کنید:

پایتون (Python)

pip install openai
1
نود.جی‌اس (Node.js)

npm install openai
1
گو (Go)

go get github.com/openai/openai-go
1
پی‌اچ‌پی (PHP)

composer require openai-php/client
1
استفاده از آدرس پایه AvalAI
AvalAI چندین دامنه را برای اطمینان از اتصال بهینه بر اساس موقعیت و شرایط شبکه شما فراهم می‌کند.

1. دامنه اصلی - پیشنهادی
آدرس: api.avalai.ir
CDN: شبکه جهانی
بهترین برای: کاربرانی که به دنبال عملکرد بهینه با کمترین تاخیر هستند
نحوه استفاده
کاربران می‌توانند بسته به شرایط شبکه خود، از هر یک از این دامنه‌ها استفاده کنند. تمام API endpoint ها و قابلیت‌ها در هر دو دامنه یکسان هستند.

مثال Python

import os
from openai import OpenAI

# استفاده از دامنه اصلی
client = OpenAI(
    api_key=os.environ["AVALAI_API_KEY"],
    base_url="https://api.avalai.ir/v1",  # آدرس پایه
)
1
2
3
4
5
6
7
8
پیکربندی کلاینت
پایتون (Python)

import os
from openai import OpenAI

client = OpenAI(
    api_key=os.environ["AVALAI_API_KEY"],
    base_url="https://api.avalai.ir/v1",  # آدرس پایه
)
1
2
3
4
5
6
7
جاوااسکریپت/تایپ‌اسکریپت (JavaScript/TypeScript)

import { OpenAI } from "openai";

const client = new OpenAI({
  apiKey: process.env.AVALAI_API_KEY,
  baseURL: "https://api.avalai.ir/v1", // نقطه پایانی API AvalAI
});
1
2
3
4
5
6
گو (Go)

package main

import (
	openai "github.com/openai/openai-go"
	"os"
)

func main() {
	client := openai.NewClient(os.Getenv("AVALAI_API_KEY"))
	client.BaseURL = "https://api.avalai.ir/v1" // نقطه پایانی API AvalAI
}
1
2
3
4
5
6
7
8
9
10
11
پی‌اچ‌پی (PHP)

<?php

require_once 'vendor/autoload.php';

// استفاده از کتابخانه کلاینت PHP OpenAI (https://github.com/openai-php/client)
$apiKey = getenv('AVALAI_API_KEY');

if (!$apiKey) {
    die("AvalAI API key not found. Please set the AVALAI_API_KEY environment variable.");
}

// Your custom base URL
$customBaseUrl = 'https://api.avalai.ir/v1';

// Create a custom client instance using the factory
$client = OpenAI::factory()
    ->withApiKey($apiKey)
    ->withBaseUri($customBaseUrl)
    ->make();
1
2
3
4
5
6
7
8
9
10
11
12
13
14
15
16
17
18
19
۳. انتخاب سبک API
برای برنامه‌های جدید تولید متن، وقتی مدل انتخابی از آن پشتیبانی می‌کند، از /v1/responses شروع کنید. Responses از input استفاده می‌کند، متن نهایی را در response.output_text می‌دهد و برای وضعیت مکالمه، استدلال و ابزارها مناسب‌تر است. /v1/chat/completions را برای برنامه‌های موجود، پوشش گسترده‌تر ارائه‌دهندگان و SDKها یا فریم‌ورک‌هایی که هنوز messages می‌خواهند نگه دارید.

Responses API
پیشنهادی برای برنامه‌های جدید GPT-5.5، استدلال، خروجی ساختاریافته و ابزارها.
Chat Completions
برای ادغام‌های چت موجود و مدل‌هایی که فقط سازگاری چت دارند استفاده کنید.
راهنمای مهاجرت
نگاشت messages به input، خواندن output_text و انتخاب روش مدیریت وضعیت.
۴. ارسال اولین درخواست
با یک درخواست ساده Responses شروع کنید:

Responses API (پیشنهادی برای برنامه‌های جدید)

Bash

Python

JavaScript

Go

PHP

curl https://api.avalai.ir/v1/responses \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $AVALAI_API_KEY" \
  -d '{
    "model": "gpt-5.5",
    "instructions": "You are a helpful assistant.",
    "input": "سلام، دنیا!"
  }'
1
2
3
4
5
6
7
8
هدرهای الزامی و محدودیت نرخ
هر درخواست احرازشده به Authorization: Bearer $AVALAI_API_KEY نیاز دارد. برای هر درخواست دارای بدنه JSON، هدر Content-Type: application/json را ارسال کنید. اگر API وضعیت HTTP 429 برگرداند، هدر Retry-After را رعایت کنید، از exponential backoff همراه jitter و سقف تعداد تلاش استفاده کنید و درخواست را بلافاصله تکرار نکنید. برای رفتار فعلی و راهنمای tierها، محدودیت نرخ را ببینید.

Chat Completions برای ادغام موجود
۵. کشف مدل‌ها و گسترش ادغام
فهرست عمومی مدل‌ها بدون احراز هویت در https://api.avalai.ir/public/models در دسترس است. وقتی برنامه به فهرست احرازشده نیاز دارد، از /v1/models همراه کلید API استفاده کنید.

پارامترهای مخصوص ارائه‌دهنده و گزینه‌های TypeScript
کاوش مدل‌های موجود
AvalAI دسترسی به مدل‌های چندین ارائه دهنده را فراهم می‌کند. می‌توانید مشخص کنید که از کدام مدل در درخواست‌های خود استفاده کنید:

مدل‌های OpenAI: gpt-5.5, gpt-5.4-pro, gpt-5.4, gpt-5.4-mini, gpt-5.4-nano, gpt-5.3-chat, gpt-5.3-codex, gpt-image-2 و غیره.
مدل‌های Anthropic: claude-opus-4-8, claude-opus-4-7, claude-opus-4-6, claude-sonnet-4-6, claude-haiku-4-5 و غیره.
مدل‌های Google: gemini-3.5-flash, gemini-3.1-pro-preview, gemini-3.1-flash-lite, gemini-3.1-flash-image, gemini-embedding-2, gemini-3-flash-preview, gemini-2.5-pro, gemma-4-26b-a4b-it و غیره.
مدل‌های XAI: grok-4.3, grok-4.20-reasoning, grok-4.20-non-reasoning, grok-4-1-fast-reasoning و غیره.
مدل‌های DeepSeek: deepseek-v4-pro, deepseek-v4-flash, deepseek-chat و غیره.
مدل‌های Alibaba: qwen3.7-max, qwen3.7-plus, qwen3.6-plus, qwen3.6-flash, qwen3.6-max-preview, qwen-image-2.0-pro, qwen-image-2.0 و غیره.
مدل‌های Moonshot.ai: kimi-k2.7-code, kimi-k2.7-code-highspeed, kimi-k2.6, kimi-k2-thinking, kimi-latest و غیره.
مدل‌های Z.AI: glm-5.2, glm-5.1, glm-5v-turbo, glm-5-turbo و غیره.
مدل‌های MiniMax: minimax-m3, minimax-m2.7, minimax-m2.7-highspeed, minimax-m2.5 و غیره.
مدل‌های Fireworks.ai: nemotron-3-ultra و مدل‌های متن‌باز سریع دیگر.
مدل‌های Meta، Mistral، Cohere، Cloudflare، BytePlus و سایر ارائه‌دهندگان نیز در دسترس هستند.
لیست مدل‌های موجود از طریق API
می‌توانید لیست تمام مدل‌های موجود را به صورت برنامه‌نویسی دریافت کنید:


# لیست تمام مدل‌ها
models = client.models.list()
for model in models.data:
    print(f"{model.id} - {model.owned_by}")

# دریافت اطلاعات دقیق یک مدل خاص (شامل قیمت‌گذاری، قابلیت‌ها، محدودیت‌های نرخ)
model = client.models.retrieve("gpt-5.5")
print(model)
1
2
3
4
5
6
7
8

# نقطه پایانی عمومی (بدون نیاز به احراز هویت)
curl https://api.avalai.ir/public/models

# نقطه پایانی با احراز هویت
curl https://api.avalai.ir/v1/models -H "Authorization: Bearer $AVALAI_API_KEY"

# دریافت جزئیات یک مدل خاص
curl https://api.avalai.ir/v1/models/gpt-5.5 -H "Authorization: Bearer $AVALAI_API_KEY"
1
2
3
4
5
6
7
8
برای لیست کامل مدل‌های موجود، به مستندات مدل‌ها یا مرجع API مدل‌ها مراجعه کنید.

۶. ردیابی استفاده و انتخاب گام بعدی
ردیابی هزینه‌ها و استفاده از API (اختیاری)
برای برنامه‌های تولیدی، فروشندگان و سازمان‌های بزرگ، AvalAI API کاربر را برای ردیابی دقیق هزینه‌ها و تحلیل استفاده فراهم می‌کند.

دریافت شناسه درخواست
هر پاسخ API شامل یک هدر avalai-request-id است که درخواست را به طور منحصر به فرد شناسایی می‌کند:


# مثال Python - دریافت هدرهای پاسخ
response = client.chat.completions.create(
    model="gpt-5.4-mini", messages=[{"role": "user", "content": "سلام!"}]
)

# شیء پاسخ به طور مستقیم هدرها را در SDK OpenAI نمایش نمی‌دهد
# برای دریافت هدرها، مستقیما از کلاینت HTTP استفاده کنید یا لاگ‌های برنامه خود را بررسی کنید
1
2
3
4
5
6
7

# استفاده از curl برای مشاهده هدرها
curl -i "https://api.avalai.ir/v1/chat/completions" \
  -H "Authorization: Bearer $AVALAI_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model": "gpt-5.4-mini", "messages": [{"role": "user", "content": "سلام"}]}'

# به دنبال این بگردید: avalai-request-id: 019ac4a0-a8f4-7041-845f-3ea8f15dcf1a
1
2
3
4
5
6
7
برای درخواست Responses، همین هدر را از /v1/responses دریافت کنید:


curl -i "https://api.avalai.ir/v1/responses" \
  -H "Authorization: Bearer $AVALAI_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model": "gpt-5.5", "input": "سلام"}'
1
2
3
4
دریافت هزینه‌های دقیق
از avalai-request-id برای جستجوی هزینه‌های دقیق استفاده کنید (ظرف 30 ثانیه در دسترس است):


import requests
import os

# جستجوی هزینه دقیق
response = requests.post(
    "https://api.avalai.ir/user/v1/transactions/lookup",
    headers={
        "Authorization": f"Bearer {os.environ['AVALAI_API_KEY']}",
        "Content-Type": "application/json",
    },
    json={"transaction_ids": ["019ac4a0-a8f4-7041-845f-3ea8f15dcf1a"]},
)

data = response.json()
# هزینه دقیق را به دلار و تومان با جزئیات کامل تراکنش برمی‌گرداند
1
2
3
4
5
6
7
8
9
10
11
12
13
14
15
چرا از User API استفاده کنیم؟
هزینه‌های دقیق 100٪ - برخلاف estimated_cost در پاسخ‌ها، User API هزینه‌های دقیق تضمین‌شده را فراهم می‌کند
صورتحساب برای فروشندگان - بر اساس هزینه‌های واقعی بدون اختلاف به مشتریان صورتحساب صادر کنید
تحلیل استفاده - هزینه‌ها را بر اساس مدل، ارائه‌دهنده، تاریخ یا ساعت ردیابی کنید
رد تراکنش‌ها - تاریخچه کامل تراکنش‌ها برای انطباق
اطلاعات بیشتر:

مستندات User API - مرجع کامل API
راهنمای ردیابی هزینه برای فروشندگان - راهنمای گام به گام برای صورتحساب دقیق
راهنمای استفاده برای سازمان‌ها - الگوهای پیشرفته برای استقرارهای در مقیاس بزرگ
رفع اشکال با آدرس مستندات


کتابخانه‌ها
محیط توسعه خود را برای استفاده از API AvalAI با یک SDK در زبان مورد نظر خود راه‌اندازی کنید.

این صفحه راه‌اندازی محیط توسعه محلی شما برای استفاده از API AvalAI را پوشش می‌دهد. AvalAI از SDK‌های رسمی OpenAI با یک URL پایه سفارشی استفاده می‌کند که به شما امکان می‌دهد از کتابخانه‌های به خوبی نگهداری شده در حین اتصال به سرویس‌های AvalAI استفاده کنید.

ایجاد و صادر کردن یک کلید API
قبل از شروع، یک کلید API در داشبورد ایجاد کنید، که از آن برای دسترسی امن به API استفاده خواهید کرد. کلید را در مکانی امن مانند فایل .zshrc یا فایل متنی دیگری در کامپیوتر خود ذخیره کنید. پس از تولید یک کلید API، آن را به عنوان یک متغیر محیطی در ترمینال خود صادر کنید.


Bash

# صادر کردن یک متغیر محیطی در سیستم‌های macOS یا Linux
export AVALAI_API_KEY="aa-YOUR_API_KEY"

powershell:# صادر کردن یک متغیر محیطی در PowerShell
setx AVALAI_API_KEY "aa-YOUR_API_KEY"
1
2
3
4
5
مثال‌های زیر AVALAI_API_KEY را صریحا به کلاینت می‌دهند و URL پایه سفارشی AvalAI را روی هر کلاینت تنظیم می‌کنند.

گزینه‌های SDK
AvalAI از سه رویکرد برای دسترسی به مدل‌های هوش مصنوعی پشتیبانی می‌کند:

SDK های سازگار با OpenAI (رویکرد یکپارچه) - از SDK های OpenAI برای دسترسی به تمام مدل‌ها از چندین ارائه دهنده با نحو یکسان استفاده کنید
SDK های رسمی Anthropic (رویکرد بومی) - استفاده از SDK های رسمی Anthropic برای دسترسی به مدل‌های چندین ارائه دهنده (Anthropic، OpenAI، AWS Bedrock، Vertex AI و Gemini) با نحو بومی
SDK Google GenAI (رویکرد بومی) - استفاده از SDK رسمی GenAI گوگل برای دسترسی بومی به مدل‌های Gemini با طرحواره API بومی گوگل
انتخاب بین Responses و Chat Completions
برای هر دو مسیر /v1/responses و /v1/chat/completions می‌توانید SDKهای رسمی OpenAI را با baseURL سفارشی AvalAI استفاده کنید:

برای گردش‌کارهای جدید متنی، استدلالی و ابزارمحور با Responses شروع کنید وقتی مدل انتخابی پشتیبانی می‌کند. input و در صورت نیاز instructions ارسال کنید و متن نهایی را از response.output_text بخوانید.
Chat Completions را برای ادغام‌های موجود نگه دارید وقتی از قبل messages دارید، فریم‌ورک شما chat completions می‌خواهد یا مدل انتخابی فقط سازگاری چت دارد.
مهاجرت را مرحله‌ای انجام دهید: messages ساده را به input منتقل کنید، system prompt را به instructions ببرید و choices[0].message.content را با output_text جایگزین کنید.
برای مسیر کامل مهاجرت، Responses در مقابل Chat Completions را ببینید.

نکته‌های به‌روز نگه داشتن SDK
SDKهای OpenAI هم‌زمان با اضافه شدن قابلیت‌های تازه به Responses API سریع تغییر می‌کنند. در production نسخه‌ها را pin کنید، قبل از ارتقای major changelog هر SDK را بخوانید، و برای routeهای تازه AvalAI یا پارامترهای provider-specific که هنوز در SDK expose نشده‌اند یک fallback خام HTTP نگه دارید. هرجا نمونه SDK از OPENAI_API_KEY نام می‌برد، در AvalAI از AVALAI_API_KEY استفاده کنید و baseURL / base_url را روی https://api.avalai.ir/v1 بگذارید.

چک‌لیست SDK برای production
راهنمای کتابخانه‌ها و مرجع API OpenAI نشان می‌دهد انتخاب SDK فقط یک بخش از integration عملیاتی است. هنگام تطبیق نمونه‌های SDK برای AvalAI این قواعد را رعایت کنید:

لایه کلاینت مناسب را انتخاب کنید: برای فراخوانی مستقیم /v1/responses، /v1/chat/completions، صوت، تصویر، embeddings و files از SDKهای رسمی OpenAI استفاده کنید؛ وقتی route تازه AvalAI یا پارامتر native ارائه‌دهنده هنوز در SDK expose نشده، fallback خام HTTP داشته باشید.
secretها را سمت سرور نگه دارید: هرگز AVALAI_API_KEY را در کد مرورگر، موبایل یا repository عمومی قرار ندهید. اگر flow مرورگر به مدل نیاز دارد، آن را از backend خود proxy کنید.
trace IDها را log کنید: مقدار avalai-request-id AvalAI را از response header بگیرید و اگر trace ID داخلی دارید، X-Client-Request-Id خودتان را هم ارسال کنید. این مقدار باید ASCII، یکتا برای هر درخواست، و مطابق محدودیت‌های هدرهای پاسخ کوتاه باشد.
سطح‌های SDK را جدا نگه دارید: نمونه‌های سازگار با OpenAI معمولا به https://api.avalai.ir/v1 نیاز دارند؛ نمونه‌های native Anthropic و Google در همین صفحه عمدا از https://api.avalai.ir بدون /v1 استفاده می‌کنند.
retry را آگاهانه مدیریت کنید: برای خطاهای موقت شبکه می‌توانید از رفتار retry SDK کمک بگیرید، اما برای tool call، پرداخت، upload فایل و jobهای طولانی همچنان idempotency، backoff و وضعیت خطای قابل‌مشاهده برای کاربر پیاده کنید.
Agents SDK را راهنمای orchestration بدانید: OpenAI Agents SDK را برای orchestration ابزارها، handoff، guardrail، tracing و sandbox execution پیشنهاد می‌کند. در AvalAI فقط وقتی از آن استفاده کنید که model client، base URL و قابلیت‌های ابزار route انتخابی را verify کرده‌اید.
Timeoutها و درخواست‌های طولانی
راهنمای SDK OpenAI یادآوری می‌کند SDKهای رسمی timeout درخواست و retry خودکار برای بعضی خطاهای گذرای timeout دارند. در AvalAI، وقتی یک درخواست می‌تواند بیشتر از یک turn چت معمولی طول بکشد، timeout را صریح تنظیم کنید: سطح سرویس flex، سندهای طولانی، workflowهای شبیه deep research، ورودی فایل بزرگ، ابزارهای کند یا jobهای پس‌زمینه app-managed.

timeout بلندتر را فقط برای workloadهایی بگذارید که واقعا می‌توانند منتظر بمانند. برای UX تعاملی، streaming، پیام پیشرفت، max_output_tokens کوتاه‌تر، reasoning.effort پایین‌تر یا job سمت برنامه که کاربر بتواند بعدا ادامه دهد را ترجیح دهید.


Python

JavaScript

import os
from openai import OpenAI

client = OpenAI(
    api_key=os.environ["AVALAI_API_KEY"],
    base_url="https://api.avalai.ir/v1",
    timeout=900.0,  # ۱۵ دقیقه برای درخواست‌های طولانی
)

response = client.with_options(timeout=900.0).responses.create(
    model="gpt-5.5",
    input="Analyze this long report and return a concise risk summary...",
    max_output_tokens=800,
)

print(response.output_text)
1
2
3
4
5
6
7
8
9
10
11
12
13
14
15
16
هنگام اضافه کردن retry دور فراخوانی‌های SDK، فقط operationهای idempotent را خودکار retry کنید. برای write، پرداخت، upload فایل، پردازش webhook یا اجرای ابزارهایی که side effect دارند، ابتدا idempotency key یا job ID ذخیره کنید و سپس از state برنامه retry کنید، نه با replay کورکورانه همان action.

نصب یک SDK رسمی
به زبان خود بروید:

JavaScript / TypeScript
Node.js، Deno، Bun — npm install openai
Python
SDK رسمی OpenAI — pip install openai
.NET / C#
پشتیبانی‌شده توسط مایکروسافت — dotnet add package OpenAI
Java
پیش‌نیاز Maven برای openai-java
Go
راهنمای رسمی Go برای API باز OpenAI
Ruby
SDK رسمی Ruby — gem "openai"
OpenAI CLI
گردش‌کار ترمینال با fallback خام HTTP برای AvalAI
کتابخانه‌های جامعه
SDK های جامعه برای PHP، Ruby، Rust و بیشتر
Javascript
برای استفاده از API AvalAI در محیط‌های JavaScript سمت سرور مانند Node.js، Deno، یا Bun، می‌توانید از SDK رسمی OpenAI برای TypeScript و JavaScript استفاده کنید. با نصب SDK با استفاده از npm یا مدیر بسته مورد نظر خود شروع کنید:


npm install openai
1
با نصب SDK OpenAI، یک فایل به نام example.mjs ایجاد کنید و کد نمونه را در آن کپی کنید:


import OpenAI from "openai";
const client = new OpenAI({
  apiKey: process.env.AVALAI_API_KEY,
  baseURL: "https://api.avalai.ir/v1", // نقطه پایانی API AvalAI
});

const response = await client.responses.create({
  model: "gpt-5.5",
  input: "Write a one-sentence bedtime story about a unicorn.",
});

console.log(response.output_text);
1
2
3
4
5
6
7
8
9
10
11
12
کد را با node example.mjs (یا دستور معادل برای Deno یا Bun) اجرا کنید. در چند لحظه، خروجی درخواست API خود را خواهید دید.

Python
برای استفاده از API AvalAI در Python، می‌توانید از SDK رسمی OpenAI برای Python استفاده کنید. با نصب SDK با استفاده از pip شروع کنید:


pip install openai
1
با نصب SDK OpenAI، یک فایل به نام example.py ایجاد کنید و کد نمونه را در آن کپی کنید:


import os
from openai import OpenAI

client = OpenAI(
    api_key=os.environ["AVALAI_API_KEY"],
    base_url="https://api.avalai.ir/v1",
)

response = client.responses.create(
    model="gpt-5.5", input="Write a one-sentence bedtime story about a unicorn."
)

print(response.output_text)
1
2
3
4
5
6
7
8
9
10
11
12
13
کد را با python example.py اجرا کنید. در چند لحظه، خروجی درخواست API خود را خواهید دید.

.NET
با همکاری با مایکروسافت، OpenAI یک کلاینت API رسمی پشتیبانی شده برای C# ارائه می‌دهد که می‌تواند با AvalAI استفاده شود. می‌توانید آن را با .NET CLI از NuGet نصب کنید.


dotnet add package OpenAI
1
یک درخواست API ساده به تکمیل چت به این شکل خواهد بود:


using OpenAI.Chat;

ChatClient client = new(
 model: "gpt-5.5",
 apiKey: Environment.GetEnvironmentVariable("AVALAI_API_KEY"),
 endpoint: new Uri("https://api.avalai.ir/v1") // نقطه پایانی API AvalAI
);

ChatCompletion completion = client.CompleteChat("Say 'this is a test.'");

Console.WriteLine($"[ASSISTANT]: {completion.Content[0].Text}");
1
2
3
4
5
6
7
8
9
10
11
نسخه Responses API:


using OpenAI.Responses;

OpenAIResponseClient client = new(
 model: "gpt-5.5",
 apiKey: Environment.GetEnvironmentVariable("AVALAI_API_KEY"),
 endpoint: new Uri("https://api.avalai.ir/v1") // نقطه پایانی API AvalAI
);

OpenAIResponse response = client.CreateResponse("Say 'this is a test.'");

Console.WriteLine($"[ASSISTANT]: {response.GetOutputText()}");
1
2
3
4
5
6
7
8
9
10
11
Java
OpenAI یک کمک‌کننده API برای زبان برنامه‌نویسی Java ارائه می‌دهد که می‌تواند با AvalAI استفاده شود. می‌توانید پیش‌نیاز Maven را با استفاده از پیکربندی زیر اضافه کنید:


<dependency>
 <groupId>com.openai</groupId>
 <artifactId>openai-java</artifactId>
 <version>0.31.0</version>
</dependency>
1
2
3
4
5
یک درخواست API ساده به تکمیل چت به این شکل خواهد بود:


import com.openai.client.OpenAIClient;
import com.openai.client.okhttp.OpenAIOkHttpClient;
import com.openai.models.ChatCompletion;
import com.openai.models.ChatCompletionCreateParams;
import com.openai.models.ChatModel;

// ایجاد یک کلاینت سفارشی با URL پایه AvalAI
OpenAIClient client = OpenAIOkHttpClient.builder()
 .baseUrl("https://api.avalai.ir/v1") // نقطه پایانی API AvalAI
 .apiKey(System.getenv("AVALAI_API_KEY"))
 .build();

ChatCompletionCreateParams params = ChatCompletionCreateParams.builder()
 .addUserMessage("Say this is a test")
 .model(ChatModel.O3_MINI)
 .build();
ChatCompletion chatCompletion = client.chat().completions().create(params);
1
2
3
4
5
6
7
8
9
10
11
12
13
14
15
16
17
نسخه Responses API:


import com.openai.client.OpenAIClient;
import com.openai.client.okhttp.OpenAIOkHttpClient;
import com.openai.models.responses.Response;
import com.openai.models.responses.ResponseCreateParams;

OpenAIClient client = OpenAIOkHttpClient.builder()
 .baseUrl("https://api.avalai.ir/v1") // نقطه پایانی API AvalAI
 .apiKey(System.getenv("AVALAI_API_KEY"))
 .build();

ResponseCreateParams params = ResponseCreateParams.builder()
 .input("Say this is a test")
 .model("gpt-5.5")
 .build();

Response response = client.responses().create(params);
System.out.println(response.outputText());
1
2
3
4
5
6
7
8
9
10
11
12
13
14
15
16
17
Go
OpenAI یک کمک‌کننده API برای زبان برنامه‌نویسی Go ارائه می‌دهد که می‌تواند با AvalAI استفاده شود. می‌توانید کتابخانه را با استفاده از کد زیر وارد کنید:


import (
	"github.com/openai/openai-go" // به عنوان openai وارد شده است
)
1
2
3
یک درخواست API ساده به تکمیل چت به این شکل خواهد بود:


package main

import (
	"context"
	"fmt"
	"os"

	"github.com/openai/openai-go"
	"github.com/openai/openai-go/option"
)

func main() {
	client := openai.NewClient(
		option.WithAPIKey(os.Getenv("AVALAI_API_KEY")),
		option.WithBaseURL("https://api.avalai.ir/v1"), // نقطه پایانی API AvalAI
	)
	chatCompletion, err := client.Chat.Completions.New(
		context.TODO(), openai.ChatCompletionNewParams{
			Messages: openai.F(
				[]openai.ChatCompletionMessageParamUnion{
					openai.UserMessage("Say this is a test"),
				},
			),
			Model: openai.F(openai.ChatModel("gpt-5.5")),
		},
	)

	if err != nil {
		panic(err.Error())
	}

	fmt.Println(chatCompletion.Choices[0].Message.Content)
}
1
2
3
4
5
6
7
8
9
10
11
12
13
14
15
16
17
18
19
20
21
22
23
24
25
26
27
28
29
30
31
32
33
نسخه Responses API:


package main

import (
	"context"
	"fmt"
	"os"

	"github.com/openai/openai-go/v3"
	"github.com/openai/openai-go/v3/option"
	"github.com/openai/openai-go/v3/responses"
)

func main() {
	client := openai.NewClient(
		option.WithAPIKey(os.Getenv("AVALAI_API_KEY")),
		option.WithBaseURL("https://api.avalai.ir/v1"), // نقطه پایانی API AvalAI
	)
	resp, err := client.Responses.New(context.TODO(), openai.ResponseNewParams{
		Model: "gpt-5.5",
		Input: responses.ResponseNewParamsInputUnion{
			OfString: openai.String("Say this is a test"),
		},
	})
	if err != nil {
		panic(err.Error())
	}

	fmt.Println(resp.OutputText())
}
1
2
3
4
5
6
7
8
9
10
11
12
13
14
15
16
17
18
19
20
21
22
23
24
25
26
27
28
29
Ruby
OpenAI یک SDK رسمی برای Ruby ارائه می‌دهد. در AvalAI فقط وقتی از آن استفاده کنید که نسخه نصب‌شده SDK از URL پایه سفارشی پشتیبانی کند؛ در غیر این صورت از fallback خام HTTP در بخش CLI استفاده کنید.

SDK را به برنامه خود اضافه کنید:


gem "openai"
1
نسخه Responses API:


require "openai"

openai = OpenAI::Client.new(
  api_key: ENV.fetch("AVALAI_API_KEY"),
  base_url: "https://api.avalai.ir/v1"
)

response = openai.responses.create(
  model: "gpt-5.5",
  input: "Write a one-sentence bedtime story about a unicorn."
)

puts(response.output_text)
1
2
3
4
5
6
7
8
9
10
11
12
13
OpenAI CLI
CLI OpenAI برای گردش‌کارهای تکرارشونده در ترمینال مفید است، اما ممکن است به‌صورت پیش‌فرض API میزبانی‌شده OpenAI را هدف بگیرد مگر اینکه نسخه نصب‌شده شما تنظیم URL پایه سفارشی داشته باشد. اگر CLI شما از OPENAI_BASE_URL پشتیبانی می‌کند، آن را صریح به AvalAI وصل کنید:


# اگر نسخه نصب‌شده openai CLI از OPENAI_BASE_URL پشتیبانی می‌کند، آن را به AvalAI وصل کنید.
OPENAI_API_KEY="$AVALAI_API_KEY" \
  OPENAI_BASE_URL="https://api.avalai.ir/v1" \
  openai responses create \
  --model gpt-5.5 \
  --input "Write a one-sentence bedtime story about a unicorn." \
  --format yaml \
  --transform 'output.#(type=="message").content.0.text'
1
2
3
4
5
6
7
8
برای scriptهای تکرارشونده که متن assistant، استخراج JSON یا رکوردهای یک‌خطی برای ابزارهای shell می‌خواهند از --format، --transform و request bodyهای YAML استفاده کنید. فایل‌های تولیدی مانند project.json، .env، file IDهای آپلودشده و response خام API را وارد Git نکنید، چون workflowهای CLI اغلب secret یا داده مشتری را روی دیسک می‌نویسند.

اگر نسخه CLI شما OPENAI_BASE_URL را رعایت نمی‌کند، یا route تازه AvalAI را قبل از اضافه شدن flagهای CLI تست می‌کنید، HTTP خام را ترجیح دهید چون endpoint و کلید API در آن صریح است:


curl "https://api.avalai.ir/v1/responses" \
  -H "Authorization: Bearer $AVALAI_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-5.5",
    "input": "Write a one-sentence bedtime story about a unicorn."
  }'
1
2
3
4
5
6
7
از این fallback برای تست endpointهای تازه، عیب‌یابی رفتار SDK یا ساختن script با jq استفاده کنید. اگر مستقیما از CLI تولیدشده openai استفاده می‌کنید، ابتدا یک بررسی بی‌خطر /v1/models یا یک درخواست کوتاه /v1/responses اجرا کنید تا مطمئن شوید AVALAI_API_KEY و URL پایه AvalAI واقعا اعمال شده‌اند.

SDK های رسمی Anthropic
AvalAI اکنون از SDK های رسمی Anthropic پشتیبانی می‌کند و به شما امکان استفاده از کتابخانه‌های کلاینت بومی Anthropic با نحو و ویژگی‌های آشنا را می‌دهد در حالی که از طریق سیستم API یکپارچه AvalAI به مدل‌ها دسترسی دارید. از ژوئن ۲۰۲۵، SDK Anthropic می‌تواند برای دسترسی به مدل‌ها از چندین ارائه دهنده، نه فقط مدل‌های Claude، استفاده شود.

پشتیبانی از چندین ارائه دهنده
SDK Anthropic اکنون می‌تواند برای دسترسی به مدل‌های چت از ارائه‌دهندگان زیر استفاده شود:

OpenAI
Anthropic
AWS Bedrock
Vertex AI
Gemini
هر مدل چت از این ارائه‌دهندگان که از نقطه پایانی تکمیل چت پشتیبانی می‌کند، می‌تواند از طریق SDK رسمی Anthropic و نقطه پایانی "v1/messages" در ساختار API Anthropic استفاده شود.

Python
SDK رسمی Anthropic Python را نصب کنید:


pip install anthropic
1
کلاینت را برای استفاده از نقطه پایانی AvalAI پیکربندی کنید:


import os
import anthropic

client = anthropic.Anthropic(
    api_key=os.environ["AVALAI_API_KEY"],
    base_url="https://api.avalai.ir",  # نقطه پایانی API AvalAI بدون /v1
)

# استفاده از مدل Claude
message = client.messages.create(
    model="claude-sonnet-4-6",
    max_tokens=1024,
    messages=[{"role": "user", "content": "سلام، کلود"}],
)
print(message.content)

# استفاده از مدل OpenAI از طریق SDK Anthropic
message = client.messages.create(
    model="gpt-5.5",
    max_tokens=1024,
    messages=[{"role": "user", "content": "سلام، gpt-5.5!"}],
)
print(message.content)

# استفاده از مدل Gemini از طریق SDK Anthropic
message = client.messages.create(
    model="gemini-2.5-pro",
    max_tokens=1024,
    messages=[{"role": "user", "content": "سلام، Gemini!"}],
)
print(message.content)
1
2
3
4
5
6
7
8
9
10
11
12
13
14
15
16
17
18
19
20
21
22
23
24
25
26
27
28
29
30
31
TypeScript/JavaScript
SDK رسمی Anthropic TypeScript را نصب کنید:


npm install @anthropic-ai/sdk
1
کلاینت را پیکربندی کنید:


import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.AVALAI_API_KEY,
  baseURL: "https://api.avalai.ir", // نقطه پایانی API AvalAI بدون /v1
});

// استفاده از مدل Claude
const claudeMsg = await anthropic.messages.create({
  model: "claude-sonnet-4-6",
  max_tokens: 1024,
  messages: [{ role: "user", content: "سلام، کلود" }],
});
console.log(claudeMsg);

// استفاده از مدل OpenAI از طریق SDK Anthropic
const openaiMsg = await anthropic.messages.create({
  model: "gpt-5.5",
  max_tokens: 1024,
  messages: [{ role: "user", content: "سلام، gpt-5.5!" }],
});
console.log(openaiMsg);

// استفاده از مدل Vertex AI از طریق SDK Anthropic
const vertexMsg = await anthropic.messages.create({
  model: "gemini-2.5-pro",
  max_tokens: 1024,
  messages: [{ role: "user", content: "سلام، Gemini!" }],
});
console.log(vertexMsg);
1
2
3
4
5
6
7
8
9
10
11
12
13
14
15
16
17
18
19
20
21
22
23
24
25
26
27
28
29
30
Go
SDK رسمی Anthropic Go را نصب کنید:


go get github.com/anthropics/anthropic-sdk-go
1
کلاینت را پیکربندی کنید:


package main

import (
	"context"
	"fmt"
	"github.com/anthropics/anthropic-sdk-go"
	"github.com/anthropics/anthropic-sdk-go/option"
	"os"
)

func main() {
	client := anthropic.NewClient(
		option.WithAPIKey(os.Getenv("AVALAI_API_KEY")),
		option.WithBaseURL("https://api.avalai.ir"), // نقطه پایانی AvalAI بدون /v1
	)

	message, err := client.Messages.New(context.TODO(), anthropic.MessageNewParams{
		Model:     anthropic.F(anthropic.ModelClaudeSonnet4_0),
		MaxTokens: anthropic.F(int64(1024)),
		Messages: anthropic.F([]anthropic.MessageParam{
			anthropic.NewUserMessage(anthropic.NewTextBlock("سلام، کلود")),
		}),
	})
	if err != nil {
		panic(err.Error())
	}
	fmt.Printf("%+v\n", message.Content)
}
1
2
3
4
5
6
7
8
9
10
11
12
13
14
15
16
17
18
19
20
21
22
23
24
25
26
27
28
Ruby
gem رسمی Anthropic Ruby را نصب کنید:


gem install anthropic
1
کلاینت را پیکربندی کنید:


require "bundler/setup"
require "anthropic"

anthropic = Anthropic::Client.new(
    api_key: ENV.fetch("AVALAI_API_KEY"),
    base_url: "https://api.avalai.ir" # نقطه پایانی AvalAI بدون /v1
)

message = anthropic.messages.create(
    max_tokens: 1024,
    messages: [{
            role: "user",
            content: "سلام، کلود"
        }
    ],
    model: "claude-sonnet-4-6"
)

puts(message.content)
1
2
3
4
5
6
7
8
9
10
11
12
13
14
15
16
17
18
19
ویژگی‌های بتا
تمام SDK های Anthropic از فضای نام بتا برای ویژگی‌های آزمایشی پشتیبانی می‌کنند:


import os
import anthropic

client = anthropic.Anthropic(
    api_key=os.environ["AVALAI_API_KEY"],
    base_url="https://api.avalai.ir",  # نقطه پایانی AvalAI بدون /v1
)

message = client.beta.messages.create(
    model="claude-sonnet-4-6",
    max_tokens=1024,
    messages=[{"role": "user", "content": "سلام، کلود"}],
    betas=["beta-feature-name"],
)
print(message.content)
1
2
3
4
5
6
7
8
9
10
11
12
13
14
15
مدل‌های موجود
هنگام استفاده از SDK های Anthropic با AvalAI، می‌توانید به مدل‌هایی از چندین ارائه دهنده دسترسی داشته باشید:

مدل‌های Claude
دسترسی در سطح کاربری ۱ و بالاتر

Claude Opus 4 - anthropic.claude-opus-4-20250514-v1:0
Claude Sonnet 4 - anthropic.claude-sonnet-4-20250514-v1:0
Claude 3.7 Sonnet - claude-sonnet-4-6
Claude 3.5 Sonnet - claude-sonnet-4-6
Claude 3.5 Haiku - claude-haiku-4-5
مدل‌های سایر ارائه‌دهندگان
همچنین می‌توانید به مدل‌هایی از این ارائه‌دهندگان دسترسی داشته باشید:

OpenAI (مانند gpt-5.5، gpt-5.3-codex، gpt-5-mini)
AWS Bedrock مدل‌ها
Vertex AI مدل‌ها
Gemini (مانند gemini-3.5-flash، gemini-3.1-pro-preview)
برای فهرست کامل، مستندات مدل‌های ما را ببینید.

SDK Google GenAI
AvalAI اکنون از SDK رسمی GenAI گوگل برای دسترسی بومی به مدل‌های Gemini با استفاده از طرحواره API بومی گوگل و نقاط پایانی آن پشتیبانی می‌کند.

JavaScript/TypeScript
SDK Google GenAI را نصب کنید:


npm install @google/genai
1
کلاینت را برای استفاده از نقطه پایانی AvalAI پیکربندی کنید:


import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
	apiKey: process.env.AVALAI_API_KEY,
	httpOptions: {"apiVersion": "v1beta", "baseUrl": "https://api.avalai.ir"}
});

async function main() {
	const response = await ai.models.generateContent({
		model: "gemini-2.5-flash",
		contents: "خلاصه‌ای از اصول کلیدی یادگیری ماشین بنویسید.",
	});
	console.log(response.text);
}

await main();
1
2
3
4
5
6
7
8
9
10
11
12
13
14
15
16
Python
SDK Google GenAI را نصب کنید:


pip install google-generativeai
1
کلاینت را برای استفاده از نقطه پایانی AvalAI پیکربندی کنید:


import os
from google import genai
from google.genai.types import ContentDict, PartDict

# راه‌اندازی کلاینت با نقطه پایانی AvalAI
client = genai.Client(
    api_key=os.environ["AVALAI_API_KEY"],
    http_options={"base_url": "https://api.avalai.ir"},  # توجه: بدون پسوند /v1
)

# تولید محتوا با استفاده از API بومی
contents = ContentDict(
    parts=[PartDict(text="داستان کوتاهی درباره هوش مصنوعی بنویس")], role="user"
)

response = await client.agenerate_content(
    contents=contents, model="gemini-2.5-flash", max_tokens=500
)

print(response)
1
2
3
4
5
6
7
8
9
10
11
12
13
14
15
16
17
18
19
20
پشتیبانی از پاسخ جریانی

# تولید جریانی
response = await client.agenerate_content_stream(
    contents=contents, model="gemini-2.5-flash", max_tokens=500
)

async for chunk in response:
    print(chunk)
1
2
3
4
5
6
7
ویژگی‌های کلیدی
طرحواره API بومی: دسترسی مستقیم با استفاده از نقاط پایانی generateContent و streamGenerateContent گوگل
احراز هویت انعطاف‌پذیر: پشتیبانی از هر دو هدر Authorization: Bearer و x-goog-api-key
پشتیبانی کامل از جریان: قابلیت‌های جریان بومی
پشتیبانی چندوجهی: پشتیبانی بومی از ورودی‌های متن، تصویر، صدا و ویدیو
محدودیت‌های مهم
فقط مدل‌های Gemini: این SDK منحصرا از مدل‌های Gemini پشتیبانی می‌کند
URL پایه: هنگام پیکربندی SDK از https://api.avalai.ir (بدون /v1) استفاده کنید
نقاط پایانی v1beta: از فرمت نقطه پایانی /v1beta/models/{model}:generateContent استفاده می‌کند
برای مستندات کامل، مرجع API v1beta را ببینید.

کتابخانه‌های Azure OpenAI
تیم Azure مایکروسافت کتابخانه‌هایی را نگهداری می‌کند که هم با API OpenAI و هم با سرویس‌های Azure OpenAI سازگار هستند. این کتابخانه‌ها همچنین می‌توانند با مشخص کردن نقطه پایانی سفارشی با AvalAI پیکربندی شوند. مستندات کتابخانه زیر را بخوانید تا یاد بگیرید چگونه می‌توانید از آنها با API AvalAI استفاده کنید.

کتابخانه کلاینت Azure OpenAI برای .NET
کتابخانه کلاینت Azure OpenAI برای JavaScript
کتابخانه کلاینت Azure OpenAI برای Java
کتابخانه کلاینت Azure OpenAI برای Go
کتابخانه‌های جامعه
کتابخانه‌های زیر توسط جامعه گسترده توسعه‌دهندگان برای استفاده با API OpenAI ساخته و نگهداری می‌شوند. بسیاری از اینها را می‌توان با مشخص کردن URL پایه به عنوان https://api.avalai.ir/v1 برای کار با AvalAI پیکربندی کرد. همچنین می‌توانید مخزن مشخصات OpenAPI OpenAI را در GitHub مشاهده کنید تا به‌روزرسانی‌های به موقع را هنگام تغییر API دریافت کنید.

لطفا توجه داشته باشید که AvalAI صحت یا امنیت این پروژه‌ها را تایید نمی‌کند. از آنها با مسئولیت خودتان استفاده کنید!

C# / .NET
Betalgo.OpenAI توسط Betalgo
OpenAI-API-dotnet توسط OkGoDoIt
OpenAI-DotNet توسط RageAgainstThePixel
C++
liboai توسط D7EAD
Clojure
openai-clojure توسط wkok
Crystal
openai-crystal توسط sferik
Dart/Flutter
openai توسط anasfik
Delphi
DelphiOpenAI توسط HemulGM
Elixir
openai.ex توسط mgallo
Go
go-gpt3 توسط sashabaranov
Java
simple-openai توسط Sashir Estela
Spring AI
Julia
OpenAI.jl توسط rory-linehan
Kotlin
openai-kotlin توسط Mouaad Aallam
Node.js
openai-api توسط Njerschow
openai-api-node توسط erlapso
gpt-x توسط ceifa
gpt3 توسط poteat
gpts توسط thencc
@dalenguyen/openai توسط dalenguyen
tectalic/openai توسط tectalic
PHP
orhanerday/open-ai توسط orhanerday
tectalic/openai توسط tectalic
openai-php client توسط openai-php
Python
chronology توسط OthersideAI
R
rgpt3 توسط ben-aaron188
Ruby
openai توسط nileshtrivedi
ruby-openai توسط alexrudall
Rust
async-openai توسط 64bit
fieri توسط lbkolev
Scala
openai-scala-client توسط cequence-io
Swift
AIProxySwift توسط Lou Zell
OpenAIKit توسط dylanshine
OpenAI توسط MacPaw
Unity
OpenAi-Api-Unity توسط hexthedev
com.openai.unity توسط RageAgainstThePixel
Unreal Engine
OpenAI-Api-Unreal توسط KellanM
سایر مخازن مفید
tiktoken - شمارش توکن‌ها
simple-evals - کتابخانه ارزیابی ساده
mle-bench - کتابخانه برای ارزیابی عامل‌های مهندس یادگیری ماشین
gym - کتابخانه یادگیری تقویتی
swarm - مخزن آموزشی ارکستراسیون
منابع مرتبط
مرجع API
احراز هویت
شروع سریع
قبلی
شروع سریع
