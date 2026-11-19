set -e
echo 'COMMAND node tests/academic.test.cjs'
node tests/academic.test.cjs
echo 'COMMAND node tests/cognitive-observation.test.cjs'
node tests/cognitive-observation.test.cjs
echo 'COMMAND node tests/admin-deeplink.test.cjs'
node tests/admin-deeplink.test.cjs
echo 'COMMAND node tests/module-hierarchy.test.cjs'
node tests/module-hierarchy.test.cjs
echo 'COMMAND node tests/cp35-p0-p1-contract.test.cjs'
node tests/cp35-p0-p1-contract.test.cjs
echo 'COMMAND node tests/ux-v7.test.cjs'
node tests/ux-v7.test.cjs
echo 'COMMAND node tests/student-role-isolation.test.cjs'
node tests/student-role-isolation.test.cjs
echo 'COMMAND node --experimental-strip-types --test tests/pipeline-evidence.test.mjs tests/pipeline-evidence-record.test.mjs'
node --experimental-strip-types --test tests/pipeline-evidence.test.mjs tests/pipeline-evidence-record.test.mjs
echo 'COMMAND node --experimental-strip-types --test tests/admissions-and-chat.test.mjs'
node --experimental-strip-types --test tests/admissions-and-chat.test.mjs
echo 'COMMAND node --test tests/chat-launcher-mascot.test.cjs'
node --test tests/chat-launcher-mascot.test.cjs
echo 'COMMAND node --test tests/cp29-release-contract.test.cjs'
node --test tests/cp29-release-contract.test.cjs
echo 'COMMAND node --test tests/cp30-chat-readability.test.cjs'
node --test tests/cp30-chat-readability.test.cjs