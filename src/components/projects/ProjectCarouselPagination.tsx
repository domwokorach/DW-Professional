import type { Project } from '@/types';

/** One dot per project. Selecting a dot moves that project to the centre. */
export default function ProjectCarouselPagination({ projects, active, onSelect }: { projects: Project[]; active: number; onSelect: (i: number) => void }) {
  return (
    <ul className="pcr__dots" aria-label="Choose a project">
      {projects.map((p, i) => (
        <li key={p.id}>
          <button
            type="button"
            className="pcr__dot"
            aria-label={`Show project ${i + 1} of ${projects.length}: ${p.title}`}
            aria-current={i === active ? 'true' : undefined}
            onClick={() => onSelect(i)}
          />
        </li>
      ))}
    </ul>
  );
}
