#include "ConnectFourBoard.hxx"
#include "ConnectFourUtilities.hxx"

#include <iostream>
using namespace game_ai;


void playGame(Color aiTurn)
{
	ConnectFourBoard cfb;
	unsigned col;

	while (cfb.gameNotTied())
	{
		std::cout << cfb << "\nYour Move: ";
		std::cin >> col;

		if (cfb.isWinningMove(col, cfb.getTurn()))
		{
			cfb.playMove(col);
			break;
		}

		cfb.playMove(col);
	}

	std::cout << "Game Over!\n" << cfb << "\n";
}


int main()
{
	playGame(Color::EMPTY);

	// ConnectFourBoard cfb;

	// cfb.playMove(0u);
	// cfb.playMove(1u);
	// cfb.playMove(0u);
	// cfb.playMove(1u);
	// cfb.playMove(0u);
	// cfb.playMove(1u);
	// cfb.playMove(2u);
	// cfb.playMove(2u);
	// cfb.playMove(2u);
	// cfb.playMove(3u);ooo

	// cfb.playMove(0u);
	// cfb.playMove(3u);
	// cfb.playMove(5u);
	// cfb.removeMove(0u);

	// std::cout << cfb << std::endl;

	// std::cout << (int)cfb.isWinningMove(0u, Color::YELLOW) << std::endl;;
}
