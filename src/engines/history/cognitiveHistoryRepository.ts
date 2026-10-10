import {
  collection,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
} from "firebase/firestore";

import { db } from "../../lib/firebase";

import {
  createCognitiveSnapshot,
} from "./cognitiveHistoryEngine";

import type {
  CognitiveHistoryInput,
  CognitiveSnapshot,
} from "./cognitiveHistoryTypes";

const PROFILE_COLLECTION = "learning_profiles";
const HISTORY_COLLECTION = "cognitive_history";

function historyCollection(studentId: string) {
  return collection(
    db,
    PROFILE_COLLECTION,
    studentId,
    HISTORY_COLLECTION
  );
}

function normalizeTimestamp(value: unknown) {
  if (value instanceof Timestamp) {
    return value.toDate().toISOString();
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof value === "string") {
    return value;
  }

  return new Date().toISOString();
}

function normalizeSnapshot(
  data: Record<string, unknown>,
  id: string
): CognitiveSnapshot {
  return {
    ...(data as CognitiveSnapshot),
    id,
    createdAt: normalizeTimestamp(data.createdAt),
  };
}

export async function saveCognitiveSnapshot(
  input: CognitiveHistoryInput
): Promise<CognitiveSnapshot> {
  const snapshot = createCognitiveSnapshot(input);

  const reference = doc(
    historyCollection(input.studentId),
    snapshot.id
  );

  await setDoc(reference, {
    ...snapshot,
    createdAt: serverTimestamp(),
  });

  return snapshot;
}

export async function getCognitiveHistory(
  studentId: string
): Promise<CognitiveSnapshot[]> {
  const historyQuery = query(
    historyCollection(studentId),
    orderBy("createdAt", "desc")
  );

  const result = await getDocs(historyQuery);

  return result.docs.map((item) =>
    normalizeSnapshot(item.data(), item.id)
  );
}

export async function getLatestCognitiveSnapshot(
  studentId: string
): Promise<CognitiveSnapshot | null> {
  const historyQuery = query(
    historyCollection(studentId),
    orderBy("createdAt", "desc"),
    limit(1)
  );

  const result = await getDocs(historyQuery);

  if (result.empty) {
    return null;
  }

  const item = result.docs[0];

  return normalizeSnapshot(
    item.data(),
    item.id
  );
}
