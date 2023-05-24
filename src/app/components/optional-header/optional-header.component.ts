import { Component, OnInit } from "@angular/core";
import { Router, NavigationEnd } from "@angular/router";
import { filter } from "rxjs/operators";
import { DataHelperModule } from "src/app/providers/data-helper.module";
import { SceneService } from "../three/scene.service";

const URL_INPUTS = [
  "/input-fix_nodes",
  "/input-elements",
  "/input-joints",
  "/input-loads",
  "/input-fix_members",
];
const URL_RESULTS = [
  "/result-disg",
  "/result-reac",
  "/result-fsec",
  "/result-comb_disg",
  "/result-comb_reac",
  "/result-comb_fsec",
  "/result-pic_disg",
  "/result-pic_reac",
  "/result-pic_fsec",
];
const URL_COMB_PIC = [
  "/result-comb_disg",
  "/result-comb_reac",
  "/result-comb_fsec",
  "/result-pic_reac",
  "/result-pic_fsec",
  "/result-pic_disg",
];
const URL_LOAD = ["/input-loads", "/input-load-name"];
const URL_DEFINE = ["/input-define", "/input-combine", "/input-pickup"];
const URL_RESULT_PIC = [
  "/result-pic_reac",
  "/result-pic_fsec",
  "/result-pic_disg",
];

@Component({
  selector: "app-optional-header",
  templateUrl: "./optional-header.component.html",
  styleUrls: ["./optional-header.component.scss"],
})
export class OptionalHeaderComponent implements OnInit {
  showPagerComponent: boolean;
  showLoadComponent: boolean;
  showDefineComponent: boolean;
  showResultComponent: boolean;
  showNotBasicComponent: boolean;
  showPicComponent: boolean;
  showDisgComponent: boolean;
  showReacComponent: boolean;
  showFsecComponent: boolean;

  selectedLink: string = "/input-load-name";
  selectedDefineLink: string = "/input-define";
  selectedDisgLink: string = "/result-disg";
  selectedReacLink: string = "/result-reac";
  selectedFsecLink: string = "/result-fsec";
  isControlOpen: boolean = true;
  selectedLoadPage: number = 1;
  selectedDefinePage: number = 1;
  selectedResultPage: number = 1;
  loadPages: number[] = [1, 2];
  definePages: number[] = [1, 2, 3];
  resultPages: number[] = [1, 2, 3];

  resultDisgURL: string[] = [
    "/result-disg",
    "/result-comb_disg",
    "/result-pic_disg",
  ];
  resultReacURL: string[] = [
    "/result-reac",
    "/result-comb_reac",
    "/result-pic_reac",
  ];
  resultFsecURL: string[] = [
    "/result-fsec",
    "/result-comb_fsec",
    "/result-pic_fsec",
  ];

  constructor(
    private router: Router,
    private scene: SceneService,
    public helper: DataHelperModule
  ) {
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.showPagerComponent = URL_INPUTS.concat(URL_RESULTS).includes(
          event.url
        );
        this.showLoadComponent = URL_LOAD.includes(event.url);
        this.showDefineComponent = URL_DEFINE.includes(event.url);
        this.showResultComponent = URL_RESULTS.includes(event.url);
        this.showNotBasicComponent = URL_COMB_PIC.includes(event.url);
        this.showPicComponent = URL_RESULT_PIC.includes(event.url);

        this.showDisgComponent = this.resultDisgURL.includes(event.url);
        this.showReacComponent = this.resultReacURL.includes(event.url);
        this.showFsecComponent = this.resultFsecURL.includes(event.url);
        this.initSelectedValue(event.url);
      });
  }

  ngOnInit() {}
  initSelectedValue(url: string) {
    if (url === "/input-load-name") {
      this.selectedLink = url;
      this.selectedLoadPage = 1;
      this.onLinkChange(this.selectedLink);
    } else if (url === "/input-define") {
      this.selectedDefineLink = url;
      this.selectedDefinePage = 1;
      this.onLinkChange(this.selectedDefineLink);
    } else {
      this.onLinkChange(url);
    }
  }

  onToggleControl() {
    this.isControlOpen ? this.scene.close() : this.scene.open();
    this.isControlOpen = !this.isControlOpen;
  }

  previousLoadPage() {
    this.selectedLoadPage--;
    this.selectedLink = "/input-load-name";
    this.onLinkChange(this.selectedLink);
  }

  nextLoadPage() {
    this.selectedLoadPage++;
    this.selectedLink = "/input-loads";
    this.onLinkChange(this.selectedLink);
  }

  previousDefinePage() {
    this.selectedDefinePage--;
    if (this.selectedDefinePage === 2) {
      this.selectedDefineLink = "/input-combine";
    } else if (this.selectedDefinePage === 1) {
      this.selectedDefineLink = "/input-define";
    }
    this.onLinkChange(this.selectedDefineLink);
  }

  nextDefinePage() {
    this.selectedDefinePage++;
    if (this.selectedDefinePage === 2) {
      this.selectedDefineLink = "/input-combine";
    } else if (this.selectedDefinePage === 3) {
      this.selectedDefineLink = "/input-pickup";
    }
    this.onLinkChange(this.selectedDefineLink);
  }

  previousResultPage() {
    this.selectedResultPage--;
    const resultURL = this.selectedUrlChange();
    this.router.navigate([resultURL[this.selectedResultPage - 1]]);
  }

  nextResultPage() {
    this.selectedResultPage++;
    const resultURL = this.selectedUrlChange();
    this.router.navigate([resultURL[this.selectedResultPage - 1]]);
  }

  onLinkChange(link: string) {
    this.router.navigate([link]);
  }
  onResultLinkChange(page: number) {
    const resultURL = this.selectedUrlChange();
    this.router.navigate([resultURL[page - 1]]);
  }

  selectedUrlChange(): string[] {
    if (this.showDisgComponent) return this.resultDisgURL;
    if (this.showReacComponent) return this.resultReacURL;
    if (this.showFsecComponent) return this.resultFsecURL;
  }
}
