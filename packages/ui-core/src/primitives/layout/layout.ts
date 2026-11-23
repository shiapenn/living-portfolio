export function renderCoreStack(childrenHtml: string, className = ''): string {
  const cls = className ? `lp-core-stack ${className}` : 'lp-core-stack';
  return `<div class="${cls}">${childrenHtml}</div>`;
}

export function renderCoreCluster(childrenHtml: string, className = ''): string {
  const cls = className ? `lp-core-cluster ${className}` : 'lp-core-cluster';
  return `<div class="${cls}">${childrenHtml}</div>`;
}
