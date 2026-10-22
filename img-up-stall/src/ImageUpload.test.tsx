import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ImageUpload } from "./ImageUpload";

function fixtureFile(name: string, type: string): File {
  const contents = readFileSync(resolve(process.cwd(), "tests/fixtures", name));
  return new File([new Uint8Array(contents)], name, { type });
}

let objectUrlSequence = 0;

const createObjectUrlMock = vi.fn((file: Blob) => {
  objectUrlSequence += 1;
  const fileName = file instanceof File ? file.name : "blob";
  return `blob:test/${objectUrlSequence}/${fileName}`;
});

const revokeObjectUrlMock = vi.fn();

beforeEach(() => {
  objectUrlSequence = 0;
  createObjectUrlMock.mockClear();
  revokeObjectUrlMock.mockClear();

  Object.defineProperty(URL, "createObjectURL", {
    configurable: true,
    writable: true,
    value: createObjectUrlMock,
  });
  Object.defineProperty(URL, "revokeObjectURL", {
    configurable: true,
    writable: true,
    value: revokeObjectUrlMock,
  });
});

describe("ImageUpload", () => {
  it("starts with no image and a disabled clear button", () => {
    render(<ImageUpload />);

    expect(screen.getByText("No image selected.")).toBeInTheDocument();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Clear selection" }),
    ).toBeDisabled();
    expect(createObjectUrlMock).not.toHaveBeenCalled();
  });

  it("shows a preview after selecting a supported image", async () => {
    const user = userEvent.setup();
    render(<ImageUpload />);

    await user.upload(
      screen.getByLabelText("Choose an image"),
      fixtureFile("red.png", "image/png"),
    );

    const preview = await screen.findByRole("img", {
      name: "Preview of red.png",
    });

    expect(preview).toHaveAttribute("src", "blob:test/1/red.png");
    expect(screen.getByText("Selected: red.png")).toBeInTheDocument();
    expect(createObjectUrlMock).toHaveBeenCalledTimes(1);
  });

  it("replaces the preview when a different image is selected", async () => {
    const user = userEvent.setup();
    render(<ImageUpload />);
    const input = screen.getByLabelText("Choose an image");

    await user.upload(input, fixtureFile("red.png", "image/png"));
    await screen.findByRole("img", { name: "Preview of red.png" });

    await user.upload(input, fixtureFile("blue.png", "image/png"));
    const replacement = await screen.findByRole("img", {
      name: "Preview of blue.png",
    });

    expect(replacement).toHaveAttribute("src", "blob:test/2/blue.png");
    expect(
      screen.queryByRole("img", { name: "Preview of red.png" }),
    ).not.toBeInTheDocument();
    expect(screen.getByText("Selected: blue.png")).toBeInTheDocument();
  });

  it("clears the selection and removes the preview", async () => {
    const user = userEvent.setup();
    render(<ImageUpload />);

    await user.upload(
      screen.getByLabelText("Choose an image"),
      fixtureFile("red.png", "image/png"),
    );
    await screen.findByRole("img", { name: "Preview of red.png" });

    await user.click(screen.getByRole("button", { name: "Clear selection" }));

    await waitFor(() => {
      expect(screen.queryByRole("img")).not.toBeInTheDocument();
    });
    expect(screen.getByText("No image selected.")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Clear selection" }),
    ).toBeDisabled();
    expect(revokeObjectUrlMock).toHaveBeenCalledWith("blob:test/1/red.png");
  });

  it("rejects unsupported files with an accessible error", async () => {
    const user = userEvent.setup({ applyAccept: false });
    render(<ImageUpload />);
    const input = screen.getByLabelText("Choose an image");

    await user.upload(input, fixtureFile("notes.txt", "text/plain"));

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Unsupported file type. Choose a PNG, JPEG, or WebP image.",
    );
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(input).toHaveValue("");
    expect(createObjectUrlMock).not.toHaveBeenCalled();
  });

  it("revokes the previous object URL when the selection is replaced", async () => {
    const user = userEvent.setup();
    render(<ImageUpload />);
    const input = screen.getByLabelText("Choose an image");

    await user.upload(input, fixtureFile("red.png", "image/png"));
    await screen.findByRole("img", { name: "Preview of red.png" });

    await user.upload(input, fixtureFile("blue.png", "image/png"));
    await screen.findByRole("img", { name: "Preview of blue.png" });

    expect(revokeObjectUrlMock).toHaveBeenCalledWith("blob:test/1/red.png");
  });
});
