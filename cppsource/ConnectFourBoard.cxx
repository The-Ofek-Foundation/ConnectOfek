#include "ConnectFourBoard.hxx"
#include "ConnectFourUtilities.hxx"

#include <ostream>
#include <utility>

using namespace game_ai;

ConnectFourBoard::ConnectFourBoard(unsigned width, unsigned height)
	: width(width), height(height), board(width, std::vector<Color>(height, Color::EMPTY)),
	  heights(width, height), turn(Color::RED), numMovesLeft(width * height),
	  _maxMovesLeftForWinning(numMovesLeft - 5u)
{
}


ConnectFourBoard::ConnectFourBoard()
	: ConnectFourBoard(DEFAULT_WIDTH, DEFAULT_HEIGHT)
{
}

ConnectFourBoard::ConnectFourBoard(ConnectFourBoard&& board)
	: width(board.width), height(board.height), board(std::move(board.board)),
	  heights(std::move(board.heights)), turn(board.turn), numMovesLeft(board.numMovesLeft),
	  _maxMovesLeftForWinning(board._maxMovesLeftForWinning)
{
}

ConnectFourBoard& ConnectFourBoard::operator = (const ConnectFourBoard& that)
{
	for (unsigned col = 0u; col < width; ++col)
	{
		heights[col] = that.heights[col];

		for (unsigned row = 0u; row < height; ++row)
		{
			board[col][row] = that.board[col][row];
		}
	}

	turn = that.turn;
	numMovesLeft = that.numMovesLeft;

	return *this;
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

bool ConnectFourBoard::isWinningMove(const unsigned col, const Color color) const
{
	const unsigned row = heights[col] - 1u;
	unsigned countConsecutive = 1u;
	unsigned x, y;

	// check horizontal win
	for (x = col - 1u; x < width && board[x][row] == color; --x, ++countConsecutive);
	for (x = col + 1u; x < width && board[x][row] == color; ++x, ++countConsecutive);

	if (countConsecutive >= 4u)
	{
		return true;
	}

	countConsecutive = 1u;

	// check vertical win
	for (y = row + 1u; y < height && board[col][y] == color; ++y, ++countConsecutive);

	if (countConsecutive >= 4u)
	{
		return true;
	}

	countConsecutive = 1u;

	// check diagonal wins
	for (x = col - 1u, y = row - 1u; x < width && y < height && board[x][y] == color; --y, --x, ++countConsecutive);
	for (x = col + 1u, y = row + 1u; x < width && y < height && board[x][y] == color; ++y, ++x, ++countConsecutive);

	if (countConsecutive >= 4u)
	{
		return true;
	}

	countConsecutive = 1u;

	for (x = col - 1u, y = row + 1u; x < width && y < height && board[x][y] == color; ++y, --x, ++countConsecutive);
	for (x = col + 1u, y = row - 1u; x < width && y < height && board[x][y] == color; --y, ++x, ++countConsecutive);

	return countConsecutive >= 4u;
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

