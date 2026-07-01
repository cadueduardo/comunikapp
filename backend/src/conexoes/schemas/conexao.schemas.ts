import { z } from 'zod';

export const googleOAuthCallbackQuerySchema = z.object({
  code: z.string().min(1).max(2048),
  state: z.string().min(1).max(4096),
  error: z.string().max(256).optional(),
});

export const googleOAuthStatePayloadSchema = z.object({
  loja_id: z.string().min(1),
  user_id: z.string().min(1),
  exp: z.number().int().positive(),
});

export const registrarLinkArteSchema = z.object({
  url: z.string().url().max(2048),
  descricao: z.string().max(500).optional(),
});

export type GoogleOAuthCallbackQuery = z.infer<
  typeof googleOAuthCallbackQuerySchema
>;
export type GoogleOAuthStatePayload = z.infer<
  typeof googleOAuthStatePayloadSchema
>;
