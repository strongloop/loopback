## Command Line Tool

StrongLoop Suite includes a command-line tool, `slc` (StrongLoop Command), for working with applications.
The `slc lb` command enables you to quickly create new LoopBack applications and models with the following sub-commands:

* [workspace](#workspace): create a new workspace, essentially a container for multiple projects.
* [project](#project): create a new application.
* [model](#model): create a new model for a LoopBack application.

For more information on the `slc` command, see [StrongLoop Control](/strongnode/#strongloop-control-slc).

### workspace

<pre>
slc lb workspace <i>wsname</i>
</pre>

Creates an empty directory named _wsname_.  The argument is optional; default is "loopback-workspace".

A LoopBack workspace is essentially a container for application projects.   It is not required to create an application, but may be helpful for organization.

### project

<pre>
slc lb project <i>app_name</i>
</pre>

Creates a LoopBack application called _appname_, where _appname_ is a valid JavaScript identifier.
This command creates a new directory called _appname_ in the current directory containing:
* app.js
* package.json
* modules directory, containing: <ul><li> app directory - contains config.json, index.js, and module.json files
</li> 
<li>  db directory - contains files index.js and module.json</li> 
<li>  docs directory - contains files config.json, index.js, and module.json; explorer directory</li></ul> 

### model

<pre>
slc lb model <i>modelname</i>
</pre>

Creates a model named _modelname_ in an existing LoopBack application. 

Provide the
`-i` or `--interactive` flag to be prompted through model
configuration. Use the `--data-source` flag to specify the name of a
custom data source; default is data source named "db".
