// Glorg's Games chess engine: rules + search. Runs on the page (for rules) and in a Web Worker (for thinking).
function ChessCore(){
  const WHITE=8, BLACK=16, P=1, N=2, B=3, R=4, Q=5, K=6;
  const VAL=[0,100,320,330,500,900,20000];
  const NOFF=[-33,-31,-18,-14,14,18,31,33], BOFF=[-17,-15,15,17], ROFF=[-16,-1,1,16], KOFF=[-17,-16,-15,-1,1,15,16,17];
  const MATE=100000, INF=1e9;
  const PST=[null,
    [0,0,0,0,0,0,0,0, 50,50,50,50,50,50,50,50, 10,10,20,30,30,20,10,10, 5,5,10,25,25,10,5,5, 0,0,0,20,20,0,0,0, 5,-5,-10,0,0,-10,-5,5, 5,10,10,-20,-20,10,10,5, 0,0,0,0,0,0,0,0],
    [-50,-40,-30,-30,-30,-30,-40,-50, -40,-20,0,0,0,0,-20,-40, -30,0,10,15,15,10,0,-30, -30,5,15,20,20,15,5,-30, -30,0,15,20,20,15,0,-30, -30,5,10,15,15,10,5,-30, -40,-20,0,5,5,0,-20,-40, -50,-40,-30,-30,-30,-30,-40,-50],
    [-20,-10,-10,-10,-10,-10,-10,-20, -10,0,0,0,0,0,0,-10, -10,0,5,10,10,5,0,-10, -10,5,5,10,10,5,5,-10, -10,0,10,10,10,10,0,-10, -10,10,10,10,10,10,10,-10, -10,5,0,0,0,0,5,-10, -20,-10,-10,-10,-10,-10,-10,-20],
    [0,0,0,0,0,0,0,0, 5,10,10,10,10,10,10,5, -5,0,0,0,0,0,0,-5, -5,0,0,0,0,0,0,-5, -5,0,0,0,0,0,0,-5, -5,0,0,0,0,0,0,-5, -5,0,0,0,0,0,0,-5, 0,0,0,5,5,0,0,0],
    [-20,-10,-10,-5,-5,-10,-10,-20, -10,0,0,0,0,0,0,-10, -10,0,5,5,5,5,0,-10, -5,0,5,5,5,5,0,-5, 0,0,5,5,5,5,0,-5, -10,5,5,5,5,5,0,-10, -10,0,5,0,0,0,0,-10, -20,-10,-10,-5,-5,-10,-10,-20],
    [-30,-40,-40,-50,-50,-40,-40,-30, -30,-40,-40,-50,-50,-40,-40,-30, -30,-40,-40,-50,-50,-40,-40,-30, -30,-40,-40,-50,-50,-40,-40,-30, -20,-30,-30,-40,-40,-30,-30,-20, -10,-20,-20,-20,-20,-20,-20,-10, 20,20,0,0,0,0,20,20, 20,30,10,0,0,10,30,20]];
  const KEG=[-50,-40,-30,-20,-20,-30,-40,-50, -30,-20,-10,0,0,-10,-20,-30, -30,-10,20,30,30,20,-10,-30, -30,-10,30,40,40,30,-10,-30, -30,-10,30,40,40,30,-10,-30, -30,-10,20,30,30,20,-10,-30, -30,-30,0,0,0,0,-30,-30, -50,-30,-30,-30,-30,-30,-30,-50];

  // Fixed-seed random numbers so the page and the worker agree on position fingerprints
  let seed=0x2545F491;
  const rand=()=>{ seed=(seed+0x6D2B79F5)|0; let t=Math.imul(seed^(seed>>>15),1|seed); t=(t+Math.imul(t^(t>>>7),61|t))^t; return (t^(t>>>14))>>>0; };
  const Z=[]; for(let p=0;p<23;p++){ Z[p]=new Uint32Array(128); for(let s=0;s<128;s++) Z[p][s]=rand(); }
  const ZSIDE=rand(), ZC=new Uint32Array(16), ZEP=new Uint32Array(128);
  for(let i=0;i<16;i++) ZC[i]=rand(); for(let i=0;i<128;i++) ZEP[i]=rand();

  const board=new Int8Array(128);
  let side=WHITE, castle=0, ep=-1, half=0, full=1, hash=0;
  const kings={8:4,16:116};
  const hist=[];            // undo stack
  let reps=[];              // fingerprints of earlier game positions (for repetition)
  const CM=new Uint8Array(128).fill(15);
  CM[0x04]=15&~3; CM[0x00]=15&~2; CM[0x07]=15&~1; CM[0x74]=15&~12; CM[0x70]=15&~8; CM[0x77]=15&~4;

  const enc=(f,t,pr,fl)=>f|(t<<7)|(pr<<14)|(fl<<17);
  const mFrom=m=>m&127, mTo=m=>(m>>7)&127, mPromo=m=>(m>>14)&7, mFlag=m=>(m>>17)&7;

  function computeHash(){
    let h=0; for(let s=0;s<128;s++){ if(s&0x88){ s+=7; continue; } if(board[s]) h^=Z[board[s]][s]; }
    if(side===BLACK) h^=ZSIDE; h^=ZC[castle]; if(ep>=0) h^=ZEP[ep]; return h>>>0;
  }
  const START="rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
  function loadFen(fen){
    board.fill(0); hist.length=0;
    const [pos,s,c,e,h,f]=fen.split(" ");
    let r=7,file=0;
    for(const ch of pos){
      if(ch==="/"){ r--; file=0; continue; }
      if(/\d/.test(ch)){ file+=+ch; continue; }
      const col= ch===ch.toUpperCase()?WHITE:BLACK, t="pnbrqk".indexOf(ch.toLowerCase())+1;
      const sq=r*16+file; board[sq]=col|t; if(t===K) kings[col]=sq; file++;
    }
    side= s==="b"?BLACK:WHITE;
    castle=0; if(c.includes("K"))castle|=1; if(c.includes("Q"))castle|=2; if(c.includes("k"))castle|=4; if(c.includes("q"))castle|=8;
    ep= e==="-"?-1:(+e[1]-1)*16+(e.charCodeAt(0)-97);
    half=+h||0; full=+f||1; hash=computeHash();
  }
  function attacked(sq,by){
    if(by===WHITE){ if(!((sq-15)&0x88)&&board[sq-15]===(WHITE|P)) return true; if(!((sq-17)&0x88)&&board[sq-17]===(WHITE|P)) return true; }
    else { if(!((sq+15)&0x88)&&board[sq+15]===(BLACK|P)) return true; if(!((sq+17)&0x88)&&board[sq+17]===(BLACK|P)) return true; }
    for(const d of NOFF){ const s=sq+d; if(!(s&0x88)&&board[s]===(by|N)) return true; }
    for(const d of KOFF){ const s=sq+d; if(!(s&0x88)&&board[s]===(by|K)) return true; }
    for(const d of BOFF){ let s=sq+d; while(!(s&0x88)){ const pc=board[s]; if(pc){ if((pc&24)===by&&((pc&7)===B||(pc&7)===Q)) return true; break; } s+=d; } }
    for(const d of ROFF){ let s=sq+d; while(!(s&0x88)){ const pc=board[s]; if(pc){ if((pc&24)===by&&((pc&7)===R||(pc&7)===Q)) return true; break; } s+=d; } }
    return false;
  }
  const inCheck=c=>attacked(kings[c],c^24);
  function gen(capsOnly){
    const out=[], us=side, them=side^24;
    for(let sq=0;sq<128;sq++){
      if(sq&0x88){ sq+=7; continue; }
      const pc=board[sq]; if(!pc||(pc&24)!==us) continue;
      const t=pc&7;
      if(t===P){
        const dir= us===WHITE?16:-16, startR= us===WHITE?1:6, promoR= us===WHITE?7:0, to=sq+dir;
        if(!(to&0x88)&&!board[to]){
          if((to>>4)===promoR){ out.push(enc(sq,to,Q,0)); if(!capsOnly){ out.push(enc(sq,to,R,0),enc(sq,to,B,0),enc(sq,to,N,0)); } }
          else if(!capsOnly){ out.push(enc(sq,to,0,0)); if((sq>>4)===startR&&!board[to+dir]) out.push(enc(sq,to+dir,0,4)); }
        }
        for(const d of [dir-1,dir+1]){ const c=sq+d; if(c&0x88) continue;
          if(board[c]&&(board[c]&24)===them){ if((c>>4)===promoR){ out.push(enc(sq,c,Q,0),enc(sq,c,R,0),enc(sq,c,B,0),enc(sq,c,N,0)); } else out.push(enc(sq,c,0,0)); }
          else if(c===ep) out.push(enc(sq,c,0,1)); }
        continue;
      }
      if(t===N||t===K){
        for(const d of (t===N?NOFF:KOFF)){ const s=sq+d; if(s&0x88) continue; const o=board[s];
          if(!o){ if(!capsOnly) out.push(enc(sq,s,0,0)); } else if((o&24)===them) out.push(enc(sq,s,0,0)); }
        if(t===K&&!capsOnly){
          if(us===WHITE&&sq===4){
            if((castle&1)&&!board[5]&&!board[6]&&board[7]===(WHITE|R)&&!attacked(4,BLACK)&&!attacked(5,BLACK)&&!attacked(6,BLACK)) out.push(enc(4,6,0,2));
            if((castle&2)&&!board[3]&&!board[2]&&!board[1]&&board[0]===(WHITE|R)&&!attacked(4,BLACK)&&!attacked(3,BLACK)&&!attacked(2,BLACK)) out.push(enc(4,2,0,2));
          } else if(us===BLACK&&sq===0x74){
            if((castle&4)&&!board[0x75]&&!board[0x76]&&board[0x77]===(BLACK|R)&&!attacked(0x74,WHITE)&&!attacked(0x75,WHITE)&&!attacked(0x76,WHITE)) out.push(enc(0x74,0x76,0,2));
            if((castle&8)&&!board[0x73]&&!board[0x72]&&!board[0x71]&&board[0x70]===(BLACK|R)&&!attacked(0x74,WHITE)&&!attacked(0x73,WHITE)&&!attacked(0x72,WHITE)) out.push(enc(0x74,0x72,0,2));
          }
        }
        continue;
      }
      const dirs= t===B?BOFF:t===R?ROFF:KOFF;
      for(const d of dirs){ let s=sq+d; while(!(s&0x88)){ const o=board[s];
        if(!o){ if(!capsOnly) out.push(enc(sq,s,0,0)); } else { if((o&24)===them) out.push(enc(sq,s,0,0)); break; } s+=d; } }
    }
    return out;
  }
  function make(m){
    const f=mFrom(m), t=mTo(m), pr=mPromo(m), fl=mFlag(m), pc=board[f], us=side;
    const capSq= fl&1 ? t+(us===WHITE?-16:16) : t, cap=board[capSq];
    hist.push([m,cap,castle,ep,half,hash]);
    let h=hash^Z[pc][f];
    if(cap) h^=Z[cap][capSq];
    board[capSq]=0; board[f]=0;
    const np= pr ? (us|pr) : pc; board[t]=np; h^=Z[np][t];
    if(fl&2){ const rf= t>f? f+3 : f-4, rt= t>f? f+1 : f-1, rk=board[rf]; board[rf]=0; board[rt]=rk; h^=Z[rk][rf]^Z[rk][rt]; }
    if(ep>=0) h^=ZEP[ep];
    ep= fl&4 ? (f+t)>>1 : -1; if(ep>=0) h^=ZEP[ep];
    h^=ZC[castle]; castle&=CM[f]&CM[t]; h^=ZC[castle];
    half= ((pc&7)===P||cap) ? 0 : half+1;
    if((pc&7)===K) kings[us]=t;
    if(us===BLACK) full++;
    side^=24; h^=ZSIDE; hash=h>>>0;
  }
  function unmake(){
    const [m,cap,c,e,hf,h]=hist.pop(), f=mFrom(m), t=mTo(m), pr=mPromo(m), fl=mFlag(m);
    side^=24; const us=side;
    const pc= pr ? (us|P) : board[t];
    board[f]=pc; board[t]=0;
    if(fl&1) board[t+(us===WHITE?-16:16)]=cap; else board[t]=cap;
    if(fl&2){ const rf= t>f? f+3 : f-4, rt= t>f? f+1 : f-1; board[rf]=board[rt]; board[rt]=0; }
    if((pc&7)===K) kings[us]=f;
    if(us===BLACK) full--;
    castle=c; ep=e; half=hf; hash=h;
  }
  function legal(){ const out=[]; for(const m of gen(false)){ make(m); if(!inCheck(side^24)) out.push(m); unmake(); } return out; }

  let noiseSeed=0, noiseAmp=0;
  function evaluate(){
    let s=0, npm=0, bw=0, bb=0; let kw=0, kb=0;
    for(let sq=0;sq<128;sq++){
      if(sq&0x88){ sq+=7; continue; }
      const pc=board[sq]; if(!pc) continue;
      const t=pc&7, c=pc&24, idx= c===WHITE ? (7-(sq>>4))*8+(sq&7) : (sq>>4)*8+(sq&7);
      if(t===K){ if(c===WHITE) kw=idx; else kb=idx; continue; }
      const v=VAL[t]+PST[t][idx];
      if(c===WHITE){ s+=v; if(t===B) bw++; } else { s-=v; if(t===B) bb++; }
      if(t!==P) npm+=VAL[t];
    }
    const eg= npm<=2600;
    s+= (eg?KEG[kw]:PST[K][kw]) - (eg?KEG[kb]:PST[K][kb]);
    if(bw>=2) s+=30; if(bb>=2) s-=30;
    if(noiseAmp) s+= ((Math.imul(hash^noiseSeed,0x45d9f3b)>>>0)%(2*noiseAmp+1))-noiseAmp;
    return side===WHITE?s:-s;
  }

  // ---------- Search ----------
  let nodes=0, stopAt=0, stopped=false, tt=new Map(), killers=[];
  const order=(ms,ttm,ply)=>{
    const sc=ms.map(m=>{
      if(m===ttm) return 1e7;
      const t=mTo(m), victim= mFlag(m)&1 ? P : board[t]&7;
      if(victim) return 1e6+VAL[victim]*10-VAL[board[mFrom(m)]&7]/10;
      if(mPromo(m)) return 9e5+VAL[mPromo(m)];
      if(killers[ply]===m) return 8e5;
      return 0;
    });
    const idx=ms.map((_,i)=>i).sort((a,b)=>sc[b]-sc[a]); return idx.map(i=>ms[i]);
  };
  function repeated(){
    for(let k=2;k<=half && k<=hist.length;k+=2) if(hist[hist.length-k][5]===hash) return true;
    return reps.includes(hash);
  }
  function quiesce(alpha,beta,ply){
    nodes++; if((nodes&2047)===0&&Date.now()>stopAt) stopped=true; if(stopped) return 0;
    const stand=evaluate(); if(stand>=beta) return beta; if(stand>alpha) alpha=stand;
    if(ply>48) return alpha;
    for(const m of order(gen(true),0,ply)){
      make(m); if(inCheck(side^24)){ unmake(); continue; }
      const sc=-quiesce(-beta,-alpha,ply+1); unmake();
      if(stopped) return 0;
      if(sc>=beta) return beta; if(sc>alpha) alpha=sc;
    }
    return alpha;
  }
  function negamax(depth,alpha,beta,ply){
    if(ply>0&&(half>=100||repeated())) return 0;
    const chk=inCheck(side); if(chk) depth++;
    if(depth<=0) return quiesce(alpha,beta,ply);
    nodes++; if((nodes&2047)===0&&Date.now()>stopAt) stopped=true; if(stopped) return 0;
    const e=tt.get(hash); let ttm=0;
    if(e){ ttm=e.m; if(e.d>=depth&&ply>0){ if(e.f===0) return e.s; if(e.f===1&&e.s>=beta) return e.s; if(e.f===2&&e.s<=alpha) return e.s; } }
    let best=-INF, bestM=0, any=false; const a0=alpha;
    for(const m of order(gen(false),ttm,ply)){
      make(m); if(inCheck(side^24)){ unmake(); continue; }
      any=true; const sc=-negamax(depth-1,-beta,-alpha,ply+1); unmake();
      if(stopped) return 0;
      if(sc>best){ best=sc; bestM=m; if(sc>alpha){ alpha=sc; if(alpha>=beta){ if(!board[mTo(m)]) killers[ply]=m; break; } } }
    }
    if(!any) return chk ? -MATE+ply : 0;
    tt.set(hash,{d:depth,s:best,f: best<=a0?2: best>=beta?1:0, m:bestM});
    if(tt.size>250000) tt.clear();
    return best;
  }
  // level: 0 Easy, 1 Medium, 2 Hard, 3 Expert, 4 Hint
  function think(level){
    const root=legal(); if(!root.length) return 0;
    if(root.length===1) return root[0];
    nodes=0; stopped=false; killers=[]; noiseSeed=(Math.random()*4294967295)>>>0;
    const pickWithin=(scored,margin)=>{ scored.sort((a,b)=>b.s-a.s); const pool=scored.filter(x=>x.s>=scored[0].s-margin); return pool[Math.floor(Math.random()*pool.length)].m; };
    if(level<=1){
      noiseAmp= level===0?35:12; stopAt=Date.now()+4000;
      const depth= level===0?0:1;
      const scored=root.map(m=>{ make(m); const s=-negamax(depth,-INF,INF,1); unmake(); return {m,s}; });
      noiseAmp=0;
      const r=Math.random();
      if(level===0) return r<0.3 ? pickWithin(scored,280) : pickWithin(scored,110);
      return r<0.1 ? pickWithin(scored,90) : pickWithin(scored,30);
    }
    const timeMs= level===2?650: level===3?1500: 700, maxD= level===2?4: level===3?64: 5;
    noiseAmp= (level===2||level===3) && full<=6 ? 8 : 0;
    stopAt=Date.now()+timeMs;
    let best=root[0], prev=root[0];
    for(let d=1; d<=maxD; d++){
      let alpha=-INF, bm=0;
      const ordered=[prev,...root.filter(m=>m!==prev)];
      for(const m of ordered){
        make(m); const s=-negamax(d-1,-INF,-alpha,1); unmake();
        if(stopped) break;
        if(s>alpha){ alpha=s; bm=m; }
      }
      if(stopped) break;
      best=bm; prev=bm;
      if(Math.abs(alpha)>MATE-200) break;
      if(Date.now()>stopAt-(timeMs*0.45)) break;   // not enough time for another full pass
    }
    noiseAmp=0;
    return best;
  }

  // ---------- Helpers for the page ----------
  const SQN=sq=>"abcdefgh"[sq&7]+((sq>>4)+1);
  const LET=["","","N","B","R","Q","K"];
  function san(m,leg){
    const f=mFrom(m), t=mTo(m), pc=board[f], ty=pc&7, cap= board[t]||(mFlag(m)&1);
    let s;
    if(mFlag(m)&2) s= t>f?"O-O":"O-O-O";
    else if(ty===P){ s=(cap?"abcdefgh"[f&7]+"x":"")+SQN(t)+(mPromo(m)?"="+LET[mPromo(m)]:""); }
    else {
      const others=leg.filter(o=>o!==m&&mTo(o)===t&&(board[mFrom(o)]&7)===ty&&mFrom(o)!==f);
      let dis="";
      if(others.length){ const sameFile=others.some(o=>(mFrom(o)&7)===(f&7)), sameRank=others.some(o=>(mFrom(o)>>4)===(f>>4));
        dis= !sameFile ? "abcdefgh"[f&7] : !sameRank ? String((f>>4)+1) : SQN(f); }
      s=LET[ty]+dis+(cap?"x":"")+SQN(t);
    }
    make(m); if(inCheck(side)) s+= legal().length?"+":"#"; unmake();
    return s;
  }
  function insufficient(){
    const pcs=[]; for(let s=0;s<128;s++){ if(s&0x88){ s+=7; continue; } const pc=board[s]; if(pc&&(pc&7)!==K) pcs.push(pc&7); }
    return pcs.length===0 || (pcs.length===1&&(pcs[0]===N||pcs[0]===B));
  }
  function perft(d){ if(!d) return 1; let n=0; for(const m of gen(false)){ make(m); if(!inCheck(side^24)) n+=perft(d-1); unmake(); } return n; }

  return {
    WHITE,BLACK,P,N,B,R,Q,K,START,
    loadFen, legal, make, unmake, inCheck, think, san, insufficient, perft, evaluate,
    from:mFrom, to:mTo, promo:mPromo, flag:mFlag,
    get side(){return side}, get hash(){return hash}, get half(){return half}, get full(){return full},
    piece:sq=>board[sq], kingSq:c=>kings[c], setReps:r=>{reps=r||[];}, sqName:SQN,
  };
}
// In a Web Worker: answer "think" requests
if (typeof window==="undefined" && typeof self!=="undefined"){
  const E=ChessCore();
  self.onmessage=e=>{
    const {id,moves,level}=e.data;
    E.loadFen(E.START); const reps=[];
    for(const m of moves){ reps.push(E.hash); E.make(m); }
    E.setReps(reps);
    const m=E.think(level);
    self.postMessage({id,m});
  };
}
