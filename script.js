var docwidth, docheight;
var disc_width, disc_height;
var dimensions = [7, 6];
var board;
var red_turn_global;
var global_ROOT;
var expansion_const = 2;
var ai_turn = false;
var monte_carlo_trials = 5000;
var over;

var boardui = document.getElementById("board");
var brush = boardui.getContext("2d");

$(document).ready(function() {
  docwidth = $(document).outerWidth(true);
  docheight = $(document).outerHeight(true);
  
  $('#board').width(docwidth).height(docheight);
  boardui.setAttribute('width', docwidth);
  boardui.setAttribute('height', docheight);
  
  disc_width = docwidth / (dimensions[0] + 1);
  disc_height = docheight / (dimensions[1] + 1);
  
  new_game();
    
  dimensions = eval(prompt("Enter the board dimensions:", "[7, 6]"));
  
  disc_width = docwidth / (dimensions[0] + 1);
  disc_height = docheight / (dimensions[1] + 1);
  
  var ai_color = prompt("Enter the ai's turn:", "Second").toLowerCase();
  switch (ai_color) {
    case "first":
      ai_turn = true;
      break;
    case "second":
      ai_turn = false;
      break;
    default: ai_turn = null;
  }
  
  if (ai_turn != null)
    monte_carlo_trials = parseInt(prompt("Number of Monte Carlo Trials:", "5000"), 10);
  
  new_game();
});

function new_game() {
  over = false;
  board = new Array(dimensions[0]);
  for (var i = 0; i < board.length; i++) {
    board[i] = new Array(dimensions[1]);
    for (var a = 0; a < board[i].length; a++)
      board[i][a] = false;
  }
  red_turn_global = true;
  global_ROOT = create_MCTS_root();
  run_MCTS(board.length);
  draw_board();
  
  if (ai_turn == red_turn_global)
    setTimeout(play_ai_move, 100);
}

function drawEllipse(x, y, w, h) {
  var kappa = 0.5522848,
      ox = (w / 2) * kappa, // control point offset horizontal
      oy = (h / 2) * kappa, // control point offset vertical
      xe = x + w,           // x-end
      ye = y + h,           // y-end
      xm = x + w / 2,       // x-middle
      ym = y + h / 2;       // y-middle

  brush.moveTo(x, ym);
  brush.bezierCurveTo(x, ym - oy, xm - ox, y, xm, y);
  brush.bezierCurveTo(xm + ox, y, xe, ym - oy, xe, ym);
  brush.bezierCurveTo(xe, ym + oy, xm + ox, ye, xm, ye);
  brush.bezierCurveTo(xm - ox, ye, x, ym + oy, x, ym);
}

function clear_board() {
  brush.clearRect(0, 0, docwidth, docheight);
}

function draw_grid() {
  brush.lineWidth = 2;
  brush.strokeStyle = "black";
  
  brush.beginPath();
  for (var i = disc_width / 2; i < docwidth; i += disc_width) {
    brush.moveTo(i, disc_height / 2);
    brush.lineTo(i, docheight - disc_height / 2);
  }
  for (var a = 3 * disc_height / 2; a < docheight; a += disc_height) {
    brush.moveTo(disc_width / 2, a);
    brush.lineTo(docwidth - disc_width / 2, a);
  }
  brush.stroke();
  brush.closePath();
}

function draw_piece(x, y) {
  switch (board[x][y]) {
    case 'R':
      brush.fillStyle = "red";
      break;
    case 'Y':
      brush.fillStyle = "yellow";
      break;
    default: return;
  }
  brush.beginPath();
  drawEllipse(x * disc_width + disc_width / 2, y * disc_height + disc_height / 2, disc_width, disc_height);
  brush.fill();
  brush.closePath();
}

function draw_board() {
  clear_board();
  draw_grid();
  
  for (var i = 0; i < board.length; i++)
    for (var a = 0; a < board[i].length; a++)
      if (board[i][a])
        draw_piece(i, a);
}

function draw_hover(col) {
  var color = red_turn_global ? "R":"Y";
  draw_board();
  switch (color) {
    case 'R':
      brush.fillStyle = "red";
      break;
    case 'Y':
      brush.fillStyle = "yellow";
      break;
    default: return;
  }
  brush.beginPath();
  drawEllipse(col * disc_width + disc_width / 2, 0, disc_width, disc_height);
  brush.fill();
  brush.closePath();
}

function get_col(xloc) {
  if (xloc > docwidth - disc_width / 2 || xloc < disc_width / 2)
    return -1;
  return Math.floor((xloc - disc_width / 2) / disc_width);
}

function legal_move(tboard, col, output) {
  if (col < 0) {
    if (output)
      alert("Please press on the board!");
    return false;
  }
  if (tboard[col][0]) {
    if (output)
      alert("Column already full!");
    return false;
  }
  return true;
}

function set_turn(turn, col, row) {
  red_turn_global = turn;
  
  global_ROOT = MCTS_get_next_root(col);
  
  draw_board();
  
  over = game_over(board, col, row);
  if (over)
    switch (over) {
      case "tie":
        alert("Game tied!");
        break;
      case "R":
        alert("Red wins!");
        break;
      case "Y":
        alert ("Yellow wins!");
        break;
    }
  
  if (!over && turn === ai_turn)
    setTimeout(play_ai_move, 100);
}

function play_move(tboard, col, turn) {
  var color = turn ? 'R':'Y';
  for (var a = tboard[col].length - 1; a >= 0; a--)
    if (!tboard[col][a]) {
      tboard[col][a] = color;
      return a;
    }
  return -1;
}

$(document).mousedown(function (e) {
  if (over) {
    alert("The game is already over!");
    return;
  }
  var col = get_col(e.pageX);
  if (!legal_move(board, col, true))
    return;
  var row = play_move(board, col, red_turn_global);
  
  set_turn(!red_turn_global, col, row);
  
  draw_board();
});

$(document).mousemove(function (e) {
  var col = get_col(e.pageX);
  if (!legal_move(board, col, false))
    return;
  draw_hover(col);
});

function get_winning_move(tboard, turn) {
  var row;
  for (var col = 0; col < tboard.length; col++) {
    row = play_move(tboard, col, turn);
    if (row < 0)
      continue;
    if (game_over(tboard, col, row)) {
      tboard[col][row] = false;
      return [col, row];
    }
    tboard[col][row] = false;
  }
  return false;
}

function MCTS_get_children(state, father) {
  var tboard = state.board;
  var children = [];
  
  var win = get_winning_move(tboard, state.turn);
  if (!win)
    win = get_winning_move(tboard, !state.turn);
  if (win) {
    tboard[win[0]][win[1]] = state.turn ? "R":"Y";
    children.push(new MCTS_Node(new State($.extend(true, [], tboard), !state.turn), father, win, MCTS_simulate, MCTS_get_children, expansion_const));
    tboard[win[0]][win[1]] = false;
    return children;
  }
  var row;
  for (var col = 0; col < tboard.length; col++) {
    row = play_move(tboard, col, state.turn);
    if (row < 0)
      continue;
    children.push(new MCTS_Node(new State($.extend(true, [], tboard), !state.turn), father, [col, row], MCTS_simulate, MCTS_get_children, expansion_const));
    tboard[col][row] = false;
  }
  return children;
}

function MCTS_simulate(state) {
  var tboard = $.extend(true, [], state.board);
  
  var last_move, turn = state.turn, done = game_over_full(tboard);
  var row, col;
  while (!done) {
    last_move = get_winning_move(tboard, turn);
    if (!last_move)
      last_move = get_winning_move(tboard, !turn);
    if (!last_move)
      do {
        col = Math.floor(Math.random() * tboard.length);
        row = play_move(tboard, col, turn);
      }  while (row < 0);
    else {
      tboard[last_move[0]][last_move[1]] = turn ? "R":"Y";
      col = last_move[0];
      row = last_move[1];
    }
    done = game_over(tboard, col, row);
    turn = !turn;
  }
  
  switch (done) {
    case "tie":
      return 0;
    default:
      return done == (state.turn ? "R":"Y") ? 1:-1;
  }
}

function create_MCTS_root() {
  return new MCTS_Node(new State(board, red_turn_global), null, null, MCTS_simulate, MCTS_get_children, expansion_const);
}

function MCTS_get_next_root(col) {
  if (!global_ROOT || !global_ROOT.children)
    return null;
  for (var i = 0; i < global_ROOT.children.length; i++)
    if (global_ROOT.children[i].last_move[0] == col) {
      return global_ROOT.children[i];
    }
  return null;
}

function run_MCTS(times) {
  if (!global_ROOT)
    global_ROOT = create_MCTS_root();
  for (var i = 0; i < times; i++)
    global_ROOT.choose_child();
}

function most_tried_child(root) {
  var most_trials = 0, child = null;
  if (!root.children)
    return null;
  if (root.children.length == 1)
    return root.children[0];
  for (var i = 0; i < root.children.length; i++)
    if (root.children[i].total_tries > most_trials) {
      most_trials = root.children[i].total_tries;
      child = root.children[i];
    }
  return child;
}

function get_best_move_MCTS() {
  var best_child = most_tried_child(global_ROOT, null);
  if (!best_child)
    return -1;
  return best_child.last_move;
}

function play_ai_move() {
  run_MCTS(monte_carlo_trials);
  var best_move = get_best_move_MCTS();
  play_move(board, best_move[0], red_turn_global);
  
  set_turn(!red_turn_global, best_move[0], best_move[1]);
}

function game_over(tboard, x, y) {
  var countConsecutive = 0;
  var color = 'null';
  var i, a;
  
  for (i = x - 3; i <= x + 3; i++) // Horizontal
    if (i >= 0 && i < tboard.length && countConsecutive < 4)
      if (tboard[i][y] == color)
        countConsecutive++;
      else if (tboard[i][y] == 'R' || tboard[i][y] == 'Y') {
        color = tboard[i][y];
        countConsecutive = 1;
      }
      else	color = 'null';
    else if (countConsecutive == 4)
      return color;
  if (countConsecutive == 4)
    return color;
  
  countConsecutive = 0;
  color = 'null';
  
  for (a = y - 3; a <= y + 3; a++) // Vertical
    if (a >= 0 && a < tboard.length && countConsecutive < 4)
      if (tboard[x][a] == color)
        countConsecutive++;
      else if (tboard[x][a] == 'R' || tboard[x][a] == 'Y') {
        color = tboard[x][a];
        countConsecutive = 1;
      }
      else	color = 'null';
    else if (countConsecutive == 4)
      return color;
  if (countConsecutive == 4)
    return color;
  
  countConsecutive = 0;
  color = 'null';
  
  for (i = x - 3, a = y - 3; i <= x + 3; i++, a++) // diagonal 1 topleft - bottomright
    if (a >= 0 && a < tboard.length && i >= 0 && i < tboard.length && countConsecutive < 4)
      if (tboard[i][a] == color)
        countConsecutive++;
      else if (tboard[i][a] == 'R' || tboard[i][a] == 'Y') {
        color = tboard[i][a];
        countConsecutive = 1;
      }
      else	color = 'null';
    else if (countConsecutive == 4)
      return color;
  if (countConsecutive == 4)
    return color;
  
  countConsecutive = 0;
  color = 'null';
  
  for (i = x - 3, a = y + 3; i <= x + 3; i++, a--) // diagonal 1 topright - bottomleft
    if (a >= 0 && a < tboard.length && i >= 0 && i < tboard.length && countConsecutive < 4)
      if (tboard[i][a] == color)
        countConsecutive++;
      else if (tboard[i][a] == 'R' || tboard[i][a] == 'Y') {
        color = tboard[i][a];
        countConsecutive = 1;
      }
      else	color = 'null';
    else if (countConsecutive == 4)
      return color;
  if (countConsecutive == 4)
    return color;
  
  for (i = 0; i < tboard.length; i++)
    if (!tboard[i][0])
      return false;
  
  return "tie";
}

function game_over_full(tboard) {
  var countConsecutive = 0;
  var color = 'null';
  var i, a;
  
  for (i = 0; i < tboard.length; i++) {
    for (a = 0; a < tboard[i].length; a++)
      if (countConsecutive < 4)
        if (tboard[i][a] == color)
          countConsecutive++;
        else if (tboard[i][a] == 'R' || tboard[i][a] == 'Y') {
          color = tboard[i][a];
          countConsecutive = 1;
        }
        else	color = 'null';
      else if (countConsecutive == 4)
        return color;
    if (countConsecutive == 4)
      return color;
    else countConsecutive = 0;
  }
  if (countConsecutive == 4)
    return color;
    
  countConsecutive = 0;
  color = 'null';
  
  for (a = 0; a < tboard[0].length; a++) {
    for (i = 0; i < tboard.length; i++)
      if (countConsecutive < 4)
        if (tboard[i][a] == color)
          countConsecutive++;
        else if (tboard[i][a] == 'R' || tboard[i][a] == 'Y') {
          color = tboard[i][a];
          countConsecutive = 1;
        }
        else	color = 'null';
      else if (countConsecutive == 4)
        return color;
    if (countConsecutive == 4)
      return color;
    else countConsecutive = 0;
  }
  if (countConsecutive == 4)
    return color;
    
  countConsecutive = 0;
  color = 'null';
  
  var x, y;
  
  for (x = 0; x < tboard.length; x++) {
    for (i = x, a = 0; i < tboard.length && a < tboard[i].length; i++, a++)
      if (countConsecutive < 4)
        if (tboard[i][a] == color)
          countConsecutive++;
        else if (tboard[i][a] == 'R' || tboard[i][a] == 'Y') {
          color = tboard[i][a];
          countConsecutive = 1;
        }
        else	color = 'null';
      else if (countConsecutive == 4)
        return color;
    if (countConsecutive == 4)
      return color;
    else countConsecutive = 0;
  }
  if (countConsecutive == 4)
    return color;
    
  countConsecutive = 0;
  color = 'null';
  
  for (y = 1; y < tboard[0].length; y++) {
    for (i = 0, a = y; i < tboard.length && a < tboard[i].length; i++, a++)
      if (countConsecutive < 4)
        if (tboard[i][a] == color)
          countConsecutive++;
        else if (tboard[i][a] == 'R' || tboard[i][a] == 'Y') {
          color = tboard[i][a];
          countConsecutive = 1;
        }
        else	color = 'null';
      else if (countConsecutive == 4)
        return color;
    if (countConsecutive == 4)
      return color;
    else countConsecutive = 0;
  }
  if (countConsecutive == 4)
    return color;
    
  countConsecutive = 0;
  color = 'null';
  
  for (x = 0; x < tboard.length; x++) {
    for (i = x, a = 0; i >= 0 && a < tboard[i].length; i--, a++)
      if (countConsecutive < 4)
        if (tboard[i][a] == color)
          countConsecutive++;
        else if (tboard[i][a] == 'R' || tboard[i][a] == 'Y') {
          color = tboard[i][a];
          countConsecutive = 1;
        }
        else	color = 'null';
      else if (countConsecutive == 4)
        return color;
    if (countConsecutive == 4)
      return color;
    else countConsecutive = 0;
  }
  if (countConsecutive == 4)
    return color;
        
  countConsecutive = 0;
  color = 'null';
  
  for (y = 1; y < tboard[0].length; y++) {
    for (i = tboard.length - 1, a = y; i >= 0 && a < tboard[i].length; i--, a++)
      if (countConsecutive < 4)
        if (tboard[i][a] == color)
          countConsecutive++;
        else if (tboard[i][a] == 'R' || tboard[i][a] == 'Y') {
          color = tboard[i][a];
          countConsecutive = 1;
        }
        else	color = 'null';
      else if (countConsecutive == 4)
        return color;
    if (countConsecutive == 4)
      return color;
    else countConsecutive = 0;
  }
  if (countConsecutive == 4)
    return color;
        
  for (i = 0; i < tboard.length; i++)
    if (!tboard[i][0])
      return false;
  
  return "tie";
}
