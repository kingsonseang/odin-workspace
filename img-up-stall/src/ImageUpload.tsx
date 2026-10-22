import { useEffect, useRef, useState, type ChangeEvent } from "react";

const ACCEPTED_IMAGE_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
] as const;

const ACCEPT_ATTRIBUTE = ACCEPTED_IMAGE_TYPES.join(",");

type Preview = {
  readonly url: string;
  readonly fileName: string;
};

function isSupportedImage(file: File): boolean {
  return (ACCEPTED_IMAGE_TYPES as readonly string[]).includes(file.type);
}

export function ImageUpload() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedFile) {
      return;
    }

    const objectUrl = URL.createObjectURL(selectedFile);
    setPreview({ url: objectUrl, fileName: selectedFile.name });
  }, [selectedFile]);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextFile = event.currentTarget.files?.[0] ?? null;

    if (!nextFile) {
      return;
    }

    if (!isSupportedImage(nextFile)) {
      setError("Unsupported file type. Choose a PNG, JPEG, or WebP image.");
      event.currentTarget.value = "";
      return;
    }

    setError(null);
    setSelectedFile(nextFile);
  };

  const handleClear = () => {
    setSelectedFile(null);
    setError(null);

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  return (
    <form
      className="upload-form"
      aria-label="Image upload form"
      onSubmit={(event) => event.preventDefault()}
    >
      <div className="field">
        <label htmlFor="image-input" className="field-label">
          Choose an image
        </label>
        <p id="file-hint" className="hint">
          PNG, JPEG, or WebP. One file.
        </p>
        <input
          ref={inputRef}
          id="image-input"
          name="image"
          type="file"
          accept={ACCEPT_ATTRIBUTE}
          aria-describedby="file-hint"
          onChange={handleFileChange}
        />
      </div>

      <div className="actions">
        <button
          type="button"
          className="clear-button"
          onClick={handleClear}
          disabled={!selectedFile}
        >
          Clear selection
        </button>
      </div>

      {error ? (
        <p className="error-message" role="alert">
          {error}
        </p>
      ) : null}

      <div className="preview-panel" aria-live="polite">
        <p className="selection-status">
          {selectedFile
            ? `Selected: ${selectedFile.name}`
            : "No image selected."}
        </p>

        {preview ? (
          <figure className="preview">
            <img src={preview.url} alt={`Preview of ${preview.fileName}`} />
            <figcaption>{preview.fileName}</figcaption>
          </figure>
        ) : null}
      </div>
    </form>
  );
}
