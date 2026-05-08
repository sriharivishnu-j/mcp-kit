declare module "update-notifier" {
  interface UpdateNotifierOptions {
    pkg: { name: string; version: string };
  }

  interface UpdateNotifierResult {
    notify: () => void;
  }

  export default function updateNotifier(options: UpdateNotifierOptions): UpdateNotifierResult;
}
