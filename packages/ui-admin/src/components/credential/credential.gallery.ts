export const CREDENTIAL_GALLERY_ENTRY = {
  pack: 'admin' as const,
  package: '@living-portfolio/ui-admin',
  name: 'Credential',
  variants: ['single', 'list'],
  gallerySampleId: 'gallery-credential-sample',
  parent: ['FormSection', 'Page'],
  children: ['Notice', 'Button', 'StatusLine'],
  classFamilies: ['lp-credential'],
  variantOf: null,
  status: 'active' as const,
  since: 'WP-17.11',
};
