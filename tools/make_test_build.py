"""Build a copy of the game with the whole story already finished, for testing.

It uses its own save (every key is prefixed with "T_"), so playing it never
touches a real player's progress, even when both files open from the same
place. On first launch it seeds: all 30 levels cleared, every story scene seen,
all 10 memories, player level 15 with every module unlocked, plenty of coins,
shards, fragments and chests. Delete the T_ keys (or use the in-page reset)
to start over.

    python3 tools/make_test_build.py
"""
import re, pathlib

root = pathlib.Path(__file__).resolve().parent.parent
src = (root / 'frog-endless-runner.html').read_text()

seed = r"""
// ===== TEST BUILD: separate save + everything unlocked =====
const __LS={
  getItem:k=>window.localStorage.getItem('T_'+k),
  setItem:(k,v)=>window.localStorage.setItem('T_'+k,v),
  removeItem:k=>window.localStorage.removeItem('T_'+k)
};
(function(){
  // later additions to the seed, applied to older test saves too
  if(!__LS.getItem('seedKeys')){try{const d=JSON.parse(__LS.getItem('fProg')||'null');
    if(d){d.keys=(d.keys|0)+10;__LS.setItem('fProg',JSON.stringify(d));__LS.setItem('seedKeys','1')}}catch(e){}}
  if(__LS.getItem('seeded'))return;
  const done={},seen={intro:true};
  for(let w=0;w<5;w++){for(let l=0;l<6;l++)done[w+'-'+l]=true;
    for(const s of ['a','b','w'])seen['w'+w+s]=true;}
  __LS.setItem('fProg',JSON.stringify({v:1,xp:0,lvl:15,shards:200,
    mods:{magnet:1,shield:1,dash:1,fever:1,djump:1,reward:1},
    frag:{magnet:40,shield:40,dash:40,fever:40,djump:40,reward:40},
    chests:{wood:3,crystal:2,epic:1},meter:60,goals:[],goalsDone:0,
    week:{id:'',n:0,claimed:[]},world:{w:0,l:0,done},
    stats:{runs:40,perfects:900,bestCombo:30,dist:20000},keys:10,
    story:{seen,mem:[0,1,2,3,4,5,6,7,8,9],v:1},endW:0,migrated:true}));
  __LS.setItem('fCoins','20000');__LS.setItem('fHS','1500');__LS.setItem('fBS','20000');
  __LS.setItem('fTut','1');__LS.setItem('fIntro','1');
  __LS.setItem('seeded','1');__LS.setItem('seedKeys','1');
})();
"""

out = src.replace('<script>', '<script>' + seed, 1)
body_start = out.index(seed) + len(seed)
out = out[:body_start] + re.sub(r'\blocalStorage\.', '__LS.', out[body_start:])
out = out.replace('<title>Bulbik Runner 👾</title>', '<title>Bulbik Runner — TEST (all unlocked)</title>', 1)
(root / 'frog-endless-runner-TEST.html').write_text(out)
print('wrote frog-endless-runner-TEST.html')
