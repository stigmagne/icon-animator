"use client";

import React, {
  useState,
  useRef,
  useCallback,
  useEffect,
  useMemo,
  CSSProperties,
  MouseEvent as ReactMouseEvent,
} from "react";

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
  strokeColor: string;
  fillColor: string;
  strokeDraw: number;
  blur: number;
  skewX: number;
  skewY: number;
  ringEffect: boolean;
  ringAngle: number;
  ringCount: number;
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

type Animations = Record<string, AnimationState>;

// ============================================================
// Constants
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

function parseSVG(svgString: string): ParsedSVG | null {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgString.trim(), "image/svg+xml");
    if (doc.querySelector("parsererror")) return null;
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
        elements.push({ id: `el_${idx}`, tag: node.tagName.toLowerCase(), attrs, index: idx });
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
  translateX: 0, translateY: 0, rotate: 0, scale: 1, opacity: 1,
  duration: 0.4, delay: 0, ease: "easeInOut", wrapAround: false,
  strokeColor: "", fillColor: "", strokeDraw: 0, blur: 0,
  skewX: 0, skewY: 0, ringEffect: false, ringAngle: 20, ringCount: 5,
  rotateX: 0, rotateY: 0, perspective: 0,
};

const DEFAULT_FRAME: FrameSettings = {
  enabled: false, borderRadius: 12, borderWidth: 2,
  borderColor: "#d1d5db", bgColor: "transparent", padding: 8,
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
    a.translateX !== 0 || a.translateY !== 0 || a.rotate !== 0 ||
    a.scale !== 1 || a.opacity !== 1 || a.strokeColor !== "" ||
    a.fillColor !== "" || a.strokeDraw !== 0 || a.blur !== 0 ||
    a.skewX !== 0 || a.skewY !== 0 || a.ringEffect ||
    a.rotateX !== 0 || a.rotateY !== 0
  );
}

function toCamel(str: string) {
  return str.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
}

function svgAttrsToReact(attrs: Record<string, string>, skip: string[] = []) {
  const result: Record<string, string> = {};
  for (const [k, v] of Object.entries(attrs)) {
    if (skip.includes(k)) continue;
    result[toCamel(k)] = v;
  }
  return result;
}

// ============================================================
// SvgElement — renders a single SVG shape
// ============================================================

function SvgElement({
  tag, attrs, isSelected, style, onMouseDown, anim, elRef,
}: {
  tag: string;
  attrs: Record<string, string>;
  isSelected: boolean;
  style: CSSProperties;
  onMouseDown: (e: ReactMouseEvent) => void;
  anim?: AnimationState;
  elRef?: (el: SVGElement | null) => void;
}) {
  const skip = ["fill", "stroke", "stroke-width", "stroke-linecap", "stroke-linejoin"];
  const reactAttrs = svgAttrsToReact(attrs, skip);

  const strokeVal = anim?.strokeColor || (isSelected ? "#a78bfa" : "currentColor");
  const fillVal = anim?.fillColor || "none";

  const strokeDrawProps: Record<string, string | number> = {};
  if (anim && anim.strokeDraw > 0) {
    strokeDrawProps.strokeDasharray = 100;
    strokeDrawProps.strokeDashoffset = anim.strokeDraw * 100;
  }

  const styleFilter = (style as Record<string, unknown>)?.filter as string | undefined;
  const selectionFilter = isSelected ? "drop-shadow(0 0 4px rgba(167,139,250,0.5))" : "";
  const combinedFilter = [styleFilter, selectionFilter].filter(Boolean).join(" ") || "none";

  const props = {
    ...reactAttrs,
    stroke: strokeVal,
    strokeWidth: isSelected ? "2.5" : "2",
    fill: fillVal,
    ...strokeDrawProps,
    style: { ...style, cursor: "grab", filter: combinedFilter },
    onMouseDown,
  };

  return (
    <>
      {(() => {
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
      })()}
    </>
  );
}

// ============================================================
// PreviewSVG — shared SVG canvas (replaces 3 duplicated blocks)
// ============================================================

function PreviewSVG({
  parsed, size, isHovering, animations, selectedIds, getPreviewStyle,
  onElementMouseDown, svgElRefs,
}: {
  parsed: ParsedSVG;
  size: number;
  isHovering: boolean;
  animations: Animations;
  selectedIds?: Set<string>;
  getPreviewStyle: (elId: string) => CSSProperties;
  onElementMouseDown?: (e: ReactMouseEvent, elId: string) => void;
  svgElRefs?: React.MutableRefObject<Map<string, SVGElement | null>>;
}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={parsed.viewBox}
      width={size}
      height={size}
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
          isSelected={!!(selectedIds?.has(el.id))}
          style={getPreviewStyle(el.id)}
          onMouseDown={onElementMouseDown ? (e) => onElementMouseDown(e, el.id) : () => {}}
          anim={isHovering ? animations[el.id] : undefined}
          elRef={svgElRefs ? (node) => { svgElRefs.current.set(el.id, node); } : undefined}
        />
      ))}
    </svg>
  );
}

// ============================================================
// Code generation
// ============================================================

function generateExportCode(
  parsed: ParsedSVG | null,
  animations: Animations,
  name: string,
  frame: FrameSettings,
) {
  if (!parsed) return "";

  const motionImport = ["motion", "react"].join("/");
  const { viewBox, elements } = parsed;

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
    if (a.skewX !== 0) props.push(`skewX: ${a.skewX}`);
    if (a.skewY !== 0) props.push(`skewY: ${a.skewY}`);
    if (a.rotateX !== 0) props.push(`rotateX: ${a.rotateX}`);
    if (a.rotateY !== 0) props.push(`rotateY: ${a.rotateY}`);
    if (a.blur > 0) props.push(`filter: "blur(${a.blur}px)"`);
    if (a.strokeColor) props.push(`stroke: "${a.strokeColor}"`);
    if (a.fillColor) props.push(`fill: "${a.fillColor}"`);
    if (a.strokeDraw > 0) props.push(`pathLength: 1`);

    const opts = [`duration: ${a.duration}`, `ease: "${a.ease}"`];
    if (a.delay > 0) opts.push(`delay: ${a.delay}`);

    startCalls.push(`        animate(".${el.id}", { ${props.join(", ")} }, { ${opts.join(", ")} })`);

    const resetProps = [`x: 0`, `y: 0`, `rotate: 0`, `scale: 1`, `opacity: 1`];
    if (a.skewX !== 0) resetProps.push(`skewX: 0`);
    if (a.skewY !== 0) resetProps.push(`skewY: 0`);
    if (a.rotateX !== 0) resetProps.push(`rotateX: 0`);
    if (a.rotateY !== 0) resetProps.push(`rotateY: 0`);
    if (a.blur > 0) resetProps.push(`filter: "blur(0px)"`);
    if (a.strokeColor) resetProps.push(`stroke: color`);
    if (a.fillColor) resetProps.push(`fill: "none"`);
    if (a.strokeDraw > 0) resetProps.push(`pathLength: 0`);
    endCalls.push(`        animate(".${el.id}", { ${resetProps.join(", ")} }, { duration: ${a.duration}, ease: "${a.ease}" })`);
  }

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

  const children = elements
    .map((el) => {
      const a = animations[el.id];
      const attrPairs = Object.entries(el.attrs)
        .filter(([k]) => k !== "xmlns")
        .map(([k, v]) => `${toCamel(k)}="${v}"`)
        .join(" ");
      const initProps: string[] = [];
      if (a?.strokeDraw > 0) initProps.push(`pathLength={0}`);
      if (a?.blur > 0) initProps.push(`style={{ filter: "blur(${a.blur}px)" }}`);
      if (a?.perspective > 0) initProps.push(`style={{ perspective: ${a.perspective} }}`);
      const extra = initProps.length > 0 ? " " + initProps.join(" ") : "";
      return `        <motion.${el.tag} className="${el.id}" ${attrPairs}${extra} />`;
    })
    .join("\n");

  let startBody = "";
  if (startCalls.length > 0) startBody += `      await Promise.all([\n${startCalls.join(",\n")}\n      ]);\n`;
  if (ringStartLines.length > 0) startBody += ringStartLines.join("\n") + "\n";
  if (wrapStartLines.length > 0) startBody += wrapStartLines.join("\n") + "\n";

  let endBody = "      await Promise.all([\n";
  endBody += [...endCalls, ...ringEndLines, ...wrapEndLines].join(",\n");
  endBody += "\n      ]);\n";

  const wrapperStyle = frame.enabled
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
// Slider
// ============================================================

function Slider({
  label, value, onChange, min, max, step = 0.1, unit = "",
}: {
  label: string; value: number; onChange: (v: number) => void;
  min: number; max: number; step?: number; unit?: string;
}) {
  return (
    <div className="mb-3">
      <div className="flex justify-between mb-1">
        <span className="text-xs text-gray-600 dark:text-gray-400">{label}</span>
        <span className="text-xs text-violet-300 font-mono font-semibold tabular-nums">
          {value.toFixed(step < 1 ? 1 : 0)}{unit}
        </span>
      </div>
      <input
        type="range"
        min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-1 accent-violet-600 cursor-pointer"
      />
    </div>
  );
}

// ============================================================
// Main Page Component — v3
// ============================================================

export default function IconAnimatorPage() {
  const [svgInput, setSvgInput] = useState("");
  const [parsed, setParsed] = useState<ParsedSVG | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [animations, setAnimations] = useState<Animations>({});
  const [isHovering, setIsHovering] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);        // v3: auto-play loop
  const [applyToAll, setApplyToAll] = useState(false);      // v3: preset → all elements
  const [showCode, setShowCode] = useState(false);
  const [showPaste, setShowPaste] = useState(false);
  const [componentName, setComponentName] = useState("MyIcon");
  const [copied, setCopied] = useState(false);
  const [parseError, setParseError] = useState(false);
  const [previewScale, setPreviewScale] = useState(128);
  const [frameSettings, setFrameSettings] = useState<FrameSettings>({ ...DEFAULT_FRAME });

  const canvasRef = useRef<HTMLDivElement>(null);
  const dragState = useRef<{
    active: boolean; startX?: number; startY?: number; elId?: string;
    pxPerUnit?: number; origTx?: number; origTy?: number;
  }>({ active: false });

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
    setIsPlaying(false);
    const anims: Animations = {};
    result.elements.forEach((el) => { anims[el.id] = { ...EMPTY_ANIM }; });
    setAnimations(anims);
  }, []);

  const updateAnim = useCallback((_id: string, key: string, val: number | string | boolean) => {
    setSelectedIds((sel) => {
      setAnimations((prev) => {
        const next = { ...prev };
        sel.forEach((id) => { next[id] = { ...next[id], [key]: val }; });
        return next;
      });
      return sel;
    });
  }, []);

  const resetAnim = useCallback((_id: string) => {
    setSelectedIds((sel) => {
      setAnimations((prev) => {
        const next = { ...prev };
        sel.forEach((id) => { next[id] = { ...EMPTY_ANIM }; });
        return next;
      });
      return sel;
    });
  }, []);

  const resetAll = useCallback(() => {
    if (!parsed) return;
    const anims: Animations = {};
    parsed.elements.forEach((el) => { anims[el.id] = { ...EMPTY_ANIM }; });
    setAnimations(anims);
    setIsPlaying(false);
  }, [parsed]);

  // v3: Select all / deselect all elements
  const selectAll = useCallback(() => {
    if (!parsed) return;
    setSelectedIds(new Set(parsed.elements.map((el) => el.id)));
  }, [parsed]);

  const deselectAll = useCallback(() => setSelectedIds(new Set()), []);

  const selectedId = selectedIds.size > 0 ? Array.from(selectedIds)[0] : null;
  const selectedAnim = selectedId ? animations[selectedId] ?? EMPTY_ANIM : null;

  const anyAnimated = !!(parsed && parsed.elements.some((el) => hasAnimation(animations[el.id])));
  const animatedCount = parsed ? parsed.elements.filter((el) => hasAnimation(animations[el.id])).length : 0;

  // v3: Max animation duration — used by the auto-play loop
  const maxAnimDuration = useMemo(() => {
    if (!parsed) return 0.4;
    const durs = parsed.elements
      .filter((el) => hasAnimation(animations[el.id]))
      .map((el) => (animations[el.id]?.duration ?? 0.4) + (animations[el.id]?.delay ?? 0));
    return durs.length > 0 ? Math.max(...durs) : 0.4;
  }, [parsed, animations]);

  // v3: Auto-play loop — toggles isHovering to continuously replay animations
  useEffect(() => {
    if (!isPlaying || !anyAnimated) {
      setIsHovering(false);
      return;
    }
    let cancelled = false;
    const forwardMs = maxAnimDuration * 1000 + 300;
    const pauseMs = 500;

    async function playLoop() {
      while (!cancelled) {
        setIsHovering(true);
        await new Promise((r) => setTimeout(r, forwardMs));
        if (cancelled) break;
        setIsHovering(false);
        await new Promise((r) => setTimeout(r, pauseMs));
      }
    }
    playLoop();
    return () => { cancelled = true; setIsHovering(false); };
  }, [isPlaying, maxAnimDuration, anyAnimated]);

  // Stop auto-play when animations are cleared
  useEffect(() => {
    if (!anyAnimated) setIsPlaying(false);
  }, [anyAnimated]);

  // Drag to set translateX/Y
  const handleElementMouseDown = useCallback(
    (e: ReactMouseEvent, elId: string) => {
      e.preventDefault();
      e.stopPropagation();
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
      const pxPerUnit = rect.width / 24;
      dragState.current = {
        active: true, startX: e.clientX, startY: e.clientY, elId,
        pxPerUnit, origTx: animations[elId]?.translateX ?? 0,
        origTy: animations[elId]?.translateY ?? 0,
      };
    },
    [animations],
  );

  useEffect(() => {
    function onMove(e: globalThis.MouseEvent) {
      const d = dragState.current;
      if (!d.active) return;
      const dx = (e.clientX - (d.startX ?? 0)) / (d.pxPerUnit ?? 1);
      const dy = (e.clientY - (d.startY ?? 0)) / (d.pxPerUnit ?? 1);
      const tx = Math.round(((d.origTx ?? 0) + dx) * 2) / 2;
      const ty = Math.round(((d.origTy ?? 0) + dy) * 2) / 2;
      if (d.elId) {
        setAnimations((prev) => ({
          ...prev,
          [d.elId!]: { ...prev[d.elId!], translateX: tx, translateY: ty },
        }));
      }
    }
    function onUp() { dragState.current.active = false; }
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, []);

  // Ring effect via Web Animations API
  const svgElRefs = useRef<Map<string, SVGElement | null>>(new Map());

  useEffect(() => {
    if (!isHovering || !parsed) return;
    const active: Animation[] = [];
    parsed.elements.forEach((el) => {
      const a = animations[el.id];
      if (!a?.ringEffect) return;
      const domEl = svgElRefs.current.get(el.id);
      if (!domEl) return;
      const angle = a.ringAngle ?? 20;
      const count = a.ringCount ?? 5;
      const dur = (a.duration ?? 0.6) * 1000;
      const keyframes: Keyframe[] = [{ transform: "rotate(0deg)" }];
      for (let i = 0; i < count; i++) {
        const decay = 1 - i / count;
        const dir = i % 2 === 0 ? 1 : -1;
        keyframes.push({
          transform: `rotate(${(angle * decay * dir).toFixed(1)}deg)`,
          offset: (i + 0.5) / count,
        });
      }
      keyframes.push({ transform: "rotate(0deg)" });
      active.push(domEl.animate(keyframes, { duration: dur, easing: "ease-in-out", fill: "forwards" }));
    });
    return () => active.forEach((a) => a.cancel());
  }, [isHovering, parsed, animations]);

  function getPreviewStyle(elId: string): CSSProperties {
    const a = animations[elId];
    if (!a) return {};
    const dur = a.duration ?? 0.4;
    const del = a.delay ?? 0;
    const baseOrigin: CSSProperties = {
      transformOrigin: "center center",
      transformBox: "fill-box" as const,
      ...(a.perspective > 0 || a.rotateX !== 0 || a.rotateY !== 0
        ? { transformStyle: "preserve-3d" as const } : {}),
    };
    if (!isHovering) {
      return { transition: `all ${dur}s cubic-bezier(0.4, 0, 0.2, 1) ${del}s`, ...baseOrigin };
    }
    if (a.ringEffect) return { ...baseOrigin };
    if (a.wrapAround) {
      return {
        transform: `translate(${(a.translateX ?? 0) * 3}px, ${(a.translateY ?? 0) * 3}px) rotate(${a.rotate}deg) scale(${a.scale})`,
        opacity: 0,
        transition: `all ${dur}s cubic-bezier(0.4, 0, 0.2, 1) ${del}s`,
        ...baseOrigin,
      };
    }
    const transforms: string[] = [];
    if (a.perspective > 0) transforms.push(`perspective(${a.perspective}px)`);
    transforms.push(`translate(${a.translateX}px, ${a.translateY}px)`);
    transforms.push(`rotate(${a.rotate}deg)`);
    if (a.rotateX !== 0) transforms.push(`rotateX(${a.rotateX}deg)`);
    if (a.rotateY !== 0) transforms.push(`rotateY(${a.rotateY}deg)`);
    transforms.push(`scale(${a.scale})`);
    if (a.skewX !== 0) transforms.push(`skewX(${a.skewX}deg)`);
    if (a.skewY !== 0) transforms.push(`skewY(${a.skewY}deg)`);
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

  const exportCode = generateExportCode(parsed, animations, componentName || "MyIcon", frameSettings);

  function handleCopy() {
    navigator.clipboard.writeText(exportCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  // v3: Download .tsx file
  function handleDownload() {
    const blob = new Blob([exportCode], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${componentName || "MyIcon"}.tsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // v3: Auto-parse on paste into the textarea
  function handleSVGPaste(e: React.ClipboardEvent<HTMLTextAreaElement>) {
    const text = e.clipboardData.getData("text");
    const trimmed = text.trim();
    if (trimmed.toLowerCase().startsWith("<svg")) {
      e.preventDefault();
      loadSVG(trimmed);
      setShowPaste(false);
    }
  }

  return (
    <div className="flex flex-col h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-200 overflow-hidden">

      {/* ===== HEADER ===== */}
      <header className="flex items-center justify-between px-4 py-2.5 border-b border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md bg-linear-to-br from-violet-600 to-purple-500 flex items-center justify-center text-white text-sm font-bold">
            ✦
          </div>
          <h1 className="font-bold text-sm tracking-tight">Icon Animator</h1>
          {/* v3 badge */}
          <span className="text-[10px] font-mono font-semibold bg-violet-600/20 text-violet-300 px-2 py-0.5 rounded-full">
            v3
          </span>
          <span className="text-[10px] text-gray-500 dark:text-gray-500 bg-gray-200/60 dark:bg-gray-700/60 px-2 py-0.5 rounded-full">
            SVG → motion/react
          </span>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setShowPaste(!showPaste)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${showPaste
              ? "bg-violet-600 text-white"
              : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
            }`}
          >
            Paste SVG
          </button>
          {parsed && (
            <>
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
            onPaste={handleSVGPaste}
            placeholder="Paste SVG code here — it loads automatically on paste (e.g. from lucide.dev)..."
            rows={4}
            className="w-full bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg p-3 text-xs font-mono resize-none focus:outline-none focus:border-violet-500 placeholder:text-gray-400 dark:placeholder:text-gray-600"
          />
          {parseError && (
            <p className="text-red-400 text-xs mt-1">
              Could not parse the SVG. Make sure you have pasted valid SVG code.
            </p>
          )}
          <button
            onClick={() => { loadSVG(svgInput); if (!parseError) setShowPaste(false); }}
            className="mt-2 px-4 py-1.5 rounded-md text-xs font-semibold bg-violet-600 text-white hover:bg-violet-500 transition-colors"
          >
            Load
          </button>
        </div>
      )}

      {/* ===== PRESET ICONS STRIP ===== */}
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
            {/* v3: Header with Select All / None */}
            <div className="px-3 pt-3 pb-1 flex items-center justify-between">
              <span className="text-[9px] text-gray-500 dark:text-gray-500 uppercase tracking-widest">
                Elements ({parsed.elements.length})
              </span>
              <div className="flex gap-1">
                <button
                  onClick={selectAll}
                  title="Select all"
                  className="text-[9px] px-1.5 py-0.5 rounded bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
                >
                  All
                </button>
                <button
                  onClick={deselectAll}
                  title="Deselect all"
                  className="text-[9px] px-1.5 py-0.5 rounded bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
                >
                  None
                </button>
              </div>
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
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${animated ? "bg-violet-500" : "bg-gray-300 dark:bg-gray-600"}`} />
                  <span className={`text-xs truncate ${selected ? "text-gray-900 dark:text-gray-100" : "text-gray-600 dark:text-gray-400"}`}>
                    {el.tag}
                    <span className="text-gray-400 dark:text-gray-600"> #{el.index + 1}</span>
                  </span>
                  {animated && <span className="ml-auto text-[9px] text-violet-400">●</span>}
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
                {" "}— it loads automatically on paste.
              </p>
            </div>
          ) : (
            <>
              {/* Status + v3: Play/Stop button */}
              <div className="flex items-center gap-3 mb-3">
                <p className="text-[10px] text-gray-500 dark:text-gray-500 tracking-wide">
                  {isPlaying
                    ? "▶ Looping..."
                    : isHovering
                    ? "▶ Playing..."
                    : "Hover = preview · Click = select · Drag = move"}
                </p>
                {anyAnimated && (
                  <button
                    onClick={() => setIsPlaying((p) => !p)}
                    title={isPlaying ? "Stop auto-play" : "Auto-play loop"}
                    className={`px-2.5 py-1 rounded-md text-[10px] font-semibold transition-colors ${isPlaying
                      ? "bg-violet-600 text-white"
                      : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                    }`}
                  >
                    {isPlaying ? "⏹ Stop" : "▶ Play"}
                  </button>
                )}
              </div>

              {/* Preview box — large canvas */}
              <div
                ref={canvasRef}
                onMouseEnter={() => { if (!isPlaying) setIsHovering(true); }}
                onMouseLeave={() => { if (!isPlaying) setIsHovering(false); }}
                style={{
                  width: 200, height: 200, minWidth: 120, minHeight: 120,
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
                <PreviewSVG
                  parsed={parsed}
                  size={previewScale}
                  isHovering={isHovering}
                  animations={animations}
                  selectedIds={selectedIds}
                  getPreviewStyle={getPreviewStyle}
                  onElementMouseDown={handleElementMouseDown}
                  svgElRefs={svgElRefs}
                />
              </div>

              {/* v3: Animated element count */}
              {animatedCount > 0 && (
                <p className="mt-2 text-[9px] text-violet-400 tracking-wide">
                  {animatedCount}/{parsed.elements.length} element{animatedCount !== 1 ? "s" : ""} animated
                </p>
              )}

              {/* Small previews at 24px and 48px */}
              <div className="mt-4 flex items-center gap-3">
                {([24, 48] as const).map((sz) => (
                  <React.Fragment key={sz}>
                    <span className="text-[9px] text-gray-400 dark:text-gray-600 uppercase">{sz}px:</span>
                    <div
                      onMouseEnter={() => { if (!isPlaying) setIsHovering(true); }}
                      onMouseLeave={() => { if (!isPlaying) setIsHovering(false); }}
                      className="cursor-pointer p-2 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
                    >
                      <PreviewSVG
                        parsed={parsed}
                        size={sz}
                        isHovering={isHovering}
                        animations={animations}
                        getPreviewStyle={getPreviewStyle}
                      />
                    </div>
                  </React.Fragment>
                ))}
              </div>

              {/* Preview scale slider */}
              <div className="mt-4 w-48">
                <div className="flex justify-between mb-1">
                  <span className="text-[9px] text-gray-500 dark:text-gray-500 uppercase tracking-widest">Preview</span>
                  <span className="text-[10px] text-violet-300 font-mono font-semibold">{previewScale}px</span>
                </div>
                <input
                  type="range" min={24} max={256} step={8} value={previewScale}
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
                {/* Header: shows count when multiple selected */}
                <div className="flex justify-between items-center mb-3">
                  <span className="text-[10px] text-gray-500 dark:text-gray-500 uppercase tracking-widest">
                    {selectedIds.size > 1
                      ? `Animation (${selectedIds.size} elements)`
                      : "Animation"}
                  </span>
                  <button
                    onClick={() => resetAnim(selectedId)}
                    className="text-[9px] text-gray-600 dark:text-gray-400 bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
                  >
                    Reset
                  </button>
                </div>

                {/* Presets */}
                <div className="flex items-center justify-between mb-1">
                  <p className="text-[9px] text-gray-400 dark:text-gray-600 uppercase tracking-widest">
                    Presets
                  </p>
                  {/* v3: Apply to all toggle */}
                  <button
                    onClick={() => setApplyToAll((p) => !p)}
                    title="Apply preset to all elements"
                    className={`text-[9px] px-2 py-0.5 rounded transition-colors ${applyToAll
                      ? "bg-violet-600 text-white"
                      : "bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                    }`}
                  >
                    {applyToAll ? "All elements" : "Selected only"}
                  </button>
                </div>
                <div className="flex flex-wrap gap-1 mb-4">
                  {Object.entries(ANIM_PRESETS).map(([name, preset]) => (
                    <button
                      key={name}
                      onClick={() => {
                        setAnimations((prev) => {
                          const next = { ...prev };
                          const targets = applyToAll && parsed
                            ? parsed.elements.map((el) => el.id)
                            : Array.from(selectedIds);
                          targets.forEach((id) => {
                            next[id] = { ...next[id], ...preset };
                          });
                          return next;
                        });
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
                <Slider label="Translate X" value={selectedAnim.translateX}
                  onChange={(v) => updateAnim(selectedId, "translateX", v)}
                  min={-12} max={12} step={0.5} unit="px" />
                <Slider label="Translate Y" value={selectedAnim.translateY}
                  onChange={(v) => updateAnim(selectedId, "translateY", v)}
                  min={-12} max={12} step={0.5} unit="px" />

                <div className="mb-3 flex items-center justify-between">
                  <span className="text-xs text-gray-600 dark:text-gray-400">Wrap-around ↻</span>
                  <button
                    onClick={() => updateAnim(selectedId, "wrapAround", !selectedAnim.wrapAround)}
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
                <Slider label="Rotate" value={selectedAnim.rotate}
                  onChange={(v) => updateAnim(selectedId, "rotate", v)}
                  min={-360} max={360} step={5} unit="°" />
                <Slider label="Scale" value={selectedAnim.scale}
                  onChange={(v) => updateAnim(selectedId, "scale", v)}
                  min={0} max={2} step={0.05} />
                <Slider label="Opacity" value={selectedAnim.opacity}
                  onChange={(v) => updateAnim(selectedId, "opacity", v)}
                  min={0} max={1} step={0.05} />

                {/* Colors */}
                <p className="text-[9px] text-gray-400 dark:text-gray-600 uppercase tracking-widest mb-2 mt-3">
                  Colors
                </p>
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-xs text-gray-600 dark:text-gray-400">Stroke Color</span>
                  <div className="flex items-center gap-2">
                    <input type="color" value={selectedAnim.strokeColor || "#e2e8f0"}
                      onChange={(e) => updateAnim(selectedId, "strokeColor", e.target.value)}
                      className="w-6 h-6 rounded cursor-pointer bg-transparent border border-gray-300 dark:border-gray-600" />
                    {selectedAnim.strokeColor && (
                      <button onClick={() => updateAnim(selectedId, "strokeColor", "")}
                        className="text-[9px] text-gray-500 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">✕</button>
                    )}
                  </div>
                </div>
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-xs text-gray-600 dark:text-gray-400">Fill Color</span>
                  <div className="flex items-center gap-2">
                    <input type="color" value={selectedAnim.fillColor || "#000000"}
                      onChange={(e) => updateAnim(selectedId, "fillColor", e.target.value)}
                      className="w-6 h-6 rounded cursor-pointer bg-transparent border border-gray-300 dark:border-gray-600" />
                    {selectedAnim.fillColor && (
                      <button onClick={() => updateAnim(selectedId, "fillColor", "")}
                        className="text-[9px] text-gray-500 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">✕</button>
                    )}
                  </div>
                </div>

                {/* Effects */}
                <p className="text-[9px] text-gray-400 dark:text-gray-600 uppercase tracking-widest mb-2 mt-3">
                  Effects
                </p>
                <Slider label="Stroke Draw" value={selectedAnim.strokeDraw}
                  onChange={(v) => updateAnim(selectedId, "strokeDraw", v)}
                  min={0} max={1} step={0.05} />
                <Slider label="Blur" value={selectedAnim.blur}
                  onChange={(v) => updateAnim(selectedId, "blur", v)}
                  min={0} max={20} step={0.5} unit="px" />
                <Slider label="Skew X" value={selectedAnim.skewX}
                  onChange={(v) => updateAnim(selectedId, "skewX", v)}
                  min={-45} max={45} step={1} unit="°" />
                <Slider label="Skew Y" value={selectedAnim.skewY}
                  onChange={(v) => updateAnim(selectedId, "skewY", v)}
                  min={-45} max={45} step={1} unit="°" />

                {/* Ring / Shake */}
                <p className="text-[9px] text-gray-400 dark:text-gray-600 uppercase tracking-widest mb-2 mt-3">
                  Ring / Shake
                </p>
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-xs text-gray-600 dark:text-gray-400">Ring Effect 🔔</span>
                  <button
                    onClick={() => updateAnim(selectedId, "ringEffect", !selectedAnim.ringEffect)}
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
                    <Slider label="Angle" value={selectedAnim.ringAngle}
                      onChange={(v) => updateAnim(selectedId, "ringAngle", v)}
                      min={5} max={45} step={1} unit="°" />
                    <Slider label="Count" value={selectedAnim.ringCount}
                      onChange={(v) => updateAnim(selectedId, "ringCount", v)}
                      min={2} max={12} step={1} />
                  </>
                )}

                {/* 3D Perspective */}
                <p className="text-[9px] text-gray-400 dark:text-gray-600 uppercase tracking-widest mb-2 mt-3">
                  3D Perspective
                </p>
                <Slider label="Rotate X" value={selectedAnim.rotateX}
                  onChange={(v) => updateAnim(selectedId, "rotateX", v)}
                  min={-180} max={180} step={5} unit="°" />
                <Slider label="Rotate Y" value={selectedAnim.rotateY}
                  onChange={(v) => updateAnim(selectedId, "rotateY", v)}
                  min={-180} max={180} step={5} unit="°" />
                <Slider label="Perspective" value={selectedAnim.perspective}
                  onChange={(v) => updateAnim(selectedId, "perspective", v)}
                  min={0} max={1000} step={50} unit="px" />

                {/* Timing */}
                <p className="text-[9px] text-gray-400 dark:text-gray-600 uppercase tracking-widest mb-2 mt-3">
                  Timing
                </p>
                <Slider label="Duration" value={selectedAnim.duration}
                  onChange={(v) => updateAnim(selectedId, "duration", v)}
                  min={0.1} max={2} step={0.05} unit="s" />
                <Slider label="Delay" value={selectedAnim.delay}
                  onChange={(v) => updateAnim(selectedId, "delay", v)}
                  min={0} max={1} step={0.05} unit="s" />

                <div className="mb-3">
                  <span className="text-xs text-gray-600 dark:text-gray-400 block mb-2">Easing</span>
                  <div className="flex flex-wrap gap-1">
                    {EASINGS.map((ease) => (
                      <button key={ease}
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
                  Click an element in the list or in the preview to edit its animation.
                </p>
                {parsed.elements.length > 1 && (
                  <button
                    onClick={selectAll}
                    className="mt-3 px-3 py-1.5 rounded-md text-xs font-medium bg-violet-600/20 text-violet-300 hover:bg-violet-600/40 transition-colors"
                  >
                    Select all {parsed.elements.length} elements
                  </button>
                )}
              </div>
            )}

            {/* Frame Settings */}
            <div className="border-t border-gray-200 dark:border-gray-700 mt-4 pt-4">
              <div className="flex justify-between items-center mb-3">
                <span className="text-[10px] text-gray-500 dark:text-gray-500 uppercase tracking-widest">Frame</span>
                <button
                  onClick={() => setFrameSettings((prev) => ({ ...prev, enabled: !prev.enabled }))}
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
                  <Slider label="Border Radius" value={frameSettings.borderRadius}
                    onChange={(v) => setFrameSettings((prev) => ({ ...prev, borderRadius: v }))}
                    min={0} max={50} step={1} unit="px" />
                  <Slider label="Border Width" value={frameSettings.borderWidth}
                    onChange={(v) => setFrameSettings((prev) => ({ ...prev, borderWidth: v }))}
                    min={0} max={4} step={0.5} unit="px" />
                  <Slider label="Padding" value={frameSettings.padding}
                    onChange={(v) => setFrameSettings((prev) => ({ ...prev, padding: v }))}
                    min={0} max={24} step={1} unit="px" />

                  <div className="mb-3">
                    <span className="text-xs text-gray-600 dark:text-gray-400 block mb-1">Border Color</span>
                    <div className="flex items-center gap-2">
                      <input type="color" value={frameSettings.borderColor}
                        onChange={(e) => setFrameSettings((prev) => ({ ...prev, borderColor: e.target.value }))}
                        className="w-6 h-6 rounded border border-gray-300 dark:border-gray-600 cursor-pointer bg-transparent" />
                      <span className="text-[10px] text-gray-600 dark:text-gray-400 font-mono">{frameSettings.borderColor}</span>
                    </div>
                  </div>

                  <div className="mb-3">
                    <span className="text-xs text-gray-600 dark:text-gray-400 block mb-1">Background Color</span>
                    <div className="flex items-center gap-2">
                      <input type="color"
                        value={frameSettings.bgColor === "transparent" ? "#000000" : frameSettings.bgColor}
                        onChange={(e) => setFrameSettings((prev) => ({ ...prev, bgColor: e.target.value }))}
                        className="w-6 h-6 rounded border border-gray-300 dark:border-gray-600 cursor-pointer bg-transparent" />
                      <span className="text-[10px] text-gray-600 dark:text-gray-400 font-mono">{frameSettings.bgColor}</span>
                      {frameSettings.bgColor !== "transparent" && (
                        <button
                          onClick={() => setFrameSettings((prev) => ({ ...prev, bgColor: "transparent" }))}
                          className="text-[9px] text-gray-500 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                        >✕</button>
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
              <span className="text-[10px] text-gray-500 dark:text-gray-500 uppercase tracking-wide">Export</span>
              <input
                value={componentName}
                onChange={(e) => setComponentName(e.target.value.replace(/[^a-zA-Z0-9]/g, ""))}
                className="bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded px-2 py-0.5 text-xs font-mono w-28 focus:outline-none focus:border-violet-500"
                placeholder="Component name"
              />
              <span className="text-[10px] text-gray-400 dark:text-gray-600">.tsx</span>
            </div>
            <div className="flex gap-2">
              {/* v3: Download button */}
              <button
                onClick={handleDownload}
                className="px-3 py-1 rounded-md text-xs font-semibold bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                Download
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
