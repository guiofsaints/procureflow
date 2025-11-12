import { Footer, Layout, Navbar } from 'nextra-theme-docs';
import { Head, Search } from 'nextra/components';
import { getPageMap } from 'nextra/page-map';
import 'nextra-theme-docs/style.css';
import './globals.css';

export const metadata = {
  title: {
    default: 'ProcureFlow Documentation',
    template: '%s | ProcureFlow Docs',
  },
  description:
    'AI-native procurement platform - Complete technical documentation including architecture, API specs, operations, and runbooks',
  keywords: [
    'procurement',
    'AI',
    'documentation',
    'Next.js',
    'TypeScript',
    'MongoDB',
    'OpenAI',
  ],
  authors: [{ name: 'ProcureFlow Team' }],
  openGraph: {
    title: 'ProcureFlow Documentation',
    description:
      'AI-native procurement platform - Complete technical documentation',
    type: 'website',
    locale: 'en_US',
  },
  robots: {
    index: true,
    follow: true,
  },
};

const navbar = (
  <Navbar
    logo={
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span
          style={{
            fontWeight: 700,
            fontSize: '1.25rem',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          ProcureFlow
        </span>
        <span
          style={{
            fontSize: '0.875rem',
            color: '#64748b',
            fontWeight: 500,
          }}
        >
          Docs
        </span>
      </div>
    }
    projectLink='https://github.com/guiofsaints/procureflow'
  />
);

const footer = (
  <Footer className='flex-col items-center md:items-start'>
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
        width: '100%',
      }}
    >
      <div style={{ fontSize: '0.875rem', color: '#64748b' }}>
        MIT {new Date().getFullYear()} © ProcureFlow Project
      </div>
      <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
        Built with Nextra 4 • Next.js 16 • React 19
      </div>
    </div>
  </Footer>
);

export default async function RootLayout({ children }) {
  return (
    <html lang='en' dir='ltr' suppressHydrationWarning>
      <Head
        backgroundColor={{
          dark: 'rgb(15, 23, 42)',
          light: 'rgb(255, 255, 255)',
        }}
        color={{
          hue: { dark: 250, light: 250 },
          saturation: { dark: 90, light: 90 },
        }}
      />
      <body>
        <Layout
          navbar={navbar}
          footer={footer}
          pageMap={await getPageMap()}
          docsRepositoryBase='https://github.com/guiofsaints/procureflow/tree/main/packages/docs'
          editLink='Edit this page on GitHub'
          sidebar={{
            defaultMenuCollapseLevel: 1,
            toggleButton: true,
            autoCollapse: true,
          }}
          search={
            <Search
              placeholder='Search documentation...'
              loading='Loading...'
              emptyResult='No results found.'
              errorText='Failed to load search index.'
            />
          }
          toc={{
            backToTop: true,
            title: 'On This Page',
            float: true,
          }}
        >
          {children}
        </Layout>
      </body>
    </html>
  );
}
