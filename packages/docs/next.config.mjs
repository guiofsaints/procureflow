import nextra from 'nextra'

const withNextra = nextra({
  // No theme or themeConfig in Nextra 4 - configured in app/layout.jsx
  defaultShowCopyCode: true,
  latex: true,
})

export default withNextra({
  output: 'export',
  images: {
    unoptimized: true,
  },
  basePath: '',
  trailingSlash: true,
})
