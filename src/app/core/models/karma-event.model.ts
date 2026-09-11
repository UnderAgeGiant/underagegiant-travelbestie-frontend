export type KarmaEventReason =
  | 'attraction_comment_first'
  | 'trip_created'
  | 'itinerary_exported'
  | 'ai_suggest'
  | 'ai_plan'
  | 'trip_shared'
  | 'ai_city_suggest'
  | 'companion_boost'
  | 'karma_purchased'
  | 'step_comment'
  | 'collaborator_invite'
  | 'ai_plan_refund';

export interface KarmaEventTarget {
  type: 'trip' | 'ai_plan_request';
  id: string;
  /** The trip's title — only ever populated when type === 'trip'. */
  name?: string;
}

export interface KarmaPurchaseMeta {
  provider: string;
  transactionId: string;
}

export interface KarmaEvent {
  eventId: string;
  delta: number;
  reason: string;
  createdAt: string;
  target: KarmaEventTarget | null;
  /** Only populated for reason === 'karma_purchased'. Display-only — no CTA. */
  purchase?: KarmaPurchaseMeta;
}

export interface KarmaEventsPage {
  events: KarmaEvent[];
  nextCursor: string | null;
}

/** Natural-language label for a karma_events reason. Unrecognized reasons (a
 *  future backend enum value the frontend hasn't caught up to yet) fall back
 *  to the raw string — same convention as NotificationType's unlisted-type
 *  fallback. A function, not a const map, so $localize evaluates lazily at
 *  call time rather than at module load (see getCategoryMeta() in
 *  attraction-category.ts). */
export function karmaReasonLabel(reason: string): string {
  switch (reason as KarmaEventReason) {
    case 'trip_created':             return $localize`:@@karmaHistory.reason.tripCreated:Viaje creado`;
    case 'itinerary_exported':       return $localize`:@@karmaHistory.reason.itineraryExported:Itinerario exportado`;
    case 'trip_shared':              return $localize`:@@karmaHistory.reason.tripShared:Viaje compartido`;
    case 'collaborator_invite':      return $localize`:@@karmaHistory.reason.collaboratorInvite:Invitación a colaborador`;
    case 'ai_suggest':                return $localize`:@@karmaHistory.reason.aiSuggest:Sugerencias de IA`;
    case 'ai_plan':                   return $localize`:@@karmaHistory.reason.aiPlan:Plan de IA generado`;
    case 'ai_plan_refund':            return $localize`:@@karmaHistory.reason.aiPlanRefund:Reembolso de plan de IA`;
    case 'ai_city_suggest':           return $localize`:@@karmaHistory.reason.aiCitySuggest:Sugerencias de IA para la ciudad`;
    case 'companion_boost':           return $localize`:@@karmaHistory.reason.companionBoost:Impulso de Asistente Miel`;
    case 'karma_purchased':           return $localize`:@@karmaHistory.reason.karmaPurchased:Compra de karma`;
    case 'attraction_comment_first':  return $localize`:@@karmaHistory.reason.attractionComment:Primer comentario en una atracción`;
    case 'step_comment':              return $localize`:@@karmaHistory.reason.stepComment:Comentario en un viaje compartido`;
    default:                          return reason;
  }
}

const PLAN_LINKED_REASONS = new Set<KarmaEventReason>([
  'trip_created', 'itinerary_exported', 'collaborator_invite', 'trip_shared',
  'ai_city_suggest', 'ai_plan', 'ai_suggest',
]);

/** Whether this reason CAN resolve to a trip/ai_plan_request target — used to tell
 *  "never applicable" (companion_boost, karma_purchased, ...) apart from "the plan
 *  this pointed at was deleted" when target is null, so the history row can show
 *  "Plan borrado" only in the latter case. */
export function isPlanLinkedReason(reason: string): boolean {
  return PLAN_LINKED_REASONS.has(reason as KarmaEventReason);
}
