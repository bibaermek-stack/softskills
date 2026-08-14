"use client";

import { useRef } from "react";
import type { GameSpec } from "@/lib/lessons";
import type { SubjectId } from "@/lib/dashboard";
import type { GameType } from "@/lib/types";
import { saveRecord } from "@/lib/progress";
import { MatchGame } from "./MatchGame";
import { OrderGame } from "./OrderGame";
import { CategorizeGame } from "./CategorizeGame";
import type { GameResult } from "./GameFrame";

const LMS_GAME_TYPE: Record<GameSpec["kind"], GameType> = {
  match: "matching",
  order: "sorting",
  categorize: "dragdrop",
};

/**
 * Ойын түрін таңдап, нәтижесін сақтайтын қабат.
 *
 * Сабақ плеері тек осы компонентті біледі — қай механика ойналатынын
 * мазмұндағы `spec.kind` шешеді.
 */
export function Game({
  spec,
  lessonId,
  subject,
  accent,
}: {
  spec: GameSpec;
  lessonId: string;
  subject: SubjectId;
  accent: string;
}) {
  /** Бір әрекеттің нәтижесі бір рет қана жазылуы керек. */
  const savedAttempt = useRef(0);

  const handleComplete = (result: GameResult) => {
    if (savedAttempt.current === result.attempts) return;
    savedAttempt.current = result.attempts;

    saveRecord({
      id: spec.id,
      kind: "game",
      lessonId,
      subject,
      stage: "activity",
      score: result.score,
      correct: result.correct,
      total: result.total,
      attempts: result.attempts,
      durationMs: result.durationMs,
      gameType: LMS_GAME_TYPE[spec.kind],
      at: Date.now(),
    });
  };

  if (spec.kind === "match") {
    return <MatchGame spec={spec} accent={accent} onComplete={handleComplete} />;
  }
  if (spec.kind === "order") {
    return <OrderGame spec={spec} accent={accent} onComplete={handleComplete} />;
  }
  return <CategorizeGame spec={spec} accent={accent} onComplete={handleComplete} />;
}
