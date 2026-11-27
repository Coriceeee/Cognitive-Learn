import { before, after, beforeEach, test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { initializeTestEnvironment, assertFails, assertSucceeds } from "@firebase/rules-unit-testing";
import { deleteDoc, doc, getDoc, getDocs, collection, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";

const PROJECT_ID = "demo-cla-orion-draft-patch";
const UID = { student: "student_001", other: "student_002", admin: "admin_001" };
const patch = readFileSync(new URL("../firestore.rules.orion-drafts.patch", import.meta.url), "utf8");
let env;

const ref = (db, collectionName, uid) => doc(db, collectionName, uid);
const dbAs = uid => env.authenticatedContext(uid).firestore();
const payload = (uid, revision, targetMajor = "Công nghệ thông tin") => ({
  userId: uid,
  schemaVersion: 1,
  revision,
  data: {
    targetMajor,
    weeksLeft: "",
    scores: { math: "9.25", "seed:Lịch sử": "8.75", "seed:Địa lý": "8.88" },
    targets: { math: "10", literature: "9" },
  },
  updatedAt: serverTimestamp(),
});

before(async () => {
  const host = process.env.FIRESTORE_EMULATOR_HOST;
  assert.ok(host, "STOP: run this test only inside Firebase Firestore Emulator.");
  assert.match(process.env.GCLOUD_PROJECT || process.env.GCP_PROJECT || PROJECT_ID, /^demo-/);
  const [hostname, portText] = host.split(":");
  assert.ok(["127.0.0.1", "localhost"].includes(hostname) && /^\d+$/.test(portText));
  env = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
      host: hostname,
      port: Number(portText),
      rules: `rules_version = '2'; service cloud.firestore { match /databases/{database}/documents { ${patch} } }`,
    },
  });
});

beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async context => {
    const db = context.firestore();
    await Promise.all([
      setDoc(ref(db, "users", UID.student), { active: true, role: "student" }),
      setDoc(ref(db, "users", UID.other), { active: true, role: "student" }),
      setDoc(ref(db, "users", UID.admin), { active: true, role: "admin" }),
      setDoc(ref(db, "student_consents", UID.student), {
        userId: UID.student,
        productAccepted: true,
        noticeVersion: "cla-student-privacy-v1",
      }),
    ]);
  });
});

after(async () => { await env?.cleanup(); });

test("Orion student can create revision 1 and update exactly to revision 2", async () => {
  const db = dbAs(UID.student);
  const draft = ref(db, "orion_drafts", UID.student);
  await assertSucceeds(setDoc(draft, payload(UID.student, 1)));
  const first = await assertSucceeds(getDoc(draft));
  assert.equal(first.data().revision, 1);
  await assertSucceeds(updateDoc(draft, { revision: 2, data: payload(UID.student, 2).data, updatedAt: serverTimestamp() }));
  const second = await assertSucceeds(getDoc(draft));
  assert.equal(second.data().revision, 2);
  assert.equal(second.data().data.targetMajor, "Công nghệ thông tin");
});

test("Orion draft denies missing consent, cross-UID writes, list and delete", async () => {
  const studentDb = dbAs(UID.student);
  const otherDb = dbAs(UID.other);
  await assertFails(setDoc(ref(otherDb, "orion_drafts", UID.other), payload(UID.other, 1)));
  await assertSucceeds(setDoc(ref(studentDb, "orion_drafts", UID.student), payload(UID.student, 1)));
  await assertFails(setDoc(ref(otherDb, "orion_drafts", UID.student), payload(UID.other, 1)));
  await assertFails(getDocs(collection(studentDb, "orion_drafts")));
  await assertFails(deleteDoc(ref(studentDb, "orion_drafts", UID.student)));
});

test("Orion owner can read after consent withdrawal but cannot write again", async () => {
  const db = dbAs(UID.student);
  const draft = ref(db, "orion_drafts", UID.student);
  await assertSucceeds(setDoc(draft, payload(UID.student, 1)));
  await env.withSecurityRulesDisabled(async context => {
    await setDoc(ref(context.firestore(), "student_consents", UID.student), {
      userId: UID.student,
      productAccepted: false,
      noticeVersion: "cla-student-privacy-v1",
    });
  });
  await assertSucceeds(getDoc(draft));
  await assertFails(updateDoc(draft, { revision: 2, updatedAt: serverTimestamp() }));
});

test("Admin can write only their own demo draft without student consent", async () => {
  const db = dbAs(UID.admin);
  await assertSucceeds(setDoc(ref(db, "orion_drafts", UID.admin), payload(UID.admin, 1)));
  await assertFails(setDoc(ref(db, "orion_drafts", UID.student), payload(UID.student, 1)));
});
