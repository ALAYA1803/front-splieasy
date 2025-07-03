import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
interface ProcessStep {
  iconClass: string;
  titleKey: string;
  descriptionKey: string;
}

@Component({
  selector: 'app-howdoesitwork-section',
  standalone: false,
  templateUrl: './howdoesitwork-section.component.html',
  styleUrls: ['./howdoesitwork-section.component.css']
})
export class HowdoesitworkSectionComponent {

  activeTab: 'rep' | 'member' = 'rep';

  repSteps: ProcessStep[] = [
    { iconClass: 'bi bi-person-plus-fill', titleKey: 'HOW_IT_WORKS.REP.STEP_1_TITLE', descriptionKey: 'HOW_IT_WORKS.REP.STEP_1_TEXT' },
    { iconClass: 'bi bi-house-heart-fill', titleKey: 'HOW_IT_WORKS.REP.STEP_2_TITLE', descriptionKey: 'HOW_IT_WORKS.REP.STEP_2_TEXT' },
    { iconClass: 'bi bi-cash-coin', titleKey: 'HOW_IT_WORKS.REP.STEP_3_TITLE', descriptionKey: 'HOW_IT_WORKS.REP.STEP_3_TEXT' },
    { iconClass: 'bi bi-bar-chart-line-fill', titleKey: 'HOW_IT_WORKS.REP.STEP_4_TITLE', descriptionKey: 'HOW_IT_WORKS.REP.STEP_4_TEXT' }
  ];

  memberSteps: ProcessStep[] = [
    { iconClass: 'bi bi-person-plus-fill', titleKey: 'HOW_IT_WORKS.MEMBER.STEP_1_TITLE', descriptionKey: 'HOW_IT_WORKS.MEMBER.STEP_1_TEXT' },
    { iconClass: 'bi bi-key-fill', titleKey: 'HOW_IT_WORKS.MEMBER.STEP_2_TITLE', descriptionKey: 'HOW_IT_WORKS.MEMBER.STEP_2_TEXT' },
    { iconClass: 'bi bi-wallet-fill', titleKey: 'HOW_IT_WORKS.MEMBER.STEP_3_TITLE', descriptionKey: 'HOW_IT_WORKS.MEMBER.STEP_3_TEXT' },
    { iconClass: 'bi bi-eye-fill', titleKey: 'HOW_IT_WORKS.MEMBER.STEP_4_TITLE', descriptionKey: 'HOW_IT_WORKS.MEMBER.STEP_4_TEXT' }
  ];

  constructor() { }

  selectTab(tab: 'rep' | 'member') {
    this.activeTab = tab;
  }
}
