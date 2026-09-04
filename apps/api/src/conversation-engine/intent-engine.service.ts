import { Injectable } from '@nestjs/common';

export type IntentSignals = {
  purchaseIntent: boolean;
  askedPrice: boolean;
  askedDiscount: boolean;
  comparedProducts: boolean;
  requestedCallback: boolean;
  wantsHuman: boolean;
  outOfScopeHint: boolean;
};

@Injectable()
export class IntentEngineService {
  detect(text: string): IntentSignals {
    const t = text.toLowerCase();
    return {
      purchaseIntent: /میخوام بخر|می‌خوام بخر|خرید|سفارش|ثبت سفارش|پرداخت/.test(t),
      askedPrice: /قیمت|چند|هزینه|مبلغ/.test(t),
      askedDiscount: /تخفیف|آف|حراج|کد تخفیف/.test(t),
      comparedProducts: /مقایسه|تفاوت|کدام بهتر|کدوم بهتر/.test(t),
      requestedCallback: /تماس بگیرید|زنگ بزن|تماس بگیرید|باهام تماس|callback/.test(t),
      wantsHuman: /انسان|اپراتور|پشتیبان|کارشناس|آدم واقعی|operator/.test(t),
      outOfScopeHint: /آب و هوا|فوتبال|سیاست|جوک/.test(t),
    };
  }
}
