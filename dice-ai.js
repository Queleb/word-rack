// Dice Duel rules + cat strategy. Shared by the game page and the tests.
(function(root){
  const BOXES=["1","2","3","4","5","6","3k","4k","fh","ss","ls","5k","ch"];
  const NAMES={"1":"Ones","2":"Twos","3":"Threes","4":"Fours","5":"Fives","6":"Sixes","3k":"3 of a Kind","4k":"4 of a Kind","fh":"Full House","ss":"Small Straight","ls":"Large Straight","5k":"5 of a Kind","ch":"Chance"};
  const counts=d=>{ const c=[0,0,0,0,0,0,0]; for(const x of d) c[x]++; return c; };
  const sum=d=>d.reduce((a,b)=>a+b,0);
  const isFive=d=>d.length===5&&d.every(x=>x===d[0]);
  const hasRun=(c,len)=>{ let run=0; for(let v=1;v<=6;v++){ run=c[v]?run+1:0; if(run>=len) return true; } return false; };

  // Joker rule (official): a 5-of-a-kind after the 5-of-a-kind box is filled must go in its
  // matching upper box if open; otherwise any lower box scores in full; otherwise zero an upper box.
  function jokerState(d,card){ return isFive(d) && card["5k"]!=null; }
  function allowed(d,card){
    const open=BOXES.filter(b=>card[b]==null);
    if (jokerState(d,card)){
      const up=String(d[0]); if (card[up]==null) return [up];
      const lower=open.filter(b=>!/^[1-6]$/.test(b)); if (lower.length) return lower;
    }
    return open;
  }
  function score(box,d,card){
    const c=counts(d), s=sum(d), joker=jokerState(d,card);
    if (/^[1-6]$/.test(box)){ const v=+box; return c[v]*v; }
    switch(box){
      case "3k": return c.some(n=>n>=3)?s:0;
      case "4k": return c.some(n=>n>=4)?s:0;
      case "fh": return (joker || (c.includes(3)&&c.includes(2)))?25:0;
      case "ss": return (joker || hasRun(c,4))?30:0;
      case "ls": return (joker || hasRun(c,5))?40:0;
      case "5k": return isFive(d)?50:0;
      case "ch": return s;
    }
    return 0;
  }
  const fiveBonus=(d,card)=> isFive(d) && card["5k"]===50 ? 100 : 0;
  function totals(card,bonusCount){
    const upper=["1","2","3","4","5","6"].reduce((a,b)=>a+(card[b]||0),0);
    const lower=["3k","4k","fh","ss","ls","5k","ch"].reduce((a,b)=>a+(card[b]||0),0);
    const ub= upper>=63?35:0, fb=(bonusCount||0)*100;
    return {upper,ub,lower,fb,total:upper+ub+lower+fb};
  }

  // ---------- Strategy ----------
  // Every way 5 dice can land (sorted), and the odds of each outcome when rerolling k dice
  const OUT=[[{d:[],p:1}]];
  for(let k=1;k<=5;k++){
    const m=new Map(), tot=Math.pow(6,k);
    const rec=(arr)=>{ if(arr.length===k){ const key=arr.slice().sort().join(""); m.set(key,(m.get(key)||0)+1); return; } for(let v=1;v<=6;v++){ arr.push(v); rec(arr); arr.pop(); } };
    rec([]); OUT[k]=[...m].map(([key,n])=>({d:key.split("").map(Number),p:n/tot}));
  }
  // Precomputed once: all 252 sorted 5-dice results, every possible "keep" (462), and where each keep can lead
  const STATES=[], SID=new Map(), HOLDS=[], HID=new Map(), HOLD_OUT=[], STATE_HOLDS=[];
  (function(){
    const rec=(arr,min)=>{ if(arr.length===5){ SID.set(arr.join(""),STATES.length); STATES.push(arr.slice()); return; } for(let v=min;v<=6;v++){ arr.push(v); rec(arr,v); arr.pop(); } };
    rec([],1);
    const holdId=h=>{ const key=h.join(""); if(!HID.has(key)){ HID.set(key,HOLDS.length); HOLDS.push(h);
        HOLD_OUT.push(OUT[5-h.length].map(o=>({s:SID.get(h.concat(o.d).sort().join("")),p:o.p}))); } return HID.get(key); };
    STATES.forEach((d,si)=>{ const set=new Set(); for(let mask=0;mask<31;mask++) set.add(holdId(d.filter((_,i)=>mask&(1<<i)))); STATE_HOLDS[si]=[...set]; });
  })();
  // What leaving a box open is roughly worth later (opportunity cost of using it now)
  const EV={"1":2.1,"2":5.3,"3":8.6,"4":12.2,"5":15.7,"6":19.2,"3k":15,"4k":7,"fh":14,"ss":19,"ls":12,"5k":11,"ch":22};
  function boxValue(level,box,d,card,roundsLeft,bonusCount){
    let s=score(box,d,card)+fiveBonus(d,card);
    if (level<=0) return s;
    const T=root.DICE_TUNE||{};
    const w= level===1?0.2: level===2?0.85: (T.w??0.7);
    let v=s - w*EV[box]*(roundsLeft>1?1:0);
    if (level>=3 && /^[1-6]$/.test(box) && roundsLeft>1){
      const t=totals(card,bonusCount); if (t.upper<63){
        const face=+box, par=3*face, diff=score(box,d,card)-par;
        const openUp=["1","2","3","4","5","6"].filter(b=>card[b]==null).reduce((a,b)=>a+3*(+b),0);
        if (t.upper+openUp>=63-(T.slack??14)) v+=diff*(T.k??1.6);      // keeps the 35-point bonus in reach
      }
    }
    if (level>=2 && box==="5k" && s===0 && roundsLeft>3) v-=14;  // don't throw away the big box early
    return v;
  }
  // Best expected value of the rest of this turn, worked out exactly for every possible roll
  function planner(level,card,roundsLeft,bonusCount){
    const stop=STATES.map(d=>{ let b=-1e9; for(const box of allowed(d,card)){ const v=boxValue(level,box,d,card,roundsLeft,bonusCount); if(v>b) b=v; } return b; });
    const expect=V=>HOLD_OUT.map(out=>{ let e=0; for(const o of out) e+=o.p*V[o.s]; return e; });
    const E1=expect(stop);
    const V1=stop.map((v,si)=>{ let b=v; for(const h of STATE_HOLDS[si]) if(E1[h]>b) b=E1[h]; return b; });
    const E2=expect(V1);
    function bestHold(d,r){
      const si=SID.get(d.join("")), E= (r>=2 && level>=3)?E2:E1;   // Expert plans the whole turn; others one roll ahead
      let best=null, bv=stop[si];
      for(const h of STATE_HOLDS[si]) if(E[h]>bv+1e-9){ bv=E[h]; best=HOLDS[h]; }
      return best;   // null = stop rolling and score
    }
    function bestBox(d){ let b=null,bv=-1e9; for(const box of allowed(d,card)){ const v=boxValue(level,box,d,card,roundsLeft,bonusCount); if(v>bv){bv=v;b=box;} } return b; }
    return {bestHold,bestBox};
  }
  // Decide what to keep: returns indexes of dice to hold, or null to stop and score
  function chooseHold(level,dice,rollsLeft,card,roundsLeft,bonusCount){
    const d=dice.slice().sort();
    if (level===0){
      if (Math.random()<0.15) return dice.map((_,i)=>i).filter(()=>Math.random()<0.5);
      const c=counts(dice);
      if (hasRun(c,4)&&!card["ls"]) { const keep=[],used=new Set(); dice.forEach((x,i)=>{ if(!used.has(x)){used.add(x);keep.push(i);} }); return keep.length===5?null:keep; }
      let face=6, n=0; for(let v=6;v>=1;v--) if(c[v]>n){n=c[v];face=v;}
      if (n===5) return null;
      return dice.map((x,i)=>x===face?i:-1).filter(i=>i>=0);
    }
    if (level===1 && Math.random()<0.3){ const c=counts(dice); let face=6,n=0; for(let v=6;v>=1;v--) if(c[v]>n){n=c[v];face=v;} return dice.map((x,i)=>x===face?i:-1).filter(i=>i>=0); }
    const pl=planner(level,card,roundsLeft,bonusCount);
    const h=pl.bestHold(d,rollsLeft);
    if (!h) return null;
    const idx=[], pool=dice.map((x,i)=>({x,i}));
    for(const v of h){ const k=pool.findIndex(o=>o.x===v); idx.push(pool[k].i); pool.splice(k,1); }
    return idx;
  }
  function chooseBox(level,dice,card,roundsLeft,bonusCount){
    const opts=allowed(dice,card);
    if (level===0){
      const sc=opts.map(b=>({b,s:score(b,dice,card)})).sort((a,b)=>b.s-a.s);
      return Math.random()<0.25 ? sc[Math.floor(Math.random()*Math.min(3,sc.length))].b : sc[0].b;
    }
    return planner(level,card,roundsLeft,bonusCount).bestBox(dice.slice().sort());
  }
  root.DiceRules={BOXES,NAMES,score,allowed,fiveBonus,totals,isFive,chooseHold,chooseBox};
})(typeof window!=="undefined"?window:globalThis);
