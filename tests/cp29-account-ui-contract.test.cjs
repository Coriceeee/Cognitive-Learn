const test=require('node:test'); const assert=require('node:assert/strict');
const fs=require('node:fs'); const path=require('node:path');
const root=path.resolve(__dirname,'..');const read=p=>fs.readFileSync(path.join(root,p),'utf8');
test('CP29-B1-01 password reset uses Firebase Auth and never guesses Admin privileges',()=>{
  const login=read('src/page/auth/LoginPage.tsx');
  assert.match(login,/sendPasswordResetEmail\(auth, address\)/);
  assert.match(login,/Quên mật khẩu\? Gửi email khôi phục/);
  assert.match(login,/role: UserRole = "student"/);
  assert.match(login,/role === "admin" \? "\/admin"/);
  assert.doesNotMatch(login,/setDoc\(.*role:\s*['"]admin/s);
});
test('CP29-B1-02 password reset UI returns generic acknowledgment',()=>{
  const login=read('src/page/auth/LoginPage.tsx');
  assert.match(login,/Nếu tài khoản email này tồn tại/);
  assert.match(login,/auth\/too-many-requests/);
  assert.match(login,/normalizeEmail\(email\)/);
});
test('CP29-K15-24 optional backend is not in default firebase config',()=>{
  assert.doesNotMatch(read('firebase.json'),/functions-admin|cla-admin-operations/);
  assert.match(read('firebase.admin-optional.json'),/cla-admin-operations/);
  assert.match(read('functions-admin/.env.example'),/CLA_ADMIN_ACCOUNTS_ENABLED=false/);
  assert.match(read('.gitignore'),/functions-admin\/\.env/);
});
test('CP29-K15-25 role Management is never accessible as student business route',()=>{
  const dir=read('src/data/adminConsoleDirectory.ts');
  const diag=read('src/page/nexus/AdminDiagnosticsPage.tsx');
  const gate=read('src/components/common/AccessGate.tsx');
  assert.match(dir,/href: "\/admin\/diagnostics\?view=accounts"/);
  assert.match(diag,/AdminAccountPanel/);
  assert.match(gate,/if \(role === "student"\) return studentAllowedRoutes/);
  assert.match(read('src/page/nexus/AdminAccountPanel.tsx'),/getFunctions\(auth.app, 'asia-southeast1'\)/);
});
test('CP29-B4-01 Demo remains own-UID and explicitly labeled',()=>{
  const rules=read('firestore.rules.CANDIDATE_CP21');
  const admin=read('src/page/nexus/AdminPage.tsx');
  assert.match(rules,/function adminOwnsDemo\(uid\)/);
  assert.match(rules,/request.auth.uid == uid && activeRole\('admin'\)/);
  assert.match(rules,/adminOwnsDemo\(uid\) \? 'demo' : 'student'/);
  assert.match(admin,/không giả lập danh tính/);
});
