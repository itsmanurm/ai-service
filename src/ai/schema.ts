import { z } from 'zod';

export const ItemSchema = z.object({
  description: z.string().min(1),
  merchant: z.string().optional(),
  amount: z.number(),
  currency: z.enum(['ARS','USD']),
  when: z.string().optional(),
  accountLast4: z.string().optional(),
  bankMessageId: z.string().optional()
});

export type ItemInput = z.infer<typeof ItemSchema>;
