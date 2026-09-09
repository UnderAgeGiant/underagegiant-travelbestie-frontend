import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { NavShellComponent } from '../nav/nav-shell.component';
import { ProfileComponent } from '../profile/profile.component';

@Component({
  selector: 'app-terms',
  imports: [NavShellComponent, ProfileComponent, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="legal-page">
      <app-nav (logoClick)="goHome()" (profileClick)="showProfile.set(true)" />

      @if (showProfile()) {
        <app-profile (close)="showProfile.set(false)" />
      }

      <div class="legal-content">
        <div class="legal-eyebrow" i18n="@@terms.eyebrow">Legal</div>
        <h1 class="legal-title" i18n="@@terms.title">Términos de servicio</h1>
        <p class="legal-updated" i18n="@@terms.updated">Última actualización: 8 de septiembre de 2026</p>

        <section class="legal-section">
          <h2 i18n="@@terms.s1.title">1. Aceptación de los términos</h2>
          <p i18n="@@terms.s1.body">Al crear una cuenta o usar Tripilove ("la aplicación", "el servicio") aceptas estos Términos de servicio en su totalidad. Si no estás de acuerdo con alguna parte, no debes usar el servicio.</p>
        </section>

        <section class="legal-section">
          <h2 i18n="@@terms.s2.title">2. Qué es Tripilove</h2>
          <p i18n="@@terms.s2.body">Tripilove es una herramienta de planificación de viajes: te permite armar itinerarios con paradas, alojamiento y transporte, descubrir atracciones, compartir tus planes con otras personas, co-editar un viaje con amigos y generar sugerencias de itinerario asistidas por inteligencia artificial. No somos una agencia de viajes ni un proveedor de reservas — no vendemos vuelos, hoteles ni entradas, y no procesamos pagos en tu nombre a terceros proveedores turísticos.</p>
        </section>

        <section class="legal-section">
          <h2 i18n="@@terms.s3.title">3. Tu cuenta</h2>
          <p i18n="@@terms.s3.body">Debes registrarte con un correo electrónico válido y una contraseña. Eres responsable de mantener la confidencialidad de tus credenciales y de toda actividad que ocurra en tu cuenta. Debes tener al menos 13 años para crear una cuenta. Puedes actualizar tu nombre, correo, contraseña y país de residencia desde tu perfil en cualquier momento.</p>
        </section>

        <section class="legal-section">
          <h2 i18n="@@terms.s4.title">4. El sistema de Karma</h2>
          <p i18n="@@terms.s4.body1">Karma es una moneda virtual interna de la aplicación, sin valor monetario, que no puede canjearse por dinero ni transferirse fuera de Tripilove. Ganas Karma cuando otras personas comentan las paradas de tus viajes compartidos, y lo gastas al crear un viaje, clonar un plan, exportar un itinerario, invitar a un colaborador o usar las funciones de planificación con inteligencia artificial.</p>
          <p i18n="@@terms.s4.body2">Puedes comprar paquetes de Karma con dinero real a través de PayPal. Las compras de Karma son definitivas y no reembolsables una vez acreditadas, salvo cuando la ley aplicable exija lo contrario.</p>
        </section>

        <section class="legal-section">
          <h2 i18n="@@terms.s5.title">5. Contenido generado por inteligencia artificial</h2>
          <p i18n="@@terms.s5.body">Las sugerencias de viaje y los itinerarios generados por nuestro asistente de IA ("ARIA") son orientativos. Pueden contener errores, información desactualizada o inexacta sobre horarios, precios, disponibilidad, requisitos de visa o documentación. Es tu responsabilidad verificar cualquier dato crítico directamente con la fuente oficial (el sitio del lugar, la aerolínea, la embajada correspondiente, etc.) antes de viajar.</p>
        </section>

        <section class="legal-section">
          <h2 i18n="@@terms.s6.title">6. Contenido de terceros</h2>
          <p i18n="@@terms.s6.body">La información de atracciones, freetours y eventos que se muestra en la aplicación proviene de fuentes públicas y de terceros (incluyendo UNESCO, Civitatis y Ticketmaster) y puede estar desactualizada o contener imprecisiones. No garantizamos la exactitud de horarios, precios ni disponibilidad de terceros.</p>
        </section>

        <section class="legal-section">
          <h2 i18n="@@terms.s7.title">7. Planes colaborativos</h2>
          <p i18n="@@terms.s7.body">Puedes invitar a otra persona registrada a co-editar un viaje. Todas las personas colaboradoras pueden modificar el mismo plan; la última edición guardada prevalece sobre las anteriores ("last write wins"). No ofrecemos sincronización en tiempo real ni resolución automática de conflictos entre ediciones simultáneas.</p>
        </section>

        <section class="legal-section">
          <h2 i18n="@@terms.s8.title">8. Conducta esperada</h2>
          <p i18n="@@terms.s8.body">Al comentar atracciones o viajes compartidos, no debes publicar contenido ofensivo, spam, ni información falsa. Aplicamos límites automáticos de frecuencia y similitud a los comentarios para prevenir spam. Podemos eliminar contenido o suspender cuentas que incumplan estas reglas.</p>
        </section>

        <section class="legal-section">
          <h2 i18n="@@terms.s9.title">9. Propiedad intelectual</h2>
          <p i18n="@@terms.s9.body">El software, diseño, marca y contenido propio de Tripilove son propiedad de sus creadores. Conservas los derechos sobre el contenido que publicas (comentarios, nombres de viajes), pero nos otorgas una licencia para mostrarlo dentro del servicio, incluyendo en vistas compartidas públicamente.</p>
        </section>

        <section class="legal-section">
          <h2 i18n="@@terms.s10.title">10. Limitación de responsabilidad</h2>
          <p i18n="@@terms.s10.body">Tripilove se ofrece "tal cual", sin garantías de disponibilidad ininterrumpida. En la máxima medida permitida por la ley, no somos responsables de daños indirectos derivados del uso de la aplicación, incluyendo decisiones de viaje tomadas a partir de información incorrecta mostrada en el servicio.</p>
        </section>

        <section class="legal-section">
          <h2 i18n="@@terms.s11.title">11. Terminación de cuenta</h2>
          <p i18n="@@terms.s11.body">Puedes dejar de usar el servicio en cualquier momento. Podemos suspender o eliminar cuentas que incumplan estos términos, incluyendo uso abusivo del sistema de Karma o de las funciones de inteligencia artificial.</p>
        </section>

        <section class="legal-section">
          <h2 i18n="@@terms.s12.title">12. Cambios a estos términos</h2>
          <p i18n="@@terms.s12.body">Podemos actualizar estos términos ocasionalmente. Publicaremos la fecha de la última actualización al inicio de esta página. El uso continuado del servicio después de un cambio implica la aceptación de los nuevos términos.</p>
        </section>

        <section class="legal-section">
          <h2 i18n="@@terms.s13.title">13. Contacto</h2>
          <p i18n="@@terms.s13.body">Si tienes preguntas sobre estos términos, puedes contactarnos a través de los canales indicados en la página <a routerLink="/about">Sobre Tripilove</a>.</p>
        </section>
      </div>
    </div>
  `,
})
export class TermsComponent {
  private readonly router = inject(Router);
  readonly showProfile = signal(false);

  goHome(): void {
    this.router.navigate(['/']);
  }
}
