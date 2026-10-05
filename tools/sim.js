// Level verifier for Echo Forge. Runs the REAL game physics from index.html headlessly.
//   node tools/zero.js index.html            -> which levels win with no lines drawn (should be none)
//   node tools/solve.js index.html 0 79 500  -> min lines + solution density per level (lower density = harder)
//   node tools/hintcheck.js index.html       -> every 1-line hint must solve its level
// Loads the REAL game code headlessly and exposes a level simulator.
const vm=require('vm'),fs=require('fs');
module.exports=function load(file){
const src=fs.readFileSync(file,'utf8');const js=src.slice(src.indexOf('<script>')+8,src.lastIndexOf('</script>'));
const grad={addColorStop(){}};
const ctx=new Proxy({},{get(_,p){if(p==='measureText')return s=>({width:(s?s.length:0)*7});if(p==='createLinearGradient'||p==='createRadialGradient')return()=>grad;return ['fillStyle','strokeStyle','lineWidth','globalAlpha','font','shadowBlur','shadowColor','textAlign','textBaseline','lineCap'].includes(p)?'':()=>{}}});
const canvas={getContext:()=>ctx,addEventListener(){}};
const sb={console,document:{getElementById:()=>canvas,addEventListener(){}},window:{innerWidth:400,innerHeight:700,devicePixelRatio:1,addEventListener(){}},requestAnimationFrame:()=>0,setTimeout:()=>0,clearTimeout(){},localStorage:{getItem:()=>null,setItem(){}},Math,JSON,Object,Array,String,Number};
sb.window.AudioContext=function(){return{state:'running',currentTime:0,resume(){},destination:{},createOscillator:()=>({frequency:{},connect(){},start(){},stop(){}}),createGain:()=>({gain:{setValueAtTime(){},exponentialRampToValueAtTime(){}},connect(){}})}};
sb.globalThis=sb;vm.createContext(sb);
vm.runInContext(js+`;globalThis.G={LEVELS,gx,gy,SC:()=>SC,FW:()=>FW,
 init(i){sfxOn=false;initLevel(i)},
 st:()=>({orbs,targets,lines,lvWon,lvLost,lvTime}),
 step(dt){updateLevel(dt);for(let k=P.length-1;k>=0;k--)P.splice(k,1)},
 addLine(x1,y1,x2,y2){placeLine(x1,y1,x2,y2)}}`,sb);
return sb.G};
