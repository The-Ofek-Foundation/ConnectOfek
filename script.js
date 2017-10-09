var docWidth, docHeight;
var discWidth, discHeight;
var board;
var redTurnGlobal;
var globalRoot;
var expansionConstant;
var aiTurn;
var monteCarloTrials;
var over;
var ponder, pondering;
var certaintyThreshold;
var position, cookieId;
var aiStopped = false;
var smartSimulation;
var increasingFactor;

var boardui = getElemId("board");
var brush = boardui.getContext("2d");
var numChoose1, numChoose2, numChoose3, lnc1, lnc2, lnc3, stopChoose;
var analElem = getElemId('anal'), numTrialsElem = getElemId('num-trials');
var gameSettingsMenu = getElemId('settings-menu');

function pageReady() {
	resizeBoard();
	setTimeout(resizeSettingsTable, 0);

	newGame(window.location.hash);

	setInputValue('name', newCookieId());
}

function resizeBoard() {
	docWidth = getElemWidth(contentWrapper);
	docHeight = getElemHeight(contentWrapper);

	setElemWidth(boardui, docWidth);
	setElemHeight(boardui, docHeight);
	boardui.setAttribute('width', docWidth);
	boardui.setAttribute('height', docHeight);

	adjustButtons();
	resizeSettingsTable();
}

function onResize() {
	resizeBoard();
	discWidth = docWidth / (dimensions[0] + 1);
	discHeight = docHeight / (dimensions[1] + 1);
	drawBoard();
}

function startPonder() {
	pondering = setInterval(function() {
		if (!globalRoot)
			globalRoot = createMCTSRoot();
		var startTime = new Date().getTime();
		var tempCount = 0;
		while ((new Date().getTime() - startTime) < 30 && !stopChoose) {
			globalRoot.chooseChild(position);
			tempCount++;
		}
		if (numChoose3 && (tempCount < numChoose3 / 10 || tempCount < numChoose2 / 10 || tempCount < numChoose1 / 10))
			stopChoose = true;
		else {
			numChoose3 = numChoose2;
			numChoose2 = numChoose1;
			numChoose1 = tempCount;
		}
		updateAnalysis();
	}, 1);
}

function stopPonder() {
	clearInterval(pondering);
}

function adjustButtons() {
	setElemHeight(getElemId('footer'), discHeight / 2);
	setElemStyle(getElemQuery('#footer #anal'), 'line-height', discHeight / 2 + "px");
	setElemStyle(getElemQuery('#footer #num-trials'), 'line-height',
		discHeight / 2 + "px");
}

function updateAnalysis() {
	var range = getMCTSDepthRange();

	analElem.innerHTML = "Analysis: Depth-" + range[1] + " Result-" +
		range[2] + " Certainty-" + (globalRoot && globalRoot.totalTries > 0 ?
		(resultCertainty(globalRoot) * 100).toFixed(0):"0") + "%";
	numTrialsElem.innerHTML = "Trials: " + globalRoot.totalTries;
}

function resultCertainty(root) {
	if (root.totalTries > (root.hits + root.misses) * 2)
		return 1 - (root.hits + root.misses) / root.totalTries;
	else if (root.hits > root.misses)
		return (root.hits - root.misses) / root.totalTries;
	else if (root.hits < root.misses)
		return (root.misses - root.hits) / root.totalTries;
	else return 1 - (root.hits + root.misses) / root.totalTries;
}

function newGame(cId) {

	if (cId === undefined)
		cId = newCookieId();

	cookieId = cId.replace(/#/g, "");

	if (cookieId.length === 0)
		cookieId = newCookieId();

	window.location.hash = cookieId;

	var cookie = getCookie(cookieId);
	if (cookie && cookie.length > 0) {
		newGameCookie(cookie);
		return;
	}

	getSettings();
	populateSettingsForm(gameSettings.getSettings());

	discWidth = docWidth / (dimensions[0] + 1);
	discHeight = docHeight / (dimensions[1] + 1);

	adjustButtons();

	over = -1;
	board = new Array(dimensions[0]);
	for (var i = 0; i < board.length; i++) {
		board[i] = new Array(dimensions[1]);
		for (var a = 0; a < board[i].length; a++)
			board[i][a] = 0;
	}

	redTurnGlobal = true;
	numChoose1 = numChoose2 = numChoose3 = lnc1 = lnc2 = lnc3 = stopChoose = false;
	position = "";

	saveSettingsCookie(cookieId);

	globalRoot = createMCTSRoot();
	drawBoard();

	if (aiTurn !== 'none')
		if (((aiTurn === 'first') === redTurnGlobal) || aiTurn == 'both')
			setTimeout(playAiMove, 20);

	stopPonder();
	if (ponder)
		startPonder();
}

function newGameCookie(cookie) {
	loadSettingsCookie(cookie);
	var pos = position;

	gameSettings.setSettings(getNewSettings());
	populateSettingsForm(gameSettings.getSettings());

	discWidth = docWidth / (dimensions[0] + 1);
	discHeight = docHeight / (dimensions[1] + 1);
	adjustButtons();

	board = new Array(dimensions[0]);
	for (var i = 0; i < board.length; i++) {
		board[i] = new Array(dimensions[1]);
		for (var a = 0; a < board[i].length; a++)
			board[i][a] = 0;
	}
	redTurnGlobal = true;
	numChoose1 = numChoose2 = numChoose3 = lnc1 = lnc2 = lnc3 = stopChoose = false;
	position = pos;
	setupPosition(position);

	globalRoot = createMCTSRoot();
	drawBoard();

	if (aiTurn !== 'none')
		if (((aiTurn === 'first') === redTurnGlobal) || aiTurn == 'both')
			setTimeout(playAiMove, 20);

	stopPonder();
	if (ponder)
		startPonder();
}

function newCookieId() {
	var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
	var cId;

	do {
		cId = "";
		for( var i=0; i < 5; i++)
				cId += possible.charAt(Math.floor(Math.random() * possible.length));
	} while (getCookie(cId));

	return cId;
}

function getSettings() {
	gameSettings.getOrSet('difficulty', 'Normal');
	ponder = gameSettings.getOrSet('ponder', false);
	aiTurn = gameSettings.getOrSet('aiTurn', 'second');
	dimensions = gameSettings.getOrSet('dimensions', [7, 6]);
	expansionConstant = gameSettings.getOrSet('expansionConstant', 1.4970703125)
	smartSimulation = gameSettings.getOrSet('smartSimulation', true);
	increasingFactor = gameSettings.getOrSet('increasingFactor', 1.07);
	monteCarloTrials = gameSettings.getOrSet('monteCarloTrials', 10000);
	certaintyThreshold = gameSettings.getOrSet('certaintyThreshold', 0.15);
}

function populateSettingsForm(settings) {
	setInputValue('ai-diff', settings.difficulty);
	setInputValue('d-width', settings.dimensions[0]);
	setInputValue('d-height', settings.dimensions[1]);
	setInputValue('ai-turn', settings.aiTurn);
	setInputValue('smart-simulation', settings.smartSimulation);
	setInputValue('mc-trials', settings.monteCarloTrials);
	setInputValue('mc-expansion', settings.expansionConstant);
	setInputValue('mc-certainty', (1 - settings.certaintyThreshold) * 100);
	setInputValue('ai-ponder', settings.ponder);
	setInputValue('name', newCookieId());
}

function getSettingsDict() {
	let settings = {};

	settings.ponder = ponder;
	settings.aiTurn = aiTurn;
	settings.dimensions = dimensions;
	settings.expansionConstant = expansionConstant;
	settings.smartSimulation = smartSimulation;
	settings.increasingFactor = increasingFactor;
	settings.monteCarloTrials = monteCarloTrials;
	settings.certaintyThreshold = certaintyThreshold;

	return settings;
}

function saveSettingsCookie(cId, settings) {
	if (!settings)
		settings = getSettingsDict();

	settings.over = over;
	settings.position = position;

	setCookie(cId, JSON.stringify(settings), 10);
}

function loadSettingsCookie(cookie) {
	var settings = JSON.parse(cookie);

	over = settings.over;
	ponder = settings.ponder;
	aiTurn = settings.aiTurn;
	position = settings.position;
	dimensions = settings.dimensions;
	expansionConstant = settings.expansionConstant;
	smartSimulation = settings.smartSimulation;
	increasingFactor = settings.increasingFactor;
	monteCarloTrials = settings.monteCarloTrials;
	certaintyThreshold = settings.certaintyThreshold;
}

function setupPosition(pos) {
	if (!pos || pos.length === 0) {
		position = "";
		return true;
	}

	for (var i = 0; i < pos.length; i++) {
		var col = parseInt(pos.charAt(i), 10) - 1;
		if (legalMove(board, col, false)) {
			playMove(board, col, redTurnGlobal);
			redTurnGlobal = !redTurnGlobal;
		} else return false;
	}
	return true;
}

function setupBoard(pos) {
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
			xe = x + w,					 // x-end
			ye = y + h,					 // y-end
			xm = x + w / 2,			 // x-middle
			ym = y + h / 2;			 // y-middle

	brush.moveTo(x, ym);
	brush.bezierCurveTo(x, ym - oy, xm - ox, y, xm, y);
	brush.bezierCurveTo(xm + ox, y, xe, ym - oy, xe, ym);
	brush.bezierCurveTo(xe, ym + oy, xm + ox, ye, xm, ye);
	brush.bezierCurveTo(xm - ox, ye, x, ym + oy, x, ym);
}

function clearBoard() {
	brush.clearRect(0, 0, docWidth, docHeight);
}

function drawGrid() {
	brush.lineWidth = 2;
	brush.strokeStyle = "black";

	brush.beginPath();
	for (var i = discWidth / 2; i < docWidth; i += discWidth) {
		brush.moveTo(i, discHeight / 2);
		brush.lineTo(i, docHeight - discHeight / 2);
	}
	for (var a = 3 * discHeight / 2; a < docHeight; a += discHeight) {
		brush.moveTo(discWidth / 2, a);
		brush.lineTo(docWidth - discWidth / 2, a);
	}
	brush.stroke();
	brush.closePath();
}

function drawPiece(x, y) {
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
	drawEllipse(x * discWidth + discWidth / 2, y * discHeight + discHeight / 2, discWidth, discHeight);
	brush.fill();
	brush.closePath();
}

function drawBoard() {
	clearBoard();
	updateAnalysis();

	for (var i = 0; i < board.length; i++)
		for (var a = 0; a < board[i].length; a++)
			if (board[i][a] !== 0)
				drawPiece(i, a);

	drawGrid();
}

function drawHover(col) {
	var color = redTurnGlobal ? 1:2;
	drawBoard();
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
	drawEllipse(col * discWidth + discWidth / 2, 0, discWidth, discHeight);
	brush.fill();
	brush.closePath();
}

function getCol(xloc, yloc) {
	if (xloc > docWidth - discWidth / 2 || xloc < discWidth / 2)
		return -1;
	else if (yloc > docHeight - discHeight / 2)
		return -2;
	return Math.floor((xloc - discWidth / 2) / discWidth);
}

function legalMove(tboard, col, output) {
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

function setTurn(turn, col, row) {

	position += col + 1;

	redTurnGlobal = turn;

	globalRoot = MCTSGetNextRoot(col);
	if (globalRoot)
		globalRoot.parent = null;
	else globalRoot = createMCTSRoot();
	globalRoot.lastMove = -1;

	var mtc = mostTriedChild(globalRoot, null);

	if (over == -1 && (turn === (aiTurn === 'first') || aiTurn == "both") && mtc && mtc.lastMove)
		drawHover(mtc.lastMove);
	else drawBoard();

	over = gameOver(board, col, row);

	saveSettingsCookie(cookieId);

	if (over !== -1) {
		setTimeout(function () {
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
		}, 100);
		stopPonder();
		setCookie(cookieId, "", -1);
	} else {
		monteCarloTrials *= increasingFactor;
		numChoose1 = numChoose2 = numChoose3 = stopChoose = false;

		if (aiTurn !== 'none')
			if ((turn === (aiTurn === 'first')) || aiTurn == "both")
				setTimeout(playAiMove, 25);
	}

}

function playMove(tboard, col, turn) {
	if (tboard[col][0] !== 0)
		return -1;
	var color = turn ? 1:2, row;
	for (row = tboard[col].length - 1; tboard[col][row] !== 0; row--);
	tboard[col][row] = color;
	return row;
}

boardui.addEventListener('mousedown', function (e) {
	if (e.which === 3)
		return;
	if (aiTurn !== 'none')
		if (redTurnGlobal === (aiTurn === 'first') || aiTurn == "both")
			return;
	if (over != -1) {
		alert("The game is already over!");
		return;
	}
	var col = getCol(e.pageX, e.pageY);
	if (!legalMove(board, col, true))
		return;
	var row = playMove(board, col, redTurnGlobal);

	setTurn(!redTurnGlobal, col, row);
});

boardui.addEventListener('mousemove', function (e) {
	if (aiTurn !== 'none' || over !== -1)
		if (redTurnGlobal == (aiTurn === 'first') || aiTurn == "both" || over != -1)
			return;
	var col = getCol(e.pageX);
	if (!legalMove(board, col, false))
		return;
	drawHover(col);
});

function getWinningMove(tboard, turn, lower, upper) {
	var row, color = turn ? 1:2;
	for (var col = lower; col <= upper; col++) {
		if (tboard[col][0] !== 0)
			continue;
		for (row = tboard[col].length - 1; tboard[col][row] !== 0; row--);
		if (gameOverColor(tboard, col, row, color) != -1)
			return [col, row];
	}
	return [-1, -1];
}

function cGetWinningMove(tboard, turn, lower, upper) {
	var row, color = turn ? 1:2, c = 0;
	for (var col = 0; col < tboard.length; col++) {
		if (tboard[col][0] !== 0)
			continue;
		c++;
		if (col < lower || col > upper)
			continue;
		for (row = tboard[col].length - 1; tboard[col][row] !== 0; row--);
		if (gameOverColor(tboard, col, row, color) != -1)
			return [col, row];
	}
	return [false, c];
}
function aGetWinningMove(tboard, turn, lower, upper, c) {
	var row, color = turn ? 1:2, a = new Array(c);
	for (var col = 0; col < tboard.length; col++) {
		if (tboard[col][0] !== 0)
			continue;
		a[--c] = col + 1;
		if (col < lower || col > upper)
			continue;
		for (row = tboard[col].length - 1; tboard[col][row] !== 0; row--);
		if (gameOverColor(tboard, col, row, color) != -1)
			return [col, row];
	}
	return [false, a];
}

function cGetWinningMoveO(tboard, turn) {
	var row, color = turn ? 1:2, c = 0;
	for (var col = 0; col < tboard.length; col++) {
		if (tboard[col][0] !== 0)
			continue;
		c++;
		for (row = tboard[col].length - 1; tboard[col][row] !== 0; row--);
		if (gameOverColor(tboard, col, row, color) != -1)
			return [col, row];
	}
	return [false, c];
}
function aGetWinningMoveO(tboard, turn, c) {
	var row, color = turn ? 1:2, a = new Array(c);
	for (var col = 0; col < tboard.length; col++) {
		if (tboard[col][0] !== 0)
			continue;
		a[--c] = col + 1;
		for (row = tboard[col].length - 1; tboard[col][row] !== 0; row--);
		if (gameOverColor(tboard, col, row, color) != -1)
			return [col, row];
	}
	return [false, a];
}

function MCTSGetChildren(father, board) {
	var tboard = setupBoard(board);

	if (typeof father.gameOver !== 'undefined')
		return [];

	// win[1] stores all possible moves

	var lower, upper;
	if (father.parent === null || father.parent.lastMove === -1) {
		lower = 0;
		upper = dimensions[0] - 1;
	} else {
		lower = Math.min(father.lastMove, father.parent.lastMove) - 3;
		upper = Math.max(father.lastMove, father.parent.lastMove) + 3;
	}

	var win = cGetWinningMove(tboard, father.turn, lower, upper);
	if (win[0] === false)
		win = aGetWinningMove(tboard, !father.turn, lower, upper, win[1]);
	else {
		father.gameOver = win[0];
		return;
	}
	if (win[0] !== false)
		return [new MCTSNode(!father.turn, father, win[0])];

	var i = 0;
	var children = new Array(win[1].length);
	for (i = 0; i < win[1].length; i++)
		children[i] = new MCTSNode(!father.turn, father, win[1][i] - 1);

	if (/^4*$/.test(board))
		for (i = 0; i < children.length - 1; i++)
			for (a = i + 1; a < children.length; a++)
				if (identicalBoards(setupBoard(board + (children[i].lastMove + 1)), setupBoard(board + (children[a].lastMove+1)))) {
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

var MCTSSimulate;

function MCTSDumbSimulate(board, gTurn, gOver) {
	if (gOver)
		return -1;
	var tboard = setupBoard(board);

	var lastMove, turn = gTurn, done = false;
	var row, col;
	while (done == -1) {
			do {
				col = Math.random() * tboard.length | 0;
				row = playMove(tboard, col, turn);
			}	while (row === -1);
		done = gameOver(tboard, col, row);
		turn = !turn;
	}

	if (done === 0)
		return 0;
	return done == (gTurn ? 1:2) ? 1:-1;
}

function MCTSSimulateSmart(board, gTurn, gOver) {
	var tboard = setupBoard(board);

	var lastMove = [-1, -1], turn = gTurn, done = gameOverFull(tboard);
	var row, col, lower, upper;
	var lc1 = -1, lc2 = -1; // last col 1, last col 2
	while (done === -1) {
		if (lc2 === -1) {
			lower = 0;
			upper = dimensions[0] - 1;
		} else {
			lower = Math.min(lc1, lc2) - 3;
			upper = Math.max(lc1, lc2) + 3;
			if (lower < 0) lower = 0;
			if (upper > dimensions[0] - 1)
				upper = dimensions[0] - 1;
		}
		lastMove = getWinningMove(tboard, turn, lower, upper);
		if (lastMove[0] === -1)
			lastMove = getWinningMove(tboard, !turn, lower, upper);
		else {
			done = turn ? 1:2;
			break;
		}
		if (lastMove[0] === -1)
			do {
				col = Math.random() * tboard.length | 0;
				row = playMove(tboard, col, turn);
			}	while (row < 0);
		else {
			col = lastMove[0];
			row = lastMove[1];
			tboard[col][row] = turn ? 1:2;
		}
		done = gameOver(tboard, col, row);
		turn = !turn;
		lc2 = lc1;
		lc1 = col;
	}

	if (done === 0)
		return 0;
	return done == (gTurn ? 1:2) ? 1:-1;
}

function createMCTSRoot() {
	MCTSSimulate = smartSimulation ? MCTSSimulateSmart:MCTSDumbSimulate;
	return new MCTSNode(redTurnGlobal, null, -1);
}

function MCTSGetNextRoot(col) {
	if (!globalRoot || !globalRoot.children)
		return null;
	for (var i = 0; i < globalRoot.children.length; i++)
		if (globalRoot.children[i].lastMove == col) {
			return globalRoot.children[i];
		}
	return null;
}

function runMCTS(times, threshold, callback) {
	if (!globalRoot)
		globalRoot = createMCTSRoot();
	runMCTSRecursive(times, threshold, callback, 0);
}

function runMCTSRecursive(times, threshold, callback, count) {
	var startTime = new Date().getTime();
	var initTimes = times;
	if (times === 0 && globalRoot.totalTries < 5E3)
		while (globalRoot.totalTries < 5E3)
			globalRoot.chooseChild(position);
	while (times > 0 && (new Date().getTime() - startTime) < 100) {
		globalRoot.chooseChild(position);
		times--;
	}
	if (count % 20 === 0) {
		if (globalRoot.children.length === 0) {
			callback();
			return;
		} else drawHover(mostTriedChild(globalRoot, null).lastMove);
		if (threshold > 0) {
			var error = getCertainty(globalRoot);
			console.log(error);
			if (globalRoot.children.length < 2 || error < threshold) {
				callback();
				return;
			}
		}
	}
	if (aiStopped || times <= 0 || stopChoose)
		callback();
	else if (lnc3 && (initTimes - times < lnc3 / 5 || initTimes - times < lnc2 / 5 || initTimes - times < lnc1 / 5)) {
		console.log(initTimes - times, lnc3);
		callback();
	} else {
		lnc3 = lnc2;
		lnc2 = lnc1;
		lnc1 = initTimes - times;
		setTimeout(function() {
			runMCTSRecursive(times, threshold, callback, ++count);
		}, 1);
	}
}

function getCertainty(root) {
	var bestChild = mostTriedChild(root, null);
	if (!mostTriedChild(root, bestChild))
		console.log(root, bestChild);
	var ratio = mostTriedChild(root, bestChild).totalTries / bestChild.totalTries;
	var ratioWins = bestChild.hits < bestChild.misses ? (bestChild.hits / bestChild.misses * 2):(bestChild.misses / bestChild.hits * 3);
	return ratio > ratioWins ? ratioWins:ratio;
}

function mostTriedChild(root, exclude) {
	var mostTrials = 0, child = null;
	if (!root.children)
		return null;
	if (root.children.length == 1)
		return root.children[0];
	for (var i = 0; i < root.children.length; i++)
		if (root.children[i] != exclude && root.children[i].totalTries > mostTrials) {
			mostTrials = root.children[i].totalTries;
			child = root.children[i];
		}
	return child;
}


function leastTriedChild(root) {
	var leastTrials = root.totalTries + 1, child = null;
	if (!root.children)
		return null;
	for (var i = 0; i < root.children.length; i++)
		if (root.children[i].totalTries < leastTrials) {
			leastTrials = root.children[i].totalTries;
			child = root.children[i];
		}
	return child;
}

function getMCTSDepthRange() {
	var root, range = new Array(3);
	for (range[0] = -1, root = globalRoot; root && root.children; range[0]++, root = leastTriedChild(root));
	for (range[1] = -1, root = globalRoot; root && root.children; range[1]++, root = mostTriedChild(root));
	if (globalRoot.totalTries > (globalRoot.hits + globalRoot.misses) * 3)
		range[2] = "Tie";
	else if ((globalRoot.hits > globalRoot.misses) == redTurnGlobal)
		range[2] = "R";
	else if ((globalRoot.hits < globalRoot.misses) == redTurnGlobal)
		range[2] = "Y";
	else range[2] = "Tie";
	return range;
}

function getBestMoveMCTS() {
	var bestChild = mostTriedChild(globalRoot, null);
	if (!bestChild)
		return globalRoot.gameOver;
	return bestChild.lastMove;
}

function playAiMove() {
	aiStopped = false;
	if (!globalRoot || globalRoot.totalTries < monteCarloTrials && certaintyThreshold < 1 && !(globalRoot.children && globalRoot.children.length == 1))
		runMCTS(monteCarloTrials - globalRoot.totalTries, certaintyThreshold, fpaim);
	else fpaim();
}

function fpaim() {
	var bestRow = getBestMoveMCTS();
	var bestCol = playMove(board, bestRow, redTurnGlobal);
	setTurn(!redTurnGlobal, bestRow, bestCol);
}

function gameOver(tboard, x, y) {
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


function gameOverColor(tboard, x, y, color) {
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

function gameOverFull(tboard) {
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

function identicalBoards(board1, board2) {
	for (var i = 0; i < board1.length / 2; i++)
		for (var a = 0; a < board1[i].length; a++)
			if (board1[i][a] != board2[board1.length - 1 - i][a])
				return false;
	return true;
}

getElemId('new-game').addEventListener('click', function () {
	newGame(getInputValue('name'));
});

getElemId('settings').addEventListener('click', showSettingsForm);

function getNewSettings() {
	var settings = {};

	settings['dimensions'] = [getInputValue('d-width'), getInputValue('d-height')];
	settings['aiTurn'] = getInputValue('ai-turn');

	var allowPonder = getInputValue('allow-ponder');
	settings['difficulty'] = getInputValue('ai-diff');
	switch (settings['difficulty'].toLowerCase()) {
		case "custom":
			settings['smartSimulation'] = getInputValue('smart-simulation');
			settings['monteCarloTrials'] = getInputValue('mc-trials');
			settings['expansionConstant'] = getInputValue('mc-expansion');
			settings['certaintyThreshold'] = parseFloat((1 - getInputValue('mc-certainty') / 100).toFixed(2));
			settings['ponder'] = getInputValue('ai-ponder');
			settings['increasingFactor'] = 1.05;
			break;
		case "stupid":
			settings['smartSimulation'] = false;
			settings['monteCarloTrials'] = dimensions[0] * 2;
			settings['expansionConstant'] = 10;
			settings['certaintyThreshold'] = 0;
			settings['ponder'] = false;
			settings['increasingFactor'] = 1;
			break;
		case "ehh":
			settings['smartSimulation'] = true;
			settings['monteCarloTrials'] = dimensions[0] * dimensions[1];
			settings['expansionConstant'] = 2;
			settings['certaintyThreshold'] = 0;
			settings['ponder'] = false;
			settings['increasingFactor'] = 1;
			break;
		case "play fast":
			settings['smartSimulation'] = false;
			settings['monteCarloTrials'] = 0;
			settings['expansionConstant'] = 2;
			settings['certaintyThreshold'] = 1;
			settings['ponder'] = true;
			settings['increasingFactor'] = 1.05;
			break;
		case "normal":
			settings['smartSimulation'] = true;
			settings['monteCarloTrials'] = 1000;
			settings['expansionConstant'] = 10;
			settings['certaintyThreshold'] = 0.4;
			settings['ponder'] = false;
			settings['increasingFactor'] = 1.1;
			break;
		case "play fast ++":
			settings['smartSimulation'] = true;
			settings['monteCarloTrials'] = 0;
			settings['expansionConstant'] = 1.85546875;
			// bound: ~0.0098
			settings['certaintyThreshold'] = 1;
			settings['ponder'] = true;
			settings['increasingFactor'] = 1.08;
			break;
		case "win fast":
			settings['smartSimulation'] = true;
			settings['monteCarloTrials'] = 500;
			settings['expansionConstant'] = 2;
			settings['certaintyThreshold'] = 0.25;
			settings['ponder'] = false;
			settings['increasingFactor'] = 1.3;
			break;
		case "hard":
			settings['smartSimulation'] = true;
			settings['monteCarloTrials'] = 5000;
			settings['expansionConstant'] = 1.75;
			settings['certaintyThreshold'] = 0.25;
			settings['ponder'] = true;
			settings['increasingFactor'] = 1.07;
			break;
		case "very hard":
			settings['smartSimulation'] = true;
			settings['monteCarloTrials'] = 10000;
			settings['expansionConstant'] = 1.75;
			settings['certaintyThreshold'] = 0.15;
			settings['ponder'] = true;
			settings['increasingFactor'] = 1.07;
			break;
		case "good luck":
			settings['smartSimulation'] = true;
			settings['monteCarloTrials'] = 200000;
			settings['expansionConstant'] = 1.8125;
			// bound: 0.03125
			settings['certaintyThreshold'] = 0.01;
			settings['ponder'] = true;
			settings['increasingFactor'] = 1.07;
			break;
		case "can't win them all":
			settings['smartSimulation'] = true;
			settings['monteCarloTrials'] = 1000000;
			settings['expansionConstant'] = 2;
			settings['certaintyThreshold'] = 0.001;
			settings['ponder'] = true;
			settings['increasingFactor'] = 1.07;
			break;
		case "wreckage":
			settings['smartSimulation'] = true;
			settings['monteCarloTrials'] = 5000000;
			settings['expansionConstant'] = 5;
			settings['certaintyThreshold'] = 0.01;
			settings['ponder'] = true;
			settings['increasingFactor'] = 1.07;
			break;
	}

	if (!allowPonder)
		settings['ponder'] = false;

	position = getInputValue('position');
	settings['monteCarloTrials'] = settings['monteCarloTrials'] * Math.pow(increasingFactor, position.length);

	var name = getInputValue('name');
	over = -1;

	ts = JSON.stringify(settings);

	saveSettingsCookie(name, settings);

	return JSON.parse(ts);
}

getElemId('done').addEventListener('click', function () {
	let settings = getNewSettings();
	gameSettings.setSettings(settings);
	hideSettingsForm(function() {
		setInputValue('name', newCookieId());
		newGame(name);
	});
});

if (getElemId('save'))
	getElemId('save').addEventListener('click', function () {
		let settings = getNewSettings();
		gameSettings.setSettings(settings);
		gameSettings.saveSettings(settings);
		hideSettingsForm(function() {
			setInputValue('name', newCookieId());
			newGame(name);
		});
	});

getElemId('back').addEventListener('click', function () {
	if (aiTurn === 'first' || aiTurn === 'second') {
		position = position.substring(0, position.length - 2);
		monteCarloTrials /= Math.pow(increasingFactor, 2);
	} else {
		position = position.substring(0, position.length - 1);
		monteCarloTrials /= increasingFactor;
	}
	over = -1;

	saveSettingsCookie(cookieId);

	newGame(cookieId);
});

getElemId('stop-ai').addEventListener('click', function () {
	aiStopped = true;
	aiTurn = "none";
	saveSettingsCookie(cookieId);
});

getElemId('start-ai').addEventListener('click', function () {
	if (aiTurn !== 'none')
		if (((aiTurn === 'first') == redTurnGlobal) || aiTurn == "both")
			return;
	aiTurn = redTurnGlobal ? 'first':'second';
	saveSettingsCookie(cookieId);

	playAiMove();
});

document.addEventListener('keypress', function (event) {
	switch (event.which) {
		case 115: case 83: // s
			showSettingsForm();
			break;
		case 110: case 78: // n
			newGame(getInputValue('name'));
			setInputValue('name', newCookieId());
			break;
	}
});

class MCTSNode {
	constructor(turn, parent, lastMove) {
		this.turn = turn;
		this.parent = parent;
		this.lastMove = lastMove;
		this.hits = 0;
		this.misses = 0;
		this.totalTries = 0;
		this.countUnexplored = 0;
	}

	chooseChild(board) {
		if (this.lastMove !== -1)
			board += this.lastMove + 1;
		if (typeof this.children === 'undefined') {
			this.children = MCTSGetChildren(this, board);
			if (typeof this.children !== 'undefined')
				this.countUnexplored = this.children.length;
		}
		if (typeof this.gameOver !== 'undefined') // next move wins
			this.backPropogate(1);
		else if (this.children.length === 0) {
			this.backPropogate(0);
		} else {
			var i;
			var unexplored = this.countUnexplored;

			if (unexplored > 0) {
				this.countUnexplored--;
				var ran = Math.floor(Math.random() * unexplored);
				for (i = 0; i < this.children.length; i++)
					if (this.children[i].totalTries === 0) {
						if (ran === 0) {
							this.children[i].runSimulation(board);
							return;
						}
						ran--;
					}
			} else {
				var lt = Math.log(this.totalTries);
				var bestChild = this.children[0], bestPotential = MCTSChildPotential(this.children[0], lt), potential;
				for (i = 1; i < this.children.length; i++) {
					potential = MCTSChildPotential(this.children[i], lt);
					if (potential > bestPotential) {
						bestPotential = potential;
						bestChild = this.children[i];
					}
				}
				bestChild.chooseChild(board);
			}
		}
	}

	runSimulation(board) {
		this.backPropogate(MCTSSimulate(board, this.turn, this.gameOver));
	}

	backPropogate(simulation) {
		if (simulation > 0)
			this.hits++;
		else if (simulation < 0)
			this.misses++;
		this.totalTries++;
		if (this.parent)
			this.parent.backPropogate(-simulation);
	}
}

function MCTSChildPotential(child, lt) {
	var w = child.misses - child.hits;
	var n = child.totalTries;
	var c = expansionConstant;

	return w / n + c * Math.sqrt(lt / n);
}

function efficiencyTest() {
	globalRoot = createMCTSRoot();
	var totalTrials, start = new Date().getTime();
	for (totalTrials = 0; totalTrials < 100000; totalTrials++)
		globalRoot.chooseChild(position);
	console.log((new Date().getTime() - start) / 1E3);
	setInterval(function() {
		for (var i = 0; i < 1000; i++)
			globalRoot.chooseChild(position);
		numTrialsElem.innerHTML = globalRoot.totalTries;
	}, 1);
}

function speedTest(totalTrials) {
	totalTrials = totalTrials || 5E5;
	globalRoot = createMCTSRoot();
	let startTime = new Date().getTime();
	while (globalRoot.totalTries < totalTrials)
		globalRoot.chooseChild(position);
	let elapsedTime = (new Date().getTime() - startTime) / 1E3;
	console.log(numberWithCommas(Math.round(globalRoot.totalTries / elapsedTime)) + ' simulations per second.');
}

function testExpansionConstants(c1, c2, numTrials, nT, output) {
	var v1 = v2 = 0;
	for (var I = 0; I < numTrials; I++) {
		over = -1;
		board = new Array(dimensions[0]);
		for (var i = 0; i < board.length; i++) {
			board[i] = new Array(dimensions[1]);
			for (var a = 0; a < board[i].length; a++)
				board[i][a] = 0;
		}

		redTurnGlobal = true;
		position = "";
		var r1 = createMCTSRoot(), r2 = createMCTSRoot();

		while (over < 0) {
			var r = (I % 2 === 0) === redTurnGlobal ? r1:r2;
			expansionConstant = (I % 2 === 0) === redTurnGlobal ? c1:c2;
			if (!r)
				r = createMCTSRoot();
			while (r.totalTries < nT) {
				for (var i = 0; i < 100; i++)
					r.chooseChild(position);
				var error = getCertainty(r);
				if (r.children.length < 2 || error < certaintyThreshold)
					break;
			}
			// r = (I % 2 === 0) === redTurnGlobal ? r1:r2;
			// if (r.totalTries === 0)
			// 	for (var i = 0; i < 5000; i++)
			// 		r.chooseChild();
			var bestChild = mostTriedChild(r, null);
			var bestCol = bestChild.lastMove;
			var bestRow = playMove(board, bestCol, redTurnGlobal);

			position += bestCol + 1;
			redTurnGlobal = !redTurnGlobal;

			over = gameOver(board, bestCol, bestRow);
			// console.log(over, (I % 2 === 0) === redTurnGlobal);

			// if (r1.children) {
			// 	for (var i = 0; i < r1.children.length; i++)
			// 		if (r1.children[i].lastMove == bestCol) {
			// 			r1 = r1.children[i];
			// 			console.log(r1);
			// 			break;
			// 		}
			// 	r1.parent = null;
			// } else r1 = createMCTSRoot();

			// if (r2.children) {
			// 	for (var i = 0; i < r2.children.length; i++)
			// 		if (r2.children[i].lastMove == bestCol) {
			// 			r2 = r2.children[i];
			// 			console.log(r2);
			// 			break;
			// 		}
			// 	r2.parent = null;
			// } else r2 = createMCTSRoot();
			nT *= 1.07;
			// console.log("next turn ", board, over, bestCol, bestRow);
		}
		switch (over) {
			case 0:
				if (output)
					console.log("tie");
				break;
			case 1:
				if (I % 2 === 0) {
					v1++;
					if (output)
						console.log("c1 wins");
				} else {
					v2++;
					if (output)
						console.log("c2 wins");
				}
				break;
			case 2:
				if (I % 2 === 0) {
					v2++;
					if (output)
						console.log("c2 wins");
				} else {
					v1++;
					if (output)
						console.log("c1 wins");
				}
				break;
		}
	}
	console.log(c1 + ": " + v1 + " and " + c2 + ": " + v2);
	return [v1, v2];
}

function findBestExpansionConstant(seed, nT, bound, numSimulations, prollyGreater) {
	console.log("!!!");
	console.log("Best constant: ", seed);
	console.log("Bound: ", bound);
	console.log("!!!");

	var delta1, delta2;

	var round1 = testExpansionConstants(seed, seed + prollyGreater ? bound:-bound, numSimulations, nT, true);
	if (round1[1] > round1[0])
		findBestExpansionConstant(prollyGreater ? bound:-bound, nT, bound / 2);
	else {
		delta1 = round1[0] - round1[1];
		var round2 = testExpansionConstants(seed, seed + prollyGreater ? -bound:bound, numSimulations, nT, false);
		if (round2[1] > round2[0])
			findBestExpansionConstant(seed + prollyGreater ? -bound:bound, nT, bound / 2, true);
		else {
			delta2 = round2[0] - round2[1];
			findBestExpansionConstant(seed, nT, bound / 2, numSimulations, delta1 < delta2 === prollyGreater);
		}
	}
}
