import {
  admissionMethodLabels,
  getProgramSources,
  getProgramVerification,
  getStatusClass,
  getStatusLabel,
  type AtlasAdmissionSource,
  type AtlasProgram,
  type AtlasUniversity,
} from "../../../lib/atlasKnowledgeBase";

type AtlasProgramCardProps = {
  program: AtlasProgram;
  university?: AtlasUniversity;
  sources: AtlasAdmissionSource[];
};

function getDisplayValue(value?: string) {
  if (!value || value.trim() === "") return "Chưa có dữ liệu";

  const normalized = value.trim().toLowerCase();

  if (
    normalized.includes("chờ xác minh") ||
    normalized.includes("chua xac minh") ||
    normalized.includes("chưa xác minh")
  ) {
    return "Chưa có dữ liệu";
  }

  return value;
}

function getUniversityDisplayName(university?: AtlasUniversity) {
  if (!university) return "ATLAS";

  const shortName = university.shortName?.trim();
  const fullName = university.name?.trim();

  if (!shortName) return fullName || "ATLAS";

  const isMockShortName = ["DMCN", "DMSP", "DMKT"].includes(
    shortName.toUpperCase()
  );

  if (isMockShortName) return fullName || "ATLAS";

  return shortName;
}

function getSourceButtonLabel(source?: AtlasAdmissionSource) {
  if (!source) return "Chưa có link nguồn";

  if (source.sourceUrl) {
    if (source.sourceType === "official_website") return "Xem website chính thức";
    if (source.sourceType === "admission_scheme") return "Xem đề án tuyển sinh";
    if (source.sourceType === "pdf") return "Xem file tuyển sinh";
    return "Xem nguồn tuyển sinh";
  }

  return "Chưa có link nguồn";
}

export default function AtlasProgramCard({
  program,
  university,
  sources,
}: AtlasProgramCardProps) {
  const verification = getProgramVerification(program, sources);
  const programSources = getProgramSources(program, sources);
  const primarySource =
    programSources.find((source) => source.sourceUrl) || programSources[0];

  return (
    <article className="atlas-program-card">
      <div className="atlas-program-top">
        <div>
          <span>{getUniversityDisplayName(university)}</span>
          <h3>{program.majorName || "Ngành chưa xác định"}</h3>
        </div>

        <em className={`atlas-status ${getStatusClass(verification)}`}>
          {getStatusLabel(verification)}
        </em>
      </div>

      <p className="atlas-program-code">
        Mã ngành: {getDisplayValue(program.majorCode)}
      </p>

      {program.combinations.length > 0 ? (
        <div className="atlas-chip-row">
          {program.combinations.map((combination) => (
            <span key={combination}>{combination}</span>
          ))}
        </div>
      ) : (
        <p className="atlas-empty-line">Chưa có dữ liệu tổ hợp xét tuyển</p>
      )}

      {program.methods.length > 0 ? (
        <div className="atlas-method-row">
          {program.methods.map((method) => (
            <span key={method}>{admissionMethodLabels[method] || method}</span>
          ))}
        </div>
      ) : (
        <p className="atlas-empty-line">Chưa có dữ liệu phương thức xét tuyển</p>
      )}

      <div className="atlas-program-info">
        <div>
          <span>Học phí</span>
          <strong>{getDisplayValue(program.tuitionLabel)}</strong>
        </div>

        <div>
          <span>Học bổng</span>
          <strong>{getDisplayValue(program.scholarshipLabel)}</strong>
        </div>

        <div>
          <span>Năm dữ liệu</span>
          <strong>{program.sourceYear || "Chưa có dữ liệu"}</strong>
        </div>
      </div>

      <div className="atlas-program-source">
        <div>
          <span>Nguồn dữ liệu</span>
          <strong>
            {primarySource?.title || "Chưa có nguồn tuyển sinh"}
          </strong>
        </div>

        {primarySource?.sourceUrl ? (
          <a href={primarySource.sourceUrl} target="_blank" rel="noreferrer">
            {getSourceButtonLabel(primarySource)}
          </a>
        ) : (
          <span className="atlas-source-missing">
            {getSourceButtonLabel(primarySource)}
          </span>
        )}
      </div>
    </article>
  );
}