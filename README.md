# web-drop

build docker

```sh
cd peer-discovery
docker build -t 117503445/peer-discovery .
docker run --rm -p 8080:8080 117503445/peer-discovery
docker tag 117503445/peer-discovery registry.cn-hangzhou.aliyuncs.com/117503445-mirror/peer-discovery && docker push registry.cn-hangzhou.aliyuncs.com/117503445-mirror/peer-discovery
```
