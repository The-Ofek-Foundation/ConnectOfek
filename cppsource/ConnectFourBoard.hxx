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

		// no bounds checking
		inline bool isLegal(unsigned col) const;

		void playMove(unsigned col);
		void removeMove(unsigned col);

		inline bool gameNotTied() const;
		bool gameWinningColor(unsigned col, Color color) const;

	private:
		unsigned width, height;
		std::vector<std::vector<Color>> board;
		std::vector<unsigned> heights;
		Color turn;
		unsigned numMovesLeft;
	};


	std::ostream &operator<<(std::ostream &os, ConnectFourBoard const &board);
}

#endif
