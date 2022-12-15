declare module 'scp2' {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  type ClientInter = any
  export function scp(
    path: string,
    config: { host: string; port: number; username: string; password: string; path: string },
    client: ClientInter,
    callback: (err: Error) => void
  ): void

  export const Client: ClientInter
}
