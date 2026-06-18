/* Mock-DOM smoke test: instantiate UI and render every meta screen +
   modals to surface runtime errors in the DOM-building code. */
const fs = require('fs'), vm = require('vm');

function node(tag) {
  const n = {
    tagName: (tag || 'div').toUpperCase(), _cls: '', style: {}, children: [],
    parentNode: null, disabled: false, scrollTop: 0, offsetWidth: 1, _text: '', _html: '',
    classList: { _s: new Set(),
      add(...c){c.forEach(x=>x&&this._s.add(x));}, remove(...c){c.forEach(x=>this._s.delete(x));},
      contains(c){return this._s.has(c);}, toggle(c){this._s.has(c)?this._s.delete(c):this._s.add(c);} },
    appendChild(c){ c.parentNode=this; this.children.push(c); return c; },
    removeChild(c){ const i=this.children.indexOf(c); if(i>=0)this.children.splice(i,1); return c; },
    replaceChild(nw,old){ const i=this.children.indexOf(old); if(i>=0)this.children[i]=nw; nw.parentNode=this; },
    insertBefore(nw){ this.children.push(nw); nw.parentNode=this; return nw; },
    addEventListener(ev,fn){ (this._ev=this._ev||{})[ev]=fn; },
    querySelector(){ return null; },
    querySelectorAll(){ return []; },
    scrollIntoView(){}, getBoundingClientRect(){ return {left:0,top:0,width:400,height:800}; },
    getContext(){ return ctx2d; }
  };
  Object.defineProperty(n,'className',{get(){return n._cls;},set(v){n._cls=v;n.classList._s=new Set(String(v).split(/\s+/).filter(Boolean));}});
  Object.defineProperty(n,'innerHTML',{get(){return n._html;},set(v){n._html=v;n.children=[];}});
  Object.defineProperty(n,'textContent',{get(){return n._text;},set(v){n._text=v;}});
  Object.defineProperty(n,'firstChild',{get(){return n.children[0]||null;}});
  return n;
}
const ctx2d = new Proxy({}, { get: () => (()=>{}) , set: ()=>true });

const screens = {};
['home','map','collection','shop','pass','game'].forEach(id => screens['screen-'+id]=node('div'));
const appNode = node('div');

const store = {};
const sb = {
  Math, Date, JSON, console,
  setTimeout: (f)=>{ try{ typeof f==='function'&&f(); }catch(e){} return 0; },
  clearTimeout(){}, setInterval:()=>0, clearInterval(){}, requestAnimationFrame:()=>0,
  localStorage:{ getItem:k=>k in store?store[k]:null, setItem:(k,v)=>{store[k]=String(v)}, removeItem(k){delete store[k]} },
  devicePixelRatio:1,
  document: {
    getElementById:(id)=>screens[id]||(id==='app'?appNode:null),
    createElement:(t)=>node(t),
    addEventListener(){}, querySelectorAll(){return [];}
  },
  addEventListener(){}
};
sb.window=sb; sb.global=sb; vm.createContext(sb);
['data.js','save.js','engine.js','ui.js'].forEach(f=>vm.runInContext(fs.readFileSync('www/js/'+f,'utf8'),sb,{filename:f}));
sb.Save.load();
sb.Audio2 = { resume(){}, play(){}, startMusic(){}, stopMusic(){}, setMusicEnabled(){} };
sb.Game = { go(){}, startLevel(){}, addPassXp:sb.UI?sb.UI.addPassXp:()=>{} };

let fails = 0;
function tryRun(name, fn){ try{ fn(); console.log('OK  '+name); }catch(e){ fails++; console.error('ERR '+name+': '+e.message+'\n  '+(e.stack||'').split('\n')[1]); } }

const UI = sb.UI;
tryRun('init', ()=> UI.init(appNode));
tryRun('renderHome', ()=> UI.renderHome());
tryRun('renderMap', ()=> UI.renderMap());
tryRun('renderCollection', ()=> UI.renderCollection());
tryRun('renderShop', ()=> UI.renderShop());
tryRun('renderPass', ()=> UI.renderPass());
tryRun('showLevelPreview', ()=> UI.showLevelPreview(1));
tryRun('equipPicker', ()=> UI.equipPicker());
tryRun('cycleEquip', ()=> UI.cycleEquip(1));
tryRun('showUpgrade', ()=> UI.showUpgrade('flare'));
tryRun('showDaily', ()=> UI.showDaily());
tryRun('ensureQuests', ()=> UI.ensureQuests());
tryRun('showQuests', ()=> UI.showQuests());
tryRun('showAchievements', ()=> UI.showAchievements());
tryRun('showSettings', ()=> UI.showSettings());
tryRun('handleEgg', ()=> { sb.Save.get().energy = 50; UI.handleEgg(0); });
tryRun('rewardLabel', ()=> { UI.rewardLabel({type:'gold',amount:5}); UI.rewardLabel({type:'gems',amount:5}); UI.rewardLabel({type:'dragon'}); });
tryRun('toast', ()=> UI.toast('hi'));
tryRun('modal', ()=> UI.modal('t', null, [{label:'a',primary:true},{label:'b'}]));

console.log('\n=== UI test: '+(fails?(fails+' FAILURES'):'all passed')+' ===');
process.exit(fails?1:0);
