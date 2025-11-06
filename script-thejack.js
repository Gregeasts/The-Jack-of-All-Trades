const playerHandDiv = document.getElementById('player-hand');
const opponentHandDiv = document.getElementById('opponent-hand');
const pileUpDiv = document.getElementById('pile-up');
const pileDownDiv = document.getElementById('pile-down');
const messageEl = document.getElementById('message');
const resetBtn = document.getElementById('reset-btn');
const homeBtn = document.getElementById('home-btn-jack');
const playMusicBtn = document.getElementById('play-music-btn-jack');
const bgMusic = document.getElementById('bg-music-jack');
const cardflip = new Audio('assets/cardflip.mp3');

const correctSound = new Audio('assets/correct.mp3');
const incorrectSound = new Audio('assets/incorrect.mp3');

const values = ['A','2','3','4','5','6','7','8','9','10','J'];
const suits = ['C','H','D','P'];

let deck=[], playerHand=[], opponentHand=[];
let pileUp=[], pileDown=[];
let selectedCards=[];
let pickCount=0, placeCount=0;
const maxPickPerTurn=2, maxPlacePerTurn=2, maxMoves=4;
let gameOver=false, playerTurn=true;

function createDeck(){
  const cards=[];
  for(let s of suits) for(let v of values) cards.push({value:v,suit:s});
  return shuffleDeck(cards);
}

function shuffleDeck(array){
  for(let i=array.length-1;i>0;i--){
    const j=Math.floor(Math.random()*(i+1));
    [array[i],array[j]]=[array[j],array[i]];
  }
  return array;
}

function getCardImage(card){ return `assets/${card.value}-${card.suit}.png`; }

function animateCard(handDiv, card, faceDown=false){
  const img = document.createElement('img');
  img.src = faceDown ? 'assets/BACK.png' : getCardImage(card);
  img.classList.add('card','card-animate');
  handDiv.appendChild(img);
  setTimeout(()=> img.classList.add('show'),50);
  return img;
}
function renderHandFaceUp(handDiv, hand) {
    handDiv.innerHTML = '';

    const needed = ['A','2','3','4','5','6','7','8','9','10'];
    const displayHand = hand.map(c => ({ ...c }));

    const finalOrder = [];


    for (let val of needed) {
        const idx = displayHand.findIndex(c => c.value === val);
        if (idx !== -1) {
            finalOrder.push(displayHand[idx]);
        }
    }

  
    displayHand.forEach(c => {
        if (c.value === 'J' && !finalOrder.includes(c)) finalOrder.push(c);
    });

  
    finalOrder.forEach(c => {
        const img = document.createElement('img');
        img.src = getCardImage(c);
        img.classList.add('card','card-animate','show');
        handDiv.appendChild(img);
    });
}

function renderRobotHandFaceUp(){
    opponentHandDiv.innerHTML=''; 

    const needed = ['A','2','3','4','5','6','7','8','9','10'];
    
    const displayHand = opponentHand.map(c => ({...c}));

    const handValues = displayHand.map(c => c.value);
    const missing = needed.filter(n => !handValues.includes(n));
    
    const finalOrder = [];
    for (let v of needed) {
        const idx = displayHand.findIndex(c => c.value === v);
        if (idx !== -1) {
            finalOrder.push(displayHand[idx]);
        } else if (missing.length > 0) {
            const jackIdx = displayHand.findIndex(c => c.value === 'J' && !finalOrder.includes(c));
            if (jackIdx !== -1) {
                finalOrder.push(displayHand[jackIdx]);
            }
        }
    }

    displayHand.forEach(c => {
        if (c.value === 'J' && !finalOrder.includes(c)) finalOrder.push(c);
    });

    finalOrder.forEach(c => {
        const img = document.createElement('img');
        img.src = getCardImage(c);
        img.classList.add('card','card-animate','show');
        opponentHandDiv.appendChild(img);
    });
}

function animateMove(fromDiv, toDiv, card, faceDown=false){
  const img = document.createElement('img');
  img.src = faceDown ? 'assets/BACK.png' : getCardImage(card);
  img.classList.add('card','card-animate');
  toDiv.appendChild(img);
  setTimeout(()=> img.classList.add('show'),50);
}

function renderHands(){
  playerHandDiv.innerHTML='';
  playerHand.forEach((c,i)=>{
    const img=animateCard(playerHandDiv,c);
    img.draggable=true;
    img.addEventListener('dragstart', e=>{
      e.dataTransfer.setData('text/plain', i);
    });
    img.addEventListener('dragover', e=> e.preventDefault());
    img.addEventListener('drop', e=>{
      const fromIndex=parseInt(e.dataTransfer.getData('text/plain'));
      swapCards(fromIndex,i);
    });
    if(playerTurn) img.addEventListener('click', ()=> selectPlayerCard(i,img));
    cardflip.play();  
  });

  opponentHandDiv.innerHTML='';
  opponentHand.forEach(()=>{
    animateCard(opponentHandDiv,{value:'BACK'}, true);
  });
}

function swapCards(from,to){
  if(from===to) return;
  [playerHand[from], playerHand[to]] = [playerHand[to], playerHand[from]];
  renderHands();
}

function renderTable(){
  pileUpDiv.innerHTML='';
  pileDownDiv.innerHTML='';

  if(pileUp.length){
    const top = pileUp[pileUp.length-1];
    const img = document.createElement('img');
    img.src = getCardImage(top);
    pileUpDiv.appendChild(img);
    if(playerTurn) img.addEventListener('click', ()=> handlePileClick('up'));
  } else {
    const shadow = document.createElement('div');
    shadow.classList.add('pile-shadow');
    shadow.textContent = 'Click to return card';
    pileUpDiv.appendChild(shadow);
    if(playerTurn) shadow.addEventListener('click', ()=> returnCardToPile('up'));
  }

  if(pileDown.length){
    const img = document.createElement('img');
    img.src = 'assets/BACK.png';
    pileDownDiv.appendChild(img);
    if(playerTurn) img.addEventListener('click', ()=> handlePileClick('down'));
  } else {
    const shadow = document.createElement('div');
    shadow.classList.add('pile-shadow');
    shadow.textContent = 'Click to return card';
    pileDownDiv.appendChild(shadow);
    if(playerTurn) shadow.addEventListener('click', ()=> returnCardToPile('down'));
  }
}
function selectPlayerCard(index,imgElement){
  if(selectedCards.includes(index)){
    selectedCards = selectedCards.filter(i=>i!==index);
    imgElement.classList.remove('selected');
  } else if(placeCount + selectedCards.length < maxPlacePerTurn && !gameOver && playerTurn){
    selectedCards.push(index);
    imgElement.classList.add('selected');
  }
}

function handlePileClick(pile){
  if(gameOver) return;
  if(selectedCards.length>0 && placeCount < maxPlacePerTurn) placeSelected(pile);
  else if(pickCount < maxPickPerTurn && playerHand.length < 12) pickCardFromPile(pile);
}

function pickCardFromPile(pile){
  const source = (pile==='up')? pileUp : pileDown;
  if(source.length>0){
    const card = source.pop();
    playerHand.push(card);
    pickCount++;
    cardflip.play();  
    renderHands();
    renderTable();
    checkEndTurn();
  }
}
function returnCardToPile(pile){
  if(playerHand.length === 0) return;

  const target = (pile==='up')? pileUp : pileDown;
  let card;
  cardflip.play();  
  if(selectedCards.length > 0){
    const idx = selectedCards.pop();
    card = playerHand.splice(idx,1)[0];
  } else {
    card = playerHand.pop();
  }

  target.push(card);
  placeCount++; 
  renderHands();
  renderTable();
  checkEndTurn();
}

function placeSelected(pile){
  if(selectedCards.length===0) return;
  const target = (pile==='up')? pileUp : pileDown;
  selectedCards.sort((a,b)=>b-a).forEach(idx=>{
    target.push(playerHand[idx]);
    playerHand.splice(idx,1);
  });
  placeCount += selectedCards.length;
  selectedCards=[];
  renderHands();
  renderTable();
  checkEndTurn();
}

function checkWin(hand){
  const needed=['A','2','3','4','5','6','7','8','9','10'];
  const handValues=hand.map(c=>c.value);
  const jacks=handValues.filter(v=>v==='J').length;
  const missing=needed.filter(n=>!handValues.includes(n));
  return missing.length<=jacks;
}

function checkEndTurn(){
  messageEl.textContent=`Picked: ${pickCount}/${maxPickPerTurn}, Placed: ${placeCount}/${maxPlacePerTurn}`;

  if(pickCount + placeCount >= maxMoves){
    if(playerHand.length>10 && playerTurn){
      messageEl.textContent += ` | Must place ${playerHand.length-10} card(s) to end turn`;
      return;
    }
    if(opponentHand.length>10 && !playerTurn){
      messageEl.textContent += ` | Robot must place ${opponentHand.length-10} card(s) to end turn`;
      return;
    }

    if(playerTurn && checkWin(playerHand)){
      messageEl.textContent="You win!";
      correctSound.play();
      gameOver=true;
      resetBtn.style.display='inline-block';
      renderRobotHandFaceUp();
      renderHandFaceUp(playerHandDiv, playerHand);
    
      return;
    }
    if(!playerTurn && checkWin(opponentHand)){
      messageEl.textContent="Robot wins!";
      incorrectSound.play();
      gameOver=true;
      resetBtn.style.display='inline-block';
      renderRobotHandFaceUp();
      renderHandFaceUp(playerHandDiv, playerHand); 
    
      return;
    }

    if(playerTurn){
      playerTurn=false;
      shufflePileDown();
      pickCount=0; placeCount=0;
      setTimeout(robotTurn, 800);
    } else {
      playerTurn=true;
      pickCount=0; placeCount=0;
      messageEl.textContent="Your turn. Click pile to pick or select cards to place.";
      renderHands();
      renderTable();
    }
  }
}

function shufflePileDown(){
  pileDown = shuffleDeck(pileDown);
}

async function robotTurn(){
  messageEl.textContent="Robot is thinking...";
  let robotPick=0, robotPlace=0;
  const needed=['A','2','3','4','5','6','7','8','9','10'];

  console.log("Robot starting hand:", opponentHand.map(c=>c.value));

  while(robotPick + robotPlace < maxMoves){
    await new Promise(r=>setTimeout(r,500));

    const handValues = opponentHand.map(c=>c.value);
    const missing = needed.filter(n=>!handValues.includes(n));
    console.log("Robot hand:", opponentHand.map(c=>c.value), "Missing:", missing);

    while(robotPick < maxPickPerTurn && pileUp.length > 0){
      let pickedCard = false;

      const topCard = pileUp[pileUp.length - 1];
      if (missing.includes(topCard.value) || topCard.value === 'J') {
          const card = pileUp.pop();
          opponentHand.push(card);
          animateMove(pileUpDiv, opponentHandDiv, card, true);
          robotPick++;
          console.log("Picked needed card from top pileUp:", card.value);
          
          if (pileUp.length > 0) {
              const secondCard = pileUp[pileUp.length - 1];
              if (missing.includes(secondCard.value) || secondCard.value === 'J') {
                  const card2 = pileUp.pop();
                  opponentHand.push(card2);
                  animateMove(pileUpDiv, opponentHandDiv, card2, true);
                  robotPick++;
                  console.log("Picked needed card from second pileUp:", card2.value);
              }
          }
      }

      if(!pickedCard) break;
    }

    while(robotPick < maxPickPerTurn && pileDown.length>0 && opponentHand.length<12){
      const card = pileDown.pop();
      opponentHand.push(card);
      animateMove(pileDownDiv, opponentHandDiv, card, true);
      robotPick++;
      console.log("Picked card from pileDown:", card.value);
    }
    
    while(robotPlace < maxPlacePerTurn && opponentHand.length>10){
      const idx = opponentHand.findIndex(c=>c.value!== 'J' && handValues.filter(v=>v===c.value).length>1);
      if(idx === -1) break;
      const card = opponentHand.splice(idx,1)[0];
      const placePile = (Math.random() > 0.5) ? pileUp : pileDown;
      const placeDiv = (placePile === pileUp) ? pileUpDiv : pileDownDiv;

      placePile.push(card);
      animateMove(opponentHandDiv, placeDiv, card, true);
      robotPlace++;
      console.log(`Placed duplicate card ${card.value} on ${placePile === pileUp ? 'pileUp' : 'pileDown'}`);
      
    }

    break;
  }

  if(checkWin(opponentHand)){
    messageEl.textContent="Robot wins!";
    incorrectSound.play();
    gameOver=true;
    resetBtn.style.display='inline-block';
    renderRobotHandFaceUp();
    renderHandFaceUp(playerHandDiv, playerHand);
    
  } else {
    playerTurn=true;
    pickCount=0; placeCount=0;
    messageEl.textContent="Your turn. Click pile to pick or select cards to place.";
    renderHands();
    renderTable();
  }
}
function startGame(){
  deck=createDeck();
  playerHand=[]; opponentHand=[]; pileUp=[]; pileDown=[];
  selectedCards=[]; pickCount=0; placeCount=0; gameOver=false; playerTurn=true;

  for(let i=0;i<10;i++){
    playerHand.push(deck.pop());
    opponentHand.push(deck.pop());
  }
  const remaining = deck.splice(0,deck.length);
  pileUp = remaining.filter((_,i)=>i%2===0);
  pileDown = remaining.filter((_,i)=>i%2!==0);

  renderHands();
  renderTable();
  messageEl.textContent="Your turn. Click pile to pick or select cards to place.";
  resetBtn.style.display='none';
}

resetBtn.addEventListener('click', startGame);
homeBtn.addEventListener('click', ()=>window.location.href='index.html');
playMusicBtn.addEventListener('click', ()=>{
  bgMusic.play(); bgMusic.volume=0.3;
  playMusicBtn.style.display='none';
});

startGame();
