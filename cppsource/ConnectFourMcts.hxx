#ifndef CONNECTFOURMCTS_H
#define CONNECTFOURMCTS_H

#include "ConnectFourBB.hxx"
#include "ConnectFourNode.hxx"


namespace game_ai
{
	class ConnectFourMcts
	{
	public:

		ConnectFourMcts(ConnectFourBB&& board);

		unsigned runTime(unsigned timeInMilliseconds);
		unsigned runTrials(unsigned numTrials);

		void playMove(unsigned col);

		const ConnectFourBB& getBoard() const
		{
			return board;
		}

		const ConnectFourNode& getNode() const
		{
			return root;
		}

	private:
		ConnectFourBB board, tempBoard;
		ConnectFourNode root;
	};
}

#endif
