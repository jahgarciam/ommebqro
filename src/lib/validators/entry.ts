import { z } from "zod";
import { isValidYouTubeChannelUrl, isValidYouTubeUrl } from "@/lib/youtube";

const forbiddenHtmlPattern =
  /<\s*(script|iframe|object|embed|form|input|button|style|link|meta)[\s>]/i;

export const createEntrySchema = z.object({
  subjectSlug: z
    .string()
    .trim()
    .min(1, "Falta la materia.")
    .max(80, "Materia inválida."),

  topicId: z.string().uuid("Tema inválido."),

  topicSlug: z
    .string()
    .trim()
    .min(1, "Falta el tema.")
    .max(120, "Tema inválido."),

  levelId: z.string().uuid("Nivel inválido."),

  title: z
    .string()
    .trim()
    .min(3, "El título debe tener al menos 3 caracteres.")
    .max(140, "El título es demasiado largo.")
    .regex(
      /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9\s:;,.()¿?¡!+\-/*=]+$/,
      "El título contiene caracteres no permitidos."
    ),

  summary: z
    .string()
    .trim()
    .max(500, "El resumen es demasiado largo.")
    .optional(),

  youtubeUrl: z
    .string()
    .trim()
    .url("Pega una URL válida de YouTube.")
    .refine(isValidYouTubeUrl, "La URL debe ser un video válido de YouTube."),

  trainerName: z
    .string()
    .trim()
    .min(2, "Escribe el nombre del entrenador.")
    .max(80, "El nombre del entrenador es demasiado largo."),

  channelName: z
    .string()
    .trim()
    .min(2, "Escribe el nombre del canal.")
    .max(100, "El nombre del canal es demasiado largo."),

  channelUrl: z
    .string()
    .trim()
    .url("Pega una URL válida del canal de YouTube.")
    .refine(
      isValidYouTubeChannelUrl,
      "La URL debe ser un canal válido de YouTube."
    ),

  readingContent: z
    .string()
    .trim()
    .min(20, "La lectura debe tener al menos 20 caracteres.")
    .max(20000, "La lectura es demasiado larga.")
    .refine(
      (value) => !forbiddenHtmlPattern.test(value),
      "La lectura contiene HTML no permitido."
    ),

  estimatedMinutes: z.coerce
    .number()
    .int("Debe ser un número entero.")
    .min(1, "El tiempo mínimo es 1 minuto.")
    .max(180, "El tiempo máximo permitido es 180 minutos."),

  status: z.enum(["draft", "published"]),
});

export type CreateEntryInput = z.infer<typeof createEntrySchema>;