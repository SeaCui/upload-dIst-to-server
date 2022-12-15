type PrintTypeInter = "success" | "fail" | "info";
export type PrintInter = {
  [key in PrintTypeInter]: (text: string) => void;
} & {
  (text: string): void;
};

export type SleepInter = (ms: number) => Promise<void>;

export interface SpinnerReturnFnInter {
  (text: string): void;
  fail(text): void;
}
export type SpinnerInter = (text: string) => SpinnerReturnFnInter;

export interface ServerInter {
  /**
   * 服务器地址
   */
  host: string;
  /**
   * 端口号 默认22
   */
  port?: number;
  /**
   * 服务器登录用户名 默认root
   */
  username?: string;
  /**
   * 服务器登录密码
   */
  password: string;
  /**
   * 项目部署服务器地址
   */
  path: string;
  /**
   * 预览地址,如果有此选项地址,上传成功后,会默认使用谷歌打开此地址
   */
  website?: string;
  /**
   * 是否删除服务器目录下所有文件
   *    true:删除服务器目录所有内容
   *    false:只删除上传文件内容
   */
  deleteAll?: boolean;
  /**
   * 删除服务器文件时过滤的文件,如果文件在filterList内,则不会删除
   */
  filterList?: string[];
  /**
   * 上传的文件夹 默认dist
   */
  folder?: string;
}

type UploadDistToServerOptionsInter =
  | Array<
      ServerInter & {
        /**
         * 服务器名称
         */
        serverName: string;
      }
    >
  | ServerInter;

type UploadDistToServerInterFn = (
  options: UploadDistToServerOptionsInter
) => Promise<void>;

export type UploadDistToServerInter = {
  //默认执行
  (options: UploadDistToServerOptionsInter): Promise<void>;
  //vite
  vitejs(options: UploadDistToServerOptionsInter): {
    name: string;
    closeBundle(): void;
  };
  //webpack
  // webpack(options: UploadDistToServerOptionsInter): {
  //   name: string;
  //   closeBundle(): void;
  // };
};
