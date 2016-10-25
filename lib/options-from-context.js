// Copyright IBM Corp. 2013,2016. All Rights Reserved.
// Node module: loopback
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

module.exports = buildOptionsFromRemotingContext;

function buildOptionsFromRemotingContext(ctx) {
  var accessToken = ctx.req.accessToken;
  var options = {
    remotingContext: ctx,
    accessToken: accessToken,
    currentUserId: accessToken ? accessToken.userId : null,
  };

  return options;
}
