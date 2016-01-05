var docwidth, docheight;
var disc_width, disc_height;
var dimensions = [7, 6];
var board;
var red_turn_global;
var global_ROOT;
var expansion_const = 2.5;
var ai_turn = false;
var monte_carlo_trials = 10000;
var over;
var ponder = true, pondering;
var certainty_threshold = 0.15;
var position, cookie_id;
var ai_stopped = false;
var smart_simulation = true;
var increasing_factor = 1.07;

var boardui = document.getElementById("board");
var brush = boardui.getContext("2d");
var num_choose1, num_choose2, num_choose3, lnc1, lnc2, lnc3, stop_choose;

$(document).ready(function() {
  docwidth = $(window).outerWidth(true);
  docheight = $(window).outerHeight(true);
  
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

$(window).resize(function() {
  docwidth = $(window).outerWidth(true);
  docheight = $(window).outerHeight(true);
  $('#board').width(docwidth).height(docheight);
  
  $('#new-game-btn').css('top', (docheight - $('#new-game-btn').height()) / 2);
  $('#new-game-btn').css('left', (docwidth - $('#new-game-btn').outerWidth()) / 2);
  $('#new-game-menu').css('top', (docheight - $('#new-game-menu').outerHeight()) / 2);
  $('#new-game-menu').css('left', (docwidth - $('#new-game-menu').outerWidth()) / 2);
});

function start_ponder() {
  pondering = setInterval(function() {
    if (!global_ROOT)
      global_ROOT = create_MCTS_root();
    var start_time = new Date().getTime();
    var temp_count = 0;
    while ((new Date().getTime() - start_time) < 30 && !stop_choose) {
      global_ROOT.choose_child();
      temp_count++;
    }
    if (num_choose3 && (temp_count < num_choose3 / 10 || temp_count < num_choose2 / 10 || temp_count < num_choose1 / 10))
      stop_choose = true;
    else {
      num_choose3 = num_choose2;
      num_choose2 = num_choose1;
      num_choose1 = temp_count;
    }
    update_analysis();
  }, 1);
}

function stop_ponder() {
  clearInterval(pondering);
}

function adjust_buttons() {
  $('.footer button').css('font-size', disc_height / 4);
  $('.footer').css("height", disc_height / 2);
  $('.footer').css('margin-bottom', disc_height / 4 - $('#back').outerHeight(false));
  $('.footer #anal').css('line-height', disc_height / 2 + "px");
  $('.footer #num-trials').css('line-height', disc_height / 2 + "px");
}

function update_analysis() {
  var range = get_MCTS_depth_range();
  $('#anal').text("Analysis: Depth-" + range[1] + " Result-" + range[2] + " Certainty-" + (global_ROOT && global_ROOT.total_tries > 0 ? (result_certainty(global_ROOT) * 100).toFixed(0):"0") + "%");
  $('#num-trials').text("Trials: " + global_ROOT.total_tries);
}

function result_certainty(root) {
  if (root.total_tries > (root.hits + root.misses) * 2)
    return 1 - (root.hits + root.misses) / root.total_tries;
  else if (root.hits > root.misses)
    return (root.hits - root.misses) / root.total_tries;
  else if (root.hits < root.misses)
    return (root.misses - root.hits) / root.total_tries;
  else return 1 - (root.hits + root.misses) / root.total_tries;
}

function new_game(c_id) {
  cookie_id = c_id.replace(/#/g, "");
  
  if (cookie_id.length === 0)
    cookie_id = new_cookie_id();
  
  window.location.hash = cookie_id;

  var cookie = getCookie(cookie_id);
  if (cookie && cookie.length > 0) {
    new_game_cookie(cookie);
    return;
  }
  
  disc_width = docwidth / (dimensions[0] + 1);
  disc_height = docheight / (dimensions[1] + 1);
  
  adjust_buttons();
  
  over = -1;
  board = new Array(dimensions[0]);
  for (var i = 0; i < board.length; i++) {
    board[i] = new Array(dimensions[1]);
    for (var a = 0; a < board[i].length; a++)
      board[i][a] = 0;
  }
  
  red_turn_global = true;
  num_choose1 = num_choose2 = num_choose3 = lnc1 = lnc2 = lnc3 = stop_choose = false;
  position = "";
  
  save_settings_cookie(cookie_id);
  
  global_ROOT = create_MCTS_root();
  draw_board();
  
  if (ai_turn == red_turn_global || ai_turn == 'both')
    setTimeout(play_ai_move, 20);
  
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
      board[i][a] = 0;
  }
  red_turn_global = true;
  num_choose1 = num_choose2 = num_choose3 = lnc1 = lnc2 = lnc3 = stop_choose = false;
  setup_position(position);
    
  global_ROOT = create_MCTS_root();
  draw_board();
  
  if (ai_turn == red_turn_global || ai_turn == 'both')
    setTimeout(play_ai_move, 20);
  
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
  settings.increasing_factor = increasing_factor;
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
  increasing_factor = settings.increasing_factor;
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

function setup_board(pos) {
  var b = new Array(dimensions[0]);
  var i, a, col;
  for (i = 0; i < dimensions[0]; i++) {
    b[i] = new Array(dimensions[1]);
    for (a = 0; a < dimensions[1]; a++)
      b[i][a] = 0;
  }
  for (i = 0; i < pos.length; i++) {
    col = parseInt(pos.charAt(i), 10) - 1;
    for (a = dimensions[1] - 1; a >= 0; a--)
      if (b[col][a] === 0) {
        b[col][a] = i % 2 === 0 ? 1:2;
        break;
      }
  }
  return b;
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
    case 1:
      brush.fillStyle = "red";
      break;
    case 2:
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
  update_analysis();
  
  for (var i = 0; i < board.length; i++)
    for (var a = 0; a < board[i].length; a++)
      if (board[i][a] !== 0)
        draw_piece(i, a);
  
  draw_grid();
}

function draw_hover(col) {
  var color = red_turn_global ? 1:2;
  draw_board();
  switch (color) {
    case 1:
      brush.fillStyle = "red";
      break;
    case 2:
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
  if (tboard[col][0] !== 0) {
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
  
  if (over == -1 && (turn === ai_turn || ai_turn == "both") && mtc && mtc.last_move)
    draw_hover(mtc.last_move);
  else  draw_board();
  
  over = game_over(board, col, row);
  
  save_settings_cookie(cookie_id);
  
  if (over != -1) {
    switch (over) {
      case 0:
        alert("Game tied!");
        break;
      case 1:
        alert("Red wins!");
        break;
      case 2:
        alert ("Yellow wins!");
        break;
    }
    stop_ponder();
  }
  
  monte_carlo_trials *= increasing_factor;
  num_choose1 = num_choose2 = num_choose3 = stop_choose = false;
  
  if (over == -1 && (turn === ai_turn || ai_turn == "both"))
    setTimeout(play_ai_move, 25);
}

function play_move(tboard, col, turn) {
  if (tboard[col][0] !== 0)
    return -1;
  var color = turn ? 1:2, row;
  for (row = tboard[col].length - 1; tboard[col][row] !== 0; row--);
  tboard[col][row] = color;
  return row;
}

$('#board').mousedown(function (e) {
  if (e.which === 3)
    return;
  if (red_turn_global == ai_turn || ai_turn == "both")
    return;
  if (over != -1) {
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
  if (red_turn_global == ai_turn || ai_turn == "both" || over != -1)
    return;
  var col = get_col(e.pageX);
  if (!legal_move(board, col, false))
    return;
  draw_hover(col);
});

function get_winning_move(tboard, turn) {
  var row, color = turn ? 1:2;
  for (var col = 0; col < tboard.length; col++) {
    if (tboard[col][0] !== 0)
      continue;
    for (row = tboard[col].length - 1; tboard[col][row] !== 0; row--);
    if (game_over_color(tboard, col, row, color) != -1)
      return [col, row];
  }
  return false;
}

function MCTS_get_children(state, father) {
  var tboard = setup_board(state.board);
  
  if (state.game_over)
    return [];
  
  var win = get_winning_move(tboard, state.turn);
  if (!win)
    win = get_winning_move(tboard, !state.turn);
  else {
    var nstate = new State(state.board + (win[0] + 1), !state.turn);
    nstate.game_over = true;
    return [new MCTS_Node(nstate, father, win[0])];
  }
  if (win)
    return [new MCTS_Node(new State(state.board + (win[0] + 1), !state.turn), father, win[0])];
  
  var col, count = 0;
  
  for (col = 0; col < tboard.length; col++)
    if (tboard[col][0] === 0)
      count++;

  var children = new Array(count);
  for (col = 0; col < tboard.length; col++)
    if (tboard[col][0] === 0)
      children[--count] = new MCTS_Node(new State(state.board + (col + 1), !state.turn), father, col);
  
  for (var i = 0; i < children.length - 1; i++)
    for (var a = i + 1; a < children.length; a++)
      if (identical_boards(setup_board(children[i].State.board), setup_board(children[a].State.board))) {
        children.splice(a, 1);
        a--;
      }

  return children;
}

function ib (b1, b2) {
  for (var i = 0; i < b1.length; i++)
    if (+b1.charAt(i) != +b2.charAt(i) && +b1.charAt(i) != dimensions[0] - +b2.charAt(i))
      return false;
  return true;
}

var MCTS_simulate;

function MCTS_dumb_simulate(state) {
  if (state.game_over)
    return -1;
  var tboard = setup_board(state.board);
  
  var last_move, turn = state.turn, done = false;
  var row, col;
  while (done == -1) {
      do {
        col = Math.random() * tboard.length | 0;
        row = play_move(tboard, col, turn);
      }  while (row < 0);
    done = game_over(tboard, col, row);
    turn = !turn;
  }
  
  if (done === 0)
    return 0;
  return done == (state.turn ? 1:2) ? 1:-1;
}

function MCTS_simulate_smart(state) {
  var tboard = setup_board(state.board);
  
  var last_move, turn = state.turn, done = game_over_full(tboard);
  var row, col;
  while (done == -1) {
    last_move = get_winning_move(tboard, turn);
    if (!last_move)
      last_move = get_winning_move(tboard, !turn);
    if (!last_move)
      do {
        col = Math.random() * tboard.length | 0;
        row = play_move(tboard, col, turn);
      }  while (row < 0);
    else {
      tboard[last_move[0]][last_move[1]] = turn ? 1:2;
      col = last_move[0];
      row = last_move[1];
    }
    done = game_over(tboard, col, row);
    turn = !turn;
  }
  
  if (done === 0)
    return 0;
  return done == (state.turn ? 1:2) ? 1:-1;
}

function create_MCTS_root() {
  MCTS_simulate = smart_simulation ? MCTS_simulate_smart:MCTS_dumb_simulate;
  return new MCTS_Node(new State(position, red_turn_global), null, null);
}

function MCTS_get_next_root(col) {
  if (!global_ROOT || !global_ROOT.children)
    return null;
  for (var i = 0; i < global_ROOT.children.length; i++)
    if (global_ROOT.children[i].last_move == col) {
      return global_ROOT.children[i];
    }
  return null;
}

function run_MCTS(times, threshold, callback) {
  if (!global_ROOT)
    global_ROOT = create_MCTS_root();
  run_MCTS_recursive(times, threshold, callback, 0);
}

function run_MCTS_recursive(times, threshold, callback, count) {
  var start_time = new Date().getTime();
  var init_times = times;
  while (times > 0 && (new Date().getTime() - start_time) < 100) {
    global_ROOT.choose_child();
    times--;
  }
  if (count % 20 === 0) {
    draw_hover(most_tried_child(global_ROOT, null).last_move);
    if (threshold > 0) {
      var error = get_certainty(global_ROOT);
      console.log(error);
      if (global_ROOT.children.length < 2 || error < threshold) {
        callback();
        return;
      }
    }
  }
  if (ai_stopped || times <= 0 || stop_choose)
    callback();
  else if (lnc3 && (init_times - times < lnc3 / 5 || init_times - times < lnc2 / 5 || init_times - times < lnc1 / 5)) {
    console.log(init_times - times, lnc3);
    callback();
  }
  else {
    lnc3 = lnc2;
    lnc2 = lnc1;
    lnc1 = init_times - times;
    setTimeout(function() {
      run_MCTS_recursive(times, threshold, callback, ++count);
    }, 1);
  }
}

function get_certainty(root) {
  var best_child = most_tried_child(root, null);
  var ratio = most_tried_child(root, best_child).total_tries / best_child.total_tries;
  var ratio_wins = best_child.hits < best_child.misses ? (best_child.hits / best_child.misses * 2):(best_child.misses / best_child.hits * 3);
  return ratio > ratio_wins ? ratio_wins:ratio;
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


function least_tried_child(root) {
  var least_trials = root.total_tries + 1, child = null;
  if (!root.children)
    return null;
  for (var i = 0; i < root.children.length; i++)
    if (root.children[i].total_tries < least_trials) {
      least_trials = root.children[i].total_tries;
      child = root.children[i];
    }
  return child;
}

function get_MCTS_depth_range() {
  var root, range = new Array(3);
  for (range[0] = -1, root = global_ROOT; root && root.children; range[0]++, root = least_tried_child(root));
  for (range[1] = -1, root = global_ROOT; root && root.children; range[1]++, root = most_tried_child(root));
  if (global_ROOT.total_tries > (global_ROOT.hits + global_ROOT.misses) * 3)
    range[2] = "Tie";
  else if ((global_ROOT.hits > global_ROOT.misses) == red_turn_global)
    range[2] = "R";
  else if ((global_ROOT.hits < global_ROOT.misses) == red_turn_global)
    range[2] = "Y";
  else range[2] = "Tie";
  return range;
}

function get_best_move_MCTS() {
  var best_child = most_tried_child(global_ROOT, null);
  if (!best_child)
    return -1;
  return best_child.last_move;
}

function play_ai_move() {
  ai_stopped = false;
  if (!global_ROOT || global_ROOT.total_tries < monte_carlo_trials && certainty_threshold < 1 && !(global_ROOT.children && global_ROOT.children.length == 1))
    run_MCTS(monte_carlo_trials - global_ROOT.total_tries, certainty_threshold, fpaim);
  else fpaim();
}

function fpaim() {
  var best_row = get_best_move_MCTS();
  var best_col = play_move(board, best_row, red_turn_global);
  set_turn(!red_turn_global, best_row, best_col);
}

function onetotwod(oned) {
  var twod = new Array(dimensions[0]);
  for (var i = 0; i < dimensions[0]; i++)
    twod[i] = oned.slice(i * dimensions[1], (i + 1) * dimensions[1]);
  return twod;
}

function twotooned(twod) {
  var oned = new Array(dimensions[0] * dimensions[1]);
  for (var i = 0; i < dimensions[0] * dimensions[1]; i++)
    oned[i] = twod[i / dimensions[1] | 0][i % dimensions[1]];
  return oned;
}

function game_over(tboard, x, y) {
  var countConsecutive = 1;
  var color = tboard[x][y];
  var i, a;
  
  for (i = x - 1; i >= 0 && countConsecutive < 4 && tboard[i][y] == color; i--, countConsecutive++);
  for (i = x + 1; i < tboard.length && countConsecutive < 4 && tboard[i][y] == color; i++, countConsecutive++);
  
  if (countConsecutive == 4)
    return color;
  
  countConsecutive = 1;
  
  for (a = y - 1; a >= 0 && countConsecutive < 4 && tboard[x][a] == color; a--, countConsecutive++);
  for (a = y + 1; a < tboard[0].length && countConsecutive < 4 && tboard[x][a] == color; a++, countConsecutive++);
  
  if (countConsecutive == 4)
    return color;
  
  countConsecutive = 1;
  
  for (i = x - 1, a = y - 1; i >= 0 && a >= 0 && countConsecutive < 4 && tboard[i][a] == color; a--, i--, countConsecutive++);
  for (i = x + 1, a = y + 1; i < tboard.length && a < tboard[0].length && countConsecutive < 4 && tboard[i][a] == color; a++, i++, countConsecutive++);
  
  if (countConsecutive == 4)
    return color;
  
  countConsecutive = 1;
  
  for (i = x - 1, a = y + 1; i >= 0 && a < tboard[0].length && countConsecutive < 4 && tboard[i][a] == color; a++, i--, countConsecutive++);
  for (i = x + 1, a = y - 1; i < tboard.length && a >= 0 && countConsecutive < 4 && tboard[i][a] == color; a--, i++, countConsecutive++);
  
  if (countConsecutive == 4)
    return color;
  
  for (i = 0; i < tboard.length; i++)
    if (tboard[i][0] === 0)
      return -1;
  
  return 0;
}

function game_over_color(tboard, x, y, color) {
  var countConsecutive = 1;
  var i, a;
  
  for (i = x - 1; i >= 0 && countConsecutive < 4 && tboard[i][y] == color; i--, countConsecutive++);
  for (i = x + 1; i < tboard.length && countConsecutive < 4 && tboard[i][y] == color; i++, countConsecutive++);
  
  if (countConsecutive == 4)
    return color;
  
  countConsecutive = 1;
  
  for (a = y - 1; a >= 0 && countConsecutive < 4 && tboard[x][a] == color; a--, countConsecutive++);
  for (a = y + 1; a < tboard[0].length && countConsecutive < 4 && tboard[x][a] == color; a++, countConsecutive++);
  
  if (countConsecutive == 4)
    return color;
  
  countConsecutive = 1;
  
  for (i = x - 1, a = y - 1; i >= 0 && a >= 0 && countConsecutive < 4 && tboard[i][a] == color; a--, i--, countConsecutive++);
  for (i = x + 1, a = y + 1; i < tboard.length && a < tboard[0].length && countConsecutive < 4 && tboard[i][a] == color; a++, i++, countConsecutive++);
  
  if (countConsecutive == 4)
    return color;
  
  countConsecutive = 1;
  
  for (i = x - 1, a = y + 1; i >= 0 && a < tboard[0].length && countConsecutive < 4 && tboard[i][a] == color; a++, i--, countConsecutive++);
  for (i = x + 1, a = y - 1; i < tboard.length && a >= 0 && countConsecutive < 4 && tboard[i][a] == color; a--, i++, countConsecutive++);
  
  if (countConsecutive == 4)
    return color;
  
  for (i = 0; i < tboard.length; i++)
    if (tboard[i][0] === 0)
      return -1;
  
  return 0;
}

function game_over_full(tboard) {
  var countConsecutive = 0;
  var color = 3;
  var i, a;
  
  for (i = 0; i < tboard.length; i++) {
    for (a = 0; a < tboard[i].length; a++)
      if (countConsecutive < 4)
        if (tboard[i][a] === 0)
          color = 3;
        else if (tboard[i][a] == color)
          countConsecutive++;
        else {
          color = tboard[i][a];
          countConsecutive = 1;
        }
      else if (countConsecutive == 4)
        return color;
    if (countConsecutive == 4)
      return color;
    else countConsecutive = 0;
  }
  if (countConsecutive == 4)
    return color;
    
  countConsecutive = 0;
  color = 3;
  
  for (a = 0; a < tboard[0].length; a++) {
    for (i = 0; i < tboard.length; i++)
      if (countConsecutive < 4)
        if (tboard[i][a] === 0)
          color = 3;
        else if (tboard[i][a] == color)
          countConsecutive++;
        else {
          color = tboard[i][a];
          countConsecutive = 1;
        }
      else if (countConsecutive == 4)
        return color;
    if (countConsecutive == 4)
      return color;
    else countConsecutive = 0;
  }
  if (countConsecutive == 4)
    return color;
    
  countConsecutive = 0;
  color = 3;
  
  var x, y;
  
  for (x = 0; x < tboard.length; x++) {
    for (i = x, a = 0; i < tboard.length && a < tboard[i].length; i++, a++)
      if (countConsecutive < 4)
        if (tboard[i][a] === 0)
          color = 3;
        else if (tboard[i][a] == color)
          countConsecutive++;
        else {
          color = tboard[i][a];
          countConsecutive = 1;
        }
      else if (countConsecutive == 4)
        return color;
    if (countConsecutive == 4)
      return color;
    else countConsecutive = 0;
  }
  if (countConsecutive == 4)
    return color;
    
  countConsecutive = 0;
  color = 3;
  
  for (y = 1; y < tboard[0].length; y++) {
    for (i = 0, a = y; i < tboard.length && a < tboard[i].length; i++, a++)
      if (countConsecutive < 4)
        if (tboard[i][a] === 0)
          color = 3;
        else if (tboard[i][a] == color)
          countConsecutive++;
        else {
          color = tboard[i][a];
          countConsecutive = 1;
        }
      else if (countConsecutive == 4)
        return color;
    if (countConsecutive == 4)
      return color;
    else countConsecutive = 0;
  }
  if (countConsecutive == 4)
    return color;
    
  countConsecutive = 0;
  color = 3;
  
  for (x = 0; x < tboard.length; x++) {
    for (i = x, a = 0; i >= 0 && a < tboard[i].length; i--, a++)
      if (countConsecutive < 4)
        if (tboard[i][a] === 0)
          color = 3;
        else if (tboard[i][a] == color)
          countConsecutive++;
        else {
          color = tboard[i][a];
          countConsecutive = 1;
        }
      else if (countConsecutive == 4)
        return color;
    if (countConsecutive == 4)
      return color;
    else countConsecutive = 0;
  }
  if (countConsecutive == 4)
    return color;
        
  countConsecutive = 0;
  color = 3;
  
  for (y = 1; y < tboard[0].length; y++) {
    for (i = tboard.length - 1, a = y; i >= 0 && a < tboard[i].length; i--, a++)
      if (countConsecutive < 4)
        if (tboard[i][a] === 0)
          color = 3;
        else if (tboard[i][a] == color)
          countConsecutive++;
        else {
          color = tboard[i][a];
          countConsecutive = 1;
        }
      else if (countConsecutive == 4)
        return color;
    if (countConsecutive == 4)
      return color;
    else countConsecutive = 0;
  }
  if (countConsecutive == 4)
    return color;
        
  for (i = 0; i < tboard.length; i++)
    if (tboard[i][0] === 0)
      return -1;
  
  return 0;
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
  
  switch ($('select[name="ai-turn"]').val()) {
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
  
  switch ($('select[name="ai-diff"]').val().toLowerCase()) {
    case "custom":
      smart_simulation = $('input[name="smart-simulation"]').prop('checked');
      monte_carlo_trials = $('input[name="mc-trials"]').val();
      expansion_const = $('input[name="mc-expansion"]').val();
      certainty_threshold = (1 - $('input[name="mc-certainty"]').val() / 100).toFixed(2);
      ponder =  $('input[name="ai-ponder"]').prop('checked');
      increasing_factor = 1.05;
      break;
    case "stupid":
      smart_simulation = false;
      monte_carlo_trials = dimensions[0] * 2;
      expansion_const = 10;
      certainty_threshold = 0;
      ponder = false;
      increasing_factor = 1;
      break;
    case "ehh":
      smart_simulation = true;
      monte_carlo_trials = dimensions[0] * dimensions[1];
      expansion_const = 2;
      certainty_threshold = 0;
      ponder = false;
      increasing_factor = 1;
      break;
    case "play fast":
      smart_simulation = false;
      monte_carlo_trials = 0;
      expansion_const = 2;
      certainty_threshold = 1;
      ponder = true;
      increasing_factor = 1.05;
      break;
    case "normal":
      smart_simulation = true;
      monte_carlo_trials = 1000;
      expansion_const = 10;
      certainty_threshold = 0.4;
      ponder = false;
      increasing_factor = 1.1;
      break;
    case "play fast ++":
      smart_simulation = true;
      monte_carlo_trials = 0;
      expansion_const = 2.5;
      certainty_threshold = 1;
      ponder = true;
      increasing_factor = 1.08;
      break;
    case "win fast":
      smart_simulation = true;
      monte_carlo_trials = 500;
      expansion_const = 2;
      certainty_threshold = 0.25;
      ponder = false;
      increasing_factor = 1.23;
      break;
    case "hard":
      smart_simulation = true;
      monte_carlo_trials = 5000;
      expansion_const = 2;
      certainty_threshold = 0.25;
      ponder = true;
      increasing_factor = 1.07;
      break;
    case "very hard":
      smart_simulation = true;
      monte_carlo_trials = 10000;
      expansion_const = 2;
      certainty_threshold = 0.15;
      ponder = true;
      increasing_factor = 1.07;
      break;
    case "good luck":
      smart_simulation = true;
      monte_carlo_trials = 150000;
      expansion_const = 5;
      certainty_threshold = 0.05;
      ponder = true;
      increasing_factor = 1.07;
      break;
    case "wreckage":
      smart_simulation = true;
      monte_carlo_trials = 5000000;
      expansion_const = 6;
      certainty_threshold = 0.01;
      ponder = true;
      increasing_factor = 1.07;
      break;
  }
  
  if (!allow_ponder)
    ponder = false;
  
  position = $('input[name="position"]').val();
  monte_carlo_trials = monte_carlo_trials * Math.pow(increasing_factor, position.length);
  
  var name = $('input[name="name"]').val();
  over = -1;
  
  save_settings_cookie(name);
  
  $('#new-game-menu').animate({opacity: 0}, "slow", function() {
    $(this).css('z-index', -1);
    $('input[name="name"]').val(new_cookie_id());
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
  if (ai_turn === true || ai_turn === false) {
    position = position.substring(0, position.length - 2);
    monte_carlo_trials /= Math.pow(increasing_factor, 2);
  }
  else {
    position = position.substring(0, position.length - 1);
    monte_carlo_trials /= increasing_factor;
  }
  over = -1;
  
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

var State = function(board, turn) {
  this.board = board;
  this.turn = turn;
};


var MCTS_Node = function(State, parent, last_move) {
  this.State = State;
  this.parent = parent;
  this.last_move = last_move;
  this.hits = 0;
  this.misses = 0;
  this.total_tries = 0;
};

function MCTS_child_potential(child, t) {
  var w = child.misses - child.hits;
  var n = child.total_tries;
  var c = expansion_const;
  
  return w / n  +  c * Math.sqrt(Math.log(t) / n);
}

MCTS_Node.prototype.choose_child = function() {
  if (!this.children)
    this.children = MCTS_get_children(this.State, this);
  if (this.children.length === 0) // leaf node
    this.run_simulation();
  else {
    var i;
    var count_unexplored = 0;
    for (i = 0; i < this.children.length; i++)
      if (this.children[i].total_tries === 0)
        count_unexplored++;

    if (count_unexplored > 0) {
      var ran = Math.floor(Math.random() * count_unexplored);
      for (i = 0; i < this.children.length; i++)
        if (this.children[i].total_tries === 0) {
          count_unexplored--;
          if (count_unexplored === 0) {
            this.children[i].run_simulation();
            return;
          }
        }
      
    }
    else {
      var best_child = this.children[0], best_potential = MCTS_child_potential(this.children[0], this.total_tries), potential;
      for (i = 1; i < this.children.length; i++) {
        potential = MCTS_child_potential(this.children[i], this.total_tries);
        if (potential > best_potential) {
          best_potential = potential;
          best_child = this.children[i];
        }
      }
      best_child.choose_child();
    }
  }
};

MCTS_Node.prototype.run_simulation = function() {
  this.back_propogate(MCTS_simulate(this.State));
};

MCTS_Node.prototype.back_propogate = function(simulation) {
  if (simulation > 0)
    this.hits++;
  else if (simulation < 0)
    this.misses++;
  this.total_tries++;
  if (this.parent) {
    if (this.parent.State.turn === this.State.turn)
      this.parent.back_propogate(simulation);
    else this.parent.back_propogate(-simulation);
  }
};

function efficiency_test() {
  global_ROOT = create_MCTS_root();
  var total_trials, start = new Date().getTime();
  for (total_trials = 0; total_trials < 100000; total_trials++)
    global_ROOT.choose_child();
  console.log((new Date().getTime() - start) / 1E3);
  setInterval(function() {
    for (var i = 0; i < 1000; i++)
      global_ROOT.choose_child();
    $('#num-trials').text(global_ROOT.total_tries);
  }, 1);
}

function speed_test() {
  global_ROOT = create_MCTS_root();
  var total_trials, start = new Date().getTime();
  for (total_trials = 0; total_trials < 500000; total_trials++)
    global_ROOT.choose_child();
  console.log((new Date().getTime() - start) / 1E3);
}
