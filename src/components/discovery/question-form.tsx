"use client";

import { motion } from "motion/react";
import { CheckCircle2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { slideUp } from "@/lib/motion";
import type { QuestionData, QuestionAnswer } from "@/types";

interface QuestionAnsweredCardProps {
  questions: QuestionData[];
  answers?: QuestionAnswer[];
  context?: string;
}

export function QuestionAnsweredCard({ questions, answers, context }: QuestionAnsweredCardProps) {
  const t = useTranslations("Questions");

  return (
    <motion.div
      variants={slideUp}
      initial="hidden"
      animate="visible"
      className="bg-background-secondary border border-border rounded-xl p-4"
    >
      <div className="flex items-center gap-2 mb-3">
        <CheckCircle2 className="h-4 w-4 text-sage" />
        <span className="text-xs font-medium text-sage">{t("answersSubmitted")}</span>
      </div>
      {context && (
        <p className="text-xs text-foreground-muted mb-3">{context}</p>
      )}
      <div className="space-y-2">
        {questions.map((q) => {
          const answer = answers?.find((a) => a.questionId === q.id);
          const values = answer ? [...answer.selected] : [];
          if (answer?.otherText) values.push(answer.otherText);
          return (
            <div key={q.id}>
              <p className="text-xs font-medium text-foreground">{q.question}</p>
              <p className="text-xs text-foreground-muted">{values.join(", ") || "-"}</p>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
