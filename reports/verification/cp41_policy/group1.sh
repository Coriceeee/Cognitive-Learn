set -e
echo 'COMMAND node --experimental-strip-types --test research/tests/closed_loop_replay_demo.test.mjs'
node --experimental-strip-types --test research/tests/closed_loop_replay_demo.test.mjs
echo 'COMMAND node --test tests/scientific-visuals.test.cjs'
node --test tests/scientific-visuals.test.cjs
echo 'COMMAND node --test tests/cp36-p1.test.cjs'
node --test tests/cp36-p1.test.cjs
echo 'COMMAND node --experimental-strip-types --test tests/cp36-source-registry.test.mjs'
node --experimental-strip-types --test tests/cp36-source-registry.test.mjs
echo 'COMMAND node --test tests/cp37-operating-guide.test.cjs'
node --test tests/cp37-operating-guide.test.cjs
echo 'COMMAND node --test tests/atlas-aspiration-policy-2026.test.cjs tests/step06-subject-score-contract.test.cjs tests/step07-admin-auth-recovery.test.cjs'
node --test tests/atlas-aspiration-policy-2026.test.cjs tests/step06-subject-score-contract.test.cjs tests/step07-admin-auth-recovery.test.cjs
echo 'COMMAND node --test tests/step07-seed-atlas-bridge.test.cjs'
node --test tests/step07-seed-atlas-bridge.test.cjs
echo 'COMMAND node --test tests/step08-subject-optimizer.test.cjs'
node --test tests/step08-subject-optimizer.test.cjs
echo 'COMMAND node --test tests/step09-ptit-official-pathways.test.cjs'
node --test tests/step09-ptit-official-pathways.test.cjs
echo 'COMMAND node --test tests/firestore-security-gate.test.cjs'
node --test tests/firestore-security-gate.test.cjs
echo 'COMMAND npm run test:student-consent'
npm run test:student-consent
echo 'COMMAND npm run test:prediction-safety'
npm run test:prediction-safety