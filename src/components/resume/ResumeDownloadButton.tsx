import { RESUME_FILENAME, RESUME_URL } from '@/config';

/** Plain same-origin link to the hosted PDF: the browser saves it as a real .pdf, with no script or API in between. */
export default function ResumeDownloadButton({ className, onDownload }: { className?: string; onDownload?: () => void }) {
  return (
    <a href={RESUME_URL} download={RESUME_FILENAME} className={className} onClick={onDownload}>
      Download Resume
    </a>
  );
}
