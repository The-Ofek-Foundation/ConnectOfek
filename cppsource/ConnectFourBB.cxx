#include "ConnectFourBB.hxx"
#include "ConnectFourUtilities.hxx"

#include <bitset>
#include <ostream>
#include <utility>

using namespace game_ai;

ConnectFourBB::ConnectFourBB()
	: redBoard(0uLL), yellowBoard(0uLL),
	  heights(WIDTH, HEIGHT), turn(Color::RED), numMovesLeft(WIDTH * HEIGHT),
	  redWins(0uLL), yellowWins(0uLL), redWinCol(-1u), yellowWinCol(-1u),
	  _maxMovesLeftForWinning(numMovesLeft - 5u)
{
}

ConnectFourBB::ConnectFourBB(ConnectFourBB&& board)
	: redBoard(board.redBoard), yellowBoard(board.yellowBoard),
	  heights(std::move(board.heights)), turn(board.turn), numMovesLeft(board.numMovesLeft),
	  redWins(board.redWins), yellowWins(board.yellowWins), redWinCol(board.redWinCol), yellowWinCol(board.yellowWinCol),
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
	redWins = that.redWins;
	yellowWins = that.yellowWins;
	redWinCol = that.redWinCol;
	yellowWinCol = that.yellowWinCol;


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

namespace
{
	inline void checkWins(const uint64_t& loc, uint64_t * board, const uint64_t& otherBoard,
	                      uint64_t * boardWins, const uint64_t& maskLeft, const uint64_t& maskRight,
	                      const unsigned& step)
	{
		unsigned countConsecutive = 1u, afterEmptyLeft = 0u, afterEmptyRight = 0u;
		bool sawEmpty = false;
		uint64_t tLoc1 = loc, tLoc2 = loc;
		uint64_t emptyLeft = 0u, emptyRight = 0u;

		while (maskLeft & tLoc1)
		{
			tLoc1 <<= step;

			if (*board & tLoc1) // sweet, our color
			{
				if (sawEmpty)
				{
					++afterEmptyLeft;
				}
				else
				{
					++countConsecutive;
				}
				continue;
			}

			if (sawEmpty || otherBoard & tLoc1)
			{
				break;
			}

			sawEmpty = true;
			emptyLeft = tLoc1;
		}

		sawEmpty = false;

		while (maskRight & tLoc2)
		{
			tLoc2 >>= step;

			if (*board & tLoc2) // sweet, our color
			{
				if (sawEmpty)
				{
					++afterEmptyRight;
				}
				else
				{
					++countConsecutive;
				}
				continue;
			}

			if (sawEmpty || otherBoard & tLoc2)
			{
				break;
			}

			sawEmpty = true;
			emptyRight = tLoc2;
		}

		if (countConsecutive + afterEmptyLeft >= 3u)
		{
			*boardWins |= emptyLeft ? emptyLeft : tLoc1;
		}

		if (countConsecutive + afterEmptyRight >= 3u)
		{
			*boardWins |= emptyRight ? emptyRight : tLoc2;
		}
	}
}

void ConnectFourBB::playMoveAndCheckWin(unsigned col)
{
	uint64_t loc, *board, otherBoard, *boardWins;

	--numMovesLeft;

	if (turn == Color::RED)
	{
		board = &(redBoard |= (loc = 1uLL << (--heights[col] * WIDTH + col)));
		turn = Color::YELLOW;

		if (yellowWins & (loc >> VERTICAL_STEP))
		{
			yellowWinCol = col;
			return;
		}

		boardWins = &redWins;
		otherBoard = yellowBoard;
	}
	else
	{
		board = &(yellowBoard |= (loc = 1uLL << (--heights[col] * WIDTH + col)));
		turn = Color::RED;

		if (redWins & (loc >> VERTICAL_STEP))
		{
			redWinCol = col;
			return;
		}

		boardWins = &yellowWins;
		otherBoard = redBoard;
	}

	unsigned countConsecutive = 1u;

	// check vertical win
	for (uint64_t tmpLoc = loc; TOP_MASK & tmpLoc && *board & (tmpLoc <<= VERTICAL_STEP); ++countConsecutive);

	if (countConsecutive == 3u)
	{
		*boardWins |= loc >> VERTICAL_STEP;
	}

	checkWins(loc, board, otherBoard, boardWins, LEFT_MASK, RIGHT_MASK, HORIZONTAL_STEP);
	checkWins(loc, board, otherBoard, boardWins, TOP_LEFT_MASK, BOTTOM_RIGHT_MASK, MAJOR_DIAG_STEP);
	checkWins(loc, board, otherBoard, boardWins, TOP_RIGHT_MASK, BOTTOM_LEFT_MASK, MINOR_DIAG_STEP);

	// std::cout << std::bitset<64u>(*boardWins) << "\n";
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
	uint64_t board = color == Color::RED ? redBoard : yellowBoard;
	uint64_t loc = 1uLL << ((heights[col] - 1u) * WIDTH + col), tmpLoc;

	unsigned countConsecutive = 1u;

	// check vertical win
	for (tmpLoc = loc; TOP_MASK & tmpLoc && board & (tmpLoc <<= VERTICAL_STEP); countConsecutive <<= 1u);

	if (countConsecutive & COUNT_CONSECUTIVE_WIN_MASK)
	{
		return true;
	}

	countConsecutive = 1u;

	// check horizontal win
	for (tmpLoc = loc; LEFT_MASK & tmpLoc && board & (tmpLoc <<= HORIZONTAL_STEP); countConsecutive <<= 1u);
	for (tmpLoc = loc; RIGHT_MASK & tmpLoc && board & (tmpLoc >>= HORIZONTAL_STEP); countConsecutive <<= 1u);

	if (countConsecutive & COUNT_CONSECUTIVE_WIN_MASK)
	{
		return true;
	}

	countConsecutive = 1u;

	// check major (\) diagonal win
	for (tmpLoc = loc; TOP_LEFT_MASK & tmpLoc && board & (tmpLoc <<= MAJOR_DIAG_STEP); countConsecutive <<= 1u);
	for (tmpLoc = loc; BOTTOM_RIGHT_MASK & tmpLoc && board & (tmpLoc >>= MAJOR_DIAG_STEP); countConsecutive <<= 1u);

	if (countConsecutive & COUNT_CONSECUTIVE_WIN_MASK)
	{
		return true;
	}

	countConsecutive = 1u;

	// check minor (/) diagonal win
	for (tmpLoc = loc; TOP_RIGHT_MASK & tmpLoc && board & (tmpLoc <<= MINOR_DIAG_STEP); countConsecutive <<= 1u);
	for (; BOTTOM_LEFT_MASK & loc && board & (loc >>= MINOR_DIAG_STEP); countConsecutive <<= 1u);

	return countConsecutive & COUNT_CONSECUTIVE_WIN_MASK;
}

bool ConnectFourBB::isWinningMoveUsingCheck(const unsigned col, const Color color) const
{
	return (color == Color::RED ? redWins : yellowWins) & (1uLL << ((heights[col] - 1u) * WIDTH + col));
}

unsigned ConnectFourBB::getWinningCol(const Color color) const
{
	return color == Color::RED ? redWinCol : yellowWinCol;
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

