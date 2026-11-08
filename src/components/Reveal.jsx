import { useRef } from "react";
import { staggerDelay } from "../stagger";

// delay is read once at mount so re-renders don't replay the animation
// variant="fade": opacity only (table rows)
export default function Reveal({
  as: Tag = "div",
  index = 0,
  variant = "rise",
  className = "",
  style,
  children,
  ...rest
}) {
  const delay = useRef(staggerDelay(index));
  const motion = variant === "fade" ? "reveal-fade" : "reveal";
  return (
    <Tag
      className={`${motion} ${className}`.trim()}
      style={{ ...style, "--delay": `${delay.current}ms` }}
      {...rest}
    >
      {children}
    </Tag>
  );
}
