export function validateVillages(rows) {
  if (!Array.isArray(rows) || rows.length !== 27) throw new Error('27개 마을의 연결 정보가 필요합니다.');
  for (let i=0;i<27;i++) {
    const row=rows[i];
    if(row.id!==i+1 || row.targetIndex!==i || row.photo!==`assets/photos/${i+1}.jpg` || row.game!==`games/${i+1}.html`) throw new Error('사진과 게임 번호가 일치하지 않습니다.');
  }
  return rows;
}
export function gameId(search) {
  const raw=new URLSearchParams(search).get('id');
  if (!/^(?:[1-9]|1[0-9]|2[0-7])$/.test(raw??'')) return null;
  return Number(raw);
}
export function gameURL(id) {
  if(!Number.isInteger(id)||id<1||id>27) throw new Error('잘못된 마을 번호');
  return `game.html?id=${id}`;
}
