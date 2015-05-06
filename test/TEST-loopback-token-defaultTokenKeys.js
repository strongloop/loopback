'use strict';
var 
  debug = require('debug')('AccessToken.app'),
  inspect = require('util').inspect;
/*
* TEST:Middleware:loopback.token.defaultTokenKeys
*/
module.exports = {
  api : {
    loopback: {
      token: {
        defaultTokenKeys: loopbackTokenDefaultTokenKeys
      }
    }
  }
}
var  
  loopback = require('../'),
  tokenId; // FIXME: a global until some other method is found

function loopbackTokenDefaultTokenKeys(testOptions, tokenOptions){
  var
    extend = require('util')._extend,
    Token = loopback.AccessToken.extend('MyToken'),
    lbDataSource = loopback.createDataSource({connector: loopback.Memory}),
    tokenCreate = {userId: '123'};

  Token.attachTo(lbDataSource);
  tokenOptions['model'] = Token;
  tokenOptions['currentUserLiteral'] = 'me';  
  
  Token.create(tokenCreate, function(err, token){
    if (err) return done(err);
    testOptions['tokenId'] = token.id;
    tokenId = testOptions['tokenId']; //FIXME
    testOptions['get'] = '/';
    var
      done = testOptions.done,
      expect = testOptions.expect,
      header = testOptions.header,
      get = testOptions.get,
      tokendId = testOptions.tokenId,
      app = createApp(testOptions, tokenOptions);
    request(app)
      .get(get)
      .set(header, tokenId)
      .expect(expect)
      .end(done);  
  });
}

// appGet is hard to work with just now: learning curve to get what looks right
function appGet(req,res){
    debug('appGet req.headers:\n'+inspect(req.headers)+'\n');
    debug('appGet req.accessToken:\n'+inspect(req.accessToken)+'\n');
    debug('appGet tokenId:\n'+tokenId+'\n');
    var 
      send = '200';
    try {
      assert(req.accessToken, 'req should have accessToken');
      assert(req.accessToken.id === tokenId);
    } catch (error) {
      debug('app.get error:\n'+error+'\n');
      send = '401';
    }
    debug('app.get send:\n'+send+'\n');
    res.send(send);  
}

function createApp(testOptions, tokenOptions) {
  debug('createApp tokenOptions.headers:\n'+inspect(tokenOptions.headers));
  var
    app = loopback(),
    ACL = loopback.ACL,
    acl = {
      principalType: 'ROLE',
      principalId: '$everyone',
      accessType: ACL.ALL,
      permission: ACL.DENY,
      property: 'deleteById'      
    },
    modelOptions = {acls: [acl]},
    get = testOptions.get;
    
  app.use(loopback.token(tokenOptions));
  app.get(get, appGet);
  app.use(loopback.rest()); //WHY: here
  app.enableAuth(); //WHY: here
  
  var // WHY: here
    TestModel = loopback.PersistedModel.extend('test', {}, modelOptions);
  TestModel.attachTo(loopback.memory());
  app.model(TestModel);
  
  return app;
}
