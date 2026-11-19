/** CP29/B3/K15. Pure, fail-closed policy for optional privileged account operations. */
export class AdminAccountError extends Error {
  constructor(code) { super(code); this.code = code; this.name = 'AdminAccountError'; }
}
const reject = code => { throw new AdminAccountError(code); };
const roles = new Set(['student']);
const legacyRoles = new Set(['teacher', 'parent']);
const actions = new Set(['inspect', 'set-active', 'set-role']);
const uidPattern = /^[A-Za-z0-9_-]{6,128}$/;
const requestPattern = /^[A-Za-z0-9_-]{8,80}$/;
const ticketPattern = /^[A-Za-z0-9][A-Za-z0-9_.:/-]{5,79}$/;

export function parseAdminOperation(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) reject('INVALID_REQUEST');
  const { action, targetUid, requestId, ticket, active, role } = value;
  const allowed = action === 'set-active'
    ? ['action', 'targetUid', 'requestId', 'ticket', 'active']
    : action === 'set-role'
      ? ['action', 'targetUid', 'requestId', 'ticket', 'role']
      : ['action', 'targetUid', 'requestId', 'ticket'];
  if (!actions.has(action) || Object.keys(value).some(key => !allowed.includes(key))) reject('INVALID_REQUEST');
  if (typeof targetUid !== 'string' || !uidPattern.test(targetUid)) reject('INVALID_UID');
  if (typeof requestId !== 'string' || !requestPattern.test(requestId)) reject('INVALID_REQUEST_ID');
  if (typeof ticket !== 'string' || !ticketPattern.test(ticket)) reject('INVALID_TICKET');
  if (action === 'set-active' && typeof active !== 'boolean') reject('INVALID_ACTIVE');
  if (action === 'set-role' && !roles.has(role)) reject('INVALID_ROLE');
  return { action, targetUid, requestId, ticket, ...(action === 'set-active' ? { active } : {}),
    ...(action === 'set-role' ? { role } : {}) };
}

/** Require an independently provisioned operator claim AND server UID allowlist AND MFA. */
export function authorizeAdminOperator({ actorUid, claims, actor, enabled, allowlist, nowSeconds }) {
  if (enabled !== 'true') reject('FEATURE_DISABLED');
  if (!actorUid || typeof actorUid !== 'string' || !uidPattern.test(actorUid)) reject('UNAUTHENTICATED');
  if (!Array.isArray(allowlist) || !allowlist.includes(actorUid)) reject('OPERATOR_NOT_ALLOWLISTED');
  if (!claims || claims.uid !== actorUid || claims.claOperator !== true) reject('OPERATOR_CLAIM_REQUIRED');
  if (typeof claims.firebase?.sign_in_second_factor !== 'string' || !claims.firebase.sign_in_second_factor) reject('MFA_REQUIRED');
  if (typeof claims.auth_time !== 'number' || !Number.isFinite(claims.auth_time)
    || claims.auth_time > nowSeconds + 30 || nowSeconds - claims.auth_time > 300) reject('RECENT_AUTH_REQUIRED');
  if (!actor || actor.role !== 'admin' || actor.active !== true) reject('ADMIN_PROFILE_REQUIRED');
  return true;
}

/** Firebase Admin SDK adapter is injected for deterministic policy/transaction tests. */
export async function performAdminAccountOperation({ db, claims, input, enabled, allowlist, nowSeconds, timestamp }) {
  const command = parseAdminOperation(input);
  if (claims?.uid === command.targetUid) reject('SELF_CHANGE_DENIED');
  // Fail closed before the first database read if privileged controls are disabled.
  if (enabled !== 'true' || !Array.isArray(allowlist) || !allowlist.includes(claims?.uid)) reject('FEATURE_DISABLED_OR_NOT_ALLOWLISTED');
  const actorRef = db.doc(`users/${claims.uid}`);
  const targetRef = db.doc(`users/${command.targetUid}`);
  const auditRef = db.doc(`admin_account_audit/${command.requestId}`);
  return db.runTransaction(async transaction => {
    const [actorSnap, targetSnap, auditSnap] = await Promise.all([
      transaction.get(actorRef), transaction.get(targetRef), transaction.get(auditRef),
    ]);
    authorizeAdminOperator({actorUid:claims.uid, claims, actor:actorSnap.exists ? actorSnap.data() : null,
      enabled, allowlist, nowSeconds});
    if (!targetSnap.exists) reject('TARGET_NOT_FOUND');
    const old = targetSnap.data();
    if (!old || (!roles.has(old.role) && !legacyRoles.has(old.role)) || typeof old.active !== 'boolean') reject('TARGET_NOT_MANAGEABLE');
    if (legacyRoles.has(old.role) && command.action === 'set-active' && command.active) reject('LEGACY_ROLE_RETIRED');
    if (auditSnap.exists) {
      const prior = auditSnap.data();
      if (prior?.actorUid !== claims.uid || prior?.targetUid !== command.targetUid ||
          prior?.action !== command.action || prior?.ticket !== command.ticket ||
          (command.action === 'set-active' && prior?.after?.active !== command.active) ||
          (command.action === 'set-role' && prior?.after?.role !== command.role)) reject('REQUEST_ID_CONFLICT');
      return {status:'already-applied', requestId:command.requestId, targetUid:command.targetUid,
        role:old.role, active:old.active};
    }
    let nextRole = old.role;
    let nextActive = old.active;
    if (command.action === 'set-active') nextActive = command.active;
    if (command.action === 'set-role') nextRole = command.role;
    if (command.action !== 'inspect' && nextRole === old.role && nextActive === old.active) reject('NO_CHANGE');
    if (command.action === 'set-active') transaction.update(targetRef, {active: nextActive});
    if (command.action === 'set-role') transaction.update(targetRef, {role: nextRole});
    transaction.create(auditRef, {
      schemaVersion:1, action:command.action, actorUid:claims.uid, targetUid:command.targetUid,
      ticket:command.ticket, at:timestamp, before:{role:old.role,active:old.active},
      after:{role:nextRole,active:nextActive},
    });
    return {status:command.action === 'inspect' ? 'inspected' : 'updated', requestId:command.requestId,
      targetUid:command.targetUid, role:nextRole, active:nextActive};
  });
}
