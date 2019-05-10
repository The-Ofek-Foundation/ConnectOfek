#ifndef CONNECTFOURNODE_H
#define CONNECTFOURNODE_H

#include "ConnectFourUtilities.hxx"
#include "ConnectFourBoard.hxx"

#include <math.h>
#include <vector>

namespace game_ai
{
	class ConnectFourNode
	{
	public:
		ConnectFourNode(unsigned lastMove = -1u, ConnectFourNode* parent = nullptr, Color gameResult = Color::EMPTY);

		// !!! should avoid using !!!
		// reuse subtree!!!
		void reset();

		const ConnectFourNode* getBestChild() const;


		void chooseChild(ConnectFourBoard& board);

		unsigned getTotalTrials() const
		{
			return totalTrials;
		}

		unsigned getRedWins() const
		{
			return redWins;
		}

		unsigned getYellowWins() const
		{
			return yellowWins;
		}

		unsigned getLastMove() const
		{
			return lastMove;
		}

		const std::vector<ConnectFourNode>& getChildren() const
		{
			return children;
		}

	private:
		unsigned lastMove;
		ConnectFourNode* parent;
		unsigned redWins, yellowWins;
		unsigned totalTrials;
		unsigned numUnexploredChildren;
		std::vector<ConnectFourNode> children = {};
		Color gameResult;

		void backPropagate(Color result);
		void populateChildren(const ConnectFourBoard& board);

		inline float childPotential(const ConnectFourNode& child, Color turn, float lt) const
		{
			static float EXPANSION_CONSTANT = 2.31f;
			float w = turn == Color::RED ? child.redWins : child.yellowWins;
			float n = child.totalTrials;

			return w / n + EXPANSION_CONSTANT * std::sqrt(lt / n);
		}
	};
}

#endif