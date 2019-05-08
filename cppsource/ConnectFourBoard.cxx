#include "ConnectFourBoard.hxx"
#include "ConnectFourUtilities.hxx"

#include <ostream>

using namespace game_ai;

ConnectFourBoard::ConnectFourBoard(unsigned width, unsigned height)
	: width(width), height(height), board(width, std::vector<Color>(height, Color::EMPTY)),
	  heights(width, height), turn(Color::RED), numMovesLeft(width * height)
{
}


ConnectFourBoard::ConnectFourBoard()
	: ConnectFourBoard(DEFAULT_WIDTH, DEFAULT_HEIGHT)
{
}

inline bool ConnectFourBoard::isLegal(unsigned col) const
{
	return heights[col];
}

void ConnectFourBoard::playMove(unsigned col)
{
	board[col][--heights[col]] = turn;
	turn = otherTurn(turn);
	--numMovesLeft;
}

void ConnectFourBoard::removeMove(unsigned col)
{
	board[col][heights[col]++] = Color::EMPTY;
	turn = otherTurn(turn);
	++numMovesLeft;
}

inline bool ConnectFourBoard::gameNotTied() const
{
	return numMovesLeft;
}

bool ConnectFourBoard::gameWinningColor(unsigned col, Color color) const
{
	unsigned row = heights[col] - 1u;
	unsigned countConsecutive = 1u;

	// check horizontal win
	for (unsigned x = col - 1u; x >= 0u && countConsecutive < 4u && board[x][row] == color; --x, ++countConsecutive);
	for (unsigned x = col + 1u; x < width && countConsecutive < 4u && board[x][row] == color; ++x, ++countConsecutive);

	if (countConsecutive == 4u)
	{
		return color;
	}

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


std::ostream & game_ai::operator<<(std::ostream &os, ConnectFourBoard const &board)
{
	for (unsigned row = 0u; row < board.getHeight(); ++row)
	{
		os << "|";

		for (unsigned col = 0u; col < board.getWidth(); ++col)
		{
			os << " " << getChar(board.getBoard()[col][row]);
		}

		os << " |\n";
	}


	os << "+";
	for (unsigned col = 0u; col < board.getWidth(); ++col)
	{
		os << "--";
	}
	os << "-+\n";

	os << " ";
	for (unsigned col = 0u; col < board.getWidth(); ++col)
	{
		os << " " << col % 10u;
	}
	os << "\n";

	return os;
}

