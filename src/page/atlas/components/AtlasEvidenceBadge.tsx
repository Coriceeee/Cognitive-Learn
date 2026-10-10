import type {
  AtlasEvidenceStatus,
} from "../../../lib/atlasAdmissionEvidence";

type Props = {
  status: AtlasEvidenceStatus;
};

const labels: Record<
  AtlasEvidenceStatus,
  string
> = {
  VERIFIED:
    "Verified source",

  PENDING:
    "Pending verification",

  MISSING:
    "Missing source",

  REJECTED:
    "Rejected source",
};

export default function AtlasEvidenceBadge({
  status,
}: Props) {
  return (
    <span
      className={`atlas-evidence-badge is-${status.toLowerCase()}`}
      title={labels[status]}
    >
      {labels[status]}
    </span>
  );
}