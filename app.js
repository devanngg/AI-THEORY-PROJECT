const svg = document.getElementById('graph');
const stepsList = document.getElementById('steps');
const statsBox = document.getElementById('stats');
const colorCountInput = document.getElementById('color-count');
const speedInput = document.getElementById('speed');
const statusBadge = document.getElementById('status-badge');

const colorPalette = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#ffd166', '#a78bfa', '#f79d65', '#7bd389', '#ff9fcd'];

const state = {
  nodes: [],
  edges: [],
  nextId: 1,
  currentAssignment: {},
  selectedNode: null,
  animating: false,
};

function setStatus(label, tone = 'neutral') {
  statusBadge.textContent = label;
  statusBadge.className = `status-badge ${tone}`;
}

function generateId() {
  const id = state.nextId;
  state.nextId += 1;
  return id;
}

function colorForIndex(index) {
  return colorPalette[index % colorPalette.length];
}

function addNode(x = 150 + Math.random() * 600, y = 110 + Math.random() * 300) {
  const node = {
    id: generateId(),
    x,
    y,
    radius: 24,
  };
  state.nodes.push(node);
  render();
}

function removeNode(nodeId) {
  state.nodes = state.nodes.filter((node) => node.id !== nodeId);
  state.edges = state.edges.filter(([a, b]) => a !== nodeId && b !== nodeId);
  if (state.selectedNode === nodeId) {
    state.selectedNode = null;
  }
  render();
}

function addEdge(fromId, toId) {
  const exists = state.edges.some(([a, b]) => (a === fromId && b === toId) || (a === toId && b === fromId));
  if (exists || fromId === toId) return;
  state.edges.push([fromId, toId]);
  render();
}

function clearAssignment() {
  state.currentAssignment = {};
}

function resetGraph() {
  state.nodes = [];
  state.edges = [];
  state.selectedNode = null;
  clearAssignment();
  setStatus('Ready');
  render();
}

function randomGraph() {
  resetGraph();
  const nodeCount = 7;
  const positions = [
    [140, 160], [360, 100], [640, 180], [220, 380], [500, 340], [760, 370], [430, 220],
  ];

  positions.slice(0, nodeCount).forEach(([x, y], index) => {
    state.nodes.push({ id: index + 1, x, y, radius: 24 });
  });
  state.nextId = nodeCount + 1;

  const edgeMap = new Set();
  for (let i = 0; i < state.nodes.length; i += 1) {
    for (let j = i + 1; j < state.nodes.length; j += 1) {
      if (Math.random() < 0.42) {
        const pair = [state.nodes[i].id, state.nodes[j].id].sort((a, b) => a - b).join('-');
        if (!edgeMap.has(pair)) {
          edgeMap.add(pair);
          state.edges.push([state.nodes[i].id, state.nodes[j].id]);
        }
      }
    }
  }

  render();
}

function getNodeById(nodeId) {
  return state.nodes.find((node) => node.id === nodeId);
}

function getNeighbors(nodeId) {
  return state.edges
    .filter(([a, b]) => a === nodeId || b === nodeId)
    .map(([a, b]) => (a === nodeId ? b : a));
}

function isValidColor(nodeId, color, assignment) {
  return !getNeighbors(nodeId).some((neighborId) => assignment[neighborId] === color);
}

function showSteps(steps) {
  stepsList.innerHTML = '';
  steps.forEach((step) => {
    const item = document.createElement('li');
    item.textContent = step;
    stepsList.appendChild(item);
  });
}

function showStats(text) {
  statsBox.textContent = text;
}

function buildGraphStateFromAssignment(assignment) {
  const shape = {};
  state.nodes.forEach((node) => {
    shape[node.id] = assignment[node.id] ?? null;
  });
  return shape;
}

function render() {
  svg.innerHTML = '';

  const edgesLayer = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  state.edges.forEach(([a, b]) => {
    const from = getNodeById(a);
    const to = getNodeById(b);
    if (!from || !to) return;

    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', from.x);
    line.setAttribute('y1', from.y);
    line.setAttribute('x2', to.x);
    line.setAttribute('y2', to.y);
    line.setAttribute('class', 'edge');
    edgesLayer.appendChild(line);
  });
  svg.appendChild(edgesLayer);

  state.nodes.forEach((node) => {
    const assignmentValue = state.currentAssignment[node.id];
    const color = assignmentValue !== undefined ? colorForIndex(assignmentValue) : '#2d3d52';

    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', node.x);
    circle.setAttribute('cy', node.y);
    circle.setAttribute('r', node.radius);
    circle.setAttribute('fill', color);
    circle.setAttribute('stroke', state.selectedNode === node.id ? '#ffd166' : '#dfeaff');
    circle.setAttribute('stroke-width', state.selectedNode === node.id ? 4 : 2);
    circle.setAttribute('class', 'node');

    circle.addEventListener('click', (event) => {
      event.stopPropagation();
      if (state.animating) return;

      if (state.selectedNode === null) {
        state.selectedNode = node.id;
      } else if (state.selectedNode === node.id) {
        removeNode(node.id);
        state.selectedNode = null;
      } else {
        addEdge(state.selectedNode, node.id);
        state.selectedNode = null;
      }
      render();
    });

    svg.appendChild(circle);

    const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    label.setAttribute('x', node.x);
    label.setAttribute('y', node.y + 5);
    label.setAttribute('text-anchor', 'middle');
    label.setAttribute('class', 'node-label');
    label.textContent = node.id;
    svg.appendChild(label);
  });

  svg.onclick = (event) => {
    if (state.animating) return;
    const rect = svg.getBoundingClientRect();
    const point = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
    addNode(point.x, point.y);
  };
}

function solveBacktracking() {
  if (state.animating || state.nodes.length === 0) return;

  const maxColors = Number(colorCountInput.value) || 3;
  const assignment = {};
  const steps = [];
  let backtracks = 0;
  let assignments = 0;

  function backtrack() {
    const unassigned = state.nodes.find((node) => assignment[node.id] === undefined);
    if (!unassigned) {
      return true;
    }

    for (let color = 0; color < maxColors; color += 1) {
      if (!isValidColor(unassigned.id, color, assignment)) {
        steps.push(`Node ${unassigned.id}: color ${color} invalid due to neighbor conflict.`);
        continue;
      }

      assignment[unassigned.id] = color;
      assignments += 1;
      steps.push(`Assign node ${unassigned.id} to color ${color}.`);

      if (backtrack()) {
        return true;
      }

      delete assignment[unassigned.id];
      backtracks += 1;
      steps.push(`Backtrack: node ${unassigned.id} cannot use color ${color}.`);
    }

    return false;
  }

  const solved = backtrack();

  if (!solved) {
    showSteps(['No valid coloring found for the chosen number of colors.']);
    showStats(`No solution with ${maxColors} colors. Backtracks: ${backtracks}. Assignments: ${assignments}.`);
    setStatus('No solution', 'danger');
    return;
  }

  animateSolution(steps, assignment, 'Backtracking', backtracks, assignments);
}

function solveMRV() {
  if (state.animating || state.nodes.length === 0) return;

  const maxColors = Number(colorCountInput.value) || 3;
  const assignment = {};
  const steps = [];
  let backtracks = 0;
  let assignments = 0;

  function selectNode() {
    let bestNode = null;
    let bestOptions = null;

    for (const node of state.nodes) {
      if (assignment[node.id] !== undefined) continue;

      const options = [];
      for (let color = 0; color < maxColors; color += 1) {
        if (isValidColor(node.id, color, assignment)) {
          options.push(color);
        }
      }

      if (bestNode === null || options.length < bestOptions.length) {
        bestNode = node;
        bestOptions = options;
      }
    }

    return { node: bestNode, options: bestOptions || [] };
  }

  function backtrack() {
    const next = selectNode();
    if (!next.node) {
      return true;
    }

    const { node, options } = next;
    steps.push(`MRV selects node ${node.id} with domain ${options.join(', ') || 'none'}.`);

    if (options.length === 0) {
      return false;
    }

    for (const color of options) {
      assignment[node.id] = color;
      assignments += 1;
      steps.push(`Assign node ${node.id} to color ${color} using MRV.`);

      if (backtrack()) {
        return true;
      }

      delete assignment[node.id];
      backtracks += 1;
      steps.push(`Backtrack: node ${node.id} cannot keep color ${color}.`);
    }

    return false;
  }

  const solved = backtrack();

  if (!solved) {
    showSteps(['No valid coloring found for the chosen number of colors using MRV.']);
    showStats(`No solution with ${maxColors} colors using MRV. Backtracks: ${backtracks}. Assignments: ${assignments}.`);
    setStatus('No solution', 'danger');
    return;
  }

  animateSolution(steps, assignment, 'MRV Heuristic', backtracks, assignments);
}

function animateSolution(steps, finalAssignment, methodName, backtracks, assignments) {
  state.animating = true;
  const delay = Number(speedInput.value) || 450;
  const fullSteps = [...steps];
  const currentCopy = {};
  state.currentAssignment = {};

  showSteps([]);
  const stepQueue = fullSteps.map((step) => ({ text: step }))
    .filter((entry) => entry.text.trim().length > 0);

  stepQueue.forEach((entry, index) => {
    setTimeout(() => {
      const match = entry.text.match(/Assign node (\d+) to color (\d+)/i);
      const backtrackMatch = entry.text.match(/Backtrack: node (\d+) cannot keep color (\d+)/i);

      if (match) {
        const nodeId = Number(match[1]);
        const color = Number(match[2]);
        currentCopy[nodeId] = color;
      } else if (backtrackMatch) {
        const nodeId = Number(backtrackMatch[1]);
        delete currentCopy[nodeId];
      }

      state.currentAssignment = { ...currentCopy };
      render();

      if (index === 0) {
        showSteps([entry.text]);
      } else {
        showSteps(fullSteps.slice(0, index + 1));
      }

      if (index === stepQueue.length - 1) {
        state.currentAssignment = { ...finalAssignment };
        render();
        setStatus(`${methodName} solved`, 'success');
        showStats(`${methodName} completed successfully. Assignments: ${assignments}. Backtracks: ${backtracks}.`);
        state.animating = false;
      }
    }, index * delay);
  });
}

colorCountInput.addEventListener('change', () => {
  const value = Number(colorCountInput.value) || 3;
  colorCountInput.value = Math.max(1, Math.min(8, value));
});

document.getElementById('add-node').addEventListener('click', () => {
  if (state.animating) return;
  addNode(200 + Math.random() * 500, 150 + Math.random() * 250);
});

document.getElementById('reset-graph').addEventListener('click', () => {
  resetGraph();
});

document.getElementById('random-graph').addEventListener('click', () => {
  randomGraph();
  setStatus('Random graph ready');
});

document.getElementById('solve-backtracking').addEventListener('click', () => {
  solveBacktracking();
});

document.getElementById('solve-mrv').addEventListener('click', () => {
  solveMRV();
});

resetGraph();
randomGraph();
