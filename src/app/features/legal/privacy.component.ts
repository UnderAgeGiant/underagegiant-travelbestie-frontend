import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { NavShellComponent } from '../nav/nav-shell.component';
import { ProfileComponent } from '../profile/profile.component';

@Component({
  selector: 'app-privacy',
  imports: [NavShellComponent, ProfileComponent, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="legal-page">
      <app-nav (logoClick)="goHome()" (profileClick)="showProfile.set(true)" />

      @if (showProfile()) {
        <app-profile (close)="showProfile.set(false)" />
      }

      <div class="legal-content">
        <div class="legal-eyebrow" i18n="@@privacy.eyebrow">Legal</div>
        <h1 class="legal-title" i18n="@@privacy.title">Política de privacidad</h1>
        <p class="legal-updated" i18n="@@privacy.updated">Última actualización: 8 de septiembre de 2026</p>

        <section class="legal-section">
          <h2 i18n="@@privacy.s1.title">1. Qué información recopilamos</h2>
          <p i18n="@@privacy.s1.body">Recopilamos la información que nos entregas directamente: nombre, correo electrónico, contraseña (almacenada como hash, nunca en texto plano) y, opcionalmente, tu país de residencia. También guardamos los datos de tus planes de viaje (paradas, fechas, alojamiento, transporte, atracciones seleccionadas), tus comentarios en atracciones y viajes compartidos, los lugares que marcas como "visitados" en el mapa de tu perfil, y un identificador anónimo generado automáticamente en tu navegador (independiente de tu cuenta) que nos permite reconocer visitas recurrentes antes de que inicies sesión.</p>
        </section>

        <section class="legal-section">
          <h2 i18n="@@privacy.s2.title">2. Cómo usamos tu información</h2>
          <p i18n="@@privacy.s2.body">Usamos tu información para operar el servicio: mostrar y guardar tus planes de viaje, generar sugerencias con inteligencia artificial, calcular tu saldo de Karma, enviarte notificaciones dentro de la aplicación y por correo (por ejemplo, confirmaciones de compra o invitaciones de colaboración), y mejorar el producto. No usamos tu información para publicidad dirigida.</p>
        </section>

        <section class="legal-section">
          <h2 i18n="@@privacy.s3.title">3. Con quién compartimos información</h2>
          <p i18n="@@privacy.s3.body">Compartimos información limitada con proveedores externos estrictamente necesarios para operar el servicio: PayPal para procesar compras de Karma, DeepSeek para generar sugerencias de viaje con inteligencia artificial (recibe únicamente tus preferencias de viaje, no tus datos de cuenta), Cloudflare Turnstile para verificar que no eres un robot al registrarte o iniciar sesión, y nuestro proveedor de correo saliente para enviarte notificaciones transaccionales. Nunca vendemos tu información personal a terceros.</p>
        </section>

        <section class="legal-section">
          <h2 i18n="@@privacy.s4.title">4. Cookies y almacenamiento local</h2>
          <p i18n="@@privacy.s4.body">Usamos el almacenamiento local de tu navegador (localStorage) para guardar tu sesión, tus preferencias (como el idioma) y una copia de tu plan de viaje en progreso. Usamos una cookie técnica HttpOnly para mantener tu sesión de forma segura, y una cookie para recordar tu idioma preferido. No usamos cookies de rastreo publicitario.</p>
        </section>

        <section class="legal-section">
          <h2 i18n="@@privacy.s5.title">5. Seguridad</h2>
          <p i18n="@@privacy.s5.body">Tu contraseña se almacena usando bcrypt (un algoritmo de hash unidireccional, nunca en texto plano). Las credenciales viajan cifradas entre tu navegador y nuestros servidores. Las sesiones se gestionan con tokens de corta duración que se renuevan automáticamente.</p>
        </section>

        <section class="legal-section">
          <h2 i18n="@@privacy.s6.title">6. Retención de datos</h2>
          <p i18n="@@privacy.s6.body">Conservamos tu información mientras tu cuenta esté activa. Si eliminas tu cuenta, eliminamos tus datos personales identificables, salvo la información que debamos conservar por obligación legal (por ejemplo, registros de transacciones de pago).</p>
        </section>

        <section class="legal-section">
          <h2 i18n="@@privacy.s7.title">7. Tus derechos</h2>
          <p i18n="@@privacy.s7.body">Puedes acceder, corregir o eliminar tu información personal en cualquier momento desde tu perfil (nombre, contraseña, país de residencia), o solicitando la eliminación completa de tu cuenta a través de los canales de contacto indicados en la página <a routerLink="/about">Sobre Tripilove</a>.</p>
        </section>

        <section class="legal-section">
          <h2 i18n="@@privacy.s8.title">8. Menores de edad</h2>
          <p i18n="@@privacy.s8.body">El servicio no está dirigido a menores de 13 años y no recopilamos intencionalmente información de menores de esa edad.</p>
        </section>

        <section class="legal-section">
          <h2 i18n="@@privacy.s9.title">9. Cambios a esta política</h2>
          <p i18n="@@privacy.s9.body">Podemos actualizar esta política ocasionalmente. Publicaremos la fecha de la última actualización al inicio de esta página.</p>
        </section>

        <section class="legal-section">
          <h2 i18n="@@privacy.s10.title">10. Contacto</h2>
          <p i18n="@@privacy.s10.body">Si tienes preguntas sobre esta política de privacidad, puedes contactarnos a través de los canales indicados en la página <a routerLink="/about">Sobre Tripilove</a>.</p>
        </section>
      </div>
    </div>
  `,
})
export class PrivacyComponent {
  private readonly router = inject(Router);
  readonly showProfile = signal(false);

  goHome(): void {
    this.router.navigate(['/']);
  }
}
