import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ThemeController } from './core/theme/theme-controller';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  private themeController = inject(ThemeController);
}
