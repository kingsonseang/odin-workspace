import { ImageUpload } from './ImageUpload';

export default function App() {
  return (
    <main className="page">
      <div className="shell">
        <header className="intro">
          <p className="eyebrow">Local preview only</p>
          <h1>Try one image</h1>
          <p>
            Choose a single image and check the preview. Nothing is sent anywhere;
            this starter only works with files in the browser.
          </p>
        </header>

        <ImageUpload />

        <p className="footnote">Supported formats: PNG, JPEG, and WebP.</p>
      </div>
    </main>
  );
}
