import { z } from "zod";

export const postInputSchema = z.object({
  title: z.string().min(6),
  excerpt: z.string().min(12),
  content: z.string().min(20),
  coverImage: z
    .string()
    .url()
    .optional(),
  tags: z.array(z.string()).default([]),
  status: z.enum(["draft", "published", "archived"]).default("draft"),
  publishedAt: z.string().datetime().optional(),
});

export type PostInput = z.infer<typeof postInputSchema>;
