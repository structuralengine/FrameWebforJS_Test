"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
exports.__esModule = true;
exports.PrintThreeComponent = void 0;
var core_1 = require("@angular/core");
var PrintThreeComponent = /** @class */ (function () {
    // @ViewChild('img') img: ElementRef;
    function PrintThreeComponent(printService, customThree, three) {
        this.printService = printService;
        this.customThree = customThree;
        this.three = three;
    }
    PrintThreeComponent.prototype.ngOnInit = function () {
        this.print_target = this.printService.print_target.result;
        // let caseCount = this.three.selectedNumber
        var selectCount = this.three.selectedNumber;
        if (selectCount == 0) {
            selectCount = 6;
        }
        var mode = this.three.mode;
        var count = 0;
        for (var i = 0; i < this.print_target.length; i++) {
            if (i === 0) {
                var target = this.print_target[0];
                target["judge"] = false;
            }
            else {
                var target = this.print_target[i];
                if (mode === "fsec" || mode === "comb_fsec" || mode === "pik_fsec") {
                    if (selectCount == 1) {
                        target["judge"] = i % 2 === 0 ? true : false;
                    }
                    else {
                        target["judge"] =
                            (count + 1) % selectCount === 0 || (count + 1) % 2 === 0
                                ? true
                                : false;
                        count = (count + 1) % selectCount === 0 ? 0 : count + 1;
                    }
                }
                else {
                    target["judge"] = i % 2 === 0 ? true : false;
                }
            }
        }
        this.title1 = this.printService.print_target.title1;
    };
    PrintThreeComponent = __decorate([
        core_1.Component({
            selector: "app-print-three",
            templateUrl: "./print-three.component.html",
            styleUrls: [
                "./print-three.component.scss",
                "../../../../app.component.scss",
                "../invoice.component.scss",
            ]
        })
    ], PrintThreeComponent);
    return PrintThreeComponent;
}());
exports.PrintThreeComponent = PrintThreeComponent;
