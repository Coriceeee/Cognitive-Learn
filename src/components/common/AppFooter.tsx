import "../../styles.css";

export default function AppFooter() {
  const params = new URLSearchParams(window.location.search);

  const isAdminPreview =
    params.get("from") === "admin" ||
    localStorage.getItem("cla_admin_mode") === "1";

  const adminSuffix = isAdminPreview ? "?from=admin" : "";

  return (
    <footer className="app-footer">
      <div className="app-footer-inner">
        <p>
          © {new Date().getFullYear()} <strong>Cognitive Learn AI</strong>
        </p>

        <nav aria-label="Footer navigation">
          <a href={`/about${adminSuffix}`}>About</a>
          <a href={`/contact${adminSuffix}`}>Contact</a>
        </nav>
      </div>
    </footer>
  );
}