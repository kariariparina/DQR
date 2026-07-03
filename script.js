const button = document.getElementById("generate");
const loading = document.getElementById("loading");
const result = document.getElementById("result");
const qrArea = document.getElementById("qrcode");

let DATASET = [];

/*
 * rsidsフォルダ内の
 * 00.txt ～ ff.txt
 * をすべて読み込む
 */
async function loadDataset() {

    DATASET = [];

    let totalFiles = 256;
    let loadedFiles = 0;

    for (let i = 0; i < totalFiles; i++) {

        const hex = i.toString(16).padStart(2, "0");

        loading.textContent =
            `データ読込中... ${loadedFiles}/${totalFiles}`;

        try {

            const response =
                await fetch(`rsids/${hex}.txt`);

            if (!response.ok) {

                console.error(`${hex}.txt 読み込み失敗`);

                continue;

            }

            const text = await response.text();

            const lines = text.split(/\r?\n/);

            for (const line of lines) {

                const value = line.trim();

                if (value.length > 0) {

                    DATASET.push(value);

                }

            }

            loadedFiles++;

        } catch (e) {

            console.error(e);

        }

    }

    loading.textContent =
        `読込完了 (${DATASET.length.toLocaleString()}件)`;

    button.disabled = false;
    button.textContent = "QRコード生成";

}

loadDataset();

function loadHistory(){

const historyDiv=document.getElementById("history");

historyDiv.innerHTML="";

const history=JSON.parse(localStorage.getItem("qrHistory")||"[]");

history.reverse().forEach(item=>{

const div=document.createElement("div");

div.className="history-item";

div.innerHTML=`
<b>目標RSID</b> : ${item.rsid}<br>
<b>変換code</b> : ${item.id}<br>
<b>QR文字列</b> : ${item.qr}<br>
<div id="qr_${item.time}"></div>
`;

historyDiv.appendChild(div);

new QRCode(document.getElementById(`qr_${item.time}`),{

text:item.qr,

width:120,

height:120

});

});

}

loadHistory();

/*
 * RSID検索
 */
function getQRIndex(rsid) {

    return DATASET.indexOf(rsid);

}

/*
 * インデックスからRSID取得
 */
function getStringAtIndex(index) {

    if (index < 0) return null;

    if (index >= DATASET.length) return null;

    return DATASET[index];

}
/*
 * QR生成ボタン
 */
button.addEventListener("click", () => {

    result.textContent = "";
    qrArea.innerHTML = "";

    const playerId = document
        .getElementById("playerid")
        .value
        .trim();

    const targetRSID = document
        .getElementById("rsid")
        .value
        .trim()
        .replaceAll("_", "");

    if (playerId === "" || targetRSID === "") {

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

});

document.getElementById("clearHistory").onclick=function(){

if(confirm("履歴を削除しますか？")){

localStorage.removeItem("qrHistory");

loadHistory();

}

};
