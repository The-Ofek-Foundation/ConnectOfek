#include "ConnectFourBoard.hxx"

#include <iostream>
using namespace game_ai;


int main()
{
	ConnectFourBoard cfb;

	cfb.playMove(0u);
	cfb.playMove(0u);
	cfb.playMove(0u);
	cfb.playMove(3u);
	cfb.playMove(5u);
	cfb.removeMove(0u);

	std::cout << cfb << std::endl;
}
