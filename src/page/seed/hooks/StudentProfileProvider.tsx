/** One live, server-confirmed student profile subscription per authorized app shell.
 * Do not persist this state outside React. The provider unmounts whenever
 * AccessGate stops rendering authorized children (logout, denial, consent).
 */
import { createContext, useContext, type ReactNode } from 'react';
import { useStudentProfile } from './useStudentProfile';

type VerifiedProfile = ReturnType<typeof useStudentProfile>;
const Context = createContext<VerifiedProfile | null>(null);

export function StudentProfileProvider({children}: {children: ReactNode}) {
  const verified = useStudentProfile();
  return <Context.Provider value={verified}>{children}</Context.Provider>;
}

/** Reuses the same subscription between Seed, Lumen and other student modules. */
export function useVerifiedStudentProfile(): VerifiedProfile {
  const state = useContext(Context);
  if (!state) throw new Error('Student profile view requires authorized StudentProfileProvider');
  return {
    ...state,
    // Admin preview is a URL-specific flag, unlike verified profile data.
    isAdminPreview: new URLSearchParams(window.location.search).get('from') === 'admin',
  };
}
