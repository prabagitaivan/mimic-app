const btnStart = document.querySelector('#btnStart');
const btnMimic = document.querySelector('#btnMimic');

btnStart.onclick = function () {
  open('/app/collect/a.html', '_self');
};

btnMimic.onclick = function () {
  open('/app/mimic/home.html', '_self');
};
