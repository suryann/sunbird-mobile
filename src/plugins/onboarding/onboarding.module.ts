import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';

import { OnboardingPage } from './onboarding';

@NgModule({
  declarations: [
    OnboardingPage
  ],
  imports: [
    IonicPageModule.forChild(OnboardingPage),
  ],
  exports: [
    OnboardingPage
  ],
})
export class OnboardingPageModule {}
