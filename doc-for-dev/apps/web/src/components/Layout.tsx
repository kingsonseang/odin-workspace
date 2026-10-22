import { useEffect } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { IdentitySwitcher } from "./IdentitySwitcher";
import { LoadingPage, PageState } from "./PageState";
import { useSession } from "../context/SessionContext";

export function Layout() {
  const { currentUser, isLoading, error, retry } = useSession();
  const location = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [location.pathname]);

  return (
    <div className="app-shell">
      <header className="site-header">
        <div className="site-header__inner">
          <Link className="brand" to="/" aria-label="Forgeboard home">
            <span className="brand__mark" aria-hidden="true">
              F
            </span>
            <span className="brand__name">
              Forgeboard
              <small>Project operations</small>
            </span>
          </Link>
          <IdentitySwitcher />
        </div>
      </header>

      <main className="site-main">
        {isLoading ? (
          <LoadingPage label="Connecting to the workspace…" />
        ) : error ? (
          <PageState
            title="The workspace is unavailable"
            message={error}
            actionLabel="Retry connection"
            onAction={retry}
          />
        ) : !currentUser ? (
          <PageState
            title="No demo identities found"
            message="The workspace returned an empty user directory."
            actionLabel="Retry connection"
            onAction={retry}
          />
        ) : (
          <Outlet />
        )}
      </main>

      <footer className="site-footer">
        <span>Forgeboard</span>
        <span aria-hidden="true">·</span>
        <span>Internal prototype</span>
      </footer>
    </div>
  );
}
