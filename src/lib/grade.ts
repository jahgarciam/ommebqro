export type Grade =
  | "primaria_5_o_menor"
  | "primaria_6"
  | "secundaria_1"
  | "secundaria_2";

export function getRecommendedLevelSlug(grade: Grade) {
  if (grade === "primaria_5_o_menor") return "nivel-1";
  if (grade === "primaria_6") return "nivel-2";
  if (grade === "secundaria_1") return "nivel-2";
  if (grade === "secundaria_2") return "nivel-3";

  return "nivel-1";
}

export const gradeLabels: Record<Grade, string> = {
  primaria_5_o_menor: "5.º de primaria o menor",
  primaria_6: "6.º de primaria",
  secundaria_1: "1.º de secundaria",
  secundaria_2: "2.º de secundaria",
};