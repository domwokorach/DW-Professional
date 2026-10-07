import TechIcon from '@/components/ui/TechIcon';
import { coreTechGroups } from '@/data';
import CategoryLoop from './CategoryLoop';

/**
 * Core technologies by category: each category gets its own LogoLoop of `[icon] Name` items,
 * alternating direction row by row. Icons come from the generated offline set, so nothing is fetched.
 */
export default function CoreTech() {
  return (
    <div className="core-tech">
      <h3 className="core-tech__label" id="core-tech-label">Core technologies</h3>
      <div className="core-tech__groups">
        {coreTechGroups.map((group, i) => {
          const id = `core-tech-${group.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
          return (
            // role="group" rather than <section>: eight extra landmarks would clutter screen-reader navigation.
            <div key={group.title} className="core-tech__group" role="group" aria-labelledby={id}>
              <h4 className="core-tech__group-title" id={id}>{group.title}</h4>
              <CategoryLoop
                items={group.items.map((t) => ({
                  name: t.name,
                  icon: <TechIcon icon={t.icon} fallback={t.name} className="core-tech__icon" color={t.color} colorDark={t.colorDark} />,
                }))}
                label={group.title} direction={i % 2 === 0 ? 'left' : 'right'} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
