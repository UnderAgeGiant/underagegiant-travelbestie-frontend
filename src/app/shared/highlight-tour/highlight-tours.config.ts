import { HighlightType } from '../../core/models/highlight.model';

export interface HighlightStep {
  targetId: string;
  text: { 'es-CL': string; 'en-US': string };
}

const LANDING_WELCOME_LOGO = {
  'es-CL': '¡Guau! 🐾 ¡Soy Miel! Bienvenido a Tripilove. Seré tu compañero de aventuras y te ayudaré a crear el viaje de tus sueños con IA',
  'en-US': "Woof! 🐾 I'm Miel! Welcome to Tripilove. I'll be your adventure buddy and help you create the trip of your dreams with AI",
};

const LANDING_WELCOME_SIGNUP = {
  'es-CL': '¿No sabes por dónde empezar? 🐶 ¡Regístrate con tu correo y preparemos juntos tu próxima aventura!',
  'en-US': "Not sure where to start? 🐶 Sign up with your email and let's plan your next adventure together!",
};

const LANDING_WELCOME_AI = {
  'es-CL': '¡Ahora viene lo divertido! 🐾 Presiona «🐾 Crear con IA» y empecemos a planificar tu aventura. ¡Yo te acompaño en cada paso!',
  'en-US': "Now comes the fun part! 🐾 Press «🐾 Create with AI» and let's start planning your adventure. I'll be with you every step of the way!",
};

export const HIGHLIGHT_TOURS: Record<HighlightType, HighlightStep[]> = {
  landing_welcome: [
    { targetId: 'nav-logo',    text: LANDING_WELCOME_LOGO },
    { targetId: 'login-btn',   text: LANDING_WELCOME_SIGNUP },
    { targetId: 'ai-plan-btn', text: LANDING_WELCOME_AI },
  ],
};
