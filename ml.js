var mlmode = false;

class MlStates {

	constructor(lines) {
		// this.lines = lines;
		this.states = new Array(lines.length);
		for (var i = 0; i < this.states.length; i++)
			this.states[i] = this.getState(lines[i]);
			// this.lines[i] += '\n';
		console.log("Lines Parsed");
		mlmode = true;
	}

	incrementLines(position, result) {
		var p = "";
		var hash = [0, 0, 0, 0, 0, 0, 0];
		var height = [0, 0, 0, 0, 0, 0, 0];
		for (var i = 0; i < position.length; i++) {
			var char = position.charAt(i);
			p += char;
			var col = parseInt(char) - 1;
			hash[col] += (i % 2 + 1) * Math.pow(3, height[col]);
			height[col]++;
			var state = this.createState(hash);
			// var state = this.getState(this.lines[index]);
			state.results[result]++;
			// this.lines[index] = state.toString();
		}
	}

	createState(hash) {
		var min = 0, max = this.states.length, comparison, mid, state;
		while (min < max) {
			mid = parseInt((min + max) / 2);
			state = this.states[mid];
			comparison = compare(state, hash);
			if (comparison == 0)
				return state;
			else if (comparison > 0)
				max = mid;
			else min = mid + 1;
		}
		var newState = this.getState(hash.join(' ') + " 0 0 0");
		this.states.splice(min, 0, newState);
		return newState;
	}

	getState(line) {
		var vals = line.split(' ');
		var hash = new Array(7);
		for (var i = 0; i < hash.length; i++)
			hash[i] = parseInt(vals[i]);

		var ties = parseInt(vals[7]);
		var blacks = parseInt(vals[8]);
		var whites = parseInt(vals[9]);

		var ran = Math.random() * (ties + blacks + whites), result = -1;
		if (ran <= ties)
			result = 0;
		else if (ran <= blacks)
			result = 1;
		else result = 2;

		return new MlState(hash, [ties, blacks, whites], result);
	}

	getResult(board) {
		var hash = getHash(board);
		var min = 0, max = this.states.length, comparison, mid, state;
		while (min < max) {
			mid = parseInt((min + max) / 2);
			state = this.states[mid];
			comparison = compare(state, hash);
			if (comparison == 0)
				return state.result;
			else if (comparison > 0)
				max = mid;
			else min = mid + 1;
		}
		return -1;
	}

	saveToFile(fileName, callback) {
		let writeStream = fs.createWriteStream(fileName);

		console.log("Saving states...");

		for (var state of this.states)
			writeStream.write(state.toString() + '\n');

		// the finish event is emitted when all data has been flushed from the stream
		writeStream.on('finish', () => {
			console.log('Saved ' + this.states.length + " states.");
			callback();
		});

		// close the stream
		writeStream.end();
	}
}

class MlState {
	constructor(hash, results, result) {
		this.hash = hash;
		this.results = results;
		this.result = result;
	}

	toString() {
		return this.hash.join(' ') + ' ' + this.results.join(' ');
	}
}

function getHash(board) {
	var hash1 = new Array(7);
	var hash2 = new Array(7);
	for (var i = 0; i < board.length; i++) {
		hash1[i] = 0;
		for (var a = 0; a < board[0].length; a++)
			hash1[i] += board[i][a] * Math.pow(3, 5 - a);
	}

	for (var i = 0; i < hash1.length; i++)
		hash2[i] = hash1[6 - i];

	if (compareHashes(hash1, hash2) < 0)
		return hash1

	return hash2;
}

function compare(state, hash) {
	return compareHashes(state.hash, hash);
}

function compareHashes(hash1, hash2) {
	for (var i = 0; i < hash1.length; i++)
		if (hash1[i] != hash2[i])
			return hash1[i] - hash2[i];
	return 0;
}
