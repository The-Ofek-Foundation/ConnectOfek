#include "ConnectFourBB.hxx"
#include "ConnectFourBoard.hxx"
#include "ConnectFourMcts.hxx"
#include "ConnectFourNode.hxx"
#include "ConnectFourUtilities.hxx"

#include <iostream>
#include <cstdio>

#include <ctime>
#include <locale.h>

using namespace game_ai;


void playGame(Color aiTurn)
{
	ConnectFourMcts cfm{ConnectFourBB()};
	// cfm.runTrials(6000000u); return;
	unsigned col;

	while (cfm.getBoard().gameNotTied())
	{
		std::cout << cfm.getBoard() << std::endl;

		if (cfm.getBoard().getTurn() == aiTurn)
		{
			// cfm.runTrials(1000000u);
			cfm.runTime(30000u);
			const ConnectFourNode* bestChild = cfm.getNode().getBestChild();

			printf("\nThe AI thinks that %d is the best move, after %'d trials.\n\n",
				col = bestChild->getLastMove(), cfm.getNode().getTotalTrials());
		}
		else
		{
			std::cout << "\nYour Move: ";
			std::cin >> col;
		}


		if (cfm.getBoard().isWinningMoveUsingCheck(col, cfm.getBoard().getTurn()))
		{
			cfm.playMove(col);
			break;
		}

		cfm.playMove(col);
	}

	std::cout << "Game Over!\n\n" << cfm.getBoard() << "\n";
}


int main()
{
	setlocale(LC_NUMERIC, "");
	playGame(Color::YELLOW); return 0;

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
