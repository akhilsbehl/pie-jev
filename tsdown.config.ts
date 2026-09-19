import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: 'src/index.ts',
  deps: {
    alwaysBundle: ['typebox'],
    onlyBundle: ['typebox'],
    dts: {
      neverBundle: ['typebox'],
    },
  },
})
