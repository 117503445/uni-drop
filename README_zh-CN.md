# uni-drop

`uni-drop` 可以在不同设备之间便捷地传输文本、图片、文件。

## 快速开始

访问 [https://www.unidrop.top](https://www.unidrop.top) 即可使用。

## 功能特性

- 基于 Web，无需安装应用
- 基于 WebRTC，p2p 连接建立后不需服务器中转，充分利用(内网)带宽
- 支持传输 文本、图片、文件 消息
- 支持多种节点发现机制：局域网、二维码、Pin、URL、PeerID

## 使用方法

### 前提条件

- 使用主流浏览器 (Chrome, Firefox 等)
- 设备可以连接公网

### 节点发现

可以使用多种方式，建立不同设备之间的连接。

#### 局域网

当设备处于同一局域网时，可以使用局域网发现节点。

#### 二维码

设备A 点击 ME，向 设备B 展示二维码

设备B 扫描 设备A 展示的二维码

#### Pin

设备A 点击 ME，将 Pin 码发送给设备 B

设备B 点击 Add，

#### URL

#### PeerID

build docker

```sh
cd ./src/peer-discovery
docker build -t 117503445/peer-discovery .
docker run --rm -p 8080:8080 117503445/peer-discovery
docker tag 117503445/peer-discovery registry.cn-hangzhou.aliyuncs.com/117503445-mirror/peer-discovery && docker push registry.cn-hangzhou.aliyuncs.com/117503445-mirror/peer-discovery
```

```sh
docker exec -it uni-drop-test pnpm run playwright
docker exec -it uni-drop-test pnpm run playwright --url https://www.unidrop.top
```