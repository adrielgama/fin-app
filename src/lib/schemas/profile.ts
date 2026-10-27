import { z } from "zod";

export const userProfileSchema = z.object({
  displayName: z.string().max(80),
  email: z.email(),
  photoURL: z.url().nullable().default(null),
  notifications: z
    .object({
      push: z.boolean().default(true),
      email: z.boolean().default(false),
    })
    .default({ push: true, email: false }),
  fcmTokens: z.array(z.string()).max(10).default([]),
});

export type UserProfile = z.infer<typeof userProfileSchema>;
