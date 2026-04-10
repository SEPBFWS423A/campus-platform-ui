import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ThemeController } from './core/theme/theme-controller';
import { PublicService } from './core/public/public.service';
import { Title } from '@angular/platform-browser';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit {
  private themeController = inject(ThemeController);
  public publicService = inject(PublicService);
  private titleService = inject(Title);

  ngOnInit() {
    this.publicService.getUniversityName().subscribe(res => {
      if (res.name) {
        this.titleService.setTitle(res.name);
      }
    });
  }
}
