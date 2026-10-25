/**
 * Logarithmic math utilities for state space calculations
 */

export function log10Factorial(n: number): number {
  if (n < 2) return 0;
  // Stirling's approximation: log10(n!) ≈ n log10(n) - n log10(e) + 0.5 log10(2πn)
  return n * Math.log10(n) - n * Math.log10(Math.E) + 0.5 * Math.log10(2 * Math.PI * n);
}

export function formatStateSpace(exponent: number): string {
  if (exponent < 0) return "0";
  if (exponent < 12) {
    const val = Math.pow(10, exponent);
    if (val < 1000000) return Math.round(val).toLocaleString();
    return val.toExponential(2);
  }
  return `≈ 10^${exponent.toFixed(2)}`;
}

export function calculateStateSpace(type: string, n: number, rows?: number, cols?: number): number {
  const r = rows || n;
  const c = cols || n;
  const total = r * c;

  switch (type) {
    case 'math-latin-square':
      return total * Math.log10(n);
    
    case 'sudoku':
      if (n === 9) return 21.82;
      return total * Math.log10(n);
    
    case 'maze': {
      // Use the logical grid size (n) directly as the number of cells
      // This ensures the state space changes with every grid size adjustment
      const nodesR = n;
      const nodesC = n;
      
      if (nodesR < 2 || nodesC < 2) return 0;

      if (nodesR <= 20 && nodesC <= 20) {
        // Kirchhoff product formula: T(n,m) = prod_{i=1}^{n-1} prod_{j=1}^{m-1} [4 - 2cos(i*pi/n) - 2cos(j*pi/m)]
        let logSum = 0;
        for (let i = 1; i < nodesR; i++) {
          for (let j = 1; j < nodesC; j++) {
            const term = 4 - 2 * Math.cos((i * Math.PI) / nodesR) - 2 * Math.cos((j * Math.PI) / nodesC);
            if (term <= 0) throw new Error("Numerical instability detected");
            logSum += Math.log(term);
          }
        }
        return logSum / Math.log(10);
      } else {
        // Asymptotic approximation for large grids
        // T(n,m) ≈ 3.209912^(nm)
        return (nodesR * nodesC) * Math.log10(3.209912);
      }
    }
    
    case 'n-queens':
      return log10Factorial(n);
    
    case 'minesweeper':
      return total * Math.log10(2);
    
    case 'nonogram':
      return total * Math.log10(2);
    
    case 'sliding-puzzle':
      // (total)! / 2
      return log10Factorial(total) - Math.log10(2);
    
    case 'kenken':
      return total * Math.log10(n);
    
    default:
      return 0;
  }
}
