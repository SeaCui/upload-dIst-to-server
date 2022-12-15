import inquirer from "inquirer";
import open from "open";
import { Client } from "ssh2";
import scpClient from "scp2";
import path from "path";
import { readdir } from "fs";

import type {
  ServerInter,
  SpinnerInter,
  SpinnerReturnFnInter,
  UploadDistToServerInter
} from "./type";

import { getNowTime, printInfo, spinner } from "./utils";

//连接
let conn: Client;
//服务器信息
let server: ServerInter;

// 执行exec语句
const exec = (command): Promise<500 | string | undefined> => {
  return new Promise(res => {
    conn.exec(command, function (err, stream) {
      if (err) {
        res(500);
        return;
      }
      let data: string;
      stream
        .on("close", () => {
          res(data);
        })
        .on("data", d => {
          data = Buffer.from(d).toString();
        });
      return;
    });
  });
};

//连接服务器
const startConnection = async (): Promise<boolean> => {
  const connectSpinner = spinner("正在连接到服务器");
  const { host, port = 22, username = "root", password } = server;
  //创建连接
  conn = new Client();
  //开始连接
  const connectionResult = await new Promise(resolve => {
    conn
      .on("ready", () => {
        resolve(true);
      })
      .on("error", (...d) => {
        resolve(...d);
      })
      .connect({
        host: host,
        port: port,
        username: username,
        password: password
      });
  });
  if (connectionResult !== true) {
    conn.end();
    connectSpinner.fail("服务器连接失败,请检查服务器信息!");
    console.log(connectionResult);
    return false;
  }
  connectSpinner("服务器登录成功");
  return true;
};

//检测文件目录是否存在
const checkWhetherTheFileExists = async (): Promise<false | string[]> => {
  const checkSpinner = spinner("正在检测服务器路径文件是否存在");
  //获取服务器路径列表
  const fileInfo = await exec(`cd ${server.path}\n ls`);
  //获取根目录列表
  const rootDirectory = await exec(`ls`);
  //如果服务器路径列表===根目录列表 或者 服务器路径ls 为空  则路径失效
  if (typeof fileInfo !== "string" || rootDirectory === fileInfo) {
    checkSpinner.fail("请检查服务器路径是否正确,未正确找到服务器目录!");
    return false;
  }
  //拆分获取文件列表
  const fileList = fileInfo.split("\n").filter(Boolean);
  //判断是否存在index.htm
  if (!fileList.includes("index.html")) {
    checkSpinner.fail("请确保服务器路径存在index.html文件");
    return false;
  }
  checkSpinner(`服务器文件校验成功!`);
  printInfo.success(`服务器文件列表:${fileList.join("、")}`);
  return fileList;
};

//校验本地文件是否存在
const checkLocalFile = async (): Promise<false | string[]> => {
  const checkSpinner = spinner("正在查找本地文件夹下的文件");
  //获取dist下面的文件夹
  const fileList = await new Promise(resolve => {
    readdir(path.resolve(`./${server.folder || "dist"}`), (error, filePath) => {
      if (error) {
        resolve(error);
        return;
      }
      resolve(filePath);
    });
  });
  if (!Array.isArray(fileList)) {
    checkSpinner.fail("本地文件夹未找到!");
    return false;
  }
  //查找到需要上传的文件
  checkSpinner(`本地文件目录校验成功!`);
  printInfo.success(`本地文件列表:${fileList.join("、")}`);
  return fileList;
};

// 删除服务器文件
const deleteServerFile = async (
  distFileList: string[],
  serverFileList: string[]
) => {
  const checkSpinner = spinner("正在对比本地和服务器数据");
  //删除服务器目录
  const { deleteAll, filterList } = server;
  //获取删除的文件列表
  let removeList: string[];
  //如果filterList是数组并且存在数据 则从新赋值removeList 过滤掉不删除的文件
  if (deleteAll && Array.isArray(filterList) && filterList.length !== 0) {
    removeList = serverFileList.filter(item => !filterList.includes(item));
  } else if (deleteAll) {
    removeList = serverFileList;
  } else {
    removeList = distFileList.filter(item => serverFileList.includes(item));
  }
  checkSpinner("对比成功");
  printInfo.success(`需要删除的服务器文件为:${removeList.join("、")}`);
  const oldTime = getNowTime();
  for await (const iterator of removeList) {
    const deleteSpinner = spinner(`正在删除 ${iterator}`);
    await exec(`rm -rf ${server.path}/${iterator}`);
    deleteSpinner(`${iterator} 删除成功`);
  }

  printInfo.success(
    `删除成功,共删除${removeList.length}个,共消耗${
      (getNowTime() - oldTime) / 100
    }ms`
  );
};

//上传
const uploadFile = async (): Promise<boolean> => {
  const {
    host,
    path,
    port = 22,
    password,
    username = "root",
    folder = "dist"
  } = server;
  const scpSelfClient = new scpClient.Client();
  printInfo.success("开始上传本地文件至服务器!");
  //数量
  let num = 0;
  //获取上传的时间
  const timeCount = getNowTime();
  //开始上传
  let uploadSpinner: SpinnerInter | SpinnerReturnFnInter =
    spinner(`正在上传文件到服务器`);
  //监听写入事件
  scpSelfClient.on("write", ({ source }: { source: string }) => {
    //打印
    uploadSpinner(`${source.replace("./", "")}`);
    //创建新的加载
    uploadSpinner = spinner(`正在上传文件到服务器`);
    //计数
    num++;
  });
  //开始上传
  const result = await new Promise(resolve => {
    scpClient.scp(
      `./${folder}`,
      {
        host,
        port,
        username,
        password,
        path
      },
      scpSelfClient,
      err => {
        //上传结果
        if (err) {
          resolve(err);
          return;
        }
        resolve(true);
      }
    );
  });

  if (result !== true) {
    uploadSpinner.fail("发布失败");
    console.log(result);
    return false;
  }
  uploadSpinner(`上传成功!`);
  printInfo.success(
    `上传文件共${num}个,共耗时${(getNowTime() - timeCount) / 100}ms`
  );
  return true;
};

//
const upload = async () => {
  //连接服务器
  const connectionResult = await startConnection();
  if (!connectionResult) {
    //服务器连接失败
    return;
  }
  const result = await (async () => {
    //校验服务器文件是否存在
    //服务器上的目录
    const serverFileList = await checkWhetherTheFileExists();
    if (serverFileList === false) {
      //服务器目录不正确
      return;
    }
    // 校验本地dist文件是否存在
    const distFileList = await checkLocalFile();
    if (!Array.isArray(distFileList)) {
      //服务器dist目录不存在
      return;
    }
    //删除文件
    await deleteServerFile(distFileList, serverFileList);
    //上传文件夹
    const uploadResult = await uploadFile();
    if (uploadResult === false) {
      //上传文件失败
      return;
    }

    //上传成功
    return true;
  })();
  if (result === true) {
    printInfo.success(`已成功发布到服务器上`);

    if (typeof server.website === "string") {
      open(server.website, {
        app: {
          name: "google chrome",
          arguments: ["--incognito"]
        }
      });
    }
  }
  conn.end();
};

//发布dist文件夹到服务器
const UploadDistToServer: UploadDistToServerInter = async options => {
  if (Array.isArray(options)) {
    //获取服务器列表
    const enumValue = options.reduce<Record<string, number>>((a, b, index) => {
      a[b.serverName] = index;
      return a;
    }, {});
    //选择
    const { serverName } = await inquirer.prompt([
      {
        type: "list",
        message: "请选择您要部署的服务器:",
        name: "serverName",
        choices: Object.keys(enumValue)
      }
    ]);
    //赋值服务器
    server = options[enumValue[serverName]];
  } else {
    server = options;
  }
  //发布
  await upload();
};

//vite
UploadDistToServer.vitejs = options => {
  return {
    name: "upload-dist-to-server",
    closeBundle() {
      UploadDistToServer(options);
    }
  };
};

// //webpack
// UploadDistToServer.webpack = options => {
//   return {
//     name: "upload-dist-to-server",
//     closeBundle() {
//       UploadDistToServer(options);
//     }
//   };
// };

export default UploadDistToServer;
module.exports = UploadDistToServer;
