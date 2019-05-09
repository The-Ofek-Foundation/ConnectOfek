#ifndef CONNECTFOURUTILITIES_H
#define CONNECTFOURUTILITIES_H

namespace game_ai
{
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
