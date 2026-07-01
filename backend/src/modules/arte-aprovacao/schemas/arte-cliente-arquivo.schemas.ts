import { z } from 'zod';

export const registrarLinkArteSchema = z.object({
  url: z
    .string()
    .trim()
    .url({ message: 'URL inválida' })
    .max(2048)
    .refine((u) => /^https?:\/\//i.test(u), {
      message: 'A URL deve começar com http:// ou https://',
    }),
  descricao: z.string().trim().max(500).optional(),
});

export const solicitarArteClienteSchema = z.object({
  mensagem: z.string().trim().max(2000).optional(),
});

export type RegistrarLinkArteInput = z.infer<typeof registrarLinkArteSchema>;
export type SolicitarArteClienteInput = z.infer<
  typeof solicitarArteClienteSchema
>;
