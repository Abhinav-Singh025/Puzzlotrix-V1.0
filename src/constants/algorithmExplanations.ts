export interface AlgorithmExplanation {
  id: string;
  name: string;
  category: string;
  overview: string;
  purpose: string;
  keyIdea: string;
  steps: string[];
  example: string;
  advantages: string;
  limitations: string;
  complexity: string;
  educational: string;
}

export const algorithmExplanations: AlgorithmExplanation[] = [
  // PATHFINDING & SEARCH
  {
    id: 'astar-manhattan',
    name: 'A* Search (Manhattan Distance)',
    category: 'Pathfinding & Search',
    overview: 'An informed search algorithm that finds the shortest path by combining actual cost and estimated distance.',
    purpose: 'Used in Maze solving and Sliding Puzzles to find the most efficient route.',
    keyIdea: 'Uses f(n) = g(n) + h(n), where h(n) is the sum of horizontal and vertical steps to the goal.',
    steps: [
      'Add start node to the open list.',
      'Pick the node with the lowest f(n) value.',
      'If it is the goal, reconstruct the path.',
      'Otherwise, expand neighbors and calculate their f(n).',
      'Move current node to the closed list and repeat.'
    ],
    example: 'In a grid, moving from (0,0) to (2,2) has a Manhattan distance of 2+2=4.',
    advantages: 'Guaranteed to find the shortest path if the heuristic is admissible.',
    limitations: 'Can consume significant memory as it stores all explored nodes.',
    complexity: 'Time: O(b^d), Space: O(b^d).',
    educational: 'Teaches how "heuristics" (educated guesses) can drastically speed up search.'
  },
  {
    id: 'astar-hamming',
    name: 'A* Search (Hamming Distance)',
    category: 'Pathfinding & Search',
    overview: 'A variation of A* that uses a simpler heuristic: the count of misplaced items.',
    purpose: 'Used in Sliding Puzzles to estimate how many tiles are out of position.',
    keyIdea: 'h(n) is simply the number of tiles that are not in their target slot.',
    steps: [
      'Calculate Hamming distance by counting misplaced tiles.',
      'Use this value as the heuristic h(n) in the A* formula.',
      'Prioritize states with fewer misplaced tiles.'
    ],
    example: 'In an 8-puzzle, if tiles 1 and 2 are swapped, the Hamming distance is 2.',
    advantages: 'Very fast to calculate compared to Manhattan distance.',
    limitations: 'Less "informed" than Manhattan distance, often leading to more node expansions.',
    complexity: 'Time: O(b^d), Space: O(b^d).',
    educational: 'Demonstrates how different heuristics affect the efficiency of the same search algorithm.'
  },
  {
    id: 'idastar',
    name: 'IDA* (Iterative Deepening A*)',
    category: 'Pathfinding & Search',
    overview: 'A state-space search that combines the depth-first search\'s memory efficiency with A*\'s optimality.',
    purpose: 'Solving large Sliding Puzzles where memory is a constraint.',
    keyIdea: 'Performs multiple DFS passes with an increasing "f-limit" based on heuristics.',
    steps: [
      'Set the initial f-limit to the heuristic of the start node.',
      'Perform a DFS, pruning any branch where f(n) > limit.',
      'If goal is found, return it.',
      'If not, increase the limit to the smallest f-value that exceeded the previous limit and repeat.'
    ],
    example: 'Searching a tree where you only look 5 steps deep, then 7, then 10, until you find the goal.',
    advantages: 'Uses far less memory than A* (linear vs exponential).',
    limitations: 'May visit the same nodes multiple times across different iterations.',
    complexity: 'Time: O(b^d), Space: O(d).',
    educational: 'Shows the trade-off between time complexity and memory usage in AI.'
  },
  {
    id: 'greedy',
    name: 'Greedy Best-First Search',
    category: 'Pathfinding & Search',
    overview: 'A search algorithm that always expands the node that appears closest to the goal.',
    purpose: 'Quickly finding a solution in Mazes when the shortest path isn\'t strictly required.',
    keyIdea: 'Uses f(n) = h(n), completely ignoring the cost to reach the current node.',
    steps: [
      'Pick the node with the lowest heuristic value h(n).',
      'Expand its neighbors.',
      'Repeat until the goal is reached.'
    ],
    example: 'Walking straight toward a visible landmark, even if a slightly longer path around a hill is safer.',
    advantages: 'Often finds a solution very quickly in simple environments.',
    limitations: 'Not guaranteed to find the shortest path; can get stuck in local optima (dead ends).',
    complexity: 'Time: O(b^d), Space: O(b^d).',
    educational: 'Illustrates the "short-sighted" nature of greedy strategies.'
  },
  {
    id: 'bfs',
    name: 'Breadth First Search (BFS)',
    category: 'Pathfinding & Search',
    overview: 'A blind search algorithm that explores all nodes at the current depth before moving deeper.',
    purpose: 'Finding the shortest path in unweighted Mazes or simple Sliding Puzzles.',
    keyIdea: 'Explores the state space in "layers" or "waves" using a queue.',
    steps: [
      'Add the start node to a Queue.',
      'While the queue is not empty, pop the front node.',
      'If it is the goal, stop.',
      'Otherwise, add all unvisited neighbors to the back of the queue.'
    ],
    example: 'A ripple in a pond spreading outward in all directions equally.',
    advantages: 'Guaranteed to find the shortest path in unweighted graphs.',
    limitations: 'Extremely memory-intensive as it stores the entire "frontier" of the search.',
    complexity: 'Time: O(V+E), Space: O(V).',
    educational: 'The fundamental algorithm for understanding exhaustive search and connectivity.'
  },
  {
    id: 'dfs',
    name: 'Depth First Search (DFS)',
    category: 'Pathfinding & Search',
    overview: 'A blind search algorithm that explores as far as possible along each branch before backtracking.',
    purpose: 'Used in Maze generation and solving when memory is limited.',
    keyIdea: 'Explores deep into the state space using a stack (or recursion).',
    steps: [
      'Add the start node to a Stack.',
      'While the stack is not empty, pop the top node.',
      'If it is the goal, stop.',
      'Otherwise, add all unvisited neighbors to the top of the stack.'
    ],
    example: 'Walking through a maze by always turning right until you hit a dead end, then backtracking.',
    advantages: 'Very memory-efficient compared to BFS.',
    limitations: 'Not guaranteed to find the shortest path; can get lost in infinite branches.',
    complexity: 'Time: O(V+E), Space: O(d).',
    educational: 'Demonstrates the concept of backtracking and recursive exploration.'
  },
  {
    id: 'dijkstra',
    name: 'Dijkstra’s Algorithm',
    category: 'Pathfinding & Search',
    overview: 'A classic algorithm for finding the shortest paths between nodes in a graph.',
    purpose: 'Finding the optimal path in weighted Mazes where some cells cost more than others.',
    keyIdea: 'Always expands the node with the lowest cumulative cost from the start.',
    steps: [
      'Assign a distance of infinity to all nodes, 0 to the start.',
      'Pick the unvisited node with the smallest distance.',
      'Update distances of its neighbors.',
      'Mark the current node as visited and repeat.'
    ],
    example: 'Finding the fastest driving route between cities considering different speed limits.',
    advantages: 'Guaranteed to find the shortest path in any graph with non-negative weights.',
    limitations: 'Slower than A* because it doesn\'t use a heuristic to "aim" toward the goal.',
    complexity: 'Time: O(E + V log V), Space: O(V).',
    educational: 'The foundation of modern routing and network optimization.'
  },
  {
    id: 'dead-end-filling',
    name: 'Dead-End Filling',
    category: 'Pathfinding & Search',
    overview: 'A maze-solving technique that identifies and fills in dead-end corridors until only the solution path remains.',
    purpose: 'Used as a pre-processing step for Mazes to simplify the search space before running more complex algorithms.',
    keyIdea: 'If a cell (other than the start or end) is connected to only one other cell, it must be a dead end and cannot be part of the solution.',
    steps: [
      'Scan the maze for any cell that has exactly one neighbor (a dead end).',
      'Ensure the cell is not the Start or End point.',
      'Fill the cell by turning it into a wall.',
      'Repeat the process for the neighbor of the filled cell, as it might now also be a dead end.',
      'Continue until no more dead ends can be found.'
    ],
    example: 'In a simple T-junction where one branch leads to a wall, the algorithm fills that branch back to the junction.',
    advantages: 'Extremely fast and simplifies the maze significantly, often leaving only the solution path.',
    limitations: 'Only works for "perfect" mazes (no loops); in mazes with cycles, it won\'t find the shortest path if multiple exist.',
    complexity: 'Time: O(V), Space: O(1) or O(V).',
    educational: 'Demonstrates the power of "reduction" – solving a problem by removing what is definitely NOT the answer.'
  },

  // CONSTRAINT SATISFACTION
  {
    id: 'backtracking',
    name: 'Backtracking Search',
    category: 'Constraint Satisfaction',
    overview: 'A refined version of DFS used to find solutions to constraint satisfaction problems.',
    purpose: 'The core engine for Sudoku, KenKen, and N-Queens.',
    keyIdea: 'Assigns values one by one and "backtracks" as soon as a constraint is violated.',
    steps: [
      'Pick an unassigned variable.',
      'Try a value from its domain.',
      'If the value is consistent with constraints, move to the next variable.',
      'If no value works, go back to the previous variable and try its next value.'
    ],
    example: 'Filling a Sudoku grid and erasing a number when you realize it conflicts with another cell.',
    advantages: 'Systematically explores all possibilities and finds a valid solution.',
    limitations: 'Can be very slow (exponential time) for large or highly unconstrained problems.',
    complexity: 'Time: O(d^n), Space: O(n).',
    educational: 'Teaches the "trial and error" approach combined with logical pruning.'
  },
  {
    id: 'mrv',
    name: 'MRV (Minimum Remaining Values)',
    category: 'Constraint Satisfaction',
    overview: 'A heuristic used to choose which variable to assign next in backtracking.',
    purpose: 'Significantly speeds up Sudoku and N-Queens solvers.',
    keyIdea: 'Always pick the variable with the fewest legal values remaining (the "most constrained" variable).',
    steps: [
      'Count the number of legal values for every unassigned cell.',
      'Select the cell with the smallest count.',
      'If there\'s a tie, use a secondary heuristic or pick randomly.'
    ],
    example: 'In Sudoku, filling a cell that only has one possible number before filling one that has five.',
    advantages: 'Fails early, which prunes large sections of the search tree.',
    limitations: 'Requires extra computation at each step to count remaining values.',
    complexity: 'Reduces the effective branching factor of the search.',
    educational: 'Demonstrates how "fail-first" strategies can improve efficiency.'
  },
  {
    id: 'forward-checking',
    name: 'Forward Checking',
    category: 'Constraint Satisfaction',
    overview: 'A technique that looks ahead to see how a current assignment affects future variables.',
    purpose: 'Prevents the backtracking solver from making obviously bad moves in Sudoku.',
    keyIdea: 'Whenever a variable is assigned, remove inconsistent values from the domains of its neighbors.',
    steps: [
      'Assign a value to variable X.',
      'For every unassigned neighbor Y, remove values that conflict with X.',
      'If any neighbor\'s domain becomes empty, backtrack immediately.'
    ],
    example: 'Placing a "1" in a Sudoku row and immediately knowing no other cell in that row can be "1".',
    advantages: 'Detects failures much earlier than simple backtracking.',
    limitations: 'Only looks one step ahead; doesn\'t catch all possible future conflicts.',
    complexity: 'Adds a small overhead per step but saves massive amounts of search time.',
    educational: 'Introduces the concept of "look-ahead" in decision making.'
  },
  {
    id: 'ac3',
    name: 'AC-3 Algorithm',
    category: 'Constraint Satisfaction',
    overview: 'An algorithm that enforces "arc consistency" across the entire problem grid.',
    purpose: 'Pre-processing Sudoku or KenKen puzzles to eliminate impossible numbers.',
    keyIdea: 'Ensures that for every pair of related variables, every value in one has a corresponding valid value in the other.',
    steps: [
      'Maintain a queue of all "arcs" (constraints between two variables).',
      'Pop an arc (X, Y) and remove values from X that have no match in Y.',
      'If X\'s domain changes, re-add all arcs pointing to X back to the queue.'
    ],
    example: 'If Cell A must be greater than Cell B, and B can only be 9, then A is impossible and must be removed.',
    advantages: 'Can solve many simple puzzles entirely without any backtracking.',
    limitations: 'Computationally expensive to run repeatedly; doesn\'t solve all complex constraints.',
    complexity: 'Time: O(ed^3), where e is the number of constraints.',
    educational: 'Shows how global consistency can be achieved through local constraint propagation.'
  },
  {
    id: 'constraint-propagation',
    name: 'Constraint Propagation',
    category: 'Constraint Satisfaction',
    overview: 'The general process of using constraints to reduce the number of possible values for variables.',
    purpose: 'The "intelligence" behind all logic puzzles in Puzzlotrix.',
    keyIdea: 'Information "flows" through the grid: assigning one cell restricts others, which in turn restricts more.',
    steps: [
      'Apply a local constraint (e.g., row uniqueness).',
      'Update the possible values for affected cells.',
      'Trigger further updates based on the new information.',
      'Repeat until no more values can be removed.'
    ],
    example: 'In Minesweeper, knowing a cell has 1 mine and seeing 1 flag nearby means all other neighbors are safe.',
    advantages: 'Mimics human logical deduction very closely.',
    limitations: 'Can become complex to implement for non-binary or global constraints.',
    complexity: 'Varies based on the specific propagation rules used.',
    educational: 'The core concept of how logic can be used to "solve" a problem without guessing.'
  },

  // SPECIALIZED SOLVERS
  {
    id: 'logical-deduction',
    name: 'Logical Deduction',
    category: 'Specialized Solvers',
    overview: 'A solver that uses a set of predefined "if-then" rules to fill in the grid.',
    purpose: 'Solving Minesweeper and Nonograms where specific patterns have known meanings.',
    keyIdea: 'Applies human-like patterns (e.g., "1-2-1 pattern" in Minesweeper) to make progress.',
    steps: [
      'Scan the grid for known patterns.',
      'Apply the rule associated with the pattern.',
      'Update the grid and repeat until stuck.'
    ],
    example: 'In Nonograms, if a row of 10 has a clue of "8", the middle 6 cells must be filled.',
    advantages: 'Very fast and produces "explainable" steps that humans can follow.',
    limitations: 'Cannot solve puzzles that require "guessing" or complex look-ahead.',
    complexity: 'Usually linear or polynomial based on the number of rules.',
    educational: 'Teaches how expert systems use knowledge to solve problems.'
  },
  {
    id: 'probabilistic',
    name: 'Probabilistic Solver',
    category: 'Specialized Solvers',
    overview: 'A solver that calculates the likelihood of each cell being a certain value.',
    purpose: 'Handling "50/50" guesses in Minesweeper or complex Nonograms.',
    keyIdea: 'Uses math to determine which move is "statistically" safest when logic fails.',
    steps: [
      'Identify all possible valid configurations of the remaining cells.',
      'Count how many times each cell is a "mine" or "filled" across these configurations.',
      'Pick the cell with the lowest probability of being a mine.'
    ],
    example: 'In Minesweeper, choosing to click a cell that is a mine in only 10% of scenarios.',
    advantages: 'Maximizes the chance of winning even when a puzzle isn\'t perfectly logical.',
    limitations: 'Calculating all configurations can be extremely slow (NP-hard).',
    complexity: 'Exponential in the worst case.',
    educational: 'Introduces decision-making under uncertainty.'
  },
  {
    id: 'hybrid',
    name: 'Hybrid Algorithms',
    category: 'Specialized Solvers',
    overview: 'Algorithms that combine multiple techniques to solve a problem more efficiently.',
    purpose: 'The "Master Solver" for complex Mazes and Sudokus.',
    keyIdea: 'Uses fast logic first, then switches to powerful search only when necessary.',
    steps: [
      'Run fast constraint propagation.',
      'If the puzzle is not solved, use backtracking with MRV.',
      'In Mazes, use "Dead-End Filling" before running A*.'
    ],
    example: 'A human solving a Sudoku: doing the easy numbers first, then using a pencil to mark possibilities.',
    advantages: 'Combines the speed of logic with the completeness of search.',
    limitations: 'More complex to implement and maintain.',
    complexity: 'Depends on the constituent algorithms.',
    educational: 'Shows how real-world AI systems are often "ensembles" of different methods.'
  },
  {
    id: 'constructive',
    name: 'Constructive Algorithms',
    category: 'Specialized Solvers',
    overview: 'Algorithms that build a solution from scratch rather than searching through possibilities.',
    purpose: 'Generating valid puzzles like Mazes or Sudoku grids.',
    keyIdea: 'Follows a specific set of steps that are guaranteed to result in a valid structure.',
    steps: [
      'Start with an empty or random state.',
      'Apply a construction rule (e.g., "add a wall that doesn\'t block all paths").',
      'Continue until the structure is complete.'
    ],
    example: 'Building a house brick by brick following a blueprint.',
    advantages: 'Very fast and efficient for creating content.',
    limitations: 'Can lack variety if the construction rules are too rigid.',
    complexity: 'Usually linear or near-linear.',
    educational: 'Teaches the difference between "finding" a solution and "creating" one.'
  },

  // MAZE GENERATION
  {
    id: 'prim',
    name: 'Prim’s Maze Generation',
    category: 'Maze Generation',
    overview: 'A randomized version of Prim\'s algorithm for finding a Minimum Spanning Tree.',
    purpose: 'Creating "organic" looking mazes with many short branches.',
    keyIdea: 'Starts at a point and grows the maze outward by picking random adjacent walls.',
    steps: [
      'Start with a grid full of walls.',
      'Pick a cell, mark it as part of the maze.',
      'Add its walls to a list.',
      'While the list is not empty, pick a random wall.',
      'If the cell on the other side is not in the maze, remove the wall and add the new cell\'s walls to the list.'
    ],
    example: 'A mold growing across a surface, branching out in random directions.',
    advantages: 'Produces very balanced mazes that look natural.',
    limitations: 'Requires a list of all "frontier" walls, which can grow large.',
    complexity: 'Time: O(E log V), Space: O(V).',
    educational: 'Demonstrates how graph theory can be used for procedural content generation.'
  },
  {
    id: 'kruskal',
    name: 'Kruskal’s Maze Generation',
    category: 'Maze Generation',
    overview: 'A randomized version of Kruskal\'s algorithm using the "Union-Find" data structure.',
    purpose: 'Creating mazes with a high number of "dead ends" and long winding paths.',
    keyIdea: 'Treats every cell as a separate set and merges them by removing random walls.',
    steps: [
      'Create a list of all walls in the grid.',
      'For each wall, check if the cells it divides belong to the same set.',
      'If they don\'t, remove the wall and merge the two sets.',
      'Continue until all cells belong to a single set.'
    ],
    example: 'Connecting separate islands with bridges until everyone can reach everyone else.',
    advantages: 'Produces very "fair" mazes with no bias toward any direction.',
    limitations: 'Requires the Union-Find data structure to be efficient.',
    complexity: 'Time: O(E log E), Space: O(V).',
    educational: 'Introduces the concept of "Disjoint Set Union" (DSU).'
  },
  {
    id: 'eller',
    name: 'Eller’s Maze Algorithm',
    category: 'Maze Generation',
    overview: 'An incredibly memory-efficient algorithm that generates mazes one row at a time.',
    purpose: 'Generating "infinite" or very large mazes without storing the whole grid.',
    keyIdea: 'Only keeps track of the current row\'s connectivity state.',
    steps: [
      'Assign each cell in the row to a unique set.',
      'Randomly join adjacent cells that are in different sets.',
      'For each set, create at least one vertical connection to the next row.',
      'Repeat for the next row, carrying over the set information.'
    ],
    example: 'Printing a maze on a continuous roll of paper, row by row.',
    advantages: 'Extremely low memory usage; can generate mazes of any height.',
    limitations: 'The maze has a slight horizontal bias due to the row-by-row nature.',
    complexity: 'Time: O(V), Space: O(width).',
    educational: 'Shows how "streaming" algorithms can process massive data with tiny memory.'
  },
  {
    id: 'binary-tree-maze',
    name: 'Binary Tree Maze Algorithm',
    category: 'Maze Generation',
    overview: 'The simplest maze generation algorithm, based on a simple binary choice.',
    purpose: 'Generating very fast, simple mazes for testing.',
    keyIdea: 'For every cell, randomly choose to carve a path either North or East.',
    steps: [
      'Iterate through every cell in the grid.',
      'Flip a coin.',
      'If heads, carve a path to the North neighbor.',
      'If tails, carve a path to the East neighbor.'
    ],
    example: 'A grid where every room has exactly two doors: one up and one right.',
    advantages: 'Extremely fast and requires no memory of previous steps.',
    limitations: 'Produces very biased mazes with a clear "diagonal" texture and two open edges.',
    complexity: 'Time: O(V), Space: O(1).',
    educational: 'A great introduction to how simple rules can create complex structures.'
  },
  {
    id: 'recursive-dfs-maze',
    name: 'Recursive DFS Maze Generation',
    category: 'Maze Generation',
    overview: 'A randomized version of Depth-First Search used to "carve" a maze.',
    purpose: 'Creating mazes with very long, winding corridors.',
    keyIdea: 'A "drunk walker" that moves randomly and backtracks only when it hits a dead end.',
    steps: [
      'Pick a starting cell and mark it as visited.',
      'While there are unvisited neighbors, pick one at random.',
      'Remove the wall between them and move to the new cell.',
      'If no unvisited neighbors, backtrack to the previous cell.'
    ],
    example: 'Exploring a cave system by always going as deep as possible before turning back.',
    advantages: 'Produces mazes with high "river" factor (long paths) which are fun to solve.',
    limitations: 'Can hit stack overflow limits on very large grids if implemented recursively.',
    complexity: 'Time: O(V), Space: O(V).',
    educational: 'The most common way to understand the power of randomized depth-first exploration.'
  }
];
