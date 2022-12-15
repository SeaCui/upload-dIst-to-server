import ora from "ora";
import chalk from "chalk";
import type {
  PrintInter,
  SleepInter,
  SpinnerInter,
  SpinnerReturnFnInter
} from "./type";

export const printInfo: PrintInter = text => printInfo.info(text);
printInfo.success = text => {
  console.log(chalk.green(text));
};
printInfo.fail = text => {
  console.log(chalk.red(text));
};
printInfo.info = text => {
  console.log(text);
};

export const sleep: SleepInter = ms => new Promise(r => setTimeout(r, ms));

export const spinner: SpinnerInter = text => {
  let count = 1;
  let timer: NodeJS.Timeout | undefined = undefined;
  //创建spinner
  const spinner = ora(text);

  //开始加载
  spinner.start();

  //文字改变
  const spinnerChange = () => {
    //如果大于6
    if (count === 6) {
      count = 1;
    }
    spinner.text = `${text}${Array(count).fill(".").join("")}`;
    count += 1;
    timer = setTimeout(spinnerChange, 500);
  };
  spinnerChange();

  const closeSpinner = (type: "succeed" | "fail", text: string) => {
    clearTimeout(timer);
    try {
      spinner[type](text);
    } catch (error) {
      //
    }
  };
  //返回方法
  const returnFn: SpinnerReturnFnInter = text => {
    closeSpinner("succeed", text);
  };
  returnFn.fail = text => {
    closeSpinner("fail", text);
  };
  return returnFn;
};

export const getNowTime = (): number => {
  return new Date().getTime();
};
