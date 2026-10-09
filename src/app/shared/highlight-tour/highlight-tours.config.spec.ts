import { HIGHLIGHT_TOURS } from './highlight-tours.config';

describe('landing_welcome tour (T2)', () => {
  const steps = HIGHLIGHT_TOURS.landing_welcome;
  it('has logo → login → AI steps', () => {
    expect(steps.map(s => s.targetId)).toEqual(['nav-logo', 'login-btn', 'ai-plan-btn']);
  });
  it('uses the approved copy', () => {
    expect(steps[0].text['es-CL']).toBe('¡Guau! 🐾 ¡Bienvenido a Tripilove! Soy Miel, seré tu compañera de aventuras y te ayudaré a crear el viaje de tus sueños con IA');
    expect(steps[1].text['es-CL']).toBe('¿No sabes por dónde empezar? 🐶 ¡Regístrate con tu correo y preparemos juntos tu próxima aventura!');
    expect(steps[2].text['es-CL']).toContain('🐾 Crear con IA');
    expect(steps[2].text['en-US']).toContain('🐾 Create with AI');
    for (const s of steps) expect(s.text['en-US'].length).toBeGreaterThan(0);
  });
});
