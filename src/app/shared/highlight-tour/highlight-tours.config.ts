import { HighlightType } from '../../core/models/highlight.model';

export interface HighlightStep {
  targetId: string;
  text: { 'es-CL': string; 'en-US': string };
}

const LANDING_WELCOME_LOGO = {
  'es-CL': '¡Guau Guau! Bienvenido a Tripilove, tu página web para planificación de viajes con IA. Soy Asistente Miel y seré tu guía.',
  'en-US': "Woof woof! Welcome to Tripilove, your website for AI trip planning. I'm Assistant Miel and I'll be your guide.",
};

const LANDING_WELCOME_SIGNUP = {
  'es-CL': '¿No sabes dónde comenzar? Crea un usuario con tu correo.',
  'en-US': 'Not sure where to start? Create an account with your email.',
};

const LANDING_WELCOME_AI = {
  'es-CL': 'Luego de registrarte, presiona el botón "🐾 Crear con IA" para que comencemos a jugar. ¡Yo te acompaño!',
  'en-US': "After you sign up, press the \"🐾 Crear con IA\" button so we can start playing. I'll be right there with you!",
};

export const HIGHLIGHT_TOURS: Record<HighlightType, HighlightStep[]> = {
  landing_welcome: [
    { targetId: 'nav-logo',    text: LANDING_WELCOME_LOGO },
    { targetId: 'login-btn',   text: LANDING_WELCOME_SIGNUP },
    { targetId: 'ai-plan-btn', text: LANDING_WELCOME_AI },
  ],
};
