#include "ConnectFourBB.hxx"
#include "ConnectFourUtilities.hxx"

#include <bitset>
#include <ostream>
#include <utility>

using namespace game_ai;

ConnectFourBB::ConnectFourBB()
	: redBoard(0uLL), yellowBoard(0uLL),
	  heights(WIDTH, HEIGHT), turn(Color::RED), numMovesLeft(WIDTH * HEIGHT),
	  _maxMovesLeftForWinning(numMovesLeft - 5u)
{
}

ConnectFourBB::ConnectFourBB(ConnectFourBB&& board)
	: redBoard(board.redBoard), yellowBoard(board.yellowBoard),
	  heights(std::move(board.heights)), turn(board.turn), numMovesLeft(board.numMovesLeft),
	  _maxMovesLeftForWinning(board._maxMovesLeftForWinning)
{
}

ConnectFourBB& ConnectFourBB::operator = (const ConnectFourBB& that)
{
	for (unsigned col = 0u; col < WIDTH; ++col)
	{
		heights[col] = that.heights[col];
	}

	redBoard = that.redBoard;
	yellowBoard = that.yellowBoard;
	turn = that.turn;
	numMovesLeft = that.numMovesLeft;

	return *this;
}

void ConnectFourBB::playMove(unsigned col)
{
	if (turn == Color::RED)
	{
		redBoard |= 1uLL << (--heights[col] * WIDTH + col);
		turn = Color::YELLOW;
	}
	else
	{
		yellowBoard |= 1uLL << (--heights[col] * WIDTH + col);
		turn = Color::RED;
	}

	--numMovesLeft;
}

void ConnectFourBB::removeMove(unsigned col)
{
	if (turn == Color::RED)
	{
		yellowBoard &= ~(1uLL << (heights[col]++ * WIDTH + col));
		turn = Color::YELLOW;
	}
	else
	{
		redBoard &= ~(1uLL << (heights[col]++ * WIDTH + col));
		turn = Color::RED;
	}

	++numMovesLeft;
}

bool ConnectFourBB::isWinningMove(const unsigned col, const Color color) const
{
	static const uint64_t VERTICAL_STEP = WIDTH;
	static const uint64_t HORIZONTAL_STEP = 1uLL;
	static const uint64_t MAJOR_DIAG_STEP = WIDTH + 1uLL;
	static const uint64_t MINOR_DIAG_STEP = WIDTH - 1uLL;

	//                                                          654321065432106543210654321065432106543210
	static const uint64_t TOP_MASK =    0b0000000000000000000000000000011111111111111111111111111111111111;
	static const uint64_t BOTTOM_MASK = 0b0000000000000000000000111111111111111111111111111111111100000000;
	static const uint64_t LEFT_MASK   = 0b0000000000000000000000011111101111110111111011111101111110111111;
	static const uint64_t RIGHT_MASK  = 0b0000000000000000000000111111011111101111110111111011111101111110;
	static const uint64_t TOP_LEFT_MASK = TOP_MASK & LEFT_MASK;
	static const uint64_t BOTTOM_RIGHT_MASK = BOTTOM_MASK & RIGHT_MASK;
	static const uint64_t TOP_RIGHT_MASK = TOP_MASK & RIGHT_MASK;
	static const uint64_t BOTTOM_LEFT_MASK = BOTTOM_MASK & LEFT_MASK;

	uint64_t board = color == Color::RED ? redBoard : yellowBoard;
	uint64_t loc = 1uLL << ((heights[col] - 1u) * WIDTH + col), tmpLoc;

	unsigned countConsecutive = 1u;

	// check vertical win
	for (tmpLoc = loc; TOP_MASK & tmpLoc && board & (tmpLoc <<= VERTICAL_STEP); ++countConsecutive);

	if (countConsecutive >= 4u)
	{
		return true;
	}

	countConsecutive = 1u;

	// check horizontal win
	for (tmpLoc = loc; LEFT_MASK & tmpLoc && board & (tmpLoc <<= HORIZONTAL_STEP); ++countConsecutive);
	for (tmpLoc = loc; RIGHT_MASK & tmpLoc && board & (tmpLoc >>= HORIZONTAL_STEP); ++countConsecutive);

	if (countConsecutive >= 4u)
	{
		return true;
	}

	countConsecutive = 1u;

	// check major (\) diagonal win
	for (tmpLoc = loc; TOP_LEFT_MASK & tmpLoc && board & (tmpLoc <<= MAJOR_DIAG_STEP); ++countConsecutive);
	for (tmpLoc = loc; BOTTOM_RIGHT_MASK & tmpLoc && board & (tmpLoc >>= MAJOR_DIAG_STEP); ++countConsecutive);

	if (countConsecutive >= 4u)
	{
		return true;
	}

	countConsecutive = 1u;

	// check minor (/) diagonal win
	for (tmpLoc = loc; TOP_RIGHT_MASK & tmpLoc && board & (tmpLoc <<= MINOR_DIAG_STEP); ++countConsecutive);
	for (; BOTTOM_LEFT_MASK & loc && board & (loc >>= MINOR_DIAG_STEP); ++countConsecutive);

	return countConsecutive >= 4u;
}

Color ConnectFourBB::getColor(unsigned col, unsigned row) const
{
	uint64_t loc = 1uLL << (row * WIDTH + col);

	if (redBoard & loc)
	{
		return Color::RED;
	}

	if (yellowBoard & loc)
	{
		return Color::YELLOW;
	}

	return Color::EMPTY;
}


std::ostream & game_ai::operator<<(std::ostream &os, ConnectFourBB const &board)
{
	for (unsigned row = 0u; row < board.getHeight(); ++row)
	{
		os << "|";

		for (unsigned col = 0u; col < board.getWidth(); ++col)
		{
			os << " " << getChar(board.getColor(col, row));
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
