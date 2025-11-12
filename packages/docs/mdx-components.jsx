import { useMDXComponents as getDocsMDXComponents } from 'nextra-theme-docs';

const docsComponents = getDocsMDXComponents();

export function useMDXComponents(components) {
  return {
    ...docsComponents,
    ...components,
    // Add any custom MDX components here if needed
  };
}
