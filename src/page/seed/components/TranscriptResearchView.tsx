import type { TranscriptView } from "../services/transcriptData";
import { GRADES, SEMESTERS } from "../services/transcriptData";

type Props = { data: TranscriptView };

function termLabel(grade: string, semester: string) {
  const gradeNumber = GRADES.find((item) => item.key === grade)?.name.replace("Lớp ", "") ?? grade;
  const semesterLabel = SEMESTERS.find((item) => item.key === semester)?.name.replace("Học kỳ ", "HK") ?? semester;
  return `${gradeNumber} · ${semesterLabel}`;
}

export default function TranscriptResearchView({ data }: Props) {
  const width = 820;
  const height = 270;
  const left = 54;
  const right = 24;
  const top = 22;
  const bottom = 54;
  const plotWidth = width - left - right;
  const plotHeight = height - top - bottom;
  const x = (index: number) => left + (data.terms.length <= 1 ? plotWidth / 2 : (index / (data.terms.length - 1)) * plotWidth);
  const y = (value: number) => top + plotHeight - (Math.max(0, Math.min(10, value)) / 10) * plotHeight;
  const points = data.terms.map((term, index) => ({
    term,
    index,
    value: term.summary.gpa ?? term.summary.provisionalAverage,
    complete: term.summary.status === "COMPLETE",
  }));

  const segments: string[] = [];
  let active: string[] = [];
  points.forEach((point) => {
    if (point.value === null) {
      if (active.length > 1) segments.push(active.join(" "));
      active = [];
      return;
    }
    active.push(`${x(point.index).toFixed(1)},${y(point.value).toFixed(1)}`);
  });
  if (active.length > 1) segments.push(active.join(" "));

  const totalCells = data.currentSubjects.length * data.terms.length;
  const observedCells = data.terms.reduce((sum, term) => sum + term.subjects.filter((item) => item.average !== null || item.provisional !== null).length, 0);
  const completeCells = data.terms.reduce((sum, term) => sum + term.subjects.filter((item) => item.average !== null).length, 0);

  return (
    <section className="cla-transcript-research" aria-labelledby="cla-transcript-research-title">
      <div className="cla-transcript-research-head">
        <div><span>SEED PROFILE · ACADEMIC OBSERVATORY</span><h2 id="cla-transcript-research-title">Quỹ đạo học tập 6 học kỳ</h2><p>Đường nối chỉ đi qua các học kỳ có dữ liệu; mốc rỗng là điểm tạm tính, mốc đặc là trung bình học kỳ đủ dữ liệu.</p></div>
        <div className="cla-transcript-coverage"><strong>{observedCells}/{totalCells}</strong><span>ô có dữ liệu</span><em>{completeCells} chính thức</em></div>
      </div>

      <div className="cla-transcript-trajectory-wrap">
        <svg className="cla-transcript-trajectory" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Quỹ đạo điểm trung bình qua sáu học kỳ từ lớp 10 đến lớp 12">
          {[0, 2, 4, 6, 8, 10].map((tick) => (
            <g key={tick}>
              <line x1={left} y1={y(tick)} x2={width - right} y2={y(tick)} className="cla-transcript-gridline" />
              <text x={left - 12} y={y(tick) + 4} textAnchor="end" className="cla-transcript-tick">{tick}</text>
            </g>
          ))}
          <line x1={left} y1={top + plotHeight} x2={width - right} y2={top + plotHeight} className="cla-transcript-axis" />
          {segments.map((segment, index) => <polyline key={index} points={segment} className="cla-transcript-line" />)}
          {points.map((point) => {
            if (point.value === null) return null;
            const cx = x(point.index);
            const cy = y(point.value);
            return (
              <g key={`${point.term.grade}-${point.term.semester}`}>
                <circle cx={cx} cy={cy} r="7" className={point.complete ? "cla-transcript-dot is-complete" : "cla-transcript-dot is-provisional"}>
                  <title>{termLabel(point.term.grade, point.term.semester)}: {point.value.toFixed(2)}{point.complete ? " · đủ dữ liệu" : " · tạm tính"}</title>
                </circle>
                <text x={cx} y={cy - 13} textAnchor="middle" className="cla-transcript-point-value">{point.value.toFixed(2)}</text>
              </g>
            );
          })}
          {points.map((point) => <text key={`label-${point.index}`} x={x(point.index)} y={height - 22} textAnchor="middle" className="cla-transcript-x-label">{termLabel(point.term.grade, point.term.semester)}</text>)}
        </svg>
      </div>

      <div className="cla-transcript-heatmap-head"><div><span>SUBJECT × SEMESTER</span><strong>Dấu vân tay điểm theo môn</strong></div><small>Thang điểm 0–10 · ô trống = chưa có dữ liệu</small></div>
      <div className="cla-transcript-heatmap-scroll">
        <table className="cla-transcript-heatmap">
          <thead><tr><th>Môn học</th>{data.terms.map((term) => <th key={`${term.grade}-${term.semester}`}>{termLabel(term.grade, term.semester)}</th>)}</tr></thead>
          <tbody>
            {data.currentSubjects.map((subject) => (
              <tr key={subject}>
                <th scope="row">{subject}</th>
                {data.terms.map((term) => {
                  const item = term.subjects.find((row) => row.subject === subject);
                  const score = item?.average ?? item?.provisional ?? null;
                  const isComplete = item?.average !== null && item?.average !== undefined;
                  const opacity = score === null ? 0 : 0.05 + (Math.max(0, Math.min(10, score)) / 10) * 0.24;
                  return (
                    <td key={`${subject}-${term.grade}-${term.semester}`}>
                      {score === null ? <span className="is-missing">—</span> : (
                        <span className={isComplete ? "is-complete" : "is-provisional"} style={{ backgroundColor: `rgba(37, 99, 235, ${opacity})` }} title={`${subject} · ${termLabel(term.grade, term.semester)} · ${score.toFixed(2)}${isComplete ? " · đủ dữ liệu" : " · tạm tính"}`}>
                          {score.toFixed(1)}{isComplete ? "" : "~"}
                        </span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="cla-transcript-research-note">Dữ liệu được đọc từ kho bảng điểm của tài khoản hiện tại. Màu đậm hơn biểu thị điểm số cao hơn trên cùng thang 10, không phải phân loại năng lực. Dấu ~ biểu thị điểm tạm tính; không phải học bạ được nhà trường xác nhận.</p>
    </section>
  );
}
