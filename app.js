import {validateVillages,gameURL} from './core.js';
const $=id=>document.getElementById(id);
let controller,stream,rows,selected=null,starting=false,abandoned=false,cooldownUntil=0;

function stopCamera(){
  controller?.stopProcessVideo();
  stream?.getTracks().forEach(t=>t.stop());
  $('camera').srcObject=null;
}
function fail(error){
  stopCamera();
  $('welcome').hidden=true; $('scanner').hidden=true; $('found').hidden=true;
  $('error').hidden=false; $('footer').hidden=true;
  const messages={
    NotAllowedError:'카메라 사용이 차단되어 있어요. 주소창의 사이트 설정에서 카메라를 허용한 뒤 다시 시작해 주세요.',
    NotFoundError:'사용할 수 있는 카메라를 찾지 못했어요. 카메라가 있는 태블릿이나 휴대전화에서 열어 주세요.',
    NotReadableError:'다른 앱이 카메라를 사용하고 있을 수 있어요. 카메라를 사용하는 앱을 닫고 다시 시작해 주세요.',
    SecurityError:'카메라를 사용하려면 HTTPS 주소로 접속해 주세요. GitHub Pages 링크에서 실행할 수 있어요.'
  };
  $('error-message').textContent=messages[error?.name]??error?.message??'인식 기능을 준비하지 못했어요. 인터넷 연결과 브라우저를 확인한 뒤 다시 시도해 주세요.';
  console.error('Scanner error',error);
}
function onUpdate({type,targetIndex,worldMatrix}){
  if(type!=='updateMatrix'||!worldMatrix||selected||Date.now()<cooldownUntil||abandoned) return;
  const row=rows[targetIndex]; if(!row) return;
  selected=row;
  $('found-number').textContent=row.id;
  $('found-photo').src=row.photo;
  $('play').href=gameURL(row.id);
  $('found').hidden=false;
  $('reticle').hidden=true; $('scan-help').hidden=true;
  $('status').textContent=`${row.id}번 마을을 찾았어요!`;
  navigator.vibrate?.(80);
  $('play').focus({preventScroll:true});
}
async function fetchChecked(url){
  const response=await fetch(url);
  if(!response.ok) throw new Error('인식 자료를 불러오지 못했어요. 사이트 파일과 인터넷 연결을 확인해 주세요.');
  return response;
}
async function start(){
  if(starting)return; starting=true;
  $('start').disabled=true;
  try{
    if(!window.isSecureContext||!navigator.mediaDevices?.getUserMedia) throw Object.assign(new Error(),{name:'SecurityError'});
    $('welcome').hidden=true; $('footer').hidden=true; $('scanner').hidden=false;
    document.body.classList.add('scanning');
    stream=await navigator.mediaDevices.getUserMedia({audio:false,video:{facingMode:{ideal:'environment'},width:{ideal:1280},height:{ideal:720}}});
    if(abandoned){stopCamera();return;}
    const video=$('camera'); video.srcObject=stream;
    await video.play();
    if(!video.videoWidth) await new Promise(resolve=>video.addEventListener('loadedmetadata',resolve,{once:true}));
    $('status').textContent='27개 마을의 인식 자료를 준비하고 있어요…';
    const [{Controller},manifestResponse,targetResponse]=await Promise.all([
      import('./vendor/mindar-image.prod.js'),fetchChecked('./assets/villages.json'),fetchChecked('./assets/targets/villages.mind')
    ]);
    rows=validateVillages(await manifestResponse.json());
    const buffer=await targetResponse.arrayBuffer();
    if(abandoned)return;
    controller=new Controller({inputWidth:video.videoWidth,inputHeight:video.videoHeight,maxTrack:1,warmupTolerance:5,missTolerance:8,onUpdate});
    const {dimensions}=controller.addImageTargetsFromBuffer(buffer);
    if(dimensions.length!==rows.length)throw new Error('인식 자료와 게임 목록이 일치하지 않습니다.');
    controller.dummyRun(video);
    if(abandoned)return;
    controller.processVideo(video);
    $('status').textContent='표지석을 찾고 있어요';
  }catch(error){if(!abandoned)fail(error);}
}
$('start').addEventListener('click',start);
$('again').addEventListener('click',()=>{
  selected=null;cooldownUntil=Date.now()+2000;
  $('found').hidden=true;$('reticle').hidden=false;$('scan-help').hidden=false;
  $('status').textContent='다른 표지석을 비춰 주세요';
});
for(const id of ['stop','retry']) $(id).addEventListener('click',()=>{abandoned=true;stopCamera();location.reload();});
$('play').addEventListener('click',()=>{abandoned=true;stopCamera();});
$('help-toggle').addEventListener('click',()=>{const expanded=$('help').hidden;$('help').hidden=!expanded;$('help-toggle').setAttribute('aria-expanded',String(expanded));});
window.addEventListener('pagehide',()=>{abandoned=true;stopCamera();});
window.addEventListener('pageshow',e=>{if(e.persisted)location.reload();});
document.addEventListener('visibilitychange',()=>{
  if(document.hidden && starting){abandoned=true;stopCamera();}
  else if(!document.hidden && abandoned)location.reload();
});
window.addEventListener('unhandledrejection',event=>{
  if(starting&&!abandoned){event.preventDefault();fail(new Error('인식 처리가 중단되었어요. 브라우저를 새로고침한 뒤 다시 시도해 주세요.'));}
});
