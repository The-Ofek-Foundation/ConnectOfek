#ifndef CONNECTFOURNODE_H
#define CONNECTFOURNODE_H

#include "ConnectFourUtilities.hxx"
#include "ConnectFourBoard.hxx"

#include <vector>

namespace game_ai
{
	class ConnectFourNode
	{
	public:
		ConnectFourNode(unsigned lastMove, ConnectFourNode* parent = nullptr, Color gameResult = Color::EMPTY);

		void chooseChild(ConnectFourBoard& board);
		void backPropagate(Color result);
		void populateChildren(const ConnectFourBoard& board);

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

		double childPotential(const ConnectFourNode& child, Color turn) const;

	private:
		unsigned lastMove;
		ConnectFourNode* parent;
		unsigned redWins, yellowWins;
		unsigned totalTrials;
		unsigned numUnexploredChildren;
		std::vector<ConnectFourNode> children = {};
		Color gameResult;
	// 	MctsNode* parent;

	// 	void backPropagate(int result);
	// 	void runSimulation();
	// 	void populateChildren();
	};
}

#endif