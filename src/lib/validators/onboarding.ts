import { z } from "zod";

export const onboardingSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(2, "Escribe tu primer nombre.")
    .max(40, "El nombre es demasiado largo.")
    .regex(/^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s'-]+$/, "El nombre contiene caracteres no válidos."),

  firstLastName: z
    .string()
    .trim()
    .min(2, "Escribe tu primer apellido.")
    .max(40, "El apellido es demasiado largo.")
    .regex(/^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s'-]+$/, "El apellido contiene caracteres no válidos."),

  grade: z.enum([
    "primaria_5_o_menor",
    "primaria_6",
    "secundaria_1",
    "secundaria_2",
  ]),

  acceptedPrivacyNotice: z.literal("on"),
});

export type OnboardingInput = z.infer<typeof onboardingSchema>;