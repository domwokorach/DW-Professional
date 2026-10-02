import { useState } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { upload } from '@vercel/blob/client';
import FileUploadField, {
  UPLOAD_FAILED_MESSAGE,
  type AttachmentUploadStatus,
  type UploadedAttachment,
} from '@/components/ui/FileUploadField';

jest.mock('@vercel/blob/client', () => ({ upload: jest.fn() }));
// The progress bar is decorative here and pulls in motion internals.
jest.mock('@/components/ui/motion/progress', () => {
  const Passthrough = ({ children }: { children?: unknown }) => <>{typeof children === 'function' ? null : children}</>;
  return { Progress: Passthrough, ProgressIndicator: () => null, ProgressTrack: Passthrough, ProgressValue: () => null };
});

const mockUpload = upload as jest.MockedFunction<typeof upload>;

function Harness() {
  const [status, setStatus] = useState<AttachmentUploadStatus>('idle');
  const [attachment, setAttachment] = useState<UploadedAttachment | null>(null);
  return (
    <form>
      <FileUploadField
        id="attachment"
        label="CV, job description or other files"
        status={status}
        onStatusChange={setStatus}
        attachment={attachment}
        onAttachmentChange={setAttachment}
      />
    </form>
  );
}

const pdf = (name = 'cv.pdf') => new File(['%PDF-1.4'], name, { type: 'application/pdf' });

describe('FileUploadField', () => {
  beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true }) as unknown as typeof fetch;
  });

  it('opens from the "Click to upload" label: the visible drop zone is a label for the file input', () => {
    render(<Harness />);
    const input = screen.getByLabelText(/CV, job description/i, { selector: 'input[type=file]' });
    expect(screen.getByText('Click to upload').closest('label')).toHaveAttribute('for', input.id);
    expect(screen.getByText(/PDF, DOCX, PNG, JPG or JPEG — up to 5 MB/)).toBeInTheDocument();
  });

  it('uploads a valid file, shows its name, and exposes the reference for form submission', async () => {
    mockUpload.mockResolvedValue({ url: 'https://store.public.blob.vercel-storage.com/contact-uploads/tmp/x-cv.pdf' } as never);
    const { container } = render(<Harness />);

    await userEvent.upload(screen.getByLabelText(/CV, job description/i, { selector: 'input[type=file]' }), pdf());

    expect(await screen.findByText('Upload complete')).toBeInTheDocument();
    expect(screen.getByText('cv.pdf')).toBeInTheDocument();
    expect(container.querySelector('input[name=attachmentName]')).toHaveValue('cv.pdf');
    expect(screen.getByRole('button', { name: 'Remove cv.pdf' })).toBeInTheDocument();
  });

  it('rejects disallowed types before uploading', async () => {
    render(<Harness />);
    const input = screen.getByLabelText(/CV, job description/i, { selector: 'input[type=file]' });

    await userEvent.upload(input, new File(['MZ'], 'tool.exe', { type: 'application/x-msdownload' }), { applyAccept: false });

    expect(await screen.findByRole('alert')).toHaveTextContent('File must be PDF, DOCX, PNG, JPG, or JPEG.');
    expect(mockUpload).not.toHaveBeenCalled();
  });

  it('shows a helpful, non-blocking message when the upload is rejected (e.g. a stale Blob token)', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    mockUpload.mockRejectedValue(new Error('Vercel Blob: Token mismatch'));
    const { container } = render(<Harness />);

    await userEvent.upload(screen.getByLabelText(/CV, job description/i, { selector: 'input[type=file]' }), pdf());

    expect(await screen.findByText(UPLOAD_FAILED_MESSAGE, { selector: 'p.text-red-400' })).toBeInTheDocument();
    expect(UPLOAD_FAILED_MESSAGE).toMatch(/without it/);
    expect(container.querySelector('input[name=attachmentUrl]')).toBeNull();
    expect(console.error).toHaveBeenCalledWith('[FileUploadField] upload failed:', expect.any(Error));

    // Removing the failed file returns the optional field to its empty state.
    await userEvent.click(screen.getByRole('button', { name: 'Remove cv.pdf' }));
    await waitFor(() => expect(screen.queryByText(UPLOAD_FAILED_MESSAGE, { selector: 'p.text-red-400' })).not.toBeInTheDocument());
  });
});
