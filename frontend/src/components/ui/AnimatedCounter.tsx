import { useEffect, useRef } from "react";
import { useSpring, animated } from "@react-spring/web";

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  format?: (value: number) => string;
  className?: string;
}

export function AnimatedCounter({
  value,
  duration = 800,
  format = (v) => Math.floor(v).toLocaleString(),
  className
}: AnimatedCounterProps) {
  const prevValue = useRef(value);

  const [spring, api] = useSpring(() => ({
    from: { number: prevValue.current },
    to: { number: value },
    config: {
      tension: 280,
      friction: 60,
      duration: duration
    },
  }));

  useEffect(() => {
    api.start({
      from: { number: prevValue.current },
      to: { number: value },
    });
    prevValue.current = value;
  }, [value, api]);

  return (
    <animated.span className={className}>
      {spring.number.to((n) => format(n))}
    </animated.span>
  );
}
