// eslint.config.mjs
import antfu from "@antfu/eslint-config"

export default antfu(
  {
    react: true,
    stylistic: {
      indent: 2, // 4, or 'tab'
      quotes: "double", // or 'single'|'double'
    },
    // TypeScript and Vue are autodetected, you can also explicitly enable them:
    typescript: true,
  },
  {
    rules: {
      "react-refresh/only-export-components": "off",
    },
  },
)
