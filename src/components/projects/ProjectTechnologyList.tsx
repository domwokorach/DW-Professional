/** Technologies and skills as a labelled list of tags. */
export default function ProjectTechnologyList({ tech, label = 'Technologies and skills' }: { tech: string[]; label?: string }) {
  return <ul className="pc-tags" aria-label={label}>{tech.map((t) => <li key={t}>{t}</li>)}</ul>;
}
