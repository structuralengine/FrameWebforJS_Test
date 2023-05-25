import { Component, OnInit, Output, EventEmitter } from "@angular/core";
import { Router, NavigationEnd } from "@angular/router";
import { filter } from "rxjs/operators";
import { PagerService } from "./pager.service";
import { InputLoadService } from "../input-load/input-load.service";
import { ResultDataService } from "../../../providers/result-data.service";

@Component({
  selector: "app-pager",
  templateUrl: "./pager.component.html",
  styleUrls: ["./pager.component.scss"],
})
export class PagerComponent implements OnInit {
  //  親コンポーネントに対してイベントを発火するためのプロパティ
  @Output() event = new EventEmitter<number>();

  public page: number = 0;
  public selectedPage: number;
  public pages: number[];
  public pages_name: string[];

  constructor(
    private router: Router,
    private pagerService: PagerService,
    private load: InputLoadService,
    private result: ResultDataService
  ) {
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => {
        this.selectedPage = result.page;
        this.pages_name = this.pages.map((page) => this.getName(page));
      });

    this.pages = Array.from({ length: 999 }, (_, i) => i + 1);
  }

  ngOnInit(): void {
    this.selectedPage = 1;
    this.updatePages();
  }

  private getName(page: number): string {
    if (
      this.router.url.includes("result-disg") ||
      this.router.url.includes("result-reac") ||
      this.router.url.includes("result-fsec") ||
      this.router.url.includes("input-loads")
    ) {
      return `${page}.${this.load.getLoadName(page)}`;
    } else {
      return `${page}ページ`;
    }
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
