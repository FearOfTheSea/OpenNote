export enum LogLevel {
  INFO = "INFO",
  WARN = "WARN",
  ERROR = "ERROR",
  DEBUG = "DEBUG",
}

export class Logger {
  private static getTime(): string {
    return new Date().toISOString();
  }

  static info(message: string, context?: any) {
    console.log(
      `%c[${this.getTime()}] [INFO] ${message}`,
      "color: green",
      context ? JSON.stringify(context, null, 2) : "",
    );
  }

  static warn(message: string, context?: any) {
    console.warn(
      `%c[${this.getTime()}] [WARN] ${message}`,
      "color: yellow",
      context ? JSON.stringify(context, null, 2) : "",
    );
  }

  static error(message: string, error?: unknown) {
    console.error(`%c[${this.getTime()}] [ERROR] ${message}`, "color: red");
    if (error) {
      console.error(error);
    }
  }

  static debug(message: string, context?: any) {
    // hiện log khi ở môi trường dev
    if (Deno.env.get("NODE_ENV") === "development") {
      console.debug(
        `%c[${this.getTime()}] [DEBUG] ${message}`,
        "color: blue",
        context ? JSON.stringify(context, null, 2) : "",
      );
    }
  }
}
