import type { StudentProfile } from "../types/student";

export const mockStudent: StudentProfile = {
  id: "student-demo-001",

  createdAt: "2026-08-01",
  updatedAt: "2026-08-11",

  personal: {
    name: "Nguyễn Minh Anh",
    grade: 12,
    school: "THPT Cognitive Learn Demo",
  },

  academics: [
    {
      year: 2026,
      semester: "HK1",
      gpa: 8.1,

      subjects: [
        {
          name: "Toán",
          score: 8.4,
        },
        {
          name: "Vật lý",
          score: 7.8,
        },
        {
          name: "Tiếng Anh",
          score: 8.7,
        },
        {
          name: "Hóa học",
          score: 7.5,
        },
      ],

      source: "manual",
      confidence: 0.95,
    },

    {
      year: 2025,
      semester: "HK2",
      gpa: 7.7,

      subjects: [
        {
          name: "Toán",
          score: 7.8,
        },
        {
          name: "Vật lý",
          score: 7.3,
        },
        {
          name: "Tiếng Anh",
          score: 8.0,
        },
      ],

      source: "manual",
      confidence: 0.9,
    },
  ],


  exams: [
    {
      type: "THPT",
      score: 26.5,
      scale: 30,
      year: 2026,
      confidence: 0.8,
    },

    {
      type: "DGNL",
      score: 890,
      scale: 1200,
      year: 2026,
      confidence: 0.85,
    },
  ],


  certificates: [
    {
      type: "IELTS",
      score: 7,
      obtainedAt: "2026-06-01",
    },
  ],


  behaviors: [

    {
      date: "2026-08-01",
      type: "STUDY_TIME",
      value: 18,
      note: "Số giờ học/tuần",
    },

    {
      date: "2026-08-03",
      type: "TASK_COMPLETE",
      value: 85,
    },

    {
      date: "2026-08-05",
      type: "TASK_DROP",
      value: 15,
    },

    {
      date: "2026-08-07",
      type: "GOAL_CHANGE",
      value: 0,
    },

  ],


  cognitiveHistory: [

    {
      date: "2026-08-01",

      SCI: 70,
      MAS: 72,
      CSL: 68,

      GVI: 20,
      BDI: 15,
      FRI: 25,
      CRI: 75,
    },

    {
      date: "2026-08-11",

      SCI: 78,
      MAS: 76,
      CSL: 82,

      GVI: 15,
      BDI: 10,
      FRI: 20,
      CRI: 85,
    },

  ],


  goals: [

    {
      university:
        "Đại học Bách khoa Hà Nội",

      major:
        "Công nghệ thông tin",

      country:
        "Vietnam",

      targetYear:
        2026,
    },

  ],


  achievements: [
    "Học sinh giỏi cấp trường",
  ],


  financial: {

    yearlyBudget:
      80000000,

    scholarshipRequired:
      true,

    familySupportLevel:
      "MEDIUM",

  },


  targetUniversities: [

    "Đại học Bách khoa Hà Nội",

    "Đại học Bách khoa TP.HCM",

  ],


  targetMajors: [

    "Công nghệ thông tin",

    "Khoa học dữ liệu",

  ],
};