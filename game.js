import {gameId} from './core.js';
const id=gameId(location.search);
if(id===null){document.getElementById('game-error').hidden=false;}
else{
  document.title=`${id}번 마을 게임 · 삼괴 마을 탐험`;
  document.getElementById('game-name').textContent=`${id}번 마을`;
  const frame=document.getElementById('game-frame');
  frame.src=`games/${id}.html`;frame.hidden=false;
}
