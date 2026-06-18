import appLogo from "../../../assets/logo cla.png";
import UserMenu from "../../../components/common/UserMenu";

type StudentHeaderProps = {
  isAdminPreview: boolean;
};

export default function StudentHeader({ isAdminPreview }: StudentHeaderProps) {
  return (
    <div className="student-floating-header">
      <div className="student-floating-left">
        <a
          className="student-home-logo"
          href={isAdminPreview ? "/student?from=admin" : "/student"}
          aria-label="Về trang học sinh"
        >
          <img src={appLogo} alt="Cognitive Learn" />
        </a>
      </div>

      <UserMenu />
    </div>
  );
}