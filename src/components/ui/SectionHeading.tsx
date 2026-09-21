import MotionReveal from "./MotionReveal";
import TrueFocus from "./TrueFocus";
import TextType from "./TextType";
import HeadingHighlighter from "./HeadingHighlighter";
import { titleReveal } from "@/lib/animations";

const HEADING_CLASSNAME =
  "mt-4 text-[clamp(1.9rem,4.5vw,3.25rem)] font-semibold leading-[1.05] tracking-tight text-white";

export default function SectionHeading({
  index,
  label,
  heading,
  align = "left",
  animateHeading = false,
  headingEffect = "focus",
  typingSpeed,
  typingDelay,
}: {
  index: string;
  label: string;
  heading: string;
  align?: "left" | "center";
  animateHeading?: boolean;
  headingEffect?: "focus" | "typing";
  typingSpeed?: number;
  typingDelay?: number;
}) {
  return (
    <div className={align === "center" ? "text-center" : ""}>
      <MotionReveal>
        <p className="font-mono text-sm tracking-[0.15em] text-accent">
          {index} / {label}
        </p>
      </MotionReveal>
      <MotionReveal variants={titleReveal} delay={0.05}>
        {animateHeading ? (
          <h2 className={HEADING_CLASSNAME}>
            <HeadingHighlighter>
              {headingEffect === "typing" ? (
                <TextType
                  text={heading}
                  typingSpeed={typingSpeed}
                  initialDelay={typingDelay}
                />
              ) : (
                <TrueFocus sentence={heading} />
              )}
            </HeadingHighlighter>
          </h2>
        ) : (
          <h2 className={HEADING_CLASSNAME}>
            <HeadingHighlighter>{heading}</HeadingHighlighter>
          </h2>
        )}
      </MotionReveal>
    </div>
  );
}
