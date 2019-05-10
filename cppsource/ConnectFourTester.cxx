#include "ConnectFourBB.hxx"
#include "ConnectFourBoard.hxx"
#include "ConnectFourMcts.hxx"
#include "ConnectFourNode.hxx"
#include "ConnectFourUtilities.hxx"

#include <iostream>
#include <cstdio>

#include <ctime>

using namespace game_ai;


void playGame(Color aiTurn)
{
	ConnectFourMcts cfm{ConnectFourBB()};
	cfm.runTrials(1000000u); return;
	unsigned col;

	while (cfm.getBoard().gameNotTied())
	{
		std::clock_t startTime = std::clock();
		// cfm.runTrials(1000000u);
		cfm.runTime(1000u);
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
	playGame(Color::EMPTY); return 0;

	ConnectFourBB cfb;

	cfb._setBoard({
		            0, 0, 0, 0, 0, 0, 0,
	                0, 0, 0, 0, 0, 0, 0,
	                0, 0, 0, 0, 0, 0, 0,
	                0, 0, 0, 0, 0, 0, 0,
	                0, 0, 0, 0, 0, 0, 0,
	                // 2, 1, 0, 0, 0, 0, 0,
	                // 2, 2, 1, 0, 0, 0, 0,
	                0, 2, 2, 2, 0, 0, 0
	            });

	std::cout << cfb << std::endl;

	std::cout << (int)cfb.isWinningMove(0u, Color::YELLOW) << std::endl;;
}
