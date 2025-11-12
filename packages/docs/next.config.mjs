import nextra from 'nextra';

const withNextra = nextra({
  // Theme configuration moved to app/layout.jsx in Nextra 4
  defaultShowCopyCode: true,
  latex: true,
});

export default withNextra({
  basePath: '/docs',
  assetPrefix: '/docs',
  output: 'export',
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
});
