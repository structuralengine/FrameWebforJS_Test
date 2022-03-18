import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { SceneService } from '../scene.service';
import { MaxMinService } from './max-min.service';

@Component({
  selector: 'app-max-min',
  templateUrl: './max-min.component.html',
  styleUrls: ['./max-min.component.scss']
})
export class MaxMinComponent implements OnInit, OnDestroy {
  
  private subscription: Subscription;

  constructor(public scene: SceneService,
    public max_min: MaxMinService,) { }

  ngOnInit(): void {
    this.max_min.maxMinClear();
  }

  ngOnDestroy() {
    // unsubscribe to ensure no memory leaks
    this.subscription.unsubscribe();
  }
}
