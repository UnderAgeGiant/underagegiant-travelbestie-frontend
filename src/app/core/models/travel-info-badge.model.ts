// Functions (not module-level consts) so the $localize calls execute lazily after the
// i18n polyfill loads, not at import time — same reason getVisaRequirementMeta() in
// visa-requirement.model.ts is a function rather than a plain object (Feature 62).

export function formatCurrencyLabel(name: string, symbol: string): string {
  return $localize`:@@stopList.currencyBadgeLabel:${name}:INTERPOLATION: (${symbol}:INTERPOLATION_1:)`;
}

export function formatPlugLabel(plugTypes: string[], voltages: string[], adapterNeeded: boolean | null): string {
  const types = plugTypes.map(t => `Tipo ${t}`).join('/');
  const voltage = voltages.join(' / ');
  if (adapterNeeded === true) {
    return $localize`:@@stopList.plugBadgeAdapterNeeded:${types}:INTERPOLATION: · ${voltage}:INTERPOLATION_1: — necesitas adaptador`;
  }
  return $localize`:@@stopList.plugBadgeLabel:${types}:INTERPOLATION: · ${voltage}:INTERPOLATION_1:`;
}
