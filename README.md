# Bar Car Rat

**Baccarat, but with worse decisions.** Punto banco in the browser — no build
step, no dependencies, three files.

▶︎ **[Play it](https://lee-lionel.github.io/BarCarRat/)**

![The betting panel: Player, Banker and Tie with their payouts, above four chips](screenshots/02-betting.png)

## How the game works

Real baccarat has no decisions once the cards are out. You back a hand, both
hands then draw by fixed rule, and the higher total wins. That is the whole
game — which is why there is no Hit or Stand here.

**Card values.** Ace is 1, two through nine are face value, and ten, jack,
queen and king are all **zero**. A hand is the sum of its cards **modulo ten**,
so 7 + 8 = 15 counts as 5. The best possible hand is 9.

**A natural.** If either hand totals 8 or 9 on its first two cards, the round
ends immediately and neither hand draws.

**The Player hand** draws a third card on 0–5 and stands on 6–7.

**The Banker hand** is the fiddly one. If the Player stood, the Banker uses the
same rule — draws on 0–5, stands on 6–7. If the Player drew, whether the Banker
draws depends on the Banker's total *and* the card the Player drew:

| Banker total | Draws when the Player's third card is |
| ------------ | ------------------------------------- |
| 0–2          | anything                              |
| 3            | anything except 8                     |
| 4            | 2–7                                   |
| 5            | 4–7                                   |
| 6            | 6–7                                   |
| 7            | stands                                |

![A resolved hand: Banker 8 against Player 6, with the winning hand lit](screenshots/04-result.png)

## What the bets pay

| Bet    | Pays        | Note                                                        |
| ------ | ----------- | ----------------------------------------------------------- |
| Player | 1 : 1       |                                                              |
| Banker | 1 : 1 − 5%  | The commission is what stops the slightly-favoured hand being free money |
| Tie    | 8 : 1       |                                                              |

A tie **pushes** Player and Banker bets — the stake comes back rather than
being taken.

## At the table

![The table mid-hand, the Banker's cards still face down](screenshots/03-table.png)

The round is dealt Player, Banker, Player, Banker, with the Banker's hand face
down. Cards slide in off the shoe one at a time. The hand is then called
(*Natural*, *Player draws*, *Player stands*, *Banker draws*), the Banker's
cards turn over one by one, and only then does the balance move and the result
appear. Nothing resolves on top of the deal.

A gold rail marks the hand you backed. The winning hand lifts and glows.

![Name entry](screenshots/01-seat.png)

## The code

| File         | What's in it                                                     |
| ------------ | ---------------------------------------------------------------- |
| `index.html` | Four panels — seat, table, betting, result — toggled by display   |
| `script.js`  | The rules, then the table                                        |
| `style.css`  | Felt, cards, chips, and the deal / flip / reveal animations       |

The rules live in pure functions with no DOM and no timing —
`totalOf`, `isNatural`, `playerDraws`, `bankerDraws`, `winningSide`, `settle` —
so they can be checked directly against the table above. Everything after them
is pacing, and none of it decides anything: the hand is settled before the
first card is turned over.

`prefers-reduced-motion` is respected throughout; the animation collapses and
the game plays instantly.

## Running it

No build. Open `index.html`, or serve the folder:

```bash
python3 -m http.server 4600
# then visit http://localhost:4600
```
