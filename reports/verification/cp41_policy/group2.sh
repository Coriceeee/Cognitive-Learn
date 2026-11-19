set -e
echo 'COMMAND npm run test:closed-loop'
npm run test:closed-loop
echo 'COMMAND npm run test:journey-reliability'
npm run test:journey-reliability
echo 'COMMAND npm run test:daily-companion'
npm run test:daily-companion
echo 'COMMAND npm run test:companion-push'
npm run test:companion-push
echo 'COMMAND npm run test:aspiration-draft'
npm run test:aspiration-draft
echo 'COMMAND npm run test:exam-calendar'
npm run test:exam-calendar
echo 'COMMAND npm run test:notifications'
npm run test:notifications
echo 'COMMAND npm run test:shadow'
npm run test:shadow
echo 'COMMAND npm run test:consent-share-revocation'
npm run test:consent-share-revocation
echo 'COMMAND npm run test:consent-server-cleanup'
npm run test:consent-server-cleanup
echo 'COMMAND npm run test:cp29:access'
npm run test:cp29:access
echo 'COMMAND npm run test:cp29:routes'
npm run test:cp29:routes