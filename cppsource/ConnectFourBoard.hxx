#ifndef CONNECTFOURBOARD_H
#define CONNECTFOURBOARD_H

#include "ConnectFourUtilities.hxx"

#include <iostream>
#include <vector>

namespace game_ai
{
	class ConnectFourBoard
	{
	public:
		static const unsigned DEFAULT_WIDTH = 7u, DEFAULT_HEIGHT = 6u;


		ConnectFourBoard(unsigned width, unsigned height);
		ConnectFourBoard();
		ConnectFourBoard(ConnectFourBoard&& board);

		// to be used sparingly
		ConnectFourBoard& operator = (const ConnectFourBoard& board);

		const std::vector<std::vector<Color>>& getBoard() const
		{
			return board;
		}

		unsigned getWidth() const
		{
			return width;
		}

		unsigned getHeight() const
		{
			return height;
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

		bool isWinningMove(unsigned col, Color color) const;

	private:
		const unsigned width, height;
		std::vector<std::vector<Color>> board;
		std::vector<unsigned> heights;
		Color turn;
		unsigned numMovesLeft;


		// to be used by isWinningMove for optimization
		// if there are more than this amount of moves left,
		// it is not possible for the next move to be a win
		const unsigned _maxMovesLeftForWinning;
	};


	std::ostream &operator<<(std::ostream &os, ConnectFourBoard const &board);
}

#endif
