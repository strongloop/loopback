##Quick Start

This section will get you up and running with LoopBack and the StrongLoop sample app in just a few minutes.

### Prerequisites

You must have the `git` command-line tool installed to run the sample application.
If needed, download it at <http://git-scm.com/downloads> and install it.

On Linux systems, you must have root privileges to write to `/usr/share`.

**NOTE**: If you're using Windows or OSX and don't have a C compiler (Visual C++ on Windows or XCode on OSX) and command-line "make" tools installed, you will see errors such as these:
```sh
xcode-select: Error: No Xcode is selected. Use xcode-select -switch <path-to-xcode>, 
or see the xcode-select manpage (man xcode-select) for further information.
...
Unable to load native module uvmon; some features may be unavailable without compiling it.
memwatch must be installed to use the instances feature
StrongOps not configured to monitor. Please refer to http://docs.strongloop.com/strong-agent for usage.
```

You will still be able to run the sample app, but StrongOps will not be able to collect certain statistics.

### Creating and Running the Sample App

Follow these steps to run the LoopBack sample app:

1. If you have not already done so, download and install [StrongLoop Suite](http://www.strongloop.com/get-started) or set up your cloud development platform.

2. Setup the StrongLoop Suite sample app with this command.
```sh
$ slc example
```
This command clones the sample app into a new directory
named `sls-sample-app` and installs all of its dependencies.
3. Run the sample application by entering this command:
```sh
$ cd sls-sample-app
$ slc run app
```
4. To see the app running in a browser, open <http://localhost:3000>. The app homepage lists sample requests you can make against the LoopBack REST API.  Click the **GET** buttons to see the JSON data returned.

### About the sample app

The StrongLoop sample is a mobile app for "Blackpool," an imaginary military equipment rental dealer with outlets in major cities around the world.  It enables customers (military commanders) to rent weapons and buy ammunition from Blackpool using their mobile phones.  The app displays a map of nearby rental locations and see currently available weapons, which you can filter by price, ammo type and distance.  Then, you can use the app to reserve the desired weapons and ammo.

Note that the sample app is the backend functionality only; that is, the app has a REST API, but no client app or UI to consume the interface.

For more details on the sample app, see [StrongLoop sls-sample-app](https://github.com/strongloop/sls-sample-app) in GitHub.
