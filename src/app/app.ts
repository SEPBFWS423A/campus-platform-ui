import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ThemeController } from './core/theme/theme-controller';
import { PublicService } from './core/public/public.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit {
  private themeController = inject(ThemeController);
  private publicService = inject(PublicService);

  ngOnInit() {
    this.publicService.getUniversityName().subscribe();
  }
}
