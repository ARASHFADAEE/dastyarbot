import { ConversationEngineService } from './conversation-engine.service';
import { IntentEngineService } from './intent-engine.service';

describe('ConversationEngineService scenarios', () => {
  function buildEngine(overrides: {
    respond?: jest.Mock;
    execute?: jest.Mock;
    productPrice?: unknown;
  } = {}) {
    const customers = {
      findOrCreateByChannel: jest.fn().mockResolvedValue({ id: 'cust1', phone: null }),
    };
    const conversations = {
      findOrCreateActive: jest.fn().mockResolvedValue({
        id: 'conv1',
        aiEnabled: true,
        status: 'active',
        channel: 'web',
      }),
      addMessage: jest.fn().mockResolvedValue({}),
      get: jest.fn().mockResolvedValue({
        messages: [{ role: 'user', content: 'قیمت لپ‌تاپ' }],
      }),
      setStatus: jest.fn(),
      hasAssignedHandoff: jest.fn().mockResolvedValue(false),
      isManualHandoff: jest.fn().mockResolvedValue(false),
    };
    const avalai = {
      isConfigured: () => true,
      transcribe: jest.fn(),
      respond: overrides.respond || jest.fn().mockResolvedValue({
        text: 'قیمت لپ‌تاپ ۴۸٬۵۰۰٬۰۰۰ ریال است.',
        toolCalls: [],
        tokensIn: 10,
        tokensOut: 20,
      }),
      respondWithToolOutputs: jest.fn().mockResolvedValue({
        text: 'انجام شد',
        toolCalls: [],
      }),
    };
    const tools = {
      execute: overrides.execute || jest.fn().mockResolvedValue({ ok: true }),
    };
    const engine = new ConversationEngineService(
      customers as never,
      conversations as never,
      avalai as never,
      tools as never,
      new IntentEngineService(),
    );
    return { engine, customers, conversations, avalai, tools };
  }

  it('answers price questions through AI path', async () => {
    const { engine, conversations } = buildEngine();
    const result = await engine.handleInbound({
      channel: 'web',
      externalUserId: 'sess_test_1',
      text: 'قیمت لپ‌تاپ چقدر است؟',
    });
    expect(result.reply).toContain('لپ‌تاپ');
    expect(conversations.addMessage).toHaveBeenCalled();
  });

  it('executes handoff tool when AI requests human', async () => {
    const execute = jest.fn().mockResolvedValue({ ok: true, ticket: { id: 't1' } });
    const { engine } = buildEngine({
      respond: jest.fn().mockResolvedValue({
        text: '',
        toolCalls: [
          { callId: 'c1', name: 'request_human_handoff', arguments: { reason: 'user asked' } },
        ],
      }),
      execute,
    });
    const result = await engine.handleInbound({
      channel: 'web',
      externalUserId: 'sess_test_2',
      text: 'می‌خواهم با کارشناس صحبت کنم',
    });
    expect(execute).toHaveBeenCalledWith(
      'request_human_handoff',
      expect.any(Object),
      expect.any(Object),
    );
    expect(result.handoff).toBe(true);
  });

  it('handles AI API failure via fallback handoff tool call', async () => {
    const execute = jest.fn().mockResolvedValue({ ok: true });
    const { engine } = buildEngine({
      respond: jest.fn().mockResolvedValue({
        text: 'AI down',
        toolCalls: [
          { callId: 'local-fallback', name: 'request_human_handoff', arguments: { reason: 'AI API unavailable' } },
        ],
      }),
      execute,
    });
    const result = await engine.handleInbound({
      channel: 'web',
      externalUserId: 'sess_test_3',
      text: 'سلام',
    });
    expect(result.handoff).toBe(true);
  });
});
