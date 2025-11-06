const playerCardsDiv = document.getElementById('player-cards');
const dealerCardsDiv = document.getElementById('dealer-cards');
const playerScoreEl = document.getElementById('player-score');
const dealerScoreEl = document.getElementById('dealer-score');
const hitBtn = document.getElementById('hit-btn');
const standBtn = document.getElementById('stand-btn');
const resetBtn = document.getElementById('reset-btn');
const homeBtn = document.getElementById('home-btn');
const messageEl = document.getElementById('message');
const bankAmountEl = document.getElementById('bank-amount');
const betInput = document.getElementById('bet-input');
const placeBetBtn = document.getElementById('place-bet-btn');

const bgMusic1 = document.getElementById('bg-music1');
const playMusicBtn1 = document.getElementById('play-music-btn1');
playMusicBtn1?.addEventListener('click', () => {
  bgMusic1.play();
  bgMusic1.volume = 0.3;
  playMusicBtn1.style.display = 'none';
});

const correctSound = new Audio('assets/correct.mp3');
const incorrectSound = new Audio('assets/incorrect.mp3');
const money = new Audio('assets/money.mp3');

const values = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
const suits = ['C','H','D','P'];
const valueMap = { 'A': 11, '2':2,'3':3,'4':4,'5':5,'6':6,'7':7,'8':8,'9':9,'10':10,'J':10,'Q':10,'K':10 };

let deck = [];
let playerHand = [];
let dealerHand = [];
let gameOver = false;
let dealerHidden = true; 
let bank = 1000;
let currentBet = 0;

// ===== Helpers =====
function createDeck() {
  const cards = [];
  for (let suit of suits) {
    for (let value of values) {
      cards.push({value, suit});
    }
  }
  return cards;
}

function shuffleDeck(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function getCardImage(card) {
  return `assets/${card.value}-${card.suit}.png`;
}

function handScore(hand) {
  let sum = 0;
  let aces = 0;
  hand.forEach(c => {
    sum += valueMap[c.value];
    if (c.value === 'A') aces++;
  });
  while (sum > 21 && aces > 0) {
    sum -= 10;
    aces--;
  }
  return sum;
}

function updateBankDisplay() {
  
  bankAmountEl.textContent = bank;
}

function placeCardAnimated(handDiv, card, delay = 0) {
  const img = document.createElement('img');
  img.src = getCardImage(card);
  img.style.opacity = 0;
  img.style.transform = 'translateY(-50px) rotate(-5deg)';
  img.classList.add('card');
  handDiv.appendChild(img);

  setTimeout(() => {
    img.style.transition = 'all 0.5s ease';
    img.style.opacity = 1;
    img.style.transform = 'translateY(0) rotate(0deg)';
  }, delay);

  setTimeout(() => {
    img.style.transition = 'transform 0.2s';
    img.style.transform = 'translateY(0) rotate(2deg)';
    setTimeout(() => img.style.transform = 'translateY(0) rotate(0deg)', 200);
  }, delay + 600);
}

function renderHands() {
  playerCardsDiv.innerHTML = '';
  dealerCardsDiv.innerHTML = '';

  playerHand.forEach(c => placeCardAnimated(playerCardsDiv, c));
  
  dealerHand.forEach((c, i) => {
    if (i === 1 && dealerHidden) {
      const img = document.createElement('img');
      img.src = 'assets/BACK.png';
      img.style.opacity = 0;
      img.style.transform = 'translateY(-50px) rotate(-5deg)';
      img.classList.add('card');
      dealerCardsDiv.appendChild(img);
      setTimeout(() => {
        img.style.transition = 'all 0.5s ease';
        img.style.opacity = 1;
        img.style.transform = 'translateY(0) rotate(0deg)';
      }, 50);
    } else {
      placeCardAnimated(dealerCardsDiv, c);
    }
  });

  playerScoreEl.textContent = handScore(playerHand);
  dealerScoreEl.textContent = dealerHidden ? valueMap[dealerHand[0].value] : handScore(dealerHand);
}

function checkGameOver() {
  const playerScore = handScore(playerHand);
  if (playerScore > 21) {
    messageEl.textContent = "You busted! Dealer wins.";
    incorrectSound.play();
    endRound(false);
  } else if (playerScore === 21) {
    messageEl.textContent = "Blackjack! You win!";
    correctSound.play();
    endRound(true);
  }
}

function hit() {
  if (gameOver) return;
  const card = deck.pop();
  playerHand.push(card);
  renderHands();
  checkGameOver();
}

async function stand() {
  if (gameOver) return;

  dealerHidden = false;
  renderHands();
  await new Promise(r => setTimeout(r, 800));

  while (handScore(dealerHand) < 17) {
    const card = deck.pop();
    dealerHand.push(card);
    renderHands();
    await new Promise(r => setTimeout(r, 600));
  }

  const pScore = handScore(playerHand);
  const dScore = handScore(dealerHand);

  if (dScore > 21 || pScore > dScore) {
    messageEl.textContent = `You win $${currentBet * 2}!`;
    correctSound.play();
    await endRound(true);
  } else if (dScore === pScore) {
    messageEl.textContent = 'Tie! Bet returned';
    await endRound(null);
  } else {
    messageEl.textContent = `Dealer wins! You lose $${currentBet}`;
    incorrectSound.play();
    await endRound(false);
  }
}

async function endRound(playerWins) {
  if (playerWins === true) bank += currentBet * 2;
  else if (playerWins === null) bank += currentBet;

  currentBet = 0;
  updateBankDisplay();
  hitBtn.disabled = true;
  standBtn.disabled = true;
  dealerHidden = false;
  gameOver = true;

  betInput.disabled = false;
  placeBetBtn.disabled = false;

  if (bank <= 0) {
    messageEl.textContent = 'You lost all your money! Click Restart to play again.';
    resetBtn.style.display = 'inline-block';
    hitBtn.disabled = true;
    standBtn.disabled = true;
    betInput.disabled = true;
    placeBetBtn.disabled = true;
  }
}

function startGame() {
  deck = shuffleDeck(createDeck());
  playerHand = [deck.pop(), deck.pop()];
  dealerHand = [deck.pop(), deck.pop()];
  gameOver = false;
  dealerHidden = true;
  messageEl.textContent = '';
  renderHands();
  resetBtn.style.display = 'none';
}

placeBetBtn.addEventListener('click', () => {
  const bet = parseInt(betInput.value);
  if (!bet || bet <= 0) { alert('Enter a valid bet!'); return; }
  if (bet > bank) { alert('Not enough money!'); return; }

  currentBet = bet;
  bank -= currentBet;
  money.play();
  updateBankDisplay();
  betInput.disabled = true;
  placeBetBtn.disabled = true;

  hitBtn.disabled = false;
  standBtn.disabled = false;

  startGame();
});

hitBtn.addEventListener('click', hit);
standBtn.addEventListener('click', stand);
resetBtn.addEventListener('click', () => {
  bank = 1000;
  updateBankDisplay();
  betInput.disabled = false;
  placeBetBtn.disabled = false;
  messageEl.textContent = '';
  startGame();
});
homeBtn.addEventListener('click', () => window.location.href = 'index.html');

updateBankDisplay();
hitBtn.disabled = true;
standBtn.disabled = true;
resetBtn.style.display = 'none';
