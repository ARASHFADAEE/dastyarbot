Admin Dashboard نیز باید حرفه‌ای باشد و شبیه یک CRM واقعی طراحی شود، نه یک پنل ساده CRUD.

---

# 35. Analytics

Dashboard آماری:

* Conversations
* Customers
* Leads
* Hot Leads
* Callback Requests
* AI Resolution Rate
* Human Handoff Rate
* Conversion Rate
* Average Response Time
* Average Conversation Length
* AI Cost

Charts نیز اضافه کن.

---

# 36. Privacy

اطلاعات مشتریان را با حداقل دسترسی ذخیره کن.

قابلیت:

* Delete Customer
* Delete Conversation
* Export Customer Data

را در نظر بگیر.

---

# 37. معماری نهایی

معماری را به شکل زیر طراحی کن:
┌──────────────┐
                │    Client    │
                └──────┬───────┘
                       │
         ┌─────────────┴─────────────┐
         │                            │
    Telegram                     Web Chat
         │                            │
         └─────────────┬─────────────┘
                       │
                Channel Adapter
                       │
                Conversation Engine
                       │
              ┌────────┴────────┐
              │                 │
         Intent Engine      Customer CRM
              │
      ┌───────┴────────┐
      │                │
  Knowledge Base      Tools
      │                │
      └───────┬────────┘
              │
          AI Provider
              │
      ┌───────┴────────┐
      │                │
   Response         Decision
      │                │
      └───────┬────────┘
              │
       Human Handoff
              │
         Notification
              │
           Admin
---

# 38. Development Strategy

پروژه را یک‌باره و بدون تست ننویس.

به این ترتیب جلو برو:

Phase 1:
Architecture + Database

Phase 2:
Backend Core

Phase 3:
Conversation Engine

Phase 4:
AI Provider

Phase 5:
Tools / Function Calling

Phase 6:
Knowledge Base / RAG

Phase 7:
Customer CRM

Phase 8:
Human Handoff

Phase 9:
Notification

Phase 10:
Voice

Phase 11:
Telegram

Phase 12:
Web Chat Widget

Phase 13:
Admin Dashboard

Phase 14:
Analytics

Phase 15:
Security

Phase 16:
Testing

Phase 17:
Production Deployment

---

# 39. Testing

برای بخش‌های مهم Unit Test و Integration Test ایجاد کن.

سناریوهای تست:

1. مشتری قیمت می‌پرسد.
2. مشتری قیمت محصول ناموجود در Database را می‌پرسد.
3. مشتری درخواست تماس می‌دهد.
4. مشتری Voice ارسال می‌کند.
5. مشتری اطلاعات ناقص می‌دهد.
6. AI اطلاعات محصول را پیدا نمی‌کند.
7. AI API قطع می‌شود.
8. مشتری درخواست صحبت با انسان می‌کند.
9. مشتری چند محصول را مقایسه می‌کند.
10. مشتری قصد خرید دارد.
11. مشتری درخواست تخفیف می‌کند.
12. مشتری سوال خارج از Knowledge Base می‌پرسد.

---

# 40. مهم‌ترین اصل پروژه

این پروژه نباید یک Chatbot ساده باشد.

آن را به‌عنوان:

AI SALES + SUPPORT + CRM ASSISTANT

طراحی کن.

بات باید بتواند:

Customer
→ Conversation
→ Understand
→ Consult
→ Search Product
→ Get Real Price
→ Answer
→ Detect Purchase Intent
→ Create Lead
→ Score Lead
→ Request Contact
→ Notify Admin
→ Human Handoff
→ Track Result

را به‌صورت یکپارچه انجام دهد.

---

# 41. خروجی مورد انتظار

در پایان باید موارد زیر آماده باشند:

* Production-ready Backend
* Production-ready Frontend
* Admin Dashboard
* Database
* AI Integration
* Tool Calling
* Knowledge Base
* RAG
* Voice STT
* Voice TTS
* Telegram Integration
* Web Chat Widget
* CRM
* Lead Management
* Callback Management
* Notification System
* Analytics
* Logging
* Security
* Tests
* API Documentation
* Environment Configuration
* Deployment Documentation

---

# دستور نهایی

قبل از شروع، Repository را کامل بررسی کن.

اگر پروژه خالی است، Architecture مناسب را از صفر ایجاد کن.

اگر پروژه موجود است، ابتدا Stack و ساختار فعلی را شناسایی کن.

از ایجاد کدهای غیرضروری و پیچیدگی بدون دلیل خودداری کن.

کد باید:

* Clean
* Modular
* Maintainable
* Scalable
* Secure
* Typed
* Testable

باشد.

هر Feature را پس از پیاده‌سازی تست کن.

هرجا تصمیم معماری مهمی وجود دارد، بهترین گزینه Production-ready را انتخاب کن.

هیچ API Key یا Secret را داخل کد Hardcode نکن.

در پایان هر Phase، وضعیت پیاده‌سازی، فایل‌های ایجاد/تغییر داده‌شده و موارد باقی‌مانده...





fvhd