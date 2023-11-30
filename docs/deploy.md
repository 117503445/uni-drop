# deploy

If you just want to deploy locally, refer to the [develop document](. /develop.md). This document is for production.

## peer-discovery

`peer-discovery` service is used to exchange PeerID between different web pages. `peer-discovery` is a web backend written in Rust and relies on MongoDB.

You can deploy `peer-discovery` and `MongoDB` using Docker Compose.

```yaml
version: '3'

services:
  peer-discovery:
    image: 117503445/peer-discovery
    container_name: peer-discovery
    restart: unless-stopped
    ports:
      - 8080:8080
    env_file:
      - ./config/peer-discovery/.env
  mongo:
    image: mongo
    restart: unless-stopped
    env_file:
      - ./config/mongo/.env
    volumes:
      - ./data/db:/data/db
```

Configure MongoDB information in `. /config/mongo/.env`. Remember to change `AsnpeMcF5VUmuy` to your own password.

```ini
MONGO_INITDB_ROOT_USERNAME=root
MONGO_INITDB_ROOT_PASSWORD=AsnpeMcF5VUmuy
```

Configure `peer-discovery` information in `. /config/peer-discovery/.env`.

```ini
MONGODB_URI=mongodb://root:AsnpeMcF5VUmuy@mongo:27017
```

Run `docker compose up -d` to start the service. Once the service has started, you can visit [http://localhost:8080](http://localhost:8080) to see if the service is running properly. The expected results are as follows:

```json
{"code":0,"msg":"","data":""}
```

## frontend

Create a new `. /src/uni-drop/.env.production.local` file and configure `VITE_BE_HOST` to be the address of the `peer-discovery` service.

Build the front-end code

```sh
docker build -t unidrop-fe-builder ./src/uni-drop
docker run --rm -v $(pwd)/src/uni-drop:/workspace/uni-drop unidrop-fe-builder
```

Upon completion, the frontend code will be generated in the directory `./src/uni-drop/dist`. You can deploy the frontend code using Nginx, Caddy, Cloudflare Pages, or any other suitable platform.
