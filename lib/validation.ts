import { z } from "zod";

export const voteChoiceSchema = z.enum(["YES", "NO", "MAYBE"]);

export const rankScoreSchema = z.number().int().min(1).max(10);

export const genderSchema = z.enum(["BOY", "GIRL"]);
