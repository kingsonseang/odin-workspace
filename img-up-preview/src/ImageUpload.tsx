import {
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from 'react';

export const SUPPORTED_IMAGE_TYPES = [
  'image/png',
  'image/jpeg',
  'image/webp',
] as const;

type SupportedImageType = (typeof SUPPORTED_IMAGE_TYPES)[number];

function isSupportedImageType(value: string): value is SupportedImageType {
  return (SUPPORTED_IMAGE_TYPES as readonly string[]).includes(value);
}

function describeType(value: string): string {
  return value || 'unknown type';
}

export function ImageUpload() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];

    if (!file) {
      return;
    }

    if (!isSupportedImageType(file.type)) {
      setError(
        `Cannot use "${file.name}" (${describeType(file.type)}). Choose a PNG, JPEG, or WebP image.`,
      );
      event.currentTarget.value = '';
      return;
    }

    setError(null);
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleClear = () => {
    setSelectedFile(null);
    setError(null);

    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
  };

  return (
    <form className="image-upload" onSubmit={handleSubmit} noValidate>
      <div className="field">
        <label htmlFor="image-input">Choose an image</label>
        <input
          ref={inputRef}
          id="image-input"
          name="image"
          type="file"
          accept={SUPPORTED_IMAGE_TYPES.join(',')}
          onChange={handleFileChange}
          aria-describedby={error ? 'image-help image-error' : 'image-help'}
        />
        <p id="image-help" className="hint">
          One image. PNG, JPEG, or WebP.
        </p>
      </div>

      {error ? (
        <p id="image-error" className="error" role="alert">
          {error}
        </p>
      ) : null}

      {selectedFile ? (
        <p className="file-meta">
          Selected file: <span>{selectedFile.name}</span>
        </p>
      ) : null}

      {previewUrl ? (
        <figure className="preview">
          <img
            src={previewUrl}
            alt={
              selectedFile
                ? `Preview of ${selectedFile.name}`
                : 'Selected image preview'
            }
          />
          <figcaption>{selectedFile?.type ?? 'Image preview'}</figcaption>
        </figure>
      ) : null}

      {selectedFile ? (
        <button className="clear-button" type="button" onClick={handleClear}>
          Clear selection
        </button>
      ) : null}
    </form>
  );
}
