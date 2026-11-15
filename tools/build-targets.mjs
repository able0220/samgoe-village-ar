// Run from tools/: npm install && npm run build:targets
import fs from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {loadImage} from 'canvas';
import {OfflineCompiler} from 'mind-ar/src/image-target/offline-compiler.js';
import {decode,encode} from '@msgpack/msgpack';
const root=new URL('../',import.meta.url);
const manifest=JSON.parse(await fs.readFile(new URL('assets/villages.json',root),'utf8'));
const dataList=[];
for(const [index,row] of manifest.entries()){
  if(row.id!==index+1||row.targetIndex!==index)throw Error('번호와 인식 순서를 확인하세요.');
  console.log(`Compile ${row.id}/27`);
  const image=await loadImage(fileURLToPath(new URL(row.photo,root)));
  const compiler=new OfflineCompiler();
  await compiler.compileImageTargets([image],()=>{});
  dataList.push(decode(compiler.exportData()).dataList[0]);
}
await fs.writeFile(new URL('assets/targets/villages.mind',root),encode({v:2,dataList}));
await fs.writeFile(new URL('assets/target-report.json',root),JSON.stringify(dataList.map((d,i)=>({id:i+1,width:d.targetImage.width,height:d.targetImage.height,matchingPoints:d.matchingData.map(f=>f.maximaPoints.length+f.minimaPoints.length),trackingPoints:d.trackingData.map(f=>f.points.length)})),null,2));
await fs.writeFile(new URL('verification.json',root),JSON.stringify({status:'RETEST_REQUIRED',note:'Targets regenerated. Previous recognition results no longer apply.'},null,2));
console.log('Done. Commit the updated photos and villages.mind together. Re-run field tests.');
