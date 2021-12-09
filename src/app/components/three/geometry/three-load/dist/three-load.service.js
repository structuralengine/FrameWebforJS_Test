"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
exports.__esModule = true;
exports.ThreeLoadService = void 0;
var core_1 = require("@angular/core");
var THREE = require("three");
var three_load_text_1 = require("./three-load-text");
var three_load_point_1 = require("./three-load-point");
var three_load_distribute_1 = require("./three-load-distribute");
var three_load_axial_1 = require("./three-load-axial");
var three_load_torsion_1 = require("./three-load-torsion");
var three_load_moment_1 = require("./three-load-moment");
var three_load_temperature_1 = require("./three-load-temperature");
var three_load_member_point_1 = require("./three-load-member-point");
var three_load_member_moment_1 = require("./three-load-member-moment");
var ThreeLoadService = /** @class */ (function () {
    // 初期化
    function ThreeLoadService(scene, helper, nodeThree, node, member, load, three_member) {
        var _this = this;
        this.scene = scene;
        this.helper = helper;
        this.nodeThree = nodeThree;
        this.node = node;
        this.member = member;
        this.load = load;
        this.three_member = three_member;
        this.isVisible = { object: false, gui: false };
        // 荷重の雛形をあらかじめ生成する
        this.loadEditor = {};
        // フォントをロード
        var loader = new THREE.FontLoader();
        loader.load("./assets/fonts/helvetiker_regular.typeface.json", function (font) {
            var text = new three_load_text_1.ThreeLoadText(font);
            _this.loadEditor[three_load_axial_1.ThreeLoadAxial.id] = new three_load_axial_1.ThreeLoadAxial(text); // 軸方向荷重のテンプレート
            _this.loadEditor[three_load_distribute_1.ThreeLoadDistribute.id] = new three_load_distribute_1.ThreeLoadDistribute(text); // 分布荷重のテンプレート
            _this.loadEditor[three_load_member_point_1.ThreeLoadMemberPoint.id] = new three_load_member_point_1.ThreeLoadMemberPoint(text); // 部材の途中にある節点荷重のテンプレート
            _this.loadEditor[three_load_point_1.ThreeLoadPoint.id] = new three_load_point_1.ThreeLoadPoint(text); // 節点荷重のテンプレート
            _this.loadEditor[three_load_moment_1.ThreeLoadMoment.id] = new three_load_moment_1.ThreeLoadMoment(text); // 節点モーメントのテンプレート
            _this.loadEditor[three_load_member_moment_1.ThreeLoadMemberMoment.id] = new three_load_member_moment_1.ThreeLoadMemberMoment(text); // 部材の途中にある節点モーメントのテンプレート
            _this.loadEditor[three_load_temperature_1.ThreeLoadTemperature.id] = new three_load_temperature_1.ThreeLoadTemperature(text); // 温度荷重のテンプレート
            _this.loadEditor[three_load_torsion_1.ThreeLoadTorsion.id] = new three_load_torsion_1.ThreeLoadTorsion(text); // ねじり分布荷重のテンプレート
        });
        // 全てのケースの荷重情報
        this.AllCaseLoadList = {};
        this.currentIndex = null;
        this.currentRow = null;
        this.currentCol = null;
        // 節点、部材データ
        this.nodeData = null;
        this.memberData = null;
        this.newNodeData = null;
        this.newMemberData = null;
        // gui
        this.LoadScale = 100;
        this.params = {
            LoadScale: this.LoadScale
        };
        this.gui = {};
        // 選択中のオブジェクト
        this.selecteddObject = null;
        // アニメーションのオブジェクト
        this.animationObject = null;
    }
    // 荷重を再設定する
    ThreeLoadService.prototype.ClearData = function () {
        // 荷重を全部削除する
        for (var _i = 0, _a = Object.keys(this.AllCaseLoadList); _i < _a.length; _i++) {
            var id = _a[_i];
            this.removeCase(id);
        }
        this.AllCaseLoadList = {};
        this.currentIndex = null;
        // 節点、部材データ
        this.nodeData = null;
        this.memberData = null;
        this.newNodeData = null;
        this.newMemberData = null;
        // 選択中のオブジェクト
        this.selecteddObject = null;
    };
    // ファイルを読み込むなど、りセットする
    ThreeLoadService.prototype.ResetData = function () {
        this.ClearData();
        // ファイルを開いたときの処理
        // 荷重を作成する
        var loadData = this.load.getLoadJson(0);
        for (var _i = 0, _a = Object.keys(loadData); _i < _a.length; _i++) {
            var id = _a[_i];
            this.addCase(id);
        }
        // データを入手
        this.nodeData = this.node.getNodeJson(0);
        this.memberData = this.member.getMemberJson(0);
        // 格点データ
        this.newNodeData = null;
        if (Object.keys(this.nodeData).length <= 0) {
            return; // 格点がなければ 以降の処理は行わない
        }
        // 節点荷重データを入手
        // const nodeLoadData = this.load.getNodeLoadJson(0);
        var nodeLoadData = {};
        // 要素荷重データを入手
        // const memberLoadData = this.load.getMemberLoadJson(0);
        var memberLoadData = {};
        for (var _b = 0, _c = Object.keys(loadData); _b < _c.length; _b++) {
            var id = _c[_b];
            var tmp = loadData[id];
            if ('load_member' in tmp && tmp.load_member.length > 0) {
                memberLoadData[id] = tmp.load_member;
            }
            if ('load_node' in tmp && tmp.load_node.length > 0) {
                nodeLoadData[id] = tmp.load_node;
            }
        }
        // 荷重図を非表示のまま作成する
        for (var _d = 0, _e = Object.keys(this.AllCaseLoadList); _d < _e.length; _d++) {
            var id = _e[_d];
            var LoadList = this.AllCaseLoadList[id];
            this.currentIndex = id; // カレントデータをセット
            // 節点荷重 --------------------------------------------
            if (id in nodeLoadData) {
                var targetNodeLoad = nodeLoadData[id];
                // 節点荷重の最大値を調べる
                this.setMaxNodeLoad(targetNodeLoad);
                // 節点荷重を作成する
                this.createPointLoad(targetNodeLoad, this.nodeData, LoadList.ThreeObject, LoadList.pointLoadList);
            }
            // 要素荷重 --------------------------------------------
            // 要素データを入手
            this.newMemberData = null;
            if (Object.keys(this.memberData).length > 0) {
                if (id in memberLoadData) {
                    var targetMemberLoad = memberLoadData[id];
                    // 要素荷重の最大値を調べる
                    this.setMaxMemberLoad(targetMemberLoad);
                    // 要素荷重を作成する
                    this.createMemberLoad(targetMemberLoad, this.nodeData, this.memberData, LoadList.ThreeObject, LoadList.memberLoadList);
                }
            }
            // 重なりを調整する
            this.setOffset(id);
            // 重なりを調整する
            this.onResize(id);
        }
        this.currentIndex = '-1';
    };
    // 表示ケースを変更する
    ThreeLoadService.prototype.changeCase = function (changeCase) {
        if (!this.visibleCaseChange(changeCase)) {
            return;
        }
        // 連行荷重が完成したら 以下のアニメーションを有効にする
        // 荷重名称を調べる
        var symbol = this.load.getLoadName(changeCase, 'symbol');
        if (symbol === "LL") {
            var LL_list = this.load.getMemberLoadJson(0, this.currentIndex);
            var LL_keys = Object.keys(LL_list);
            if (LL_keys.length > 0) {
                var keys = LL_keys.map(function (value) {
                    return Number(value);
                });
                this.animation(keys);
                return;
            }
        }
        if (this.animationObject !== null) {
            cancelAnimationFrame(this.animationObject);
            this.animationObject = null;
        }
        this.scene.render();
    };
    ThreeLoadService.prototype.visibleCaseChange = function (changeCase) {
        var id = changeCase.toString();
        if (this.currentIndex === id) {
            // 同じなら何もしない
            return false;
        }
        if (changeCase < 1) {
            // 非表示にして終わる
            for (var _i = 0, _a = Object.keys(this.AllCaseLoadList); _i < _a.length; _i++) {
                var key = _a[_i];
                var targetLoad = this.AllCaseLoadList[key];
                var ThreeObject = targetLoad.ThreeObject;
                ThreeObject.visible = false;
            }
            this.scene.render();
            this.currentIndex = id;
            return false;
        }
        // 初めての荷重ケースが呼び出された場合
        if (!(id in this.AllCaseLoadList)) {
            this.addCase(id);
        }
        // 荷重の表示非表示を切り替える
        for (var _b = 0, _c = Object.keys(this.AllCaseLoadList); _b < _c.length; _b++) {
            var key = _c[_b];
            var targetLoad = this.AllCaseLoadList[key];
            var ThreeObject = targetLoad.ThreeObject;
            ThreeObject.visible = key === id ? true : false;
        }
        // カレントデータをセット
        this.currentIndex = id;
        return true;
    };
    // 連行移動荷重のアニメーションを開始する
    ThreeLoadService.prototype.animation = function (keys, k) {
        var _this = this;
        if (k === void 0) { k = 0; }
        var i = Math.floor(k / 10); // 10フレームに１回位置を更新する
        var j = (i < keys.length) ? k + 1 : 0; // 次のフレーム
        // 次のフレームを要求
        this.animationObject = requestAnimationFrame(function () {
            _this.animation(keys, j);
        });
        var g = keys[i];
        if (this.visibleCaseChange(g)) {
            // レンダリングする
            this.scene.render();
        }
    };
    // ケースを追加する
    ThreeLoadService.prototype.addCase = function (id) {
        var ThreeObject = new THREE.Object3D();
        ThreeObject.name = id;
        ThreeObject.visible = false; // ファイルを読んだ時点では、全ケース非表示
        this.AllCaseLoadList[id] = {
            ThreeObject: ThreeObject,
            pointLoadList: {},
            memberLoadList: {},
            pMax: 0,
            mMax: 0,
            wMax: 0,
            rMax: 0,
            qMax: 0 // 最も大きい軸方向分布荷重
        };
        this.scene.add(ThreeObject); // シーンに追加
    };
    //シートの選択行が指すオブジェクトをハイライトする
    ThreeLoadService.prototype.selectChange = function (index_row, index_column) {
        var id = this.currentIndex;
        if (index_row > 0 && this.currentRow === index_row) {
            if (this.currentCol === index_column) {
                //選択行の変更がないとき，何もしない
                return;
            }
        }
        if (this.AllCaseLoadList[id] === undefined)
            return;
        var ThreeObject = this.AllCaseLoadList[id].ThreeObject;
        for (var _i = 0, _a = ThreeObject.children; _i < _a.length; _i++) {
            var child = _a[_i];
            var item = child;
            if (!('editor' in item))
                continue;
            var editor = item['editor'];
            var column = "";
            if (index_column > 7) {
                var keys = (this.helper.dimension === 3) ?
                    ['', 'tx', 'ty', 'tz', 'rx', 'ry', 'rz'] : ['', 'tx', 'ty', 'rz'];
                column = keys[index_column - 8];
            }
            var key = editor.id + '-' + index_row.toString() + '-' + column;
            if (index_column < 8) {
                if (editor.id !== "PointLoad" && editor.id !== "MomentLoad") {
                    if (item.name.indexOf(key) !== -1) {
                        editor.setColor(item, "select");
                    }
                    else {
                        editor.setColor(item, "clear");
                    }
                }
                else {
                    editor.setColor(item, "clear");
                }
            }
            else {
                if (editor.id === "PointLoad" || editor.id === "MomentLoad") {
                    if (item.name.indexOf(key) !== -1) {
                        editor.setColor(item, "select");
                    }
                    else {
                        editor.setColor(item, "clear");
                    }
                }
                else {
                    editor.setColor(item, "clear");
                }
            }
        }
        this.currentRow = index_row;
        this.currentCol = index_column;
        this.scene.render();
    };
    // ケースの荷重図を消去する
    ThreeLoadService.prototype.removeCase = function (id) {
        if (!(id in this.AllCaseLoadList)) {
            return;
        }
        var data = this.AllCaseLoadList[id];
        this.removeMemberLoadList(data);
        this.removePointLoadList(data);
        var ThreeObject = data.ThreeObject;
        this.scene.remove(ThreeObject);
        delete this.AllCaseLoadList[id];
        this.scene.render();
    };
    // 節点の入力が変更された場合 新しい入力データを保持しておく
    ThreeLoadService.prototype.changeNode = function (jsonData) {
        this.newNodeData = jsonData;
    };
    // 要素の入力が変更された場合 新しい入力データを保持しておく
    ThreeLoadService.prototype.changeMember = function (jsonData) {
        this.newMemberData = jsonData;
    };
    // 節点や要素が変更された部分を描きなおす
    ThreeLoadService.prototype.reDrawNodeMember = function () {
        if (this.newNodeData === null && this.newMemberData === null) {
            return;
        }
        // 格点の変わった部分を探す
        var changeNodeList = {};
        if (this.nodeData !== null) {
            if (this.newNodeData !== null) {
                for (var _i = 0, _a = Object.keys(this.nodeData); _i < _a.length; _i++) {
                    var key = _a[_i];
                    if (!(key in this.newNodeData)) {
                        // 古い情報にあって新しい情報にない節点
                        changeNodeList[key] = 'delete';
                    }
                }
                for (var _b = 0, _c = Object.keys(this.newNodeData); _b < _c.length; _b++) {
                    var key = _c[_b];
                    if (!(key in this.nodeData)) {
                        // 新しい情報にあって古い情報にない節点
                        changeNodeList[key] = 'add';
                        continue;
                    }
                    var oldNode = this.nodeData[key];
                    var newNode = this.newNodeData[key];
                    if (oldNode.x !== newNode.x || oldNode.y !== newNode.y || oldNode.z !== newNode.z) {
                        changeNodeList[key] = 'change';
                    }
                }
            }
        }
        var changeMemberList = {};
        if (this.memberData !== null) {
            // 部材の変わった部分を探す
            if (this.newMemberData !== null) {
                for (var _d = 0, _e = Object.keys(this.memberData); _d < _e.length; _d++) {
                    var key = _e[_d];
                    if (!(key in this.newMemberData)) {
                        // 古い情報にあって新しい情報にない節点
                        changeMemberList[key] = 'delete';
                    }
                }
                for (var _f = 0, _g = Object.keys(this.newMemberData); _f < _g.length; _f++) {
                    var key = _g[_f];
                    if (!(key in this.memberData)) {
                        // 新しい情報にあって古い情報にない節点
                        changeMemberList[key] = 'add';
                        continue;
                    }
                    var oldMember = this.memberData[key];
                    var newMember = this.newMemberData[key];
                    if (oldMember.ni !== newMember.ni ||
                        oldMember.nj !== newMember.nj) {
                        changeMemberList[key] = 'change';
                    }
                }
            }
        }
        // 格点の変更によって影響のある部材を特定する
        var targetMemberData = (this.newMemberData !== null) ? this.newMemberData : this.memberData;
        if (targetMemberData !== null) {
            for (var _h = 0, _j = Object.keys(targetMemberData); _h < _j.length; _h++) {
                var key = _j[_h];
                var newMember = targetMemberData[key];
                if (newMember.ni in changeNodeList || newMember.nj in changeNodeList) {
                    changeMemberList[key] = 'node change';
                }
            }
        }
        // 荷重を変更する
        var oldIndex = this.currentIndex;
        this.nodeData = (this.newNodeData !== null) ? this.newNodeData : this.nodeData;
        this.memberData = (this.newMemberData !== null) ? this.newMemberData : this.memberData;
        // 荷重データを入手
        var nodeLoadData = this.load.getNodeLoadJson(0);
        var memberLoadData = this.load.getMemberLoadJson(0);
        // 荷重を修正
        for (var _k = 0, _l = Object.keys(this.AllCaseLoadList); _k < _l.length; _k++) {
            var id = _l[_k];
            this.currentIndex = id;
            var editFlg = false;
            if (this.currentIndex in nodeLoadData) {
                for (var _m = 0, _o = nodeLoadData[this.currentIndex]; _m < _o.length; _m++) {
                    var load = _o[_m];
                    if (load.n.toString() in changeNodeList)
                        this.changeNodeLode(load.row, nodeLoadData);
                    editFlg = true;
                }
            }
            if (this.currentIndex in memberLoadData) {
                for (var _p = 0, _q = memberLoadData[this.currentIndex]; _p < _q.length; _p++) {
                    var load = _q[_p];
                    if (load.m.toString() in changeMemberList) {
                        this.changeMemberLode(load.row, memberLoadData);
                        editFlg = true;
                    }
                }
            }
            if (editFlg === true) {
                this.setOffset();
                this.onResize();
            }
        }
        this.newNodeData = null;
        this.newMemberData = null;
        this.currentIndex = oldIndex;
    };
    // 荷重の入力が変更された場合
    ThreeLoadService.prototype.changeData = function (row) {
        // データになカレントデータがなければ
        if (!(this.currentIndex in this.load.load)) {
            this.removeCase(this.currentIndex);
            return;
        }
        // 格点データを入手
        if (this.nodeData === null) {
            return; // 格点がなければ 以降の処理は行わない
        }
        if (Object.keys(this.nodeData).length <= 0) {
            return; // 格点がなければ 以降の処理は行わない
        }
        // 節点荷重データを入手
        var nodeLoadData = this.load.getNodeLoadJson(0, this.currentIndex);
        // 節点荷重を変更
        this.changeNodeLode(row, nodeLoadData);
        // 要素データを入手
        if (this.memberData === null) {
            return; //要素がなければ 以降の処理は行わない
        }
        if (Object.keys(this.memberData).length <= 0) {
            return; //要素がなければ 以降の処理は行わない
        }
        var tempMemberLoad = this.load.getMemberLoadJson(null, this.currentIndex); // 簡易版
        if (this.currentIndex in tempMemberLoad) {
            // 要素荷重データを入手
            var memberLoadData = this.load.getMemberLoadJson(0, this.currentIndex); //計算に使う版：直後に同じ関数を呼んでいる
            // 要素荷重を変更
            this.changeMemberLode(row, memberLoadData); //実際に荷重として使っているのは　memberLoadData こっち
            row++;
            // 対象行以下の行について
            var memberLoads = tempMemberLoad[this.currentIndex];
            var i = memberLoads.findIndex(function (e) { return e.row === row; });
            while (i >= 0) {
                var targetMemberLoad = memberLoads[i];
                if (targetMemberLoad.L1 == null) {
                    break;
                }
                if (!targetMemberLoad.L1.includes('-')) {
                    break;
                }
                // 要素荷重を変更
                this.changeMemberLode(targetMemberLoad.row, memberLoadData); //実際に荷重として使っているのは　memberLoadData こっち
                row++;
                i = memberLoads.findIndex(function (e) { return e.row === row; });
            }
        }
        // 重なりを調整する
        this.setOffset();
        // サイズを調整する
        this.onResize();
        // レンダリング
        this.scene.render();
        // 表示フラグを ON にする
        this.isVisible.object = true;
    };
    // 節点荷重を変更
    ThreeLoadService.prototype.changeNodeLode = function (row, nodeLoadData) {
        var LoadList = this.AllCaseLoadList[this.currentIndex];
        if (this.currentIndex in nodeLoadData) {
            // 節点荷重の最大値を調べる
            var tempNodeLoad = nodeLoadData[this.currentIndex];
            this.setMaxNodeLoad(tempNodeLoad);
            // 対象行(row) に入力されている部材番号を調べる
            var targetNodeLoad = tempNodeLoad.filter(function (load) { return load.row === row; });
            this.removePointLoadList(LoadList, row);
            this.createPointLoad(targetNodeLoad, this.nodeData, LoadList.ThreeObject, LoadList.pointLoadList);
        }
        else {
            // ケースが存在しなかった
            this.removePointLoadList(LoadList);
            for (var _i = 0, _a = Object.keys(LoadList.pointLoadList); _i < _a.length; _i++) {
                var key = _a[_i];
                LoadList.pointLoadList[key] = { tx: [], ty: [], tz: [], rx: [], ry: [], rz: [] };
            }
        }
    };
    // 節点荷重を削除する
    ThreeLoadService.prototype.removePointLoadList = function (LoadList, row) {
        if (row === void 0) { row = null; }
        for (var _i = 0, _a = Object.keys(LoadList.pointLoadList); _i < _a.length; _i++) { //格点node
            var key = _a[_i];
            var list = LoadList.pointLoadList[key];
            for (var _b = 0, _c = ["tx", "ty", "tz", "rx", "ry", "rz"]; _b < _c.length; _b++) {
                var key2 = _c[_b];
                for (var i = list[key2].length - 1; i >= 0; i--) {
                    var item = list[key2][i];
                    if (row !== null && item.row !== row) {
                        continue;
                    }
                    LoadList.ThreeObject.remove(item);
                    list[key2].splice(i, 1);
                }
            }
        }
    };
    // 要素荷重を変更
    ThreeLoadService.prototype.changeMemberLode = function (row, memberLoadData) {
        var LoadList = this.AllCaseLoadList[this.currentIndex];
        if (this.currentIndex in memberLoadData) {
            // 対象業(row) に入力されている部材番号を調べる
            var tempMemberLoad = memberLoadData[this.currentIndex];
            // 要素荷重の最大値を調べる
            this.setMaxMemberLoad(tempMemberLoad);
            // 対象行(row) に入力されている部材番号を調べる
            var targetMemberLoad = tempMemberLoad.filter(function (load) { return load.row === row; });
            // 同じ行にあった荷重を一旦削除
            this.removeMemberLoadList(LoadList, row);
            this.createMemberLoad(targetMemberLoad, this.nodeData, this.memberData, LoadList.ThreeObject, LoadList.memberLoadList);
        }
        else {
            // ケースが存在しなかった
            this.removeMemberLoadList(LoadList);
            for (var _i = 0, _a = Object.keys(LoadList.memberLoadList); _i < _a.length; _i++) {
                var key = _a[_i];
                LoadList.memberLoadList[key] = { gx: [], gy: [], gz: [], x: [], y: [], z: [], t: [], r: [] };
            }
        }
    };
    // 要素荷重を削除する
    ThreeLoadService.prototype.removeMemberLoadList = function (LoadList, row) {
        if (row === void 0) { row = null; }
        for (var _i = 0, _a = Object.keys(LoadList.memberLoadList); _i < _a.length; _i++) {
            var key = _a[_i];
            var list = LoadList.memberLoadList[key];
            for (var _b = 0, _c = ["gx", "gy", "gz", "x", "y", "z", "t", "r"]; _b < _c.length; _b++) {
                var key2 = _c[_b];
                for (var i = list[key2].length - 1; i >= 0; i--) {
                    var item = list[key2][i];
                    if (row !== null && item.row !== row) {
                        continue;
                    }
                    LoadList.ThreeObject.remove(item);
                    list[key2].splice(i, 1);
                }
            }
        }
    };
    // 節点荷重の矢印を描く
    ThreeLoadService.prototype.createPointLoad = function (targetNodeLoad, nodeData, ThreeObject, pointLoadList) {
        if (targetNodeLoad === undefined) {
            return;
        }
        // 集中荷重の矢印をシーンに追加する
        for (var _i = 0, targetNodeLoad_1 = targetNodeLoad; _i < targetNodeLoad_1.length; _i++) {
            var load = targetNodeLoad_1[_i];
            var n = load.n.toString();
            // 節点座標 を 取得する
            if (!(n in nodeData)) {
                continue;
            }
            var node = nodeData[n];
            // リストに登録する
            var target = n in pointLoadList ? pointLoadList[n]
                : { tx: [], ty: [], tz: [], rx: [], ry: [], rz: [] };
            // 集中荷重 ---------------------------------
            for (var _a = 0, _b = ["tx", "ty", "tz"]; _a < _b.length; _a++) {
                var key = _b[_a];
                if (!(key in load))
                    continue;
                if (load[key] === 0)
                    continue;
                var value = load[key];
                // 荷重を編集する
                // 長さを決める
                // scale = 1 の時 長さlength = maxLengthとなる
                var arrow = this.loadEditor[three_load_point_1.ThreeLoadPoint.id].create(node, 0, value, 1, key, load.row);
                // リストに登録する
                arrow["row"] = load.row;
                target[key].push(arrow);
                ThreeObject.add(arrow);
            }
            // 強制変位(仮：集中荷重と同じとしている) ---------------------------------
            for (var _c = 0, _d = ["x", "y", "z"]; _c < _d.length; _c++) {
                var k = _d[_c];
                var key1 = 'd' + k;
                if (!(key1 in load))
                    continue;
                if (load[key1] === 0)
                    continue;
                var value = load[key1] * 1000;
                var key = 't' + k;
                // 荷重を編集する
                // 長さを決める
                // scale = 1 の時 長さlength = maxLengthとなる
                var arrow = this.loadEditor[three_load_point_1.ThreeLoadPoint.id].create(node, 0, value, 1, key, load.row);
                // リストに登録する
                arrow["row"] = load.row;
                target[key].push(arrow);
                ThreeObject.add(arrow);
            }
            // 曲げモーメント荷重 -------------------------
            for (var _e = 0, _f = ["rx", "ry", "rz"]; _e < _f.length; _e++) {
                var key = _f[_e];
                if (!(key in load))
                    continue;
                if (load[key] === 0)
                    continue;
                var value = load[key];
                // 配置位置（その他の荷重とぶつからない位置）を決定する
                var offset = 0;
                for (var _g = 0, _h = target[key]; _g < _h.length; _g++) {
                    var a = _h[_g];
                    if (a.visible === false) {
                        continue;
                    }
                    offset += 0.1;
                }
                // 荷重を編集する
                // 長さを決める
                // scale = 1 の時 直径Radius = maxLengthとなる
                var scale = 1; //Math.abs(value) * 0.1;
                var Radius = scale;
                var arrow = this.loadEditor[three_load_moment_1.ThreeLoadMoment.id].create(node, offset, value, Radius, key, load.row);
                // リストに登録する
                arrow["row"] = load.row;
                target[key].push(arrow);
                ThreeObject.add(arrow);
            }
            // 強制変位(仮：集中荷重と同じとしている) ---------------------------------
            for (var _j = 0, _k = ["x", "y", "z"]; _j < _k.length; _j++) {
                var k = _k[_j];
                var key1 = 'a' + k;
                if (!(key1 in load))
                    continue;
                if (load[key1] === 0)
                    continue;
                var value = load[key1] * 1000;
                var key = 'r' + k;
                // 配置位置（その他の荷重とぶつからない位置）を決定する
                var offset = 0;
                for (var _l = 0, _m = target[key]; _l < _m.length; _l++) {
                    var a = _m[_l];
                    if (a.visible === false) {
                        continue;
                    }
                    offset += 0.1;
                }
                // 荷重を編集する
                // 長さを決める
                // scale = 1 の時 直径Radius = maxLengthとなる
                var scale = 1; //Math.abs(value) * 0.1;
                var Radius = scale;
                var arrow = this.loadEditor[three_load_moment_1.ThreeLoadMoment.id].create(node, offset, value, Radius, key, load.row);
                // リストに登録する
                arrow["row"] = load.row;
                target[key].push(arrow);
                ThreeObject.add(arrow);
            }
            pointLoadList[n] = target;
        }
    };
    // 節点荷重の最大値を調べる
    ThreeLoadService.prototype.setMaxNodeLoad = function (targetNodeLoad) {
        if (targetNodeLoad === void 0) { targetNodeLoad = null; }
        var LoadList = this.AllCaseLoadList[this.currentIndex];
        LoadList.pMax = 0; // 最も大きい集中荷重値
        LoadList.mMax = 0; // 最も大きいモーメント
        if (targetNodeLoad === null) {
            var nodeLoadData = this.load.getNodeLoadJson(0, this.currentIndex);
            if (this.currentIndex in nodeLoadData) {
                targetNodeLoad = nodeLoadData[this.currentIndex];
            }
            else {
                return;
            }
        }
        targetNodeLoad.forEach(function (load) {
            for (var _i = 0, _a = ['tx', 'ty', 'tz']; _i < _a.length; _i++) {
                var k = _a[_i];
                if (k in load) {
                    LoadList.pMax = Math.max(LoadList.pMax, Math.abs(load[k]));
                }
            }
            for (var _b = 0, _c = ['dx', 'dy', 'dz']; _b < _c.length; _b++) {
                var k = _c[_b];
                if (k in load) {
                    LoadList.pMax = Math.max(LoadList.pMax, Math.abs(load[k] * 1000));
                }
            }
        });
        targetNodeLoad.forEach(function (load) {
            for (var _i = 0, _a = ['rx', 'ry', 'rz']; _i < _a.length; _i++) {
                var k = _a[_i];
                if (k in load) {
                    LoadList.mMax = Math.max(LoadList.mMax, Math.abs(load[k]));
                }
            }
            for (var _b = 0, _c = ['ax', 'ay', 'az']; _b < _c.length; _b++) {
                var k = _c[_b];
                if (k in load) {
                    LoadList.mMax = Math.max(LoadList.mMax, Math.abs(load[k] * 1000));
                }
            }
        });
    };
    // 要素荷重の最大値を調べる
    ThreeLoadService.prototype.setMaxMemberLoad = function (targetMemberLoad) {
        if (targetMemberLoad === void 0) { targetMemberLoad = null; }
        // スケールを決定する 最大の荷重を 1とする
        var LoadList = this.AllCaseLoadList[this.currentIndex];
        LoadList.wMax = 0;
        LoadList.rMax = 0;
        LoadList.qMax = 0;
        if (targetMemberLoad === null) {
            var memberLoadData = this.load.getMemberLoadJson(0, this.currentIndex);
            if (this.currentIndex in memberLoadData) {
                targetMemberLoad = memberLoadData[this.currentIndex];
            }
            else {
                return;
            }
        }
        // 値をスケールの決定に入れると入力を変更する度に全部書き直さなくてはならない
        for (var _i = 0, targetMemberLoad_1 = targetMemberLoad; _i < targetMemberLoad_1.length; _i++) {
            var load = targetMemberLoad_1[_i];
            var value = Math.max(Math.abs(load.P1), Math.abs(load.P2));
            var direction = load.direction.trim().toLowerCase();
            if (load.mark === 2) {
                if (direction === 'r') {
                    LoadList.rMax = Math.max(LoadList.rMax, value);
                }
                else if (direction === 'x') {
                    LoadList.qMax = Math.max(LoadList.qMax, value);
                }
                else {
                    LoadList.wMax = Math.max(LoadList.wMax, value);
                }
            }
            else if (load.mark === 1) {
                LoadList.pMax = Math.max(LoadList.pMax, value);
            }
            else if (load.mark === 11) {
                LoadList.mMax = Math.max(LoadList.mMax, value);
            }
        }
    };
    // 要素荷重の矢印を描く
    ThreeLoadService.prototype.createMemberLoad = function (memberLoadData, nodeData, memberData, ThreeObject, memberLoadList) {
        if (memberLoadData === undefined) {
            return;
        }
        // memberLoadData情報を書き換える可能性があるので、複製する
        var targetMemberLoad = JSON.parse(JSON.stringify({
            temp: memberLoadData
        })).temp;
        // 分布荷重の矢印をシーンに追加する
        for (var _i = 0, targetMemberLoad_2 = targetMemberLoad; _i < targetMemberLoad_2.length; _i++) {
            var load = targetMemberLoad_2[_i];
            // 部材データを集計する
            if (!(load.m in memberData)) {
                continue;
            }
            var mNo = load.m.toString();
            var m = memberData[mNo];
            // 節点データを集計する
            if (!(m.ni in nodeData && m.nj in nodeData)) {
                continue;
            }
            if (load.P1 === 0 && load.P2 === 0) {
                continue;
            }
            // 部材の座標軸を取得
            var i = nodeData[m.ni];
            var j = nodeData[m.nj];
            var nodei = new THREE.Vector3(i.x, i.y, i.z);
            var nodej = new THREE.Vector3(j.x, j.y, j.z);
            var localAxis = this.three_member.localAxis(i.x, i.y, i.z, j.x, j.y, j.z, m.cg);
            // リストに登録する
            var target = mNo in memberLoadList
                ? memberLoadList[mNo]
                : { localAxis: localAxis, x: [], y: [], z: [], gx: [], gy: [], gz: [], r: [], t: [] };
            // 荷重値と向き -----------------------------------
            var P1 = load.P1;
            var P2 = load.P2;
            var direction = load.direction;
            if (direction === null || direction === undefined) {
                direction = '';
            }
            else {
                direction = direction.trim().toLowerCase();
            }
            if (localAxis.x.y === 0 && localAxis.x.z === 0) {
                //console.log(load.m, m, 'は x軸に平行な部材です')
                if (direction === "gx")
                    direction = "x";
                if (direction === "gy")
                    direction = "y";
                if (direction === "gz")
                    direction = "z";
            }
            else if (localAxis.x.x === 0 && localAxis.x.z === 0) {
                //console.log(load.m, m, 'は y軸に平行な部材です')
                if (direction === "gx") {
                    direction = "y";
                    P1 = -P1;
                    P2 = -P2;
                }
                if (direction === "gy")
                    direction = "x";
                if (direction === "gz")
                    direction = "z";
            }
            else if (localAxis.x.x === 0 && localAxis.x.y === 0) {
                //console.log(load.m, m, 'は z軸に平行な部材です')
                if (direction === "gx") {
                    direction = "y";
                    P1 = -P1;
                    P2 = -P2;
                }
                if (direction === "gy")
                    direction = "z";
                if (direction === "gz") {
                    direction = "x";
                    P1 = -P1;
                    P2 = -P2;
                }
            }
            var arrow = null;
            // 分布荷重 y, z -------------------------------
            // mark=2, direction=x
            if (load.mark === 2) {
                if (direction === "y" || direction === "z" ||
                    direction === "gx" || direction === "gy" || direction === "gz") {
                    // 分布荷重
                    arrow = this.loadEditor[three_load_distribute_1.ThreeLoadDistribute.id].create(nodei, nodej, localAxis, direction, load.L1, load.L2, P1, P2, load.row);
                }
                else if (direction === "r") {
                    // ねじり布荷重
                    arrow = this.loadEditor[three_load_torsion_1.ThreeLoadTorsion.id].create(nodei, nodej, localAxis, direction, load.L1, load.L2, P1, P2, load.row);
                }
                else if (direction === "x") {
                    // 軸方向分布荷重
                    arrow = this.loadEditor[three_load_axial_1.ThreeLoadAxial.id].create(nodei, nodej, localAxis, direction, load.L1, load.L2, P1, P2, load.row);
                }
            }
            else if (load.mark === 9) {
                // 温度荷重
                arrow = this.loadEditor[three_load_temperature_1.ThreeLoadTemperature.id].create(nodei, nodej, localAxis, P1, load.row);
                direction = 't';
            }
            else if (load.mark === 1) {
                // 集中荷重荷重
                if (["x", "y", "z", "gx", "gy", "gz"].includes(direction)) {
                    arrow = this.loadEditor[three_load_member_point_1.ThreeLoadMemberPoint.id].create(nodei, nodej, localAxis, direction, load.L1, load.L2, P1, P2, load.row);
                }
            }
            else if (load.mark === 11) {
                // モーメント荷重
                if (["x", "y", "z", "gx", "gy", "gz"].includes(direction)) {
                    arrow = this.loadEditor[three_load_member_moment_1.ThreeLoadMemberMoment.id].create(nodei, nodej, localAxis, direction, load.L1, load.L2, P1, P2, load.row);
                    direction = 'r';
                }
            }
            // リストに登録する
            if (arrow === null) {
                continue;
            }
            ;
            arrow["row"] = load.row;
            target[direction].push(arrow);
            ThreeObject.add(arrow);
            memberLoadList[mNo] = target;
        }
    };
    // three.service から呼ばれる 表示・非表示の制御
    ThreeLoadService.prototype.visibleChange = function (flag, gui) {
        // 非表示にする
        if (flag === false) {
            this.guiDisable();
            this.changeCase(-1);
            this.isVisible.object = false;
            return;
        }
        // gui の表示を切り替える
        if (gui === true) {
            this.guiEnable();
            //console.log('荷重強度の入力です。')
        }
        else {
            // 黒に戻す
            this.guiDisable();
            // setColor を初期化する
            //console.log('荷重名称の入力です。')
            this.selectChange(-1, 0);
        }
        this.isVisible.gui = gui;
        // すでに表示されていたら変わらない
        if (this.isVisible.object === true) {
            return;
        }
        // 表示する
        this.changeCase(1);
        this.isVisible.object = true;
    };
    // guiを表示する
    ThreeLoadService.prototype.guiEnable = function () {
        var _this = this;
        console.log("three load!", "guiEnable");
        if (!("LoadScale" in this.gui)) {
            var gui_step = 1;
            this.gui["LoadScale"] = this.scene.gui
                .add(this.params, "LoadScale", 0, 400)
                .step(gui_step)
                .onChange(function (value) {
                _this.LoadScale = value;
                _this.onResize();
                _this.scene.render();
            });
        }
    };
    // guiを非表示にする
    ThreeLoadService.prototype.guiDisable = function () {
        console.log("three load!", "guiDisable");
        for (var _i = 0, _a = Object.keys(this.gui); _i < _a.length; _i++) {
            var key = _a[_i];
            this.scene.gui.remove(this.gui[key]);
        }
        this.gui = {};
    };
    ThreeLoadService.prototype.baseScale = function () {
        return this.nodeThree.baseScale * 10;
    };
    // スケールを反映する
    ThreeLoadService.prototype.onResize = function (id) {
        if (id === void 0) { id = this.currentIndex; }
        if (!(id in this.AllCaseLoadList)) {
            return;
        }
        var loadList = this.AllCaseLoadList[id];
        var scale1 = this.LoadScale / 100;
        var scale2 = this.baseScale();
        var scale = scale1 * scale2;
        // 節点荷重のスケールを変更する
        for (var _i = 0, _a = Object.keys(loadList.pointLoadList); _i < _a.length; _i++) {
            var n = _a[_i];
            var dict = loadList.pointLoadList[n];
            for (var _b = 0, _c = Object.keys(dict); _b < _c.length; _b++) {
                var k = _c[_b];
                for (var _d = 0, _e = dict[k]; _d < _e.length; _d++) {
                    var item = _e[_d];
                    var editor = item.editor;
                    editor.setScale(item, scale);
                }
            }
        }
        // 要素荷重のスケールを変更する
        for (var _f = 0, _g = Object.keys(loadList.memberLoadList); _f < _g.length; _f++) {
            var m = _g[_f];
            var dict = loadList.memberLoadList[m];
            for (var _h = 0, _j = ["gx", "gy", "gz", "r", "x", "y", "z"]; _h < _j.length; _h++) {
                var direction = _j[_h];
                for (var _k = 0, _l = dict[direction]; _k < _l.length; _k++) {
                    var item = _l[_k];
                    var editor = item.editor;
                    editor.setScale(item, scale);
                }
            }
        }
        //this.scene.render(); //コメントアウト：レンダリング不要の場合があるため、レンダリングはこの関数の外側で行う
    };
    // 重なりを調整する
    ThreeLoadService.prototype.setOffset = function (id) {
        var _this = this;
        if (id === void 0) { id = this.currentIndex; }
        if (!(id in this.AllCaseLoadList)) {
            return;
        }
        var loadList = this.AllCaseLoadList[id];
        var _loop_1 = function (n) {
            var list = loadList.pointLoadList[n];
            // 集中荷重:ThreeLoadPoint
            ["tx", "ty", "tz"].forEach(function (k) {
                var offset1 = 0;
                var offset2 = 0;
                for (var _i = 0, _a = list[k]; _i < _a.length; _i++) {
                    var item = _a[_i];
                    var editor = item.editor;
                    // 大きさを変更する
                    var scale = 4 * _this.helper.getScale(Math.abs(item.value), loadList.pMax);
                    editor.setSize(item, scale);
                    // オフセットする
                    if (item.value > 0) {
                        editor.setOffset(item, offset1);
                        offset1 -= (scale * 1.0); // オフセット距離に高さを加算する
                    }
                    else {
                        editor.setOffset(item, offset2);
                        offset2 += (scale * 1.0); // オフセット距離に高さを加算する
                    }
                }
            });
            // 集中荷重:ThreeLoadPoint
            ["rx", "ry", "rz"].forEach(function (k) {
                var offset = 0;
                for (var _i = 0, _a = list[k]; _i < _a.length; _i++) {
                    var item = _a[_i];
                    var editor = item.editor;
                    var scale = _this.helper.getScale(item.value, loadList.mMax);
                    editor.setSize(item, scale);
                    editor.setOffset(item, offset);
                    offset += _this.baseScale() * 0.1;
                }
            });
        };
        // 配置位置（その他の荷重とぶつからない位置）を決定する
        for (var _i = 0, _a = Object.keys(loadList.pointLoadList); _i < _a.length; _i++) {
            var n = _a[_i];
            _loop_1(n);
        }
        var _loop_2 = function (m) {
            var list = loadList.memberLoadList[m];
            // ねじりモーメント
            var offset0 = 0;
            for (var _i = 0, _a = list['r']; _i < _a.length; _i++) {
                var item = _a[_i];
                var editor = item.editor;
                if (item.name.indexOf(three_load_member_moment_1.ThreeLoadMemberMoment.id) !== -1) {
                    var scale = this_1.helper.getScale(Math.abs(item.value), loadList.mMax);
                    editor.setSize(item, scale);
                }
                else if (item.name.indexOf(three_load_torsion_1.ThreeLoadTorsion.id) !== -1) {
                    // 大きさを変更する
                    var scale = this_1.helper.getScale(Math.abs(item.value), loadList.rMax);
                    editor.setSize(item, scale);
                    offset0 += (scale * 0.5);
                }
            }
            // 分布荷重（部材軸座標方向）
            ["y", "z"].forEach(function (k) {
                var offset1 = offset0;
                var offset2 = offset0 * (-1);
                var offset3 = offset0;
                var offset4 = offset0 * (-1);
                var Xarea1 = [];
                list[k].forEach(function (item) {
                    var editor = item.editor;
                    // 大きさを変更する
                    if (item.name.indexOf(three_load_distribute_1.ThreeLoadDistribute.id) !== -1) {
                        // 分布荷重
                        var scale = _this.helper.getScale(Math.abs(item.value), loadList.wMax);
                        editor.setSize(item, scale);
                        //以降は当たり判定に用いる部分
                        var vertice_points = [];
                        //当たり判定のエリアを登録
                        var target_geo = item.children[0].children[0].children[0].geometry;
                        var pos_arr = target_geo.attributes.position.array;
                        for (var i = 0; i < pos_arr.length; i += 3) {
                            var scale_1 = _this.helper.getScale(Math.abs(item.value), loadList.wMax);
                            vertice_points.push(pos_arr[i]); // x
                            vertice_points.push(pos_arr[i + 1] * scale_1); // y
                        }
                        if (Xarea1.length === 0) {
                            if (item.value > 0) {
                                editor.setOffset(item, offset3);
                            }
                            else {
                                editor.setOffset(item, offset4);
                            }
                        }
                        all_check: //次のforループの名称 -> breakで使用
                         for (var _i = 0, Xarea1_1 = Xarea1; _i < Xarea1_1.length; _i++) {
                            var hit_points = Xarea1_1[_i];
                            var pre_scale_1 = _this.helper.getScale(Math.abs(hit_points[10]), loadList.wMax);
                            //for (let num2 = 0; num2 < 5; num2++) {
                            //接触判定
                            var judgeX = _this.self_raycaster(vertice_points, hit_points, "x");
                            var judgeY = _this.self_raycaster(vertice_points, hit_points, "y");
                            if (judgeX === "Hit" && (judgeY === "Hit" || judgeY === "Touch")) {
                                // オフセットする
                                if (item.value > 0) {
                                    offset1 += (pre_scale_1 * 1.0); // オフセット距離に高さを加算する
                                    editor.setOffset(item, offset1);
                                    vertice_points[1] += offset1;
                                    vertice_points[3] += offset1;
                                    vertice_points[5] += offset1;
                                    vertice_points[7] += offset1;
                                    vertice_points[9] += offset1;
                                    vertice_points[11] += offset1;
                                    vertice_points[13] += offset1;
                                    vertice_points[15] += offset1;
                                    vertice_points[17] += offset1;
                                }
                                else {
                                    offset2 -= (pre_scale_1 * 1.0); // オフセット距離に高さを加算する
                                    editor.setOffset(item, offset2);
                                    vertice_points[1] += offset2;
                                    vertice_points[3] += offset2;
                                    vertice_points[5] += offset2;
                                    vertice_points[7] += offset2;
                                    vertice_points[9] += offset2;
                                    vertice_points[11] += offset2;
                                    vertice_points[13] += offset2;
                                    vertice_points[15] += offset2;
                                    vertice_points[17] += offset2;
                                }
                            }
                            else if (judgeX === "NotHit" || judgeY === "NotHit") {
                                //オフセットしない
                                if (item.value > 0) {
                                    editor.setOffset(item, offset1);
                                }
                                else {
                                    editor.setOffset(item, offset2);
                                }
                                continue;
                            }
                            else {
                                //現状ケースを確認できていない
                                break all_check;
                            }
                            //}
                        }
                        // ここでprescale分かける？
                        Xarea1.push([vertice_points[0], vertice_points[1],
                            vertice_points[2], vertice_points[3],
                            vertice_points[4], vertice_points[5],
                            vertice_points[8], vertice_points[9],
                            vertice_points[10], vertice_points[11],
                            item.value]); //メッシュの5点の2次元座標と，valueの値を保存する
                        var pre_scale = 1 * Math.abs(item.value) / loadList.wMax;
                        offset3 = offset1 + pre_scale;
                        offset4 = offset2 - pre_scale;
                        offset1 = offset0;
                        offset2 = offset0 * (-1);
                    }
                    else if (item.name.indexOf(three_load_member_point_1.ThreeLoadMemberPoint.id) !== -1) {
                        // 集中荷重
                        var scale = _this.helper.getScale(Math.abs(item.value), loadList.pMax);
                        editor.setSize(item, scale);
                        // オフセットする
                        if (item.value > 0) {
                            editor.setOffset(item, offset3 + offset0);
                            offset3 += (scale * 1.0); // オフセット距離に高さを加算する
                        }
                        else {
                            editor.setOffset(item, offset4 - offset0);
                            offset4 -= (scale * 1.0); // オフセット距離に高さを加算する
                        }
                        offset1 = offset3;
                        offset2 = offset4;
                    }
                });
            });
            // 分布荷重（絶対座標方向）
            ["gx", "gy", "gz"].forEach(function (k) {
                var offset1 = offset0;
                var offset2 = offset0;
                list[k].forEach(function (item) {
                    var editor = item.editor;
                    // 大きさを変更する
                    if (item.name.indexOf(three_load_distribute_1.ThreeLoadDistribute.id) !== -1) {
                        // 分布荷重
                        var scale = _this.helper.getScale(Math.abs(item.value), loadList.wMax);
                        editor.setSize(item, scale);
                        // オフセットする
                        if (item.value > 0) {
                            editor.setGlobalOffset(item, offset1, k);
                            offset1 += (scale * 1.0); // オフセット距離に高さを加算する
                        }
                        else {
                            editor.setGlobalOffset(item, offset2, k);
                            offset2 -= (scale * 1.0); // オフセット距離に高さを加算する
                        }
                    }
                    else if (item.name.indexOf(three_load_member_point_1.ThreeLoadMemberPoint.id) !== -1) {
                        // 集中荷重
                        var scale = _this.helper.getScale(Math.abs(item.value), loadList.pMax);
                        editor.setSize(item, scale);
                        // オフセットする
                        if (item.value > 0) {
                            editor.setGlobalOffset(item, offset1, k);
                            offset1 += (scale * 1.0); // オフセット距離に高さを加算する
                        }
                        else {
                            editor.setGlobalOffset(item, offset2, k);
                            offset2 -= (scale * 1.0); // オフセット距離に高さを加算する
                        }
                    }
                });
            });
            // 部材軸方向荷重
            list['x'].forEach(function (item) {
                var editor = item.editor;
                // 大きさを変更する
                if (item.name.indexOf(three_load_member_point_1.ThreeLoadMemberPoint.id) !== -1) {
                    var scale = _this.helper.getScale(Math.abs(item.value), loadList.pMax);
                    editor.setSize(item, scale);
                }
                else if (item.name.indexOf(three_load_axial_1.ThreeLoadAxial.id) !== -1) {
                    var scale = _this.helper.getScale(Math.abs(item.value), loadList.qMax);
                    editor.setSize(item, scale);
                }
            });
        };
        var this_1 = this;
        // 要素荷重のスケールを変更する
        for (var _b = 0, _c = Object.keys(loadList.memberLoadList); _b < _c.length; _b++) {
            var m = _c[_b];
            _loop_2(m);
        }
    };
    // 当たり判定を行う
    ThreeLoadService.prototype.self_raycaster = function (points, area, pattern) {
        var d = 0.001; //当たり判定の緩和値
        // 接触判定->結果はjudgeで返す
        var judge = "";
        // newLoadは追加面。oldLoadは既存面。判定緩和で追加面を小さくする。全て矩形とみなす
        var newLoad = { leftX: points[2], rightX: points[8],
            topY: Math.max(points[1], points[3], points[9], points[17]),
            bottomY: Math.min(points[1], points[3], points[9], points[17]) };
        var oldLoad = { leftX: area[2], rightX: area[6],
            topY: Math.max(area[1], area[3], area[7], area[9]),
            bottomY: Math.min(area[1], area[3], area[7], area[9]) };
        // pointsは追加面、areaは既存面を示す。
        switch (pattern) {
            case ('x'):
                // 追加面のサイズを調整し、当たり判定を緩和する。
                if (oldLoad.leftX < newLoad.leftX - d && newLoad.leftX + d < oldLoad.rightX) {
                    judge = "Hit"; //荷重の左側が既存面の内部にある状態
                }
                else if (oldLoad.leftX < newLoad.rightX - d && newLoad.rightX + d < oldLoad.rightX) {
                    judge = "Hit"; //荷重の右側が既存面の内部にある状態
                }
                else if ((newLoad.leftX - d < oldLoad.leftX && newLoad.leftX - d < oldLoad.rightX) &&
                    (newLoad.rightX + d > oldLoad.leftX && newLoad.rightX + d > oldLoad.rightX)) {
                    judge = "Hit"; //荷重の面が既存の面を全て含む状態
                }
                else {
                    judge = "NotHit";
                }
                break;
            case ('y'):
                if (oldLoad.bottomY < newLoad.bottomY && newLoad.bottomY < oldLoad.topY) {
                    judge = "Hit"; //荷重の下側が既存面の内部にある状態
                }
                else if (oldLoad.bottomY < newLoad.topY && newLoad.topY < oldLoad.topY) {
                    judge = "Hit"; //荷重の上側が既存面の内部にある状態
                }
                else if ((newLoad.bottomY <= oldLoad.bottomY && newLoad.bottomY <= oldLoad.topY) &&
                    (newLoad.topY >= oldLoad.bottomY && newLoad.topY >= oldLoad.topY)) {
                    judge = "Hit"; //荷重の面が既存の面を全て含む状態
                }
                else {
                    judge = "NotHit";
                }
                break;
        }
        return judge;
    };
    // マウス位置とぶつかったオブジェクトを検出する
    ThreeLoadService.prototype.detectObject = function (raycaster, action) {
        return; // マウスの位置と 当たり判定の位置が ずれてる・・・使いにくいので
        if (!(this.currentIndex in this.AllCaseLoadList)) {
            this.selecteddObject = null;
            return; // 対象がなければ何もしない
        }
        var targetLoad = this.AllCaseLoadList[this.currentIndex];
        var ThreeObject = targetLoad.ThreeObject;
        // 交差しているオブジェクトを取得
        var intersects = raycaster.intersectObjects(ThreeObject.children, true);
        if (intersects.length <= 0) {
            return;
        }
        // マウス位置とぶつかったオブジェクトの親を取得
        var item = this.getParent(intersects[0].object);
        if (item === null) {
            return;
        }
        if (action === 'hover') {
            if (this.selecteddObject !== null) {
                if (this.selecteddObject === item) {
                    return;
                }
            }
        }
        // 全てのハイライトを元に戻す
        this.selectChange(-1, 0);
        //全てのオブジェクトをデフォルトの状態にする
        if (!('editor' in item)) {
            return;
        }
        this.selecteddObject = item;
        var editor = item['editor'];
        editor.setColor(item, action);
        this.scene.render();
    };
    // マウス位置とぶつかったオブジェクトの親を取得
    ThreeLoadService.prototype.getParent = function (item) {
        if (!('name' in item)) {
            return null;
        }
        for (var _i = 0, _a = Object.keys(this.loadEditor); _i < _a.length; _i++) {
            var key = _a[_i];
            if (item.name.indexOf(key) !== -1) {
                return item;
            }
        }
        if (!('parent' in item)) {
            return null;
        }
        return this.getParent(item.parent);
    };
    ThreeLoadService = __decorate([
        core_1.Injectable({
            providedIn: "root"
        })
    ], ThreeLoadService);
    return ThreeLoadService;
}());
exports.ThreeLoadService = ThreeLoadService;
