type StudentProfileNoticeModalProps = {
  open: boolean;
  onClose: () => void;
  onCreateProfile: () => void;
};

export default function StudentProfileNoticeModal({
  open,
  onClose,
  onCreateProfile,
}: StudentProfileNoticeModalProps) {
  if (!open) return null;

  return (
    <div className="student-notice-backdrop">
      <div className="student-notice-modal">
        <div className="student-notice-orb">!</div>

        <span>HỒ SƠ HỌC TẬP</span>

        <h2>Chưa có dữ liệu học sinh</h2>

        <p>
          Bạn cần nhập hồ sơ học tập để Cognitive Learn AI bắt đầu phân tích
          điểm số, hành vi học tập, SCI/MAS/CSL và lộ trình cá nhân hóa.
        </p>

        <div className="student-notice-actions">
          <button type="button" onClick={onClose} className="secondary">
            OK
          </button>

          <button type="button" onClick={onCreateProfile}>
            Nhập hồ sơ ngay
          </button>
        </div>
      </div>
    </div>
  );
}