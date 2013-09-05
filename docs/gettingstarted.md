###Getting Started 

####Native iOS Development with LoopBack

##### Introduction

StongLoop Suite and the LoopBack framework provides a complete open Node backend solution for creating your own private Mobile Backend as a Service/Solution ( MBaaS ) for your mobile initiatives. The goal of LoopBack is to make it easy and fast for you to 'stand up' your mobile API middle tier on a platform that you can easily extend, deploy and maintain.

######Mobile Development Environment requirements

 * Mac OSX Development machine with Xcode (v4.6+) , iOS (v4.3+)
 * LoopBack SDK [LoopBack.framework](http://strongloop.com)

###### LoopBack Server Environment requirements

 * Supported [StrongLoop Suite](http://daringfireball.net/projects/markdown/) host machine or Cloud environment.  [Supported Environments](http://strongloop.com/products) 

##### Getting Started with the Guide App
The easiest way to get started is to start with the LoopBack iOS 'Guide Application'. The pre-build Guide Application already has the LoopBack SDK .framework included. Each Tab in the application will Guide you through the remoting features available to Mobile Applications.

<img src="assets/getting-started-app-01.png" alt="tab Home" height="209" width="120">
<img src="assets/getting-started-app-02.png" alt="tab 1" height="209" width="120">
<img src="assets/getting-started-app-03.png" alt="tab 2" height="209" width="120">
<img src="assets/getting-started-app-04.png" alt="tab 3" height="209" width="120">

1. Install and configure the StrongLoop Suite on your dev environment.  more information on installing LoopBack can be found in the [getting started ](http://alpha.strongloop.com/strongloop-suite/get-started/) section and the  [Quick Start Guide ](http://alpha.strongloop.com/strongloop-suite/quick-start-guide/)

2. Create the StrongLoop Suite, LoopBack Example App.
```sh
$ slc example
```

3. Run the ls-sample-app example server app 
```sh
$ cd sls-sample-app
$ slc run .
```

4. Download the LoopBack Guide Application to your local machine from github [here](https://github.com/strongloop/loopback-ios-getting-started)

```sh
$ git clone git@github.com:strongloop/loopback-ios-getting-started.git
```

5. Open the Xcode Project and CMD + R Run your application

```sh
$ cd loopback-ios-getting-started\loopback-ios-app
$ open loopback-ios-multi-model.xcodeproj
```

6. Run the Application from Xcode ( CMD + R ) and follow the instructions on each tab of the application, uncommenting the code blocks in each ViewController illustrating how to Create Read Update and Delete using the iOS LoopBack.framework

##### Getting Started with the iOS LoopBack SDK
If you are creating a new iOS Application or want to integrate an existing App you can use the LoopBack.framework iOS SDK.

1. Install and configure the StrongLoop Suite on your dev environment.  more information on installing LoopBack can be found in the [getting started ](http://alpha.strongloop.com/strongloop-suite/get-started/) section and the  [Quick Start Guide ](http://alpha.strongloop.com/strongloop-suite/quick-start-guide/)

2. Create the [LoopBack Server](http://strongloop.com/loopbackserver) on your host machine ( this can be your OSX development box , or one of our cloud providers )
```sh
$ slc lb api myLoopBackApp
$ cd myLoopBackApp
$ slc npm install
```

3. Create a [model](#models) type on the LoopBack server called 'product' in our Loopback instance
```sh
$ slc lb model product
```

Console Output:
```sh
Created product model.
```

4. Start your Loopback Server on your host machine ( this may be your OSX development box )
```sh
$ slc run app.js
```

Console Output:
```sh
Loading myLoopBackApp...
```

3. Verify the server is running on your local host machine by opening a browser to the 'products' endpoint at [localhost:300/products](http://localhost:3000/products)

Showing an empty ([ ]) array since no [model](#models) instances have been added to the server

4. Download the LoopBack iOS SDK [loopback.Framework](https://github.com/strongloop-community/loopback-ios-sdk) and drag the LoopBack.framework folder into your existing Xcode project.

If you installed the StrongLoop Suite on your local machine you can find the SDK under the StrongLoopSuite installation for OSX it is '/usr/local/share/strongloop-node/strongloop/sdks/loopback-ios-sdk'

<img src="assets/XcodeDragToFrameworkFolder.png" width="50%" height="50%" alt="Smiley face">

    * Make sure the "Copy items to destination's group folder" checkbox is checked, so a local copy of the SDK is kept within your applications project folder.

<img src="assets/ios-framework-add.png" width="220" alt="Smiley face">

Verify the the LoopBack.framework is included in the 'Link with Binaries' section under the 'Build Phases' section. You can add it directly by clicking the '+' button and selecting the LoopBack.framework

<img src="assets/linkBindaryScreen.png" width="80%" height="80%" alt="Smiley face">

4. Import the LoopBack.h header into your application; in this case I am adding to 'FirstViewController.h'

```objectivec
#import <LoopBack/LoopBack.h>
```

<img src="assets/ios-firstViewController.png" width="60%" height="60%" alt="Smiley face">

4. Use the LoopBack SDK to Create, Read, Update and Delete Mobile Models from your LoopBack Server. 

* Instantiate a LBRESTAdapter for your LoopBack server endpoint ( I am adding it to FirstViewController.m )

```objectivec
@interface FirstViewController ()
    @property (weak, nonatomic) LBRESTAdapter *adapter;
@end
@implementation FirstViewController
- (LBRESTAdapter *) adapter
{
    if( !_adapter)
        _adapter = [LBRESTAdapter adapterWithURL:[NSURL URLWithString:@"http://localhost:3000"]];
    return _adapter;
}
@end
```

* Create a new Model Instance on the Server

```objectivec
@implementation FirstViewController
- ( void ) createModel
{
  		//Get a local representation of the 'products' model type
    LBModelPrototype *prototype = [self.adapter prototypeWithName:@"products"];
		
    //create new LBModel of type
    LBModel *model = [prototype modelWithDictionary:@{ @"name": @"My New Product", @"productSKU" : @12345 }];
		
    // Define the load error functional block
    void (^saveNewErrorBlock)(NSError *) = ^(NSError *error) {
        NSLog( @"Error on Save %@", error.description);
    };
		
    // Define the load success block for saveNewSuccessBlock message
    void (^saveNewSuccessBlock)() = ^() {
     	NSLog( @"Create Success !");
    };
	};
	@end
```

Running this method will result in new product model instance with a name 'My New Product'

You can Verify the Success of the operation by opening your browser to [localhost:300/products](http://localhost:3000/products)

* Read models from the server

```objectivec
@implementation FirstViewController
- ( void ) getModels
{
    // Define the load error functional block
    void (^loadErrorBlock)(NSError *) = ^(NSError *error) {
        NSLog( @"Error %@", error.description);
    };//end loadErrorBlock
    
    // Define the load success block for the LBModelPrototype allWithSuccess message
    void (^loadSuccessBlock)(NSArray *) = ^(NSArray *models) {
        NSLog( @"selfSuccessBlock %d", models.count);
        // self.tableData  = models; you may want to set this data to local NSArray such as NSArray *tableData 
    };//end loadSuccessBlock
    
    //Get a local representation of the 'products' model type
    LBModelPrototype *objectB = [self.adapter prototypeWithName:@"products"];
    
    [objectB allWithSuccess: loadSuccessBlock failure: loadErrorBlock];
		};
		@end
```

Now that you have the basics for standing up your own private MBaaS that you can extend, optimize and deploy on the machine infrastructure that works best for your mobile application.

Find More complete documentation and interesting Neologism's on the StrongLoop Suite and the LoopBack framework here [LoopBack Documentation](http://localhost:3000/products) and [ SDK Documentation ](http://localhost:3000/products).

---