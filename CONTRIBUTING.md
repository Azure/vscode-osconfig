# Contribution Guidelines

There are many ways in which you can participate in this project: submitting pull requests, reporting issues, and suggesting new features.

## Prerequisites

In order to download necessary tools, clone the repository, and install dependencies, you must install the following tools:

- [Git](https://git-scm.com/)
- [Node.js](https://nodejs.org/)
- [Visual Studio Code](https://code.visualstudio.com/)

### Development Container

Alternatively, you can avoid local dependency installation as this repository includes a Visual Studio Code Remote - Containers / Codespaces [development container](https://github.com/Azure/vscode-osconfig/tree/main/.devcontainer).

- For [Remote - Containers](https://aka.ms/vscode-remote/download/containers), use the **Remote-Containers: Open Repository in Container...** command which creates a Docker volume for better disk I/O on macOS and Windows.
- For Codespaces, install the [GitHub Codespaces](https://marketplace.visualstudio.com/items?itemName=GitHub.codespaces) extension in VS Code, and use the **Codespaces: Create New Codespace command**.

## Build and Run

If you want to understand how this extension works or want to debug an issue, you'll want to get the source code, build it and run the extension locally.

First, fork the repository so that you can make a pull request later and clone your fork:

```bash
git clone https://github.com/<your-github-username>/vscode-osconfig
```

Occasionally you will want to merge changes in the upstream repository (the official code repo) with your fork. You can do this by adding the upstream repository as a remote and pulling from it:

```bash
git remote add upstream
git pull upstream main
```

Manage any merge conflicts, commit them, and then push them to your fork.

### Build

Open the `vscode-osconfig` folder in VSCode:

```bash
code vscode-osconfig
```

Install and build all of the dependencies using `npm`:

```bash
npm install
```

### Run

Inside your VSCode workspace, press `F5`. This will compile and run the extension in a new **Extension Development Host** window.

### Debugging

To debug the extension, you can use the built-in debugger in VSCode. Set breakpoints in the code, then press `F5` to launch the extension in a new **Extension Development Host** window. The debugger will stop at the breakpoints you set.

Since the server is started by the `LanguageClient` running in the extension (client), we need to attach a debugger to the running server. To do so, switch to the **Run and Debug** view and select the launch configuration **Attach to Server** and press `F5`. This will attach the debugger to the server.

## Issues

Before submitting an issue, please search the list of [open issues]() to see if the issue or feature request has already been filed. If you find your issue already exists, make relevant comments and add your [reaction](https://github.com/blog/2119-add-reactions-to-pull-requests-issues-and-comments).

- 👍 - upvote
- 👎 - downvote

If you cannot find an existing issue that describes your bug or feature, submit an issue using the guidelines below.

File a single issue per problem or feature request.

- Do not enumerate multiple bugs or feature requests in the same issue.
- Do not add your issue as a comment to an existing issue unless it's for the identical input. Many issues look similar, but have different causes.

The more information you can provide, the more likely someone will be successful reproducing the issue and finding a fix.

Please include the following with each issue:

- Reproducible steps and what you expected versus what you actually saw.
- Images, animations, or a video. These can usually be pasted directly into the description field on GitHub. Note that images and animations illustrate repro-steps but *do not* replace them.
- A code snippet that demonstrates the issue, or a link to a code repository we can easily pull down onto our machine to recreate the issue.
- Simplify your code/example around the issue so we can better isolate the problem.

> Note: Because we may need to copy and paste the code snippet, including a code snippet as a media file (e.g. .gif) is not sufficient.

Don't feel bad if we can't reproduce the issue and ask for more information!

## Pull Requests

Pull requests are welcome. Before submitting a pull request, please ensure that:

- You have signed the [Contributor License Agreement](https://cla.opensource.microsoft.com/microsoft/vscode-osconfig).
- Your code adheres to the existing style in the codebase (indentation, accurate comments, etc.).
- You have added unit tests for the new code.
- You have run all the unit tests using `npm test`.

## Suggestions

We're also interested in your feedback and suggestions. You can submit a bug or feature request through the [issue tracker](https://github.com/microsoft/vscode/issues/new/choose). To make this process more effective, please include as much information and detail as possible.

## Discussion Etiquette

In order to keep the conversation clear and transparent, please limit discussion to English and keep things on topic with the issue. Be considerate to others and try to be courteous and professional at all times.
