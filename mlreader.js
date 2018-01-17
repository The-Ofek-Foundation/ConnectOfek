var reader;

var mlstates;

function errorHandler(evt) {
	switch(evt.target.error.code) {
		case evt.target.error.NOT_FOUND_ERR:
			alert('File Not Found!');
			break;
		case evt.target.error.NOT_READABLE_ERR:
			alert('File is not readable');
			break;
		case evt.target.error.ABORT_ERR:
			break; // noop
		default:
			alert('An error occurred reading this file.');
	};
}

function handleFileSelect() {
	// Read in the image file as a binary string.

	reader = new FileReader();
	reader.readAsBinaryString(getElemId('ml-file').files[0]);

	reader.onloadend = function (e) {
		mlstates = new MlStates(reader.result.split('\n'));
	}
}


