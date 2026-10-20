import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { StudentProfile, CognitiveResult } from "../../seed/types";
import {
  requestGeminiLumenExplanation,
  type GeminiLumenExplanation,
} from "../../../lib/geminiLumenClient";
import type { CognitiveGrowthAnalytics } from "../../../engines/history/cognitiveGrowthAnalytics";
import type { AIStudentContext } from "../../../engines/ai/aiTypes";
import { analyzeCognitiveProfile, buildLumenDecision } from "../../../engines/lumen/lumenIntelligenceEngine";
import { getLumenGrowthEvidence } from "../../../engines/lumen/lumenEngine";
import { runAIOrchestrator } from "../../../engines/ai/aiOrchestrator";
import { runOrionStrategy } from "../../../lib/orionStrategyEngine";
import {
  adaptOrionStrategyToLumen,
  type LumenStrategyView,
} from "../../../engines/lumen/lumenStrategyAdapter";

function buildAIContext(
  profile: StudentProfile,
  cognitive: CognitiveResult,
  growth: CognitiveGrowthAnalytics | null | undefined
): AIStudentContext {
  const evidence = getLumenGrowthEvidence(growth);
  return {
    profile: {
      fullName: profile.fullName || "Học sinh",
      className: profile.className || "",
      targetMajor: profile.targetMajor || "",
      targetUniversity: profile.targetUniversity || "",
    },
    cognitive,
    // Only sufficiently observed changes are eligible for trend reasoning.
    // Do not derive history from cognitive.history; the source is Firestore.
    history: evidence.status === "OBSERVED" && evidence.growthStatus
      ? {
          growthStatus: evidence.growthStatus,
          growthMessage: evidence.message,
        }
      : undefined,
    behavior: {
      studyHoursPerWeek: profile.studyHoursPerWeek,
      practiceTestsPerWeek: profile.practiceTestsPerWeek,
      motivationLevel: profile.motivationLevel,
      planCompletionRate: profile.planCompletionRate,
    },
  };
}

function buildOrionStrategy(profile: StudentProfile): LumenStrategyView | undefined {
  if (
    !Array.isArray(profile.orionSubjects) ||
    profile.orionSubjects.length === 0 ||
    !profile.orionWeeksLeft
  ) {
    return undefined;
  }

  const result = runOrionStrategy({
    subjects: profile.orionSubjects,
    weeksLeft: profile.orionWeeksLeft,
    targetMajor: profile.targetMajor,
  });

  return adaptOrionStrategyToLumen(result);
}

type GeminiState = {
  status: "IDLE" | "LOADING" | "SUCCESS" | "FALLBACK";
  explanation: GeminiLumenExplanation | null;
  error: string | null;
};

const idleGeminiState: GeminiState = {
  status: "IDLE",
  explanation: null,
  error: null,
};

/** Local reasoning is authoritative for scores; Gemini is optional explanation. */
export function useLumenIntelligence(
  profile: StudentProfile,
  cognitive: CognitiveResult,
  growth?: CognitiveGrowthAnalytics | null
) {
  const [geminiState, setGeminiState] = useState<GeminiState>(idleGeminiState);
  const controllerRef = useRef<AbortController | null>(null);
  const aiContext = useMemo(
    () => buildAIContext(profile, cognitive, growth),
    [profile, cognitive, growth]
  );
  const ai = useMemo(
    () => runAIOrchestrator(
      aiContext,
      "Phân tích tổng quan năng lực, xu hướng phát triển và chiến lược học tập phù hợp cho học sinh."
    ),
    [aiContext]
  );
  const insights = useMemo(() => analyzeCognitiveProfile(cognitive), [cognitive]);
  const decision = useMemo(() => buildLumenDecision(insights), [insights]);
  const growthEvidence = useMemo(() => getLumenGrowthEvidence(growth), [growth]);
  const strategy = useMemo(() => buildOrionStrategy(profile), [profile]);

  // If the student profile changes or the page unmounts, discard stale responses.
  useEffect(() => {
    setGeminiState(idleGeminiState);
    return () => {
      controllerRef.current?.abort();
      controllerRef.current = null;
    };
  }, [aiContext]);

  const generateGeminiExplanation = useCallback(async () => {
    if (cognitive.scoreAvailable !== true) {
      setGeminiState({ status: "FALLBACK", explanation: null, error: "Cognitive chưa đủ dữ liệu để giải thích bằng Gemini." });
      return;
    }

    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    setGeminiState({ status: "LOADING", explanation: null, error: null });
    const timeout = setTimeout(() => controller.abort(), 60000);
    try {
      const explanation = await requestGeminiLumenExplanation(aiContext, ai.reasoning, controller.signal);
      if (!controller.signal.aborted) {
        setGeminiState({ status: "SUCCESS", explanation, error: null });
      }
    } catch (error) {
      if (!controller.signal.aborted) {
        setGeminiState({
          status: "FALLBACK",
          explanation: null,
          error: error instanceof Error ? error.message : "Gemini không khả dụng.",
        });
      } else if (controllerRef.current === controller) {
        setGeminiState({ status: "FALLBACK", explanation: null, error: "Gemini phản hồi quá chậm hoặc yêu cầu đã được hủy." });
      }
    } finally {
      clearTimeout(timeout);
      if (controllerRef.current === controller) controllerRef.current = null;
    }
  }, [aiContext, ai.reasoning, cognitive.scoreAvailable]);

  return {
    profile,
    cognitive,
    growthEvidence,
    insights,
    decision,
    strategy,
    ai: {
      reasoning: ai.reasoning,
      explanation: ai.explanation,
      prompt: ai.prompt,
    },
    gemini: {
      ...geminiState,
      generate: generateGeminiExplanation,
    },
  };
}
