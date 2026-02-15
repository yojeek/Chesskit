# Play a game against LLM

## Summary

Use LLM as pseudo "chess engine" to perform moves against the player.


## UI 

Use existing "Play" page, add "LLM" as engine option, if AI API key is configured.

## Prompt

Based on https://github.com/maxim-saplin/llm_chess/

The prompt :

```
You are a professional chess player and you play as <black|white>. Now is your turn to make a move.

Avalable actions :
- 'make_move <UCI formatted move>' when you are ready to complete your turn (e.g., 'make_move e2e4')

Respond with the action.

Current postion :

♜ ♞ ♝ ♛ ♚ ♝ ♞ ♜
♟ ♟ ♟ ♟ ♟ ♟ ♟ ♟
· · · · · · · ·
· · · · · · · ·
· · · · · · · ·
· · · · · · · ·
♙ ♙ ♙ ♙ ♙ ♙ ♙ ♙
♖ ♘ ♗ ♕ ♔ ♗ ♘ ♖

Legal moves :

a7a6, b7b6, c7c6, d7d6, e7e6, f7f6, g7g6, h7h6, a7a5, b7b5, c7c5, d7d5, e7e5, f7f5, g7g5, h7h5

```

## The flow

Ask LLM about it's move based on prompt, apply it to the board.

If LLM responds with incorrect move or invalid data, count it as resignation.
