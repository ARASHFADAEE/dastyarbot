import { ToolRegistryService } from './tool-registry.service';

describe('ToolRegistryService service not found', () => {
  it('returns not found when price lookup misses', async () => {
    const products = {
      getPrice: jest.fn().mockResolvedValue(null),
      search: jest.fn(),
    };
    const registry = new ToolRegistryService(
      products as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      { customer: { findUnique: jest.fn() } } as never,
      { get: jest.fn() } as never,
    );
    const result = (await registry.execute(
      'get_service_price',
      { serviceIdOrSku: 'MISSING' },
      { customerId: 'c1', conversationId: 'conv1' },
    )) as { found: boolean; message: string };
    expect(result.found).toBe(false);
    expect(result.message).toContain('یافت نشد');
  });
});
