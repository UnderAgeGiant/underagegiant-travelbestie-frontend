/** If the URL search string carries ?share=<id>, return the equivalent /shared/<id>
 *  path (preserving any highlight param). Returns null when there is no share param. */
export function shareRedirectPath(search: string): string | null {
  const params = new URLSearchParams(search);
  const id = params.get('share');
  if (!id) return null;
  const highlight = params.get('highlight');
  return highlight ? `/shared/${id}?highlight=${highlight}` : `/shared/${id}`;
}
