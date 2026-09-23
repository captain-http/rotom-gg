// Flags Tailwind classes outside the rotom.gg design language
// (.claude/skills/rotom-design/SKILL.md). globals.css removes most of these
// from the theme, so they would silently render nothing; this makes them fail
// bin/verify with a pointer to what to use instead.

const PALETTE =
  "white|black|slate|gray|zinc|neutral|stone|taupe|mauve|mist|olive|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose";
const COLOR_UTILITIES =
  "bg|text|border|border-[trblxy]|outline|ring|ring-offset|divide|fill|stroke|decoration|caret|accent|placeholder|from|via|to|shadow";

const FORBIDDEN = [
  {
    pattern: /^font-(thin|extralight|light|medium|bold|extrabold|black)$/,
    message:
      "IBM Plex Mono is loaded at 400 and 600 only. Use font-normal or font-semibold.",
  },
  { pattern: /^italic$/, message: "No italics. Use uppercase or color." },
  {
    pattern: /^text-(xs|sm|base|lg|xl|[2-9]xl)$/,
    message:
      "Off-grid text size. Use text-meta, text-body, text-title, text-heading, text-display, or text-hero.",
  },
  {
    pattern: /^rounded(?!-none$)(-.+)?$/,
    message: "No rounded corners. Frames are square.",
  },
  {
    pattern: /^(shadow|drop-shadow|inset-shadow|text-shadow)(?!-none$)(-.+)?$/,
    message: "No shadows. Depth comes from frames and fills.",
  },
  {
    pattern: new RegExp(`^(${COLOR_UTILITIES})-(${PALETTE})(-\\d+)?(/\\d+)?$`),
    message:
      "Tailwind palette color. Use a semantic token (bg-surface, text-muted, bg-accent, …).",
  },
  {
    pattern: /-\[(#|rgb|hsl|oklch|color-mix)/,
    message: "Raw color value. Use a semantic token.",
  },
  {
    pattern: /^bg-(linear|radial|conic|gradient)-/,
    message: "No gradients.",
  },
];

// "md:hover:bg-white" → "bg-white"; "!font-bold" → "font-bold".
function baseClass(token) {
  return token.split(":").pop().replace(/^!/, "");
}

function check(context, node, text) {
  const tokens = text.split(/\s+/);
  const classes = new Set(tokens.map(baseClass));
  if (classes.has("font-mono") && classes.has("font-semibold")) {
    context.report({
      node,
      message:
        '"font-semibold" on font-mono: Departure Mono has one weight, and the browser would fake a bold. Use size, uppercase, tracking, or color. See .claude/skills/rotom-design/SKILL.md.',
    });
  }
  for (const token of tokens) {
    const cls = baseClass(token);
    const rule = FORBIDDEN.find(({ pattern }) => pattern.test(cls));
    if (rule) {
      context.report({
        node,
        message: `"${token}" is outside the design language: ${rule.message} See .claude/skills/rotom-design/SKILL.md.`,
      });
    }
  }
}

const plugin = {
  rules: {
    "design-classes": {
      meta: {
        type: "problem",
        docs: { description: "Only rotom.gg design tokens in class names" },
        schema: [],
      },
      create(context) {
        return {
          Literal(node) {
            if (typeof node.value === "string") {
              check(context, node, node.value);
            }
          },
          TemplateElement(node) {
            check(context, node, node.value.cooked ?? "");
          },
        };
      },
    },
  },
};

export default plugin;
