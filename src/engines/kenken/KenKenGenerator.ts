import { RNG } from '../../utils/rng';
import { KenKenData } from '../../types';
import { LatinSquareEngine } from '../LatinSquare';
import { CagePartitioner } from './CagePartitioner';
import { OperationAssigner } from './OperationAssigner';

export class KenKenGenerator {
  static generate(size: number, seed: number): KenKenData {
    const rng = new RNG(seed);
    const solution = LatinSquareEngine.generate(size, seed);
    
    const cellGroups = CagePartitioner.partition(size, rng);
    const cages = cellGroups.map(group => OperationAssigner.assign(group, solution, rng));
    
    const userGrid = Array.from({ length: size }, () => Array(size).fill(0));
    
    return { grid: userGrid, solution, cages };
  }
}
