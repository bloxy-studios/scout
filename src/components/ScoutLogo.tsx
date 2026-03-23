import { useId, useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP);

interface ScoutLogoProps {
  className?: string;
}

export const ScoutLogo = ({ className }: ScoutLogoProps) => {
  const containerRef = useRef<SVGSVGElement>(null);
  const gradientId = useId().replace(/:/g, "");

  useGSAP(
    () => {
      let blinkDelay: gsap.core.Tween | null = null;
      let blinkTimeline: gsap.core.Timeline | null = null;

      const blink = () => {
        blinkTimeline = gsap.timeline({
          onComplete: () => {
            blinkDelay = gsap.delayedCall(gsap.utils.random(3, 6), blink);
          },
        });

        blinkTimeline.to(".scout-logo__eye", {
          scaleY: 0.1,
          transformOrigin: "50% 75%",
          duration: 0.15,
          ease: "power2.inOut",
          yoyo: true,
          repeat: 1,
        });
      };

      blinkDelay = gsap.delayedCall(gsap.utils.random(1, 4), blink);

      const bodyTween = gsap.to(".scout-logo__body", {
        y: -8,
        duration: 2.5,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1,
      });

      const faceTween = gsap.to(".scout-logo__face", {
        x: "random(-8, 8)",
        y: "random(-4, 4)",
        duration: 2,
        ease: "sine.inOut",
        repeat: -1,
        repeatRefresh: true,
        repeatDelay: 1.5,
      });

      return () => {
        blinkDelay?.kill();
        blinkTimeline?.kill();
        bodyTween.kill();
        faceTween.kill();
      };
    },
    { scope: containerRef },
  );

  return (
    <svg
      id="Layer_2"
      data-name="Layer 2"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 353.78 361.45"
      className={className}
      ref={containerRef}
      overflow="visible"
      data-testid="scout-logo-animated"
      aria-hidden="true"
    >
      <defs>
        <radialGradient
          id={gradientId}
          cx="176.89"
          cy="180.72"
          fx="9.64"
          fy="159.45"
          r="200.35"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#c4c7f8" />
          <stop offset=".09" stopColor="#b1b4f4" />
          <stop offset=".24" stopColor="#9498ef" />
          <stop offset=".33" stopColor="#8a8eee" />
          <stop offset=".46" stopColor="#7478e9" />
          <stop offset=".63" stopColor="#5d60e4" />
          <stop offset=".74" stopColor="#5558e3" />
        </radialGradient>
      </defs>
      <g data-name="Layer 1">
        <path
          className="scout-logo__body"
          fill={`url(#${gradientId})`}
          d="M341.37,251.28c-23.92,69.12-90.66,150.05-161.6,88.05-77.77,50.97-119.81-35.74-116.66-59.38-29.43-.54-88.02-40.01-51.48-144.24C41.57,55.02,148.63-24.7,239.67,7.2c91.06,31.92,138.23,139.83,101.7,244.07Z"
        />
        <g className="scout-logo__face">
          <rect
            className="scout-logo__eye"
            fill="#fff"
            x="183.03"
            y="81.69"
            width="39.88"
            height="75.99"
            rx="19.94"
            ry="19.94"
            transform="translate(-17 35.22) rotate(-9.52)"
          />
          <rect
            className="scout-logo__eye"
            fill="#fff"
            x="236.27"
            y="70.25"
            width="39.88"
            height="74.4"
            rx="19.94"
            ry="19.94"
            transform="translate(-14.24 43.86) rotate(-9.52)"
          />
          <path
            fill="none"
            stroke="#fff"
            strokeLinecap="round"
            strokeMiterlimit="10"
            strokeWidth="18px"
            d="M119.21,168.19s16.35-16.51,22.24-22.06c.63-.6,3.11-.57,3.44.24,6.53,15.89,19.01,57.02,78.1,49.89"
          />
        </g>
      </g>
    </svg>
  );
};
