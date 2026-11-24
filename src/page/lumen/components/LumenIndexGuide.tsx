import type { CognitiveResult } from "../../../engines/cognitive/cognitiveEngine";
import type { CognitiveCode } from "../../../lib/cognitiveAdapter";

type IndexInfo = {
  code: CognitiveCode;
  name: string;
  fullName: string;
  source: string;
  read: string;
  next: string;
  kind: "core" | "combined" | "signal";
};

const INDICES: IndexInfo[] = [
  {
    code: "SCI", name: "Nhất quán học tập", fullName: "Self Coherence Index",
    source: "Độ hoàn thành kế hoạch hoặc mức nhất quán hành động đã cung cấp trong hồ sơ.",
    read: "Cao hơn gợi ý việc thực hiện kế hoạch đều hơn; chưa chứng minh mục tiêu, kế hoạch và hành động hoàn toàn phù hợp.",
    next: "Nếu thấp, hãy thử chia kế hoạch thành các nhiệm vụ nhỏ và ghi nhận mức hoàn thành.", kind: "core",
  },
  {
    code: "MAS", name: "Động lực tự báo cáo", fullName: "Meaning Alignment Score",
    source: "Mức động lực học tập do học sinh tự cung cấp.",
    read: "Cao hơn là mức động lực tự báo cáo cao hơn; chưa đo đầy đủ ý nghĩa học tập hay mức độ kiên trì.",
    next: "Nếu thấp, hãy xem lại mục tiêu gần nhất và lý do muốn theo đuổi mục tiêu đó.", kind: "core",
  },
  {
    code: "CSL", name: "Chiến lược học đang dùng", fullName: "Cognitive Stability Level",
    source: "Thông tin chiến lược học tập trong hồ sơ.",
    read: "Phản ánh biến chiến lược học được cung cấp, chưa đủ để kết luận độ ổn định nhận thức.",
    next: "Chọn một phương pháp ôn tập cụ thể để thử, rồi ghi lại kết quả quan sát được.", kind: "core",
  },
  {
    code: "CRI", name: "Chỉ số tổng hợp", fullName: "Cognitive Reliability Index",
    source: "Nếu không có giá trị CRI trực tiếp và đủ SCI, MAS, CSL: 0,5 × SCI + 0,3 × MAS + 0,2 × CSL.",
    read: "CRI phụ thuộc các chỉ số nền tảng; không phải phép đo độc lập về độ tin cậy hay trí thông minh.",
    next: "Xem ba thành phần SCI, MAS, CSL thay vì chỉ nhìn một con số CRI.", kind: "combined",
  },
  {
    code: "GVI", name: "Biến động mục tiêu", fullName: "Goal Volatility Index",
    source: "Khi có tần suất đổi mục tiêu: số lần đổi mục tiêu × 20, giới hạn trong thang 0–100.",
    read: "Cao hơn là mục tiêu thay đổi nhiều hơn, không tự động có nghĩa là lựa chọn sai.",
    next: "Ghi lại lý do thay đổi mục tiêu và xem mỗi thay đổi có căn cứ mới hay không.", kind: "signal",
  },
  {
    code: "BDI", name: "Biến động thực hiện kế hoạch", fullName: "Behavior Drift Index",
    source: "Chênh lệch tuyệt đối giữa tỷ lệ hoàn thành kế hoạch của hai thời điểm hợp lệ.",
    read: "Cao hơn là thay đổi nhiều hơn, không cho biết sự thay đổi ấy tốt lên hay xấu đi.",
    next: "Đối chiếu cả hai mức hoàn thành và bối cảnh của mỗi lần ghi nhận.", kind: "signal",
  },
  {
    code: "FRI", name: "Tín hiệu cần lưu ý về quá tải", fullName: "Fatigue Risk Index",
    source: "Khi đủ dữ liệu: 0,6 × tỷ lệ bỏ dở nhiệm vụ + 0,4 × tỷ lệ chuyển ngữ cảnh.",
    read: "Cao hơn có thể cho thấy hành vi cần xem xét thêm; không chẩn đoán mệt mỏi hoặc vấn đề sức khỏe.",
    next: "Xem khối lượng việc học và thời gian nghỉ; không dùng chỉ số này để tự chẩn đoán.", kind: "signal",
  },
];

const GROUPS = [
  { label: "03 chỉ báo nền tảng", codes: "SCI · MAS · CSL", text: "Đọc cách bạn tự báo cáo hoặc thực hiện việc học." },
  { label: "01 chỉ số tổng hợp", codes: "CRI", text: "Tổng hợp từ các chỉ báo nền tảng; không độc lập." },
  { label: "03 tín hiệu biến động", codes: "GVI · BDI · FRI", text: "Dùng để đặt câu hỏi và xem thêm bối cảnh, không chấm năng lực." },
] as const;

export default function LumenIndexGuide({ cognitive, compact = false }: { cognitive: CognitiveResult; compact?: boolean }) {
  const actual = new Map((cognitive.dimensions ?? []).filter(
    item => item.available === true && Number.isFinite(item.value)
  ).map(item => [item.code, item.value] as const));
  const measured = INDICES.filter(item => actual.has(item.code)).length;

  return (
    <section className={`lumen-guide ${compact ? "lumen-guide--compact" : ""}`} aria-labelledby="lumen-guide-title">
      <header className="lumen-guide-header">
        <div>
          <span className="lumen-eyebrow">HƯỚNG DẪN ĐỌC KẾT QUẢ</span>
          <h2 id="lumen-guide-title">7 chỉ số này thực sự nói điều gì?</h2>
          <p><strong>Chỉ nhập điểm môn học là chưa đủ.</strong> LUMEN đọc dữ liệu về kế hoạch, động lực, cách học và những lần thay đổi mà bạn cung cấp ở SEED. Hệ thống áp dụng công thức thử nghiệm để đưa ra 7 chỉ báo, <strong>không phải 7 loại trí thông minh</strong>.</p>
        </div>
        <div className="lumen-guide-coverage" aria-label={`${measured} trên 7 chỉ báo có dữ liệu`}>
          <strong>{measured}/7</strong><span>có dữ liệu</span>
        </div>
      </header>

      <div className="lumen-guide-groups" aria-label="Ba nhóm chỉ số Lumen">
        {GROUPS.map(group => <div className="lumen-guide-group" key={group.codes}>
          <span>{group.label}</span><strong>{group.codes}</strong><p>{group.text}</p>
        </div>)}
      </div>

      {compact ? (
        <div className="lumen-guide-footer">
          <p><strong>Muốn biết con số lấy từ đâu?</strong> Xem ý nghĩa từng chỉ số, mức dữ liệu hiện có và cách tính minh họa.</p>
          <a href="/lumen/indices">Xem đủ 7 chỉ số <span aria-hidden="true">↗</span></a>
        </div>
      ) : (<>
      <h3 className="lumen-guide-subtitle">Đọc từng chỉ số trong hồ sơ của bạn</h3>
      <div className="lumen-guide-glossary">
        {INDICES.map(item => {
          const value = actual.get(item.code);
          const available = value !== undefined;
          return <article key={item.code} className={`lumen-guide-metric lumen-guide-metric--${item.kind}`}>
            <div className="lumen-guide-metric-top">
              <div><strong>{item.code} · {item.name}</strong><small>{item.kind === "combined" ? "Tính tổng hợp theo quy tắc" : item.kind === "signal" ? "Dấu hiệu cần đọc theo bối cảnh" : "Từ dữ liệu học tập đã cung cấp"}</small></div>
              <span className={available ? "has-data" : "no-data"}>{value !== undefined ? `${Math.round(value)}/100` : "Chưa có dữ liệu"}</span>
            </div>
            <p className="lumen-guide-explain">{item.read}</p>
            <details className="lumen-guide-metric-details">
              <summary>Nguồn tính và việc nên thử</summary>
              <p><b>Dữ liệu/cách tính:</b> {item.source}</p>
              <p><b>Ghi chú từ bộ tính:</b> {cognitive.vector?.derivationNotes?.[item.code] ?? "Chưa có ghi chú nguồn cho lần tính này; đối chiếu dữ liệu ở SEED."}</p>
              <p><b>Tên viết đầy đủ:</b> {item.fullName} (thuật ngữ chuyên môn).</p>
              <p><b>Bước tiếp theo:</b> {item.next}</p>
            </details>
          </article>;
        })}
      </div>

      <div className="lumen-guide-interpretation" role="note">
        <strong>Đọc đúng chiều:</strong> SCI, MAS, CSL và CRI là các chỉ báo quy tắc; GVI, BDI, FRI phản ánh biến động hoặc tín hiệu cần xem xét. <strong>Không có quy tắc “càng cao càng tốt” cho cả 7 chỉ số.</strong> Giá trị 0 có dữ liệu khác với ô “Chưa có dữ liệu”. Dữ liệu đã có không chứng minh nó là dữ liệu thực hay demo: hãy xác nhận nguồn trong SEED.
      </div>

      <details className="lumen-guide-details">
        <summary>Vì sao còn có “điểm tổng hợp /100”? Xem ví dụ tính</summary>
        <p>Điểm tổng hợp hiện tại = 0,3 × SCI + 0,25 × MAS + 0,2 × CSL + 0,25 × CRI (làm tròn). Vì CRI đã dùng SCI/MAS/CSL nên đây <strong>không phải bốn phép đo độc lập</strong>.</p>
        <p><b>Ví dụ minh họa, không phải điểm của bạn:</b> SCI = 80, MAS = 70, CSL = 60. Khi CRI được suy ra từ ba giá trị này, CRI = 73; điểm tổng hợp = 72/100. Các trọng số chưa được kiểm định tâm trắc.</p>
        <p>Nếu hồ sơ đã lưu một giá trị CRI trực tiếp, engine hiện ưu tiên giá trị đó. Không suy đoán công thức CRI của hồ sơ khi chưa xác minh nguồn nhập.</p>
      </details>
      <details className="lumen-guide-details">
        <summary>Khi nào LUMEN so sánh được sự tiến bộ?</summary>
        <p>Cần tối thiểu hai lần ghi nhận hợp lệ và điều kiện so sánh tương thích. GVI hoặc BDI cao không đủ kết luận học tốt lên hay xấu đi; kết quả so sánh không chứng minh thay đổi do CLA gây ra.</p>
      </details>
      <div className="lumen-guide-footer">
        <p><strong>Muốn hiểu kết quả?</strong> Kiểm tra dữ liệu bạn đã nhập trong SEED; sau đó đọc từng chỉ số và theo dõi thay đổi trong PULSE. Không nhập số giả chỉ để đạt 7/7. Gemini chỉ giúp giải thích, không tự đo trí thông minh.</p>
        <a href="/student/profile">Kiểm tra hồ sơ SEED <span aria-hidden="true">↗</span></a>
      </div>
      </>)}
    </section>
  );
}
