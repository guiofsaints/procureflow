import React from 'react';
import { DocsThemeConfig } from 'nextra-theme-docs';

const config: DocsThemeConfig = {
  logo: <span style={{ fontWeight: 700 }}>ProcureFlow Documentation</span>,
  project: {
    link: 'https://github.com/guiofsaints/procureflow',
  },
  docsRepositoryBase: 'https://github.com/guiofsaints/procureflow/tree/main/packages/docs',
  footer: {
    text: 'ProcureFlow Documentation - Built with Nextra',
  },
  useNextSeoProps() {
    return {
      titleTemplate: '%s – ProcureFlow Docs',
    };
  },
  head: (
    <>
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta property="og:title" content="ProcureFlow Documentation" />
      <meta property="og:description" content="Comprehensive documentation for ProcureFlow AI-native procurement platform" />
    </>
  ),
  sidebar: {
    defaultMenuCollapseLevel: 1,
    toggleButton: true,
  },
  toc: {
    backToTop: true,
  },
  navigation: {
    prev: true,
    next: true,
  },
};

export default config;
