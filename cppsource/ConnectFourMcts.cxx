#include "ConnectFourMcts.hxx"

#include "ConnectFourBB.hxx"
#include "ConnectFourNode.hxx"

#include <ctime>
#include <utility>

using namespace game_ai;


ConnectFourMcts::ConnectFourMcts(ConnectFourBB&& b)
	: board(std::move(b)), tempBoard(), root()
{
}

unsigned ConnectFourMcts::runTime(unsigned timeInMilliseconds)
{
	root.chooseChild(tempBoard = board);
	if (root.getChildren().size() == 1u)
	{
		return root.getChildren()[0u].getLastMove();
	}


	std::clock_t startTime = std::clock();
	while ((std::clock() - startTime) / CLOCKS_PER_SEC * 1000u < timeInMilliseconds)
	{
		for (unsigned i = 0u; i < 1000u; ++i)
		{
			root.chooseChild(tempBoard = board);
		}
	}

	return root.getBestChild()->getLastMove();
}

unsigned ConnectFourMcts::runTrials(unsigned numTrials)
{
	root.chooseChild(tempBoard = board);
	if (root.getChildren().size() == 1u)
	{
		return root.getChildren()[0u].getLastMove();
	}


	for (unsigned i = 0u; i < numTrials; ++i)
	{
		root.chooseChild(tempBoard = board);
	}

	return root.getBestChild()->getLastMove();
}

void ConnectFourMcts::playMove(unsigned col)
{
	board.playMove(col);
	root.reset();
}
