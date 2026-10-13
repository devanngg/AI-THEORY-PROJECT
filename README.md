# Graph Coloring CSP Simulator

This project is an interactive AI theory demo that visualizes constraint satisfaction using graph coloring. It demonstrates how a graph can be colored with a fixed number of colors such that adjacent nodes never share the same color.

## Project idea

The project focuses on two core AI concepts:

- Backtracking search
- MRV (Most Constrained Variable) heuristic

### Problem statement
A graph is a set of nodes connected by edges. In graph coloring, each node must receive a color such that no two adjacent nodes share the same color. This is a classic Constraint Satisfaction Problem (CSP).

## Features

- Add nodes manually to the graph
- Create edges between nodes
- Generate a random graph
- Solve with standard backtracking
- Solve with MRV heuristic
- View step-by-step execution trace
- Observe statistics like assignments and backtracks
- Adjust color count and animation speed

## How to run

Open the project in a browser by serving the files locally:

```bash
cd "/Users/devangsabbarwal/Desktop/Ai Theory Project"
python3 -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

## Project structure

```text
.
├── index.html
├── style.css
├── app.js
├── README.md
```

## Algorithm summary

### Backtracking
The algorithm picks an uncolored node, tries a color, and recursively continues. If the color causes a conflict, it tries the next color. If no color works, it backtracks.

### MRV Heuristic
MRV selects the node with the fewest legal color options first. This reduces the search tree and often improves efficiency.

## Why this project is useful

This project is a strong AI theory project because it combines:

- problem modeling
- constraint satisfaction
- search algorithms
- heuristics
- visualization
- algorithm comparison

## Suggested title for submission

"Graph Coloring CSP Simulator using Backtracking and MRV Heuristic"

## Developer note

This project is designed to be easy to run and easy to explain during oral presentations and project viva.
