import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TrophyCelebrationComponent } from './shared/trophy-celebration/trophy-celebration.component';

@Component({
    selector: 'app-root',
    imports: [RouterOutlet, TrophyCelebrationComponent],
    template: `<router-outlet /><tb-trophy-celebration />`,
})
export class AppComponent {}
