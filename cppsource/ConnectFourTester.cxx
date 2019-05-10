#include "ConnectFourBoard.hxx"
#include "ConnectFourMcts.hxx"
#include "ConnectFourNode.hxx"
#include "ConnectFourUtilities.hxx"

#include <iostream>
#include <cstdio>

#include <ctime> // comment out

using namespace game_ai;


void playGame(Color aiTurn)
{
	ConnectFourMcts cfm{ConnectFourBoard()};
	cfm.runTrials(1000000u); return;
	unsigned col;

	while (cfm.getBoard().gameNotTied())
	{
		std::clock_t startTime = std::clock();
		cfm.runTrials(1000000u);
		std::cout << (std::clock() - startTime) * 1.0 / CLOCKS_PER_SEC << std::endl;
		const ConnectFourNode* bestChild = cfm.getNode().getBestChild();

		printf("The AI thinks that %d is the best move, after %d trials.\n\n",
			bestChild->getLastMove(), cfm.getNode().getTotalTrials());


		std::cout << cfm.getBoard() << "\nYour Move: ";
		std::cin >> col;

		if (cfm.getBoard().isWinningMove(col, cfm.getBoard().getTurn()))
		{
			cfm.playMove(col);
			break;
		}

		cfm.playMove(col);
	}

	std::cout << "Game Over!\n" << cfm.getBoard() << "\n";
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
	// // cfb.playMove(1u);
	// // cfb.playMove(2u);
	// // cfb.playMove(2u);
	// // cfb.playMove(2u);
	// // cfb.playMove(3u);

	// // cfb.playMove(0u);
	// // cfb.playMove(3u);
	// // cfb.playMove(5u);
	// // cfb.removeMove(0u);

	// std::cout << cfb << std::endl;

	// std::cout << (int)cfb.isWinningMove(0u, Color::YELLOW) << std::endl;;
}
