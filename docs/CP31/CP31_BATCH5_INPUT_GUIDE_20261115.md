# CP31 Batch 5 — Định dạng bằng chứng JSON, kiểm toán chỉ đọc

**Cảnh báo:** Trình duyệt chỉ kiểm tra cấu trúc JSON trong phiên Admin hiện tại. Không gửi lên server, không đọc dữ liệu học sinh, không cấp phép xuất bản và không coi dữ liệu tự khai là bằng chứng đã được bên thứ ba xác minh. File gắn `syntheticExampleOnly: true` luôn trả **NOT TESTED** dù các trường khác hợp lệ.

Truy cập `/admin/audit`, mở một trong sáu tác vụ mới, chọn **tệp JSON tối đa 256 KiB** và bấm **Chạy kiểm tra thực tế**. Không nhập mật khẩu, token, CCCD, họ tên, email hay điểm cá nhân. Chỉ dùng mã giả định, dữ liệu aggregate, metadata QA.

Mỗi JSON là một đối tượng với `schema` tương ứng và dữ liệu sau:

| View URL | Schema | Trường bắt buộc |
|---|---|---|
| `atlas-approve` | `cla.nexus.atlas-approval.v1` | `entries`: mỗi mục có `id`, `year`, `sourceUrl` HTTPS, `retrievedAt` yyyy-mm-dd, `contentSha256` 64 hex, `policyVersion`, `state:"approved"`, `review:{reviewerId,at}`, `approval:{reviewerId,at}` với 2 reviewer khác nhau; trạng thái metadata duyệt chỉ **WARN** |
| `orion-policy` | `cla.nexus.orion-policy.v1` | `policy:{id,version,codeVersion,mode:"shadow",trigger:{metric,threshold,minObservations},dose:{hoursPerWeek,maxWeeks},stopRule:{criterion,threshold},humanReview:{required:true,reviewerRole}}` |
| `orion-scenarios` | `cla.nexus.orion-scenarios.v1` | `scenarios` 2–12 bản ghi, mỗi bản `{id,policyVersion,engineVersion,baseline,prediction,horizonWeeks,isSimulation:true,observedOutcome:null}` |
| `pulse-evidence` | `cla.nexus.pulse-evidence.v1` | `records`: `{resultId,inputSnapshotId,engine:{name,version},datasetVersion,featureVersion,modelVersion,recordedDay,evidenceRefs,limitations,output:{value,probability:null,unit},uncertainty:{type:"not_estimated",value:null}}` |
| `pulse-trends` | `cla.nexus.pulse-trends.v1` | `series`: `{metric,scale:"0-10",samples:[{timepoint:"T0",value,observedDay,provenance},... T1,T2]}`, thời gian tăng dần; provenance `student_self_report` hoặc `verified_assessment` (tự khai chưa xác nhận ngoài) |
| `haven-finance` | `cla.nexus.haven-finance.v1` | `estimates`: `{id,currency,tuition,living,travel,fxToVnd,period:"year",scholarship:null,tuitionSourceUrl,tuitionSourceDay,fxSourceUrl,fxSourceDay}`; nếu ghi `scholarship` phải `scholarshipVerified:false` |

Ví dụ **cố ý không phải bằng chứng thực** cho chính sách Orion:

```json
{
  "schema": "cla.nexus.orion-policy.v1",
  "syntheticExampleOnly": true,
  "policy": {
    "id": "QA_POLICY_ONLY", "version": "v1", "codeVersion": "synthetic",
    "mode": "shadow",
    "trigger": {"metric": "SCI", "threshold": 5, "minObservations": 3},
    "dose": {"hoursPerWeek": 2, "maxWeeks": 8},
    "stopRule": {"criterion": "overload", "threshold": 7},
    "humanReview": {"required": true, "reviewerRole": "teacher"}
  }
}
```

Chỉ khi bỏ cờ `syntheticExampleOnly` và dùng dữ liệu metadata kiểm tra riêng trong QA mới chạy được structural audit. **Điều đó vẫn không nâng mức trust**: nguồn tuyển sinh/học bổng/FX cần truy cập official site, các hoạt động phê duyệt cần audit server và chữ ký, Orion/Pulse cần thiết kế nghiên cứu hợp lệ và outcome đo thật, tài chính cần kiểm chứng số liệu theo kỳ.

## Chạy kiểm thử

```powershell
npm ci
npm run test:cp31:batch5
npm run verify:cp31:batch5
npm run test:rules:emulator
npm run verify:cp37
python tools/cp31_browser_e2e.py --check-config
```

`--check-config` **không** mở trình duyệt hoặc chạy 72 ca. Browser real cần website QA và 4 tài khoản synthetic riêng. Không chạy với dữ liệu học sinh thật.
