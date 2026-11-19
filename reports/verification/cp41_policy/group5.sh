set -e
echo 'COMMAND node --experimental-strip-types --test tests/cp33-cognitive-readiness.test.mjs'
node --experimental-strip-types --test tests/cp33-cognitive-readiness.test.mjs
echo 'COMMAND npm run test:cp34:knowledge-xai'
npm run test:cp34:knowledge-xai
echo 'COMMAND npm run test:cp34:career-decision'
npm run test:cp34:career-decision
echo 'COMMAND npm run test:cp34:adaptive-decision'
npm run test:cp34:adaptive-decision
echo 'COMMAND npm run test:cp36:adaptive-lineage'
npm run test:cp36:adaptive-lineage
echo 'COMMAND npm run test:cp37-38:dynamic'
npm run test:cp37-38:dynamic
echo 'COMMAND npm run test:cp39-41:bayes'
npm run test:cp39-41:bayes
echo 'COMMAND npm run test:chart-first'
npm run test:chart-first
echo 'COMMAND npm run test:cp40:allocation'
npm run test:cp40:allocation
echo 'COMMAND npm run test:cp40:student-only'
npm run test:cp40:student-only
echo 'COMMAND npm run test:cp41:policy'
npm run test:cp41:policy