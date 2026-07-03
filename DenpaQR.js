async function loadDataset(){

let dataset=[];

for(let i=0;i<256;i++){

let hex=i.toString(16).padStart(2,"0");

let txt=await fetch(`rsids/${hex}.txt`);

let data=await txt.text();

data.split(/\r?\n/).forEach(v=>{

v=v.trim();

if(v.length>0)

dataset.push(v);

});

}

return dataset;

}

let DATASET=[];

(async()=>{

DATASET=await loadDataset();

console.log("Dataset Loaded:",DATASET.length);

})();

function getQRIndex(rsid){

return DATASET.indexOf(rsid);

}

function getString(index){

if(index<0)return null;

if(index>=DATASET.length)return null;

return DATASET[index];

}

document.getElementById("generate").onclick=function(){

document.getElementById("result").textContent="";

document.getElementById("qrcode").innerHTML="";

let id=document.getElementById("playerid").value.trim();

let rsid=document.getElementById("rsid").value.trim().replaceAll("_","");

if(id==""||rsid==""){

alert("入力してください");

return;

}

let idNum=parseInt(id,16);

let index=getQRIndex(rsid);

if(index==-1){

alert("RSIDがありません");

return;

}

let newIndex=0;

newIndex+=((0x100+(index&0xff)-(idNum&0xff))&0xff);

newIndex+=((0x10000+(index&0xff00)-(idNum&0xff00))&0xff00);

newIndex+=((0x1000000+(index&0xff0000)-(idNum&0xff0000))&0xff0000);

let qrString=getString(newIndex);

if(qrString==null){

alert("計算失敗");

return;

}

document.getElementById("result").textContent=

`目標RSID : ${rsid}

元位置 : ${index.toString(16)}

変換位置 : ${newIndex.toString(16)}

QR文字列 : ${qrString}`;

new QRCode(document.getElementById("qrcode"),{

text:qrString,

width:220,

height:220

});

}
