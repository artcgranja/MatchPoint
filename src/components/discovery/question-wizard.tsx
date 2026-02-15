"use client";

import { useCallback, useRef } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useTranslations } from "next-intl";
import { ChevronLeft, ChevronRight, Send, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { EASE_OUT_EXPO } from "@/lib/motion";
import { useQuestionWizardStore } from "@/stores/question-wizard-store";
import type { QuestionAnswer } from "@/types";

interface QuestionWizardProps {
  onSubmit: (answers: QuestionAnswer[]) => void;
}

const stepVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 40 : -40,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
    transition: { duration: 0.2, ease: EASE_OUT_EXPO },
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -40 : 40,
    opacity: 0,
    transition: { duration: 0.12 },
  }),
};

export function QuestionWizard({ onSubmit }: QuestionWizardProps) {
  const t = useTranslations("Questions");
  const directionRef = useRef(1);

  const {
    open,
    questions,
    context,
    currentStep,
    answers,
    closeWizard,
    nextStep,
    prevStep,
    goToStep,
    setAnswer,
    getFormattedAnswers,
    reset,
  } = useQuestionWizardStore();

  const totalQuestions = questions.length;
  const isReviewStep = currentStep === totalQuestions;
  const totalSteps = totalQuestions + 1;

  const currentQuestion = !isReviewStep ? questions[currentStep] : null;
  const currentAnswer = currentQuestion ? answers[currentQuestion.id] : null;

  const isCurrentStepValid = () => {
    if (isReviewStep) return true;
    if (!currentQuestion) return false;
    if (!currentQuestion.required) return true;
    const ans = answers[currentQuestion.id];
    if (!ans) return false;
    return ans.selected.size > 0 || (ans.otherSelected && ans.otherText.trim().length > 0);
  };

  const handleNext = useCallback(() => {
    directionRef.current = 1;
    nextStep();
  }, [nextStep]);

  const handlePrev = useCallback(() => {
    directionRef.current = -1;
    prevStep();
  }, [prevStep]);

  const handleGoToStep = useCallback(
    (step: number) => {
      directionRef.current = step > currentStep ? 1 : -1;
      goToStep(step);
    },
    [currentStep, goToStep]
  );

  const handleSingleSelect = useCallback(
    (value: string) => {
      if (!currentQuestion) return;
      setAnswer(currentQuestion.id, {
        ...(currentAnswer ?? { selected: new Set(), otherText: "", otherSelected: false }),
        selected: new Set([value]),
        otherSelected: false,
      });
    },
    [currentQuestion, currentAnswer, setAnswer]
  );

  const handleMultiToggle = useCallback(
    (value: string) => {
      if (!currentQuestion || !currentAnswer) return;
      const next = new Set(currentAnswer.selected);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      setAnswer(currentQuestion.id, { ...currentAnswer, selected: next });
    },
    [currentQuestion, currentAnswer, setAnswer]
  );

  const handleOtherToggle = useCallback(() => {
    if (!currentQuestion || !currentAnswer) return;
    if (currentQuestion.type === "single_choice") {
      setAnswer(currentQuestion.id, {
        ...currentAnswer,
        selected: new Set(),
        otherSelected: !currentAnswer.otherSelected,
      });
    } else {
      setAnswer(currentQuestion.id, {
        ...currentAnswer,
        otherSelected: !currentAnswer.otherSelected,
      });
    }
  }, [currentQuestion, currentAnswer, setAnswer]);

  const handleOtherText = useCallback(
    (text: string) => {
      if (!currentQuestion || !currentAnswer) return;
      setAnswer(currentQuestion.id, { ...currentAnswer, otherText: text });
    },
    [currentQuestion, currentAnswer, setAnswer]
  );

  const handleSubmit = useCallback(() => {
    const formatted = getFormattedAnswers();
    onSubmit(formatted);
    reset();
  }, [getFormattedAnswers, onSubmit, reset]);

  const showWizard = open && questions.length > 0;

  return (
    <AnimatePresence>
      {showWizard && (
        <>
          {/* Subtle backdrop */}
          <motion.div
            key="wizard-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/40"
            onClick={closeWizard}
          />

          {/* Floating card — same positioning as ChatInput container */}
          <motion.div
            key="wizard-card"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.25, ease: EASE_OUT_EXPO }}
            className="fixed inset-x-0 bottom-0 z-50 mx-auto w-full max-w-3xl px-4 pb-4"
          >
            <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-xl">
              {/* Header: context */}
              {context && (
                <div className="px-4 pt-4 pb-2">
                  <p className="text-xs text-foreground-muted leading-relaxed">{context}</p>
                </div>
              )}

              {/* Progress dots — centered, only when multiple questions */}
              {totalQuestions > 1 && (
                <div className="flex items-center justify-center gap-1.5 px-4 pt-3 pb-1">
                  {Array.from({ length: totalSteps }).map((_, i) => (
                    <div
                      key={i}
                      className={cn(
                        "h-1.5 rounded-full transition-all duration-300",
                        i === currentStep
                          ? "bg-highlight w-6"
                          : i < currentStep
                            ? "bg-highlight/40 w-1.5"
                            : "bg-foreground-muted/20 w-1.5"
                      )}
                    />
                  ))}
                </div>
              )}

              {/* Step content */}
              <div className="px-4 pb-3 pt-2 min-h-[120px]">
                <AnimatePresence mode="wait" custom={directionRef.current}>
                  {!isReviewStep && currentQuestion && currentAnswer ? (
                    <motion.div
                      key={`step-${currentStep}`}
                      custom={directionRef.current}
                      variants={stepVariants}
                      initial="enter"
                      animate="center"
                      exit="exit"
                    >
                      <fieldset className="space-y-2">
                        <legend className="text-sm font-medium text-foreground mb-2">
                          {currentQuestion.question}
                          {currentQuestion.required && (
                            <span className="text-destructive ml-1">*</span>
                          )}
                        </legend>

                        <div className="space-y-0.5">
                          {currentQuestion.options.map((option) => {
                            const isSelected =
                              currentQuestion.type === "single_choice"
                                ? currentAnswer.selected.has(option) && !currentAnswer.otherSelected
                                : currentAnswer.selected.has(option);
                            return (
                              <label
                                key={option}
                                className={cn(
                                  "flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm cursor-pointer transition-colors border",
                                  isSelected
                                    ? "bg-highlight/15 border-highlight/30 text-foreground"
                                    : "border-transparent text-foreground-muted hover:bg-surface-hover"
                                )}
                              >
                                {currentQuestion.type === "single_choice" ? (
                                  <input
                                    type="radio"
                                    name={currentQuestion.id}
                                    checked={isSelected}
                                    onChange={() => handleSingleSelect(option)}
                                    className="accent-highlight h-3.5 w-3.5"
                                  />
                                ) : (
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => handleMultiToggle(option)}
                                    className="accent-highlight h-3.5 w-3.5 rounded"
                                  />
                                )}
                                {option}
                              </label>
                            );
                          })}

                          {/* Other option */}
                          <label
                            className={cn(
                              "flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm cursor-pointer transition-colors border",
                              currentAnswer.otherSelected
                                ? "bg-highlight/15 border-highlight/30 text-foreground"
                                : "border-transparent text-foreground-muted hover:bg-surface-hover"
                            )}
                          >
                            {currentQuestion.type === "single_choice" ? (
                              <input
                                type="radio"
                                name={currentQuestion.id}
                                checked={currentAnswer.otherSelected}
                                onChange={handleOtherToggle}
                                className="accent-highlight h-3.5 w-3.5"
                              />
                            ) : (
                              <input
                                type="checkbox"
                                checked={currentAnswer.otherSelected}
                                onChange={handleOtherToggle}
                                className="accent-highlight h-3.5 w-3.5 rounded"
                              />
                            )}
                            {t("other")}
                          </label>
                          {currentAnswer.otherSelected && (
                            <div className="pl-8">
                              <Input
                                value={currentAnswer.otherText}
                                onChange={(e) => handleOtherText(e.target.value)}
                                placeholder={t("otherPlaceholder")}
                                className="h-7 text-sm"
                                autoFocus
                              />
                            </div>
                          )}
                        </div>
                      </fieldset>
                    </motion.div>
                  ) : isReviewStep ? (
                    <motion.div
                      key="review"
                      custom={directionRef.current}
                      variants={stepVariants}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      className="space-y-2.5"
                    >
                      <div>
                        <h3 className="text-sm font-medium text-foreground">
                          {t("reviewTitle")}
                        </h3>
                        <p className="text-xs text-foreground-muted mt-0.5">
                          {t("reviewDescription")}
                        </p>
                      </div>
                      <div className="space-y-1">
                        {questions.map((q, i) => {
                          const ans = answers[q.id];
                          const values = ans ? [...ans.selected] : [];
                          if (ans?.otherSelected && ans.otherText.trim()) {
                            values.push(ans.otherText.trim());
                          }
                          return (
                            <button
                              key={q.id}
                              onClick={() => handleGoToStep(i)}
                              className="w-full text-left rounded-lg px-2.5 py-2 hover:bg-surface-hover transition-colors group"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                  <p className="text-xs font-medium text-foreground truncate">
                                    {q.question}
                                  </p>
                                  <p className="text-xs text-foreground-muted mt-0.5">
                                    {values.length > 0 ? values.join(", ") : "-"}
                                  </p>
                                </div>
                                <Pencil className="h-3 w-3 text-foreground-muted opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-0.5" />
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>

              {/* Footer: navigation buttons */}
              <div className="flex items-center justify-between px-4 pb-4 pt-1">
                {currentStep > 0 ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handlePrev}
                    className="gap-1 h-8"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                    {t("previous")}
                  </Button>
                ) : (
                  <div />
                )}

                {isReviewStep ? (
                  <Button size="sm" onClick={handleSubmit} className="gap-1 h-8">
                    <Send className="h-3 w-3" />
                    {t("submit")}
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    onClick={handleNext}
                    disabled={!isCurrentStepValid()}
                    className="gap-1 h-8"
                  >
                    {t("next")}
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
