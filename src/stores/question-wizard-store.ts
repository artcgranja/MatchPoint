import { create } from "zustand";
import type { QuestionData, QuestionAnswer } from "@/types";

interface AnswerState {
  selected: Set<string>;
  otherText: string;
  otherSelected: boolean;
}

interface QuestionWizardStore {
  open: boolean;
  questions: QuestionData[];
  context: string | undefined;
  currentStep: number;
  answers: Record<string, AnswerState>;

  openWizard: (questions: QuestionData[], context?: string) => void;
  closeWizard: () => void;
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (step: number) => void;
  setAnswer: (questionId: string, answer: AnswerState) => void;
  getFormattedAnswers: () => QuestionAnswer[];
  reset: () => void;
}

function initAnswers(questions: QuestionData[]): Record<string, AnswerState> {
  const answers: Record<string, AnswerState> = {};
  for (const q of questions) {
    answers[q.id] = { selected: new Set(), otherText: "", otherSelected: false };
  }
  return answers;
}

export const useQuestionWizardStore = create<QuestionWizardStore>()((set, get) => ({
  open: false,
  questions: [],
  context: undefined,
  currentStep: 0,
  answers: {},

  openWizard: (questions, context) =>
    set((state) => ({
      open: true,
      questions,
      context,
      // Only reinitialize answers if questions changed
      currentStep: state.questions === questions ? state.currentStep : 0,
      answers: state.questions === questions ? state.answers : initAnswers(questions),
    })),

  closeWizard: () => set({ open: false }),

  nextStep: () =>
    set((state) => ({
      currentStep: Math.min(state.currentStep + 1, state.questions.length),
    })),

  prevStep: () =>
    set((state) => ({
      currentStep: Math.max(state.currentStep - 1, 0),
    })),

  goToStep: (step) =>
    set((state) => ({
      currentStep: Math.max(0, Math.min(step, state.questions.length)),
    })),

  setAnswer: (questionId, answer) =>
    set((state) => ({
      answers: { ...state.answers, [questionId]: answer },
    })),

  getFormattedAnswers: () => {
    const { questions, answers } = get();
    return questions.map((q) => {
      const state = answers[q.id];
      if (!state) return { questionId: q.id, selected: [] };
      return {
        questionId: q.id,
        selected: [...state.selected],
        ...(state.otherSelected && state.otherText.trim()
          ? { otherText: state.otherText.trim() }
          : {}),
      };
    });
  },

  reset: () =>
    set({
      open: false,
      questions: [],
      context: undefined,
      currentStep: 0,
      answers: {},
    }),
}));
