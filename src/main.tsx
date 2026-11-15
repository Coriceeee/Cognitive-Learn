import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './lib/firebase';
import { revokeForeignPushOwner } from './lib/companionWebPush';
// Prevent a shared browser from retaining an old student's push subscription after a switch.
onAuthStateChanged(auth, user => {void revokeForeignPushOwner(user?.uid ?? '').catch(() => {});});
import './styles.css';
ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode><App /></React.StrictMode>);
