set -e
echo 'COMMAND npm run test:cp31:batch13'
npm run test:cp31:batch13
echo 'COMMAND npm run test:cp31:batch14'
npm run test:cp31:batch14
echo 'COMMAND npm run test:cp31:batch15'
npm run test:cp31:batch15
echo 'COMMAND npm run test:cp31:batch16'
npm run test:cp31:batch16
echo 'COMMAND npm run test:cp31:batch17'
npm run test:cp31:batch17
echo 'COMMAND npm run test:cp32:cutoffs'
npm run test:cp32:cutoffs
echo 'COMMAND npm run test:cp32:decision'
npm run test:cp32:decision
echo 'COMMAND npm run test:cp32:national'
npm run test:cp32:national
echo 'COMMAND npm run test:cp32:discovery'
npm run test:cp32:discovery
echo 'COMMAND npm run test:cp32:personal'
npm run test:cp32:personal
echo 'COMMAND npm run test:cp32:public-search'
npm run test:cp32:public-search
echo 'COMMAND node --experimental-strip-types --test tests/cp33-external-ml-evidence.test.mjs'
node --experimental-strip-types --test tests/cp33-external-ml-evidence.test.mjs