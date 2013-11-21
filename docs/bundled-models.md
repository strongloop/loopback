## Bundled Models

The Loopback library is unopinioned in the way you define your app's data and logic. Loopback also bundles useful pre-built models for common use cases.

 - User - register and authenticate users of your app locally or against 3rd party services.
 - Email - send emails to your app users using smtp or 3rd party services.

Defining a model with `loopback.createModel()` is really just extending the base `loopback.Model` type using `loopback.Model.extend()`. The bundled models extend from the base `loopback.Model` allowing you to extend them arbitrarily.
 
### User Model

Register and authenticate users of your app locally or against 3rd party services.

#### Define a User Model

Extend a vanilla Loopback model using the built in User model.

```js
// create a data source
var memory = loopback.memory();

// define a User model
var User = loopback.User.extend('user');

// attach to the memory connector
User.attachTo(memory);

// also attach the accessToken model to a data source
User.accessToken.attachTo(memory);

// expose over the app's api
app.model(User);
```
    
**Note:** By default the `loopback.User` model uses the `loopback.AccessToken` model to persist access tokens. You can change this by setting the `accessToken` property.

**Note:** You must attach both the `User` and `User.accessToken` model's to a data source!
    
#### User Creation

Create a user like any other model.

```js
// username and password are not required
User.create({email: 'foo@bar.com', password: 'bar'}, function(err, user) {
  console.log(user);
});
```

#### Login a User

Create an `accessToken` for a user using the local auth strategy.

**Node.js**

```js
User.login({username: 'foo', password: 'bar'}, function(err, accessToken) {
  console.log(accessToken);
});
```
    
**REST**

You must provide a username and password over rest. To ensure these values are encrypted, include these as part of the body and make sure you are serving your app over https (through a proxy or using the https node server).

```
POST

  /users/login
  ...
  {
    "email": "foo@bar.com",
    "password": "bar"
  }

  ...

  200 OK
  {
    "sid": "1234abcdefg",
    "uid": "123"
  }
```

#### Logout a User

**Node.js**

```js
// login a user and logout
User.login({"email": "foo@bar.com", "password": "bar"}, function(err, accessToken) {
  User.logout(accessToken.id, function(err) {
    // user logged out
  });
});

// logout a user (server side only)
User.findOne({email: 'foo@bar.com'}, function(err, user) {
  user.logout();
});
```
    
**REST**

```
POST /users/logout
...
{
  "sid": "<accessToken id from user login>"
}
```

#### Verify Email Addresses

Require a user to verify their email address before being able to login. This will send an email to the user containing a link to verify their address. Once the user follows the link they will be redirected to `/` and be able to login normally.

```js
// first setup the mail datasource (see #mail-model for more info)
var mail = loopback.createDataSource({
  connector: loopback.Mail,
  transports: [{
    type: 'smtp',
    host: 'smtp.gmail.com',
    secureConnection: true,
    port: 465,
    auth: {
      user: 'you@gmail.com',
      pass: 'your-password'
    }
  }]
});

User.email.attachTo(mail);
User.requireEmailVerfication = true;
User.afterRemote('create', function(ctx, user, next) {
  var options = {
    type: 'email',
    to: user.email,
    from: 'noreply@myapp.com',
    subject: 'Thanks for Registering at FooBar',
    text: 'Please verify your email address!'
    template: 'verify.ejs',
    redirect: '/'
  };
  
  user.verify(options, next);
});
```

### Reset Password

You can implement password reset using the `User.resetPassword` method.

Request a password reset access token.

**Node.js**

```js
User.resetPassword({
  email: 'foo@bar.com'
}, function () {
  console.log('ready to change password');
});
```

**REST**

```
POST

  /users/reset-password
  ...
  {
    "email": "foo@bar.com"
  }
  ...
  200 OK
```

You must the handle the `resetPasswordRequest` event this on the server to
send a reset email containing an access token to the correct user. The
example below shows a basic setup for sending the reset email.

```
User.on('resetPasswordRequest', function (info) {
  console.log(info.email); // the email of the requested user
  console.log(info.accessToken.id); // the temp access token to allow password reset

  // requires AccessToken.belongsTo(User)
  info.accessToken.user(function (err, user) {
    console.log(user); // the actual user
    var emailData = {
      user: user,
      accessToken: accessToken
    };

    // this email should include a link to a page with a form to
    // change the password using the access token in the email
    Email.send({
      to: user.email,
      subject: 'Reset Your Password',
      text: loopback.template('reset-template.txt.ejs')(emailData),
      html: loopback.template('reset-template.html.ejs')(emailData)
    });
  });
});
```

### AccessToken Model

Identify users by creating accessTokens when they connect to your loopback app. By default the `loopback.User` model uses the `loopback.AccessToken` model to persist accessTokens. You can change this by setting the `accessToken` property.

```js
// define a custom accessToken model    
var MyAccessToken = loopback.AccessToken.extend('MyAccessToken');

// define a custom User model
var User = loopback.User.extend('user');

// use the custom accessToken model
User.accessToken = MyAccessToken;

// attach both AccessToken and User to a data source
User.attachTo(loopback.memory());
MyAccessToken.attachTo(loopback.memory());
```
    
### Email Model

Send emails from your loopback app.

```js
// extend a one-off model for sending email
var MyEmail = loopback.Email.extend('my-email');

// create a mail data source
var mail = loopback.createDataSource({
  connector: loopback.Mail,
  transports: [{
    type: 'smtp',
    host: 'smtp.gmail.com',
    secureConnection: true,
    port: 465,
    auth: {
      user: 'you@gmail.com',
      pass: 'your-password'
    }
  }]
});

// attach the model
MyEmail.attachTo(mail);

// send an email
MyEmail.send({
  to: 'foo@bar.com',
  from: 'you@gmail.com',
  subject: 'my subject',
  text: 'my text',
  html: 'my <em>html</em>'
}, function(err, mail) {
  console.log('email sent!');
});
```

> NOTE: the mail connector uses [nodemailer](http://www.nodemailer.com/). See 
> the [nodemailer docs](http://www.nodemailer.com/) for more info.
