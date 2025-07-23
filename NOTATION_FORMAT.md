# Jieqi Game Notation Format Specification

## Overview

This application uses a custom JSON format to save game notations. Compared to the standard PGN format, it can store special states such as unrevealed pieces, flip mode, and more.

## File Format

The game notation file uses the JSON format with a `.json` file extension.

## Data Structure (example only; data may not represent real-world values)

```json
{
  "metadata": {
    "event": "Jieqi Game",
    "site": "jieqibox",
    "date": "2024-01-01",
    "round": "1",
    "white": "Red",
    "black": "Black",
    "result": "*",
    "initialFen": "xxxxkxxxx/9/1x5x1/x1x1x1x1x/9/9/X1X1X1X1X/1X5X1/9/XXXXKXXXX A2B2N2R2C2P5a2b2n2r2c2p5 w - - 0 1",
    "flipMode": "random",
    "currentFen": "FEN string of the current board state"
  },
  "moves": [
    {
      "type": "move",
      "data": "e7e6",
      "comment": "Good opening move",
      "fen": "xxxxkxxxx/9/1x5x1/x1x1x1x1x/9/9/X1X1X1X1X/1X5X1/9/XXXXKXXXX A2B2N2R2C2P5a2b2n2r2c2p5 w - - 0 1",
      "engineScore": 0.5,
      "engineTime": 1250
    }
  ]
}
```

## Field Descriptions

### metadata

- `event`: Name of the game event.
- `site`: Location of the game.
- `date`: Date of the game (YYYY-MM-DD format).
- `round`: Round number.
- `white`: Name of the Red player.
- `black`: Name of the Black player.
- `result`: Game result (`*` indicates ongoing).
- `initialFen`: FEN string for the initial board setup.
- `flipMode`: Flip mode (`"random"` or `"free"`).
- `currentFen`: FEN string for the current board state.

### moves

Each move record contains:

- `type`: The type of operation (`"move"` or `"adjust"`).
- `data`: The operation data (move in UCI format or adjustment information).
- `fen`: The FEN string of the board state after this move.
- `comment`: Optional user comment for this move (string). Comments can be edited by users.
- `engineScore`: Engine analysis score for this move (number). Only recorded if engine was thinking before the move. Default is 0 if engine was not thinking.
- `engineTime`: Engine analysis time in milliseconds for this move (number). Only recorded if engine was thinking before the move. Default is 0 if engine was not thinking.

## FEN Format Specification

The FEN string format is: `[Board] [Dark Piece Pool] [Side to Move] [Other Info]`

### Board Part

- Uppercase letters: Red's revealed pieces (R: Chariot, N: Horse, B: Elephant, A: Advisor, K: King, C: Cannon, P: Pawn).
- Lowercase letters: Black's revealed pieces (r: Chariot, n: Horse, b: Elephant, a: Advisor, k: King, c: Cannon, p: Pawn).
- `X`: Red's unrevealed piece.
- `x`: Black's unrevealed piece.
- Numbers: Represent the number of consecutive empty squares.
- `/`: Row separator.

### Unrevealed Pool Part

The format is `[PieceChar][Count]`, for example, `A2B2N2R2C2P5a2b2n2r2c2p5`.

- Uppercase letters: Red's unrevealed pieces.
- Lowercase letters: Black's unrevealed pieces.
- Numbers: The count of that specific piece.

### Side to Move Part

- `w`: Red's turn to move.
- `b`: Black's turn to move.

## Example

```json
{
  "metadata": {
    "event": "Jieqi Game",
    "site": "jieqibox",
    "date": "2024-01-15",
    "white": "Player A",
    "black": "Player B",
    "result": "*",
    "initialFen": "xxxxkxxxx/9/1x5x1/x1x1x1x1x/9/9/X1X1X1X1X/1X5X1/9/XXXXKXXXX A2B2N2R2C2P5a2b2n2r2c2p5 w - - 0 1",
    "flipMode": "random",
    "currentFen": "xxxxkxxxx/9/1x5x1/x1x1x1x1x/9/9/X1X1X1X1X/1X5X1/9/XXXXKXXXX A2B2N2R2C2P5a2b2n2r2c2p5 w - - 0 1"
  },
  "moves": []
}
```

## Compatibility

- This format is specifically designed for Jieqi and is not compatible with the standard PGN format.
- It supports saving and restoring the complete game state.
- Game notations can be shared with other Jieqi applications that support this format (none yet, qwq).
