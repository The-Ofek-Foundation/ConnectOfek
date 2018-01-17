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
var aiIdGlobal = 0; // prevents multiple Mcts recursive functions simultaneously

var winHelperGlobal = new Array(4);
var board2dGlobal;

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
			globalRoot = createMctsRoot();
		var startTime = new Date().getTime();
		var tempCount = 0;
		while ((new Date().getTime() - startTime) < 30 && !stopChoose) {
			globalRoot.chooseChild(boardCopy(board), board2dCopy(board2dGlobal));
			tempCount++;
		}
		if (numChoose3 && globalRoot.totalTries > 2e6 && (tempCount < numChoose3 / 5 || tempCount < numChoose2 / 5 || tempCount < numChoose1 / 5))
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
	var range = getMctsDepthRange();

	analElem.innerHTML = "Analysis: Depth-" + range[1] + " Result-" +
		range[2] + " Certainty-" + (globalRoot && globalRoot.totalTries > 0 ?
		(resultCertainty(globalRoot) * 100).toFixed(0):"0") + "%";
	numTrialsElem.innerHTML = "Trials: " + numberWithCommas(globalRoot.totalTries);
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

	aiIdGlobal++;

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

	board2dGlobal = new Array(board.length);
	for (var i = 0; i < board2dGlobal.length; i++)
		board2dGlobal[i] = dimensions[1] - 1;

	winHelperGlobal = initWinHelper();

	redTurnGlobal = true;
	numChoose1 = numChoose2 = numChoose3 = lnc1 = lnc2 = lnc3 = stopChoose = false;
	position = "";

	saveSettingsCookie(cookieId);

	globalRoot = createMctsRoot();
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

	board2dGlobal = new Array(board.length);
	for (var i = 0; i < board2dGlobal.length; i++)
		board2dGlobal[i] = dimensions[1] - 1;

	winHelperGlobal = initWinHelper();

	redTurnGlobal = true;
	numChoose1 = numChoose2 = numChoose3 = lnc1 = lnc2 = lnc3 = stopChoose = false;
	position = pos;
	setupPosition(position);

	globalRoot = createMctsRoot();
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
			board2dGlobal[col]--;
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

function initWinHelper() {
	var winHelper = new Array(4); // Vertical, H, D1 /, D2 \

	winHelper[0] = new Array(dimensions[0]);
	for (var i = 0; i < winHelper[0].length; i++) {
		winHelper[0][i] = new Array(2);
		winHelper[0][i][0] = 0;
		winHelper[0][i][1] = 0;
	}

	winHelper[1] = new Array(dimensions[1]);
	for (var i = 0; i < winHelper[1].length; i++) {
		winHelper[1][i] = new Array(dimensions[0]);
		for (var a = 0; a < winHelper[1][i].length; a++) {
			winHelper[1][i][a] = new Array(2);
			winHelper[1][i][a][0] = 0;
			winHelper[1][i][a][1] = 0;
		}
	}

	var numDiagonals = 1 + (dimensions[0] - 4) + (dimensions[1] - 4);
	var maxDiagonal = Math.min(dimensions[0], dimensions[1]);

	winHelper[2] = new Array(numDiagonals);
	for (var i = 0; i < winHelper[2].length; i++) {
		var diagLength = Math.min(maxDiagonal,
			3 + Math.min(i + 1, numDiagonals - i));
		winHelper[2][i] = new Array(diagLength);
		for (var a = 0; a < winHelper[2][i].length; a++) {
			winHelper[2][i][a] = new Array(2);
			winHelper[2][i][a][0] = 0;
			winHelper[2][i][a][1] = 0;
		}
	}

	winHelper[3] = new Array(numDiagonals);
	for (var i = 0; i < winHelper[3].length; i++) {
		var diagLength = Math.min(maxDiagonal,
			3 + Math.min(i + 1, numDiagonals - i));
		winHelper[3][i] = new Array(diagLength);
		for (var a = 0; a < winHelper[3][i].length; a++) {
			winHelper[3][i][a] = new Array(2);
			winHelper[3][i][a][0] = 0;
			winHelper[3][i][a][1] = 0;
		}
	}

	return winHelper;
}

function updateWinHelper(winHelper, row, col, color) {

	row = dimensions[1] - row - 1;

	// Vertical
	if (winHelper[0][col][1] === color) {
		winHelper[0][col][0]++;
		if (winHelper[0][col][0] === 4)
			return true;
	} else {
		winHelper[0][col][0] = 1;
		winHelper[0][col][1] = color;
	}

	var countLeft, countRight, i, changed;

	// Horizontal

	winHelper[1][row][col][0] = 1;
	winHelper[1][row][col][1] = color;
	countLeft = countRight = 0;
	changed = false;

	if (col !== dimensions[0] - 1
		&& winHelper[1][row][col + 1][1] === color) {

		countRight = winHelper[1][row][col + 1][0];
		changed = true;
	}

	if (col !== 0 && winHelper[1][row][col - 1][1] === color) {
		countLeft = winHelper[1][row][col - 1][0];
		changed = true;
	}

	if (changed) {
		if (countRight + countLeft + 1 >= 4) return true;

		winHelper[1][row][col - countLeft][0]
			= winHelper[1][row][col + countRight][0]
			= countRight + countLeft + 1;
	}

	var diagNum, diagIndex, maxDiags = Math.min(dimensions[0], dimensions[1]);

	// Diagonal 1 / (diagNum)
	diagNum = dimensions[1] - 4 + col - row;

	if (diagNum < maxDiags && diagNum >= 0) {
		diagIndex = Math.min(row, col);

		winHelper[2][diagNum][diagIndex][0] = 1;
		winHelper[2][diagNum][diagIndex][1] = color;
		countLeft = countRight = 0;
		changed = false;

		if (col !== dimensions[0] - 1 && row !== dimensions[1] - 1
			&& winHelper[2][diagNum][diagIndex + 1][1] === color) {

			countRight = winHelper[2][diagNum][diagIndex + 1][0];
			changed = true;
		}

		if (col !== 0 && row !== 0
			&& winHelper[2][diagNum][diagIndex - 1][1] === color) {

			countLeft = winHelper[2][diagNum][diagIndex - 1][0];
			changed = true;
		}

		if (changed) {
			if (countRight + countLeft + 1 >= 4) return true;

			winHelper[2][diagNum][diagIndex - countLeft][0]
				= winHelper[2][diagNum][diagIndex + countRight][0]
				= countRight + countLeft + 1;
		}
	}

	// Diagonal 2 \ (diagNum)
	diagNum = dimensions[1] - 4 + (dimensions[0] - col - 1) - row;

	if (diagNum < maxDiags && diagNum >= 0) {
		diagIndex = Math.min(row, dimensions[0] - col - 1);

		winHelper[3][diagNum][diagIndex][0] = 1;
		winHelper[3][diagNum][diagIndex][1] = color;
		countLeft = countRight = 0;
		changed = false;

		if (col !== 0 && row !== dimensions[1] - 1
			&& winHelper[3][diagNum][diagIndex + 1][1] === color) {

			countRight = winHelper[3][diagNum][diagIndex + 1][0];
			changed = true;
		}

		if (col !== dimensions[0] - 1 && row !== 0
			&& winHelper[3][diagNum][diagIndex - 1][1] === color) {

			countLeft = winHelper[3][diagNum][diagIndex - 1][0];
			changed = true;
		}

		if (changed) {
			if (countRight + countLeft + 1 >= 4) return true;

			winHelper[3][diagNum][diagIndex - countLeft][0]
				= winHelper[3][diagNum][diagIndex + countRight][0]
				= countRight + countLeft + 1;
		}
	}

	return false;
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

	globalRoot = MctsGetNextRoot(col);
	if (globalRoot)
		globalRoot.parent = null;
	else globalRoot = createMctsRoot();
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

function playMoveGlobal(tboard, col, turn, winHelper, b2d) {
	var color = turn ? 1:2;
	tboard[col][b2d[col]] = color;
	return updateWinHelper(winHelper, b2d[col]--, col, color);
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
	var gOver = playMoveGlobal(board, col, redTurnGlobal,
		winHelperGlobal, board2dGlobal);

	setTurn(!redTurnGlobal, col, board2dGlobal[col] + 1);
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

function getWinningMove(tboard, b2d, turn) {
	for (var col = 0; col < tboard.length; col++) {
		if (b2d[col] === -1)
			continue;
		if (gameOverColor(tboard, col, b2d[col], turn ? 1:2) !== -1)
			return col;
	}
	return -1;
}

function cGetWinningMove(tboard, b2d, turn) {
	var color = turn ? 1:2, c = 0;
	for (var col = 0; col < tboard.length; col++) {
		if (b2d[col] === -1)
			continue;
		c++;
		if (gameOverColor(tboard, col, b2d[col], color) != -1)
			return [col, b2d[col]];
	}
	return [false, c];
}
function aGetWinningMove(tboard, b2d, turn, c) {
	var color = turn ? 1:2, a = new Array(c);
	for (var col = 0; col < tboard.length; col++) {
		if (b2d[col] === -1)
			continue;
		a[--c] = col + 1;
		if (gameOverColor(tboard, col, b2d[col], color) != -1)
			return [col, b2d[col]];
	}
	return [false, a];
}

function gameTied(b2d) {
	for (var i = 0; i < b2d.length; i++)
		if (b2d[i] !== -1)
			return false;
	return true;
}

function gameMiddle(b2d) {
	for (var i = 0; i < b2d.length; i++)
		if (i !== (dimensions[0] / 2 | 0) && b2d[i] !== dimensions[1] - 1)
			return false;
	return true;
}

function MctsGetChildren(father, tboard, b2d) {

	// win[1] stores all possible moves

	var win = cGetWinningMove(tboard, b2d, father.turn);
	if (win[1] === 0) { // Game tied
		father.gameOver = -2;
		return [];
	}

	if (win[0] === false)
		win = aGetWinningMove(tboard, b2d, !father.turn, win[1]);
	else {
		father.gameOver = win[0];
		return [];
	}
	if (win[0] !== false)
		return [new MctsNode(!father.turn, father, win[0])];

	if (gameMiddle(b2d)) {
		var children;
		if (b2d[dimensions[0] / 2 | 0] === -1)
			children = new Array(dimensions[0] / 2 | 0);
		else if ((b2d[dimensions[0] / 2 | 0] === dimensions[1] - 1
			|| b2d[dimensions[0] / 2 | 0] === dimensions[1] - 5)
			&& monteCarloTrials > 1000)
			return [
				new MctsNode(!father.turn, father, dimensions[0] / 2 | 0),
				new MctsNode(!father.turn, father, 0),
			];
		else children = new Array(1 + dimensions[0] / 2 | 0);
		for (var i = 0; i < children.length; i++)
			children[i] = new MctsNode(!father.turn, father, i);
		return children;
	}

	var i = 0;
	var children = new Array(win[1].length);
	for (i = 0; i < win[1].length; i++)
		children[i] = new MctsNode(!father.turn, father, win[1][i] - 1);

	return children;
}

function ib (b1, b2) {
	for (var i = 0; i < b1.length; i++)
		if (+b1.charAt(i) != +b2.charAt(i) && +b1.charAt(i) != dimensions[0] - +b2.charAt(i))
			return false;
	return true;
}

var MctsSimulate;

function MctsDumbSimulate(father, tboard, b2d, gTurn) {
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

function MctsSimulateSmart(father, tboard, b2d, gTurn) {

	if (mlmode && dimensions[0] === 7 && dimensions[1] === 6) {
		var mlresult = mlstates.getResult(tboard);

		if (mlresult != -1)
			if (mlresult === 0)
				return 0;
			else return mlresult == (gTurn ? 1:2) ? 1:-1;
	}


	var turn = gTurn, done = -1;
	var row, col;

	var colsLeft = 0;
	for (var i = 0; i < b2d.length; i++)
		if (b2d[i] !== -1)
			colsLeft++;
	if (colsLeft === 0) {
		father.gameOver = -2;
		return 0;
	}

	while (done === -1) {
		col = getWinningMove(tboard, b2d, turn);
		if (col === -1)
			col = getWinningMove(tboard, b2d, !turn);
		else {
			done = turn ? 1:2;
			break;
		}

		if (col === -1)
			do {
				col = Math.random() * tboard.length | 0;
			}	while (b2d[col] === -1);

		tboard[col][b2d[col]] = turn ? 1:2;
		b2d[col]--;

		if (b2d[col] === -1) {
			colsLeft--;
			if (colsLeft === 0)
				return 0;
		}

		turn = !turn;
	}

	return done == (gTurn ? 1:2) ? 1:-1;
}

function createMctsRoot() {
	MctsSimulate = smartSimulation ? MctsSimulateSmart:MctsDumbSimulate;
	return new MctsNode(redTurnGlobal, null, -1);
}

function MctsGetNextRoot(col) {
	if (!globalRoot || !globalRoot.children)
		return null;
	for (var i = 0; i < globalRoot.children.length; i++)
		if (globalRoot.children[i].lastMove == col) {
			return globalRoot.children[i];
		}
	return null;
}

function runMcts(times, threshold, callback, aiId) {
	if (!globalRoot)
		globalRoot = createMctsRoot();
	runMctsRecursive(times, threshold, callback, 0, aiId);
}

function runMctsRecursive(times, threshold, callback, count, aiId) {
	if (aiId !== aiIdGlobal)
		return;
	var startTime = new Date().getTime();
	var initTimes = times;
	if (times === 0 && globalRoot.totalTries < 5E3)
		while (globalRoot.totalTries < 5E3)
			globalRoot.chooseChild(boardCopy(board), board2dCopy(board2dGlobal));
	while (times > 0 && (new Date().getTime() - startTime) < 100) {
		globalRoot.chooseChild(boardCopy(board), board2dCopy(board2dGlobal));
		times--;
	}
	if (count % 20 === 0) {
		if (globalRoot.children.length === 0) {
			if (aiId === aiIdGlobal)
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
	if (aiStopped || times <= 0 || stopChoose) {
		if (aiId === aiIdGlobal)
			callback();
	} else if (lnc3 && globalRoot.totalTries > 2e6 && (initTimes - times < lnc3 / 5 || initTimes - times < lnc2 / 5 || initTimes - times < lnc1 / 5)) {
		if (aiId === aiIdGlobal)
			callback();
	} else {
		lnc3 = lnc2;
		lnc2 = lnc1;
		lnc1 = initTimes - times;
		setTimeout(function() {
			runMctsRecursive(times, threshold, callback, ++count, aiId);
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

function getMctsDepthRange() {
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

function getBestMoveMcts() {
	var bestChild = mostTriedChild(globalRoot, null);
	if (!bestChild)
		return globalRoot.gameOver;
	return bestChild.lastMove;
}

function playAiMove() {
	aiStopped = false;
	if (!globalRoot || certaintyThreshold < 1 && !(globalRoot.children && globalRoot.children.length == 1))
		runMcts(monteCarloTrials - globalRoot.totalTries / 2, certaintyThreshold, fpaim, aiIdGlobal);
	else fpaim();
}

function fpaim() {
	aiIdGlobal++;
	var bestCol = getBestMoveMcts();
	var gOver = playMoveGlobal(board, bestCol, redTurnGlobal,
		winHelperGlobal, board2dGlobal);
	setTurn(!redTurnGlobal, bestCol, board2dGlobal[bestCol] + 1);
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
			settings['monteCarloTrials'] = 7;
			settings['expansionConstant'] = 2;
			settings['certaintyThreshold'] = 0.1;
			settings['ponder'] = false;
			settings['increasingFactor'] = 1.8;
			break;
		case "hard":
			settings['smartSimulation'] = true;
			settings['monteCarloTrials'] = 5000;
			settings['expansionConstant'] = 1.75;
			settings['certaintyThreshold'] = 0.1;
			settings['ponder'] = true;
			settings['increasingFactor'] = 1.07;
			break;
		case "very hard":
			settings['smartSimulation'] = true;
			settings['monteCarloTrials'] = 10000;
			settings['expansionConstant'] = 1.75;
			settings['certaintyThreshold'] = 0.01;
			settings['ponder'] = true;
			settings['increasingFactor'] = 1.07;
			break;
		case "good luck":
			settings['smartSimulation'] = true;
			settings['monteCarloTrials'] = 200000;
			settings['expansionConstant'] = 1.8125;
			// bound: 0.03125
			settings['certaintyThreshold'] = 0.001;
			settings['ponder'] = true;
			settings['increasingFactor'] = 1.07;
			break;
		case "can't win them all":
			settings['smartSimulation'] = true;
			settings['monteCarloTrials'] = 1000000;
			settings['expansionConstant'] = 3;
			settings['certaintyThreshold'] = 0.0001;
			settings['ponder'] = true;
			settings['increasingFactor'] = 1.07;
			break;
		case "wreckage":
			settings['smartSimulation'] = true;
			settings['monteCarloTrials'] = 5000000;
			settings['expansionConstant'] = 5;
			settings['certaintyThreshold'] = 0.0001;
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
	stopPonder();
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

class MctsNode {
	constructor(turn, parent, lastMove) {
		this.turn = turn;
		this.parent = parent;
		this.lastMove = lastMove;
		this.hits = 0;
		this.misses = 0;
		this.totalTries = 0;
		this.countUnexplored = 0;
		this.gameOver = -1;
	}

	chooseChild(tboard, b2d) {
		if (this.lastMove !== -1)
			tboard[this.lastMove][b2d[this.lastMove]--]
				= !this.turn ? 1:2;
		if (typeof this.children === 'undefined') {
			this.children = MctsGetChildren(this, tboard, b2d);
			if (typeof this.children !== 'undefined')
				this.countUnexplored = this.children.length;
		}
		if (this.gameOver !== -1) // next move wins
			this.backPropogate(this.gameOver === -2 ? 0:1);
		else {
			var i, unexplored = this.countUnexplored;

			if (unexplored > 0) {
				this.countUnexplored--;
				var ran = Math.floor(Math.random() * unexplored);
				for (i = 0; i < this.children.length; i++)
					if (this.children[i].totalTries === 0) {
						if (ran === 0) {
							tboard[this.children[i].lastMove][b2d[this.children[i].lastMove]--]
								= this.turn ? 1:2;
							this.children[i].runSimulation(tboard, b2d);
							return;
						}
						ran--;
					}
			} else {
				var lt = Math.log(this.totalTries);
				var bestChild = this.children[0], bestPotential = MctsChildPotential(this.children[0], lt), potential;
				for (i = 1; i < this.children.length; i++) {
					potential = MctsChildPotential(this.children[i], lt);
					if (potential > bestPotential) {
						bestPotential = potential;
						bestChild = this.children[i];
					}
				}
				bestChild.chooseChild(tboard, b2d);
			}
		}
	}

	runSimulation(tboard, b2d) {
		this.backPropogate(MctsSimulate(this, tboard, b2d, this.turn));
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

function MctsChildPotential(child, lt) {
	var w = child.misses - child.hits;
	var n = child.totalTries;
	var c = expansionConstant;

	return w / n + c * Math.sqrt(lt / n);
}

function efficiencyTest() {
	globalRoot = createMctsRoot();
	var totalTrials, start = new Date().getTime();
	for (totalTrials = 0; totalTrials < 100000; totalTrials++)
		globalRoot.chooseChild(boardCopy(board), board2dCopy(board2dGlobal));
	console.log((new Date().getTime() - start) / 1E3);
	setInterval(function() {
		for (var i = 0; i < 1000; i++)
			globalRoot.chooseChild(boardCopy(board), board2dCopy(board2dGlobal));
		numTrialsElem.innerHTML = globalRoot.totalTries;
	}, 1);
}

function speedTest(totalTrials) {
	totalTrials = totalTrials || 5E5;
	globalRoot = createMctsRoot();
	let startTime = new Date().getTime();
	while (globalRoot.totalTries < totalTrials)
		globalRoot.chooseChild(boardCopy(board), board2dCopy(board2dGlobal));
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
		var r1 = createMctsRoot(), r2 = createMctsRoot();

		while (over < 0) {
			var r = (I % 2 === 0) === redTurnGlobal ? r1:r2;
			expansionConstant = (I % 2 === 0) === redTurnGlobal ? c1:c2;
			if (!r)
				r = createMctsRoot();
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
			// } else r1 = createMctsRoot();

			// if (r2.children) {
			// 	for (var i = 0; i < r2.children.length; i++)
			// 		if (r2.children[i].lastMove == bestCol) {
			// 			r2 = r2.children[i];
			// 			console.log(r2);
			// 			break;
			// 		}
			// 	r2.parent = null;
			// } else r2 = createMctsRoot();
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

function board2dCopy(b2d) {
	newB2d = new Array(b2d.length);
	for (var i = 0; i < b2d.length; i++)
		newB2d[i] = b2d[i];
	return newB2d;
}

function boardCopy(tboard) {
	var newBoard = new Array(tboard.length);
	for (var i = 0; i < tboard.length; i++) {
		newBoard[i] = new Array(tboard[i].length);
		for (var a = 0; a < tboard[i].length; a++)
			newBoard[i][a] = tboard[i][a];
	}
	return newBoard;
}

function showMlInfoModal() {
	showInfoModal("Connect Four 'Ml' Info",
		"The Connect Four ai is now compatible with a form of pseudo-'machine-learning' data set in order to improve its performance.",
		"Note that while the ai plays considerably better with the data set, it is not necessary for sufficiently challenging gameplay.",
		"If you want the latest data, you can download it from <a href='https://github.com/The-Ofek-Foundation/ConnectFourMl/blob/master/v1.c4states' target='_blank'>here</a>.",
		"If you want to train the data set yourself, and potentially create a much stronger opponent, please contain me at: <a href='mailto:ofek@theofekfoundation.org' target='_blank'>ofek@theofekfoundation.org</a>",
		"Note that the ai will only use this data if the board is 7x6 (standard dimensions), and if it isn't in the lowest difficulties.",
	);
}
