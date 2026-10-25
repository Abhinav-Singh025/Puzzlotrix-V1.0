import { KenKenGenerator } from './kenken/KenKenGenerator';
import { KenKenData } from '../types';

export class KenKenEngine {
  static generate(size: number, seed: number): KenKenData {
    return KenKenGenerator.generate(size, seed);
  }
}
