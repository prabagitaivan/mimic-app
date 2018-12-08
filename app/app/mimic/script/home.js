const btnIdentify = document.querySelector('#btnIdentify');
const btnGenerate = document.querySelector('#btnGenerate');
const btnCollect = document.querySelector('#btnCollect');

btnIdentify.onclick = function () {
    open('/app/mimic/identify.html', '_self');
};

btnGenerate.onclick = function () {
    open('/app/mimic/generate.html', '_self');
};

btnCollect.onclick = function () {
    open('/app/collect/home.html', '_self');
};