import type {
  ScenarioType,
  ScenarioChanges
} from "../simulationTypes";



export const interventionRules:
Record<
ScenarioType,
ScenarioChanges
>
={



BASELINE:{



},




STUDY_INCREASE:{


studyHoursDelta:5,


cognitive:{


FRI:8,


SCI:5


}


},





CONSISTENCY_BOOST:{


completionDelta:20,


cognitive:{


SCI:15,


BDI:-15,


CRI:10


}


},





MOTIVATION_BOOST:{


cognitive:{


MAS:15,


CRI:5,


GVI:-10


}


},





FATIGUE_REDUCTION:{


cognitive:{


FRI:-20,


CRI:15


}


},





STRATEGY_IMPROVEMENT:{


cognitive:{


CSL:15,


CRI:10,


BDI:-10


}


}



};