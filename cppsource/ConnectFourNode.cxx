#include "ConnectFourNode.hxx"

#include "ConnectFourUtilities.hxx"
#include "ConnectFourBoard.hxx"

#include <cmath>
#include <cstdint>
#include <random>

using namespace game_ai;


ConnectFourNode::ConnectFourNode(unsigned lastMove, ConnectFourNode* parent, Color gameResult)
	: lastMove(lastMove), parent(parent), redWins(0u), yellowWins(0u), totalTrials(0u),
	  numUnexploredChildren(0u), gameResult(gameResult)
{
}

void ConnectFourNode::reset()
{
	lastMove = -1u;
	parent = nullptr;
	redWins = yellowWins = totalTrials = 0u;
	numUnexploredChildren = 0u;
	gameResult = Color::EMPTY;
	children.clear();
}

const ConnectFourNode* ConnectFourNode::getBestChild() const
{
	unsigned mostTrials = 0u;
	const ConnectFourNode* bestChild = nullptr;

	for (const ConnectFourNode& child : children)
	{
		if (child.totalTrials > mostTrials)
		{
			mostTrials = child.totalTrials;
			bestChild = &child;
		}
	}

	return bestChild;
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


	inline void playRandomMove(ConnectFourBoard& board)
	{
		unsigned randomCol;
		do
		{
			randomCol = static_cast<unsigned>(dist(generator) * board.getWidth());
		} while (!board.isLegal(randomCol));

		board.playMove(randomCol);
	}

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

			playRandomMove(board);
		}

		return Color::TIE;
	}
}

void ConnectFourNode::populateChildren(const ConnectFourBoard& board)
{
	if (!board.gameNotTied())
	{
		gameResult = Color::TIE;
		return;
	}

	if (board.winningMovePossible())
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
	}

	for (unsigned col = 0u; col < board.getWidth(); ++col)
	{
		if (board.isLegal(col))
		{
			children.push_back(ConnectFourNode(col, this));
		}
	}
}

namespace
{
	static inline float fasterlog (float x)
	{
		union { float f; uint32_t i; } vx = { x };
		float y = vx.i;
		y *= 8.2629582881927490e-8f;
		return y - 87.989971088f;
	}
}

void ConnectFourNode::chooseChild(ConnectFourBoard& board)
{
	// std::cout << "Up top: " << numUnexploredChildren << " " << totalTrials << std::endl;
	if (children.empty() && gameResult == Color::EMPTY)
	{
		// std::cout << "Before populating" << std::endl;
		populateChildren(board);
		numUnexploredChildren = children.size();
		// std::cout << "After populating" << std::endl;
	}

	if (gameResult != Color::EMPTY)
	{
		backPropagate(gameResult);
		return;
	}

	if (numUnexploredChildren != 0u)
	{
		// there are still some unexplored children

		unsigned chosenChildNum = static_cast<unsigned>(dist(generator) * numUnexploredChildren);
		for (ConnectFourNode& child : children)
		{
			if (child.totalTrials == 0u)
			{
				if (chosenChildNum-- == 0u)
				{
					--numUnexploredChildren;
					board.playMove(child.lastMove);
					child.backPropagate(simulateGame(board));
					return;
				}
			}
		}
	}

	// all the children are explored, pick the one with the best potential

	// std::cout << "First Time" << std::endl;

	float bestPotential = 0.0f;
	bool init = true;
	ConnectFourNode* bestChild = nullptr;
	float lt = fasterlog(totalTrials);

	for (ConnectFourNode& child : children)
	{
		float potential = childPotential(child, board.getTurn(), lt);
		// printf("Move: %d\tPotential: %f\tRed Wins: %d\tYellow Wins: %d\tTotal Trials: %d\tTurn: %d\n",
		// 	child.lastMove, potential, child.redWins, child.yellowWins, child.totalTrials, (unsigned)board.getTurn());

		if (init || potential > bestPotential)
		{
			init = false;
			bestPotential = potential;
			bestChild = &child;
		}
	}

	// std::cout << "About to play " << bestChild->lastMove << std::endl;
	board.playMove(bestChild->lastMove);
	bestChild->chooseChild(board);
	// std::cout << "After choosing" << std::endl;
}
