/** AvalAI Responses API tools for freelance service assistant. */
export const TOOL_DEFINITIONS = [
  {
    type: 'function',
    name: 'search_services',
    description:
      'Search freelance services catalog (WordPress, Laravel, automation, etc.) by name or category.',
    parameters: {
      type: 'object',
      additionalProperties: false,
      properties: {
        query: { type: 'string', description: 'Search query in Persian or English' },
        limit: { type: 'number', description: 'Max results' },
      },
      required: ['query', 'limit'],
    },
  },
  {
    type: 'function',
    name: 'get_service_price',
    description: 'Get the real starting price of a service by id or SKU from the database.',
    parameters: {
      type: 'object',
      additionalProperties: false,
      properties: {
        serviceIdOrSku: { type: 'string' },
      },
      required: ['serviceIdOrSku'],
    },
  },
  {
    type: 'function',
    name: 'compare_services',
    description: 'Compare two or more services by id/SKU.',
    parameters: {
      type: 'object',
      additionalProperties: false,
      properties: {
        serviceIdsOrSkus: {
          type: 'array',
          items: { type: 'string' },
        },
      },
      required: ['serviceIdsOrSkus'],
    },
  },
  {
    type: 'function',
    name: 'create_lead',
    description: 'Create or update a sales lead for the current client.',
    parameters: {
      type: 'object',
      additionalProperties: false,
      properties: {
        intent: { type: 'string' },
        summary: { type: 'string' },
        productInterest: {
          type: 'string',
          description: 'Service interest / package name',
        },
        score: { type: 'number' },
      },
      required: ['intent', 'summary', 'productInterest', 'score'],
    },
  },
  {
    type: 'function',
    name: 'score_lead',
    description: 'Score purchase/project intent signals for the current client.',
    parameters: {
      type: 'object',
      additionalProperties: false,
      properties: {
        purchaseIntent: { type: 'boolean' },
        askedPrice: { type: 'boolean' },
        askedDiscount: { type: 'boolean' },
        comparedProducts: { type: 'boolean' },
        requestedCallback: { type: 'boolean' },
        sharedPhone: { type: 'boolean' },
      },
      required: [
        'purchaseIntent',
        'askedPrice',
        'askedDiscount',
        'comparedProducts',
        'requestedCallback',
        'sharedPhone',
      ],
    },
  },
  {
    type: 'function',
    name: 'request_callback',
    description: 'Create a callback request so the freelancer can call the client.',
    parameters: {
      type: 'object',
      additionalProperties: false,
      properties: {
        phone: { type: 'string' },
        preferredTime: { type: 'string' },
        notes: { type: 'string' },
      },
      required: ['phone', 'preferredTime', 'notes'],
    },
  },
  {
    type: 'function',
    name: 'request_human_handoff',
    description: 'Transfer the conversation to the freelancer (human).',
    parameters: {
      type: 'object',
      additionalProperties: false,
      properties: {
        reason: { type: 'string' },
      },
      required: ['reason'],
    },
  },
  {
    type: 'function',
    name: 'send_chat_summary',
    description:
      'Send a short chat brief to Arash (admin) about what the customer wants and project readiness. Call whenever intent/price/project details become clear.',
    parameters: {
      type: 'object',
      additionalProperties: false,
      properties: {
        need: {
          type: 'string',
          description: 'What the customer wants in one short Persian sentence',
        },
        serviceSku: {
          type: 'string',
          description: 'Likely SKU e.g. WP-WOO',
        },
        readiness: {
          type: 'string',
          description: 'ready | interested | just_asking | not_ready',
        },
        readinessLabel: {
          type: 'string',
          description: 'Persian label e.g. آماده شروع / در حال پرس‌وجو',
        },
        summary: {
          type: 'string',
          description: '2-4 line Persian brief for Arash',
        },
        budgetHint: {
          type: 'string',
          description: 'Budget or price discussed if any',
        },
      },
      required: ['need', 'readiness', 'readinessLabel', 'summary'],
    },
  },
  {
    type: 'function',
    name: 'search_knowledge',
    description: 'Search freelancer FAQ / process / policies knowledge base (RAG).',
    parameters: {
      type: 'object',
      additionalProperties: false,
      properties: {
        query: { type: 'string' },
      },
      required: ['query'],
    },
  },
] as const;
