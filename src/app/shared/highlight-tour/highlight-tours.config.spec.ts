import { HIGHLIGHT_TOURS } from './highlight-tours.config';

describe('landing_welcome tour (T2)', () => {
  const steps = HIGHLIGHT_TOURS.landing_welcome;
  it('has logo → login → AI steps', () => {
    expect(steps.map(s => s.targetId)).toEqual(['nav-logo', 'login-btn', 'ai-plan-btn']);
  });
  it('uses the approved copy', () => {
    expect(steps[0].text['es-CL']).toBe('¡Guau Guau! Bienvenido a Tripilove, tu página web para planificación de viajes con IA. Soy Asistente Miel y seré tu guía.');
    expect(steps[1].text['es-CL']).toBe('¿No sabes dónde comenzar? Crea un usuario con tu correo.');
    expect(steps[2].text['es-CL']).toContain('🐾 Crear con IA');
    for (const s of steps) expect(s.text['en-US'].length).toBeGreaterThan(0);
  });
});
