const SUITS = ["♦","♣","♥","♠"]
const VALUES = ["A","2","3","4","5","6","7","8","9", "10", "J","Q","K"]

const cardValue = {
    'A':1,
    '2':2,
    '3':3,
    '4':4,
    '5':5,
    '6':6,
    '7':7,
    '8':8,
    '9':9,
    '10':10,
    'J':10,
    'Q':10,
    'K':10
}

const userName = document.getElementById("playerInput")
const wagerContainer = document.getElementById("wagerContainer")
const removeInputBox = document.getElementById("inputBox")
const renderPlayer = document.getElementById("playerId")
const renderBank = document.getElementById("bankBalance")
const startGameState = document.getElementById("gameContainer")
const playerHand = document.getElementById('playerHand')
const computerHand = document.getElementById('computerHand')
const wagerButtons = document.querySelectorAll('.wagerButtons')
const controlButtons = document.querySelectorAll('.controlButtons')
const displayResult = document.getElementById('result')
const endState = document.getElementById('endState')
const continueGame = document.getElementById('continueGame')
const controlPanel = document.getElementById('controlPanel')
let deck
let natural = false
let wagerAmt = 0
let results
let winLose = 0
let multiplier = 0
let newPlayer


class Player {
    playerName
    bankBalance
    constructor(playerName, bankBalance=200) {
        this.playerName = playerName
        this.bankBalance = bankBalance
       
    }


}


class Deck {
    cards
    constructor(cards=generateDeck()) {
        this.cards= cards
    }

    get numberOfCards() {
        return this.cards.length
    }


    shuffle() {
        for(let i= this.numberOfCards -1; i>0; i--){
            const newIndex = Math.floor(Math.random()*(i+1))
            const oldValue = this.cards[newIndex]
            this.cards[newIndex] = this.cards[i]
            this.cards[i] = oldValue
        }
    }
}

class Card {
    suit
    value
    constructor (suit, value) {
        this.suit = suit
        this.value = value
    }

    get colour() {
        if (this.suit==="♦" || this.suit === "♥") {
            return 'red'
        } else return 'black'
    }

    renderCard() {
        const printCard = document.createElement('div')
        printCard.innerText = this.suit
        printCard.classList.add('card',this.colour)
        printCard.dataset.value=this.value
        printCard.dataset.suit=this.suit
        return printCard
    }
}

function generateDeck() {
    return SUITS.flatMap(suit =>  {
        return VALUES.map(value => {
            return new Card (suit,value)
        })
    })
}




function startGame() {
    const newDude = userName.value
    newPlayer = new Player(newDude)
    removeInputBox.style.display = 'none'
    wagerContainer.style.display = 'block'
    renderPlayer.innerText = newPlayer.playerName
   
    wagerButtons.forEach(button => button.addEventListener('click', () => {
        wagerAmt = parseInt(button.textContent,10)
        startNewRound()
       
    }))
      
    
}

function checkEnter(event) {
    if (event.key === 'Enter') {
        startGame();
    }
}
function startNewRound() {
    wagerContainer.style.display = 'none'
    startGameState.style.display = 'block'
    controlPanel.style.display = 'inline-flex'
    deck = new Deck()
    deck.shuffle();
    drawCard(playerHand)
    drawCard(playerHand)
    drawCard(computerHand,true)
    drawCard(computerHand,true)
    renderBank.innerText = newPlayer.bankBalance
    checkForNatural(playerHand.children,computerHand.children)

    if (natural) {
    for (const child of computerHand.children) {
        child.classList.remove('facedown');
    }
    compareHands(playerHand.children, computerHand.children)
    determineWinner()
    generateMultiplier(playerHand.children,computerHand.children)
    controlPanel.style.display = 'none'
    payOut()
    } else {
    controlButtons.forEach(button => button.addEventListener('click', controlButtonClick));
   
    }
 
    
}

function controlButtonClick(event) {
    if (event.target.id === 'hit' && playerHand.children.length < 3) {
        drawCard(playerHand);
    } 
    
    computerAPI();
    compareHands(playerHand.children,computerHand.children)
    determineWinner()
    generateMultiplier(playerHand.children,computerHand.children)
    payOut()
   this.parentNode.style.display = 'none'
    renderBank.innerText = newPlayer.bankBalance
    
}

function computerAPI() {
    if(handValue(computerHand.children)<5 && computerHand.children.length<3) {
        drawCard(computerHand,true)
        }
        for (const child of computerHand.children) {
            child.classList.remove('facedown');
    }
}

function drawCard(container, facedown=false) {
    const cardDrawn = deck.cards.shift();
    const cardElement = cardDrawn.renderCard();
    if (facedown) {
        cardElement.classList.add('facedown');
    }
    return container.appendChild(cardElement);
}



function handValue(hand) {
    const handArray = Array.from(hand);
    const handValue = handArray.reduce((total, card) => total + cardValue[card.dataset.value], 0);
    return handValue % 10;
}


function checkForNatural(player,computer) {
   
    if (handValue(player)>=8 || handValue(computer)>=8) {
        natural = true
    }
    return natural
}

function compareHands(player, computer) {
    if (handValue(player) === handValue(computer)) {
       results = 'tie'
    } else if (handValue(player) > handValue(computer)) {
       results = 'win'
    } else {
       results = 'lose'
    }
}

function determineWinner() {
   if(results=='tie') {
     winLose=0
   } else if(results=='win') {
     winLose=1
   } else winLose=-1
}

function generateMultiplier(player,computer) {
    switch (results) {     
        case 'win':
            if (player.length === 2) {
                const [card1, card2] = Array.from(player);
                if (card1.dataset.value === card2.dataset.value || card1.dataset.suit === card2.dataset.suit) {
                    multiplier = 2;
                } else {
                    multiplier = 1;  // Default multiplier if no conditions are met
                }
            } else if (player.length === 3) {
                const [card1, card2, card3] = Array.from(player);
                if (((card1.dataset.value === card2.dataset.value) && (card1.dataset.value === card3.dataset.value)) ||( (card1.dataset.suit === card2.dataset.suit) && (card2.dataset.suit === card3.dataset.suit)) ) {
                    multiplier = 3;
                } else {
                    multiplier = 1;  // Default multiplier if no conditions are met
                }
            } 
            break;

        case 'lose':
            if (computer.length === 2) {
                const [card1, card2] = Array.from(computer);
            if (card1.dataset.value === card2.dataset.value || card1.dataset.suit === card2.dataset.suit) {
                    multiplier = 2;
                } else {
                    multiplier = 1;  // Default multiplier if no conditions are met
                }
            } else if (computer.length === 3) {
                const [card1, card2, card3] = Array.from(computer);
            if (((card1.dataset.value === card2.dataset.value) && (card1.dataset.value === card3.dataset.value)) ||((card1.dataset.suit === card2.dataset.suit) && (card2.dataset.suit === card3.dataset.suit))) {
                    multiplier = 3;
                } else {
                    multiplier = 1;  // Default multiplier if no conditions are met
                }
            } 
            break;

        default:
            multiplier = 0;  // Default multiplier for tie or other cases
    }
}




function payOut() {
newPlayer.bankBalance += (wagerAmt*multiplier*winLose)
renderBank.innerText = newPlayer.bankBalance
displayResult.textContent = results + ' $' + (wagerAmt*multiplier)
endState.style.display = 'flex'
}

continueGame.addEventListener('click', resetGame)

function resetGame() {
    wagerAmt=0
    while (playerHand.firstChild) {
        playerHand.removeChild(playerHand.firstChild);
    }
    while (computerHand.firstChild) {
        computerHand.removeChild(computerHand.firstChild);
    }
    deck =[]
    natural=false
    wagerContainer.style.display = 'block'
    endState.style.display = 'none'
   
}
