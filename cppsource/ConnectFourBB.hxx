#ifndef CONNECTFOURBB_H
#define CONNECTFOURBB_H

#include "ConnectFourUtilities.hxx"

#include <array>
#include <iostream>
#include <vector>

namespace game_ai
{
	class ConnectFourBB
	{
	private:
		static const unsigned WIDTH = 7u;
		static const unsigned HEIGHT = 6u;

	public:
		ConnectFourBB();
		ConnectFourBB(ConnectFourBB&& board);

		ConnectFourBB& operator = (const ConnectFourBB& board);

		static const unsigned getWidth()
		{
			return WIDTH;
		}

		static const unsigned getHeight()
		{
			return HEIGHT;
		}

		Color getTurn() const
		{
			return turn;
		}

		// no bounds checking
		inline bool isLegal(unsigned col) const
		{
			return heights[col];
		}

		void playMove(unsigned col);
		void removeMove(unsigned col);

		bool gameNotTied() const
		{
			return numMovesLeft;
		}

		inline bool winningMovePossible() const
		{
			return numMovesLeft <= _maxMovesLeftForWinning;
		}

		bool isWinningMove(const unsigned col, const Color color) const;

		Color getColor(unsigned col, unsigned row) const;

		// for debugging purposes only
		void _setBoard(std::array<unsigned, WIDTH * HEIGHT>&& b);

	private:

		uint64_t redBoard, yellowBoard;
		std::vector<unsigned> heights;
		Color turn;
		unsigned numMovesLeft;


		// to be used by isWinningMove for optimization
		// if there are more than this amount of moves left,
		// it is not possible for the next move to be a win
		const unsigned _maxMovesLeftForWinning;
	};


	std::ostream &operator<<(std::ostream &os, ConnectFourBB const &board);
}

#endif
