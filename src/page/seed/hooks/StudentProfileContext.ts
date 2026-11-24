import { createContext, useContext } from 'react';

export type VerifiedAppState =
  ReturnType<typeof import('./useStudentProfile').useStudentProfile> & {
    transcript: ReturnType<typeof import('./useStudentTranscript').useStudentTranscript>;
  };

export const StudentProfileContext = createContext<VerifiedAppState | null>(null);

export function useOptionalVerifiedStudentProfile(): (VerifiedAppState & {isAdminPreview: boolean}) | null {
  const state = useContext(StudentProfileContext);
  if (!state) return null;
  return {
    ...state,
    isAdminPreview: new URLSearchParams(window.location.search).get('from') === 'admin',
  };
}

export function useVerifiedStudentProfile(): VerifiedAppState & {isAdminPreview: boolean} {
  const state = useOptionalVerifiedStudentProfile();
  if (!state) throw new Error('Student profile view requires authorized StudentProfileProvider');
  return state;
}
