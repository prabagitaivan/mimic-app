var btnIdentify = document.querySelector('#btnIdentify');
var btnGenerate = document.querySelector('#btnGenerate');

btnIdentify.onclick = function () {
    open('/identify.html', '_self');
};

btnGenerate.onclick = function () {
    open('/generate.html', '_self');
};