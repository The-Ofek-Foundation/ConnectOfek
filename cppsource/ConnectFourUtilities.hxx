#ifndef CONNECTFOURUTILITIES_H
#define CONNECTFOURUTILITIES_H

#include <cstdint>

namespace game_ai
{
	static const unsigned WIDTH = 7u;
	static const unsigned HEIGHT = 6u;

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

	static const unsigned COUNT_CONSECUTIVE_WIN_MASK = 0b00000000000000000000000111111000;
	static const unsigned COUNT_CONSECUTIVE_THREE = COUNT_CONSECUTIVE_WIN_MASK >> 1u;


	enum class Color
	{
		EMPTY = 0,
		RED,
		YELLOW,
		TIE
	};

	inline char getChar(Color c)
	{
		switch (c)
		{
			case Color::EMPTY:
				return ' ';
			case Color::RED:
				return 'R';
			case Color::YELLOW:
				return 'Y';
			default:
				return '?';
		}
	}

	inline Color otherTurn(Color c)
	{
		return c == Color::RED ? Color::YELLOW : Color::RED;
	}
}

#endif
