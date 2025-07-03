import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

interface Testimonial {
  nameKey: string;
  roleKey: string;
  textKey: string;
  imageUrl: string;
  rating: number;
}

@Component({
  selector: 'app-review-section',
  standalone: false,
  templateUrl: './review-section.component.html',
  styleUrls: ['./review-section.component.css']
})
export class ReviewSectionComponent {

  testimonials: Testimonial[] = [
    { nameKey: 'REVIEWS.ITEMS.0.NAME', roleKey: 'REVIEWS.ITEMS.0.ROLE', textKey: 'REVIEWS.ITEMS.0.TEXT', imageUrl: 'assets/images/random1.png', rating: 5 },
    { nameKey: 'REVIEWS.ITEMS.1.NAME', roleKey: 'REVIEWS.ITEMS.1.ROLE', textKey: 'REVIEWS.ITEMS.1.TEXT', imageUrl: 'assets/images/random2.png', rating: 5 },
    { nameKey: 'REVIEWS.ITEMS.2.NAME', roleKey: 'REVIEWS.ITEMS.2.ROLE', textKey: 'REVIEWS.ITEMS.2.TEXT', imageUrl: 'assets/images/random3.png', rating: 4 }
  ];

  stars = [1, 2, 3, 4, 5];

  constructor() { }
}
