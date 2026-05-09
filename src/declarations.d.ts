//
// Optional dependency declarations for restricted environments
// (e.g. CI, Docker, air-gapped machines).
// These declarations allow TypeScript to compile
// even when the package is absent.
//

declare module 'keytar' {
  export function setPassword(
    service: string,
    account: string,
    password: string
  ): Promise<void>;

  export function getPassword(
    service: string,
    account: string
  ): Promise<string | null>;

  export function deletePassword(
    service: string,
    account: string
  ): Promise<boolean>;
}

//
// update-notifier ESM/CJS compatibility types
//

declare module 'update-notifier' {
  interface PackageJson {
    name: string;
    version: string;
    [key: string]: unknown;
  }

  interface Options {
    pkg: PackageJson;
    updateCheckInterval?: number;
    shouldNotifyInNpmScript?: boolean;
    distTag?: string;
  }

  interface UpdateInfo {
    latest: string;
    current: string;
    type:
      | 'latest'
      | 'major'
      | 'minor'
      | 'patch'
      | 'prerelease'
      | 'build';
    name: string;
  }

  interface Notifier {
    notify(options?: {
      isGlobal?: boolean;
      boxenOptions?: object;
    }): void;

    update?: UpdateInfo;

    fetchInfo(): Promise<UpdateInfo>;
  }

  function updateNotifier(options: Options): Notifier;
  export default updateNotifier;
}