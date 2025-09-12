// Label definitions and colors
export const LABELS: { [key: number]: { name: string; color: string } } = {
  0: { name: '2', color: '#AA00FF' },
  1: { name: '3', color: '#CC00CC' },
  2: { name: '4', color: '#FF0099' },
  3: { name: '5', color: '#FF0066' },
  4: { name: 'Board', color: 'orange' },
  5: { name: 'b_advisor', color: '#0033FF' },
  6: { name: 'b_cannon', color: '#00FFFF' },
  7: { name: 'b_chariot', color: '#00CCFF' },
  8: { name: 'b_elephant', color: '#0066FF' },
  9: { name: 'b_general', color: '#0000FF' },
  10: { name: 'b_horse', color: '#0099FF' },
  11: { name: 'b_soldier', color: '#33CCFF' },
  12: { name: 'dark', color: '#222222' },
  13: { name: 'dark_b_advisor', color: '#001199' },
  14: { name: 'dark_b_cannon', color: '#009999' },
  15: { name: 'dark_b_chariot', color: '#007799' },
  16: { name: 'dark_b_elephant', color: '#003399' },
  17: { name: 'dark_b_general', color: '#000099' },
  18: { name: 'dark_b_horse', color: '#005599' },
  19: { name: 'dark_b_soldier', color: '#339999' },
  20: { name: 'dark_r_advisor', color: '#992200' },
  21: { name: 'dark_r_cannon', color: '#999900' },
  22: { name: 'dark_r_chariot', color: '#998800' },
  23: { name: 'dark_r_elephant', color: '#994400' },
  24: { name: 'dark_r_general', color: '#990000' },
  25: { name: 'dark_r_horse', color: '#996600' },
  26: { name: 'dark_r_soldier', color: '#997733' },
  27: { name: 'r_advisor', color: '#FF3300' },
  28: { name: 'r_cannon', color: '#FFFF00' },
  29: { name: 'r_chariot', color: '#FFCC00' },
  30: { name: 'r_elephant', color: '#FF6600' },
  31: { name: 'r_general', color: '#FF0000' },
  32: { name: 'r_horse', color: '#FF9900' },
  33: { name: 'r_soldier', color: '#FFCC33' },
}

// Piece name mapping
export const PIECE_MAP = {
  r_general: { char: '帅', color: 'red' },
  r_advisor: { char: '仕', color: 'red' },
  r_elephant: { char: '相', color: 'red' },
  r_horse: { char: '马', color: 'red' },
  r_chariot: { char: '车', color: 'red' },
  r_cannon: { char: '炮', color: 'red' },
  r_soldier: { char: '兵', color: 'red' },
  b_general: { char: '将', color: 'black' },
  b_advisor: { char: '士', color: 'black' },
  b_elephant: { char: '象', color: 'black' },
  b_horse: { char: '马', color: 'black' },
  b_chariot: { char: '车', color: 'black' },
  b_cannon: { char: '炮', color: 'black' },
  b_soldier: { char: '卒', color: 'black' },
  dark: { char: '暗', color: 'grey' },
}

export interface DetectionBox {
  box: [number, number, number, number] // [x, y, w, h] in original image coordinates
  score: number
  labelIndex: number
}

export interface ProcessedImage {
  canvas: HTMLCanvasElement
  context: CanvasRenderingContext2D
  meta: {
    r: number
    dw: number
    dh: number
    newW: number
    newH: number
    imgW: number
    imgH: number
  }
}
