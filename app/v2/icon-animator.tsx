"use client";

import React, { useState, useRef, useCallback, useEffect, CSSProperties, MouseEvent as ReactMouseEvent, Ref } from "react";

// ============================================================
// Types
// ============================================================

interface ParsedElement {
  id: string;
  tag: string;
  attrs: Record<string, string>;
  index: number;
}

interface ParsedSVG {
  viewBox: string;
  elements: ParsedElement[];
}

interface AnimationState {
  translateX: number;
  translateY: number;
  rotate: number;
  scale: number;
  opacity: number;
  duration: number;
  delay: number;
  ease: string;
  wrapAround: boolean;
  // Group 1: Quick wins
  strokeColor: string;
  fillColor: string;
  strokeDraw: number; // 0 = drawn, 1 = hidden (animates from hidden to drawn)
  blur: number;
  skewX: number;
  skewY: number;
  // Group 2: Ring/shake
  ringEffect: boolean;
  ringAngle: number;
  ringCount: number;
  // Group 4: Advanced
  rotateX: number;
  rotateY: number;
  perspective: number;
}

interface FrameSettings {
  enabled: boolean;
  borderRadius: number;
  borderWidth: number;
  borderColor: string;
  bgColor: string;
  padding: number;
}

type LoopMode = "once" | "loop" | "ping-pong";
type TriggerMode = "hover" | "auto";
type Animations = Record<string, AnimationState>;

// A snapshot of the editable state, used for undo/redo and persistence.
interface Snapshot {
  animations: Animations;
  frameSettings: FrameSettings;
}

const STORAGE_KEY = "icon-animator-v2";

// ============================================================
// Icon Animator – a visual tool for creating animated SVG icons
// Inspired by itshover.com (https://github.com/itshover/itshover)
// ============================================================

const PRESETS = {
  Heart: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>`,
  Star: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
  Bell: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>`,
  Mail: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>`,
  Settings: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>`,
  Zap: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"/></svg>`,
  Home: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"/><path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>`,
  Search: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>`,
  Check: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/></svg>`,
  ArrowRight: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>`,
};

const SHAPE_TAGS = ["path", "circle", "rect", "line", "polyline", "polygon", "ellipse"];

/**
 * Parse an SVG string into a structured format we can work with
 */
function parseSVG(svgString: string): ParsedSVG | null {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgString.trim(), "image/svg+xml");
    const errorNode = doc.querySelector("parsererror");
    if (errorNode) return null;
    const svg = doc.querySelector("svg");
    if (!svg) return null;

    const viewBox = svg.getAttribute("viewBox") || "0 0 24 24";
    const elements: ParsedElement[] = [];
    let idx = 0;

    function walk(node: Element) {
      if (node.nodeType === 1 && SHAPE_TAGS.includes(node.tagName.toLowerCase())) {
        const attrs: Record<string, string> = {};
        for (const attr of Array.from(node.attributes)) {
          attrs[attr.name] = attr.value;
        }
        elements.push({
          id: `el_${idx}`,
          tag: node.tagName.toLowerCase(),
          attrs,
          index: idx,
        });
        idx++;
      }
      for (const child of node.children) walk(child);
    }
    walk(svg);

    return { viewBox, elements };
  } catch {
    return null;
  }
}

const EMPTY_ANIM: AnimationState = {
  translateX: 0,
  translateY: 0,
  rotate: 0,
  scale: 1,
  opacity: 1,
  duration: 0.4,
  delay: 0,
  ease: "easeInOut",
  wrapAround: false,
  strokeColor: "",
  fillColor: "",
  strokeDraw: 0,
  blur: 0,
  skewX: 0,
  skewY: 0,
  ringEffect: false,
  ringAngle: 20,
  ringCount: 5,
  rotateX: 0,
  rotateY: 0,
  perspective: 0,
};

const DEFAULT_FRAME: FrameSettings = {
  enabled: false,
  borderRadius: 12,
  borderWidth: 2,
  borderColor: "#d1d5db",
  bgColor: "transparent",
  padding: 8,
};

const ANIM_PRESETS: Record<string, Partial<AnimationState>> = {
  Bounce: { translateY: -3, ease: "easeOut", duration: 0.3 },
  Shake: { rotate: 15, ease: "easeInOut", duration: 0.3 },
  Pulse: { scale: 1.2, ease: "easeInOut", duration: 0.3 },
  "Fade In": { opacity: 0, duration: 0.4, ease: "easeIn" },
  Ring: { ringEffect: true, ringAngle: 20, ringCount: 5, duration: 0.6 },
  Draw: { strokeDraw: 1, duration: 0.8, ease: "easeInOut" },
  "Blur In": { blur: 8, opacity: 0, duration: 0.5 },
  Skew: { skewX: 15, duration: 0.3, ease: "easeOut" },
  "3D Flip": { rotateY: 180, perspective: 400, duration: 0.6 },
  Gravity: { translateY: -8, ease: "spring", duration: 0.5 },
};

const EASINGS = ["easeInOut", "easeIn", "easeOut", "linear", "spring"];

function hasAnimation(a: AnimationState | undefined) {
  if (!a) return false;
  return (
    a.translateX !== 0 ||
    a.translateY !== 0 ||
    a.rotate !== 0 ||
    a.scale !== 1 ||
    a.opacity !== 1 ||
    a.strokeColor !== "" ||
    a.fillColor !== "" ||
    a.strokeDraw !== 0 ||
    a.blur !== 0 ||
    a.skewX !== 0 ||
    a.skewY !== 0 ||
    a.ringEffect ||
    a.rotateX !== 0 ||
    a.rotateY !== 0
  );
}

/**
 * Convert a kebab-case attribute to camelCase for React
 */
function toCamel(str: string) {
  return str.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
}

/**
 * Build a React-compatible props object from SVG attributes
 */
function svgAttrsToReact(attrs: Record<string, string>, skip: string[] = []) {
  const result: Record<string, string> = {};
  for (const [k, v] of Object.entries(attrs)) {
    if (skip.includes(k)) continue;
    result[toCamel(k)] = v;
  }
  return result;
}

/**
 * Render an SVG element using createElement to handle dynamic tag names properly
 */
function SvgElement({ tag, attrs, isSelected, style, onMouseDown, anim, elRef }: { tag: string; attrs: Record<string, string>; isSelected: boolean; style: CSSProperties; onMouseDown: (e: ReactMouseEvent) => void; anim?: AnimationState; elRef?: (el: SVGElement | null) => void }) {
  const skip = ["fill", "stroke", "stroke-width", "stroke-linecap", "stroke-linejoin"];
  const reactAttrs = svgAttrsToReact(attrs, skip);

  // Determine stroke/fill from animation state
  const strokeVal = anim?.strokeColor || (isSelected ? "#a78bfa" : "currentColor");
  const fillVal = anim?.fillColor || "none";

  // Stroke draw effect: compute dasharray/dashoffset
  const strokeDrawProps: Record<string, string | number> = {};
  if (anim && anim.strokeDraw > 0) {
    // Use a large dasharray to cover any path length
    const totalLen = 100;
    strokeDrawProps.strokeDasharray = totalLen;
    strokeDrawProps.strokeDashoffset = anim.strokeDraw * totalLen;
  }

  // Merge filters: preserve blur/etc from getPreviewStyle, add selection glow on top
  const styleFilter = (style as Record<string, unknown>)?.filter as string | undefined;
  const selectionFilter = isSelected ? "drop-shadow(0 0 4px rgba(167,139,250,0.5))" : "";
  const combinedFilter = [styleFilter, selectionFilter].filter(Boolean).join(" ") || "none";

  const props = {
    ...reactAttrs,
    stroke: strokeVal,
    strokeWidth: isSelected ? "2.5" : "2",
    fill: fillVal,
    ...strokeDrawProps,
    style: {
      ...style,
      cursor: "grab",
      filter: combinedFilter,
    },
    onMouseDown,
  };

  // Use createElement for dynamic SVG tag names
  return <>{(() => {
    switch (tag) {
      case "path": return <path ref={elRef as React.Ref<SVGPathElement>} {...props} />;
      case "circle": return <circle ref={elRef as React.Ref<SVGCircleElement>} {...props} />;
      case "rect": return <rect ref={elRef as React.Ref<SVGRectElement>} {...props} />;
      case "line": return <line ref={elRef as React.Ref<SVGLineElement>} {...props} />;
      case "polyline": return <polyline ref={elRef as React.Ref<SVGPolylineElement>} {...props} />;
      case "polygon": return <polygon ref={elRef as React.Ref<SVGPolygonElement>} {...props} />;
      case "ellipse": return <ellipse ref={elRef as React.Ref<SVGEllipseElement>} {...props} />;
      default: return null;
    }
  })()}</>;
}

/**
 * Generate the motion/react component code for export
 */
function generateExportCode(parsed: ParsedSVG | null, animations: Animations, name: string, frame: FrameSettings) {
  if (!parsed) return "";

  const motionImport = ["motion", "react"].join("/");
  const { viewBox, elements } = parsed;

  // Separate normal, wrap-around, and ring elements
  const normalEls: ParsedElement[] = [];
  const wrapEls: ParsedElement[] = [];
  const ringEls: ParsedElement[] = [];
  for (const el of elements) {
    const a = animations[el.id];
    if (!hasAnimation(a)) continue;
    if (a.ringEffect) ringEls.push(el);
    else if (a.wrapAround) wrapEls.push(el);
    else normalEls.push(el);
  }

  // Build hover-start animation calls for normal elements
  const startCalls: string[] = [];
  const endCalls: string[] = [];

  for (const el of normalEls) {
    const a = animations[el.id];
    const props: string[] = [];
    if (a.translateX !== 0) props.push(`x: ${a.translateX}`);
    if (a.translateY !== 0) props.push(`y: ${a.translateY}`);
    if (a.rotate !== 0) props.push(`rotate: ${a.rotate}`);
    if (a.scale !== 1) props.push(`scale: ${a.scale}`);
    if (a.opacity !== 1) props.push(`opacity: ${a.opacity}`);
    // Skew
    if (a.skewX !== 0) props.push(`skewX: ${a.skewX}`);
    if (a.skewY !== 0) props.push(`skewY: ${a.skewY}`);
    // 3D
    if (a.rotateX !== 0) props.push(`rotateX: ${a.rotateX}`);
    if (a.rotateY !== 0) props.push(`rotateY: ${a.rotateY}`);
    // Filter (blur)
    if (a.blur > 0) props.push(`filter: "blur(${a.blur}px)"`);
    // Colors
    if (a.strokeColor) props.push(`stroke: "${a.strokeColor}"`);
    if (a.fillColor) props.push(`fill: "${a.fillColor}"`);
    // Stroke draw (pathLength animation)
    if (a.strokeDraw > 0) props.push(`pathLength: 1`);

    const opts = [`duration: ${a.duration}`, `ease: "${a.ease}"`];
    if (a.delay > 0) opts.push(`delay: ${a.delay}`);

    startCalls.push(
      `        animate(".${el.id}", { ${props.join(", ")} }, { ${opts.join(", ")} })`
    );

    // Reset props
    const resetProps = [`x: 0`, `y: 0`, `rotate: 0`, `scale: 1`, `opacity: 1`];
    if (a.skewX !== 0) resetProps.push(`skewX: 0`);
    if (a.skewY !== 0) resetProps.push(`skewY: 0`);
    if (a.rotateX !== 0) resetProps.push(`rotateX: 0`);
    if (a.rotateY !== 0) resetProps.push(`rotateY: 0`);
    if (a.blur > 0) resetProps.push(`filter: "blur(0px)"`);
    if (a.strokeColor) resetProps.push(`stroke: color`);
    if (a.fillColor) resetProps.push(`fill: "none"`);
    if (a.strokeDraw > 0) resetProps.push(`pathLength: 0`);
    endCalls.push(
      `        animate(".${el.id}", { ${resetProps.join(", ")} }, { duration: ${a.duration}, ease: "${a.ease}" })`
    );
  }

  // Build ring/shake sequential calls
  const ringStartLines: string[] = [];
  const ringEndLines: string[] = [];
  for (const el of ringEls) {
    const a = animations[el.id];
    const dur = a.duration;
    const count = a.ringCount;
    const angle = a.ringAngle;
    const delayPart = a.delay > 0 ? `, delay: ${a.delay}` : "";
    const stepDur = (dur / count).toFixed(3);

    ringStartLines.push(`      // Ring effect: ${el.id}`);
    for (let i = 0; i < count; i++) {
      const decay = 1 - i / count;
      const dir = i % 2 === 0 ? 1 : -1;
      const deg = Math.round(angle * decay * dir);
      const delayStr = i === 0 ? delayPart : "";
      ringStartLines.push(`      await animate(".${el.id}", { rotate: ${deg} }, { duration: ${stepDur}${delayStr}, ease: "easeInOut" });`);
    }
    ringStartLines.push(`      await animate(".${el.id}", { rotate: 0 }, { duration: ${stepDur}, ease: "easeOut" });`);

    ringEndLines.push(`      animate(".${el.id}", { rotate: 0 }, { duration: ${dur}, ease: "easeOut" })`);
  }

  // Build wrap-around sequential calls
  const wrapStartLines: string[] = [];
  const wrapEndLines: string[] = [];
  for (const el of wrapEls) {
    const a = animations[el.id];
    const tx = a.translateX || 0;
    const ty = a.translateY || 0;
    const dur = a.duration;
    const delayPart = a.delay > 0 ? `, delay: ${a.delay}` : "";

    wrapStartLines.push(`      // Wrap-around: ${el.id}`);
    wrapStartLines.push(`      await animate(".${el.id}", { x: ${tx * 3}, y: ${ty * 3}, opacity: 0 }, { duration: ${dur * 0.6}${delayPart}, ease: "easeIn" });`);
    wrapStartLines.push(`      await animate(".${el.id}", { x: ${-tx * 3}, y: ${-ty * 3} }, { duration: 0 });`);
    wrapStartLines.push(`      await animate(".${el.id}", { x: 0, y: 0, opacity: 1 }, { duration: ${dur * 0.4}, ease: "easeOut" });`);

    wrapEndLines.push(`      animate(".${el.id}", { x: 0, y: 0, rotate: 0, scale: 1, opacity: 1 }, { duration: ${dur}, ease: "${a.ease}" })`);
  }

  // Build SVG children
  const children = elements
    .map((el) => {
      const a = animations[el.id];
      const attrPairs = Object.entries(el.attrs)
        .filter(([k]) => k !== "xmlns")
        .map(([k, v]) => `${toCamel(k)}="${v}"`)
        .join(" ");
      // Add initial state props for animated elements
      const initProps: string[] = [];
      if (a?.strokeDraw > 0) initProps.push(`pathLength={0}`);
      // Merge all inline-style entries into a single style prop so we never emit
      // two `style={{...}}` attributes on the same element (invalid JSX).
      const styleEntries: string[] = [];
      if (a?.blur > 0) styleEntries.push(`filter: "blur(${a.blur}px)"`);
      if (a?.perspective > 0) styleEntries.push(`perspective: ${a.perspective}`);
      if (styleEntries.length > 0) initProps.push(`style={{ ${styleEntries.join(", ")} }}`);
      const extra = initProps.length > 0 ? " " + initProps.join(" ") : "";
      return `        <motion.${el.tag} className="${el.id}" ${attrPairs}${extra} />`;
    })
    .join("\n");

  // Build the start handler body
  let startBody = "";
  if (startCalls.length > 0) {
    startBody += `      await Promise.all([\n${startCalls.join(",\n")}\n      ]);\n`;
  }
  if (ringStartLines.length > 0) {
    startBody += ringStartLines.join("\n") + "\n";
  }
  if (wrapStartLines.length > 0) {
    startBody += wrapStartLines.join("\n") + "\n";
  }

  // Build the end handler body (only emit Promise.all when there is something to reset)
  let endBody = "";
  const allEndCalls = [...endCalls, ...ringEndLines, ...wrapEndLines];
  if (allEndCalls.length > 0) {
    endBody += `      await Promise.all([\n${allEndCalls.join(",\n")}\n      ]);\n`;
  }

  // Frame wrapper
  const hasFrame = frame.enabled;

  const wrapperStyle = hasFrame
    ? `{ width: size + ${frame.padding * 2 + frame.borderWidth * 2}, height: size + ${frame.padding * 2 + frame.borderWidth * 2}, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: ${frame.borderRadius}, border: "${frame.borderWidth}px solid ${frame.borderColor}"${frame.bgColor !== "transparent" ? `, backgroundColor: "${frame.bgColor}"` : ""}, padding: ${frame.padding}, overflow: "hidden" }`
    : `{ width: size, height: size, cursor: "pointer", overflow: "hidden" }`;

  return `"use client";

import { forwardRef, useImperativeHandle, useRef } from "react";
import { motion, useAnimate } from "${motionImport}";

const ${name} = forwardRef(({ size = 24, color = "currentColor", ...props }, ref) => {
  const [scope, animate] = useAnimate();
  const isAnimating = useRef(false);

  useImperativeHandle(ref, () => ({
    startAnimation: () => handleHoverStart(),
    stopAnimation: () => handleHoverEnd(),
  }));

  const handleHoverStart = async () => {
    if (isAnimating.current) return;
    isAnimating.current = true;
    try {
${startBody}    } catch {}
  };

  const handleHoverEnd = async () => {
    isAnimating.current = false;
    try {
${endBody}    } catch {}
  };

  return (
    <div
      ref={scope}
      style={${wrapperStyle}}
      onMouseEnter={handleHoverStart}
      onMouseLeave={handleHoverEnd}
      {...props}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="${viewBox}"
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
${children}
      </svg>
    </div>
  );
});

${name}.displayName = "${name}";
export default ${name};
`;
}

// ============================================================
// UI Components
// ============================================================

function Slider({ label, value, onChange, min, max, step = 0.1, unit = "" }: { label: string; value: number; onChange: (v: number) => void; min: number; max: number; step?: number; unit?: string }) {
  return (
    <div className="mb-3">
      <div className="flex justify-between mb-1">
        <span className="text-xs text-gray-600 dark:text-gray-400">{label}</span>
        <span className="text-xs text-violet-300 font-mono font-semibold tabular-nums">
          {typeof value === "number" ? value.toFixed(step < 1 ? 1 : 0) : value}
          {unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-1 accent-violet-600 cursor-pointer"
      />
    </div>
  );
}

// ============================================================
// Main Page Component
// ============================================================

export default function IconAnimatorPage() {
  const [svgInput, setSvgInput] = useState("");
  const [parsed, setParsed] = useState<ParsedSVG | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [animations, setAnimations] = useState<Animations>({});
  const [isHovering, setIsHovering] = useState(false);
  const [pinned, setPinned] = useState(false); // keep the preview animating without hovering
  const [showCode, setShowCode] = useState(false);
  const [showPaste, setShowPaste] = useState(false);
  const [componentName, setComponentName] = useState("MyIcon");
  const [copied, setCopied] = useState(false);
  const [parseError, setParseError] = useState(false);
  const [previewScale, setPreviewScale] = useState(128);
  const [frameSettings, setFrameSettings] = useState<FrameSettings>({ ...DEFAULT_FRAME });

  const canvasRef = useRef<HTMLDivElement>(null);
  const dragState = useRef<{ active: boolean; pushed?: boolean; startX?: number; startY?: number; elId?: string; pxPerUnit?: number; origTx?: number; origTy?: number }>({ active: false });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ---- Undo / redo history ----
  // Refs mirror the current editable state so snapshots can be taken without
  // depending on stale closures.
  const animationsRef = useRef(animations);
  const frameRef = useRef(frameSettings);
  useEffect(() => { animationsRef.current = animations; }, [animations]);
  useEffect(() => { frameRef.current = frameSettings; }, [frameSettings]);

  const historyRef = useRef<{ past: Snapshot[]; future: Snapshot[] }>({ past: [], future: [] });
  const lastPushRef = useRef(0);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const syncHistoryFlags = useCallback(() => {
    setCanUndo(historyRef.current.past.length > 0);
    setCanRedo(historyRef.current.future.length > 0);
  }, []);

  // Snapshot the state *before* a mutation. Rapid edits (e.g. dragging a slider)
  // are coalesced into one entry within a 500ms window unless `force` is set.
  const pushHistory = useCallback((force = false) => {
    const now = Date.now();
    if (!force && now - lastPushRef.current < 500) return;
    lastPushRef.current = now;
    const h = historyRef.current;
    h.past.push({ animations: animationsRef.current, frameSettings: frameRef.current });
    if (h.past.length > 50) h.past.shift();
    h.future = [];
    syncHistoryFlags();
  }, [syncHistoryFlags]);

  const undo = useCallback(() => {
    const h = historyRef.current;
    if (h.past.length === 0) return;
    const prev = h.past.pop()!;
    h.future.unshift({ animations: animationsRef.current, frameSettings: frameRef.current });
    setAnimations(prev.animations);
    setFrameSettings(prev.frameSettings);
    syncHistoryFlags();
  }, [syncHistoryFlags]);

  const redo = useCallback(() => {
    const h = historyRef.current;
    if (h.future.length === 0) return;
    const next = h.future.shift()!;
    h.past.push({ animations: animationsRef.current, frameSettings: frameRef.current });
    setAnimations(next.animations);
    setFrameSettings(next.frameSettings);
    syncHistoryFlags();
  }, [syncHistoryFlags]);

  // Keyboard shortcuts: Cmd/Ctrl+Z = undo, Shift+Cmd/Ctrl+Z = redo
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const mod = e.metaKey || e.ctrlKey;
      if (!mod || e.key.toLowerCase() !== "z") return;
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) return;
      e.preventDefault();
      if (e.shiftKey) redo();
      else undo();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [undo, redo]);

  // ---- localStorage persistence ----
  // Hydrate once on mount. This must run in an effect (not a lazy initializer)
  // so the server-rendered markup matches the first client render, then we
  // apply any saved work. The synchronous setState here is intentional.
  const hydratedRef = useRef(false);
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        if (typeof data.svgInput === "string" && data.svgInput.trim()) {
          const result = parseSVG(data.svgInput);
          if (result && result.elements.length > 0) {
            setSvgInput(data.svgInput);
            setParsed(result);
            const anims: Animations = {};
            result.elements.forEach((el) => {
              anims[el.id] = { ...EMPTY_ANIM, ...(data.animations?.[el.id] || {}) };
            });
            setAnimations(anims);
            if (data.frameSettings) setFrameSettings({ ...DEFAULT_FRAME, ...data.frameSettings });
            if (typeof data.componentName === "string") setComponentName(data.componentName);
            if (typeof data.previewScale === "number") setPreviewScale(data.previewScale);
          }
        }
      }
    } catch {
      // Ignore corrupt/unavailable storage.
    }
    hydratedRef.current = true;
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    if (!hydratedRef.current) return;
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ svgInput, animations, frameSettings, componentName, previewScale })
      );
    } catch {
      // Ignore quota/unavailable storage.
    }
  }, [svgInput, animations, frameSettings, componentName, previewScale]);

  // Load and parse an SVG string
  const loadSVG = useCallback((svg: string) => {
    setSvgInput(svg);
    setParseError(false);
    const result = parseSVG(svg);
    if (!result || result.elements.length === 0) {
      setParsed(null);
      if (svg.trim()) setParseError(true);
      return;
    }
    setParsed(result);
    setSelectedIds(new Set());
    setShowCode(false);

    const anims: Animations = {};
    result.elements.forEach((el) => {
      anims[el.id] = { ...EMPTY_ANIM };
    });
    setAnimations(anims);
  }, []);

  // Update animation property for all selected elements
  const updateAnim = useCallback((_id: string, key: string, val: number | string | boolean) => {
    pushHistory();
    setSelectedIds((sel) => {
      setAnimations((prev) => {
        const next = { ...prev };
        sel.forEach((id) => {
          next[id] = { ...next[id], [key]: val };
        });
        return next;
      });
      return sel;
    });
  }, [pushHistory]);

  // Reset animation for all selected elements
  const resetAnim = useCallback((_id: string) => {
    pushHistory(true);
    setSelectedIds((sel) => {
      setAnimations((prev) => {
        const next = { ...prev };
        sel.forEach((id) => {
          next[id] = { ...EMPTY_ANIM };
        });
        return next;
      });
      return sel;
    });
  }, [pushHistory]);

  // Reset all animations
  const resetAll = useCallback(() => {
    if (!parsed) return;
    pushHistory(true);
    const anims: Animations = {};
    parsed.elements.forEach((el) => {
      anims[el.id] = { ...EMPTY_ANIM };
    });
    setAnimations(anims);
  }, [parsed, pushHistory]);

  // Update frame settings with an undo snapshot
  const updateFrame = useCallback((updater: (prev: FrameSettings) => FrameSettings) => {
    pushHistory();
    setFrameSettings(updater);
  }, [pushHistory]);

  // First selected ID drives the controls display
  const selectedId = selectedIds.size > 0 ? Array.from(selectedIds)[0] : null;
  const selectedAnim = selectedId ? animations[selectedId] || EMPTY_ANIM : null;

  // ---- Drag to set translateX/Y ----
  const handleElementMouseDown = useCallback(
    (e: ReactMouseEvent, elId: string) => {
      e.preventDefault();
      e.stopPropagation();
      // Cmd/Ctrl+click for multi-select
      if (e.metaKey || e.ctrlKey) {
        setSelectedIds((prev) => {
          const next = new Set(prev);
          if (next.has(elId)) next.delete(elId);
          else next.add(elId);
          return next;
        });
      } else {
        setSelectedIds(new Set([elId]));
      }

      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      // Map pixel movement to SVG coordinate space using the real viewBox width
      // (viewBox = "minX minY width height"), so dragging tracks the cursor 1:1
      // regardless of the icon's coordinate system.
      const svgSize = parsed ? Number(parsed.viewBox.split(/\s+/)[2]) || 24 : 24;
      const pxPerUnit = rect.width / svgSize;

      dragState.current = {
        active: true,
        pushed: false,
        startX: e.clientX,
        startY: e.clientY,
        elId,
        pxPerUnit,
        origTx: animations[elId]?.translateX || 0,
        origTy: animations[elId]?.translateY || 0,
      };
    },
    [animations, parsed]
  );

  useEffect(() => {
    function onMove(e: globalThis.MouseEvent) {
      const d = dragState.current;
      if (!d.active) return;
      const dx = (e.clientX - (d.startX || 0)) / (d.pxPerUnit || 1);
      const dy = (e.clientY - (d.startY || 0)) / (d.pxPerUnit || 1);
      const tx = Math.round(((d.origTx || 0) + dx) * 2) / 2; // snap to 0.5
      const ty = Math.round(((d.origTy || 0) + dy) * 2) / 2;
      if (d.elId && (tx !== (d.origTx || 0) || ty !== (d.origTy || 0))) {
        // Record one undo entry per drag gesture, on the first real movement.
        if (!d.pushed) {
          pushHistory(true);
          d.pushed = true;
        }
        setAnimations((prev) => ({
          ...prev,
          [d.elId!]: { ...prev[d.elId!], translateX: tx, translateY: ty },
        }));
      }
    }
    function onUp() {
      dragState.current.active = false;
    }
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [pushHistory]);

  // Ring effect: Web Animations API approach — bypasses CSP entirely
  const svgElRefs = useRef<Map<string, SVGElement | null>>(new Map());

  useEffect(() => {
    if (!isHovering || !parsed) return;

    const activeAnimations: Animation[] = [];

    parsed.elements.forEach((el) => {
      const a = animations[el.id];
      if (!a?.ringEffect) return;

      const domEl = svgElRefs.current.get(el.id);
      if (!domEl) return;

      const angle = a.ringAngle || 20;
      const count = a.ringCount || 5;
      const dur = (a.duration || 0.6) * 1000;

      // Build decaying oscillation keyframes
      const keyframes: Keyframe[] = [{ transform: 'rotate(0deg)' }];
      for (let i = 0; i < count; i++) {
        const progress = (i + 0.5) / count;
        const decay = 1 - progress;
        const dir = i % 2 === 0 ? 1 : -1;
        const deg = angle * decay * dir;
        keyframes.push({ transform: `rotate(${deg.toFixed(1)}deg)`, offset: (i + 0.5) / count });
      }
      keyframes.push({ transform: 'rotate(0deg)' });

      const anim = domEl.animate(keyframes, {
        duration: dur,
        easing: 'ease-in-out',
        fill: 'forwards',
      });
      activeAnimations.push(anim);
    });

    return () => {
      activeAnimations.forEach(a => a.cancel());
    };
  }, [isHovering, parsed, animations]);

  function getPreviewStyle(elId: string): CSSProperties {
    const a = animations[elId];
    if (!a) return {};
    const dur = a.duration || 0.4;
    const del = a.delay || 0;
    const baseOrigin: CSSProperties = {
      transformOrigin: "center center",
      transformBox: "fill-box" as const,
      // Enable 3D rendering for perspective/rotateX/Y
      ...(a.perspective > 0 || a.rotateX !== 0 || a.rotateY !== 0
        ? { transformStyle: "preserve-3d" as const }
        : {}),
    };

    if (!isHovering) {
      return {
        transition: `all ${dur}s cubic-bezier(0.4, 0, 0.2, 1) ${del}s`,
        ...baseOrigin,
      };
    }

    // Ring/shake effect — handled by Web Animations API via useEffect
    if (a.ringEffect) {
      return { ...baseOrigin };
    }

    if (a.wrapAround) {
      const tx = a.translateX || 0;
      const ty = a.translateY || 0;
      return {
        transform: `translate(${tx * 3}px, ${ty * 3}px) rotate(${a.rotate}deg) scale(${a.scale})`,
        opacity: 0,
        transition: `all ${dur}s cubic-bezier(0.4, 0, 0.2, 1) ${del}s`,
        ...baseOrigin,
      };
    }

    // Build transform string with all properties
    const transforms: string[] = [];
    if (a.perspective > 0) transforms.push(`perspective(${a.perspective}px)`);
    transforms.push(`translate(${a.translateX}px, ${a.translateY}px)`);
    transforms.push(`rotate(${a.rotate}deg)`);
    if (a.rotateX !== 0) transforms.push(`rotateX(${a.rotateX}deg)`);
    if (a.rotateY !== 0) transforms.push(`rotateY(${a.rotateY}deg)`);
    transforms.push(`scale(${a.scale})`);
    if (a.skewX !== 0) transforms.push(`skewX(${a.skewX}deg)`);
    if (a.skewY !== 0) transforms.push(`skewY(${a.skewY}deg)`);

    // Build filter string
    const filters: string[] = [];
    if (a.blur > 0) filters.push(`blur(${a.blur}px)`);

    return {
      transform: transforms.join(" "),
      opacity: a.opacity,
      filter: filters.length > 0 ? filters.join(" ") : undefined,
      transition: `all ${dur}s cubic-bezier(0.4, 0, 0.2, 1) ${del}s`,
      ...baseOrigin,
    };
  }

  // Export code
  const exportCode = generateExportCode(parsed, animations, componentName || "MyIcon", frameSettings);

  function handleCopy() {
    navigator.clipboard.writeText(exportCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  // Trigger a browser download of in-memory content.
  function downloadFile(filename: string, content: string, type: string) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  const safeName = componentName || "MyIcon";

  function handleDownloadCode() {
    downloadFile(`${safeName}.tsx`, exportCode, "text/plain;charset=utf-8");
  }

  function handleSaveProject() {
    const project = JSON.stringify(
      { svgInput, animations, frameSettings, componentName: safeName },
      null,
      2
    );
    downloadFile(`${safeName}.iconproj.json`, project, "application/json");
  }

  function handleLoadProject(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(String(reader.result));
        if (typeof data.svgInput !== "string") return;
        const result = parseSVG(data.svgInput);
        if (!result || result.elements.length === 0) return;
        pushHistory(true);
        setSvgInput(data.svgInput);
        setParsed(result);
        setParseError(false);
        setSelectedIds(new Set());
        setShowCode(false);
        const anims: Animations = {};
        result.elements.forEach((el) => {
          anims[el.id] = { ...EMPTY_ANIM, ...(data.animations?.[el.id] || {}) };
        });
        setAnimations(anims);
        setFrameSettings({ ...DEFAULT_FRAME, ...(data.frameSettings || {}) });
        if (typeof data.componentName === "string") setComponentName(data.componentName);
      } catch {
        // Ignore invalid project files.
      }
    };
    reader.readAsText(file);
  }

  const anyAnimated =
    parsed &&
    parsed.elements.some((el) => hasAnimation(animations[el.id]));

  return (
    <div className="flex flex-col h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-200 overflow-hidden">
      {/* ===== HEADER ===== */}
      <header className="flex items-center justify-between px-4 py-2.5 border-b border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md bg-linear-to-br from-violet-600 to-purple-500 flex items-center justify-center text-white text-sm font-bold">
            ✦
          </div>
          <h1 className="font-bold text-sm tracking-tight">Icon Animator</h1>
          <span className="text-[10px] text-gray-500 dark:text-gray-500 bg-gray-200/60 dark:bg-gray-700/60 px-2 py-0.5 rounded-full">
            SVG → motion/react
          </span>
        </div>

        <div className="flex gap-2">
          {/* Undo / Redo */}
          <div className="flex gap-1">
            <button
              onClick={undo}
              disabled={!canUndo}
              title="Undo (Ctrl/Cmd+Z)"
              className="px-2.5 py-1.5 rounded-md text-xs font-medium bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              ↶
            </button>
            <button
              onClick={redo}
              disabled={!canRedo}
              title="Redo (Shift+Ctrl/Cmd+Z)"
              className="px-2.5 py-1.5 rounded-md text-xs font-medium bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              ↷
            </button>
          </div>
          <button
            onClick={() => setShowPaste(!showPaste)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${showPaste
              ? "bg-violet-600 text-white"
              : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
              }`}
          >
            Paste SVG
          </button>
          {/* Load project (always available) */}
          <button
            onClick={() => fileInputRef.current?.click()}
            title="Load a saved .iconproj.json project"
            className="px-3 py-1.5 rounded-md text-xs font-medium bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
          >
            Load
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            onChange={handleLoadProject}
            className="hidden"
          />
          {parsed && (
            <>
              <button
                onClick={handleSaveProject}
                title="Save your work as a .iconproj.json file"
                className="px-3 py-1.5 rounded-md text-xs font-medium bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
              >
                Save
              </button>
              <button
                onClick={resetAll}
                className="px-3 py-1.5 rounded-md text-xs font-medium bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
              >
                Reset All
              </button>
              <button
                onClick={() => setShowCode(!showCode)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${showCode
                  ? "bg-violet-600 text-white"
                  : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                  }`}
              >
                {showCode ? "Hide Code" : "View Code"}
              </button>
            </>
          )}
        </div>
      </header>

      {/* ===== PASTE AREA ===== */}
      {showPaste && (
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 shrink-0">
          <textarea
            value={svgInput}
            onChange={(e) => setSvgInput(e.target.value)}
            placeholder="Paste SVG code here (e.g. copied from lucide.dev)..."
            rows={4}
            className="w-full bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg p-3 text-xs font-mono resize-none focus:outline-none focus:border-violet-500 placeholder:text-gray-400 dark:placeholder:text-gray-600"
          />
          {parseError && (
            <p className="text-red-400 text-xs mt-1">
              Could not parse the SVG. Make sure you have pasted valid SVG code.
            </p>
          )}
          <button
            onClick={() => {
              loadSVG(svgInput);
              if (!parseError) setShowPaste(false);
            }}
            className="mt-2 px-4 py-1.5 rounded-md text-xs font-semibold bg-violet-600 text-white hover:bg-violet-500 transition-colors"
          >
            Load
          </button>
        </div>
      )}

      {/* ===== PRESET STRIP ===== */}
      <div className="flex items-center gap-1.5 px-4 py-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50 overflow-x-auto shrink-0">
        <span className="text-[9px] text-gray-500 dark:text-gray-500 uppercase tracking-widest mr-1 shrink-0">
          Icons:
        </span>
        {Object.entries(PRESETS).map(([name, svg]) => {
          const isActive = svgInput === svg;
          return (
            <button
              key={name}
              onClick={() => loadSVG(svg)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg shrink-0 border transition-colors ${isActive
                ? "bg-violet-950/60 border-violet-600"
                : "bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600"
                }`}
            >
              <span
                dangerouslySetInnerHTML={{
                  __html: svg
                    .replace('stroke="currentColor"', 'stroke="currentColor"')
                    .replace('width="24"', 'width="14"')
                    .replace('height="24"', 'height="14"'),
                }}
              />
              <span className="text-[10px] text-gray-600 dark:text-gray-400">{name}</span>
            </button>
          );
        })}
      </div>

      {/* ===== MAIN AREA ===== */}
      <div className="flex flex-1 overflow-hidden">
        {/* --- Element List --- */}
        {parsed && (
          <aside className="w-48 border-r border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50 overflow-y-auto shrink-0">
            <div className="px-3 pt-3 pb-1 text-[9px] text-gray-500 dark:text-gray-500 uppercase tracking-widest">
              Elements ({parsed.elements.length})
            </div>
            {parsed.elements.map((el) => {
              const a = animations[el.id];
              const animated = hasAnimation(a);
              const selected = selectedIds.has(el.id);
              return (
                <div
                  key={el.id}
                  className={`flex items-center gap-2 px-3 py-1.5 cursor-pointer transition-colors ${selected
                    ? "bg-gray-200/80 dark:bg-gray-700/80 border-l-2 border-violet-500"
                    : "border-l-2 border-transparent hover:bg-gray-100 dark:hover:bg-gray-800"
                    }`}
                  onClick={(e) => {
                    if (e.metaKey || e.ctrlKey) {
                      setSelectedIds((prev) => {
                        const next = new Set(prev);
                        if (next.has(el.id)) next.delete(el.id);
                        else next.add(el.id);
                        return next;
                      });
                    } else {
                      setSelectedIds(new Set([el.id]));
                    }
                  }}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full shrink-0 ${animated ? "bg-violet-500" : "bg-gray-300 dark:bg-gray-600"}`}
                  />
                  <span
                    className={`text-xs truncate ${selected ? "text-gray-900 dark:text-gray-100" : "text-gray-600 dark:text-gray-400"}`}
                  >
                    {el.tag}
                    <span className="text-gray-400 dark:text-gray-600"> #{el.index + 1}</span>
                  </span>
                  {animated && (
                    <span className="ml-auto text-[9px] text-violet-400">●</span>
                  )}
                </div>
              );
            })}
          </aside>
        )}

        {/* --- Canvas --- */}
        <main className="flex-1 flex flex-col items-center justify-center relative text-gray-800 dark:text-gray-200">
          {!parsed ? (
            <div className="text-center">
              <div className="text-5xl mb-4 opacity-20">✦</div>
              <p className="text-sm font-semibold text-gray-500 dark:text-gray-500 mb-2">
                Pick an icon to get started
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-600 max-w-[260px]">
                Use the presets above, or paste an SVG from{" "}
                <a
                  href="https://lucide.dev/icons"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-violet-400 hover:underline"
                >
                  lucide.dev
                </a>
              </p>
            </div>
          ) : (
            <>
              {/* Status */}
              <p className="text-[10px] text-gray-500 dark:text-gray-500 mb-3 tracking-wide">
                {isHovering
                  ? "▶ Playing animation..."
                  : "Hover = preview · Click = select · Drag = move"}
              </p>

              {/* Play / Stop toggle — animate without hovering */}
              <button
                onClick={() =>
                  setPinned((p) => {
                    const next = !p;
                    setIsHovering(next);
                    return next;
                  })
                }
                className={`mb-3 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${pinned
                  ? "bg-violet-600 text-white"
                  : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                  }`}
              >
                {pinned ? "⏸ Stop" : "▶ Play"}
              </button>

              {/* Preview box */}
              <div
                ref={canvasRef}
                onMouseEnter={() => setIsHovering(true)}
                onMouseLeave={() => { if (!pinned) setIsHovering(false); }}
                style={{
                  width: 200,
                  height: 200,
                  minWidth: 120,
                  minHeight: 120,
                  ...(frameSettings.enabled ? {
                    borderRadius: frameSettings.borderRadius,
                    border: `${frameSettings.borderWidth}px solid ${frameSettings.borderColor}`,
                    backgroundColor: frameSettings.bgColor,
                    padding: frameSettings.padding,
                  } : {}),
                }}
                className={`rounded-2xl flex items-center justify-center cursor-pointer transition-all duration-300 ${isHovering
                  ? "bg-gray-200/60 dark:bg-gray-700/60 border border-violet-500/60 shadow-[0_0_40px_rgba(124,58,237,0.15)]"
                  : frameSettings.enabled ? "" : "bg-gray-100/80 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700"
                  }`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox={parsed.viewBox}
                  width={previewScale}
                  height={previewScale}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ overflow: "visible" }}
                >

                  {parsed.elements.map((el) => (
                    <SvgElement
                      key={el.id}
                      tag={el.tag}
                      attrs={el.attrs}
                      isSelected={selectedIds.has(el.id)}
                      style={getPreviewStyle(el.id)}
                      onMouseDown={(e) => handleElementMouseDown(e, el.id)}
                      anim={isHovering ? animations[el.id] : undefined}
                      elRef={(node) => { svgElRefs.current.set(el.id, node); }}
                    />
                  ))}
                </svg>
              </div>

              {/* Small preview at normal size */}
              <div className="mt-4 flex items-center gap-3">
                <span className="text-[9px] text-gray-400 dark:text-gray-600 uppercase">24px:</span>
                <div
                  onMouseEnter={() => setIsHovering(true)}
                  onMouseLeave={() => { if (!pinned) setIsHovering(false); }}
                  className="cursor-pointer p-2 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox={parsed.viewBox}
                    width={24}
                    height={24}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >

                    {parsed.elements.map((el) => (
                      <SvgElement
                        key={el.id}
                        tag={el.tag}
                        attrs={el.attrs}
                        isSelected={false}
                        style={getPreviewStyle(el.id)}
                        onMouseDown={() => { }}
                        anim={isHovering ? animations[el.id] : undefined}
                      />
                    ))}
                  </svg>
                </div>
                <span className="text-[9px] text-gray-400 dark:text-gray-600 uppercase">48px:</span>
                <div
                  onMouseEnter={() => setIsHovering(true)}
                  onMouseLeave={() => { if (!pinned) setIsHovering(false); }}
                  className="cursor-pointer p-2 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox={parsed.viewBox}
                    width={48}
                    height={48}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >

                    {parsed.elements.map((el) => (
                      <SvgElement
                        key={el.id}
                        tag={el.tag}
                        attrs={el.attrs}
                        isSelected={false}
                        style={getPreviewStyle(el.id)}
                        onMouseDown={() => { }}
                        anim={isHovering ? animations[el.id] : undefined}
                      />
                    ))}
                  </svg>
                </div>
              </div>

              {/* Preview scale slider */}
              <div className="mt-4 w-48">
                <div className="flex justify-between mb-1">
                  <span className="text-[9px] text-gray-500 dark:text-gray-500 uppercase tracking-widest">Preview</span>
                  <span className="text-[10px] text-violet-300 font-mono font-semibold">{previewScale}px</span>
                </div>
                <input
                  type="range"
                  min={24}
                  max={256}
                  step={8}
                  value={previewScale}
                  onChange={(e) => setPreviewScale(parseInt(e.target.value))}
                  className="w-full h-1 accent-violet-600 cursor-pointer"
                />
              </div>
            </>
          )}
        </main>

        {/* --- Controls Panel --- */}
        {parsed && (
          <aside className="w-64 border-l border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50 overflow-y-auto shrink-0 p-4">
            {selectedId && selectedAnim ? (
              <>
                <div className="flex justify-between items-center mb-3">
                  <span className="text-[10px] text-gray-500 dark:text-gray-500 uppercase tracking-widest">
                    Animation
                  </span>
                  <button
                    onClick={() => resetAnim(selectedId)}
                    className="text-[9px] text-gray-600 dark:text-gray-400 bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
                  >
                    Reset
                  </button>
                </div>

                {/* Direction presets */}
                <p className="text-[9px] text-gray-400 dark:text-gray-600 uppercase tracking-widest mb-2">
                  Presets
                </p>
                <div className="flex flex-wrap gap-1 mb-4">
                  {Object.entries(ANIM_PRESETS).map(([name, preset]) => (
                    <button
                      key={name}
                      onClick={() => {
                        pushHistory(true);
                        setAnimations((prev) => ({
                          ...prev,
                          [selectedId]: { ...prev[selectedId], ...preset },
                        }));
                      }}
                      className="px-2 py-1 rounded text-[10px] bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                    >
                      {name}
                    </button>
                  ))}
                </div>

                {/* Position */}
                <p className="text-[9px] text-gray-400 dark:text-gray-600 uppercase tracking-widest mb-2">
                  Position
                </p>
                <Slider
                  label="Translate X"
                  value={selectedAnim.translateX}
                  onChange={(v) => updateAnim(selectedId, "translateX", v)}
                  min={-12}
                  max={12}
                  step={0.5}
                  unit="px"
                />
                <Slider
                  label="Translate Y"
                  value={selectedAnim.translateY}
                  onChange={(v) => updateAnim(selectedId, "translateY", v)}
                  min={-12}
                  max={12}
                  step={0.5}
                  unit="px"
                />

                {/* Wrap-around toggle */}
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-xs text-gray-600 dark:text-gray-400">Wrap-around ↻</span>
                  <button
                    onClick={() =>
                      updateAnim(selectedId, "wrapAround", !selectedAnim.wrapAround)
                    }
                    className={`px-2.5 py-1 rounded text-[10px] font-medium transition-colors ${selectedAnim.wrapAround
                      ? "bg-violet-600 text-white"
                      : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                      }`}
                  >
                    {selectedAnim.wrapAround ? "On" : "Off"}
                  </button>
                </div>

                {/* Transform */}
                <p className="text-[9px] text-gray-400 dark:text-gray-600 uppercase tracking-widest mb-2 mt-3">
                  Transform
                </p>
                <Slider
                  label="Rotate"
                  value={selectedAnim.rotate}
                  onChange={(v) => updateAnim(selectedId, "rotate", v)}
                  min={-360}
                  max={360}
                  step={5}
                  unit="°"
                />
                <Slider
                  label="Scale"
                  value={selectedAnim.scale}
                  onChange={(v) => updateAnim(selectedId, "scale", v)}
                  min={0}
                  max={2}
                  step={0.05}
                />
                <Slider
                  label="Opacity"
                  value={selectedAnim.opacity}
                  onChange={(v) => updateAnim(selectedId, "opacity", v)}
                  min={0}
                  max={1}
                  step={0.05}
                />

                {/* Colors */}
                <p className="text-[9px] text-gray-400 dark:text-gray-600 uppercase tracking-widest mb-2 mt-3">
                  Colors
                </p>
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-xs text-gray-600 dark:text-gray-400">Stroke Color</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={selectedAnim.strokeColor || "#e2e8f0"}
                      onChange={(e) => updateAnim(selectedId, "strokeColor", e.target.value)}
                      className="w-6 h-6 rounded cursor-pointer bg-transparent border border-gray-300 dark:border-gray-600"
                    />
                    {selectedAnim.strokeColor && (
                      <button
                        onClick={() => updateAnim(selectedId, "strokeColor", "")}
                        className="text-[9px] text-gray-500 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                      >✕</button>
                    )}
                  </div>
                </div>
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-xs text-gray-600 dark:text-gray-400">Fill Color</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={selectedAnim.fillColor || "#000000"}
                      onChange={(e) => updateAnim(selectedId, "fillColor", e.target.value)}
                      className="w-6 h-6 rounded cursor-pointer bg-transparent border border-gray-300 dark:border-gray-600"
                    />
                    {selectedAnim.fillColor && (
                      <button
                        onClick={() => updateAnim(selectedId, "fillColor", "")}
                        className="text-[9px] text-gray-500 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                      >✕</button>
                    )}
                  </div>
                </div>

                {/* Effects */}
                <p className="text-[9px] text-gray-400 dark:text-gray-600 uppercase tracking-widest mb-2 mt-3">
                  Effects
                </p>
                <Slider
                  label="Stroke Draw"
                  value={selectedAnim.strokeDraw}
                  onChange={(v) => updateAnim(selectedId, "strokeDraw", v)}
                  min={0}
                  max={1}
                  step={0.05}
                />
                <Slider
                  label="Blur"
                  value={selectedAnim.blur}
                  onChange={(v) => updateAnim(selectedId, "blur", v)}
                  min={0}
                  max={20}
                  step={0.5}
                  unit="px"
                />
                <Slider
                  label="Skew X"
                  value={selectedAnim.skewX}
                  onChange={(v) => updateAnim(selectedId, "skewX", v)}
                  min={-45}
                  max={45}
                  step={1}
                  unit="°"
                />
                <Slider
                  label="Skew Y"
                  value={selectedAnim.skewY}
                  onChange={(v) => updateAnim(selectedId, "skewY", v)}
                  min={-45}
                  max={45}
                  step={1}
                  unit="°"
                />

                {/* Ring / Shake */}
                <p className="text-[9px] text-gray-400 dark:text-gray-600 uppercase tracking-widest mb-2 mt-3">
                  Ring / Shake
                </p>
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-xs text-gray-600 dark:text-gray-400">Ring Effect 🔔</span>
                  <button
                    onClick={() =>
                      updateAnim(selectedId, "ringEffect", !selectedAnim.ringEffect)
                    }
                    className={`px-2.5 py-1 rounded text-[10px] font-medium transition-colors ${selectedAnim.ringEffect
                      ? "bg-violet-600 text-white"
                      : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                      }`}
                  >
                    {selectedAnim.ringEffect ? "On" : "Off"}
                  </button>
                </div>
                {selectedAnim.ringEffect && (
                  <>
                    <Slider
                      label="Angle"
                      value={selectedAnim.ringAngle}
                      onChange={(v) => updateAnim(selectedId, "ringAngle", v)}
                      min={5}
                      max={45}
                      step={1}
                      unit="°"
                    />
                    <Slider
                      label="Count"
                      value={selectedAnim.ringCount}
                      onChange={(v) => updateAnim(selectedId, "ringCount", v)}
                      min={2}
                      max={12}
                      step={1}
                    />
                  </>
                )}

                {/* 3D Perspective */}
                <p className="text-[9px] text-gray-400 dark:text-gray-600 uppercase tracking-widest mb-2 mt-3">
                  3D Perspective
                </p>
                <Slider
                  label="Rotate X"
                  value={selectedAnim.rotateX}
                  onChange={(v) => updateAnim(selectedId, "rotateX", v)}
                  min={-180}
                  max={180}
                  step={5}
                  unit="°"
                />
                <Slider
                  label="Rotate Y"
                  value={selectedAnim.rotateY}
                  onChange={(v) => updateAnim(selectedId, "rotateY", v)}
                  min={-180}
                  max={180}
                  step={5}
                  unit="°"
                />
                <Slider
                  label="Perspective"
                  value={selectedAnim.perspective}
                  onChange={(v) => updateAnim(selectedId, "perspective", v)}
                  min={0}
                  max={1000}
                  step={50}
                  unit="px"
                />

                {/* Timing */}
                <p className="text-[9px] text-gray-400 dark:text-gray-600 uppercase tracking-widest mb-2 mt-3">
                  Timing
                </p>
                <Slider
                  label="Duration"
                  value={selectedAnim.duration}
                  onChange={(v) => updateAnim(selectedId, "duration", v)}
                  min={0.1}
                  max={2}
                  step={0.05}
                  unit="s"
                />
                <Slider
                  label="Delay"
                  value={selectedAnim.delay}
                  onChange={(v) => updateAnim(selectedId, "delay", v)}
                  min={0}
                  max={1}
                  step={0.05}
                  unit="s"
                />

                <div className="mb-3">
                  <span className="text-xs text-gray-600 dark:text-gray-400 block mb-2">
                    Easing
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {EASINGS.map((ease) => (
                      <button
                        key={ease}
                        onClick={() => updateAnim(selectedId, "ease", ease)}
                        className={`px-2 py-0.5 rounded text-[9px] transition-colors ${selectedAnim.ease === ease
                          ? "bg-violet-600 text-white"
                          : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                          }`}
                      >
                        {ease}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center text-gray-400 dark:text-gray-600 mt-8">
                <p className="text-2xl mb-3">☝</p>
                <p className="text-xs">
                  Click an element in the list or in the preview to
                  edit its animation.
                </p>
              </div>
            )}

            {/* === Frame Settings (always visible when parsed) === */}
            <div className="border-t border-gray-200 dark:border-gray-700 mt-4 pt-4">
              <div className="flex justify-between items-center mb-3">
                <span className="text-[10px] text-gray-500 dark:text-gray-500 uppercase tracking-widest">
                  Frame
                </span>
                <button
                  onClick={() =>
                    updateFrame((prev) => ({
                      ...prev,
                      enabled: !prev.enabled,
                    }))
                  }
                  className={`px-2.5 py-1 rounded text-[10px] font-medium transition-colors ${frameSettings.enabled
                    ? "bg-violet-600 text-white"
                    : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                    }`}
                >
                  {frameSettings.enabled ? "On" : "Off"}
                </button>
              </div>

              {frameSettings.enabled && (
                <>
                  <Slider
                    label="Border Radius"
                    value={frameSettings.borderRadius}
                    onChange={(v) =>
                      updateFrame((prev) => ({
                        ...prev,
                        borderRadius: v,
                      }))
                    }
                    min={0}
                    max={50}
                    step={1}
                    unit="px"
                  />
                  <Slider
                    label="Border Width"
                    value={frameSettings.borderWidth}
                    onChange={(v) =>
                      updateFrame((prev) => ({
                        ...prev,
                        borderWidth: v,
                      }))
                    }
                    min={0}
                    max={4}
                    step={0.5}
                    unit="px"
                  />
                  <Slider
                    label="Padding"
                    value={frameSettings.padding}
                    onChange={(v) =>
                      updateFrame((prev) => ({ ...prev, padding: v }))
                    }
                    min={0}
                    max={24}
                    step={1}
                    unit="px"
                  />

                  {/* Border color */}
                  <div className="mb-3">
                    <span className="text-xs text-gray-600 dark:text-gray-400 block mb-1">
                      Border Color
                    </span>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={frameSettings.borderColor}
                        onChange={(e) =>
                          updateFrame((prev) => ({
                            ...prev,
                            borderColor: e.target.value,
                          }))
                        }
                        className="w-6 h-6 rounded border border-gray-300 dark:border-gray-600 cursor-pointer bg-transparent"
                      />
                      <span className="text-[10px] text-gray-600 dark:text-gray-400 font-mono">
                        {frameSettings.borderColor}
                      </span>
                    </div>
                  </div>

                  {/* Background color */}
                  <div className="mb-3">
                    <span className="text-xs text-gray-600 dark:text-gray-400 block mb-1">
                      Background Color
                    </span>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={
                          frameSettings.bgColor === "transparent"
                            ? "#000000"
                            : frameSettings.bgColor
                        }
                        onChange={(e) =>
                          updateFrame((prev) => ({
                            ...prev,
                            bgColor: e.target.value,
                          }))
                        }
                        className="w-6 h-6 rounded border border-gray-300 dark:border-gray-600 cursor-pointer bg-transparent"
                      />
                      <span className="text-[10px] text-gray-600 dark:text-gray-400 font-mono">
                        {frameSettings.bgColor}
                      </span>
                      {frameSettings.bgColor !== "transparent" && (
                        <button
                          onClick={() =>
                            updateFrame((prev) => ({
                              ...prev,
                              bgColor: "transparent",
                            }))
                          }
                          className="text-[9px] text-gray-500 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </aside>
        )}
      </div>

      {/* ===== CODE PANEL ===== */}
      {showCode && parsed && (
        <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shrink-0 flex flex-col" style={{ maxHeight: 280 }}>
          <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-gray-500 dark:text-gray-500 uppercase tracking-wide">
                Export
              </span>
              <input
                value={componentName}
                onChange={(e) =>
                  setComponentName(
                    e.target.value.replace(/[^a-zA-Z0-9]/g, "")
                  )
                }
                className="bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded px-2 py-0.5 text-xs font-mono w-28 focus:outline-none focus:border-violet-500"
                placeholder="Component name"
              />
              <span className="text-[10px] text-gray-400 dark:text-gray-600">.tsx</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleDownloadCode}
                className="px-4 py-1 rounded-md text-xs font-semibold bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                Download .tsx
              </button>
              <button
                onClick={handleCopy}
                className={`px-4 py-1 rounded-md text-xs font-semibold transition-colors ${copied
                  ? "bg-emerald-600 text-white"
                  : "bg-violet-600 text-white hover:bg-violet-500"
                  }`}
              >
                {copied ? "✓ Copied!" : "Copy Code"}
              </button>
            </div>
          </div>
          <pre className="flex-1 overflow-auto p-4 text-[10px] leading-relaxed font-mono text-violet-300/80">
            {exportCode}
          </pre>
        </div>
      )}
    </div>
  );
}
