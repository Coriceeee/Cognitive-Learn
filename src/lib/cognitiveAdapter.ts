export type CognitiveVector = {
  SCI: number;
  MAS: number;
  CSL: number;

  GVI: number;
  BDI: number;
  FRI: number;
  CRI: number;

  timestamp: string;
};


function clamp(
  value: number,
  min = 0,
  max = 100
) {
  return Math.max(
    min,
    Math.min(max, value)
  );
}


/**
 * Convert raw student cognitive data
 * into Dynamic Cognitive Vector
 *
 * Used by:
 * - Prediction Engine
 * - Simulation Engine
 * - Decision Engine
 */
export function createCognitiveVector(
  state: any
): CognitiveVector {


  const SCI =
    clamp(
      state.SCI ??
      state.sci ??
      state.studyConsistency ??
      0
    );


  const MAS =
    clamp(
      state.MAS ??
      state.mas ??
      state.motivation ??
      0
    );


  const CSL =
    clamp(
      state.CSL ??
      state.csl ??
      state.learningStrategy ??
      0
    );



  /**
   * GVI
   *
   * Goal Volatility Index
   *
   * Mục tiêu thay đổi càng nhiều
   * chỉ số càng cao
   */
  const GVI =
    clamp(
      state.GVI ??
      state.gvi ??
      (
        (state.goalSwitchFrequency ?? 0)
        * 20
      )
    );



  /**
   * BDI
   *
   * Behavior Drift Index
   *
   * Đo sự thay đổi hành vi
   */
  const BDI =
    clamp(
      state.BDI ??
      state.bdi ??
      Math.abs(
        100 -
        (
          state.planCompletionRate ??
          state.completionRate ??
          100
        )
      )
    );



  /**
   * FRI
   *
   * Fatigue Risk Index
   */
  const FRI =
    clamp(
      state.FRI ??
      state.fri ??
      (
        (
          state.taskAbandonmentRate ??
          0
        )
        * 0.6
        +
        (
          state.contextSwitchRate ??
          0
        )
        * 0.4
      )
    );



  /**

   * Khả năng duy trì trạng thái học tập
   */
  const CRI =
    clamp(
      state.CRI ??
      state.cri ??
      (
        SCI * 0.5
        +
        MAS * 0.3
        +
        CSL * 0.2
      )
    );



  return {

    SCI: Math.round(SCI),

    MAS: Math.round(MAS),

    CSL: Math.round(CSL),


    GVI: Math.round(GVI),

    BDI: Math.round(BDI),

    FRI: Math.round(FRI),

    CRI: Math.round(CRI),



    timestamp:
      new Date().toISOString()

  };

}