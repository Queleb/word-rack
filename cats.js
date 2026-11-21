// Shared cat roster + lines for the Game Room. Glorg & Squeex are girls; Sushi & Mojito are boys.
(function(){
  const CAT_INFO = {
    Glorg:  {img:"cat-glorg.jpg",  she:true},
    Squeex: {img:"cat-squeex.jpg", she:true},
    Sushi:  {img:"cat-sushi.jpg",  she:false},
    Mojito: {img:"cat-mojito.jpg", she:false},
  };
  const P = n => CAT_INFO[n].she ? {s:"she",o:"her",p:"her",r:"herself",S:"She"} : {s:"he",o:"him",p:"his",r:"himself",S:"He"};
  const other = n => { const o=Object.keys(CAT_INFO).filter(x=>x!==n); return o[Math.floor(Math.random()*o.length)]; };

  // {n}=name {s}/{o}/{p}/{r}/{S}=pronouns {x}=a different cat
  const LINES = {
    win: [
      "{n} is proud of you!",
      "{n} thinks you handled that with great aplomb.",
      "{n} has awarded you one (1) slow blink.",
      "{n} is purring so loud the neighbors can hear.",
      "{n} says that was purr-fectly done.",
      "{n} is telling all the other cats about you.",
      "{n} has decided you may pet {o}. Once.",
      "{n} brought you a sock to celebrate.",
      "{n} thinks you're smarter than the red dot.",
      "{n} approves. This is extremely rare.",
      "{n} knocked a cup off the table in your honor.",
      "{n} would give you a treat, but {s} ate it.",
      "{n} is impressed, though {s}'ll never admit it.",
      "{n} would like everyone to know {s} taught you that.",
      "{n} is doing happy biscuits on your lap.",
      "{n} has upgraded you from 'can opener' to 'genius.'",
      "{n} would trade {p} favorite box for your brain.",
      "{n} says not even the vacuum could stop you.",
      "{n} headbutted you affectionately. Congratulations.",
      "{n} is already bragging to {x} about you.",
    ],
    lose: [
      "{n} is judging you.",
      "{n} could do a better job {r}.",
      "{n} saw that. {S} will remember.",
      "{n} has seen better plays from a ball of yarn.",
      "{n} is pretending not to know you.",
      "{n} walked across the keyboard and still would've done better.",
      "{n} yawned so hard {s} almost fell off the couch.",
      "{n} is disappointed, but not surprised.",
      "{n} would like a refund.",
      "{n} turned around and showed you {p} butt. That's a review.",
      "{n} is knocking your phone off the table as we speak.",
      "{n} says maybe stick to napping.",
      "{n} needs a moment. Possibly a long one.",
      "{n} expected more from the person who opens the treats.",
      "{n} is reporting this to {x}.",
      "{n} would like to speak to your manager.",
      "{n} has gone to sit in a box and think about what you did.",
      "{n} is laughing at you. Silently. With {p} eyes.",
      "{n} tried to cover this up like it was in the litter box.",
      "{n} says even {x} could've done that, and {x} is scared of cucumbers.",
    ],
    // Word Rack table talk
    cpuBig: ["Did you see that? Of course you did.","Read it and weep, human.","Mrrp. Too easy.","Put that on the fridge.","I'd like my points delivered with a side of tuna.","That's what we call a cat-astrophe. For you."],
    cpuBingo: ["ALL SEVEN. Bow before me.","Bingo! Someone fetch me a treat.","Seven tiles. Zero effort. Purrfect."],
    cpuSmall: ["I'm just warming up.","Every point counts. Especially mine.","I meant to do that.","Small but mighty. Like me.","Saving the good letters. Obviously."],
    cpuSwap: ["These letters are beneath me.","I didn't like those tiles anyway.","New tiles, new me."],
    youBig: ["Okay, that one was… fine. I guess.","Lucky tiles. Nothing more.","Who taught you that word? Not me.","*flicks tail aggressively*","Hm. Don't let it go to your head."],
    youBingo: ["Seven tiles?! I demand a recount.","I'm telling {x} about this.","That's it, I'm knocking your water over."],
    youSmall: ["That's it? Cute.","Bold of you to play that.","I've coughed up hairballs worth more points.","A valiant effort. For a human."],
    youPass: ["Stuck? Shocking.","Take your time. I'll nap.","Swapping won't save you.","Need a hint? Too bad."],
    cpuAhead: ["Should I go easy on you? No.","I'm not even trying. Okay, I'm a little trying.","This is fun. For me."],
    cpuBehind: ["I'm letting you win. On purpose.","I'm distracted by a bird, that's all.","Enjoy it while it lasts."],
    draw: [
      "{n} calls it a draw. {S} demands a rematch.",
      "{n} says it's a tie, but {s} was clearly winning.",
      "{n} has decided nobody wins. Except naps.",
      "{n} shakes your hand. Well, {p} paw.",
      "{n} is satisfied with a draw. For now.",
      "{n} says you're evenly matched, which is a compliment to you.",
    ],
    // Chess table talk
    chessHello: ["Prepare to be outplayed.","I've been practicing on the scratching post.","Let's make this quick, I have a nap scheduled.","Good luck. You'll need it.","I hope you like losing pieces."],
    cpuTake: ["Mine now.","Thank you for the snack.","I'll be taking that.","Oops, did you need that?","Into the toy box it goes."],
    youTake: ["Hey! I was using that.","That was a test. You passed. Barely.","Fine. Keep it.","I'm knocking one of your pieces off the table later.","Rude, but okay."],
    cpuCheck: ["Check! Feeling nervous?","Check. Your king looks scared.","Check! I can smell fear.","Check. Run, little king."],
    youCheck: ["Rude.","Check? I meant to let that happen.","My king is just stretching.","Hiss."],
  };
  function fill(t, n){
    const pr=P(n), x=other(n);
    return t.replace(/\{n\}/g,n).replace(/\{x\}/g,x).replace(/\{s\}/g,pr.s).replace(/\{o\}/g,pr.o).replace(/\{p\}/g,pr.p).replace(/\{r\}/g,pr.r).replace(/\{S\}/g,pr.S);
  }
  const pick = a => a[Math.floor(Math.random()*a.length)];
  window.GameCats = {
    names: Object.keys(CAT_INFO),
    img: n => CAT_INFO[n].img,
    randomCat: () => pick(Object.keys(CAT_INFO)),
    pickCats: k => Object.keys(CAT_INFO).sort(()=>Math.random()-.5).slice(0,k),
    line: (kind, n) => fill(pick(LINES[kind]), n),
  };
})();
