import { compileMdx } from 'nextra/compile'
import { evaluate } from 'nextra/mdx-remote'
import { existsSync, readFileSync } from 'fs'
import { join } from 'path'
import { notFound } from 'next/navigation'

/**
 * Catch-all route handler for MDX files in content/ directory.
 * This is the gateway that loads and renders MDX pages.
 */
export default async function Page({ params }) {
  const { mdxPath = [] } = await params
  const pagePath = mdxPath.join('/') || 'index'
  
  // Try to load the MDX file from content/
  const filePath = join(process.cwd(), 'content', `${pagePath}.mdx`)
  
  if (!existsSync(filePath)) {
    notFound()
  }
  
  const source = readFileSync(filePath, 'utf8')
  const compiledSource = await compileMdx(source, {
    mdxOptions: {
      development: process.env.NODE_ENV === 'development'
    }
  })
  
  const { default: MDXContent } = await evaluate(compiledSource)
  
  return <MDXContent />
}

/**
 * Generate static params for all MDX files (for static export).
 * This will be populated by Nextra's page map during build.
 */
export async function generateStaticParams() {
  // Nextra's getPageMap() will handle this automatically
  return []
}
