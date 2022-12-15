# 简介

> `upload-dist-to-server` 可以将打包后的文件快速的部署至您的服务器,支持作为`vite`插件或单独使用.

## 安装

```shell
yarn add @sea_cui/upload-dist-to-server -D
```

或

```shell
npm install @sea_cui/upload-dist-to-server -D
```

## 使用

单服务器部署

```js
import upload from "@sea_cui/upload-dist-to-server";
//const upload = require("@sea_cui/upload-dist-to-server");

upload({
  host: "location",
  username: "root",
  password: "password",
  path: "/root"
});
```

多服务器多选一部署

```js
import upload from "@sea_cui/upload-dist-to-server";
//const upload = require("@sea_cui/upload-dist-to-server");

upload([
  {
    host: "location",
    username: "root",
    password: "password",
    path: "/root",
    serverName: "测试服务器"
  },
  {
    host: "location",
    username: "root",
    password: "password",
    path: "/root",
    serverName: "正式服务器"
  }
]);
```

vite 作为插件使用

```js
upload.vitejs(options);
```

单独使用

- 项目根目录新建 `upload.js`

```js
const upload = require("@sea_cui/upload-dist-to-server");

upload({
  host: "location",
  username: "root",
  password: "password",
  path: "/root"
});
```

- 修改 `package.json` 中的 `scripts`=>`build`

- 字段后面加上 `&& node upload.js` 比如 "build": "`vite build`" => "build": "`vite build && node upload.js`"

- 正常执行 yarn build 即可

## 参数

- **host:** 服务器地址(必填)
- **username:** 服务器登录用户名,默认为 root
- **password:** 服务器登录密码(必填)
- **port:** 服务器端口号,默认为 22
- **path:** 服务器部署地址(必填)
- **website:** 预览地址,如果有此选项地址,上传成功后,会默认使用谷歌打开此地址
- **deleteAll:** 是否删除服务器目录下所有文件
- **filterList:** 删除服务器文件时过滤的文件,如果文件在 filterList 内,则不会删除,deleteAll=true 时才会触发
- **folder:** 上传的文件夹,默认为 dist

## 注意

- 上传即删除做了比较多的校验,基本上可以不用担心误删.
  - 服务器账号密码必须正确
  - 校验项目部署路径 确保真实存在
  - 校验项目部署路径 下面必须存在 index.html
  - 校验本地 dist 文件是否存在
  - 删除文件时 会读取本地 dist 文件列表 保证不会删除多余的文件(deleteAll=true 情况下不会)
- 尽量不推荐使用 deleteAll,deleteAll 可以和 filterList 配合减少删除多余的文件
- 如果需要上传完执行某件事件,可以使用异步来搞定,文件上传成功后才会异步返回
