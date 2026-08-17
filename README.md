# Bar Car Rat

**Baccarat, but with worse decisions.** Punto banco in the browser — no build
step, no dependencies, three files.

▶︎ **[Play it](https://lee-lionel.github.io/BarCarRat/)**

![The betting panel: Player, Banker and Tie with their payouts, above four chips](screenshots/02-betting.png)

## How the game works

Back a hand — **Player**, **Banker** or **Tie** — and stake a chip. Both hands
are dealt two cards, the Banker's face down.

At a real table nobody decides anything from here: the Player hand draws on
0–5 by rule. **This table gives you that call.** Hit or stand as you like; the
book's advice is printed under the buttons and ignoring it is the entire
premise. The Banker still plays strictly by the published table.

**Card values.** Ace is 1, two through nine are face value, and ten, jack,
queen and king are all **zero**. A hand is the sum of its cards **modulo ten**,
so 7 + 8 = 15 counts as 5. The best possible hand is 9.

**A natural.** If either hand totals 8 or 9 on its first two cards, the round
ends immediately and neither hand draws.

**The Player hand** would draw on 0–5 and stand on 6–7. That's the advice
shown under Hit and Stand — here it's yours to overrule.

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

![Your move: a Player hand of 3 against the Banker's face-down cards, with Hit and Stand](screenshots/03-your-move.png)

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
down. Cards slide in off the shoe one at a time. You take your card or stand,
the hand is called (*Natural*, *Player stands*, *Banker draws*), the Banker's
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
so they can be checked directly against the table above. `playerDraws` is what
the advice line reports rather than what the game enforces; the Banker's rule
is enforced exactly.

`prefers-reduced-motion` is respected throughout; the animation collapses and
the game plays instantly.

## Running it

No build. Open `index.html`, or serve the folder:

```bash
python3 -m http.server 4600
# then visit http://localhost:4600
```
