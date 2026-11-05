import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { AttachmentDropzone } from "@/components/attachment-dropzone";
import { renderWithIntl } from "@/lib/tests/intl";

function imageFile(name = "photo.png", size = 10): File {
  return new File([new Uint8Array(size)], name, { type: "image/png" });
}

function firstCallArg(fn: ReturnType<typeof vi.fn>): File[] {
  return (fn.mock.calls[0] as [File[]])[0];
}

function fileInput(container: HTMLElement): HTMLInputElement {
  const input = container.querySelector('input[type="file"]') as HTMLInputElement;
  return input;
}

describe("AttachmentDropzone", () => {
  it("stages a selected file through onChange", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { container } = renderWithIntl(
      <AttachmentDropzone files={[]} onChange={onChange} accept="image/*" />,
      "en",
    );

    await user.upload(fileInput(container), imageFile());

    expect(onChange).toHaveBeenCalledTimes(1);
    const staged = firstCallArg(onChange);
    expect(staged).toHaveLength(1);
    expect(staged[0]?.name).toBe("photo.png");
  });

  it("rejects files that do not match the accept filter", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { container } = renderWithIntl(
      <AttachmentDropzone files={[]} onChange={onChange} accept="image/*" />,
      "en",
    );

    await user.upload(
      fileInput(container),
      new File(["text"], "notes.txt", { type: "text/plain" }),
    );

    expect(onChange).not.toHaveBeenCalled();
  });

  it("rejects files larger than maxSizeBytes", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { container } = renderWithIntl(
      <AttachmentDropzone files={[]} onChange={onChange} maxSizeBytes={5} />,
      "en",
    );

    await user.upload(fileInput(container), imageFile("big.png", 50));

    expect(onChange).not.toHaveBeenCalled();
  });

  it("deduplicates files already staged", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const file = imageFile();
    const { container } = renderWithIntl(
      <AttachmentDropzone files={[file]} onChange={onChange} />,
      "en",
    );

    await user.upload(fileInput(container), file);

    expect(onChange).toHaveBeenCalledWith([file]);
  });

  it("trims the staged list to maxFiles", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const first = imageFile("one.png");
    const { container } = renderWithIntl(
      <AttachmentDropzone files={[first]} onChange={onChange} maxFiles={1} />,
      "en",
    );

    await user.upload(fileInput(container), imageFile("two.png"));

    const staged = firstCallArg(onChange);
    expect(staged).toHaveLength(1);
    expect(staged[0]?.name).toBe("one.png");
  });

  it("removes a staged file", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderWithIntl(<AttachmentDropzone files={[imageFile()]} onChange={onChange} />, "en");

    await user.click(screen.getByRole("button", { name: "Remove photo.png" }));

    expect(onChange).toHaveBeenCalledWith([]);
  });

  it("replaces the staged list when multiple is disabled", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { container } = renderWithIntl(
      <AttachmentDropzone files={[imageFile("old.png")]} onChange={onChange} multiple={false} />,
      "en",
    );

    await user.upload(fileInput(container), imageFile("new.png"));

    const staged = firstCallArg(onChange);
    expect(staged).toHaveLength(1);
    expect(staged[0]?.name).toBe("new.png");
  });

  it("hands accepted files to onFilesAdded without staging them", async () => {
    const user = userEvent.setup();
    const onFilesAdded = vi.fn();
    const { container } = renderWithIntl(<AttachmentDropzone onFilesAdded={onFilesAdded} />, "en");

    await user.upload(fileInput(container), imageFile());

    expect(onFilesAdded).toHaveBeenCalledTimes(1);
    expect(firstCallArg(onFilesAdded)[0]?.name).toBe("photo.png");
    expect(container.querySelector('ul[data-slot="attachment-dropzone-list"]')).toBeNull();
  });

  it("opens the picker from the drop area with the keyboard", async () => {
    const user = userEvent.setup();
    const onFilesAdded = vi.fn();
    renderWithIntl(<AttachmentDropzone onFilesAdded={onFilesAdded} />, "en");
    const zone = screen.getByRole("button", { name: "Drag and drop files here" });

    await user.tab();
    expect(zone).toHaveFocus();
    await user.keyboard("{Enter}");

    expect(zone).toBeInTheDocument();
  });
});
