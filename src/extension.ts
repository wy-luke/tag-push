import * as vscode from "vscode";
import { GitErrorCodes, GitExtension } from "./git";

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // This line of code will only be executed once when your extension is activated
  console.log('Congratulations, your extension "tag-push" is now active!');

  let terminal: vscode.Terminal | undefined;

  // The command has been defined in the package.json file
  // Now provide the implementation of the command with registerCommand
  // The commandId parameter must match the command field in package.json
  let disposable = vscode.commands.registerCommand(
    "tag-push.tagPush",
    async () => {
      // 获取当前项目的根路径
      const workspaceRoot = vscode.workspace.workspaceFolders;

      const gitExtension =
        vscode.extensions.getExtension<GitExtension>("vscode.git")?.exports;
      const git = gitExtension?.getAPI(1);
      if (!workspaceRoot || !git) {
        return;
      }

      const repo = git?.getRepository(workspaceRoot[0].uri);
      if (!repo) {
        vscode.window.showErrorMessage(`当前目录非Git仓库`);
        return;
      }

      const headCommit = repo.state.HEAD?.commit; // HEAD commit of the current branch
      const upstreamCommit = repo.state.HEAD?.upstream?.commit; // HEAD commit of the upstream branch

      if (headCommit !== upstreamCommit) {
        try {
          await repo.pull();
          vscode.window.showInformationMessage("Pull successful");
        } catch (error) {
          if ((error as any).gitErrorCode === GitErrorCodes.Conflict) {
            vscode.window.showErrorMessage(
              "Pull resulted in conflicts. Please resolve them.",
            );

            // let state = repo?.state;
            // while (state?.mergeChanges?.length > 0) {
            //   // Wait for 1 second
            //   await new Promise((resolve) => setTimeout(resolve, 1000));
            //   state = repo?.state;
            // }

            // Continue with the rest of your code here
          } else {
            vscode.window.showErrorMessage(`Error pulling: ${error}`);
          }
        }
      } else {
        vscode.window.showInformationMessage("Your branch is up to date.");
      }

      const lastCommit = await repo.getCommit("HEAD");
      const commitMessage = `${lastCommit.message}\n\n[build]`;

      await repo.commit(commitMessage, { amend: true });

      repo.push();

      // if (workspaceRoot) {
      //   if (!terminal) {
      //     // 如果不存在，创建新终端
      //     terminal = vscode.window.createTerminal({
      //       name: `Tag push`,
      //       cwd: workspaceRoot[0].uri.fsPath,
      //     });

      //     // 注册关闭事件，当终端被关闭时清空引用
      //     context.subscriptions.push(
      //       vscode.window.onDidCloseTerminal((closedTerminal) => {
      //         if (closedTerminal === terminal) {
      //           terminal = undefined;
      //         }
      //       }),
      //     );
      //   }

      //   terminal.sendText(
      //     `git merge 4baa3be483b6fbff8559a327370eaa5aaa83c733;`,
      //   );
      //   terminal.sendText(
      //     `
      //   git commit --amend -m"$(git log --format=%B -n1)" -m"[build]"`,
      //   );
      //   terminal.show();
      // } else {
      //   vscode.window.showErrorMessage(
      //     "No workspace opened. Please open a workspace before executing this command.",
      //   );
      // }
    },
  );

  context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() {}
