# development

## environment setup

prerequisites

- Linux (ArchLinux, Ubuntu, WSL2...
- Latest version of Docker

use `docker compose` to start the development environment

```sh
docker compose up -d
```

visit [http://localhost:5137](http://localhost:5137), you will see the web page.

If you use vscode, you can use the [Remote - Containers](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers) extension to develop in the container. You can just edit the code in the container, and services will be compiled and restarted automatically.

## services

- [uni-drop-fe](./src/uni-drop): frontend of uni-drop
- [peer-discovery](./src/peer-discovery): peer discovery service, used to exchange PeerID between different web pages

## operations

### manual build docker images

peer-discovery

```sh
cd ./src/peer-discovery

# build docker image
docker build -t 117503445/peer-discovery .

# run docker container
docker run --rm -p 8080:8080 117503445/peer-discovery

# push docker image to aliyun
docker tag 117503445/peer-discovery registry.cn-hangzhou.aliyuncs.com/117503445-mirror/peer-discovery && docker push registry.cn-hangzhou.aliyuncs.com/117503445-mirror/peer-discovery
```

### e2e test

```sh
# test local services
docker exec -it uni-drop-test pnpm run playwright

# test with url
docker exec -it uni-drop-test pnpm run playwright --url https://www.unidrop.top
```
