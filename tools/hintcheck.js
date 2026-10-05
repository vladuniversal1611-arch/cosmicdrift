const G=require('./sim.js')(process.argv[2]);let ok=0,n=0;const bad=[];
for(let i=0;i<80;i++){const ld=G.LEVELS[i];if(ld.pf!==1)continue;n++;const h=ld.hint;
 G.init(i);let t=0,placed=false,won=false;
 while(t<32){if(!placed&&t>=h.t){G.addLine(G.gx(h.x1),G.gy(h.y1),G.gx(h.x2),G.gy(h.y2));placed=true}
  G.step(1/60);t+=1/60;const s=G.st();if(s.lvWon){won=true;break}if(s.lvLost)break}
 if(won)ok++;else bad.push(i+1)}
console.log(`1-line hints that solve their level: ${ok}/${n}`,bad.length?'failing: '+bad:'');
const z=G.LEVELS.filter(l=>!l.pf||!l.hint).length;console.log('levels missing pf/hint:',z);
