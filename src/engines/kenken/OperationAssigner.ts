import { RNG } from '../../utils/rng';
import { KenKenOp, KenKenCage } from '../../types';

export class OperationAssigner {
  static assign(cells: { r: number; c: number }[], solution: number[][], rng: RNG): KenKenCage {
    const values = cells.map(cell => solution[cell.r][cell.c]);
    let op: KenKenOp = 'none';
    let target = 0;

    if (cells.length === 1) {
      target = values[0];
    } else if (cells.length === 2) {
      const ops: KenKenOp[] = ['+', '-', '*', '/'];
      const [v1, v2] = values;
      
      // Filter valid operations
      const validOps = ops.filter(o => {
        if (o === '/') return v1 % v2 === 0 || v2 % v1 === 0;
        return true;
      });
      
      op = validOps[rng.nextInt(0, validOps.length - 1)];
      
      if (op === '+') target = v1 + v2;
      else if (op === '-') target = Math.abs(v1 - v2);
      else if (op === '*') target = v1 * v2;
      else if (op === '/') target = v1 > v2 ? v1 / v2 : v2 / v1;
    } else {
      // 3+ cells: prefer + or *
      op = rng.next() < 0.7 ? '+' : '*';
      if (op === '+') target = values.reduce((a, b) => a + b, 0);
      else target = values.reduce((a, b) => a * b, 1);
    }

    return { 
      id: rng.nextInt(0, 1000000),
      cells: cells, 
      target, 
      op: op === 'none' ? '' : op 
    };
  }
}
