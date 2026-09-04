import { IntentEngineService } from './intent-engine.service';
import { LeadsService } from '../leads/leads.service';

describe('IntentEngineService', () => {
  const intent = new IntentEngineService();

  it('detects price questions', () => {
    const s = intent.detect('قیمت لپ‌تاپ چقدر است؟');
    expect(s.askedPrice).toBe(true);
  });

  it('detects purchase intent', () => {
    const s = intent.detect('می‌خوام بخرم این گوشی را');
    expect(s.purchaseIntent).toBe(true);
  });

  it('detects discount requests', () => {
    const s = intent.detect('تخفیف دارید؟');
    expect(s.askedDiscount).toBe(true);
  });

  it('detects human handoff request', () => {
    const s = intent.detect('می‌خواهم با کارشناس انسان صحبت کنم');
    expect(s.wantsHuman).toBe(true);
  });

  it('detects callback request', () => {
    const s = intent.detect('لطفا باهام تماس بگیرید');
    expect(s.requestedCallback).toBe(true);
  });

  it('detects product comparison', () => {
    const s = intent.detect('مقایسه کنید این دو محصول را');
    expect(s.comparedProducts).toBe(true);
  });
});

describe('LeadsService.scoreFromSignals', () => {
  const leads = new LeadsService({} as never);

  it('scores hot purchase intent highly', () => {
    const score = leads.scoreFromSignals({
      purchaseIntent: true,
      askedPrice: true,
      askedDiscount: true,
      sharedPhone: true,
      requestedCallback: true,
    });
    expect(score).toBeGreaterThanOrEqual(80);
  });

  it('keeps low score for weak signals', () => {
    const score = leads.scoreFromSignals({});
    expect(score).toBe(20);
  });
});
