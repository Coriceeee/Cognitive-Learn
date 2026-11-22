import type { ReactNode } from 'react';
import type { ModuleUiTone } from '../../lib/moduleUiStatus';

/** One compact, readable state language across student modules. Not a measurement. */
export default function ModuleStateNotice({tone, label, message, children, compact = false}: {
  tone: ModuleUiTone;
  label: string;
  message: string;
  children?: ReactNode;
  compact?: boolean;
}) {
  return <div className={`cla-module-state is-${tone}${compact ? ' is-compact' : ''}`}
    role={tone === 'error' ? 'alert' : 'status'} aria-live={tone === 'error' ? 'assertive' : 'polite'}>
    <span className="cla-module-state-icon" aria-hidden="true">{tone === 'success' ? '✓' : tone === 'error' ? '!' : tone === 'warning' ? '!' : tone === 'loading' ? '◌' : '·'}</span>
    <div className="cla-module-state-body">
      <strong className="cla-module-state-label">{label}</strong>
      <p>{message}</p>
      {children && <div className="cla-module-state-actions">{children}</div>}
    </div>
  </div>;
}
