import { platformBrowser } from '@angular/platform-browser';
import { AppModule } from './app/app.module';

// 🔥 Agrega esta línea
import { environment } from './app/core/environments/environment';

console.log('🌍 Entorno cargado:', environment);

platformBrowser().bootstrapModule(AppModule, {
  ngZoneEventCoalescing: true,
})
  .catch(err => console.error(err));
