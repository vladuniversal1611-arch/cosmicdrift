const G=require('./sim.js')(process.argv[2]);
const out=[];
for(let i=0;i<G.LEVELS.length;i++){G.init(i);let t=0;
 while(t<90){G.step(1/60);t+=1/60;const s=G.st();if(s.lvWon||s.lvLost)break}
 const s=G.st();out.push(s.lvWon?`${i+1}:WIN@${t.toFixed(0)}s`:s.lvLost?`${i+1}:lost`:`${i+1}:-`)}
console.log(out.join('  '));
console.log('self-solving within 90s:',out.filter(x=>x.includes('WIN')).length,'/ 80');
