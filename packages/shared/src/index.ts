import { z } from 'zod';

export const ChannelSchema = z.enum(['telegram', 'web', 'admin']);
export type Channel = z.infer<typeof ChannelSchema>;

export const MessageRoleSchema = z.enum(['user', 'assistant', 'system', 'tool', 'agent']);
export type MessageRole = z.infer<typeof MessageRoleSchema>;

export const LeadStatusSchema = z.enum([
  'new',
  'contacted',
  'qualified',
  'hot',
  'won',
  'lost',
]);
export type LeadStatus = z.infer<typeof LeadStatusSchema>;

export const HandoffStatusSchema = z.enum([
  'open',
  'assigned',
  'resolved',
  'cancelled',
]);
export type HandoffStatus = z.infer<typeof HandoffStatusSchema>;

export const UserRoleSchema = z.enum(['admin', 'agent']);
export type UserRole = z.infer<typeof UserRoleSchema>;

export const WebChatMessageSchema = z.object({
  sessionId: z.string().min(8).max(128),
  content: z.string().min(1).max(8000).optional(),
  audioBase64: z.string().optional(),
  audioMimeType: z.string().optional(),
  customerName: z.string().max(120).optional(),
  customerPhone: z.string().max(32).optional(),
});
export type WebChatMessageInput = z.infer<typeof WebChatMessageSchema>;

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const TOOL_NAMES = [
  'search_services',
  'get_service_price',
  'compare_services',
  'create_lead',
  'score_lead',
  'request_callback',
  'request_human_handoff',
  'search_knowledge',
] as const;

export type ToolName = (typeof TOOL_NAMES)[number];

export interface AnalyticsSummary {
  conversations: number;
  customers: number;
  leads: number;
  hotLeads: number;
  callbackRequests: number;
  aiResolutionRate: number;
  humanHandoffRate: number;
  conversionRate: number;
  averageResponseTimeMs: number;
  averageConversationLength: number;
  aiCostUsd: number;
}
