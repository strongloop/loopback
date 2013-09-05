## Command Line

The StrongLoop Suite comes bundled with a command line tool called StrongLoop
Command or `slc`. StrongLoop Command allows you to create boilerplate for
LoopBack and other StrongNode applications.

### Commands

`slc lb` provides the following commands.

#### workspace

Initialize a workspace as a new empty directory with an optional
name. The default name is "loopback-workspace".

```sh
$ slc lb workspace my-loopback-workspace
```

#### api

Create a LoopBack application in a new directory within a workspace
using the given name. The name arg is required.

```sh
$ cd my-loopback-workspace
$ slc lb api my-app
$ slc run app
```

#### model
Create  a model in an existing LoopBack application. If you provide the
`-i` or `--interactive` flags, you will be prompted through a model
configuration. The `--data-source` flag allows you to specify the name of a
custom data. Otheriwse it will use the data source named "db".

```sh
$ cd my-app
$ slc lb model product
```
