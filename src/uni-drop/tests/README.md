docker rm -f uni-drop-test && dcu && docker attach uni-drop-test

./tests/entrypoint.sh
./tests/start.sh

docker exec -it uni-drop-test pnpm run playwright

docker exec -it uni-drop-test pnpm run playwright

docker exec -it uni-drop-test npx playwright show-trace ./tests/traces/Basic.zip
