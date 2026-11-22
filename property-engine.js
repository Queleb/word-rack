// Cat Property: Monopoly-style rules on a cat-themed board, plus the cats' strategy.
// Pure game logic with a JSON-friendly state, shared by the game page and the tests.
(function(root){
  "use strict";
  // ---------- Board ----------
  const S_=(n,g,price,rent,hc)=>({t:"st",n,g,price,rent,hc});
  const BOARD=[
    {t:"go",n:"Breakfast Time",icon:"🍳"},
    S_("Litter Lane","brown",60,[2,10,30,90,160,250],50),
    {t:"jar",n:"Treat Jar",icon:"🍪"},
    S_("Kibble Court","brown",60,[4,20,60,180,320,450],50),
    {t:"tax",n:"Vet Bill",amt:200,icon:"💉"},
    {t:"rail",n:"Laser Line North",price:200,icon:"🔴"},
    S_("Yarn Street","lightblue",100,[6,30,90,270,400,550],50),
    {t:"box",n:"Mystery Box",icon:"📦"},
    S_("Feather Way","lightblue",100,[6,30,90,270,400,550],50),
    S_("Catnip Corner","lightblue",120,[8,40,100,300,450,600],50),
    {t:"jail",n:"Vet's Office",icon:"🏥"},
    S_("Whisker Walk","pink",140,[10,50,150,450,625,750],100),
    {t:"util",n:"Tuna Cannery",price:150,icon:"🐟"},
    S_("Paw Print Place","pink",140,[10,50,150,450,625,750],100),
    S_("Scratch Post Row","pink",160,[12,60,180,500,700,900],100),
    {t:"rail",n:"Laser Line East",price:200,icon:"🔴"},
    S_("Sunbeam Street","orange",180,[14,70,200,550,750,950],100),
    {t:"jar",n:"Treat Jar",icon:"🍪"},
    S_("Windowsill Way","orange",180,[14,70,200,550,750,950],100),
    S_("Cardboard Box Blvd","orange",200,[16,80,220,600,800,1000],100),
    {t:"nap",n:"Nap Spot",icon:"💤"},
    S_("Mouse Toy Mews","red",220,[18,90,250,700,875,1050],150),
    {t:"box",n:"Mystery Box",icon:"📦"},
    S_("Jingle Ball Junction","red",220,[18,90,250,700,875,1050],150),
    S_("Bird Watch Avenue","red",240,[20,100,300,750,925,1100],150),
    {t:"rail",n:"Laser Line South",price:200,icon:"🔴"},
    S_("Cream Saucer Square","yellow",260,[22,110,330,800,975,1150],150),
    S_("Salmon Strand","yellow",260,[22,110,330,800,975,1150],150),
    {t:"util",n:"Yarn Mill",price:150,icon:"🧶"},
    S_("Tuna Terrace","yellow",280,[24,120,360,850,1025,1200],150),
    {t:"gojail",n:"Go to the Vet",icon:"🚑"},
    S_("Velvet Cushion Court","green",300,[26,130,390,900,1100,1275],200),
    S_("Fluffy Rug Road","green",300,[26,130,390,900,1100,1275],200),
    {t:"jar",n:"Treat Jar",icon:"🍪"},
    S_("Heated Blanket Hill","green",320,[28,150,450,1000,1200,1400],200),
    {t:"rail",n:"Laser Line West",price:200,icon:"🔴"},
    {t:"box",n:"Mystery Box",icon:"📦"},
    S_("Catnip Palace","darkblue",350,[35,175,500,1100,1300,1500],200),
    {t:"tax",n:"Hairball Fee",amt:100,icon:"🤢"},
    S_("Golden Food Bowl","darkblue",400,[50,200,600,1400,1700,2000],200),
  ];
  const GROUPS={}; BOARD.forEach((s,i)=>{ const g= s.t==="st"?s.g: s.t==="rail"?"rail": s.t==="util"?"util": null; if(g){ (GROUPS[g]=GROUPS[g]||[]).push(i); s.grp=g; } });
  const GCOL={brown:"#8b5a3c",lightblue:"#8fd0f2",pink:"#d65fa0",orange:"#f08c32",red:"#d63c3c",yellow:"#e8c832",green:"#2f9a58",darkblue:"#2a4fa0",rail:"#555",util:"#999"};
  const GNAME={brown:"Brown",lightblue:"Light Blue",pink:"Pink",orange:"Orange",red:"Red",yellow:"Yellow",green:"Green",darkblue:"Dark Blue",rail:"Laser Lines",util:"Factories"};
  const ownable=i=>!!BOARD[i].grp;
  const JAIL=10, GO_PAY=200, JAIL_FINE=50, LAST_CAP=80;   // "last one standing" ends at round 80 if nobody's bankrupt

  // ---------- Cards ----------
  const MBOX=[
    {txt:"Breakfast is served! Advance to Breakfast Time and collect $200.",t:"move",to:0},
    {txt:"You spotted a bird! Advance to Bird Watch Avenue.",t:"move",to:24},
    {txt:"Zoomies! Dash to Whisker Walk.",t:"move",to:11},
    {txt:"Chase the laser to the nearest Laser Line. If owned, pay double rent.",t:"rail"},
    {txt:"Chase the laser to the nearest Laser Line. If owned, pay double rent.",t:"rail"},
    {txt:"Follow your nose to the nearest factory. If owned, pay 10× a dice roll.",t:"util"},
    {txt:"You found a lost toy mouse under the couch. Collect $50.",t:"cash",n:50},
    {txt:"Get Out of the Vet Free. Keep this card until you need it.",t:"free"},
    {txt:"You chased your tail. Go back 3 spaces.",t:"rel",n:-3},
    {txt:"Uh oh, checkup time. Go directly to the Vet's Office. Do not collect $200.",t:"jail"},
    {txt:"You scratched up the curtains. Pay $25 per house and $100 per hotel.",t:"rep",h:25,H:100},
    {txt:"Caught doing zoomies indoors. Pay a $15 fine.",t:"cash",n:-15},
    {txt:"Take a ride on Laser Line North.",t:"move",to:5},
    {txt:"Treat yourself: advance to the Golden Food Bowl.",t:"move",to:39},
    {txt:"You were elected Head Cat. Pay each player $50.",t:"each",n:-50},
    {txt:"Your nap savings matured. Collect $150.",t:"cash",n:150},
  ];
  const TJAR=[
    {txt:"Breakfast time! Advance to Breakfast Time and collect $200.",t:"move",to:0},
    {txt:"The treat dispenser malfunctioned in your favor. Collect $200.",t:"cash",n:200},
    {txt:"Annual checkup. Pay $50.",t:"cash",n:-50},
    {txt:"You sold some catnip. Collect $50.",t:"cash",n:50},
    {txt:"Get Out of the Vet Free. Keep this card until you need it.",t:"free"},
    {txt:"You ate a houseplant. Go directly to the Vet's Office.",t:"jail"},
    {txt:"Holiday treats! Collect $100.",t:"cash",n:100},
    {txt:"Refund on an unused cat bed. Collect $20.",t:"cash",n:20},
    {txt:"It's your birthday! Collect $10 from every player.",t:"each",n:10},
    {txt:"Ninth-life bonus. Collect $100.",t:"cash",n:100},
    {txt:"Hairball treatment. Pay $100.",t:"cash",n:-100},
    {txt:"Obedience school fees (you skipped every class). Pay $50.",t:"cash",n:-50},
    {txt:"Mouse-catching consultation fee. Collect $25.",t:"cash",n:25},
    {txt:"You knocked over the furniture. Pay $40 per house and $115 per hotel.",t:"rep",h:40,H:115},
    {txt:"Second place in the cat show. Collect $10.",t:"cash",n:10},
    {txt:"You inherited a sunny windowsill fund. Collect $100.",t:"cash",n:100},
  ];

  // Random numbers can be swapped for a seeded source, so look-ahead can replay identical dice for each option
  let R=Math.random;
  const seeded=seed=>()=>{ seed=(seed+0x6D2B79F5)|0; let t=Math.imul(seed^(seed>>>15),1|seed); t=(t+Math.imul(t^(t>>>7),61|t))^t; return ((t^(t>>>14))>>>0)/4294967296; };
  const rnd=n=>Math.floor(R()*n);
  function shuffle(a){ for(let i=a.length-1;i>0;i--){ const j=rnd(i+1); [a[i],a[j]]=[a[j],a[i]]; } return a; }

  // ---------- Game setup ----------
  // opts: {players:[{name,cat,human,level,color}], mode:"last"|"rounds"|"worth", rounds, target}
  function newGame(opts){
    const S={
      v:1, players:opts.players.map(p=>({...p,cash:1500,pos:0,jail:false,jailTurns:0,cards:0,out:false})),
      owner:Array(40).fill(-1), houses:Array(40).fill(0), mort:Array(40).fill(false),
      decks:{box:shuffle(MBOX.map((_,i)=>i)),jar:shuffle(TJAR.map((_,i)=>i))}, freeOut:{box:false,jar:false},
      cur:0, round:1, phase:"turn", actor:0, dice:[0,0], dbl:0, rolled:false,
      pending:null, auction:null, debts:[], after:null, lastCard:null,
      mode:opts.mode||"last", rounds:opts.rounds||30, target:opts.target||5000,
      log:[], events:[], over:false, winner:-1, offers:{}, declined:{}, turnCount:0,
    };
    log(S,`Game on! ${S.players.map(p=>p.name).join(", ")}.`);
    return S;
  }
  const log=(S,t)=>{ S.log.push(t); if(S.log.length>120) S.log.shift(); };
  const ev=(S,e)=>{ S.events.push(e); };
  const alive=S=>S.players.map((p,i)=>i).filter(i=>!S.players[i].out);
  const name=(S,i)=>i<0?"the bank":S.players[i].name;

  // ---------- Money ----------
  function give(S,i,n){ if(i>=0){ S.players[i].cash+=n; ev(S,{t:"cash",p:i,n}); } }
  // Charge someone; if they can't cover it, they owe a debt they must settle before play continues
  function charge(S,who,amount,to,why){
    if (amount<=0) return;
    const p=S.players[who];
    if (p.cash>=amount){ p.cash-=amount; ev(S,{t:"cash",p:who,n:-amount}); give(S,to,amount); if(why) log(S,why); return; }
    S.debts.push({who,amount,to,why});
  }
  // Move on to the next phase, unless a debt has to be settled first
  function go(S,phase,actor){
    if (S.debts.length){ if(!S.after) S.after={phase,actor}; S.phase="debt"; S.actor=S.debts[0].who; return; }
    S.phase=phase; S.actor=actor;
  }

  // ---------- Property helpers ----------
  const groupOf=i=>GROUPS[BOARD[i].grp];
  const ownsAll=(S,p,g)=>GROUPS[g].every(j=>S.owner[j]===p);
  const groupHasHouses=(S,i)=>groupOf(i).some(j=>S.houses[j]>0);
  function rentFor(S,i,diceSum,mult){
    const s=BOARD[i], o=S.owner[i];
    if (s.t==="st"){ const h=S.houses[i]; if(h) return s.rent[h]; return s.rent[0]*(ownsAll(S,o,s.g)?2:1); }
    if (s.t==="rail"){ const n=GROUPS.rail.filter(j=>S.owner[j]===o).length; return 25*Math.pow(2,n-1)*(mult||1); }
    if (s.t==="util"){ if (mult) return diceSum*10; const n=GROUPS.util.filter(j=>S.owner[j]===o).length; return diceSum*(n===2?10:4); }
    return 0;
  }
  function canBuild(S,p,i){
    const s=BOARD[i]; if (s.t!=="st"||S.owner[i]!==p||!ownsAll(S,p,s.g)) return false;
    const g=GROUPS[s.g]; if (g.some(j=>S.mort[j])) return false;
    if (S.houses[i]>=5) return false;
    return S.houses[i]<=Math.min(...g.map(j=>S.houses[j])) && S.players[p].cash>=s.hc;
  }
  function canSell(S,p,i){
    const s=BOARD[i]; if (s.t!=="st"||S.owner[i]!==p||!S.houses[i]) return false;
    return S.houses[i]>=Math.max(...GROUPS[s.g].map(j=>S.houses[j]));
  }
  const canMortgage=(S,p,i)=>S.owner[i]===p&&!S.mort[i]&&!(BOARD[i].t==="st"&&groupHasHouses(S,i));
  const unmortCost=i=>Math.ceil(BOARD[i].price/2*1.1);
  const canUnmortgage=(S,p,i)=>S.owner[i]===p&&S.mort[i]&&S.players[p].cash>=unmortCost(i);
  function build(S,p,i){ if(!canBuild(S,p,i)) return false; S.players[p].cash-=BOARD[i].hc; S.houses[i]++; ev(S,{t:"cash",p,n:-BOARD[i].hc}); log(S,`${name(S,p)} built ${S.houses[i]===5?"a hotel":"a house"} on ${BOARD[i].n}.`); return true; }
  function sellHouse(S,p,i){ if(!canSell(S,p,i)) return false; S.houses[i]--; give(S,p,BOARD[i].hc/2); log(S,`${name(S,p)} sold a house on ${BOARD[i].n}.`); return true; }
  function mortgage(S,p,i){ if(!canMortgage(S,p,i)) return false; S.mort[i]=true; give(S,p,BOARD[i].price/2); log(S,`${name(S,p)} mortgaged ${BOARD[i].n}.`); return true; }
  function unmortgage(S,p,i){ if(!canUnmortgage(S,p,i)) return false; const c=unmortCost(i); S.players[p].cash-=c; ev(S,{t:"cash",p,n:-c}); S.mort[i]=false; log(S,`${name(S,p)} paid off the mortgage on ${BOARD[i].n}.`); return true; }
  // Most cash a player could raise by selling all buildings and mortgaging everything
  function liquidValue(S,p){
    let v=S.players[p].cash;
    for(let i=0;i<40;i++) if(S.owner[i]===p){ v+=S.houses[i]*(BOARD[i].hc||0)/2; if(!S.mort[i]) v+=BOARD[i].price/2; }
    return v;
  }
  function netWorth(S,p){
    let v=S.players[p].cash;
    for(let i=0;i<40;i++) if(S.owner[i]===p){ v+= S.mort[i]?BOARD[i].price/2:BOARD[i].price; v+=S.houses[i]*(BOARD[i].hc||0); }
    return v;
  }

  // ---------- Turn flow ----------
  function rollDice(S){ S.dice=[1+rnd(6),1+rnd(6)]; ev(S,{t:"dice",d:S.dice.slice()}); return S.dice; }
  function moveTo(S,p,to,collectGo){
    const pl=S.players[p], from=pl.pos;
    if (collectGo!==false && to<from){ give(S,p,GO_PAY); log(S,`${name(S,p)} passed Breakfast Time and collected $${GO_PAY}.`); }
    pl.pos=to; ev(S,{t:"move",p,from,to});
  }
  function sendToJail(S,p){
    const pl=S.players[p]; pl.pos=JAIL; pl.jail=true; pl.jailTurns=0; ev(S,{t:"jail",p});
    log(S,`${name(S,p)} went to the Vet's Office.`);
  }
  // Roll at the start of a turn (or to try to leave the Vet's Office)
  function roll(S){
    if (S.over||S.phase!=="turn") return false;
    const p=S.cur, pl=S.players[p], [a,b]=rollDice(S), dbl=a===b;
    if (pl.jail){
      if (dbl){ pl.jail=false; pl.jailTurns=0; log(S,`${name(S,p)} rolled doubles and left the Vet's Office.`); advance(S,p,a+b,false); return true; }
      pl.jailTurns++;
      if (pl.jailTurns>=3){ log(S,`${name(S,p)} paid $${JAIL_FINE} to leave the Vet's Office.`); pl.jail=false; pl.jailTurns=0; charge(S,p,JAIL_FINE,-1); advance(S,p,a+b,false); return true; }
      log(S,`${name(S,p)} stays at the Vet's Office.`); S.rolled=true; go(S,"post",p); return true;
    }
    if (dbl){ S.dbl++; if (S.dbl>=3){ log(S,`${name(S,p)} rolled doubles three times. Off to the Vet!`); sendToJail(S,p); S.rolled=true; go(S,"post",p); return true; } }
    advance(S,p,a+b,dbl);
    return true;
  }
  function advance(S,p,steps,again){
    const pl=S.players[p]; moveTo(S,p,(pl.pos+steps)%40);
    S.rolled=!again;
    land(S,p,again);
  }
  // Resolve the space a player landed on. `again` = rolled doubles, so they roll again after
  function land(S,p,again,mult){
    const pl=S.players[p], i=pl.pos, s=BOARD[i];
    const next=()=>{ if (pl.out||S.over) return; if (again&&!pl.jail) go(S,"turn",p); else { S.rolled=true; go(S,"post",p); } };
    S.landAgain=again;
    if (ownable(i)){
      const o=S.owner[i];
      if (o<0){ S.pending={i}; go(S,"buy",p); return; }
      if (o!==p && !S.mort[i]){
        const rent=rentFor(S,i,S.dice[0]+S.dice[1],mult);
        ev(S,{t:"rent",p,to:o,i,n:rent});
        charge(S,p,rent,o,`${name(S,p)} paid $${rent} rent to ${name(S,o)} for ${s.n}.`);
      }
      return next();
    }
    if (s.t==="tax"){ charge(S,p,s.amt,-1,`${name(S,p)} paid the $${s.amt} ${s.n}.`); return next(); }
    if (s.t==="gojail"){ sendToJail(S,p); S.rolled=true; return go(S,"post",p); }
    if (s.t==="box"||s.t==="jar") return drawCard(S,p,s.t,again);
    return next();
  }
  function drawCard(S,p,deck,again){
    const D=deck==="box"?MBOX:TJAR, pile=S.decks[deck];
    let idx=pile.shift();
    if (D[idx].t==="free" && S.freeOut[deck]){ pile.push(idx); idx=pile.shift(); }
    const c=D[idx]; S.lastCard={deck,txt:c.txt,p};
    ev(S,{t:"card",deck,txt:c.txt,p}); log(S,`${name(S,p)} drew: “${c.txt}”`);
    if (c.t==="free"){ S.freeOut[deck]=true; S.players[p].cards++; S.players[p].cardDecks=(S.players[p].cardDecks||[]).concat(deck); }
    else pile.push(idx);
    const pl=S.players[p];
    const next=()=>{ if (pl.out||S.over) return; if (again&&!pl.jail) go(S,"turn",p); else { S.rolled=true; go(S,"post",p); } };
    switch(c.t){
      case "move": moveTo(S,p,c.to); return land(S,p,again);
      case "rel": moveTo(S,p,(pl.pos+c.n+40)%40,false); return land(S,p,again);
      case "rail": { let j=pl.pos; do{ j=(j+1)%40; }while(BOARD[j].t!=="rail"); moveTo(S,p,j); return land(S,p,again,2); }
      case "util": { let j=pl.pos; do{ j=(j+1)%40; }while(BOARD[j].t!=="util"); moveTo(S,p,j);
        if (S.owner[j]>=0&&S.owner[j]!==p&&!S.mort[j]){ const [a,b]=rollDice(S); S.dice=[a,b]; } return land(S,p,again,S.owner[j]>=0?1:undefined); }
      case "cash": if (c.n>0) give(S,p,c.n); else charge(S,p,-c.n,-1); return next();
      case "jail": sendToJail(S,p); S.rolled=true; return go(S,"post",p);
      case "rep": { let h=0,H=0; for(let i=0;i<40;i++) if(S.owner[i]===p){ if(S.houses[i]===5) H++; else h+=S.houses[i]; } charge(S,p,h*c.h+H*c.H,-1); return next(); }
      case "each": for (const q of alive(S)) if (q!==p){ if (c.n<0) charge(S,p,-c.n,q); else charge(S,q,c.n,p); } return next();
      case "free": return next();
    }
    return next();
  }
  function buy(S){
    if (S.phase!=="buy") return false;
    const p=S.cur, i=S.pending.i, pr=BOARD[i].price;
    if (S.players[p].cash<pr) return false;
    S.players[p].cash-=pr; ev(S,{t:"cash",p,n:-pr}); S.owner[i]=p; ev(S,{t:"buy",p,i});
    log(S,`${name(S,p)} bought ${BOARD[i].n} for $${pr}.`);
    S.pending=null; afterLanding(S);
    return true;
  }
  function afterLanding(S){ const p=S.cur, pl=S.players[p]; if (S.landAgain&&!pl.jail&&!S.rolledOut) go(S,"turn",p); else { S.rolled=true; go(S,"post",p); } }
  // Turn down a property: everyone bids for it
  function decline(S){
    if (S.phase!=="buy") return false;
    const i=S.pending.i; S.pending=null;
    const order=[]; for(let k=0;k<S.players.length;k++){ const q=(S.cur+k)%S.players.length; if(!S.players[q].out) order.push(q); }
    S.auction={i,price:0,leader:-1,active:order,turnIdx:0};
    log(S,`${BOARD[i].n} goes up for auction.`);
    S.phase="auction"; S.actor=order[0];
    return true;
  }
  const minBid=S=>S.auction.leader<0?10:S.auction.price+10;
  function bid(S,p,amount){
    const A=S.auction; if (!A||S.phase!=="auction"||S.actor!==p) return false;
    amount=Math.floor(amount);
    if (amount<minBid(S)||amount>S.players[p].cash) return false;
    A.price=amount; A.leader=p; ev(S,{t:"bid",p,n:amount});
    nextBidder(S); return true;
  }
  function pass(S,p){
    const A=S.auction; if (!A||S.phase!=="auction"||S.actor!==p) return false;
    const k=A.active.indexOf(p); A.active.splice(k,1); ev(S,{t:"pass",p});
    if (k<=A.turnIdx) A.turnIdx--;
    nextBidder(S); return true;
  }
  function nextBidder(S){
    const A=S.auction;
    if (A.active.length===0 || (A.active.length===1&&A.leader===A.active[0])){
      if (A.leader>=0){ const w=A.leader; S.players[w].cash-=A.price; ev(S,{t:"cash",p:w,n:-A.price}); S.owner[A.i]=w; ev(S,{t:"buy",p:w,i:A.i}); log(S,`${name(S,w)} won ${BOARD[A.i].n} at auction for $${A.price}.`); }
      else log(S,`Nobody bid on ${BOARD[A.i].n}.`);
      S.auction=null; afterLanding(S); return;
    }
    A.turnIdx=(A.turnIdx+1)%A.active.length;
    if (A.active[A.turnIdx]===A.leader) A.turnIdx=(A.turnIdx+1)%A.active.length;
    S.actor=A.active[A.turnIdx];
  }
  function payJail(S){
    const p=S.cur, pl=S.players[p];
    if (S.phase!=="turn"||!pl.jail||pl.cash<JAIL_FINE) return false;
    pl.cash-=JAIL_FINE; ev(S,{t:"cash",p,n:-JAIL_FINE}); pl.jail=false; pl.jailTurns=0; log(S,`${name(S,p)} paid $${JAIL_FINE} to leave the Vet's Office.`); return true;
  }
  function useCard(S){
    const p=S.cur, pl=S.players[p];
    if (S.phase!=="turn"||!pl.jail||!pl.cards) return false;
    pl.cards--; const deck=(pl.cardDecks||["box"]).pop(); S.freeOut[deck]=false; S.decks[deck].push(MBOX.findIndex(c=>c.t==="free")>=0&&deck==="box"?MBOX.findIndex(c=>c.t==="free"):TJAR.findIndex(c=>c.t==="free"));
    pl.jail=false; pl.jailTurns=0; log(S,`${name(S,p)} used a Get Out of the Vet Free card.`); return true;
  }
  // ---------- Debts + bankruptcy ----------
  function payDebt(S){
    if (S.phase!=="debt") return false;
    const d=S.debts[0], p=S.players[d.who];
    if (p.cash<d.amount) return false;
    p.cash-=d.amount; ev(S,{t:"cash",p:d.who,n:-d.amount}); give(S,d.to,d.amount); if (d.why) log(S,d.why);
    S.debts.shift(); resumeAfterDebt(S); return true;
  }
  function resumeAfterDebt(S){
    if (S.debts.length){ S.actor=S.debts[0].who; return; }
    const a=S.after; S.after=null;
    if (S.over) return;
    if (a && !(S.players[a.actor]&&S.players[a.actor].out)) { S.phase=a.phase; S.actor=a.actor; if (a.phase==="turn"&&S.players[S.cur].out) endTurn(S); }
    else { S.phase="post"; S.actor=S.cur; if (S.players[S.cur].out) endTurn(S); }
  }
  function bankrupt(S){
    if (S.phase!=="debt") return false;
    const d=S.debts.shift(), who=d.who, to=d.to, pl=S.players[who];
    // sell all buildings to the bank first
    for(let i=0;i<40;i++) if (S.owner[i]===who && S.houses[i]){ pl.cash+=S.houses[i]*(BOARD[i].hc||0)/2; S.houses[i]=0; }
    if (to>=0){ give(S,to,pl.cash); for(let i=0;i<40;i++) if(S.owner[i]===who) S.owner[i]=to; S.players[to].cards+=pl.cards; S.players[to].cardDecks=(S.players[to].cardDecks||[]).concat(pl.cardDecks||[]); }
    else { for(let i=0;i<40;i++) if(S.owner[i]===who){ S.owner[i]=-1; S.mort[i]=false; }
      for(const dk of (pl.cardDecks||[])){ S.freeOut[dk]=false; S.decks[dk].push((dk==="box"?MBOX:TJAR).findIndex(c=>c.t==="free")); } }
    pl.cash=0; pl.out=true; pl.cards=0; pl.cardDecks=[];
    S.debts=S.debts.filter(x=>x.who!==who); S.debts.forEach(x=>{ if (x.to===who) x.to=-1; });
    ev(S,{t:"bankrupt",p:who,to}); log(S,`${name(S,who)} went bankrupt${to>=0?` to ${name(S,to)}`:""}!`);
    if (checkOver(S)) return true;
    resumeAfterDebt(S);
    return true;
  }
  // ---------- End of turn + game end ----------
  function endTurn(S){
    if (S.over) return false;
    if (S.phase!=="post" && !S.players[S.cur].out) return false;
    if (checkOver(S)) return true;
    S.dbl=0; S.rolled=false; S.turnCount++;
    let n=S.cur; do{ n=(n+1)%S.players.length; if (n===0) S.round++; } while(S.players[n].out);
    S.cur=n;
    if (checkOver(S)) return true;
    S.phase="turn"; S.actor=n; ev(S,{t:"turn",p:n});
    return true;
  }
  function checkOver(S){
    const left=alive(S);
    let over=left.length<=1;
    const human=S.players.findIndex(p=>p.human);
    if (human>=0 && S.players[human].out) over=true;
    if (S.mode==="rounds" && S.round>S.rounds) over=true;
    if ((S.mode==="last"||S.mode==="worth") && S.round>LAST_CAP){ over=true; S.timeUp=true; }
    if (S.mode==="worth" && left.some(p=>netWorth(S,p)>=S.target)) over=true;
    if (!over) return false;
    S.over=true; S.phase="over"; S.actor=-1;
    const ranked=left.slice().sort((a,b)=>netWorth(S,b)-netWorth(S,a));
    S.winner=ranked[0]; S.ranking=ranked.concat(S.players.map((_,i)=>i).filter(i=>S.players[i].out));
    log(S,`Game over! ${name(S,S.winner)} wins.`); ev(S,{t:"over",p:S.winner});
    return true;
  }
  // ---------- Trading ----------
  // deal: {a,b, aProps:[], bProps:[], aCash, bCash}  (a gives aProps + aCash, b gives bProps + bCash)
  function tradeValid(S,d){
    const ok=(p,props)=>props.every(i=>S.owner[i]===p && !(BOARD[i].t==="st"&&groupHasHouses(S,i)));
    return ok(d.a,d.aProps)&&ok(d.b,d.bProps)&&(d.aCash||0)<=S.players[d.a].cash&&(d.bCash||0)<=S.players[d.b].cash&&(d.aProps.length||d.bProps.length||d.aCash||d.bCash);
  }
  function doTrade(S,d){
    if (!tradeValid(S,d)) return false;
    d.aProps.forEach(i=>S.owner[i]=d.b); d.bProps.forEach(i=>S.owner[i]=d.a);
    if (d.aCash){ S.players[d.a].cash-=d.aCash; S.players[d.b].cash+=d.aCash; }
    if (d.bCash){ S.players[d.b].cash-=d.bCash; S.players[d.a].cash+=d.bCash; }
    ev(S,{t:"trade",a:d.a,b:d.b});
    log(S,`Trade: ${name(S,d.a)} gave ${describeSide(d.aProps,d.aCash)}; ${name(S,d.b)} gave ${describeSide(d.bProps,d.bCash)}.`);
    return true;
  }
  const describeSide=(props,cash)=>[...props.map(i=>BOARD[i].n),cash?`$${cash}`:""].filter(Boolean).join(" + ")||"nothing";

  // ---------- Cat strategy ----------
  const GROUP_RANK={brown:.8,lightblue:1.05,pink:1.0,orange:1.25,red:1.15,yellow:1.05,green:.95,darkblue:1.0,rail:1.0,util:.6};
  // How much property i is worth to player p (their own valuation)
  function valueTo(S,p,i,lv){
    const s=BOARD[i], g=s.grp, G=GROUPS[g];
    const mine=G.filter(j=>j!==i&&S.owner[j]===p).length, others=G.filter(j=>j!==i&&S.owner[j]>=0&&S.owner[j]!==p);
    let v=s.price*(lv>=3?GROUP_RANK[g]:1);
    if (g==="rail") v+=40*mine;
    else if (g==="util") v+=30*mine;
    else {
      if (mine===G.length-1) v+=s.price*1.4+180;              // completes a set
      else if (mine>0&&!others.length) v+=s.price*0.35;
      const ownersOthers=new Set(others.map(j=>S.owner[j]));
      if (lv>=2 && ownersOthers.size===1 && others.length===G.length-1) v+=s.price*0.7;   // blocks someone's set
    }
    if (S.mort[i]) v-=s.price*0.55;
    return v;
  }
  // How much more dangerous p's opponents would become if `q` gets property i (set completion)
  function threatGain(S,q,i){
    const g=BOARD[i].grp; if (g==="rail"||g==="util") return 30;
    const G=GROUPS[g]; const has=G.filter(j=>j!==i&&S.owner[j]===q).length;
    return has===G.length-1 ? BOARD[i].price*1.6+220 : has>0 ? BOARD[i].price*0.2 : 0;
  }
  // Biggest rent an opponent could charge right now
  function worstRent(S,p){
    let worst=0; for(let i=0;i<40;i++){ const o=S.owner[i]; if(o<0||o===p||S.mort[i]) continue;
      const s=BOARD[i]; let r=0;
      if (s.t==="st"){ const h=S.houses[i]; r=h?s.rent[h]:s.rent[0]*(ownsAll(S,o,s.g)?2:1); }
      else if (s.t==="rail") r=25*Math.pow(2,GROUPS.rail.filter(j=>S.owner[j]===o).length-1);
      if (r>worst) worst=r; }
    return worst;
  }
  // Expert: how much rent the next roll could cost, from where this player is standing
  const ROLLP=[0,0,1,2,3,4,5,6,5,4,3,2,1].map(n=>n/36);
  function nextRollDanger(S,p){
    const pos=S.players[p].pos; let exp=0, big=0;
    for (let r=2;r<=12;r++){
      const i=(pos+r)%40, o=S.owner[i], s=BOARD[i]; if (o<0||o===p||S.mort[i]||!s.grp) continue;
      const rent= s.t==="util" ? r*(GROUPS.util.every(j=>S.owner[j]===o)?10:4) : rentFor(S,i,r);
      exp+=ROLLP[r]*rent; if (ROLLP[r]>=3/36 && rent>big) big=rent;
    }
    return {exp,big};
  }
  // Cash a cat likes to keep on hand
  function reserve(S,p,lv){
    if (lv===0) return rnd(50);
    if (lv===1) return 60;
    const w=worstRent(S,p);
    const T=root.PROP_TUNE||{};
    if (lv===2) return Math.min(300,Math.max(30,w*0.25));
    const d=nextRollDanger(S,p);
    return Math.min(T.cap??700, Math.max(30, d.exp*(T.e??1.5)+d.big*(T.b??0.5)));
  }
  function shouldBuy(S,p,i,lv){
    const c=S.players[p].cash, pr=BOARD[i].price;
    if (c<pr) return false;
    if (lv===0) return R()<0.7;
    const completes=threatGain(S,p,i)>pr;
    if (completes) return true;
    if (lv===1) return c-pr>=50;
    if (S.round<8) return true;                                   // early on, buy everything you can
    let blocks=false; for (const q of alive(S)) if (q!==p && threatGain(S,q,i)>pr) blocks=true;
    return blocks || c-pr>=reserve(S,p,lv)*0.6;
  }
  function maxBid(S,p,i,lv){
    const c=S.players[p].cash, pr=BOARD[i].price;
    let v= lv===0 ? pr*(0.3+R()*0.6) : lv===1 ? pr*0.95 : valueTo(S,p,i,lv);
    if (lv>=2){ for (const q of alive(S)) if (q!==p) v=Math.max(v, Math.min(threatGain(S,q,i),pr*1.6)); }   // deny a set
    return Math.max(0, Math.min(v, c-(lv>=2?reserve(S,p,lv)*0.5:20)));
  }
  // Sell/mortgage until the debt can be paid (least valuable first). Returns true if it worked.
  function raiseFunds(S,p,need,lv){
    const pl=S.players[p];
    const props=()=>{ const a=[]; for(let i=0;i<40;i++) if(S.owner[i]===p) a.push(i); return a; };
    let guard=200;
    while (pl.cash<need && guard--){
      // mortgage plain properties not in a built-up set, cheapest-value first
      const m=props().filter(i=>canMortgage(S,p,i)).sort((a,b)=>valueTo(S,p,a,lv)-valueTo(S,p,b,lv));
      if (m.length){ mortgage(S,p,m[0]); continue; }
      const h=props().filter(i=>canSell(S,p,i)).sort((a,b)=>BOARD[a].hc-BOARD[b].hc);
      if (h.length){ sellHouse(S,p,h[0]); continue; }
      break;
    }
    return pl.cash>=need;
  }
  // Expert compares "build as planned" with "hold the cash" before spending
  function expertBuild(S,p,lv){
    if (!expert(S,p)) return aiBuild(S,p,lv);
    let any=false; for(let i=0;i<40;i++) if (canBuild(S,p,i)) any=true;
    if (!any) return aiBuild(S,p,lv);
    const k=lookahead(S,p,[C=>aiBuild(C,p,3),()=>{}]);
    return k===0 ? aiBuild(S,p,lv) : 0;
  }
  function aiBuild(S,p,lv){
    let built=0, guard=80;
    const keep= lv===0 ? 0 : lv===1 ? 60 : reserve(S,p,lv);
    const pick=()=>{ const opts=[]; for(let i=0;i<40;i++) if (canBuild(S,p,i)) opts.push(i);
      // even building; best sets first (Hard+ know orange/red pay best)
      opts.sort((a,b)=>(S.houses[a]-S.houses[b]) || ((lv>=2?GROUP_RANK[BOARD[b].g]-GROUP_RANK[BOARD[a].g]:0)) || (BOARD[b].hc-BOARD[a].hc));
      return opts[0]; };
    // Hard + Expert: mortgage spare properties to fund the first 3 houses on a set
    if (lv>=2){
      for (let g=0; g<20; g++){
        const i=(()=>{ for(let k=0;k<40;k++){ const s=BOARD[k]; if(s.t==="st"&&S.owner[k]===p&&ownsAll(S,p,s.g)&&S.houses[k]<3&&!GROUPS[s.g].some(j=>S.mort[j])) return k; } return -1; })();
        if (i<0 || S.players[p].cash>=BOARD[i].hc+keep) break;
        const spare=[]; for(let k=0;k<40;k++){ const s=BOARD[k]; if(S.owner[k]===p&&canMortgage(S,p,k)&&!(s.t==="st"&&ownsAll(S,p,s.g))) spare.push(k); }
        if (!spare.length) break;
        spare.sort((a,b)=>valueTo(S,p,a,lv)-valueTo(S,p,b,lv)); mortgage(S,p,spare[0]);
      }
    }
    while (guard--){
      const i=pick(); if (i===undefined) break;
      const cost=BOARD[i].hc, c=S.players[p].cash;
      const extra= lv===2 && S.houses[i]>=3 ? 60 : lv===3 && S.houses[i]>=3 ? ((root.PROP_TUNE||{}).extra??60) : 0;
      if (c-cost<keep+extra) break;
      if (lv===0 && R()<0.8) break;     // Glorg forgets to build most of the time
      build(S,p,i); built++;
    }
    // pay off mortgages when comfortable
    if (lv>=1) for(let i=0;i<40;i++) if (S.mort[i]&&S.owner[i]===p&&canUnmortgage(S,p,i)&&S.players[p].cash-unmortCost(i)>keep*2+150) unmortgage(S,p,i);
    return built;
  }
  // Would `p` (a cat) accept this deal? Returns {ok, gain}
  function judgeTrade(S,p,d,lv){
    const mine= p===d.a, giveProps= mine?d.aProps:d.bProps, getProps= mine?d.bProps:d.aProps;
    const giveCash= (mine?d.aCash:d.bCash)||0, getCash=(mine?d.bCash:d.aCash)||0, other= mine?d.b:d.a;
    let gain=getCash-giveCash;
    for (const i of getProps) gain+=valueTo(S,p,i,lv);
    for (const i of giveProps) gain-=valueTo(S,p,i,lv);
    if (lv>=1){ // what the other side gains matters too
      const sim=JSON.parse(JSON.stringify({owner:S.owner})); giveProps.forEach(i=>sim.owner[i]=other);
      for (const i of giveProps) gain-=threatGain({...S,owner:sim.owner},other,i)*(lv===1?0.6:lv===2?0.9:1);
    }
    if (giveCash && S.players[p].cash-giveCash<(lv>=2?reserve(S,p,lv)*0.5:50)) gain-=200;
    const need= lv===0 ? -40+rnd(60) : lv===1 ? 10 : lv===2 ? 30 : 50;
    return {ok:gain>=need, gain};
  }
  // A cat looks for a deal: swap pieces so both finish a set, or buy the last piece with cash
  function proposeDeal(S,p,lv){
    if (lv===0) return null;   // Glorg doesn't think to make trade offers
    const cash=S.players[p].cash;
    for (const g of Object.keys(GROUPS)){
      if (g==="rail"||g==="util") continue;
      const G=GROUPS[g], missing=G.filter(j=>S.owner[j]!==p);
      if (missing.length!==1 || G.filter(j=>S.owner[j]===p).length===0) continue;
      const i=missing[0], q=S.owner[i]; if (q<0||q===p||S.players[q].out||groupHasHouses(S,i)) continue;
      // something q needs from p?
      const offerProps=[];
      for (const g2 of Object.keys(GROUPS)){ if(g2===g||g2==="rail"||g2==="util") continue; const G2=GROUPS[g2], m2=G2.filter(j=>S.owner[j]!==q);
        if (m2.length===1 && S.owner[m2[0]]===p && !groupHasHouses(S,m2[0])) { offerProps.push(m2[0]); break; } }
      let deal;
      if (offerProps.length) deal={a:p,b:q,aProps:offerProps,bProps:[i],aCash:0,bCash:0};
      else { const pay=Math.round(Math.min(cash*0.6, BOARD[i].price*(lv===3?((root.PROP_TUNE||{}).pay??2.5):1.6+0.3*lv))/10)*10; if (pay<BOARD[i].price) continue; deal={a:p,b:q,aProps:[],bProps:[i],aCash:pay,bCash:0}; }
      const key=JSON.stringify([deal.aProps,deal.bProps,deal.aCash>0]);
      if ((S.declined[p]||[]).includes(key)) continue;
      if (!tradeValid(S,deal)) continue;
      if (!judgeTrade(S,p,{...deal},lv).ok && lv>=1) continue;
      deal.key=key; return deal;
    }
    return null;
  }
  function noteDeclined(S,p,deal){ (S.declined[p]=S.declined[p]||[]).push(deal.key); }
  // You answer a cat's trade offer
  function answerOffer(S,accept){
    if (S.phase!=="offer"||!S.offer) return false;
    const d=S.offer; S.offer=null;
    if (accept && tradeValid(S,d)) doTrade(S,d); else { noteDeclined(S,d.a,d); log(S,`You turned down ${name(S,d.a)}'s offer.`); }
    S.phase="turn"; S.actor=S.cur; return true;
  }

  // ---------- Expert look-ahead ----------
  // Play the next few rounds many times for each option (everyone using solid Hard-level play)
  // and pick the option that leaves this player best off on average.
  function rolloutScore(S,p,rounds){
    const endRound=S.round+rounds; let guard=4000;
    while (!S.over && S.round<endRound && guard--){ if (aiStep(S)===null) break; S.events.length=0; }
    if (S.players[p].out) return -3000;
    const me=netWorth(S,p); let best=0; for (const q of alive(S)) if (q!==p) best=Math.max(best,netWorth(S,q));
    return me-best;
  }
  function lookahead(S,p,options){
    const T=root.PROP_TUNE||{}, N=T.n??30, H=T.h??6;
    const base=JSON.parse(JSON.stringify({...S,log:[],events:[]}));
    base.players.forEach(q=>{ q.human=false; q.level=2; }); base.sim=true; base.offer=null;
    let bestK=0, bestV=-Infinity; const seedBase=(Math.random()*1e9)|0;
    options.forEach((fn,k)=>{
      let tot=0;
      for (let n=0;n<N;n++){ const C=JSON.parse(JSON.stringify(base)); const saved=R; R=seeded(seedBase+n*7919);
        try{ fn(C); tot+=rolloutScore(C,p,H); } finally { R=saved; } }
      if (tot>bestV){ bestV=tot; bestK=k; }
    });
    return bestK;
  }
  const expert=(S,p)=>S.players[p].level===3 && !S.sim;

  // One decision for whichever cat needs to act. Returns a short description, or null if nothing to do.
  function aiStep(S){
    if (S.over) return null;
    const p=S.actor, pl=S.players[p]; if (p<0||pl.human) return null;
    const lv=pl.level;
    switch (S.phase){
      case "debt": { const d=S.debts[0]; if (raiseFunds(S,p,d.amount,lv)) { payDebt(S); return "pay"; } bankrupt(S); return "bankrupt"; }
      case "buy": { const i=S.pending.i;
        if (expert(S,p) && pl.cash>=BOARD[i].price){ const k=lookahead(S,p,[C=>buy(C),C=>decline(C)]); if (k===0) buy(S); else decline(S); return "buy"; }
        if (shouldBuy(S,p,i,lv)) buy(S); else decline(S); return "buy"; }
      case "auction": { const i=S.auction.i, mb=maxBid(S,p,i,lv), next=minBid(S);
        if (next<=mb){ const inc= lv===0 ? 10*(1+rnd(3)) : 10; bid(S,p,Math.min(Math.floor(mb),next+inc-10)); } else pass(S,p); return "bid"; }
      case "turn": {
        if (!S.rolled && !S.preDone){
          S.preDone=true;
          // now and then, try to make a deal (cats trade with each other; offers to you pop up on screen)
          const last=S.offers[p]??-99, gap=S.players.length*(lv===0?4:2);
          if (S.turnCount-last>=gap){
            const deal=proposeDeal(S,p,lv);
            if (deal){ S.offers[p]=S.turnCount;
              const q=deal.b;
              if (S.players[q].human){ S.offer=deal; S.phase="offer"; S.actor=q; return "offer"; }
              let yes=judgeTrade(S,q,deal,S.players[q].level).ok;
              if (expert(S,q)) yes = lookahead(S,q,[C=>doTrade(C,deal),()=>{}])===0;
              if (yes && expert(S,p)) yes = lookahead(S,p,[C=>doTrade(C,deal),()=>{}])===0;
              if (yes) doTrade(S,deal); else noteDeclined(S,p,deal);
            }
          }
          expertBuild(S,p,lv); return "plan";
        }
        if (pl.jail && expert(S,p)){
          const opts=[C=>{ C.preDone=false; roll(C); }];
          if (pl.cards) opts.push(C=>{ useCard(C); C.preDone=false; roll(C); });
          else if (pl.cash>=JAIL_FINE) opts.push(C=>{ payJail(C); C.preDone=false; roll(C); });
          const k=opts.length>1?lookahead(S,p,opts):0;
          if (k===1){ if (pl.cards) useCard(S); else payJail(S); }
          S.preDone=false; roll(S); return "roll";
        }
        if (pl.jail){
          const late=S.round>=12 && lv>=2;
          if (!late && pl.cards) { useCard(S); return "card"; }
          if (!late && pl.cash>JAIL_FINE+ (lv>=2?reserve(S,p,lv)*0.5:0) && (lv>0||R()<0.7)) { payJail(S); return "pay"; }
        }
        S.preDone=false; roll(S); return "roll";
      }
      case "post": { expertBuild(S,p,lv); S.preDone=false; endTurn(S); return "end"; }
    }
    return null;
  }

  root.PropGame={LAST_CAP,BOARD,GROUPS,GCOL,GNAME,MBOX,TJAR,JAIL,JAIL_FINE,newGame,answerOffer,roll,buy,decline,bid,pass,minBid,payJail,useCard,payDebt,bankrupt,endTurn,
    build,sellHouse,mortgage,unmortgage,canBuild,canSell,canMortgage,canUnmortgage,unmortCost,rentFor,ownsAll,netWorth,liquidValue,
    tradeValid,doTrade,judgeTrade,lookahead,proposeDeal,noteDeclined,aiStep,aiBuild,alive,valueTo};
})(typeof window!=="undefined"?window:globalThis);
