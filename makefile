all: cppsource/*.cxx cppsource/*.hxx
	mkdir -p bin
	g++ -Wall -O3 -o bin/c4tester cppsource/*.cxx
	rm -rf cppsource/*.gch
	chmod +x bin/c4tester

clean:
	rm -rvf bin/