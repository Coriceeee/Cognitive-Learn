import type {
  AIStudentContext,
} from "./aiTypes";


export interface AIPrompt {

  system:string;

  user:string;

  contextSummary:string;

}



function formatCognitive(
  cognitive:any
){

  return Object.entries(
    cognitive
  )
    .filter(
      ([,value]) =>
        typeof value === "number"
    )
    .map(
      ([key,value]) =>
        `${key}: ${value}`
    )
    .join("\n");

}



function formatHistory(
  context:AIStudentContext
){

  if(!context.history){

    return "Chưa có dữ liệu phát triển.";

  }


  return `

Growth Status:
${context.history.growthStatus ?? "N/A"}

Growth Message:
${context.history.growthMessage ?? "N/A"}

Trajectory:
${context.history.trajectory?.direction ?? "N/A"}

Confidence:
${context.history.trajectory?.confidence ?? "N/A"}

`;

}




function formatBehavior(
  context:AIStudentContext
){

  if(!context.behavior){

    return "Không có dữ liệu hành vi.";

  }


  return `

Study Hours:
${context.behavior.studyHoursPerWeek ?? "N/A"}

Practice Tests:
${context.behavior.practiceTestsPerWeek ?? "N/A"}

Motivation:
${context.behavior.motivationLevel ?? "N/A"}

Completion Rate:
${context.behavior.planCompletionRate ?? "N/A"}

`;

}




function formatAdmission(
  context:AIStudentContext
){

  if(!context.admission){

    return "Không có dữ liệu tuyển sinh.";

  }


  return `

Target Major:
${context.admission.targetMajor ?? "N/A"}

Admission Method:
${context.admission.bestMethod ?? "N/A"}

Risk:
${context.admission.riskLevel ?? "N/A"}

`;

}




export function buildAIPrompt(
  context:AIStudentContext,
  question:string
):AIPrompt {


  const cognitive =
    formatCognitive(
      context.cognitive
    );



  const summary = `

Student:
${context.profile.fullName}

Class:
${context.profile.className}

Major Goal:
${context.profile.targetMajor}

University Goal:
${context.profile.targetUniversity}

`;



  return {


    system:`

Bạn là Cognitive Learn AI Intelligence Core.

Nhiệm vụ:

- phân tích hồ sơ học sinh;
- giải thích dựa trên dữ liệu;
- tạo khuyến nghị cá nhân hóa;
- không đưa kết luận không có bằng chứng.

Ưu tiên:
1. Cognitive Profile
2. Growth Trend
3. Learning Behavior
4. Admission Goal

`,



    user:`

${summary}


COGNITIVE PROFILE:

${cognitive}



HISTORY:

${formatHistory(context)}



BEHAVIOR:

${formatBehavior(context)}



ADMISSION:

${formatAdmission(context)}



QUESTION:

${question}


`,



    contextSummary:

`${summary}

Cognitive dimensions analyzed:
${Object.keys(context.cognitive).join(", ")}

`

  };

}