import ModuleStateNotice from './ModuleStateNotice';
import { resolveDraftUiStatus, type DraftStatusArgs } from '../../lib/moduleUiStatus';

/** Explicit UX only; permissions, CAS, save and conflict recovery remain in useModuleDraft. */
export default function ModuleDraftFeedback(props: DraftStatusArgs) {
  const view = resolveDraftUiStatus(props);
  return <ModuleStateNotice {...view} compact />;
}
