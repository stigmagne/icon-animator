"use client";

import { useState, useRef, useCallback, useEffect, CSSProperties, MouseEvent as ReactMouseEvent } from "react";

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
};

const DEFAULT_FRAME: FrameSettings = {
  enabled: false,
  borderRadius: 12,
  borderWidth: 2,
  borderColor: "#3f3f46",
  bgColor: "transparent",
  padding: 8,
};

const ANIM_PRESETS: Record<string, Partial<AnimationState>> = {
  Bounce: { translateY: -3, ease: "easeOut", duration: 0.3 },
  Shake: { rotate: 15, ease: "easeInOut", duration: 0.3 },
  Pulse: { scale: 1.2, ease: "easeInOut", duration: 0.3 },
  "Fade In": { opacity: 0, duration: 0.4, ease: "easeIn" },
};

const EASINGS = ["easeInOut", "easeIn", "easeOut", "linear", "spring"];

function hasAnimation(a: AnimationState | undefined) {
  if (!a) return false;
  return (
    a.translateX !== 0 ||
    a.translateY !== 0 ||
    a.rotate !== 0 ||
    a.scale !== 1 ||
    a.opacity !== 1
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
function SvgElement({ tag, attrs, isSelected, style, onMouseDown }: { tag: string; attrs: Record<string, string>; isSelected: boolean; style: CSSProperties; onMouseDown: (e: ReactMouseEvent) => void }) {
  const skip = ["fill", "stroke", "stroke-width", "stroke-linecap", "stroke-linejoin"];
  const reactAttrs = svgAttrsToReact(attrs, skip);

  const props = {
    ...reactAttrs,
    stroke: isSelected ? "#a78bfa" : "#e2e8f0",
    strokeWidth: isSelected ? "2.5" : "2",
    fill: "none",
    style: {
      ...style,
      cursor: "grab",
      filter: isSelected
        ? "drop-shadow(0 0 4px rgba(167,139,250,0.5))"
        : "none",
    },
    onMouseDown,
  };

  // Use createElement for dynamic SVG tag names
  return <>{(() => {
    switch (tag) {
      case "path": return <path {...props} />;
      case "circle": return <circle {...props} />;
      case "rect": return <rect {...props} />;
      case "line": return <line {...props} />;
      case "polyline": return <polyline {...props} />;
      case "polygon": return <polygon {...props} />;
      case "ellipse": return <ellipse {...props} />;
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

  // Separate normal and wrap-around elements
  const normalEls: ParsedElement[] = [];
  const wrapEls: ParsedElement[] = [];
  for (const el of elements) {
    const a = animations[el.id];
    if (!hasAnimation(a)) continue;
    if (a.wrapAround) wrapEls.push(el);
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

    const opts = [`duration: ${a.duration}`, `ease: "${a.ease}"`];
    if (a.delay > 0) opts.push(`delay: ${a.delay}`);

    startCalls.push(
      `        animate(".${el.id}", { ${props.join(", ")} }, { ${opts.join(", ")} })`
    );
    endCalls.push(
      `        animate(".${el.id}", { x: 0, y: 0, rotate: 0, scale: 1, opacity: 1 }, { duration: ${a.duration}, ease: "${a.ease}" })`
    );
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
      const attrPairs = Object.entries(el.attrs)
        .filter(([k]) => k !== "xmlns")
        .map(([k, v]) => `${toCamel(k)}="${v}"`)
        .join(" ");
      return `        <motion.${el.tag} className="${el.id}" ${attrPairs} />`;
    })
    .join("\n");

  // Build the start handler body
  let startBody = "";
  if (startCalls.length > 0) {
    startBody += `      await Promise.all([\n${startCalls.join(",\n")}\n      ]);\n`;
  }
  if (wrapStartLines.length > 0) {
    startBody += wrapStartLines.join("\n") + "\n";
  }

  // Build the end handler body
  let endBody = "      await Promise.all([\n";
  endBody += [...endCalls, ...wrapEndLines].join(",\n");
  endBody += "\n      ]);\n";

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
        <span className="text-xs text-zinc-400">{label}</span>
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
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [animations, setAnimations] = useState<Animations>({});
  const [isHovering, setIsHovering] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const [showPaste, setShowPaste] = useState(false);
  const [componentName, setComponentName] = useState("MyIcon");
  const [copied, setCopied] = useState(false);
  const [parseError, setParseError] = useState(false);
  const [previewScale, setPreviewScale] = useState(128);
  const [frameSettings, setFrameSettings] = useState<FrameSettings>({ ...DEFAULT_FRAME });

  const canvasRef = useRef<HTMLDivElement>(null);
  const dragState = useRef<{ active: boolean; startX?: number; startY?: number; elId?: string; pxPerUnit?: number; origTx?: number; origTy?: number }>({ active: false });

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
    setSelectedId(null);
    setShowCode(false);

    const anims: Animations = {};
    result.elements.forEach((el) => {
      anims[el.id] = { ...EMPTY_ANIM };
    });
    setAnimations(anims);
  }, []);

  // Update a single animation property
  const updateAnim = useCallback((id: string, key: string, val: number | string | boolean) => {
    setAnimations((prev) => ({
      ...prev,
      [id]: { ...prev[id], [key]: val },
    }));
  }, []);

  // Reset animation for an element
  const resetAnim = useCallback((id: string) => {
    setAnimations((prev) => ({
      ...prev,
      [id]: { ...EMPTY_ANIM },
    }));
  }, []);

  // Reset all animations
  const resetAll = useCallback(() => {
    if (!parsed) return;
    const anims: Animations = {};
    parsed.elements.forEach((el) => {
      anims[el.id] = { ...EMPTY_ANIM };
    });
    setAnimations(anims);
  }, [parsed]);

  const selectedAnim = selectedId ? animations[selectedId] || EMPTY_ANIM : null;

  // ---- Drag to set translateX/Y ----
  const handleElementMouseDown = useCallback(
    (e: ReactMouseEvent, elId: string) => {
      e.preventDefault();
      e.stopPropagation();
      setSelectedId(elId);

      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      // Map pixel movement to SVG coordinate space
      const svgSize = 24;
      const pxPerUnit = rect.width / svgSize;

      dragState.current = {
        active: true,
        startX: e.clientX,
        startY: e.clientY,
        elId,
        pxPerUnit,
        origTx: animations[elId]?.translateX || 0,
        origTy: animations[elId]?.translateY || 0,
      };
    },
    [animations]
  );

  useEffect(() => {
    function onMove(e: globalThis.MouseEvent) {
      const d = dragState.current;
      if (!d.active) return;
      const dx = (e.clientX - (d.startX || 0)) / (d.pxPerUnit || 1);
      const dy = (e.clientY - (d.startY || 0)) / (d.pxPerUnit || 1);
      const tx = Math.round(((d.origTx || 0) + dx) * 2) / 2; // snap to 0.5
      const ty = Math.round(((d.origTy || 0) + dy) * 2) / 2;
      if (d.elId) {
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
  }, []);

  // Build inline transform style for preview
  function getPreviewStyle(elId: string): CSSProperties {
    const a = animations[elId];
    if (!a) return {};
    const dur = a.duration || 0.4;
    const del = a.delay || 0;
    if (!isHovering) {
      return {
        transition: `all ${dur}s cubic-bezier(0.4, 0, 0.2, 1) ${del}s`,
        transformOrigin: "center center",
        transformBox: "fill-box" as const,
      };
    }
    if (a.wrapAround) {
      // For wrap-around: move element off-screen in the direction of travel, then "appear" from opposite
      const tx = a.translateX || 0;
      const ty = a.translateY || 0;
      // Exaggerate movement to simulate going off-edge
      return {
        transform: `translate(${tx * 3}px, ${ty * 3}px) rotate(${a.rotate}deg) scale(${a.scale})`,
        opacity: 0,
        transition: `all ${dur}s cubic-bezier(0.4, 0, 0.2, 1) ${del}s`,
        transformOrigin: "center center",
        transformBox: "fill-box" as const,
      };
    }
    return {
      transform: `translate(${a.translateX}px, ${a.translateY}px) rotate(${a.rotate}deg) scale(${a.scale})`,
      opacity: a.opacity,
      transition: `all ${dur}s cubic-bezier(0.4, 0, 0.2, 1) ${del}s`,
      transformOrigin: "center center",
      transformBox: "fill-box" as const,
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

  const anyAnimated =
    parsed &&
    parsed.elements.some((el) => hasAnimation(animations[el.id]));

  return (
    <div className="flex flex-col h-screen bg-zinc-950 text-zinc-200 overflow-hidden">
      {/* ===== HEADER ===== */}
      <header className="flex items-center justify-between px-4 py-2.5 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-sm shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md bg-gradient-to-br from-violet-600 to-purple-500 flex items-center justify-center text-white text-sm font-bold">
            ✦
          </div>
          <h1 className="font-bold text-sm tracking-tight">Icon Animator</h1>
          <span className="text-[10px] text-zinc-500 bg-zinc-800/60 px-2 py-0.5 rounded-full">
            SVG → motion/react
          </span>
          <span className="text-[10px] text-zinc-600 bg-zinc-800/40 px-2 py-0.5 rounded-full">
            v1
          </span>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setShowPaste(!showPaste)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${showPaste
              ? "bg-violet-600 text-white"
              : "bg-zinc-800 text-zinc-400 hover:text-zinc-200"
              }`}
          >
            Paste SVG
          </button>
          {parsed && (
            <>
              <button
                onClick={resetAll}
                className="px-3 py-1.5 rounded-md text-xs font-medium bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
              >
                Reset All
              </button>
              <button
                onClick={() => setShowCode(!showCode)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${showCode
                  ? "bg-violet-600 text-white"
                  : "bg-zinc-800 text-zinc-400 hover:text-zinc-200"
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
        <div className="px-4 py-3 border-b border-zinc-800 bg-zinc-900/50 shrink-0">
          <textarea
            value={svgInput}
            onChange={(e) => setSvgInput(e.target.value)}
            placeholder="Paste SVG code here (e.g. copied from lucide.dev)..."
            rows={4}
            className="w-full bg-zinc-900 text-zinc-200 border border-zinc-700 rounded-lg p-3 text-xs font-mono resize-none focus:outline-none focus:border-violet-500 placeholder:text-zinc-600"
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
      <div className="flex items-center gap-1.5 px-4 py-2 border-b border-zinc-800 bg-zinc-950/50 overflow-x-auto shrink-0">
        <span className="text-[9px] text-zinc-500 uppercase tracking-widest mr-1 shrink-0">
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
                : "bg-zinc-900 border-zinc-800 hover:border-zinc-600"
                }`}
            >
              <span
                dangerouslySetInnerHTML={{
                  __html: svg
                    .replace('stroke="currentColor"', 'stroke="#9ca3af"')
                    .replace('width="24"', 'width="14"')
                    .replace('height="24"', 'height="14"'),
                }}
              />
              <span className="text-[10px] text-zinc-400">{name}</span>
            </button>
          );
        })}
      </div>

      {/* ===== MAIN AREA ===== */}
      <div className="flex flex-1 overflow-hidden">
        {/* --- Element List --- */}
        {parsed && (
          <aside className="w-48 border-r border-zinc-800 bg-zinc-950/50 overflow-y-auto shrink-0">
            <div className="px-3 pt-3 pb-1 text-[9px] text-zinc-500 uppercase tracking-widest">
              Elements ({parsed.elements.length})
            </div>
            {parsed.elements.map((el) => {
              const a = animations[el.id];
              const animated = hasAnimation(a);
              const selected = selectedId === el.id;
              return (
                <div
                  key={el.id}
                  onClick={() => setSelectedId(el.id)}
                  className={`flex items-center gap-2 px-3 py-2 cursor-pointer transition-colors ${selected
                    ? "bg-zinc-800/80 border-l-2 border-violet-500"
                    : "border-l-2 border-transparent hover:bg-zinc-900"
                    }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full shrink-0 ${animated ? "bg-violet-500" : "bg-zinc-700"
                      }`}
                  />
                  <span
                    className={`text-xs truncate ${selected ? "text-zinc-100" : "text-zinc-400"
                      }`}
                  >
                    {el.tag}
                    <span className="text-zinc-600"> #{el.index + 1}</span>
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
        <main className="flex-1 flex flex-col items-center justify-center relative">
          {!parsed ? (
            <div className="text-center">
              <div className="text-5xl mb-4 opacity-20">✦</div>
              <p className="text-sm font-semibold text-zinc-500 mb-2">
                Pick an icon to get started
              </p>
              <p className="text-xs text-zinc-600 max-w-[260px]">
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
              <p className="text-[10px] text-zinc-500 mb-3 tracking-wide">
                {isHovering
                  ? "▶ Playing animation..."
                  : "Hover = preview · Click = select · Drag = move"}
              </p>

              {/* Preview box */}
              <div
                ref={canvasRef}
                onMouseEnter={() => setIsHovering(true)}
                onMouseLeave={() => setIsHovering(false)}
                style={{
                  width: previewScale * 1.5,
                  height: previewScale * 1.5,
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
                  ? "bg-zinc-800/60 border border-violet-500/60 shadow-[0_0_40px_rgba(124,58,237,0.15)]"
                  : frameSettings.enabled ? "" : "bg-zinc-900/80 border border-zinc-800"
                  }`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox={parsed.viewBox}
                  width={previewScale}
                  height={previewScale}
                  fill="none"
                  stroke="#e2e8f0"
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
                      isSelected={selectedId === el.id}
                      style={getPreviewStyle(el.id)}
                      onMouseDown={(e) => handleElementMouseDown(e, el.id)}
                    />
                  ))}
                </svg>
              </div>

              {/* Small preview at normal size */}
              <div className="mt-4 flex items-center gap-3">
                <span className="text-[9px] text-zinc-600 uppercase">24px:</span>
                <div
                  onMouseEnter={() => setIsHovering(true)}
                  onMouseLeave={() => setIsHovering(false)}
                  className="cursor-pointer p-2 rounded-lg bg-zinc-900 border border-zinc-800"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox={parsed.viewBox}
                    width={24}
                    height={24}
                    fill="none"
                    stroke="#e2e8f0"
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
                      />
                    ))}
                  </svg>
                </div>
                <span className="text-[9px] text-zinc-600 uppercase">48px:</span>
                <div
                  onMouseEnter={() => setIsHovering(true)}
                  onMouseLeave={() => setIsHovering(false)}
                  className="cursor-pointer p-2 rounded-lg bg-zinc-900 border border-zinc-800"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox={parsed.viewBox}
                    width={48}
                    height={48}
                    fill="none"
                    stroke="#e2e8f0"
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
                      />
                    ))}
                  </svg>
                </div>
              </div>

              {/* Preview scale slider */}
              <div className="mt-4 w-48">
                <div className="flex justify-between mb-1">
                  <span className="text-[9px] text-zinc-500 uppercase tracking-widest">Preview</span>
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
          <aside className="w-64 border-l border-zinc-800 bg-zinc-950/50 overflow-y-auto shrink-0 p-4">
            {selectedId && selectedAnim ? (
              <>
                <div className="flex justify-between items-center mb-3">
                  <span className="text-[10px] text-zinc-500 uppercase tracking-widest">
                    Animation
                  </span>
                  <button
                    onClick={() => resetAnim(selectedId)}
                    className="text-[9px] text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded hover:text-zinc-200 transition-colors"
                  >
                    Reset
                  </button>
                </div>

                {/* Direction presets */}
                <p className="text-[9px] text-zinc-600 uppercase tracking-widest mb-2">
                  Quick Presets
                </p>
                <div className="flex flex-wrap gap-1 mb-4">
                  {Object.entries(ANIM_PRESETS).map(([name, preset]) => (
                    <button
                      key={name}
                      onClick={() => {
                        setAnimations((prev) => ({
                          ...prev,
                          [selectedId]: { ...prev[selectedId], ...preset },
                        }));
                      }}
                      className="px-2 py-1 rounded text-[10px] bg-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700 transition-colors"
                    >
                      {name}
                    </button>
                  ))}
                </div>

                {/* Position */}
                <p className="text-[9px] text-zinc-600 uppercase tracking-widest mb-2">
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
                  <span className="text-xs text-zinc-400">Wrap-around ↻</span>
                  <button
                    onClick={() =>
                      updateAnim(selectedId, "wrapAround", !selectedAnim.wrapAround)
                    }
                    className={`px-2.5 py-1 rounded text-[10px] font-medium transition-colors ${selectedAnim.wrapAround
                      ? "bg-violet-600 text-white"
                      : "bg-zinc-800 text-zinc-400 hover:text-zinc-200"
                      }`}
                  >
                    {selectedAnim.wrapAround ? "On" : "Off"}
                  </button>
                </div>

                {/* Transform */}
                <p className="text-[9px] text-zinc-600 uppercase tracking-widest mb-2 mt-3">
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

                {/* Timing */}
                <p className="text-[9px] text-zinc-600 uppercase tracking-widest mb-2 mt-3">
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
                  <span className="text-xs text-zinc-400 block mb-2">
                    Easing
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {EASINGS.map((ease) => (
                      <button
                        key={ease}
                        onClick={() => updateAnim(selectedId, "ease", ease)}
                        className={`px-2 py-0.5 rounded text-[9px] transition-colors ${selectedAnim.ease === ease
                          ? "bg-violet-600 text-white"
                          : "bg-zinc-800 text-zinc-400 hover:text-zinc-200"
                          }`}
                      >
                        {ease}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center text-zinc-600 mt-8">
                <p className="text-2xl mb-3">☝</p>
                <p className="text-xs">
                  Click an element in the list or in the preview to edit its
                  animation.
                </p>
              </div>
            )}

            {/* === Frame Settings (always visible when parsed) === */}
            <div className="border-t border-zinc-800 mt-4 pt-4">
              <div className="flex justify-between items-center mb-3">
                <span className="text-[10px] text-zinc-500 uppercase tracking-widest">
                  Frame
                </span>
                <button
                  onClick={() =>
                    setFrameSettings((prev) => ({
                      ...prev,
                      enabled: !prev.enabled,
                    }))
                  }
                  className={`px-2.5 py-1 rounded text-[10px] font-medium transition-colors ${frameSettings.enabled
                    ? "bg-violet-600 text-white"
                    : "bg-zinc-800 text-zinc-400 hover:text-zinc-200"
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
                      setFrameSettings((prev) => ({
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
                      setFrameSettings((prev) => ({
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
                      setFrameSettings((prev) => ({ ...prev, padding: v }))
                    }
                    min={0}
                    max={24}
                    step={1}
                    unit="px"
                  />

                  {/* Border color */}
                  <div className="mb-3">
                    <span className="text-xs text-zinc-400 block mb-1">
                      Border Color
                    </span>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={frameSettings.borderColor}
                        onChange={(e) =>
                          setFrameSettings((prev) => ({
                            ...prev,
                            borderColor: e.target.value,
                          }))
                        }
                        className="w-6 h-6 rounded border border-zinc-700 cursor-pointer bg-transparent"
                      />
                      <span className="text-[10px] text-zinc-400 font-mono">
                        {frameSettings.borderColor}
                      </span>
                    </div>
                  </div>

                  {/* Background color */}
                  <div className="mb-3">
                    <span className="text-xs text-zinc-400 block mb-1">
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
                          setFrameSettings((prev) => ({
                            ...prev,
                            bgColor: e.target.value,
                          }))
                        }
                        className="w-6 h-6 rounded border border-zinc-700 cursor-pointer bg-transparent"
                      />
                      <span className="text-[10px] text-zinc-400 font-mono">
                        {frameSettings.bgColor}
                      </span>
                      {frameSettings.bgColor !== "transparent" && (
                        <button
                          onClick={() =>
                            setFrameSettings((prev) => ({
                              ...prev,
                              bgColor: "transparent",
                            }))
                          }
                          className="text-[9px] text-zinc-500 hover:text-zinc-300 transition-colors"
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
        <div className="border-t border-zinc-800 bg-zinc-950 shrink-0 flex flex-col" style={{ maxHeight: 280 }}>
          <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-800">
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-zinc-500 uppercase tracking-wide">
                Export
              </span>
              <input
                value={componentName}
                onChange={(e) =>
                  setComponentName(
                    e.target.value.replace(/[^a-zA-Z0-9]/g, "")
                  )
                }
                className="bg-zinc-900 text-zinc-200 border border-zinc-700 rounded px-2 py-0.5 text-xs font-mono w-28 focus:outline-none focus:border-violet-500"
                placeholder="Component name"
              />
              <span className="text-[10px] text-zinc-600">.tsx</span>
            </div>
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
          <pre className="flex-1 overflow-auto p-4 text-[10px] leading-relaxed font-mono text-violet-300/80">
            {exportCode}
          </pre>
        </div>
      )}
    </div>
  );
}
