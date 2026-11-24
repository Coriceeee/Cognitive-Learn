/** One live, server-confirmed student profile subscription per authorized app shell.
 * Do not persist this state outside React. The provider unmounts whenever
 * AccessGate stops rendering authorized children (logout, denial, consent).
 */
import type { ReactNode } from 'react';
import { useStudentProfile } from './useStudentProfile';
import { useStudentTranscript } from './useStudentTranscript';
import { StudentProfileContext, type VerifiedAppState } from './StudentProfileContext';
export { useOptionalVerifiedStudentProfile, useVerifiedStudentProfile } from './StudentProfileContext';

export function StudentProfileProvider({children}: {children: ReactNode}) {
  const verified = useStudentProfile();
  const transcript = useStudentTranscript();
  return <StudentProfileContext.Provider value={{...verified, transcript}}>{children}</StudentProfileContext.Provider>;
}

