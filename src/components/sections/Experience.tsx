"use client";

import { useEffect, useState } from "react";
import SectionHeading from "@/components/ui/SectionHeading";
import MotionReveal from "@/components/ui/MotionReveal";
import Container from "@/components/ui/Container";
import ExperienceAccordionItem from "@/components/experience/ExperienceAccordionItem";
import { certifications, education, experience } from "@/data/experience";

const ROLE_ANCHORS: Record<string, string> = {
  "Trainee Digital Transformation": "trainee-digital-transformation",
  "Junior UI Delivery and Transformation": "junior-ui-delivery",
  "Senior Web Developer": "senior-web-developer",
  "Senior Frontend Developer": "senior-frontend-developer",
  "Career Break": "career-break",
  "Professional Development": "professional-development",
  "Freelance Software Developer": "freelance-software-developer",
};

export default function Experience() {
  const [openRole, setOpenRole] = useState<string | null>(null);

  useEffect(() => {
    const hash = window.location.hash.slice(1);
    const match = experience.find((item) => ROLE_ANCHORS[item.role] === hash);
    if (match) setOpenRole(match.role);
  }, []);

  return (
    <section id="experience" className="relative border-t border-line py-28 sm:py-36">
      <Container>
        <SectionHeading index="05" label="Experience" heading="Experience" />

        <ol className="mt-16">
          {experience.map((item) => (
            <ExperienceAccordionItem
              key={`${item.role}-${item.period}`}
              item={item}
              id={ROLE_ANCHORS[item.role]}
              isOpen={openRole === item.role}
              onToggle={() => setOpenRole((current) => (current === item.role ? null : item.role))}
            />
          ))}
        </ol>

        <div className="mt-20 grid gap-10 sm:grid-cols-2">
          <MotionReveal>
            <h3 className="text-sm font-mono uppercase tracking-widest text-accent">
              Professional Development
            </h3>
            <div className="mt-4 space-y-4">
              <div>
                <p className="text-sm font-medium text-white">Codecademy</p>
                <p className="text-sm text-muted">{certifications.codecademy.join(", ")}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-white">HackerRank</p>
                <p className="text-sm text-muted">{certifications.hackerrank.join(", ")}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-white">Additional</p>
                <p className="text-sm text-muted">{certifications.additional.join(", ")}</p>
              </div>
            </div>
          </MotionReveal>

          <MotionReveal delay={0.1}>
            <h3 className="text-sm font-mono uppercase tracking-widest text-accent">
              Education
            </h3>
            <ul className="mt-4 space-y-3">
              {education.map((ed) => (
                <li key={ed.qualification}>
                  <p className="text-sm font-medium text-white">{ed.qualification}</p>
                  {ed.institution && (
                    <p className="text-sm text-muted">{ed.institution}</p>
                  )}
                </li>
              ))}
            </ul>
          </MotionReveal>
        </div>
      </Container>
    </section>
  );
}
