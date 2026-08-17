/* ============================================================
   Bar Car Rat — punto banco, house rules

   Scoring, naturals, the banker's drawing table and the payouts are all
   real punto banco. The one departure is deliberate: at a real table
   nobody decides anything, because the player hand draws on 0-5 by rule.
   Here that call is yours. The book's advice is shown under the buttons
   and you are free to ignore it — hence "worse decisions".

   The banker still plays strictly by the table below.
   ============================================================ */

const SUITS = ["♦","♣","♥","♠"]
const VALUES = ["A","2","3","4","5","6","7","8","9", "10", "J","Q","K"]

/* Baccarat counts tens and courts as zero, aces as one. */
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
    '10':0,
    'J':0,
    'Q':0,
    'K':0
}

/* ------------------------------------------------------------------
   The hand table.

   Payouts are ordered by how often each hand actually turns up in three
   cards from a 52-card deck, so the rarer hand always pays more:

     straight flush   0.20%   6x   auto win
     three of a kind  0.24%   5x   auto win
     three pictures   0.92%   4x   auto win
     straight         2.71%   3x   auto win
     flush            4.98%   3x
     pair            16.29%   2x
     plain           74.66%   1x

   An "auto win" beats any lower-ranked hand outright, whatever the
   points say — a straight of 4-5-6 counts 5 in baccarat and would
   otherwise lose to almost anything. Three pictures counts 0, the worst
   total in the game, which is the joke.

   The bonus hands (flush, pair) still have to win on points; they only
   change what the win is worth.

   Two-card hands keep the original rules: a pair or a matched suit
   pays 2x.
   ------------------------------------------------------------------ */

const HANDS = {
    STRAIGHT_FLUSH: { rank: 6, name: 'Straight flush',  multiplier: 6, auto: true  },
    TRIPS:          { rank: 5, name: 'Three of a kind', multiplier: 5, auto: true  },
    PICTURES:       { rank: 4, name: 'Three pictures',  multiplier: 4, auto: true  },
    STRAIGHT:       { rank: 3, name: 'Straight',        multiplier: 3, auto: true  },
    FLUSH:          { rank: 2, name: 'Flush',           multiplier: 3, auto: false },
    PAIR:           { rank: 1, name: 'Pair',            multiplier: 2, auto: false },
    SUITED:         { rank: 1, name: 'Suited',          multiplier: 2, auto: false },
    PLAIN:          { rank: 0, name: '',                multiplier: 1, auto: false },
}

const PICTURE_CARDS = ['J', 'Q', 'K']

const STARTING_BALANCE = 200

const userName = document.getElementById("playerInput")
const wagerContainer = document.getElementById("wagerContainer")
const removeInputBox = document.getElementById("inputBox")
const renderPlayer = document.getElementById("playerId")
const renderBank = document.getElementById("bankBalance")
const startGameState = document.getElementById("gameContainer")
const playerHand = document.getElementById('playerHand')
const computerHand = document.getElementById('computerHand')
const wagerButtons = document.querySelectorAll('.wagerButtons')
const displayResult = document.getElementById('result')
const resultDetail = document.getElementById('resultDetail')
const endState = document.getElementById('endState')
const continueGame = document.getElementById('continueGame')
const wagerBalance = document.getElementById('wagerBalance')
const nameHint = document.getElementById('nameHint')
const gameOver = document.getElementById('gameOver')
const playAgain = document.getElementById('playAgain')
const playerTotalEl = document.getElementById('playerTotal')
const bankerTotalEl = document.getElementById('bankerTotal')
const backingEl = document.getElementById('backing')
const punterArea = document.getElementById('punterArea')
const bankerArea = document.getElementById('bankerArea')

let deck
let wagerAmt = 0
let newPlayer
/** Set while a round is running, so a second stake can't start one. */
let roundInProgress = false

class Player {
    playerName
    bankBalance
    constructor(playerName, bankBalance=STARTING_BALANCE) {
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

/* ============================================================
   The rules. Pure functions — no DOM, no timing — so they can be
   checked directly against the published drawing table.
   ============================================================ */

/** A baccarat hand is the sum of its cards, modulo ten. */
function totalOf(values) {
    return values.reduce((sum, value) => sum + cardValue[value], 0) % 10
}

/** 8 or 9 on the first two cards ends the round immediately. */
function isNatural(total) {
    return total === 8 || total === 9
}

/** The player hand draws on 0-5 and stands on 6-7. */
function playerDraws(playerTotal) {
    return playerTotal <= 5
}

/**
 * The banker's rule. When the player stood, the banker uses the player's
 * rule; when the player drew, whether the banker draws depends on both the
 * banker's total and the value of the card the player drew.
 *
 * @param {number} bankerTotal 0-7
 * @param {number|null} playerThird point value of the player's third card,
 *   or null if the player stood.
 */
function bankerDraws(bankerTotal, playerThird) {
    if (playerThird === null) return bankerTotal <= 5

    switch (bankerTotal) {
        case 0:
        case 1:
        case 2:
            return true
        case 3:
            return playerThird !== 8
        case 4:
            return playerThird >= 2 && playerThird <= 7
        case 5:
            return playerThird >= 4 && playerThird <= 7
        case 6:
            return playerThird === 6 || playerThird === 7
        default:
            return false
    }
}

/**
 * What a hand is, beyond its points. Pure — takes plain {value, suit}
 * objects, so it can be checked against the odds directly.
 */
function evaluateHand(cards) {
    const values = cards.map(card => card.value)
    const suits = cards.map(card => card.suit)
    const total = totalOf(values)
    const oneSuit = suits.every(suit => suit === suits[0])

    if (cards.length >= 3) {
        const allPictures = values.every(value => PICTURE_CARDS.includes(value))
        const order = values.map(value => VALUES.indexOf(value)).sort((a, b) => a - b)
        const run = order[1] === order[0] + 1 && order[2] === order[1] + 1
        const allSame = values.every(value => value === values[0])

        if (run && oneSuit) return { ...HANDS.STRAIGHT_FLUSH, total }
        if (allSame) return { ...HANDS.TRIPS, total }
        // J-Q-K is both a run and three pictures; pictures is the rarer read
        // of the two only after straight flush and trips are ruled out.
        if (allPictures) return { ...HANDS.PICTURES, total }
        if (run) return { ...HANDS.STRAIGHT, total }
        if (oneSuit) return { ...HANDS.FLUSH, total }
        if (new Set(values).size < values.length) return { ...HANDS.PAIR, total }
        return { ...HANDS.PLAIN, total }
    }

    if (values[0] === values[1]) return { ...HANDS.PAIR, total }
    if (oneSuit) return { ...HANDS.SUITED, total }
    return { ...HANDS.PLAIN, total }
}

/**
 * Which hand took the round.
 *
 * An auto-win hand outranks anything below it regardless of points — that
 * is the whole point of it, since a straight counts badly and three
 * pictures counts zero. Everything else is decided on points as usual.
 */
function winningSide(player, banker) {
    if ((player.auto || banker.auto) && player.rank !== banker.rank) {
        return player.rank > banker.rank ? 'player' : 'banker'
    }
    if (player.total > banker.total) return 'player'
    if (banker.total > player.total) return 'banker'
    return 'tie'
}

/**
 * The change to the balance. The winning hand's multiplier sets the size of
 * it either way, so a straight flush against you costs six times the stake
 * exactly as it would pay six times if it were yours. A tie is a push.
 */
function settle(stake, outcome, player, banker) {
    if (outcome === 'tie') return 0
    if (outcome === 'player') return stake * player.multiplier
    return -stake * banker.multiplier
}

/* ============================================================
   Table
   ============================================================ */

function startGame() {
    if (newPlayer) return

    const newDude = userName.value.trim()
    if (!newDude) {
        nameHint.textContent = 'Please enter a name to take a seat'
        nameHint.classList.add('hint-error')
        userName.focus()
        return
    }

    newPlayer = new Player(newDude)
    removeInputBox.style.display = 'none'
    wagerContainer.style.display = 'block'
    renderPlayer.innerText = newPlayer.playerName
    renderBank.innerText = newPlayer.bankBalance
    updateChips()
}

/* Chips above the current balance are disabled, so a bet can never exceed
   what the player actually has. */
function updateChips() {
    if (!newPlayer) return
    wagerBalance.innerText = `$${newPlayer.bankBalance}`
    wagerButtons.forEach(button => {
        const amount = parseInt(button.textContent, 10)
        button.disabled = amount > newPlayer.bankBalance
    })
}

// Registered once, at load, rather than inside startGame — anonymous
// listeners added per call would stack up.
wagerButtons.forEach(button => button.addEventListener('click', () => {
    if (!newPlayer || roundInProgress) return
    const amount = parseInt(button.textContent, 10)
    if (amount > newPlayer.bankBalance) return
    wagerAmt = amount
    tossChip(button)
    startNewRound()
}))

function checkEnter(event) {
    if (event.key === 'Enter') {
        startGame();
    } else {
        nameHint.classList.remove('hint-error')
    }
}

/**
 * Deals and plays a round out. The hands are decided by the rules above;
 * everything else here is pacing.
 */
async function startNewRound() {
    roundInProgress = true
    wagerContainer.style.display = 'none'
    startGameState.style.display = 'block'
    dealIndex = 0
    deck = new Deck()
    deck.shuffle()

    backingEl.textContent = `Staked $${wagerAmt}`
    punterArea.classList.add('is-backed')

    // Player, banker, player, banker — the banker's hand face down.
    drawCard(playerHand)
    drawCard(computerHand, true)
    drawCard(playerHand)
    drawCard(computerHand, true)

    await pause(dealSettleDelay() + 260)

    let playerTotal = totalOf(handValues(playerHand))
    let bankerTotal = totalOf(handValues(computerHand))
    showTotal(playerTotalEl, playerTotal)

    const natural = isNatural(playerTotal) || isNatural(bankerTotal)

    if (natural) {
        await announce('Natural')
        await revealHand(computerHand)
        bankerTotal = totalOf(handValues(computerHand))
        showTotal(bankerTotalEl, bankerTotal)
    } else {
        // Your hand, your call. The book would draw on 0-5 and stand on 6-7,
        // and it says so under the buttons — but the whole point of the place
        // is that you get to ignore it.
        let playerThird = null
        const move = await awaitPlayerMove(playerTotal)

        if (move === 'hit') {
            drawCard(playerHand)
            await pause(dealSettleDelay() + 200)
            const values = handValues(playerHand)
            playerThird = cardValue[values[2]]
            playerTotal = totalOf(values)
            showTotal(playerTotalEl, playerTotal)
        } else {
            await announce('Player stands', 650)
        }

        // Then the banker's hand is turned over and plays.
        await revealHand(computerHand)
        bankerTotal = totalOf(handValues(computerHand))
        showTotal(bankerTotalEl, bankerTotal)
        await pause(320)

        if (bankerDraws(bankerTotal, playerThird)) {
            await announce('Banker draws', 800)
            drawCard(computerHand)
            await pause(dealSettleDelay() + 200)
            bankerTotal = totalOf(handValues(computerHand))
            showTotal(bankerTotalEl, bankerTotal)
        }
    }

    showTotal(playerTotalEl, playerTotal)
    showTotal(bankerTotalEl, bankerTotal)
    await finishRound()
}

/**
 * Hands control to the player for the third card, and resolves with their
 * choice. The banker still follows the published table afterwards, so the
 * only judgement in the round is yours.
 */
function awaitPlayerMove(playerTotal) {
    const controlPanel = document.getElementById('controlPanel')
    const advice = document.getElementById('advice')
    const hit = document.getElementById('hit')
    const stand = document.getElementById('stand')

    // What punto banco would do here, offered rather than enforced.
    advice.textContent = playerDraws(playerTotal)
        ? `On ${playerTotal} the book draws.`
        : `On ${playerTotal} the book stands.`

    controlPanel.style.display = 'inline-flex'

    return new Promise(resolve => {
        const finish = choice => {
            controlPanel.style.display = 'none'
            advice.textContent = ''
            hit.removeEventListener('click', onHit)
            stand.removeEventListener('click', onStand)
            resolve(choice)
        }
        const onHit = () => finish('hit')
        const onStand = () => finish('stand')
        hit.addEventListener('click', onHit)
        stand.addEventListener('click', onStand)
    })
}

/** The point values of a hand, in dealt order. */
function handValues(container) {
    return Array.from(container.children).map(card => card.dataset.value)
}

/** The cards on the table, as plain objects the rules can read. */
function handCards(container) {
    return Array.from(container.children).map(card => ({
        value: card.dataset.value,
        suit: card.dataset.suit,
    }))
}

function showTotal(el, total) {
    el.textContent = total
}

/** Pays the round out and presents it. */
async function finishRound() {
    const player = evaluateHand(handCards(playerHand))
    const banker = evaluateHand(handCards(computerHand))
    const outcome = winningSide(player, banker)
    const change = settle(wagerAmt, outcome, player, banker)

    const previousBalance = newPlayer.bankBalance
    newPlayer.bankBalance = Math.max(0, previousBalance + change)

    const verdict = change > 0 ? 'win' : change < 0 ? 'lose' : 'push'
    displayResult.textContent =
        verdict === 'push' ? 'push' : `${verdict} $${Math.abs(change)}`
    endState.dataset.outcome = verdict

    // Say why, so a hand that wins on 0 points doesn't look like a bug.
    const decider = outcome === 'player' ? player : outcome === 'banker' ? banker : null
    const named = decider && decider.name
    resultDetail.textContent = named
        ? `${decider.name} — ${decider.multiplier}x. You ${player.total}, banker ${banker.total}.`
        : `You ${player.total}, banker ${banker.total}.`

    // A hand that wins on its shape rather than its points gets called.
    if (decider && decider.auto) await announce(decider.name, 1000)

    markOutcome(outcome)
    countTo(renderBank, previousBalance, newPlayer.bankBalance)
    await pause(680)
    endState.style.display = 'flex'
    roundInProgress = false
}

function drawCard(container, facedown=false) {
    const cardDrawn = deck.cards.shift();
    const cardElement = cardDrawn.renderCard();
    if (facedown) {
        cardElement.classList.add('facedown');
    }
    // Stagger across the whole round, not per hand, so the four opening cards
    // land player, banker, player, banker the way they're actually dealt.
    cardElement.style.setProperty('--i', dealIndex);
    dealSettlesAt = performance.now() + dealIndex * DEAL_STEP + DEAL_DURATION;
    dealIndex += 1;
    return container.appendChild(cardElement);
}

/* ============================================================
   Table feel — timing and reveals only. None of this decides
   anything; the hands are settled by the rules above.
   ============================================================ */

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

/* Deal pacing. Must match the `deal` animation in style.css. */
const DEAL_STEP = 160;
const DEAL_DURATION = 520;
let dealIndex = 0;
/** When the last card dealt will have finished landing. */
let dealSettlesAt = 0;

/** Milliseconds until every dealt card has come to rest. */
function dealSettleDelay() {
    if (reducedMotion.matches) return 0;
    return Math.max(0, dealSettlesAt - performance.now());
}

/** Holds the table for a beat, so nothing resolves on top of the deal. */
function pause(ms) {
    if (reducedMotion.matches) return Promise.resolve();
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Turns a face-down card over. The face is swapped at the halfway point of
 * the rotation, while the card is edge-on, so you never see it change.
 */
function flipUp(card, delay = 0) {
    if (reducedMotion.matches) {
        card.classList.remove('facedown');
        return Promise.resolve();
    }
    return new Promise(resolve => {
        setTimeout(() => {
            card.classList.add('flipping');
            setTimeout(() => card.classList.remove('facedown'), 220);
            setTimeout(() => {
                card.classList.remove('flipping');
                resolve();
            }, 460);
        }, delay);
    });
}

/** Turns the banker's hand over one card at a time. */
function revealHand(container) {
    const hidden = Array.from(container.children).filter(card =>
        card.classList.contains('facedown')
    );
    if (!hidden.length) return Promise.resolve();
    return Promise.all(hidden.map((card, i) => flipUp(card, i * 170)));
}

/** Counts a balance up or down rather than snapping to the new figure. */
function countTo(el, from, to) {
    if (reducedMotion.matches || from === to) {
        el.innerText = to;
        return;
    }
    const start = performance.now();
    const duration = 520;
    const step = now => {
        const t = Math.min(1, (now - start) / duration);
        // Ease out, so it slows into the final number.
        const eased = 1 - Math.pow(1 - t, 3);
        el.innerText = Math.round(from + (to - from) * eased);
        if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
}

/** Marks the hand that took the round. */
function markOutcome(outcome) {
    [playerHand, computerHand].forEach(hand => hand.classList.remove('hand-won'));
    if (outcome === 'player') playerHand.classList.add('hand-won');
    if (outcome === 'banker') computerHand.classList.add('hand-won');
}

/**
 * Calls the hand before it's turned over — a natural, or whose turn it is
 * to draw. Resolves once the announcement has been read.
 */
function announce(text, ms = 1100) {
    const banner = document.getElementById('announce');
    if (!banner) return Promise.resolve();
    banner.textContent = text;
    banner.classList.add('is-on');
    if (reducedMotion.matches) {
        setTimeout(() => banner.classList.remove('is-on'), 400);
        return Promise.resolve();
    }
    return pause(ms).then(() => {
        banner.classList.remove('is-on');
        return pause(220);
    });
}

/** Sends the staked chip across the felt when a bet is placed. */
function tossChip(button) {
    if (reducedMotion.matches) return;
    const from = button.getBoundingClientRect();
    const ghost = button.cloneNode(true);
    ghost.classList.add('chip-ghost');
    ghost.disabled = true;
    ghost.style.left = `${from.left}px`;
    ghost.style.top = `${from.top}px`;
    ghost.style.width = `${from.width}px`;
    ghost.style.height = `${from.height}px`;
    document.body.appendChild(ghost);

    // Toward the middle of the table, where the hands are about to land.
    requestAnimationFrame(() => {
        ghost.style.transform = `translate(${
            window.innerWidth / 2 - from.left - from.width / 2
        }px, ${window.innerHeight / 2 - from.top - from.height / 2}px) scale(0.55)`;
        ghost.style.opacity = '0';
    });
    setTimeout(() => ghost.remove(), 620);
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
    endState.style.display = 'none'
    document.getElementById('controlPanel').style.display = 'none'
    document.getElementById('advice').textContent = ''
    delete endState.dataset.outcome
    playerHand.classList.remove('hand-won')
    computerHand.classList.remove('hand-won')
    playerTotalEl.textContent = ''
    bankerTotalEl.textContent = ''
    backingEl.textContent = ''
    punterArea.classList.remove('is-backed')
    bankerArea.classList.remove('is-backed')
    // The table and the betting panel are siblings in a flex row, so the
    // table has to be hidden or they render side by side.
    startGameState.style.display = 'none'

    if (newPlayer.bankBalance <= 0) {
        // The betting panel is a flex sibling, so it has to be hidden or it
        // sits alongside the game-over panel.
        wagerContainer.style.display = 'none'
        gameOver.style.display = 'flex'
        return
    }

    updateChips()
    wagerContainer.style.display = 'block'
}

playAgain.addEventListener('click', function () {
    newPlayer.bankBalance = STARTING_BALANCE
    renderBank.innerText = newPlayer.bankBalance
    gameOver.style.display = 'none'
    updateChips()
    wagerContainer.style.display = 'block'
})

/* Exposed for the rules test, which drives these directly. */
if (typeof window !== 'undefined') {
    window.__rules = {
        totalOf, isNatural, playerDraws, bankerDraws,
        evaluateHand, winningSide, settle, HANDS,
    }
}
