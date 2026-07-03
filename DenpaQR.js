// ==========================================
// QR生成ツール
// script.js
// 完成版 Part1
// ==========================================

// ----------------------------
// データ
// ----------------------------
let rsidList = [];
let rsidMap = new Map();
let dataLoaded = false;

// ----------------------------
// HTML
// ----------------------------
const status = document.getElementById("status");
const log = document.getElementById("log");
const qrArea = document.getElementById("qr");
const button = document.getElementById("generateButton");

// ----------------------------
// 2桁16進数
// ----------------------------
function toHex(value){

    return value.toString(16).padStart(2,"0");

}

// ----------------------------
// データセット読込
// ----------------------------
async function loadDataset(){

    status.textContent = "データを読み込んでいます...";

    rsidList = [];
    rsidMap.clear();

    try{

        const requests = [];

        for(let i=0;i<256;i++){

            requests.push(

                fetch("rsids/" + toHex(i) + ".txt")
                    .then(response=>{

                        if(!response.ok){

                            throw new Error(
                                "rsids/" + toHex(i) + ".txt"
                            );

                        }

                        return response.text();

                    })

            );

        }

        const files = await Promise.all(requests);

        let index = 0;

        for(const text of files){

            const lines = text.split(/\r?\n/);

            for(const line of lines){

                const value = line.trim();

                if(value===""){

                    continue;

                }

                rsidList.push(value);

                rsidMap.set(value,index);

                index++;

            }

        }

        dataLoaded = true;

        status.textContent =
            "読込完了：" +
            rsidList.length +
            "件";

    }
    catch(error){

        console.error(error);

        status.textContent =
            "データセットの読込に失敗しました";

    }

}

// ----------------------------
// RSID検索
// ----------------------------
function getQrIndex(rsid){

    if(rsidMap.has(rsid)){

        return rsidMap.get(rsid);

    }

    return -1;

}

// ----------------------------
// インデックスから取得
// ----------------------------
function getStringAtIndex(index){

    if(index<0){

        return null;

    }

    if(index>=rsidList.length){

        return null;

    }

    return rsidList[index];

}

// ----------------------------
// QR生成
// ----------------------------
function generateQR(text){

    qrArea.innerHTML="";

    new QRCode(qrArea,{

        text:text,

        width:220,

        height:220

    });

}

// ----------------------------
// 起動時読込
// ----------------------------
loadDataset();
// ==========================================
// QR生成ボタン
// ==========================================

button.addEventListener("click", async function () {

    log.textContent = "";

    qrArea.innerHTML = "";

    //--------------------------------------------------
    // データ読込確認
    //--------------------------------------------------

    if (!dataLoaded) {

        alert("まだデータを読み込んでいます。");

        return;

    }

    //--------------------------------------------------
    // 入力取得
    //--------------------------------------------------

    const playerIdHex =
        document
            .getElementById("playerId")
            .value
            .trim()
            .toLowerCase();

    const targetRsid =
        document
            .getElementById("targetRsid")
            .value
            .trim()
            .replaceAll("_", "");

    //--------------------------------------------------
    // 未入力
    //--------------------------------------------------

    if (playerIdHex === "" || targetRsid === "") {

        log.textContent =
            "プレイヤーIDと目標RSIDを入力してください。";

        return;

    }

    //--------------------------------------------------
    // 16進数チェック
    //--------------------------------------------------

    if (!/^[0-9a-f]+$/i.test(playerIdHex)) {

        log.textContent =
            "プレイヤーIDは16進数で入力してください。";

        return;

    }

    //--------------------------------------------------
    // 数値へ変換
    //--------------------------------------------------

    const idNum = parseInt(playerIdHex, 16);

    //--------------------------------------------------
    // RSID検索
    //--------------------------------------------------

    const rsidIndex = getQrIndex(targetRsid);

    if (rsidIndex === -1) {

        log.textContent =
            "RSIDが見つかりませんでした。";

        return;

    }

    //--------------------------------------------------
    // Python版と同じ計算
    //--------------------------------------------------

    let newIndex = 0;

    newIndex +=
        ((0x100 +
            (rsidIndex & 0xff) -
            (idNum & 0xff))
        & 0xff);

    newIndex +=
        ((0x10000 +
            (rsidIndex & 0xff00) -
            (idNum & 0xff00))
        & 0xff00);

    newIndex +=
        ((0x1000000 +
            (rsidIndex & 0xff0000) -
            (idNum & 0xff0000))
        & 0xff0000);

    //--------------------------------------------------
    // 範囲チェック
    //--------------------------------------------------

    if (newIndex < 0 ||
        newIndex >= rsidList.length) {

        log.textContent =
            "計算結果がデータ範囲外です。";

        return;

    }

    //--------------------------------------------------
    // QR文字列取得
    //--------------------------------------------------

    const qrString =
        getStringAtIndex(newIndex);

    if (qrString == null) {

        log.textContent =
            "QR文字列が取得できませんでした。";

        return;

    }

    //--------------------------------------------------
    // ログ表示
    //--------------------------------------------------

    log.textContent =
`目標RSID : ${targetRsid}

元位置 : ${rsidIndex.toString(16).padStart(6,"0")}

適用ID : ${playerIdHex}

変換位置 : ${newIndex.toString(16).padStart(6,"0")}

QR文字列 :

${qrString}`;

    //--------------------------------------------------
    // QR生成
    //--------------------------------------------------

    generateQR(qrString);

});
