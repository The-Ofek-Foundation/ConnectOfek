all: cppsource/*.cxx cppsource/*.hxx
	mkdir -p bin
	g++ -Wall -Ofast -o bin/c4tester cppsource/*.cxx
	rm -rf cppsource/*.gch
	chmod +x bin/c4tester

profile: cppsource/*.cxx cppsource/*.hxx
	mkdir -p bin
	g++ -Wall -g -Ofast -o bin/c4tester cppsource/*.cxx
	rm -rf cppsource/*.gch
	chmod +x bin/c4tester

clean:
	rm -rvf bin/