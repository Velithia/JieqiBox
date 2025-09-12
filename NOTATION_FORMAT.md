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
    "currentFen": "FEN string of the current board state",
    "openingComment": "Optional comment for the Opening position"
  },
  "moves": [
    {
      "type": "move",
      "data": "e7e6",
      "comment": "Good opening move",
      "annotation": "!",
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
- `openingComment`: Optional comment text for the Opening position (before any move). This enables annotating the initial position; it is displayed and editable in the comments panel at move index 0.

### moves

Each move record contains:

- `type`: The type of operation (`"move"` or `"adjust"`).
- `data`: The operation data (move in UCI format or adjustment information).
- `fen`: The FEN string of the board state after this move.
- `comment`: Optional user comment for this move (string). Comments can be edited by users.
- `annotation`: Optional move quality annotation (string). Values: `!!` (Brilliant), `!` (Good), `!?` (Interesting), `?!` (Dubious), `?` (Mistake), `??` (Blunder). Annotations can be set by users and affect the visual highlighting of moves.
- `engineScore`: Engine analysis score for this move (number). Only recorded if engine was thinking before the move. Default is 0 if engine was not thinking.
- `engineTime`: Engine analysis time in milliseconds for this move (number). Only recorded if engine was thinking before the move. Default is 0 if engine was not thinking.

#### Engine score (mate) encoding

- Non-mate positions: `engineScore` is a centipawn value (integer). Higher means better for the side indicated by the engine output.
- Mate positions: encoded as a large magnitude score using a base value `MATE_SCORE_BASE`.
  - Current base: `MATE_SCORE_BASE = 30000`.
  - If the engine reports mate in `ply` plies (e.g., `score mate 6`), we store:
    - `engineScore = + (MATE_SCORE_BASE - ply)` for a winning mate for the side to move
    - `engineScore = - (MATE_SCORE_BASE - ply)` for a losing mate for the side to move
  - Example: mate in 6 -> `+29994`; mate in 10 -> `-29990`.
- UI display: mate scores are shown as `+Mply` or `-Mply` (e.g., `+M6`, `-M10`).

## FEN Format Specification

The application supports both old and new FEN formats, with the new format being the default:

### New FEN Format (Default)

`[Board] [Side to Move] [Dark Piece Pool] [Captured Dark Piece Pool] [Halfmove Clock] [Fullmove Number]`

Example: `xxxxkxxPx/9/1x5x1/x1x1x1x1x/9/9/X1X1X1X1X/1X7/9/XXXXKXXXX b R2r2N2n2B2b2A2a2C2c2P4p4 p1 0 1`

### Old FEN Format (Legacy)

`[Board] [Dark Piece Pool] [Side to Move] [Castling] [En Passant] [Halfmove Clock] [Fullmove Number]`

Example: `xxxxkxxxx/9/1x5x1/x1x1x1x1x/9/9/X1X1X1X1X/1X5X1/9/XXXXKXXXX A2B2N2R2C2P5a2b2n2r2c2p5 w - - 0 1`

The application automatically detects the format when loading FEN strings and can generate either format based on interface settings.

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
    "currentFen": "xxxxkxxxx/9/1x5x1/x1x1x1x1x/9/9/X1X1X1X1X/1X5X1/9/XXXXKXXXX A2B2N2R2C2P5a2b2n2r2c2p5 w - - 0 1",
    "openingComment": "This is an example note for the opening position."
  },
  "moves": []
}
```

## Compatibility

- This format is specifically designed for Jieqi and is not compatible with the standard PGN format.
- It supports saving and restoring the complete game state.
- Game notations can be shared with other Jieqi applications that support this format (none yet, qwq).
