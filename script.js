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
var ponder, pondering;
var certainty_threshold = 0.15;
var max_trials = 1500000; // prevents overload (occurs around 2.3 million)
var position, cookie_id;
var ai_stopped = false;
var smart_simulation = true;

var boardui = document.getElementById("board");
var brush = boardui.getContext("2d");

$(document).ready(function() {
  docwidth = $(document).outerWidth(true);
  docheight = $(document).outerHeight(true);
  
  $('#board').width(docwidth).height(docheight);
  boardui.setAttribute('width', docwidth);
  boardui.setAttribute('height', docheight);
  
  $('#new-game-btn').css('top', (docheight - $('#new-game-btn').height()) / 2);
  $('#new-game-btn').css('left', (docwidth - $('#new-game-btn').outerWidth()) / 2);
  $('#new-game-menu').css('top', (docheight - $('#new-game-menu').outerHeight()) / 2);
  $('#new-game-menu').css('left', (docwidth - $('#new-game-menu').outerWidth()) / 2);
  
  new_game(window.location.hash);
  
  $('input[name="name"]').val(new_cookie_id());
});

function start_ponder() {
  pondering = setInterval(function() {
    if (!global_ROOT)
      global_ROOT = create_MCTS_root();
    if (global_ROOT.total_tries < max_trials)
      for (var i = 0; i < monte_carlo_trials / 100; i++)
        global_ROOT.choose_child();
  }, 1);
}

function stop_ponder() {
  clearInterval(pondering);
}

function adjust_buttons() {
  $('.footer button').css('font-size', disc_height / 4);
  $('.footer').css("height", disc_height / 2);
  $('.footer').css('margin-bottom', disc_height / 4 - $('#back').outerHeight(false));
}

function new_game(c_id) {
  cookie_id = c_id.replace(/#/g, "");

  var cookie = getCookie(cookie_id);
  if (cookie && cookie.length > 0) {
    new_game_cookie(cookie);
    return;
  }
  
  if (cookie_id.length === 0)
    cookie_id = new_cookie_id();
  
  window.location.hash = cookie_id;
  
  disc_width = docwidth / (dimensions[0] + 1);
  disc_height = docheight / (dimensions[1] + 1);
  
  adjust_buttons();
  
  over = false;
  board = new Array(dimensions[0]);
  for (var i = 0; i < board.length; i++) {
    board[i] = new Array(dimensions[1]);
    for (var a = 0; a < board[i].length; a++)
      board[i][a] = ' ';
  }
  
  red_turn_global = true;
  
  position = "";
  
  save_settings_cookie(cookie_id);
  
  global_ROOT = create_MCTS_root();
  draw_board();
  
  if (ai_turn == red_turn_global || ai_turn == 'both')
    setTimeout(play_ai_move, 50);
  
  stop_ponder();
  if (ponder)
    start_ponder();
}

function new_game_cookie(cookie) {
  load_settings_cookie(cookie);
  
  disc_width = docwidth / (dimensions[0] + 1);
  disc_height = docheight / (dimensions[1] + 1);
  adjust_buttons();
  
  board = new Array(dimensions[0]);
  for (var i = 0; i < board.length; i++) {
    board[i] = new Array(dimensions[1]);
    for (var a = 0; a < board[i].length; a++)
      board[i][a] = ' ';
  }
  red_turn_global = true;
  
  setup_position(position);
    
  global_ROOT = create_MCTS_root();
  draw_board();
  
  if (ai_turn == red_turn_global || ai_turn == 'both')
    setTimeout(play_ai_move, 100);
  
  stop_ponder();
  if (ponder)
    start_ponder();
}

function new_cookie_id() {
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  var c_id;
  
  do {
    c_id = "";
    for( var i=0; i < 5; i++)
        c_id += possible.charAt(Math.floor(Math.random() * possible.length));
  } while (getCookie(c_id));
  
  return c_id;
}

function save_settings_cookie(c_id) {
  var settings = {};
  
  settings.over = over;
  settings.ponder = ponder;
  settings.ai_turn = ai_turn;
  settings.position = position;
  settings.dimensions = dimensions;
  settings.expansion_const = expansion_const;
  settings.smart_simulation = smart_simulation;
  settings.monte_carlo_trials = monte_carlo_trials;
  settings.certainty_threshold = certainty_threshold;
  
  setCookie(c_id, JSON.stringify(settings), 10);
}

function load_settings_cookie(cookie) {
  var settings = JSON.parse(cookie);
  
  over = settings.over;
  ponder = settings.ponder;
  ai_turn = settings.ai_turn;
  position = settings.position;
  dimensions = settings.dimensions;
  expansion_const = settings.expansion_const;
  smart_simulation = settings.smart_simulation;
  monte_carlo_trials = settings.monte_carlo_trials;
  certainty_threshold = settings.certainty_threshold;
}

function setup_position(pos) {
  if (!pos || pos.length === 0) {
    position = "";
    return true;
  }
  
  for (var i = 0; i < pos.length; i++) {
    var col = parseInt(pos.charAt(i), 10) - 1;
    if (legal_move(board, col, false)) {
      play_move(board, col, red_turn_global);
      red_turn_global = !red_turn_global;
    }
    else return false;
  }
  return true;
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
  
  for (var i = 0; i < board.length; i++)
    for (var a = 0; a < board[i].length; a++)
      if (board[i][a] != ' ')
        draw_piece(i, a);
  
  draw_grid();
}

function draw_hover(col) {
  var color = red_turn_global ? 'R':'Y';
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

function get_col(xloc, yloc) {
  if (xloc > docwidth - disc_width / 2 || xloc < disc_width / 2)
    return -1;
  else if (yloc > docheight - disc_height / 2)
    return -2;
  return Math.floor((xloc - disc_width / 2) / disc_width);
}

function legal_move(tboard, col, output) {
  if (col == -2)
    return false;
  if (col < 0) {
    if (output)
      alert("Please press on the board!");
    return false;
  }
  if (tboard[col][0] != ' ') {
    if (output)
      alert("Column already full!");
    return false;
  }
  return true;
}

function set_turn(turn, col, row) {
  
  position += col + 1;
  
  red_turn_global = turn;
  
  global_ROOT = MCTS_get_next_root(col);
  if (global_ROOT)
    global_ROOT.parent = null;
  else global_ROOT = create_MCTS_root();
  
  var mtc = most_tried_child(global_ROOT, null);
  
  if (!over && (turn === ai_turn || ai_turn == "both") && mtc && mtc.last_move)
    draw_hover(mtc.last_move[0]);
  else  draw_board();
  
  over = game_over(board, col, row);
  
  save_settings_cookie(cookie_id);
  
  if (over)
    switch (over) {
      case "tie":
        alert("Game tied!");
        break;
      case 'R':
        alert("Red wins!");
        break;
      case 'Y':
        alert ("Yellow wins!");
        break;
    }
  
  if (!over && (turn === ai_turn || ai_turn == "both"))
    setTimeout(play_ai_move, 50);
}

function play_move(tboard, col, turn) {
  var color = turn ? 'R':'Y';
  for (var a = tboard[col].length - 1; a >= 0; a--)
    if (tboard[col][a] == ' ') {
      tboard[col][a] = color;
      return a;
    }
  return -1;
}

$('#board').mousedown(function (e) {
  if (e.which === 3)
    return;
  if (red_turn_global == ai_turn || ai_turn == "both")
    return;
  if (over) {
    alert("The game is already over!");
    return;
  }
  var col = get_col(e.pageX, e.pageY);
  if (!legal_move(board, col, true))
    return;
  var row = play_move(board, col, red_turn_global);
  
  set_turn(!red_turn_global, col, row);
});

$('#board').mousemove(function (e) {
  if (red_turn_global == ai_turn || ai_turn == "both")
    return;
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
  
  if (game_over_full(tboard))
    return [];
  
  var win = get_winning_move(tboard, state.turn);
  if (!win)
    win = get_winning_move(tboard, !state.turn);
  if (win) {
    tboard[win[0]][win[1]] = state.turn ? 'R':'Y';
    children.push(new MCTS_Node(new State($.extend(true, [], tboard), !state.turn), father, win, smart_simulation ? MCTS_simulate_smart:MCTS_simulate, MCTS_get_children, expansion_const));
    tboard[win[0]][win[1]] = false;
    return children;
  }
  var row;
  for (var col = 0; col < tboard.length; col++) {
    row = play_move(tboard, col, state.turn);
    if (row < 0)
      continue;
    children.push(new MCTS_Node(new State($.extend(true, [], tboard), !state.turn), father, [col, row], smart_simulation ? MCTS_simulate_smart:MCTS_simulate, MCTS_get_children, expansion_const));
    tboard[col][row] = false;
  }
  
  for (var i = 0; i < children.length - 1; i++)
    for (var a = i + 1; a < children.length; a++)
      if (identical_boards(children[i].State.board, children[a].State.board)) {
        children.splice(a, 1);
        a--;
      }
  return children;
}

function MCTS_simulate(state) {
  var tboard = $.extend(true, [], state.board);
  
  var last_move, turn = state.turn, done = game_over_full(tboard);
  var row, col;
  while (!done) {
      do {
        col = Math.floor(Math.random() * tboard.length);
        row = play_move(tboard, col, turn);
      }  while (row < 0);
    done = game_over(tboard, col, row);
    turn = !turn;
  }
  
  switch (done) {
    case "tie":
      return 0;
    default:
      return done == (state.turn ? 'R':'Y') ? 1:-1;
  }
}

function MCTS_simulate_smart(state) {
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
      tboard[last_move[0]][last_move[1]] = turn ? 'R':'Y';
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
      return done == (state.turn ? 'R':'Y') ? 1:-1;
  }
}

function create_MCTS_root() {
  return new MCTS_Node(new State(board, red_turn_global), null, null, smart_simulation ? MCTS_simulate_smart:MCTS_simulate, MCTS_get_children, expansion_const);
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

function run_MCTS(times, threshold, callback) {
  if (!global_ROOT)
    global_ROOT = create_MCTS_root();
  run_MCTS_recursive(times, threshold, 5, 5, callback);
}

function run_MCTS_recursive(times, threshold, time_on, total_times, callback) {
  for (var a = 0; a < times / total_times; a++)
    global_ROOT.choose_child();
  draw_hover(most_tried_child(global_ROOT, null).last_move[0]);
  if (threshold > 0) {
    if (global_ROOT.children.length < 2) {
      callback();
      return;
    }
    var best_child = most_tried_child(global_ROOT, null);
    var second_best = most_tried_child(global_ROOT, best_child);
    if (second_best.total_tries / best_child.total_tries < threshold) {
      callback();
      return;
    }
  }
  if (time_on <= 1 || ai_stopped)
    callback();
  else setTimeout(function() {
    run_MCTS_recursive(times, threshold, time_on - 1, total_times, callback);
  }, 30);
}

function most_tried_child(root, exclude) {
  var most_trials = 0, child = null;
  if (!root.children)
    return null;
  if (root.children.length == 1)
    return root.children[0];
  for (var i = 0; i < root.children.length; i++)
    if (root.children[i] != exclude && root.children[i].total_tries > most_trials) {
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
  ai_stopped = false;
  
  if (global_ROOT.total_tries < monte_carlo_trials && certainty_threshold < 1)
    run_MCTS(monte_carlo_trials - global_ROOT.total_tries, certainty_threshold, fpaim);
  else fpaim();
}

function fpaim() {
  var best_move = get_best_move_MCTS();
  play_move(board, best_move[0], red_turn_global);
  set_turn(!red_turn_global, best_move[0], best_move[1]);
}

function game_over(tboard, x, y) {
  var countConsecutive = 0;
  var color = '';
  var i, a;
  
  for (i = x - 3; i <= x + 3; i++) // Horizontal
    if (i >= 0 && i < tboard.length && countConsecutive < 4)
      if (tboard[i][y] == color)
        countConsecutive++;
      else if (tboard[i][y] != ' ') {
        color = tboard[i][y];
        countConsecutive = 1;
      }
      else	color = '';
    else if (countConsecutive == 4)
      return color;
  if (countConsecutive == 4)
    return color;
  
  countConsecutive = 0;
  color = '';
  
  for (a = y - 3; a <= y + 3; a++) // Vertical
    if (a >= 0 && a < tboard.length && countConsecutive < 4)
      if (tboard[x][a] == color)
        countConsecutive++;
      else if (tboard[x][a] != ' ') {
        color = tboard[x][a];
        countConsecutive = 1;
      }
      else	color = '';
    else if (countConsecutive == 4)
      return color;
  if (countConsecutive == 4)
    return color;
  
  countConsecutive = 0;
  color = '';
  
  for (i = x - 3, a = y - 3; i <= x + 3; i++, a++) // diagonal 1 topleft - bottomright
    if (a >= 0 && a < tboard.length && i >= 0 && i < tboard.length && countConsecutive < 4)
      if (tboard[i][a] == color)
        countConsecutive++;
      else if (tboard[i][a] != ' ') {
        color = tboard[i][a];
        countConsecutive = 1;
      }
      else	color = '';
    else if (countConsecutive == 4)
      return color;
  if (countConsecutive == 4)
    return color;
  
  countConsecutive = 0;
  color = '';
  
  for (i = x - 3, a = y + 3; i <= x + 3; i++, a--) // diagonal 1 topright - bottomleft
    if (a >= 0 && a < tboard.length && i >= 0 && i < tboard.length && countConsecutive < 4)
      if (tboard[i][a] == color)
        countConsecutive++;
      else if (tboard[i][a] != ' ') {
        color = tboard[i][a];
        countConsecutive = 1;
      }
      else	color = '';
    else if (countConsecutive == 4)
      return color;
  if (countConsecutive == 4)
    return color;
  
  for (i = 0; i < tboard.length; i++)
    if (tboard[i][0] == ' ')
      return false;
  
  return "tie";
}

function game_over_full(tboard) {
  var countConsecutive = 0;
  var color = '';
  var i, a;
  
  for (i = 0; i < tboard.length; i++) {
    for (a = 0; a < tboard[i].length; a++)
      if (countConsecutive < 4)
        if (tboard[i][a] == color)
          countConsecutive++;
        else if (tboard[i][a] != ' ') {
          color = tboard[i][a];
          countConsecutive = 1;
        }
        else	color = '';
      else if (countConsecutive == 4)
        return color;
    if (countConsecutive == 4)
      return color;
    else countConsecutive = 0;
  }
  if (countConsecutive == 4)
    return color;
    
  countConsecutive = 0;
  color = '';
  
  for (a = 0; a < tboard[0].length; a++) {
    for (i = 0; i < tboard.length; i++)
      if (countConsecutive < 4)
        if (tboard[i][a] == color)
          countConsecutive++;
        else if (tboard[i][a] != ' ') {
          color = tboard[i][a];
          countConsecutive = 1;
        }
        else	color = '';
      else if (countConsecutive == 4)
        return color;
    if (countConsecutive == 4)
      return color;
    else countConsecutive = 0;
  }
  if (countConsecutive == 4)
    return color;
    
  countConsecutive = 0;
  color = '';
  
  var x, y;
  
  for (x = 0; x < tboard.length; x++) {
    for (i = x, a = 0; i < tboard.length && a < tboard[i].length; i++, a++)
      if (countConsecutive < 4)
        if (tboard[i][a] == color)
          countConsecutive++;
        else if (tboard[i][a] != ' ') {
          color = tboard[i][a];
          countConsecutive = 1;
        }
        else	color = '';
      else if (countConsecutive == 4)
        return color;
    if (countConsecutive == 4)
      return color;
    else countConsecutive = 0;
  }
  if (countConsecutive == 4)
    return color;
    
  countConsecutive = 0;
  color = '';
  
  for (y = 1; y < tboard[0].length; y++) {
    for (i = 0, a = y; i < tboard.length && a < tboard[i].length; i++, a++)
      if (countConsecutive < 4)
        if (tboard[i][a] == color)
          countConsecutive++;
        else if (tboard[i][a] != ' ') {
          color = tboard[i][a];
          countConsecutive = 1;
        }
        else	color = '';
      else if (countConsecutive == 4)
        return color;
    if (countConsecutive == 4)
      return color;
    else countConsecutive = 0;
  }
  if (countConsecutive == 4)
    return color;
    
  countConsecutive = 0;
  color = '';
  
  for (x = 0; x < tboard.length; x++) {
    for (i = x, a = 0; i >= 0 && a < tboard[i].length; i--, a++)
      if (countConsecutive < 4)
        if (tboard[i][a] == color)
          countConsecutive++;
        else if (tboard[i][a] != ' ') {
          color = tboard[i][a];
          countConsecutive = 1;
        }
        else	color = '';
      else if (countConsecutive == 4)
        return color;
    if (countConsecutive == 4)
      return color;
    else countConsecutive = 0;
  }
  if (countConsecutive == 4)
    return color;
        
  countConsecutive = 0;
  color = '';
  
  for (y = 1; y < tboard[0].length; y++) {
    for (i = tboard.length - 1, a = y; i >= 0 && a < tboard[i].length; i--, a++)
      if (countConsecutive < 4)
        if (tboard[i][a] == color)
          countConsecutive++;
        else if (tboard[i][a] != ' ') {
          color = tboard[i][a];
          countConsecutive = 1;
        }
        else	color = '';
      else if (countConsecutive == 4)
        return color;
    if (countConsecutive == 4)
      return color;
    else countConsecutive = 0;
  }
  if (countConsecutive == 4)
    return color;
        
  for (i = 0; i < tboard.length; i++)
    if (tboard[i][0] == ' ')
      return false;
  
  return "tie";
}

function identical_boards(board1, board2) {
  for (var i = 0; i < board1.length / 2; i++)
    for (var a = 0; a < board1[i].length; a++)
      if (board1[i][a] != board2[board1.length - 1 - i][a])
        return false;
  return true;
}

function show_new_game_menu() {
  $('#new-game-menu').animate({opacity: 0.9}, "slow").css('z-index', 100);
}

$('#new-game').click(show_new_game_menu);

var dont_submit;

$('#form-new-game').submit(function() {
  if (dont_submit) {
    dont_submit = false;
    return false;
  }
  
  dimensions[0] = parseInt($('input[name="d_width"]').val());
  dimensions[1] = parseInt($('input[name="d_height"]').val());
  
  switch ($('input[name="ai-turn"]').val().toLowerCase()) {
    case "first":
      ai_turn = true;
      break;
    case "second":
      ai_turn = false;
      break;
    case "both":
      ai_turn = "both";
      break;
    default: ai_turn = null;
  }
  
  var allow_ponder = $('input[name="allow-ponder"]').prop('checked');
  
  switch ($('input[name="ai-diff"]').val().toLowerCase()) {
    case "custom":
      smart_simulation = $('input[name="smart-simulation"]').prop('checked');
      monte_carlo_trials = $('input[name="mc-trials"]').val();
      expansion_const = $('input[name="mc-expansion"]').val();
      certainty_threshold = (1 - $('input[name="mc-certainty"]').val() / 100).toFixed(2);
      ponder =  $('input[name="ai-ponder"]').prop('checked');
      break;
    case "stupid":
      smart_simulation = false;
      monte_carlo_trials = dimensions[0] * 2;
      expansion_const = 10;
      certainty_threshold = 0;
      ponder = false;
      break;
    case "ehh":
      smart_simulation = true;
      monte_carlo_trials = dimensions[0] * dimensions[1];
      expansion_const = 2;
      certainty_threshold = 0;
      ponder = false;
      break;
    case "play fast":
      smart_simulation = false;
      monte_carlo_trials = dimensions[0] * dimensions[1];
      expansion_const = 2;
      certainty_threshold = 1;
      ponder = true;
      break;
    case "normal":
      smart_simulation = true;
      monte_carlo_trials = 1000;
      expansion_const = 10;
      certainty_threshold = 0.4;
      ponder = true;
      break;
    case "play fast ++":
      smart_simulation = true;
      monte_carlo_trials = dimensions[0] * dimensions[1] * 10;
      expansion_const = 2;
      certainty_threshold = 1;
      ponder = true;
      break;
    case "hard":
      smart_simulation = true;
      monte_carlo_trials = 5000;
      expansion_const = 2;
      certainty_threshold = 0.25;
      ponder = true;
      break;
    case "very hard":
      smart_simulation = true;
      monte_carlo_trials = 10000;
      expansion_const = 2;
      certainty_threshold = 0.15;
      ponder = true;
      break;
    case "good luck":
      smart_simulation = true;
      monte_carlo_trials = 50000;
      expansion_const = 2;
      certainty_threshold = 0.1;
      ponder = true;
      break;
  }
  
  if (!allow_ponder)
    ponder = false;
  
  var name = $('input[name="name"]').val();
  $('input[name="name"]').val(new_cookie_id());
  
  $('#new-game-menu').animate({opacity: 0}, "slow", function() {
    $(this).css('z-index', -1);
    new_game(name);
  });
  
  return false;
});

$('#btn-new-game-cancel').click(function() {
  dont_submit = true;
  $('#new-game-menu').animate({opacity: 0}, "slow", function() {
    $(this).css('z-index', -1);
  });
});

$('#back').click(function() {
  if (ai_turn === true || ai_turn === false)
    position = position.substring(0, position.length - 2);
  else position = position.substring(0, position.length - 1);
  over = false;
  
  save_settings_cookie(cookie_id);
  
  new_game(cookie_id);
});

$('#stop-ai').click(function() {
  ai_stopped = true;
  ai_turn = "None";
});

$('#start-ai').click(function() {
  if (ai_turn == red_turn_global || ai_turn == "Both")
    return;
  ai_turn = red_turn_global;
  
  play_ai_move();
});

function setCookie(cname, cvalue, exdays) {
    var d = new Date();
    d.setTime(d.getTime() + (exdays*24*60*60*1000));
    var expires = "expires="+d.toUTCString();
    document.cookie = cname + "=" + cvalue + "; " + expires;
}

function getCookie(cname) {
    var name = cname + "=";
    var ca = document.cookie.split(';');
    for(var i=0; i<ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0)==' ') c = c.substring(1);
        if (c.indexOf(name) === 0) return c.substring(name.length, c.length);
    }
    return "";
}
