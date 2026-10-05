// Randomized greedy solver over the REAL game physics.
// Usage: node solve.js file.html from to attemptsPerK
const G=require('./sim.js')(process.argv[2]);
const from=+process.argv[3]||0,to=+process.argv[4]||G.LEVELS.length-1,ATT=+process.argv[5]||600;
const DT=1/60,TMAX=32,SC=G.SC(),MAXL=120*SC;
function run(i,plan,wantTraj){G.init(i);let t=0,pi=0;const traj=[];
 while(t<TMAX){while(pi<plan.length&&plan[pi].t<=t){const p=plan[pi++];G.addLine(p.x1,p.y1,p.x2,p.y2)}
  G.step(DT);t+=DT;const s=G.st();
  if(wantTraj&&((t*60|0)%3===0))for(const o of s.orbs)if(o.active&&!(o.sd>0))traj.push({t,x:o.x,y:o.y});
  if(s.lvWon)return{won:true,t,traj};if(s.lvLost)return{won:false,t,traj}}
 return{won:false,t,traj}}
const rnd=(a,b)=>a+Math.random()*(b-a);
function attempt(i,k){const plan=[];let last=0;
 for(let j=0;j<k;j++){const r=run(i,plan,true);if(r.won)return plan;
  const c=r.traj.filter(p=>p.t>last+.15);if(!c.length)return null;
  const p=c[Math.floor(Math.random()*c.length)];
  const tl=Math.max(last,p.t-rnd(.15,1.2)),a=rnd(0,Math.PI),L=rnd(30*SC,MAXL),ox=rnd(-6,6),oy=rnd(-6,6);
  plan.push({t:tl,x1:p.x+ox-Math.cos(a)*L/2,y1:p.y+oy-Math.sin(a)*L/2,x2:p.x+ox+Math.cos(a)*L/2,y2:p.y+oy+Math.sin(a)*L/2});last=tl}
 return run(i,plan,false).won?plan:null}
const res=[];
for(let i=from;i<=to;i++){const ld=G.LEVELS[i];let found=null,tries=0,firstSol=null;
 if(run(i,[],false).won)found=0;
 else for(let k=1;k<=Math.max(ld.ml,5)&&found===null;k++){for(let a=0;a<ATT*k;a++){tries++;const p=attempt(i,k);if(p){found=k;firstSol=p;break}}}
 let dens=null,sol=null;if(found>0){let ok=0;const N=300;for(let a=0;a<N;a++){const p=attempt(i,found);if(p){ok++;if(!sol)sol=p}}if(!sol)sol=firstSol;dens=+(ok/N).toFixed(3)}
 const nx=x=>+((x-G.gx(0))/G.FW()).toFixed(3),ny=y=>+((y-G.gy(0))/(G.gy(1)-G.gy(0))).toFixed(3);
 const hint=sol&&sol.length?{x1:nx(sol[0].x1),y1:ny(sol[0].y1),x2:nx(sol[0].x2),y2:ny(sol[0].y2),t:+sol[0].t.toFixed(2)}:null;
 res.push({lv:i+1,w:ld.w,ml:ld.ml,min:found,dens,tries,hint});
 console.log(JSON.stringify(res[res.length-1]))}
