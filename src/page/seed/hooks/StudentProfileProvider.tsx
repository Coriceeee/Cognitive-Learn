/** One live, server-confirmed student profile subscription per authorized app shell.
 * Do not persist this state outside React. The provider unmounts whenever
 * AccessGate stops rendering authorized children (logout, denial, consent).
 */
import { createContext, useContext, type ReactNode } from 'react';
import { useStudentProfile } from './useStudentProfile';
import { useStudentTranscript } from './useStudentTranscript';

type VerifiedProfile = ReturnType<typeof useStudentProfile>;
type VerifiedTranscript = ReturnType<typeof useStudentTranscript>;
type VerifiedAppState = VerifiedProfile & { transcript: VerifiedTranscript };
const Context = createContext<VerifiedAppState | null>(null);

export function StudentProfileProvider({children}: {children: ReactNode}) {
  const verified = useStudentProfile();
  const transcript = useStudentTranscript();
  return <Context.Provider value={{...verified, transcript}}>{children}</Context.Provider>;
}

/** Reuses the same subscription between Seed, Lumen and other student modules. */
export function useOptionalVerifiedStudentProfile(): (VerifiedAppState & {isAdminPreview: boolean}) | null {
  const state = useContext(Context);
  if (!state) return null;
  return {
    ...state,
    // Admin preview is a URL-specific flag, unlike verified profile data.
    isAdminPreview: new URLSearchParams(window.location.search).get('from') === 'admin',
  };
}

export function useVerifiedStudentProfile(): VerifiedAppState & {isAdminPreview: boolean} {
  const state = useOptionalVerifiedStudentProfile();
  if (!state) throw new Error('Student profile view requires authorized StudentProfileProvider');
  return state;
}
