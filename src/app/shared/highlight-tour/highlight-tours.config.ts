import { HighlightType } from '../../core/models/highlight.model';

export interface HighlightStep {
  targetId: string;
  text: { 'es-CL': string; 'en-US': string };
}

const LANDING_WELCOME_STEP_1 = {
  'es-CL': '¡Guau Guau! Bienvenido a Tripilove, tu planificador IA de viajes. ¿No sabes donde comenzar? Crea un usuario con tu correo.',
  'en-US': "Woof woof! Welcome to Tripilove, your AI trip planner. Not sure where to start? Create an account with your email.",
};

const LANDING_WELCOME_STEP_2 = {
  'es-CL': 'Presiona el botón Crear con IA para que comencemos a jugar. ¡Yo te acompaño!',
  'en-US': "Press the Crear con IA button so we can start playing. I'll be right there with you!",
};

export const HIGHLIGHT_TOURS: Record<HighlightType, HighlightStep[]> = {
  landing_welcome: [
    { targetId: 'login-btn',   text: LANDING_WELCOME_STEP_1 },
    { targetId: 'ai-plan-btn', text: LANDING_WELCOME_STEP_2 },
  ],
};
