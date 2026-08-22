import MotionReveal from "./MotionReveal";
import { titleReveal } from "@/lib/animations";

export default function SectionHeading({
  index,
  label,
  heading,
  align = "left",
}: {
  index: string;
  label: string;
  heading: string;
  align?: "left" | "center";
}) {
  return (
    <div className={align === "center" ? "text-center" : ""}>
      <MotionReveal>
        <p className="font-mono text-sm tracking-[0.15em] text-accent">
          {index} / {label}
        </p>
      </MotionReveal>
      <MotionReveal variants={titleReveal} delay={0.05}>
        <h2 className="mt-4 text-[clamp(1.9rem,4.5vw,3.25rem)] font-semibold leading-[1.05] tracking-tight text-white">
          {heading}
        </h2>
      </MotionReveal>
    </div>
  );
}
