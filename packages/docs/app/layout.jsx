import { Footer, Layout, Navbar } from 'nextra-theme-docs'
import { Head, Search } from 'nextra/components'
import { getPageMap } from 'nextra/page-map'
import 'nextra-theme-docs/style.css'

export const metadata = {
  title: {
    default: 'ProcureFlow Documentation',
    template: '%s | ProcureFlow Docs'
  },
  description: 'AI-native procurement platform - Complete technical documentation including architecture, API specs, operations, and runbooks',
  openGraph: {
    title: 'ProcureFlow Documentation',
    description: 'AI-native procurement platform - Complete technical documentation',
    type: 'website',
    locale: 'en_US'
  }
}

const navbar = (
  <Navbar
    logo={<span style={{ fontWeight: 700, fontSize: '1.125rem' }}>ProcureFlow Docs</span>}
    projectLink="https://github.com/guiofsaints/procureflow"
  />
)

const footer = (
  <Footer className="flex-col items-center md:items-start">
    MIT {new Date().getFullYear()} © ProcureFlow. Built with Nextra 4.
  </Footer>
)

export default async function RootLayout({ children }) {
  return (
    <html lang="en" dir="ltr" suppressHydrationWarning>
      <Head
        backgroundColor={{
          dark: 'rgb(15, 23, 42)',
          light: 'rgb(254, 252, 232)'
        }}
        color={{
          hue: { dark: 220, light: 200 },
          saturation: { dark: 100, light: 100 }
        }}
      />
      <body>
        <Layout
          navbar={navbar}
          footer={footer}
          pageMap={await getPageMap()}
          docsRepositoryBase="https://github.com/guiofsaints/procureflow/tree/main/packages/docs"
          editLink="Edit this page on GitHub"
          sidebar={{
            defaultMenuCollapseLevel: 1,
            toggleButton: true,
            autoCollapse: false
          }}
          search={
            <Search
              placeholder="Search documentation..."
              loading="Loading..."
              emptyResult="No results found."
              errorText="Failed to load search index."
            />
          }
          toc={{
            backToTop: 'Back to top',
            title: 'On This Page'
          }}
        >
          {children}
        </Layout>
      </body>
    </html>
  )
}
