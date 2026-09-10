export interface MpReturnParams {
  purchaseRef: string;
  status: 'success' | 'failure' | 'pending';
}

/** If the URL search string carries ?mp_purchase=<ref>[&mp_status=success|failure|pending],
 *  parse it out. Returns null when there is no mp_purchase param. Missing/unrecognized
 *  mp_status defaults to 'success' (MP's own back_urls always set it explicitly; this is
 *  only a defensive fallback). */
export function parseMpReturnParams(search: string): MpReturnParams | null {
  const params = new URLSearchParams(search);
  const purchaseRef = params.get('mp_purchase');
  if (!purchaseRef) return null;

  const raw = params.get('mp_status');
  const status: MpReturnParams['status'] =
    raw === 'failure' ? 'failure' : raw === 'pending' ? 'pending' : 'success';

  return { purchaseRef, status };
}

/** Strips mp_purchase/mp_status from a search string, preserving any other params. */
export function stripMpReturnParams(search: string): string {
  const params = new URLSearchParams(search);
  params.delete('mp_purchase');
  params.delete('mp_status');
  const rest = params.toString();
  return rest ? `?${rest}` : '';
}
