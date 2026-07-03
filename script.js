const button = document.getElementById("generate");
const loading = document.getElementById("loading");
const result = document.getElementById("result");
const qrArea = document.getElementById("qrcode");

let DATASET = [];

/*
 * データセット読み込み
 */
async function loadDataset() {

    DATASET = [];

    const totalFiles = 256;
    let loaded = 0;

    for (let i = 0; i < totalFiles; i++) {

        const hex = i.toString(16).padStart(2, "0");

        loading.textContent =
            `データ読込中... ${loaded}/${totalFiles}`;

        try {

            const res = await fetch(`rsids/${hex}.txt`);

            if (!res.ok) {
                console.error(`${hex}.txt の読込失敗`);
                continue;
            }

            const text = await res.text();

            text.split(/\r?\n/).forEach(line => {

                line = line.trim();

                if (line.length > 0) {
                    DATASET.push(line);
                }

            });

            loaded++;

        } catch (e) {

            console.error(e);

        }

    }

    loading.textContent =
        `読込完了 (${DATASET.length.toLocaleString()}件)`;

    button.disabled = false;
    button.textContent = "QRコード生成";

    loadHistory();

}

loadDataset();

/*
 * RSID検索
 */
function getQRIndex(rsid) {

    return DATASET.indexOf(rsid);

}

/*
 * index → RSID
 */
function getStringAtIndex(index) {

    if (index < 0) return null;

    if (index >= DATASET.length) return null;

    return DATASET[index];

}

/*
 * 履歴保存
 */
function saveHistory(playerId, rsid, qrString) {

    let history =
        JSON.parse(localStorage.getItem("qrHistory") || "[]");

    history.push({

        time: Date.now(),

        id: playerId,

        rsid: rsid,

        qr: qrString

    });

    if (history.length > 200) {

        history = history.slice(-200);

    }

    localStorage.setItem(
        "qrHistory",
        JSON.stringify(history)
    );

}

/*
 * 履歴表示
 */
function loadHistory() {

    const historyArea =
        document.getElementById("history");

    if (!historyArea) return;

    historyArea.innerHTML = "";

    const history =
        JSON.parse(localStorage.getItem("qrHistory") || "[]");

    history.slice().reverse().forEach(item => {

        const div = document.createElement("div");

        div.className = "history-item";

        const qrId = "qr_" + item.time;

        div.innerHTML = `
<b>RSID</b> : ${item.rsid}<br>
<b>CODE</b> : ${item.id}<br>
<b>QR</b> : ${item.qr}<br>
<div id="${qrId}"></div>
`;

        historyArea.appendChild(div);

        new QRCode(document.getElementById(qrId), {

            text: item.qr,

            width: 120,

            height: 120

        });

    });

}

/*
 * 履歴削除
 */
function clearHistory() {

    localStorage.removeItem("qrHistory");

    loadHistory();

}

/*
 * QR生成処理
 */
button.addEventListener("click", () => {

    result.textContent = "";
    qrArea.innerHTML = "";

    const playerId =
        document.getElementById("playerid")
        .value
        .trim();

    const targetRSID =
        document.getElementById("rsid")
        .value
        .trim()
        .replaceAll("_", "");

    if (!playerId || !targetRSID) {

        alert("変換codeと目標RSIDを入力してください。");

        return;

    }

    if (!/^[0-9a-fA-F]+$/.test(playerId)) {

        alert("変換codeは16進数で入力してください。");

        return;

    }

    const idNum = parseInt(playerId, 16);

    const rsidIndex = getQRIndex(targetRSID);

    if (rsidIndex === -1) {

        alert("RSIDが見つかりません。");

        return;

    }

    /*
     * Python版と同じ計算
     */
    let newIndex = 0;

    newIndex +=
        ((0x100 + (rsidIndex & 0xff) - (idNum & 0xff)) & 0xff);

    newIndex +=
        ((0x10000 + (rsidIndex & 0xff00) - (idNum & 0xff00)) & 0xff00);

    newIndex +=
        ((0x1000000 + (rsidIndex & 0xff0000) - (idNum & 0xff0000)) & 0xff0000);

    const qrString = getStringAtIndex(newIndex);

    if (qrString === null) {

        alert("計算結果がデータセットの範囲外です。");

        return;

    }

    result.textContent =
`目標RSID : ${targetRSID}

元位置 : ${rsidIndex.toString(16)}

変換位置 : ${newIndex.toString(16)}

QR文字列 : ${qrString}`;

    new QRCode(qrArea, {

        text: qrString,

        width: 220,

        height: 220

    });

    /*
     * 履歴保存
     */
    saveHistory(playerId, targetRSID, qrString);

    /*
     * 履歴更新
     */
    loadHistory();

});

/*
 * 初回表示
 */
loadHistory();
