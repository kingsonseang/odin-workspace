import { ImageUpload } from "./ImageUpload";

export default function App() {
  return (
    <main className="page-shell">
      <section className="upload-card" aria-labelledby="app-title">
        <header className="intro">
          <p className="eyebrow">Local preview only</p>
          <h1 id="app-title">Image upload</h1>
          <p className="intro-copy">
            Choose one image to preview it in your browser. Nothing leaves this
            device.
          </p>
        </header>

        <ImageUpload />
      </section>
    </main>
  );
}
