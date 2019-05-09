#include "ConnectFourNode.hxx"

#include "ConnectFourUtilities.hxx"
#include "ConnectFourBoard.hxx"

#include <math.h>
#include <random>

using namespace game_ai;


ConnectFourNode::ConnectFourNode(unsigned lastMove, ConnectFourNode* parent, Color gameResult)
	: lastMove(lastMove), parent(parent), redWins(0u), yellowWins(0u), totalTrials(0u),
	  numUnexploredChildren(0u), gameResult(gameResult)
{
}


void ConnectFourNode::backPropagate(Color result)
{
	if (result == Color::RED)
	{
		++redWins;
	}
	else if (result == Color::YELLOW)
	{
		++yellowWins;
	}

	++totalTrials;

	if (parent)
	{
		parent->backPropagate(result);
	}
}

namespace
{
	static std::default_random_engine generator;
	std::uniform_real_distribution<double> dist(0.0, 1.0);

	inline unsigned getWinningMove(const ConnectFourBoard& board, Color turn)
	{
		for (unsigned col = 0u; col < board.getWidth(); ++col)
		{
			if (board.isLegal(col) && board.isWinningMove(col, turn))
			{
				return col;
			}
		}

		return -1u;
	}


// 	inline void playRandomMove(BitBoard& board, uint64_t legalMoves)
// 	{
// 		double totalWeight = 0.0;
// 		for (int coord = 0; coord < BOARD_SIZE; ++coord)
// 		{
// 			if ((1uLL << coord) & legalMoves)
// 			{
// 				totalWeight += LOCATION_WEIGHTS[coord];
// 			}
// 		}

// 		double ranWeight = dist(generator) * totalWeight;
// 		uint64_t moveLocation = 1uLL;

// 		for (int coord = 0; coord < BOARD_SIZE; ++coord, moveLocation <<= 1)
// 		{
// 			if (moveLocation & legalMoves)
// 			{
// 				ranWeight -= LOCATION_WEIGHTS[coord];

// 				if (ranWeight <= 0.0)
// 				{
// 					break;
// 				}
// 			}
// 		}

// 		board.playMove(moveLocation);
// 	}

	Color simulateGame(ConnectFourBoard& board)
	{
		while (board.gameNotTied())
		{
			if (getWinningMove(board, board.getTurn()) != -1u)
			{
				return board.getTurn();
			}

			unsigned winningMove = getWinningMove(board, otherTurn(board.getTurn()));
			if (winningMove != -1u)
			{
				board.playMove(winningMove);
				continue;
			}

			
		}

		return Color::EMPTY;
	}
	// 		uint64_t legalMoves = board.getLegalMoves(board.getBlackTurn());

	// 		if (numSetBits(legalMoves) == 0)
	// 		{
	// 			board.changeTurn();
	// 			legalMoves = board.getLegalMoves(board.getBlackTurn());

	// 			if (numSetBits(legalMoves) == 0)
	// 			{
	// 				// game over, neither player has moves
	// 				return board.getGameResult();
	// 			}
	// 		}

	// 		playRandomMove(board, legalMoves);
	// 		// ++c;
	// 		// if (c == 10)
	// 		// {
	// 		// 	break;
	// 		// }
	// 	}
	// }
}

// void MctsNode::runSimulation()
// {
// 	backPropagate(simulateGame(BitBoard(board)));
// }


void ConnectFourNode::populateChildren(const ConnectFourBoard& board)
{
	unsigned winningMove;
	if ((winningMove = getWinningMove(board, board.getTurn())) != -1u)
	{
		// there is a winning move
		children.push_back(ConnectFourNode(winningMove, this, board.getTurn()));
		return;
	}

	if ((winningMove = getWinningMove(board, otherTurn(board.getTurn()))) != -1u)
	{
		// opponent has a winning move
		children.push_back(ConnectFourNode(winningMove, this));
		return;
	}

	for (unsigned col = 0u; col < board.getWidth(); ++col)
	{
		if (board.isLegal(col))
		{
			children.push_back(ConnectFourNode(col, this));
		}
	}
}

double ConnectFourNode::childPotential(const ConnectFourNode& child, Color turn) const
{
	static double EXPANSION_CONSTANT = 2.31;
	double w = turn == Color::RED ? (child.redWins - child.yellowWins) : (child.yellowWins - child.redWins);
	double n = child.totalTrials;
	double t = totalTrials;

	return w / n + EXPANSION_CONSTANT * std::sqrt(std::log(t) / n);
}

// void MctsNode::chooseChild()
// {
// 	if (numUnexploredChildren == -1)
// 	{
// 		// std::cout << "NEW: " << numUnexploredChildren << "\n";
// 		// std::cout << "Adding Children\n";
// 		// std::cout << board << "\n";
// 		populateChildren();
// 		// std::cout << "Num Children: " << children.size() << "\n";
// 		numUnexploredChildren = children.size();
// 	}

// 	if (children.empty())
// 	{
// 		runSimulation();
// 	}
// 	else if (numUnexploredChildren == 0)
// 	{
// 		double bestPotential;
// 		bool init = true;
// 		int bestChildIndex = 0;
// 		int numChildren = children.size();


// 		for (int i = 0; i < numChildren; ++i)
// 		{
// 			double potential = childPotential(children[i]);

// 			if (init || potential > bestPotential)
// 			{
// 				init = false;
// 				bestChildIndex = i;
// 				bestPotential = potential;
// 			}
// 		}

// 		// std::cout << "GOING IN\n" << children[bestChildIndex].totalTrials << "\n";
// 		children[bestChildIndex].chooseChild();
// 		// std::cout << "AFTER: " << children[bestChildIndex].totalTrials << "\n";

// 		// for (MctsNode& child : children)
// 		// {
// 		// 	std::cout << "C: " << child.totalTrials << "\n";
// 		// }
// 	}
// 	else
// 	{
// 		// std::cout << "Num unexplored: " << numUnexploredChildren << "\n";
// 		int chosenChildNum = dist(generator) * numUnexploredChildren;
// 		for (MctsNode& child : children)
// 		{
// 			if (child.totalTrials == 0)
// 			{
// 				if (chosenChildNum == 0)
// 				{
// 					--numUnexploredChildren;
// 					// std::cout << "Chosen Child\n";
// 					child.runSimulation();
// 					break;
// 				}

// 				--chosenChildNum;
// 			}
// 		}
// 	}
// 	// std::cout << "OLD: " << numUnexploredChildren << "\n";
// }