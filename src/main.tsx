import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './lib/firebase';
import { clearExamProjection } from './lib/examProjectionHandoff';
import { advisorDecisionStore } from './lib/advisorDecisionContext';
import { studentDecisionLedger } from './lib/studentDecisionSnapshot';
import { clearAdmissionGoal } from './lib/admissionGoalHandoff';
import { revokeForeignPushOwner } from './lib/companionWebPush';
// Prevent a shared browser from retaining an old student's push subscription after a switch.
let previousSessionUid: string | null | undefined;
onAuthStateChanged(auth, user => {
  const uid = user?.uid ?? null;
  if (previousSessionUid !== uid) { clearExamProjection(); clearAdmissionGoal(); studentDecisionLedger.clear(); advisorDecisionStore.clear(); previousSessionUid = uid; }
  void revokeForeignPushOwner(uid ?? '').catch(() => {});
});
import './styles.css';
ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode><App /></React.StrictMode>);
