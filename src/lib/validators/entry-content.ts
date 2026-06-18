import { z } from "zod";

const forbiddenHtmlPattern =
  /<\s*(script|iframe|object|embed|form|input|button|style|link|meta)[\s>]/i;

const safeMathText = z
  .string()
  .trim()
  .min(3, "El contenido es demasiado corto.")
  .max(20000, "El contenido es demasiado largo.")
  .refine(
    (value) => !forbiddenHtmlPattern.test(value),
    "El contenido contiene HTML no permitido."
  );

export const addReadingQuestionSchema = z.object({
  subjectSlug: z.string().trim().min(1),
  topicSlug: z.string().trim().min(1),
  entryId: z.string().uuid(),
  entrySlug: z.string().trim().min(1),

  questionText: z
    .string()
    .trim()
    .min(5, "La pregunta es demasiado corta.")
    .max(1000, "La pregunta es demasiado larga.")
    .refine(
      (value) => !forbiddenHtmlPattern.test(value),
      "La pregunta contiene HTML no permitido."
    ),

  optionA: z.string().trim().min(1).max(500),
  optionB: z.string().trim().min(1).max(500),
  optionC: z.string().trim().min(1).max(500),
  optionD: z.string().trim().min(1).max(500),

  correctOption: z.enum(["A", "B", "C", "D"]),

  explanation: z
    .string()
    .trim()
    .max(1500, "La explicación es demasiado larga.")
    .optional(),
});

export const addExampleSchema = z.object({
  subjectSlug: z.string().trim().min(1),
  topicSlug: z.string().trim().min(1),
  entryId: z.string().uuid(),
  entrySlug: z.string().trim().min(1),

  title: z
    .string()
    .trim()
    .min(3, "El título es demasiado corto.")
    .max(120, "El título es demasiado largo."),

  content: safeMathText,

  imageAlt: z
    .string()
    .trim()
    .max(200, "La descripción de la imagen es demasiado larga.")
    .optional(),
});

export const addExerciseSchema = z.object({
  subjectSlug: z.string().trim().min(1),
  topicSlug: z.string().trim().min(1),
  entryId: z.string().uuid(),
  entrySlug: z.string().trim().min(1),

  statement: safeMathText,

  hint1: z.string().trim().max(1000).optional(),
  hint2: z.string().trim().max(1000).optional(),
  hint3: z.string().trim().max(1000).optional(),
  solutionContent: z.string().trim().max(5000).optional(),
});