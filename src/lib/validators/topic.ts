import { z } from "zod";

export const createTopicSchema = z.object({
  subjectId: z.string().uuid("Materia inválida."),

  subjectSlug: z
    .string()
    .trim()
    .min(1, "Falta la materia.")
    .max(80, "La materia es inválida."),

  title: z
    .string()
    .trim()
    .min(3, "El tema debe tener al menos 3 caracteres.")
    .max(120, "El tema es demasiado largo.")
    .regex(
      /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9\s:;,.()¿?¡!+\-/*=]+$/,
      "El título contiene caracteres no permitidos."
    ),

  description: z
    .string()
    .trim()
    .max(500, "La descripción es demasiado larga.")
    .optional(),

  nivel1Difficulty: z.enum(["", "inicial", "estatal", "nacional"]),
  nivel2Difficulty: z.enum(["", "inicial", "estatal", "nacional"]),
  nivel3Difficulty: z.enum(["", "inicial", "estatal", "nacional"]),
});

export type CreateTopicInput = z.infer<typeof createTopicSchema>;