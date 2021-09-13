import { Component, OnInit } from '@angular/core';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { AppComponent } from '../../app.component';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { PrintService } from '../print/print.service';

import { LoginDialogComponent } from '../login-dialog/login-dialog.component';
import { WaitDialogComponent } from '../wait-dialog/wait-dialog.component';

import * as FileSaver from 'file-saver';

import { InputDataService } from '../../providers/input-data.service';
import { ResultDataService } from '../../providers/result-data.service';
import { ThreeService } from '../three/three.service';

import * as pako from 'pako';
import { DataCountService } from '../print/invoice/dataCount.service';

import { DataHelperModule } from 'src/app/providers/data-helper.module';
import { SceneService } from '../three/scene.service';
import { AngularFireAuth } from '@angular/fire/auth';
import { UserInfoService } from 'src/app/providers/user-info.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.scss', '../../app.component.scss']
})
export class MenuComponent implements OnInit {

  loginUserName: string;
  fileName: string;

  constructor(
    private modalService: NgbModal,
    private app: AppComponent,
    private scene: SceneService,
    private helper: DataHelperModule,
    private InputData: InputDataService,
    public ResultData: ResultDataService,
    private http: HttpClient,
    private three: ThreeService,
    public printService: PrintService,
    public countArea: DataCountService,
    public auth: AngularFireAuth,
    public user: UserInfoService) {
    this.fileName = '';
  }

  ngOnInit() {
    this.fileName = "立体骨組構造解析ソフトver1.6.11"
    this.helper.isContentsDailogShow = false;
    this.setDimension(2);
  }


  // 新規作成
  renew(): void {
    this.app.dialogClose(); // 現在表示中の画面を閉じる
    this.InputData.clear();
    this.ResultData.clear();
    this.three.ClearData();
    this.fileName = "立体骨組構造解析ソフトver1.6.11"
  }

  // ファイルを開く
  open(evt) {
    this.app.dialogClose(); // 現在表示中の画面を閉じる
    this.InputData.clear();
    this.ResultData.clear();
    this.three.ClearData();
    this.countArea.clear();
    const modalRef = this.modalService.open(WaitDialogComponent);

    const file = evt.target.files[0];
    this.fileName = file.name;
    evt.target.value = '';
    this.fileToText(file)
      .then(text => {
        this.app.dialogClose(); // 現在表示中の画面を閉じる
        const old = this.helper.dimension;
        this.InputData.loadInputData(text); // データを読み込む
        if(old !== this.helper.dimension){
          this.setDimension(this.helper.dimension);
        }
        this.three.fileload();
        modalRef.close();
        this.ResultData.isCalculated = false;
      })
      .catch(err => {
        alert(err);
        modalRef.close();
      });
  }

  private fileToText(file): any {
    const reader = new FileReader();
    reader.readAsText(file);
    return new Promise((resolve, reject) => {
      reader.onload = () => {
        resolve(reader.result);
      };
      reader.onerror = () => {
        reject(reader.error);
      };
    });
  }

  // ファイルを保存
  save(): void {
    const inputJson: string = JSON.stringify(this.InputData.getInputJson());
    const blob = new window.Blob([inputJson], { type: 'text/plain' });
    if (this.fileName.length === 0) {
      this.fileName = 'frameWebForJS.json';
    }
    let ext = '';
    if(this.helper.getExt(this.fileName) !== 'json'){
      ext = '.json';
    }
    FileSaver.saveAs(blob, this.fileName + ext);
  }


  // 計算
  public calcrate(): void {

    const modalRef = this.modalService.open(WaitDialogComponent);

    this.auth.currentUser.then(user=>{

      if(user === null){
        modalRef.close(); 
        alert("ログインしてください");
        return;
      }

      const jsonData: {} = this.InputData.getInputJson(0);

      if ('error' in jsonData) {
        alert(jsonData['error']);
        modalRef.close(); // モーダルダイアログを消す
        return;
      }

      jsonData['uid'] = user.uid;
      jsonData['production'] = environment.production;

      this.ResultData.clear(); // 解析結果情報をクリア

      this.post_compress(jsonData, modalRef);

    });

  }

  private post_compress(jsonData: {}, modalRef: NgbModalRef) {

    const url = environment.calcURL; // 'https://asia-northeast1-the-structural-engine.cloudfunctions.net/frameWeb-2';

    // json string にする
    const json = JSON.stringify(jsonData, null, 0);
    console.log(json);
    // pako を使ってgzip圧縮する
    const compressed = pako.gzip(json);
    //btoa() を使ってBase64エンコードする
    const base64Encoded = btoa(compressed);

    this.http.post(url, base64Encoded, {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        'Content-Encoding': 'gzip,base64'
      }),
      responseType: 'text'
    }).subscribe(
      response => {
        // 通信成功時の処理（成功コールバック）
        console.log('通信成功!!');
        try {
          if ( response.includes('error')){
            throw response;
          }
          // Decode base64 (convert ascii to binary)
          const strData = atob(response);
          // Convert binary string to character-number array
          const charData = strData.split('').map(function (x) { return x.charCodeAt(0); });
          // Turn number array into byte-array
          const binData = new Uint8Array(charData);
          // Pako magic
          const json = pako.ungzip(binData, { to: 'string' });

          const jsonData = JSON.parse(json);
          // サーバーのレスポンスを集計する
          console.log(jsonData);
          if ( 'error' in jsonData){
            throw jsonData.error;
          }

          // ポイントの処理
          const _jsonData = {};
          for(const key of Object.keys(jsonData)){
            if((typeof jsonData[key]).toLowerCase() === 'number'){
              this.user[key] = jsonData[key];
            } else {
              _jsonData[key] = jsonData[key];
            }
          }

          // テスト ---------------------------------------------
          // this.saveResult(json);
          // --------------------------------------------- テスト*/

          // 解析結果を集計する
          this.ResultData.loadResultData(_jsonData);
          this.ResultData.isCalculated = true;
        } catch (e) {
          alert(e);
        } finally {
          modalRef.close(); // モーダルダイアログを消す
          alert(this.user.deduct_points + 'ポイント消費しました。本日の使用量は、'+  this.user.new_points + 'です.');
        }
      },
      error => {

        let messege: string = '通信 ' + error.statusText;
        if ('_body' in error) {
          messege += '\n' + error._body;
        }
        alert(messege);
        console.error(error);
        modalRef.close();
      }
    );
  }


  // ピックアップファイル出力
  public pickup(): void {

    let pickupJson: string;
    let ext: string;
    if(this.helper.dimension === 2){
      pickupJson = this.ResultData.GetPicUpText2D();
      ext = '.pik';
    } else {
      pickupJson = this.ResultData.GetPicUpText();
      ext = '.csv';
    }
    const blob = new window.Blob([pickupJson], { type: 'text/plain' });
    let filename: string = 'frameWebForJS' + ext;
    if (this.fileName.length > 0) {
      filename = this.fileName.split('.').slice(0, -1).join('.')
      filename += ext;
    }

    FileSaver.saveAs(blob, filename);
  }

  // ログイン関係
  logIn(): void {
    this.app.dialogClose(); // 現在表示中の画面を閉じる
    this.modalService.open(LoginDialogComponent)
    .result.then((result) => {

    });
  }

  logOut(): void {
    this.auth.signOut();
  }

  //　印刷フロート画面用
  public dialogClose(): void {
    this.helper.isContentsDailogShow = false;
  }

  public contentsDailogShow(id): void {
    this.deactiveButtons();
    document.getElementById(id).classList.add('active');
    this.helper.isContentsDailogShow = true;
  }

  // アクティブになっているボタンを全て非アクティブにする
  deactiveButtons() {
    for (let i = 0; i <= 13; i++) {
      const data = document.getElementById(i + '');
      if (data != null) {
        if (data.classList.contains('active')) {
          data.classList.remove('active');
        }
      }
    }
  }

  public setDimension(dim:number = null){
    if(dim === null) {
      if(this.helper.dimension === 2) {
        this.helper.dimension = 3;
      } else{
        this.helper.dimension = 2;
      }
    }else{
      this.helper.dimension = dim;
      const g23D: any = document.getElementById("toggle--switch");
      g23D.checked = (this.helper.dimension === 3);
    }
    this.app.dialogClose(); // 現在表示中の画面を閉じる
    this.scene.createCamera();    // three.js のカメラを変更する
    this.scene.addControls();
    this.scene.render();
  }

  // テスト ---------------------------------------------
  private saveResult(text: string): void {
    const blob = new window.Blob([text], { type: 'text/plain' });
    FileSaver.saveAs(blob, 'frameWebResult.json');
  }

  //解析結果ファイルを開く
  resultopen(evt) {
    const modalRef = this.modalService.open(WaitDialogComponent);

    const file = evt.target.files[0];
    this.fileName = file.name;
    evt.target.value = '';

    this.fileToText(file)
      .then(text => {

        this.app.dialogClose(); // 現在表示中の画面を閉じる
        this.ResultData.clear();
        const jsonData = JSON.parse(text);

        this.ResultData.loadResultData(jsonData);
        modalRef.close();

      })
      .catch(err => {
        alert(err);
        modalRef.close();
      });
  }

  public goToLink(){
    window.open("https://liberating-rodent-f3f.notion.site/4e2148bfe8704aa6b6dbc619d539c8c3?v=76a73b4693404e64a56ab8f8ff538e4d", "_blank");
  }

}

