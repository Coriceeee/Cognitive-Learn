import { inspectModuleInputs, type ReadinessGroup } from "../../lib/moduleInputReadiness";

/** No inferred outcomes: this chart shows *field coverage* only. */
export default function ModuleInputObservatory({
  moduleName, groups, editHref, resultHref, resultLabel, canSimulate, note,
}: {
  moduleName: "Orion" | "Pulse" | "Haven";
  groups: ReadinessGroup[];
  editHref: string;
  resultHref: string;
  resultLabel: string;
  canSimulate: boolean;
  note: string;
}) {
  const data = inspectModuleInputs(groups);
  const pct = data.total ? Math.round(data.ready / data.total * 100) : 0;
  return <section className="cla-input-observatory" aria-label={`Tình trạng nhập dữ liệu ${moduleName}`}>
    <div className="cla-input-observatory-head">
      <div>
        <span className="cla-input-observatory-eyebrow">DATA COVERAGE / {moduleName.toUpperCase()}</span>
        <h2>Đường tín hiệu dữ liệu của bạn</h2>
        <p>Biểu đồ đếm ô đã nhập hợp lệ, không đo năng lực và không phải kết quả của AI.</p>
      </div>
      <div className="cla-input-observatory-total" aria-label={`${data.ready} trên ${data.total} trường đã nhập hợp lệ`}>
        <strong>{data.ready}<span>/{data.total}</span></strong>
        <small>ô có dữ liệu hợp lệ</small>
      </div>
    </div>
    <div className="cla-input-observatory-track" role="meter" aria-valuemin={0} aria-valuemax={data.total} aria-valuenow={data.ready} aria-label="Số trường dữ liệu đã nhập hợp lệ">
      <span className="cla-input-observatory-track-ready" style={{ width: `${pct}%` }}/>
    </div>
    <div className="cla-input-observatory-groups" aria-label="Tình trạng từng nhóm dữ liệu">
      {data.groups.map(group => <div key={group.key} className="cla-input-observatory-row">
        <div className="cla-input-observatory-row-head"><strong>{group.title}</strong><span>{group.ready}/{group.total} ô hợp lệ</span></div>
        <div className="cla-input-observatory-segments" role="img" aria-label={`${group.title}: ${group.ready} hợp lệ, ${group.missing} còn trống, ${group.invalid} cần sửa`}>
          {group.fields.map(field => <span key={field.key} className={`is-${field.state}`} title={`${field.label}: ${field.state === "ready" ? "đã nhập hợp lệ" : field.state === "invalid" ? "dữ liệu chưa hợp lệ" : "chưa nhập"}`} aria-hidden="true" />)}
        </div>
      </div>)}
    </div>
    <div className="cla-input-observatory-bottom">
      <div className="cla-input-observatory-legend" aria-label="Chú giải biểu đồ">
        <span><i className="is-ready" /> Đã nhập</span><span><i className="is-missing" /> Còn trống</span><span><i className="is-invalid" /> Cần sửa</span>
      </div>
      <p className="cla-input-observatory-state" role="status">{data.invalid > 0
        ? `${data.invalid} giá trị ngoài phạm vi cho phép cần sửa.`
        : canSimulate ? "Đã có đầu vào để xem kết quả mô phỏng theo giả định."
        : data.ready ? "Đã có dữ liệu bước đầu; vẫn thiếu điều kiện để lập kết quả."
        : "Chưa có dữ liệu đầu vào; bắt đầu từ biểu mẫu của bạn."}</p>
      <div className="cla-input-observatory-actions">
        <a className="cla-input-observatory-primary" href={editHref}>{data.ready ? "Bổ sung / chỉnh dữ liệu" : "Bắt đầu nhập dữ liệu"} <span aria-hidden="true">→</span></a>
        {canSimulate && <a href={resultHref}>{resultLabel} <span aria-hidden="true">↗</span></a>}
      </div>
      <p className="cla-input-observatory-note">{note}</p>
    </div>
  </section>;
}
