#ifndef CONNECTFOURMCTS_H
#define CONNECTFOURMCTS_H

#include "ConnectFourBoard.hxx"
#include "ConnectFourNode.hxx"
// #include "ConnectFourUtilities.hxx"


namespace game_ai
{
	class ConnectFourMcts
	{
	public:

		ConnectFourMcts(ConnectFourBoard&& board);

		unsigned runTime(unsigned timeInMilliseconds);
		unsigned runTrials(unsigned numTrials);

		void playMove(unsigned col);

		const ConnectFourBoard& getBoard() const
		{
			return board;
		}

		const ConnectFourNode& getNode() const
		{
			return root;
		}

	private:
		ConnectFourBoard board, tempBoard;
		ConnectFourNode root;
	};
}

#endif
