"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
exports.__esModule = true;
exports.MenuComponent = void 0;
var core_1 = require("@angular/core");
var http_1 = require("@angular/common/http");
var login_dialog_component_1 = require("../login-dialog/login-dialog.component");
var wait_dialog_component_1 = require("../wait-dialog/wait-dialog.component");
var FileSaver = require("file-saver");
var pako = require("pako");
var environment_1 = require("src/environments/environment");
var MenuComponent = /** @class */ (function () {
    function MenuComponent(modalService, app, scene, helper, InputData, ResultData, http, three, printService, countArea, auth, user) {
        this.modalService = modalService;
        this.app = app;
        this.scene = scene;
        this.helper = helper;
        this.InputData = InputData;
        this.ResultData = ResultData;
        this.http = http;
        this.three = three;
        this.printService = printService;
        this.countArea = countArea;
        this.auth = auth;
        this.user = user;
        this.fileName = "";
        this.userPoint = this.user.new_points;
    }
    MenuComponent.prototype.ngOnInit = function () {
        this.fileName = "立体骨組構造解析ソフトver1.6.8";
        this.helper.isContentsDailogShow = false;
        this.setDimension(2);
    };
    // 新規作成
    MenuComponent.prototype.renew = function () {
        this.app.dialogClose(); // 現在表示中の画面を閉じる
        this.InputData.clear();
        this.ResultData.clear();
        this.three.ClearData();
        this.fileName = "立体骨組構造解析ソフトver1.6.8";
        this.isCalculated = false;
    };
    // ファイルを開く
    MenuComponent.prototype.open = function (evt) {
        var _this = this;
        this.app.dialogClose(); // 現在表示中の画面を閉じる
        this.InputData.clear();
        this.ResultData.clear();
        this.three.ClearData();
        this.countArea.clear();
        var modalRef = this.modalService.open(wait_dialog_component_1.WaitDialogComponent);
        var file = evt.target.files[0];
        this.fileName = file.name;
        evt.target.value = "";
        this.fileToText(file)
            .then(function (text) {
            _this.app.dialogClose(); // 現在表示中の画面を閉じる
            var old = _this.helper.dimension;
            _this.InputData.loadInputData(text); // データを読み込む
            if (old !== _this.helper.dimension) {
                _this.setDimension(_this.helper.dimension);
            }
            _this.three.fileload();
            modalRef.close();
            _this.isCalculated = false;
        })["catch"](function (err) {
            alert(err);
            modalRef.close();
        });
    };
    MenuComponent.prototype.fileToText = function (file) {
        var reader = new FileReader();
        reader.readAsText(file);
        return new Promise(function (resolve, reject) {
            reader.onload = function () {
                resolve(reader.result);
            };
            reader.onerror = function () {
                reject(reader.error);
            };
        });
    };
    // ファイルを保存
    MenuComponent.prototype.save = function () {
        var inputJson = JSON.stringify(this.InputData.getInputJson());
        var blob = new window.Blob([inputJson], { type: "text/plain" });
        if (this.fileName.length === 0) {
            this.fileName = "frameWebForJS.json";
        }
        var ext = "";
        if (this.helper.getExt(this.fileName) !== "json") {
            ext = ".json";
        }
        FileSaver.saveAs(blob, this.fileName + ext);
    };
    // 計算
    MenuComponent.prototype.calcrate = function () {
        var _this = this;
        var modalRef = this.modalService.open(wait_dialog_component_1.WaitDialogComponent);
        this.auth.currentUser.then(function (user) {
            if (user === null) {
                modalRef.close();
                alert("ログインしてください");
                return;
            }
            var jsonData = _this.InputData.getInputJson(0);
            if ("error" in jsonData) {
                alert(jsonData["error"]);
                modalRef.close(); // モーダルダイアログを消す
                return;
            }
            jsonData["uid"] = user.uid;
            jsonData["production"] = environment_1.environment.production;
            _this.ResultData.clear(); // 解析結果情報をクリア
            _this.post_compress(jsonData, modalRef);
        });
    };
    MenuComponent.prototype.post_compress = function (jsonData, modalRef) {
        var _this = this;
        var url = environment_1.environment.calcURL; // 'https://asia-northeast1-the-structural-engine.cloudfunctions.net/frameWeb-2';
        // json string にする
        var json = JSON.stringify(jsonData, null, 0);
        console.log(json);
        // pako を使ってgzip圧縮する
        var compressed = pako.gzip(json);
        //btoa() を使ってBase64エンコードする
        var base64Encoded = btoa(compressed);
        this.http
            .post(url, base64Encoded, {
            headers: new http_1.HttpHeaders({
                "Content-Type": "application/json",
                "Content-Encoding": "gzip,base64"
            }),
            responseType: "text"
        })
            .subscribe(function (response) {
            // 通信成功時の処理（成功コールバック）
            console.log("通信成功!!");
            try {
                if (response.includes("error")) {
                    throw response;
                }
                // Decode base64 (convert ascii to binary)
                var strData = atob(response);
                // Convert binary string to character-number array
                var charData = strData.split("").map(function (x) {
                    return x.charCodeAt(0);
                });
                // Turn number array into byte-array
                var binData = new Uint8Array(charData);
                // Pako magic
                var json_1 = pako.ungzip(binData, { to: "string" });
                var jsonData_1 = JSON.parse(json_1);
                // サーバーのレスポンスを集計する
                console.log(jsonData_1);
                if ("error" in jsonData_1) {
                    throw jsonData_1.error;
                }
                // ポイントの処理
                var _jsonData = {};
                for (var _i = 0, _a = Object.keys(jsonData_1); _i < _a.length; _i++) {
                    var key = _a[_i];
                    if ((typeof jsonData_1[key]).toLowerCase() === "number") {
                        _this.user[key] = jsonData_1[key];
                    }
                    else {
                        _jsonData[key] = jsonData_1[key];
                    }
                }
                // テスト ---------------------------------------------
                // this.saveResult(json);
                // --------------------------------------------- テスト*/
                // 解析結果を集計する
                _this.ResultData.loadResultData(_jsonData);
                _this.isCalculated = true;
            }
            catch (e) {
                alert(e);
            }
            finally {
                modalRef.close(); // モーダルダイアログを消す
                alert(_this.user.deduct_points +
                    "ポイント消費しました。本日の使用量は、" +
                    _this.user.new_points +
                    "です.");
                _this.userPoint = _this.user.new_points;
            }
        }, function (error) {
            var messege = "通信 " + error.statusText;
            if ("_body" in error) {
                messege += "\n" + error._body;
            }
            alert(messege);
            console.error(error);
            modalRef.close();
        });
    };
    // ピックアップファイル出力
    MenuComponent.prototype.pickup = function () {
        var pickupJson;
        var ext;
        if (this.helper.dimension === 2) {
            pickupJson = this.ResultData.GetPicUpText2D();
            ext = ".pik";
        }
        else {
            pickupJson = this.ResultData.GetPicUpText();
            ext = ".csv";
        }
        var blob = new window.Blob([pickupJson], { type: "text/plain" });
        var filename = "frameWebForJS" + ext;
        if (this.fileName.length > 0) {
            filename = this.fileName.split(".").slice(0, -1).join(".");
            filename += ext;
        }
        FileSaver.saveAs(blob, filename);
    };
    // ログイン関係
    MenuComponent.prototype.logIn = function () {
        this.app.dialogClose(); // 現在表示中の画面を閉じる
        this.modalService.open(login_dialog_component_1.LoginDialogComponent).result.then(function (result) { });
    };
    MenuComponent.prototype.logOut = function () {
        this.auth.signOut();
    };
    //　印刷フロート画面用
    MenuComponent.prototype.dialogClose = function () {
        this.helper.isContentsDailogShow = false;
    };
    MenuComponent.prototype.contentsDailogShow = function (id) {
        this.deactiveButtons();
        document.getElementById(id).classList.add("active");
        this.helper.isContentsDailogShow = true;
    };
    // アクティブになっているボタンを全て非アクティブにする
    MenuComponent.prototype.deactiveButtons = function () {
        for (var i = 0; i <= 13; i++) {
            var data = document.getElementById(i + "");
            if (data != null) {
                if (data.classList.contains("active")) {
                    data.classList.remove("active");
                }
            }
        }
    };
    MenuComponent.prototype.setDimension = function (dim) {
        if (dim === void 0) { dim = null; }
        if (dim === null) {
            if (this.helper.dimension === 2) {
                this.helper.dimension = 3;
            }
            else {
                this.helper.dimension = 2;
            }
        }
        else {
            this.helper.dimension = dim;
            var g23D = document.getElementById("toggle--switch");
            g23D.checked = this.helper.dimension === 3;
        }
        this.app.dialogClose(); // 現在表示中の画面を閉じる
        this.scene.createCamera(); // three.js のカメラを変更する
        this.scene.addControls();
        this.scene.render();
    };
    // テスト ---------------------------------------------
    MenuComponent.prototype.saveResult = function (text) {
        var blob = new window.Blob([text], { type: "text/plain" });
        FileSaver.saveAs(blob, "frameWebResult.json");
    };
    //解析結果ファイルを開く
    MenuComponent.prototype.resultopen = function (evt) {
        var _this = this;
        var modalRef = this.modalService.open(wait_dialog_component_1.WaitDialogComponent);
        var file = evt.target.files[0];
        this.fileName = file.name;
        evt.target.value = "";
        this.fileToText(file)
            .then(function (text) {
            _this.app.dialogClose(); // 現在表示中の画面を閉じる
            _this.ResultData.clear();
            var jsonData = JSON.parse(text);
            _this.ResultData.loadResultData(jsonData);
            modalRef.close();
        })["catch"](function (err) {
            alert(err);
            modalRef.close();
        });
    };
    MenuComponent.prototype.goToLink = function () {
        window.open("https://liberating-rodent-f3f.notion.site/4e2148bfe8704aa6b6dbc619d539c8c3?v=76a73b4693404e64a56ab8f8ff538e4d", "_blank");
    };
    MenuComponent = __decorate([
        core_1.Component({
            selector: "app-menu",
            templateUrl: "./menu.component.html",
            styleUrls: ["./menu.component.scss", "../../app.component.scss"]
        })
    ], MenuComponent);
    return MenuComponent;
}());
exports.MenuComponent = MenuComponent;
