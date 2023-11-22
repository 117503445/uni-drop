docker rm -f uni-drop-test && dcu && docker attach uni-drop-test

./tests/entrypoint.sh
./tests/start.sh

docker exec -it uni-drop-test pnpm run playwright
