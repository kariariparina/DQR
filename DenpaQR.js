// ==========================================
// QR生成ツール
// script.js
// 前半
// ==========================================

// 全RSIDを格納
let rsidList = [];

// データ読込完了フラグ
let dataLoaded = false;

// HTML
const status = document.getElementById("status");
const log = document.getElementById("log");
const qrArea = document.getElementById("qr");
const button = document.getElementById("generateButton");

// ------------------------------------------
// 16進数2桁へ変換
// ------------------------------------------
function toHex(value) {

    return value.toString(16).padStart(2, "0");

}

// ------------------------------------------
// 全256ファイル読込
// ------------------------------------------
async function loadDataset() {

    status.textContent = "データを読み込んでいます...";

    rsidList = [];

    for (let i = 0; i < 256; i++) {

        const filename = "rsids/" + toHex(i) + ".txt";

        try {

            const response = await fetch(filename);

            if (!response.ok) {

                throw new Error(filename);

            }

            const text = await response.text();

            const lines = text.split(/\r?\n/);

            for (const line of lines) {

                const value = line.trim();

                if (value.length > 0) {

                    rsidList.push(value);

                }

            }

        }

        catch (error) {

            console.error(error);

            status.textContent = filename + " の読み込みに失敗しました";

            return;

        }

    }

    dataLoaded = true;

    status.textContent =
        "読込完了（" + rsidList.length + "件）";

}

loadDataset();

// ------------------------------------------
// RSID検索
// Colab版 get_qr_index()
// ------------------------------------------
function getQrIndex(target) {

    return rsidList.indexOf(target);

}

// ------------------------------------------
// インデックスから文字列取得
// Colab版 get_string_at_index()
// ------------------------------------------
function getStringAtIndex(index) {

    if (index < 0) return null;

    if (index >= rsidList.length) return null;

    return rsidList[index];

}
// ==========================================
// QRコード生成
// ==========================================
function generateQRCode(text) {

    qrArea.innerHTML = "";

    new QRCode(qrArea, {
        text: text,
        width: 220,
        height: 220,
        correctLevel: QRCode.CorrectLevel.L
    });

}

// ==========================================
// ボタン処理
// ==========================================
button.addEventListener("click", function () {

    log.textContent = "";

    qrArea.innerHTML = "";

    if (!dataLoaded) {

        alert("まだデータを読み込んでいます。");

        return;

    }

    //--------------------------------------------------
    // 入力取得
    //--------------------------------------------------

    const playerIdHex =
        document.getElementById("playerId")
            .value
            .trim()
            .toLowerCase();

    const targetRsid =
        document.getElementById("targetRsid")
            .value
            .trim()
            .replaceAll("_", "");

    //--------------------------------------------------
    // 入力チェック
    //--------------------------------------------------

    if (playerIdHex.length === 0 ||
        targetRsid.length === 0) {

        log.textContent =
            "プレイヤーIDと目標RSIDを入力してください。";

        return;

    }

    //--------------------------------------------------
    // 16進数変換
    //--------------------------------------------------

    let idNum = parseInt(playerIdHex, 16);

    if (isNaN(idNum)) {

        log.textContent =
            "プレイヤーIDは16進数で入力してください。";

        return;

    }

    //--------------------------------------------------
    // RSID検索
    //--------------------------------------------------

    const rsidIndex =
        getQrIndex(targetRsid);

    if (rsidIndex === -1) {

        log.textContent =
            "RSIDが見つかりません。";

        return;

    }

    //--------------------------------------------------
    // Colab版と同じ計算
    //--------------------------------------------------

    let newIndex = 0;

    newIndex +=
        (0x100 +
            (rsidIndex & 0xff) -
            (idNum & 0xff))
        & 0xff;

    newIndex +=
        (0x10000 +
            (rsidIndex & 0xff00) -
            (idNum & 0xff00))
        & 0xff00;

    newIndex +=
        (0x1000000 +
            (rsidIndex & 0xff0000) -
            (idNum & 0xff0000))
        & 0xff0000;

    //--------------------------------------------------
    // インデックス取得
    //--------------------------------------------------

    const qrString =
        getStringAtIndex(newIndex);

    if (qrString === null) {

        log.textContent =
            "計算結果が範囲外です。";

        return;

    }

    //--------------------------------------------------
    // ログ表示
    //--------------------------------------------------

    log.textContent =
`目標RSID : ${targetRsid}
元位置    : ${rsidIndex.toString(16).padStart(6,"0")}
適用ID    : ${playerIdHex}
変換位置  : ${newIndex.toString(16).padStart(6,"0")}
QR文字列  : ${qrString}`;

    //--------------------------------------------------
    // QR生成
    //--------------------------------------------------

    generateQRCode(qrString);

});