# CLA CP37 — Start here

CP37 inherits CP36 and adds an in-product operating guide at:

- `/student/guide`

The guide is linked from the Student Dashboard and `/student/modules`.

## If you want to demo the system now

Use an Admin account with `role=admin` and `active=true`:

1. Open `/student/profile?from=admin`.
2. Click **Nạp hồ sơ demo 3 năm**.
3. Review the synthetic profile and grades.
4. Click **Lưu hồ sơ học tập**.
5. Follow the workflow in `/student/guide`: Seed → Lumen → Orion → Atlas → Haven → Pulse.

The preset is synthetic and is saved only under the Admin's own account with `dataScope=demo`. Do not present it as a real student record or research outcome.

## If you are using a real Student account

1. Open `/student/guide`.
2. Start at `/student/profile`.
3. Enter real data and leave unknown values blank.
4. Save the profile and transcript.
5. Open Lumen, Orion, Atlas and Haven as needed.
6. Pulse currently requires manual report inputs; it is not yet a fully automatic closed-loop monitor.

## Commands

```powershell
npm ci
npm run verify:cp37:static
npm run build
npm run dev
```

`npm test`/build passing means the code gates pass. It does not mean every module has real data or all cross-module workflows are complete. Read `CP37_OPERATIONAL_AUDIT_20261111.md` before presenting the demo.
