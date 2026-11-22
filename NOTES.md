# Glorg's Games: project notes

A personal, offline-capable game collection for phone, hosted on GitHub Pages from this repository.
These notes are for whoever continues the project (including a future Claude chat).

## The cats
Opponents and personalities throughout the games. Photos are `cat-*.jpg`; lines live in `cats.js`.

| Cat | Pronouns | Difficulty (Chess / Dice Duel) |
|---|---|---|
| Glorg (black & white, the mascot) | she/her | Easy |
| Sushi (black) | he/him | Medium |
| Squeex (grey) | she/her | Hard |
| Mojito (brown tabby) | he/him | Expert |

## Games built so far
| File | Game | Notes |
|---|---|---|
| `index.html` | Game menu | Shows "In progress" badges, dark mode toggle |
| `wordrack.html` | Word Rack (Scrabble-style) | ENABLE dictionary from GitHub (or `enable1.txt` if added here), `words.txt` fallback. 1–3 cat opponents, hints 5/3/1/0 by difficulty, smack talk, free swap when stuck |
| `hearts.html` | Hearts | 3 random cats, Mixed difficulty, Expert uses look-ahead (card counting), game speed setting |
| `sudoku.html` | Sudoku | 4 difficulties, notes, 3 hints, 3 mistakes, timer, score |
| `chess.html` + `chess-engine.js` | Chess | Cat tied to difficulty, engine runs in a background worker, rules verified with perft |
| `property.html` + `property-engine.js` | Purrperty (Monopoly-style) | Cat-themed board, 1–3 cats, 3 game lengths (last standing capped at round 80, rounds, net worth target). Trading both ways, auctions, mortgages, Vet's Office = jail. Expert (Mojito) uses look-ahead with identical dice per option; beats Hard ~78% 1v1. First build Nov 2026: expect playtest tweaks. |
| `dice.html` + `dice-ai.js` | Dice Duel (Yahtzee-style) | 1v1 vs a cat, campaign = beat all 4 cats in a row, game speed setting. House rule: extra 5-of-a-kinds can go in any box (wild for Full House/straights), +100 each. Dice sort low to high after each roll. |

Shared: `cats.js` (names, pronouns, win/lose/draw lines, table talk), `sw.js` (offline cache: bump `CACHE` and add new files to `FILES` whenever files change), `manifest.webmanifest` (app name "Glorg's Games").
Settings shared across games via localStorage: `wordrack-theme` (dark/light), `cats-talk` (smack talk on/off).
Every game: saves after each move, Export/Import stats codes, dark mode, "← Games" back link.

## Roadmap (agreed Nov 2026)
Not all of these will be built. Suggested order first.

| # | Game idea | Feasibility | Notes |
|---|---|---|---|
| 1 | Yahtzee-style dice | Easy | **Done: Dice Duel** |
| 2 | Property trading (Monopoly / Fortune Street) | Big but doable | **First build done: Purrperty** (Monopoly-style). Possible later: Fortune Street-style stocks, house/hotel shortage, more trade features. |
| 3 | Match-3 (Bejeweled / Candy Crush) | Easy–medium | Turn-based, light on battery. Levels with goals or endless. |
| 4 | Falling-bean puzzle (Mean Bean Machine) | Medium | Grid rules are simple. Versus a cat who sends junk beans would be great. |
| 5 | Peggle-style | Medium | Simple 2D physics; most work is fun peg layouts. |
| 6 | Maze tower defense (Xeno Tactic) | Medium–hard | Towers form the path, enemies route around them. Mostly balancing; make the last level beatable. |
| 7 | Two-sided battle (Age of War 2 / Battle Cats) | Medium–hard | Natural fit with the cats as units. Balancing units/upgrades/enemy behavior is the work. |
| 8 | Lane defense (Plants vs. Zombies) | Medium–hard | Content-heavy (many unit types) to stay interesting. |
| 9 | Endless runner | Medium | 2D side-scroller (Jetpack Joyride / Monster Dash) only, not 3D. Most constant animation, so hardest to keep cool. |
| 10 | Flick home run | Hardest to get right | Feel depends on lots of tuning; expect many playtest rounds. |
| 11 | Poker | Medium | Two modes: standard Texas Hold'em vs the cats (betting, bluffing cat personalities), plus a simplified quick mode in the style of the New Super Mario Bros. DS dealer minigame (one draw/hold round, hand vs the dealer, betting a stack of coins). Turn-based, so light on battery. Suggested idea added Nov 2026. |

**Real-time games (4–10) must stay cool:** the whole project started because a Flash site overheated the phone.
Only redraw what moves, pause when the app is hidden, keep effects simple, and avoid always-running animation loops on menus.
All visuals are drawn in code (shapes, CSS, SVG); no outside art or assets.

## How updates are delivered
GitHub is connected to Claude (Nov 2026), so Claude commits and pushes updates straight to `main`; GitHub Pages redeploys within a minute or two.
On the phone, open the app once while online to pick up the update.
Fallback if that ever stops working: Claude sends a zip; unzip, then **Add file → Upload files** here, drag in every file, **Commit changes**.
