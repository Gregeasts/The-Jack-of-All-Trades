const currentCardEl = document.getElementById('current-card');
const higherBtn = document.getElementById('higher-btn');
const lowerBtn = document.getElementById('lower-btn');
const resetBtn = document.getElementById('reset-btn');
const messageEl = document.getElementById('message');
const scoreEl = document.getElementById('score');
const previousCardsContainer = document.getElementById('previous-cards');
const correctSound = new Audio('assets/correct.mp3');
const incorrectSound = new Audio('assets/incorrect.mp3');
const cardflip = new Audio('assets/cardflip.mp3');


const values = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
const suits = ['C','H','D','P'];

const suitNames = { 'H': 'Hearts', 'C': 'Clubs', 'D': 'Diamonds', 'P': 'Spades' };
const valueNames = { 'A': 'Ace', 'J': 'Jack', 'Q': 'Queen', 'K': 'King' };

function getValueName(value) { return valueNames[value] || value; }

let deck = [];
let currentCard = null;
let nextCardIndex = 1;
let score = 0;
let revealedCards = [];
let gameOver = false;

// Create a full deck
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
const bgMusic = document.getElementById('bg-music');
const playMusicBtn = document.getElementById('play-music-btn');

playMusicBtn?.addEventListener('click', () => {
  bgMusic.play();            
  bgMusic.volume = 0.3;        
  playMusicBtn.style.display = 'none'; 
});

const homeBtn = document.getElementById('home-btn');
homeBtn.addEventListener('click', () => {
  window.location.href = 'index.html';
});

function getCardImage(card) {
  return `assets/${card.value}-${card.suit}.png`;
}

function startGame() {
  deck = shuffleDeck(createDeck());
  currentCard = deck[0];
  nextCardIndex = 1;
  score = 0;
  revealedCards = [];
  gameOver = false;

  scoreEl.textContent = score;
  messageEl.textContent = '';
  previousCardsContainer.innerHTML = '';
  currentCardEl.src = 'assets/BACK.png';

  higherBtn.disabled = false;
  lowerBtn.disabled = false;
  resetBtn.style.display = 'none';

  revealFirstCard();
}

function revealFirstCard() {
  currentCardEl.classList.add('flip');
  cardflip.play();  
  setTimeout(() => {
    currentCardEl.src = getCardImage(currentCard);
    currentCardEl.classList.remove('flip');
  }, 300);
}

function updatePreviousCards(card) {
  const container = document.getElementById('previous-cards');
  const img = document.createElement('img');
  img.src = getCardImage(card);

  
  img.style.setProperty('--rotation', `${(Math.random() * 6 - 3).toFixed(1)}deg`);
  img.style.setProperty('--offset', `${Math.random() * 4 - 2}px`);

  container.appendChild(img);

  while (container.children.length > 5) {
    container.removeChild(container.firstChild);
  }
}


function guess(higher) {
  if (gameOver) return;

  if (nextCardIndex >= deck.length) {
    messageEl.textContent = `Deck finished! Final score: ${score}`;
    gameOver = true;
    higherBtn.disabled = true;
    lowerBtn.disabled = true;
    resetBtn.style.display = 'inline-block';
    return;
  }

  const nextCard = deck[nextCardIndex];
  nextCardIndex++;

  updatePreviousCards(currentCard);

  currentCardEl.classList.add('flip');
  cardflip.play();  
  setTimeout(() => {
    currentCardEl.src = getCardImage(nextCard);
    
    currentCardEl.classList.remove('flip');
    currentCardEl.classList.add('wobble');
    setTimeout(() => currentCardEl.classList.remove('wobble'), 400);
    const currentIndex = values.indexOf(currentCard.value);
    const nextIndex = values.indexOf(nextCard.value);

    if ((higher && nextIndex > currentIndex) || (!higher && nextIndex < currentIndex)) {
      score++;
      correctSound.currentTime = 0;
      correctSound.play();
      scoreEl.classList.add('pulse');
      setTimeout(() => scoreEl.classList.remove('pulse'), 600);
      scoreEl.textContent = score;
      messageEl.textContent = `Correct! Next card was ${getValueName(nextCard.value)} of ${suitNames[nextCard.suit]}`;
    } else if (nextIndex === currentIndex) {
      messageEl.textContent = `Same card!`;
    } else {
      incorrectSound.currentTime = 0;
      incorrectSound.play();
      messageEl.textContent = `Wrong! Next card was ${getValueName(nextCard.value)} of ${suitNames[nextCard.suit]}. Final score: ${score}`;
      gameOver = true;
      higherBtn.disabled = true;
      lowerBtn.disabled = true;
      resetBtn.style.display = 'inline-block';
    }

    currentCard = nextCard;
  }, 300);
}

higherBtn.addEventListener('click', () => guess(true));
lowerBtn.addEventListener('click', () => guess(false));
resetBtn.addEventListener('click', startGame);

startGame();
