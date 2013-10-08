##Quick Start

This section will get you up and running with LoopBack and the StrongLoop sample app in just a few minutes.

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

The StrongLoop sample is a mobile app for "Blackpool," an imaginary military equipment rental dealer with outlets in major cities around the world.  It enables customers (small-time generals) to rent weapons and buy ammunition from Blackpool using their mobile phones.  The app displays a map of nearby rental locations and see currently available weapons, which you can filter by price, ammo type and distance.  Then, you can use the app to reserve the desired weapons and ammo.

For more details on the sample app, see [StrongLoop sls-sample-app](https://github.com/strongloop/sls-sample-app) in GitHub.
