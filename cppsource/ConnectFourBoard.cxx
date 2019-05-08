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

bool ConnectFourBoard::isWinningMove(unsigned col, Color color) const
{
	unsigned row = heights[col] - 1u;
	unsigned countConsecutive = 1u;

	// check horizontal win
	for (unsigned x = col - 1u; x < width && countConsecutive < 4u && board[x][row] == color; --x, ++countConsecutive);
	for (unsigned x = col + 1u; x < width && countConsecutive < 4u && board[x][row] == color; ++x, ++countConsecutive);

	if (countConsecutive == 4u)
	{
		return true;
	}

	countConsecutive = 1u;

	// check vertical win
	for (unsigned y = row + 1u; y < height && countConsecutive < 4u && board[col][y] == color; ++y, ++countConsecutive);

	if (countConsecutive == 4u)
	{
		return true;
	}

	countConsecutive = 1u;

	// check diagonal wins
	for (unsigned x = col - 1u, y = row - 1u; x < width && y < height && countConsecutive < 4u && board[x][y] == color; --y, --x, ++countConsecutive);
	for (unsigned x = col + 1u, y = row + 1u; x < width && y < height && countConsecutive < 4u && board[x][y] == color; ++y, ++x, ++countConsecutive);

	if (countConsecutive == 4u)
	{
		return true;
	}

	countConsecutive = 1u;

	for (unsigned x = col - 1u, y = row + 1u; x < width && y < height && countConsecutive < 4u && board[x][y] == color; ++y, --x, ++countConsecutive);
	for (unsigned x = col + 1u, y = row - 1u; x < width && y < height && countConsecutive < 4u && board[x][y] == color; --y, ++x, ++countConsecutive);

	return countConsecutive == 4u;
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

