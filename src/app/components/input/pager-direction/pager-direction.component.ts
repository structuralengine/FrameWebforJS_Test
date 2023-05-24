import { Component, OnInit, Output, EventEmitter } from "@angular/core";
import { Router, NavigationEnd } from "@angular/router";
import { filter } from "rxjs/operators";
import { PagerDirectionService } from "./pager-direction.service";
import { ResultCombineDisgService } from "../../result/result-combine-disg/result-combine-disg.service";

@Component({
  selector: "app-pager-direction",
  templateUrl: "./pager-direction.component.html",
  styleUrls: ["./pager-direction.component.scss"],
})
export class PagerDirectionComponent implements OnInit {
  @Output() event = new EventEmitter<number>();

  public page: number = 0;
  public selectedPage: number;
  public pages: number[];
  public pages_name: string[];
  public TITLES: string[];

  constructor(
    private router: Router,
    private pagerService: PagerDirectionService,
    private data: ResultCombineDisgService
  ) {
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => {
        this.selectedPage = 1;
        this.pages_name = this.pages.map((page) => this.getName(page));
      });
    this.TITLES = this.data.titles;
    this.pages = Array.from({ length: this.TITLES.length }, (_, i) => i + 1);
  }

  ngOnInit(): void {
    this.selectedPage = 1;
    this.updatePages();
  }

  private getName(page: number): string {
    return `${page}.${this.TITLES[page - 1]}`;
  }

  public updatePages() {
    this.pagerService.goToPage(this.selectedPage);
    this.pages_name = this.pages.map((page) => this.getName(page));
  }

  public previousPage() {
    if (this.selectedPage < 1) return;
    this.selectedPage--;
    this.updatePages();
  }

  public nextPage() {
    this.selectedPage++;
    this.updatePages();
  }
}
