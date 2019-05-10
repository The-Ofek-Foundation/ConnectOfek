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
	static const uint64_t VERTICAL_STEP   = WIDTH,
	                      VERTICAL_STEPS  = 3uLL * VERTICAL_STEP,
	                      VERTICAL_STEPSS = 4uLL * VERTICAL_STEP;
	static const uint64_t HORIZONTAL_STEP   = 1uLL,
	                      HORIZONTAL_STEPS  = 4uLL * HORIZONTAL_STEP,
	                      HORIZONTAL_STEPSS = 5uLL * HORIZONTAL_STEP;
	static const uint64_t MAJOR_DIAG_STEP    = WIDTH + 1uLL,
	                      MAJOR_DIAG_STEPS   = 3uLL * MAJOR_DIAG_STEP,
	                      MAJOR_DIAG_STEPSS  = 4uLL * MAJOR_DIAG_STEP,
	                      MAJOR_DIAG_STEPSSS = 5uLL * MAJOR_DIAG_STEP;
	static const uint64_t MINOR_DIAG_STEP    = WIDTH - 1uLL,
	                      MINOR_DIAG_STEPS   = 3uLL * MINOR_DIAG_STEP,
	                      MINOR_DIAG_STEPSS  = 4uLL * MINOR_DIAG_STEP,
	                      MINOR_DIAG_STEPSSS = 5uLL * MINOR_DIAG_STEP;

	//                                                          654321065432106543210654321065432106543210
	//                                    0000000000000000000000000100000000000000000000000000000000000000
	//                                    0000000000000000000000000000000000000000000100000000000000000000
	//                                    0000000000000000000000000001000000000000000000000000000000000000
	//                                    0000000000000000000000000000000000000000000000000000000001000000
	static const uint64_t TOP_MASK =    0b0000000000000000000000000000011111111111111111111111111111111111;
	static const uint64_t BOTTOM_MASK = 0b0000000000000000000000111111111111111111111111111111111100000000;
	static const uint64_t LEFT_MASK   = 0b0000000000000000000000011111101111110111111011111101111110111111;
	static const uint64_t RIGHT_MASK  = 0b0000000000000000000000111111011111101111110111111011111101111110;
	static const uint64_t TOP_LEFT_MASK = TOP_MASK & LEFT_MASK;
	static const uint64_t BOTTOM_RIGHT_MASK = BOTTOM_MASK & RIGHT_MASK;
	static const uint64_t TOP_RIGHT_MASK = TOP_MASK & RIGHT_MASK;
	static const uint64_t BOTTOM_LEFT_MASK = BOTTOM_MASK & LEFT_MASK;

	uint64_t loc = 1uLL << ((heights[col] - 1u) * WIDTH + col), tmpLoc1, tmpLoc2;
	uint64_t board = (color == Color::RED ? redBoard : yellowBoard) | loc;

	// check vertical win
	for (tmpLoc1 = loc; TOP_MASK & tmpLoc1 && board & (tmpLoc1 <<= VERTICAL_STEP););

	if (tmpLoc1 >= loc << VERTICAL_STEPS && (board & tmpLoc1 || tmpLoc1 >= loc << VERTICAL_STEPSS))
	{
		return true;
	}

	// check horizontal win
	for (tmpLoc1 = loc; LEFT_MASK & tmpLoc1 && board & (tmpLoc1 <<= HORIZONTAL_STEP););
	for (tmpLoc2 = loc; RIGHT_MASK & tmpLoc2 && board & (tmpLoc2 >>= HORIZONTAL_STEP););

	if (tmpLoc1 >= tmpLoc2 << HORIZONTAL_STEPS && (board & tmpLoc1 || board & tmpLoc2 || tmpLoc1 >= tmpLoc2 << HORIZONTAL_STEPSS))
	{
		return true;
	}


	// check major (\) diagonal win
	for (tmpLoc1 = loc; TOP_LEFT_MASK & tmpLoc1 && board & (tmpLoc1 <<= MAJOR_DIAG_STEP););
	for (tmpLoc2 = loc; BOTTOM_RIGHT_MASK & tmpLoc2 && board & (tmpLoc2 >>= MAJOR_DIAG_STEP););

	// std::cout << "                      654321065432106543210654321065432106543210\n";
	// std::cout << std::bitset<64u>(loc) << "\n";
	// std::cout << std::bitset<64u>(tmpLoc1) << "\n";
	// std::cout << std::bitset<64u>(tmpLoc2) << "\n";


	if (tmpLoc1 >= tmpLoc2 << MAJOR_DIAG_STEPS && (((board & tmpLoc1) && board & tmpLoc2) || (
	    tmpLoc1 >= tmpLoc2 << MAJOR_DIAG_STEPSS && (board & tmpLoc1 || board & tmpLoc2 ||
	    tmpLoc1 >= tmpLoc2 << MAJOR_DIAG_STEPSSS))))
	{
		return true;
	}


	// check minor (/) diagonal win
	for (tmpLoc1 = loc; TOP_RIGHT_MASK & tmpLoc1 && board & (tmpLoc1 <<= MINOR_DIAG_STEP););
	for (; BOTTOM_LEFT_MASK & loc && board & (loc >>= MINOR_DIAG_STEP););


	return tmpLoc1 >= loc << MINOR_DIAG_STEPS && ((board & tmpLoc1 && board & loc) || (
	       tmpLoc1 >= loc << MINOR_DIAG_STEPSS && (board & tmpLoc1 || board & loc ||
	       tmpLoc1 >= loc << MINOR_DIAG_STEPSSS)));
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

void ConnectFourBB::_setBoard(std::array<unsigned, WIDTH * HEIGHT>&& b)
{
	for (unsigned offset = 0u; offset < b.size(); ++offset)
	{
		if (b[offset] == 0u)
		{
			redBoard &= ~(1uLL << offset);
			yellowBoard &= ~(1uLL << offset);
		}
		else if (b[offset] == 1u)
		{
			redBoard |= 1uLL << offset;
			yellowBoard &= ~(1uLL << offset);
		}
		else
		{
			redBoard &= ~(1uLL << offset);
			yellowBoard |= 1uLL << offset;
		}
	}

	for (unsigned col = 0u; col < WIDTH; ++col)
	{
		for (heights[col] = HEIGHT; redBoard & (1uLL << ((heights[col] - 1u) * WIDTH + col)) || yellowBoard & (1uLL << ((heights[col] - 1u) * WIDTH + col)); --heights[col]);
	}
}

