import nextCoreWebVitals from 'eslint-config-next/core-web-vitals'
import prettierConfig from 'eslint-config-prettier'

export default [
  ...nextCoreWebVitals,
  prettierConfig,
  {
    ignores: ['node_modules/', '.next/', 'out/'],
  },
]
