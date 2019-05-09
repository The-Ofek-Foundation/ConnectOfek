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

		return Color::EMPTY;
	}
}

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

void ConnectFourNode::chooseChild(ConnectFourBoard& board)
{
	if (numUnexploredChildren == 0u && totalTrials == 0u)
	{
		populateChildren(board);
		numUnexploredChildren = children.size();
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

	double bestPotential;
	bool init = true;
	ConnectFourNode* bestChild;

	for (ConnectFourNode& child : children)
	{
		double potential = childPotential(child, board.getTurn());

		if (init || potential > bestPotential)
		{
			init = false;
			bestPotential = potential;
			bestChild = &child;
		}
	}

	board.playMove(bestChild->lastMove);
	bestChild->chooseChild(board);
}
