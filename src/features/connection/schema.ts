import { z } from "zod";

export const connectionSchema = z.object({
  uri: z
    .string()
    .min(1, "URI is required")
    .refine(
      (uri) => uri.startsWith("redis://") || uri.startsWith("rediss://"),
      "URI must start with redis:// or rediss://"
    ),
  name: z.string().min(1, "Name is required"),
  color: z.string().min(1, "Color is required"),
});

export type ConnectionFormData = z.infer<typeof connectionSchema>;