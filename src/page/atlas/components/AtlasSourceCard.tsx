import {
  getSourceTypeLabel,
  getStatusClass,
  getStatusLabel,
  type AtlasAdmissionSource,
  type AtlasUniversity,
} from "../../../lib/atlasKnowledgeBase";

type AtlasSourceCardProps = {
  source: AtlasAdmissionSource;
  university?: AtlasUniversity;
};

export default function AtlasSourceCard({
  source,
  university,
}: AtlasSourceCardProps) {
  const canOpenSource =
    source.sourceUrl.trim() !== "" && source.sourceUrl !== "#";

  return (
    <article className="atlas-source-card">
      <div className="atlas-source-top">
        <span>{getSourceTypeLabel(source.sourceType)}</span>

        <em className={`atlas-status ${getStatusClass(source.status)}`}>
          {getStatusLabel(source.status)}
        </em>
      </div>

      <h3>{source.title}</h3>

      <p>
        {university?.name || "Chưa rõ trường"} · Năm tuyển sinh{" "}
        {source.sourceYear}
      </p>

      <div className="atlas-source-meta">
        <span>Trích xuất: {source.extractedBy}</span>
        <span>Cập nhật: {source.updatedAt}</span>
      </div>

      {canOpenSource ? (
        <a href={source.sourceUrl} target="_blank" rel="noreferrer">
          Mở nguồn
        </a>
      ) : (
        <button type="button" disabled>
          Chưa gắn link nguồn
        </button>
      )}
    </article>
  );
}