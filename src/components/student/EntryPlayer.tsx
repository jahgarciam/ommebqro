"use client";

import { useMemo, useState, type ReactNode } from "react";
import { MarkdownMath } from "@/components/markdown/MarkdownMath";

type ProgressStep =
  | "video"
  | "reading"
  | "questions"
  | "examples"
  | "exercises"
  | "completed";

type Question = {
  id: string;
  question_text: string;
  order_index: number;
  quiz_options:
    | {
        id: string;
        option_text: string;
        order_index: number;
      }[]
    | null;
};

type Example = {
  id: string;
  title: string;
  content: string;
  image_url: string | null;
  image_alt: string | null;
  order_index: number;
};

type Exercise = {
  id: string;
  statement: string;
  hint_1: string | null;
  hint_2: string | null;
  hint_3: string | null;
  order_index: number;
};

type Trainer = {
  trainer_name: string;
  channel_name: string;
  youtube_channel_url: string;
} | null;

type QuestionResult = {
  total_questions: number;
  answered_questions: number;
  correct_answers: number;
  score_percent: number;
};

type QuestionFeedback = {
  questionId: string;
  selectedOptionId: string | null;
  correctOptionId: string | null;
  isCorrect: boolean;
};

type EntryPlayerProps = {
  entryId: string;
  title: string;
  summary: string | null;
  youtubeVideoId: string | null;
  readingContent: string;
  trainer: Trainer;
  questions: Question[];
  examples: Example[];
  exercises: Exercise[];
  initialStep: ProgressStep;
  initialSelectedAnswers: Record<string, string>;
  returnUrl: string;
};

const steps = [
  "Video",
  "Lectura",
  "Preguntas",
  "Ejemplos",
  "Ejercicios",
] as const;

const stepToIndex: Record<ProgressStep, number> = {
  video: 0,
  reading: 1,
  questions: 2,
  examples: 3,
  exercises: 4,
  completed: 4,
};

export function EntryPlayer({
  entryId,
  title,
  summary,
  youtubeVideoId,
  readingContent,
  trainer,
  questions,
  examples,
  exercises,
  initialStep,
  initialSelectedAnswers,
  returnUrl,
}: EntryPlayerProps) {
  const [currentStep, setCurrentStep] = useState(stepToIndex[initialStep] ?? 0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>(
    initialSelectedAnswers
  );
  const [visibleHints, setVisibleHints] = useState<Record<string, number>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [questionResult, setQuestionResult] = useState<QuestionResult | null>(
    null
  );
  const [questionFeedback, setQuestionFeedback] = useState<
    Record<string, QuestionFeedback>
  >({});
  const [isEntryCompleted, setIsEntryCompleted] = useState(
    initialStep === "completed"
  );
  const [showCompletionModal, setShowCompletionModal] = useState(false);

  const hasQuestionFeedback = Object.keys(questionFeedback).length > 0;

  const allQuestionsAnswered = useMemo(() => {
    if (questions.length === 0) return true;
    return questions.every((question) => Boolean(selectedAnswers[question.id]));
  }, [questions, selectedAnswers]);

  function scrollTop() {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function goPrevious() {
    setCurrentStep((step) => Math.max(step - 1, 0));
    scrollTop();
  }

  function getOptionLetter(question: Question, optionId: string | null) {
    if (!optionId) return "";

    const options = [...(question.quiz_options ?? [])].sort(
      (a, b) => a.order_index - b.order_index
    );

    const index = options.findIndex((option) => option.id === optionId);

    if (index < 0) return "";

    return String.fromCharCode(65 + index);
  }

  async function saveProgress(
    completedStep: "video" | "reading" | "examples" | "exercises" | "completed",
    nextStepIndex: number
  ) {
    setIsSaving(true);
    setSaveError(null);

    try {
      const response = await fetch("/api/student/progress", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          entryId,
          step: completedStep,
        }),
      });

      const payload = await response.json();

      if (!response.ok || !payload.ok) {
        throw new Error(payload.error ?? "save-progress-failed");
      }

      if (completedStep === "exercises" || completedStep === "completed") {
        setIsEntryCompleted(true);
        setShowCompletionModal(true);
      } else {
        setCurrentStep(nextStepIndex);
        scrollTop();
      }
    } catch {
      setSaveError(
        "No se pudo guardar tu avance. Revisa tu conexión e inténtalo otra vez."
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function submitQuestions() {
    if (!allQuestionsAnswered) return;

    setIsSaving(true);
    setSaveError(null);

    const answers = questions.map((question) => ({
      questionId: question.id,
      optionId: selectedAnswers[question.id],
    }));

    try {
      const response = await fetch("/api/student/questions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          entryId,
          answers,
        }),
      });

      const payload = await response.json();

      if (!response.ok || !payload.ok) {
        throw new Error(payload.error ?? "submit-answers-failed");
      }

      const feedbackMap: Record<string, QuestionFeedback> = {};

      for (const item of payload.feedback ?? []) {
        feedbackMap[item.question_id] = {
          questionId: item.question_id,
          selectedOptionId: item.selected_option_id,
          correctOptionId: item.correct_option_id,
          isCorrect: item.is_correct,
        };
      }

      setQuestionFeedback(feedbackMap);
      setQuestionResult(payload.result ?? null);
    } catch {
      setSaveError(
        "No se pudieron guardar tus respuestas. Revisa tu conexión e inténtalo otra vez."
      );
    } finally {
      setIsSaving(false);
    }
  }

  function continueToExamples() {
    setCurrentStep(3);
    scrollTop();
  }

  return (
    <div>
      <section className="rounded-3xl bg-white p-6 shadow-sm md:p-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-[#1F2E67]">
          Entrada de estudio
        </p>

        <h1 className="mt-2 text-3xl font-bold text-slate-950 md:text-4xl">
          {title}
        </h1>

        {summary ? <p className="mt-4 text-slate-600">{summary}</p> : null}

        <div className="mt-6 grid grid-cols-5 gap-2">
          {steps.map((step, index) => (
            <div
              key={step}
              className={`rounded-full px-2 py-2 text-center text-xs font-semibold ${
                index === currentStep
                  ? "bg-[#1F2E67] text-white"
                  : index < currentStep || isEntryCompleted
                    ? "bg-blue-50 text-[#1F2E67]"
                    : "bg-slate-100 text-slate-500"
              }`}
            >
              {index + 1}. {step}
            </div>
          ))}
        </div>

        {isEntryCompleted ? (
          <div className="mt-5 rounded-2xl bg-blue-50 p-4 text-sm font-semibold text-[#1F2E67]">
            Entrada completada. Tu avance quedó guardado.
          </div>
        ) : null}

        {saveError ? (
          <div className="mt-5 rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-700">
            {saveError}
          </div>
        ) : null}
      </section>

      {currentStep === 0 ? (
        <StudySection title="1. Video">
          {trainer ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm leading-6 text-slate-600">
                Este video fue preparado por{" "}
                <span className="font-semibold text-slate-950">
                  {trainer.trainer_name}
                </span>
                .
              </p>

              <a
                href={trainer.youtube_channel_url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex text-sm font-semibold text-[#1F2E67]"
              >
                Suscríbete al canal: {trainer.channel_name} →
              </a>
            </div>
          ) : null}

          {youtubeVideoId ? (
            <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200">
              <iframe
                className="aspect-video w-full"
                src={`https://www.youtube.com/embed/${youtubeVideoId}`}
                title={title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>
          ) : (
            <p className="text-sm text-slate-600">
              Esta entrada todavía no tiene video.
            </p>
          )}

          <NavigationButtons
            currentStep={currentStep}
            onBack={goPrevious}
            onNext={() => saveProgress("video", 1)}
            nextLabel="Ya vi el video"
            disabledNext={isSaving}
          />
        </StudySection>
      ) : null}

      {currentStep === 1 ? (
        <StudySection title="2. Lectura">
          <div className="rounded-2xl bg-slate-50 p-4">
            <MarkdownMath content={readingContent} />
          </div>

          <NavigationButtons
            currentStep={currentStep}
            onBack={goPrevious}
            onNext={() => saveProgress("reading", 2)}
            nextLabel="Terminé la lectura"
            disabledNext={isSaving}
          />
        </StudySection>
      ) : null}

      {currentStep === 2 ? (
        <StudySection title="3. Preguntas de comprensión">
          <p className="text-sm leading-6 text-slate-600">
            Selecciona una opción en cada pregunta. Al terminar, revisaremos tus
            respuestas para que puedas corregir tu razonamiento.
          </p>

          <div className="mt-5 space-y-5">
            {questions.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                Esta entrada todavía no tiene preguntas de comprensión.
              </div>
            ) : (
              questions.map((question, questionIndex) => {
                const feedback = questionFeedback[question.id];
                const correctLetter = getOptionLetter(
                  question,
                  feedback?.correctOptionId ?? null
                );

                return (
                  <div
                    key={question.id}
                    className="rounded-2xl border border-slate-200 p-4"
                  >
                    <p className="text-sm font-semibold text-slate-500">
                      Pregunta {questionIndex + 1}
                    </p>

                    <div className="mt-2 font-semibold text-slate-950">
                      <MarkdownMath content={question.question_text} />
                    </div>

                    <div className="mt-4 space-y-2">
                      {[...(question.quiz_options ?? [])]
                        .sort((a, b) => a.order_index - b.order_index)
                        .map((option, optionIndex) => {
                          const isSelected =
                            selectedAnswers[question.id] === option.id;

                          const isCorrectOption =
                            feedback?.correctOptionId === option.id;

                          const isWrongSelected =
                            Boolean(feedback) &&
                            isSelected &&
                            !feedback?.isCorrect;

                          const isCorrectSelected =
                            Boolean(feedback) &&
                            isSelected &&
                            feedback?.isCorrect;

                          let optionClass =
                            "border-slate-200 bg-slate-50 hover:border-[#1F2E67]/50 hover:bg-white";

                          if (!feedback && isSelected) {
                            optionClass =
                              "border-[#1F2E67] bg-blue-50 ring-2 ring-[#1F2E67]/20";
                          }

                          if (isCorrectOption) {
                            optionClass =
                              "border-green-500 bg-green-50 ring-2 ring-green-500/20";
                          }

                          if (isWrongSelected) {
                            optionClass =
                              "border-red-500 bg-red-50 ring-2 ring-red-500/20";
                          }

                          return (
                            <button
                              key={option.id}
                              type="button"
                              disabled={Boolean(feedback)}
                              onClick={() =>
                                setSelectedAnswers((current) => ({
                                  ...current,
                                  [question.id]: option.id,
                                }))
                              }
                              className={`w-full rounded-2xl border p-4 text-left transition ${optionClass}`}
                            >
                              <div className="flex gap-3">
                                <span className="font-bold text-[#1F2E67]">
                                  {String.fromCharCode(65 + optionIndex)}.
                                </span>

                                <div className="flex-1">
                                  <MarkdownMath content={option.option_text} />

                                  {isCorrectOption ? (
                                    <p className="mt-2 text-xs font-bold text-green-700">
                                      Respuesta correcta
                                    </p>
                                  ) : null}

                                  {isWrongSelected ? (
                                    <p className="mt-2 text-xs font-bold text-red-700">
                                      Tu respuesta
                                    </p>
                                  ) : null}

                                  {isCorrectSelected ? (
                                    <p className="mt-2 text-xs font-bold text-green-700">
                                      Tu respuesta fue correcta
                                    </p>
                                  ) : null}
                                </div>
                              </div>
                            </button>
                          );
                        })}
                    </div>

                    {feedback ? (
                      <div
                        className={`mt-4 rounded-2xl p-3 text-sm font-semibold ${
                          feedback.isCorrect
                            ? "bg-green-50 text-green-800"
                            : "bg-red-50 text-red-800"
                        }`}
                      >
                        {feedback.isCorrect
                          ? "Muy bien. Tu respuesta es correcta."
                          : `Tu respuesta no fue correcta. La opción correcta era ${correctLetter}.`}
                      </div>
                    ) : null}
                  </div>
                );
              })
            )}
          </div>

          {!allQuestionsAnswered ? (
            <p className="mt-4 rounded-2xl bg-amber-50 p-3 text-sm text-amber-800">
              Responde todas las preguntas para continuar.
            </p>
          ) : null}

          {questionResult ? (
            <div className="mt-4 rounded-2xl bg-blue-50 p-4 text-sm leading-6 text-[#1F2E67]">
              Resultado de comprensión: {questionResult.correct_answers} de{" "}
              {questionResult.total_questions} respuestas correctas. Revisa las
              opciones marcadas en verde y rojo antes de continuar.
            </div>
          ) : null}

          <NavigationButtons
            currentStep={currentStep}
            onBack={goPrevious}
            onNext={hasQuestionFeedback ? continueToExamples : submitQuestions}
            nextLabel={
              hasQuestionFeedback
                ? "Continuar a ejemplos"
                : isSaving
                  ? "Guardando..."
                  : "Terminar preguntas"
            }
            disabledNext={!allQuestionsAnswered || isSaving}
          />
        </StudySection>
      ) : null}

      {currentStep === 3 ? (
        <StudySection title="4. Ejemplos resueltos">
          <div className="space-y-5">
            {examples.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                Esta entrada todavía no tiene ejemplos resueltos.
              </div>
            ) : (
              examples.map((example) => (
                <article
                  key={example.id}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                >
                  <h3 className="font-bold text-slate-950">{example.title}</h3>

                  <div className="mt-3 rounded-xl bg-white p-4">
                    <MarkdownMath content={example.content} />
                  </div>

                  {example.image_url ? (
                    <img
                      src={example.image_url}
                      alt={example.image_alt ?? example.title}
                      className="mt-4 max-h-[420px] w-full rounded-2xl border border-slate-200 object-contain"
                    />
                  ) : null}
                </article>
              ))
            )}
          </div>

          <NavigationButtons
            currentStep={currentStep}
            onBack={goPrevious}
            onNext={() => saveProgress("examples", 4)}
            nextLabel={isSaving ? "Guardando..." : "Ya revisé los ejemplos"}
            disabledNext={isSaving}
          />
        </StudySection>
      ) : null}

      {currentStep === 4 ? (
        <StudySection title="5. Ejercicios propuestos">
          <div className="space-y-5">
            {exercises.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                Esta entrada todavía no tiene ejercicios propuestos.
              </div>
            ) : (
              exercises.map((exercise, index) => {
                const hints = [
                  exercise.hint_1,
                  exercise.hint_2,
                  exercise.hint_3,
                ].filter(Boolean) as string[];

                const visibleHintCount = visibleHints[exercise.id] ?? 0;

                return (
                  <article
                    key={exercise.id}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <p className="text-sm font-semibold text-slate-500">
                      Ejercicio {index + 1}
                    </p>

                    <div className="mt-2">
                      <MarkdownMath content={exercise.statement} />
                    </div>

                    {hints.length > 0 ? (
                      <div className="mt-4 space-y-3">
                        {hints
                          .slice(0, visibleHintCount)
                          .map((hint, hintIndex) => (
                            <div
                              key={`${exercise.id}-${hintIndex}`}
                              className="rounded-xl bg-white p-3 text-sm text-slate-700"
                            >
                              <span className="font-semibold">
                                Pista {hintIndex + 1}:
                              </span>{" "}
                              {hint}
                            </div>
                          ))}

                        {visibleHintCount < hints.length ? (
                          <button
                            type="button"
                            onClick={() =>
                              setVisibleHints((current) => ({
                                ...current,
                                [exercise.id]: visibleHintCount + 1,
                              }))
                            }
                            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-[#1F2E67] transition hover:bg-slate-50"
                          >
                            Mostrar pista
                          </button>
                        ) : null}
                      </div>
                    ) : null}
                  </article>
                );
              })
            )}
          </div>

          <NavigationButtons
            currentStep={currentStep}
            onBack={goPrevious}
            onNext={() => saveProgress("exercises", 4)}
            nextLabel={
              isEntryCompleted
                ? "Entrada completada"
                : isSaving
                  ? "Guardando..."
                  : "Finalizar entrada"
            }
            disabledNext={isSaving || isEntryCompleted}
          />
        </StudySection>
      ) : null}

      {showCompletionModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 text-center shadow-xl">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-3xl">
              ✓
            </div>

            <h2 className="mt-5 text-2xl font-bold text-slate-950">
              Entrada completada
            </h2>

            <p className="mt-3 text-sm leading-6 text-slate-600">
              Terminaste esta entrada de estudio. Tu avance quedó guardado y puedes continuar con otra entrada del mismo tema.
            </p>

            <button
  type="button"
  onClick={() => {
    window.location.assign(returnUrl || "/dashboard");
  }}
              className="mt-6 w-full rounded-2xl bg-[#1F2E67] px-5 py-3 font-semibold text-white transition hover:opacity-90"
            >
              Aceptar y volver a las entradas
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function StudySection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="mt-6 rounded-3xl bg-white p-6 shadow-sm md:p-8">
      <h2 className="text-xl font-bold text-slate-950">{title}</h2>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function NavigationButtons({
  currentStep,
  onBack,
  onNext,
  nextLabel,
  disabledNext = false,
}: {
  currentStep: number;
  onBack: () => void;
  onNext: () => void;
  nextLabel: string;
  disabledNext?: boolean;
}) {
  return (
    <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-between">
      <button
        type="button"
        onClick={onBack}
        disabled={currentStep === 0}
        className="rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Regresar
      </button>

      <button
        type="button"
        onClick={onNext}
        disabled={disabledNext}
        className="rounded-2xl bg-[#1F2E67] px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {nextLabel}
      </button>
    </div>
  );
}