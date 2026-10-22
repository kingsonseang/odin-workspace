import { BrowserRouter, Link, Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { SessionProvider } from "./context/SessionContext";
import { ProjectDetailPage } from "./pages/ProjectDetailPage";
import { ProjectListPage } from "./pages/ProjectListPage";

function NotFoundPage() {
  return (
    <div className="page-state">
      <div className="page-state__mark" aria-hidden="true">
        ✳
      </div>
      <h1>This page is not on the board</h1>
      <p>The address may be mistyped, or the page may have moved.</p>
      <Link className="button button--primary" to="/">
        Back to projects
      </Link>
    </div>
  );
}

export default function App() {
  return (
    <SessionProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<ProjectListPage />} />
            <Route
              path="projects/:projectId"
              element={<ProjectDetailPage />}
            />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </SessionProvider>
  );
}
