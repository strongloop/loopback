2015-01-16, Version 2.10.2
==========================

 * Make sure EXECUTE access type matches READ or WRITE (Raymond Feng)


2015-01-15, Version 2.10.1
==========================

 * Optimize the creation of handlers for rest (Raymond Feng)

 * Add a link to gitter chat (Raymond Feng)

 * Added context middleware (Rand McKinney)

 * Revert the peer dep change to avoid npm complaints (Raymond Feng)

 * Update strong-remoting dep (Raymond Feng)

 * Allow accessType per remote method (Raymond Feng)

 * Update juggler dep (Raymond Feng)

 * Fix Geo test cases (Raymond Feng)

 * Allow User.hashPassword/validatePassword to be overridden (Raymond Feng)

 * Use User.remoteMethod instead of loopbacks method This is needed for loopback-connector-remote authorization. Addresses https://github.com/strongloop/loopback/issues/622. (Berkeley Martinez)

 * API and REST tests added to ensure complete and valid credentials are supplied for verified error message to be returned  - tests added as suggested and fail under previous version of User model  - strongloop/loopback#931 (Ron Edgecomb)

 * Require valid login credentials before verified email check.  - strongloop/loopback#931. (Ron Edgecomb)


2015-01-07, Version 2.8.8
=========================



2015-01-07, Version 2.9.0
=========================



2015-01-07, Version 2.10.0
==========================

 * Revert the peer dep change to avoid npm complaints (Raymond Feng)

 * Update strong-remoting dep (Raymond Feng)

 * Allow accessType per remote method (Raymond Feng)

 * Update juggler dep (Raymond Feng)

 * Fix context middleware to preserve domains (Pham Anh Tuan)

 * Fix Geo test cases (Raymond Feng)

 * Allow User.hashPassword/validatePassword to be overridden (Raymond Feng)

 * Additional password reset unit tests for API and REST  - strongloop/loopback#944 (Ron Edgecomb)

 * Small formatting update to have consistency with identical logic in other areas.   - strongloop/loopback#944 (Ron Edgecomb)

 * Simplify the API test for invalidCredentials (removed create), move above REST calls for better grouping of tests   - strongloop/loopback#944 (Ron Edgecomb)

 * Force request to send body as string, this ensures headers aren't automatically set to application/json  - strongloop/loopback#944 (Ron Edgecomb)

 * Ensure error checking logic is in place for all REST calls, expand formatting for consistency with existing instances.  - strongloop/loopback#944 (Ron Edgecomb)

 * Correct invalidCredentials so that it differs from validCredentialsEmailVerified, unit test now passes as desired.  - strongloop/loopback#944 (Ron Edgecomb)

 * Update to demonstrate unit test is actually failing due to incorrect values of invalidCredentials  - strongloop/loopback#944 (Ron Edgecomb)

 * API and REST tests added to ensure complete and valid credentials are supplied for verified error message to be returned  - tests added as suggested and fail under previous version of User model  - strongloop/loopback#931 (Ron Edgecomb)

 * Require valid login credentials before verified email check.  - strongloop/loopback#931. (Ron Edgecomb)

 * fix jscs warning (Clark Wang)

 * fix nestRemoting is nesting hooks from other relations (Clark Wang)


2015-01-06, Version 2.8.7
=========================

 * Change urlNotFound.js to url-not-found.js (Rand McKinney)

 * Add lib/server-app.js (Rand McKinney)

 * package: add versioned sl-blip dependency (Ryan Graham)

 * fix User.settings.ttl can't be overridden in sub model (Clark Wang)

 * Fix Change.getCheckpointModel() giving new models each call (Farid Neshat)

 * Update README.md (Rand McKinney)


2014-12-15, Version 2.8.6
=========================

 * server-app: make _sortLayersByPhase stable (Miroslav Bajtoš)

 * Rework phased middleware, fix several bugs (Miroslav Bajtoš)


2014-12-12, Version 2.8.5
=========================

 * fix jshint errors (Clark Wang)

 * test if cb exists (Clark Wang)

 * fix nested remoting function throwing error will crash app (Clark Wang)

 * Fix bcrypt issues for browserify (Raymond Feng)


2014-12-08, Version 2.8.4
=========================

 * Allow native bcrypt for performance (Raymond Feng)


2014-12-08, Version 2.8.3
=========================

 * Remove unused underscore dependency (Ryan Graham)


2014-11-27, Version 2.8.2
=========================

 * Prepend slash for nested remoting paths (Clark Wang)

 * fix jscs errors (Rob Halff)

 * enable jshint for tests (Rob Halff)

 * permit some globals (Rob Halff)

 * 'done' is not defined (Rob Halff)

 * 'memory' is already defined (Rob Halff)

 * singlequote, semicolon & /*jshint -W030 */ (Rob Halff)


2014-11-25, Version 2.8.1
=========================

 * Update docs.json (Rand McKinney)

 * Update favicon.js (Rand McKinney)


2014-11-19, Version 2.8.0
=========================

 * Expose more loopback middleware for require (Raymond Feng)

 * Scope app middleware to a list of paths (Miroslav Bajtoš)

 * Update CONTRIBUTING.md (Alex Voitau)

 * Fix the model name for hasMany/through relation (Raymond Feng)

 * Fixing the model attach (wfgomes)

 * Minor: update jsdoc for PersistedModel.updateAll (Alex Voitau)

 * AccessToken: optional `options` in findForRequest (Miroslav Bajtoš)

 * server-app: improve jsdoc comments (Miroslav Bajtoš)

 * server-app: middleware API improvements (Miroslav Bajtoš)

 * typo of port server (wfgomes)

 * Move middleware sources to `server/middleware` (Miroslav Bajtoš)

 * app.middleware: verify serial exec of handlers (Miroslav Bajtoš)

 * Simplify `app.defineMiddlewarePhases` (Miroslav Bajtoš)

 * Make sure loopback has all properties from express (Raymond Feng)

 * Implement `app.defineMiddlewarePhases` (Miroslav Bajtoš)

 * Implement app.middlewareFromConfig (Miroslav Bajtoš)

 * middleware/token: store the token in current ctx (Miroslav Bajtoš)

 * Fix `loopback.getCurrentContext` (Miroslav Bajtoš)

 * Update chai to ^1.10.0 (Miroslav Bajtoš)

 * package: fix deps (Miroslav Bajtoš)

 * Middleware phases - initial implementation (Miroslav Bajtoš)

 * Allows ACLs/settings in model config (Raymond Feng)

 * Remove context middleware per Ritchie (Rand McKinney)

 * Add API doc for context middleware - see #337 (crandmck)

 * Update persisted-model.js (Rand McKinney)

 * rest middleware: clean up context config (Miroslav Bajtoš)

 * Move `context` example to a standalone app (Miroslav Bajtoš)

 * Enable the context middleware from loopback.rest (Raymond Feng)

 * Add context propagation middleware (Raymond Feng)

 * Changes to JSdoc comments (Rand McKinney)

 * Reorder classes alphabetically in each section (Rand McKinney)

 * common: coding style cleanup (Miroslav Bajtoš)

 * Coding style cleanup (Gruntfile, lib) (Miroslav Bajtoš)

 * Enable jscs for `lib`, fix style violations (Rob Halff)

 * Add access-context.js to API doc (Rand McKinney)

 * Remove doc for debug function (Rand McKinney)

 * Update registry.js (Rand McKinney)

 * Fix the jsdoc for User.login (Raymond Feng)

 * Deleted instantiation of new Change model. This PR removes the instantiation of a new change model as models return from Change.find are already instances of Change. This solves the duplicate Id issue #649 (Berkeley Martinez)

 * Expose path to the built-in favicon file (Miroslav Bajtoš)

 * Add API docs for `loopback.static`. (Miroslav Bajtoš)

 * Add test for `remoting.rest.supportedTypes` (Miroslav Bajtoš)

 * Revert "rest handler options" (Miroslav Bajtoš)

 * REST handler options. (Guilherme Cirne)

 * The elapsed time in milliseconds can be 0 (less than 1 ms) (Raymond Feng)


2014-10-27, Version 2.7.0
=========================

 * Bump version (Raymond Feng)

 * User: custom email headers in verify (Juan Pizarro)

 * Add realm support (Raymond Feng)

 * Make sure GET /:id/exists returns 200 {exists: true|false} https://github.com/strongloop/loopback/issues/679 (Raymond Feng)

 * Adjust id handling to deal with 0 and null (Chris S)

 * Force principalId to be a string. (Chris S)


2014-10-23, Version 2.6.0
=========================

 * User: fix `confirm` permissions (Miroslav Bajtoš)

 * Use === to compare with 0 (Rob Halff)

 * add laxbreak option (Rob Halff)

 * use singlequotes (Rob Halff)

 * split jshint task for test & lib (Rob Halff)

 * allow comma first style and increase line length (Rob Halff)

 * add missing semicolons (Rob Halff)

 * Support per-model and per-handler remoting options (Fabien Franzen)

 * Fix JSdoc for registerResolver (Rand McKinney)

 * lib/application: improve URL building algo (Miroslav Bajtoš)

 * Fix findById callback signature (Rand McKinney)

 * JSdoc fixes (Rand McKinney)

 * Fix places using undefined variables (Miroslav Bajtoš)

 * Clean up jsdoc comments (crandmck)

 * models: move Change LDL def into a json file (Miroslav Bajtoš)

 * models: move Checkpoint LDL def into a json file (Miroslav Bajtoš)

 * models: move Role LDL def into a json file (Miroslav Bajtoš)

 * models: move RoleMapping def into its own files (Miroslav Bajtoš)

 * models: move ACL LDL def into a json file (Miroslav Bajtoš)

 * models: move Scope def into its own files (Miroslav Bajtoš)

 * models: move AccessToken LDL def into a json file (Miroslav Bajtoš)

 * models: move Application LDL def into a json file (Miroslav Bajtoš)

 * models: move Email LDL def into `email.json` (Miroslav Bajtoš)

 * models: move User LDL def into `user.json` (Miroslav Bajtoš)

 * test: run more tests in the browser (Miroslav Bajtoš)

 * test: verify exported models (Miroslav Bajtoš)

 * test: remove infinite timeout (Miroslav Bajtoš)

 * Auto-load and register built-in `Checkpoint` model (Miroslav Bajtoš)

 * Skip static ACL entries that don't match the property (Raymond Feng)

 * Dismantle `lib/models`. (Miroslav Bajtoš)

 * Register built-in models in a standalone file (Miroslav Bajtoš)


2014-10-10, Version 2.4.1
=========================

 * models/change: fix `id` property definition (Miroslav Bajtoš)

 * Added class properties jsdoc. (Rand McKinney)

 * Fixed up JS Doc (Rand McKinney)

 * Update contribution guidelines (Ryan Graham)

 * Document ACL class properties (Rand McKinney)

 * Add properties JSdoc. (Rand McKinney)

 * Move looback remote connector to npm module (Krishna Raman)

 * Update strong-remoting version (Ritchie Martori)

 * Document user class properties (Ritchie Martori)

 * Add Model.disableRemoteMethod() (Ritchie Martori)


2014-09-12, Version 2.2.0
=========================

 * Bump versions (Raymond Feng)

 * PersistedModel: add remote method aliases (Miroslav Bajtoš)

 * Fix last commit, which misplaced an ACL. Move the ACL inside "acls". Signed-off-by: Carey Richard Murphey <rich@murphey.org> (zxvv)

 * Add an ACL to User, to allow everyone to execute User.passwordReset(). (zxvv)

 * package: add "web" keyword (Miroslav Bajtoš)

 * Fix require (Fabien Franzen)

 * Fix coercion for remoting on vanilla models (Ritchie Martori)

 * user#login include server crash fix (Alexander Ryzhikov)

 * Update model.js (Rand McKinney)

 * Restrict: only hasManyThrough relation can have additional properties (Clark Wang)

 * Restrict that only hasManyThrough can have additional properties (Clark Wang)

 * Add tests for hasManyThrough link with data (Clark Wang)

 * Support data field as body for link operation (Clark Wang)

 * Tiny fix: correct url format (Fabien Franzen)

 * Fix embedsMany/findById to return proper 404 response (Fabien Franzen)

 * registry: warn when dataSource is not specified (Miroslav Bajtoš)

 * Only validate dataSource when defined (Fixes #482) (Ritchie Martori)

 * Fix tests (Fabien Franzen)

 * Enable remoting for embedsOne relation (Jaka Hudoklin)

 * Allow 'where' argument for scoped count API (Fabien Franzen)

 * Account for undefined before/afterListeners (Fabien Franzen)

 * added test and fixed changing passed in object within ctor (britztopher)

 * adding the ability to use single or multiple email transports in datasources.json file (britztopher)

 * added the ability to use an array of transports or just a single trnasport (britztopher)


2014-08-18, Version 2.1.3
=========================

 * Bump version (Raymond Feng)

 * Make sure AccessToken extends from PersistedModel (Raymond Feng)

 * add count to relations and scopes (Jaka Hudoklin)

 * Remove `req.resume` from `app.enableAuth` (Miroslav Bajtoš)

 * Fix accessToken property docs (Ritchie Martori)

 * Make sure scoped methods are remoted (Raymond Feng)

 * Pass in remotingContext for ACL (Raymond Feng)

 * Fix reference to app (Raymond Feng)

 * Fix doc for the EXECUTE (Raymond Feng)

 * Don't assume relation.modelTo in case of polymorphic belongsTo (Fabien Franzen)

 * Fix "callbacl" by "callback" in doc (Steve Grosbois)

 * Inherit hooks when nesting (Fabien Franzen)

 * Changed options.path to options.http.path (Fabien Franzen)

 * filterMethod can also be a direct callback (Fabien Franzen)

 * filterMethod option (fn) to filter nested remote methods (Fabien Franzen)

 * Fix test to be more specific (Fabien Franzen)

 * Implement Model.nestRemoting (Fabien Franzen)

 * Allow custom relation path (http) - enable hasOne remoting access (Fabien Franzen)

 * Expose Model.exists over HTTP HEAD (Raymond Feng)

 * Return data source for app.dataSource() (Raymond Feng)

 * Fix typo in README (Ritchie Martori)

 * Integration test: referencesMany (Fabien Franzen)

 * Integration test: embedsMany (Fabien Franzen)

 * Fix jsdoc for remoteMethod() (Rand McKinney)

 * Map exists to HEAD for REST (Raymond Feng)

 * Fix https://github.com/strongloop/loopback/issues/413 (Raymond Feng)

 * Build the email verification url from app context (Raymond Feng)

 * Update test case to remove usage of deprecated express apis (Raymond Feng)

 * updated LB module diagram (altsang)

 * Update package.json (Al Tsang)

 * Updates for 2.0 (crandmck)

 * Update module diagram again (crandmck)

 * Update module diagram (crandmck)

 * Emit a 'modelRemoted' event by app.model() (Raymond Feng)

 * Fix remoting types for related models (Raymond Feng)

 * Fix for email transports (Raymond Feng)

 * Remove the link to obsolete wiki page to favor loopback.io (Raymond Feng)

 * Enhance the base model assertions (Raymond Feng)

 * Set up the base model based on the connector types (Raymond Feng)

 * express-middleware: improve error message (Miroslav Bajtoš)

 * Remove `app.docs()` (Miroslav Bajtoš)

 * Remove `loopback.compat.usePluralNamesForRemoting` (Miroslav Bajtoš)

 * Validate username uniqueness (Jaka Hudoklin)

 * Add descriptions for custom methods on user model (Raymond Feng)

 * Move remoting metadata from juggler to loopback (Raymond Feng)

 * Upgrade to nodemailer 1.0.1 (Raymond Feng)

 * 2.0.0-beta6 (Miroslav Bajtoš)

 * lib/application: publish Change models to REST API (Miroslav Bajtoš)

 * models/change: fix typo (Miroslav Bajtoš)

 * checkpoint: fix `current()` (Miroslav Bajtoš)

 * 2.0.0-beta5 (Miroslav Bajtoš)

 * 2.0.0-beta4 (Miroslav Bajtoš)

 * package: upgrade juggler to 2.0.0-beta2 (Miroslav Bajtoš)

 * Fix loopback in PhantomJS, fix karma tests (Miroslav Bajtoš)

 * Allow peer to use beta2 of datasource-juggler (and future) (Laurent)

 * Remove `app.boot` (Miroslav Bajtoš)

 * Fix remote method definition in client-server example (Ritchie Martori)

 * lib/registry: `getModel` throws, add `findModel` (Miroslav Bajtoš)

 * Remove loopback-explorer from dev deps (Miroslav Bajtoš)

 * Add loopback.version back (Miroslav Bajtoš)

 * registry: export DataSource class (Miroslav Bajtoš)

 * registry: fix non-unique default dataSources (Miroslav Bajtoš)

 * lib/registry fix jsdoc comments (Miroslav Bajtoš)

 * test: add debug logs (Miroslav Bajtoš)

 * refactor: extract runtime and registry (Miroslav Bajtoš)

 * Remove assertIsModel and isDataSource (Miroslav Bajtoš)

 * lib/loopback: fix jsdoc comments (Miroslav Bajtoš)

 * Add createModelFromConfig and configureModel() (Miroslav Bajtoš)

 * Rename DataModel to PersistedModel (Miroslav Bajtoš)

 * Make app.get/app.set available in browser (Miroslav Bajtoš)

 * Exclude express-middleware from browser bundle (Miroslav Bajtoš)

 * test: Remove forgotten call of `console.log()` (Miroslav Bajtoš)

 * Clean up express middleware dependencies (Raymond Feng)

 * Update strong-remoting dep (Raymond Feng)

 * Rename express-wrapper to express-middleware (Raymond Feng)

 * Clean up the tests (Raymond Feng)

 * Upgrade to Express 4.x (Raymond Feng)

 * Deprecate app.boot, remove app.installMiddleware (Miroslav Bajtoš)

 * 2.0.0-beta3 (Miroslav Bajtoš)

 * package.json: fix malformed json (Miroslav Bajtoš)

 * 2.0.0-beta2 (Ritchie Martori)

 * 2.0.0-beta1 (Ritchie Martori)

 * Add RC version (Ritchie Martori)

 * Depend on juggler@1.6.0 (Ritchie Martori)

 * !fixup Mark DAO methods as delegate (Ritchie Martori)

 * Ensure changes are created in sync (Ritchie Martori)

 * Remove un-rectify-able changes (Ritchie Martori)

 * Rework change conflict detection (Ritchie Martori)

 * - Use the RemoteObjects class to find remote objects instead of creating a cache  - Use the SharedClass class to build the remote connector  - Change default base model from Model to DataModel  - Fix DataModel errors not logging correct method names  - Use the strong-remoting 1.4 resolver API to resolve dynamic remote methods (relation api)  - Remove use of fn object for storing remoting meta data (Ritchie Martori)

 * In progress: rework remoting meta-data (Ritchie Martori)

 * Add test for conflicts where both deleted (Ritchie Martori)

 * Rework replication test (Ritchie Martori)

 * bump juggler version (Ritchie Martori)

 * Change#getModel(), Doc cleanup, Conflict event (Ritchie Martori)

 * Add error logging for missing data (Ritchie Martori)

 * Fix issues when using MongoDB for replication (Ritchie Martori)

 * !fixup Test cleanup (Ritchie Martori)

 * Move replication implementation to DataModel (Ritchie Martori)

 * All tests passing (Ritchie Martori)

 * !fixup use DataModel instead of Model for all data based models (Ritchie Martori)

 * fixup! unskip failing tests (Ritchie Martori)

 * !fixup RemoteConnector tests (Ritchie Martori)

 * Add missing test/model file (Ritchie Martori)

 * Refactor DataModel remoting (Ritchie Martori)

 * !fixup .replicate() argument handling (Ritchie Martori)

 * Fixes for e2e replication / remote connector tests (Ritchie Martori)

 * Add replication e2e tests (Ritchie Martori)

 * fixup! Assert model exists (Ritchie Martori)

 * fixup! rename Change.track => rectifyModelChanges (Ritchie Martori)

 * Add model tests (Ritchie Martori)

 * Add replication example (Ritchie Martori)

 * Add Checkpoint model and Model replication methods (Ritchie Martori)

 * Add Change model (Ritchie Martori)


2014-08-12, Version 1.10.1
==========================

 * Remove `req.resume` from `app.enableAuth` (Miroslav Bajtoš)


2014-08-08, Version 2.1.1
=========================

 * Bump version (Raymond Feng)

 * Make sure scoped methods are remoted (Raymond Feng)

 * Pass in remotingContext for ACL (Raymond Feng)

 * Fix reference to app (Raymond Feng)

 * Don't assume relation.modelTo in case of polymorphic belongsTo (Fabien Franzen)


2014-08-07, Version 2.1.0
=========================

 * Bump version (Raymond Feng)

 * Fix doc for the EXECUTE (Raymond Feng)

 * Fix "callbacl" by "callback" in doc (Steve Grosbois)

 * Inherit hooks when nesting (Fabien Franzen)

 * Changed options.path to options.http.path (Fabien Franzen)

 * filterMethod can also be a direct callback (Fabien Franzen)

 * filterMethod option (fn) to filter nested remote methods (Fabien Franzen)

 * Fix test to be more specific (Fabien Franzen)

 * Implement Model.nestRemoting (Fabien Franzen)

 * Allow custom relation path (http) - enable hasOne remoting access (Fabien Franzen)

 * Expose Model.exists over HTTP HEAD (Raymond Feng)

 * Return data source for app.dataSource() (Raymond Feng)

 * Fix typo in README (Ritchie Martori)

 * Integration test: referencesMany (Fabien Franzen)

 * Integration test: embedsMany (Fabien Franzen)

 * Fix jsdoc for remoteMethod() (Rand McKinney)

 * Map exists to HEAD for REST (Raymond Feng)

 * Build the email verification url from app context (Raymond Feng)


2014-07-27, Version 2.0.2
=========================

 * Fix https://github.com/strongloop/loopback/issues/413 (Raymond Feng)

 * Update test case to remove usage of deprecated express apis (Raymond Feng)


2014-07-26, Version 2.0.1
=========================

 * Bump version (Raymond Feng)

 * updated LB module diagram (altsang)

 * Update package.json (Al Tsang)

 * Updates for 2.0 (crandmck)

 * Update module diagram again (crandmck)

 * Update module diagram (crandmck)

 * Emit a 'modelRemoted' event by app.model() (Raymond Feng)

 * Fix remoting types for related models (Raymond Feng)

 * Fix for email transports (Raymond Feng)

 * Remove the link to obsolete wiki page to favor loopback.io (Raymond Feng)


2014-07-22, Version 2.0.0
=========================

 * Enhance the base model assertions (Raymond Feng)

 * Report error for User.confirm() (Raymond Feng)

 * Set up the base model based on the connector types (Raymond Feng)

 * express-middleware: improve error message (Miroslav Bajtoš)

 * Remove `app.docs()` (Miroslav Bajtoš)

 * Remove `loopback.compat.usePluralNamesForRemoting` (Miroslav Bajtoš)

 * Validate username uniqueness (Jaka Hudoklin)

 * Add descriptions for custom methods on user model (Raymond Feng)

 * Move remoting metadata from juggler to loopback (Raymond Feng)

 * Upgrade to nodemailer 1.0.1 (Raymond Feng)

 * Enhance the error message (Raymond Feng)

 * Bump version (Raymond Feng)

 * 2.0.0-beta6 (Miroslav Bajtoš)

 * lib/application: publish Change models to REST API (Miroslav Bajtoš)

 * models/change: fix typo (Miroslav Bajtoš)

 * checkpoint: fix `current()` (Miroslav Bajtoš)

 * 2.0.0-beta5 (Miroslav Bajtoš)

 * 2.0.0-beta4 (Miroslav Bajtoš)

 * package: upgrade juggler to 2.0.0-beta2 (Miroslav Bajtoš)

 * Fix loopback in PhantomJS, fix karma tests (Miroslav Bajtoš)

 * Allow peer to use beta2 of datasource-juggler (and future) (Laurent)

 * Remove `app.boot` (Miroslav Bajtoš)

 * Fix remote method definition in client-server example (Ritchie Martori)

 * lib/registry: `getModel` throws, add `findModel` (Miroslav Bajtoš)

 * Remove loopback-explorer from dev deps (Miroslav Bajtoš)

 * Add loopback.version back (Miroslav Bajtoš)

 * registry: export DataSource class (Miroslav Bajtoš)

 * registry: fix non-unique default dataSources (Miroslav Bajtoš)

 * lib/registry fix jsdoc comments (Miroslav Bajtoš)

 * test: add debug logs (Miroslav Bajtoš)

 * refactor: extract runtime and registry (Miroslav Bajtoš)

 * Remove assertIsModel and isDataSource (Miroslav Bajtoš)

 * lib/loopback: fix jsdoc comments (Miroslav Bajtoš)

 * Add createModelFromConfig and configureModel() (Miroslav Bajtoš)

 * Rename DataModel to PersistedModel (Miroslav Bajtoš)

 * Make app.get/app.set available in browser (Miroslav Bajtoš)

 * Exclude express-middleware from browser bundle (Miroslav Bajtoš)

 * test: Remove forgotten call of `console.log()` (Miroslav Bajtoš)

 * Clean up express middleware dependencies (Raymond Feng)

 * Update strong-remoting dep (Raymond Feng)

 * Rename express-wrapper to express-middleware (Raymond Feng)

 * Clean up the tests (Raymond Feng)

 * Upgrade to Express 4.x (Raymond Feng)

 * Deprecate app.boot, remove app.installMiddleware (Miroslav Bajtoš)

 * 2.0.0-beta3 (Miroslav Bajtoš)

 * package.json: fix malformed json (Miroslav Bajtoš)

 * 2.0.0-beta2 (Ritchie Martori)

 * 2.0.0-beta1 (Ritchie Martori)

 * Add RC version (Ritchie Martori)

 * Depend on juggler@1.6.0 (Ritchie Martori)

 * !fixup Mark DAO methods as delegate (Ritchie Martori)

 * Ensure changes are created in sync (Ritchie Martori)

 * Remove un-rectify-able changes (Ritchie Martori)

 * Rework change conflict detection (Ritchie Martori)

 * - Use the RemoteObjects class to find remote objects instead of creating a cache  - Use the SharedClass class to build the remote connector  - Change default base model from Model to DataModel  - Fix DataModel errors not logging correct method names  - Use the strong-remoting 1.4 resolver API to resolve dynamic remote methods (relation api)  - Remove use of fn object for storing remoting meta data (Ritchie Martori)

 * In progress: rework remoting meta-data (Ritchie Martori)

 * Add test for conflicts where both deleted (Ritchie Martori)

 * Rework replication test (Ritchie Martori)

 * bump juggler version (Ritchie Martori)

 * Change#getModel(), Doc cleanup, Conflict event (Ritchie Martori)

 * Add error logging for missing data (Ritchie Martori)

 * Fix issues when using MongoDB for replication (Ritchie Martori)

 * !fixup Test cleanup (Ritchie Martori)

 * Move replication implementation to DataModel (Ritchie Martori)

 * All tests passing (Ritchie Martori)

 * !fixup use DataModel instead of Model for all data based models (Ritchie Martori)

 * fixup! unskip failing tests (Ritchie Martori)

 * !fixup RemoteConnector tests (Ritchie Martori)

 * Add missing test/model file (Ritchie Martori)

 * Refactor DataModel remoting (Ritchie Martori)

 * !fixup .replicate() argument handling (Ritchie Martori)

 * Fixes for e2e replication / remote connector tests (Ritchie Martori)

 * Add replication e2e tests (Ritchie Martori)

 * fixup! Assert model exists (Ritchie Martori)

 * fixup! rename Change.track => rectifyModelChanges (Ritchie Martori)

 * Add model tests (Ritchie Martori)

 * Add replication example (Ritchie Martori)

 * Add Checkpoint model and Model replication methods (Ritchie Martori)

 * Add Change model (Ritchie Martori)


2014-07-16, Version 1.10.0
==========================



2014-07-16, Version 2.0.0-beta7
===============================

 * Bump version (Raymond Feng)

 * Remove unused dep (Raymond Feng)

 * Bump version and update deps (Raymond Feng)

 * Upgrade to loopback-datasource-juggler@1.7.0 (Raymond Feng)

 * Refactor modelBuilder to registry and set up default model (Raymond Feng)

 * Add a test case for credentials/challenges (Raymond Feng)

 * Fix credentials/challenges types (Raymond Feng)

 * Update modules for examples (Raymond Feng)

 * Split out aliases for deleteById and destroyAll functions for jsdoc. (crandmck)

 * Remove unused deps (Raymond Feng)

 * Refactor email verification tests into a new group (Raymond Feng)

 * Fix the typo (Raymond Feng)

 * Add an option to honor emailVerified (Raymond Feng)

 * Update module list in README (Raymond Feng)

 * Refine the test cases for relation REST APIs (Raymond Feng)

 * test: add check of Model remote methods (Miroslav Bajtoš)

 * Adjust the REST mapping for add/remove (Raymond Feng)

 * Add a test case for hasMany through add/remove remoting (Raymond Feng)

 * Fix the typo and add Bearer token support (Raymond Feng)

 * Update README (Raymond Feng)

 * Fix misleading token middleware documentation (Aleksandr Tsertkov)


2014-07-15, Version 2.0.0-beta6
===============================

 * 2.0.0-beta6 (Miroslav Bajtoš)

 * lib/application: publish Change models to REST API (Miroslav Bajtoš)

 * models/change: fix typo (Miroslav Bajtoš)

 * checkpoint: fix `current()` (Miroslav Bajtoš)


2014-07-03, Version 2.0.0-beta5
===============================

 * 2.0.0-beta5 (Miroslav Bajtoš)

 * app: update `url` on `listening` event (Miroslav Bajtoš)

 * 2.0.0-beta4 (Miroslav Bajtoš)

 * package: upgrade juggler to 2.0.0-beta2 (Miroslav Bajtoš)

 * Fix loopback in PhantomJS, fix karma tests (Miroslav Bajtoš)

 * Allow peer to use beta2 of datasource-juggler (and future) (Laurent)

 * Remove `app.boot` (Miroslav Bajtoš)

 * Fix remote method definition in client-server example (Ritchie Martori)

 * lib/registry: `getModel` throws, add `findModel` (Miroslav Bajtoš)

 * Remove loopback-explorer from dev deps (Miroslav Bajtoš)

 * Add loopback.version back (Miroslav Bajtoš)

 * registry: export DataSource class (Miroslav Bajtoš)

 * registry: fix non-unique default dataSources (Miroslav Bajtoš)

 * lib/registry fix jsdoc comments (Miroslav Bajtoš)

 * test: add debug logs (Miroslav Bajtoš)

 * refactor: extract runtime and registry (Miroslav Bajtoš)

 * Remove assertIsModel and isDataSource (Miroslav Bajtoš)

 * lib/loopback: fix jsdoc comments (Miroslav Bajtoš)

 * Add createModelFromConfig and configureModel() (Miroslav Bajtoš)

 * Rename DataModel to PersistedModel (Miroslav Bajtoš)

 * Make app.get/app.set available in browser (Miroslav Bajtoš)

 * Exclude express-middleware from browser bundle (Miroslav Bajtoš)

 * test: Remove forgotten call of `console.log()` (Miroslav Bajtoš)

 * Clean up express middleware dependencies (Raymond Feng)

 * Update strong-remoting dep (Raymond Feng)

 * Rename express-wrapper to express-middleware (Raymond Feng)

 * Clean up the tests (Raymond Feng)

 * Upgrade to Express 4.x (Raymond Feng)

 * Deprecate app.boot, remove app.installMiddleware (Miroslav Bajtoš)

 * 2.0.0-beta3 (Miroslav Bajtoš)

 * package.json: fix malformed json (Miroslav Bajtoš)

 * 2.0.0-beta2 (Ritchie Martori)

 * 2.0.0-beta1 (Ritchie Martori)

 * Add RC version (Ritchie Martori)

 * Depend on juggler@1.6.0 (Ritchie Martori)

 * !fixup Mark DAO methods as delegate (Ritchie Martori)

 * Ensure changes are created in sync (Ritchie Martori)

 * Remove un-rectify-able changes (Ritchie Martori)

 * Rework change conflict detection (Ritchie Martori)

 * - Use the RemoteObjects class to find remote objects instead of creating a cache  - Use the SharedClass class to build the remote connector  - Change default base model from Model to DataModel  - Fix DataModel errors not logging correct method names  - Use the strong-remoting 1.4 resolver API to resolve dynamic remote methods (relation api)  - Remove use of fn object for storing remoting meta data (Ritchie Martori)

 * In progress: rework remoting meta-data (Ritchie Martori)

 * Add test for conflicts where both deleted (Ritchie Martori)

 * Rework replication test (Ritchie Martori)

 * bump juggler version (Ritchie Martori)

 * Change#getModel(), Doc cleanup, Conflict event (Ritchie Martori)

 * Add error logging for missing data (Ritchie Martori)

 * Fix issues when using MongoDB for replication (Ritchie Martori)

 * !fixup Test cleanup (Ritchie Martori)

 * Move replication implementation to DataModel (Ritchie Martori)

 * All tests passing (Ritchie Martori)

 * !fixup use DataModel instead of Model for all data based models (Ritchie Martori)

 * fixup! unskip failing tests (Ritchie Martori)

 * !fixup RemoteConnector tests (Ritchie Martori)

 * Add missing test/model file (Ritchie Martori)

 * Refactor DataModel remoting (Ritchie Martori)

 * !fixup .replicate() argument handling (Ritchie Martori)

 * Fixes for e2e replication / remote connector tests (Ritchie Martori)

 * Add replication e2e tests (Ritchie Martori)

 * fixup! Assert model exists (Ritchie Martori)

 * fixup! rename Change.track => rectifyModelChanges (Ritchie Martori)

 * Add model tests (Ritchie Martori)

 * Add replication example (Ritchie Martori)

 * Add Checkpoint model and Model replication methods (Ritchie Martori)

 * Add Change model (Ritchie Martori)


2014-06-27, Version 1.9.1
=========================

 * Fix "ReferenceError: loopback is not defined" in registry.memory(). (Guilherme Cirne)

 * Invalid Access Token return 401 (Karl Mikkelsen)

 * Bump version and update deps (Raymond Feng)

 * Update debug setting (Raymond Feng)

 * Mark `app.boot` as deprecated. (Miroslav Bajtoš)

 * Update link to doc (Rand McKinney)


2014-06-26, Version 2.0.0-beta4
===============================

 * 2.0.0-beta4 (Miroslav Bajtoš)

 * package: upgrade juggler to 2.0.0-beta2 (Miroslav Bajtoš)

 * Fix loopback in PhantomJS, fix karma tests (Miroslav Bajtoš)

 * Allow peer to use beta2 of datasource-juggler (and future) (Laurent)

 * Remove `app.boot` (Miroslav Bajtoš)

 * Fix remote method definition in client-server example (Ritchie Martori)

 * lib/registry: `getModel` throws, add `findModel` (Miroslav Bajtoš)

 * Remove loopback-explorer from dev deps (Miroslav Bajtoš)

 * Add loopback.version back (Miroslav Bajtoš)

 * registry: export DataSource class (Miroslav Bajtoš)

 * registry: fix non-unique default dataSources (Miroslav Bajtoš)

 * lib/registry fix jsdoc comments (Miroslav Bajtoš)

 * test: add debug logs (Miroslav Bajtoš)

 * refactor: extract runtime and registry (Miroslav Bajtoš)

 * Remove assertIsModel and isDataSource (Miroslav Bajtoš)

 * lib/loopback: fix jsdoc comments (Miroslav Bajtoš)

 * Add createModelFromConfig and configureModel() (Miroslav Bajtoš)

 * Rename DataModel to PersistedModel (Miroslav Bajtoš)

 * Make app.get/app.set available in browser (Miroslav Bajtoš)

 * Exclude express-middleware from browser bundle (Miroslav Bajtoš)

 * test: Remove forgotten call of `console.log()` (Miroslav Bajtoš)

 * Clean up express middleware dependencies (Raymond Feng)

 * Update strong-remoting dep (Raymond Feng)

 * Rename express-wrapper to express-middleware (Raymond Feng)

 * Clean up the tests (Raymond Feng)

 * Upgrade to Express 4.x (Raymond Feng)

 * Deprecate app.boot, remove app.installMiddleware (Miroslav Bajtoš)

 * 2.0.0-beta3 (Miroslav Bajtoš)

 * package.json: fix malformed json (Miroslav Bajtoš)

 * 2.0.0-beta2 (Ritchie Martori)

 * 2.0.0-beta1 (Ritchie Martori)

 * Add RC version (Ritchie Martori)

 * Depend on juggler@1.6.0 (Ritchie Martori)

 * !fixup Mark DAO methods as delegate (Ritchie Martori)

 * Ensure changes are created in sync (Ritchie Martori)

 * Remove un-rectify-able changes (Ritchie Martori)

 * Rework change conflict detection (Ritchie Martori)

 * - Use the RemoteObjects class to find remote objects instead of creating a cache  - Use the SharedClass class to build the remote connector  - Change default base model from Model to DataModel  - Fix DataModel errors not logging correct method names  - Use the strong-remoting 1.4 resolver API to resolve dynamic remote methods (relation api)  - Remove use of fn object for storing remoting meta data (Ritchie Martori)

 * In progress: rework remoting meta-data (Ritchie Martori)

 * Add test for conflicts where both deleted (Ritchie Martori)

 * Rework replication test (Ritchie Martori)

 * bump juggler version (Ritchie Martori)

 * Change#getModel(), Doc cleanup, Conflict event (Ritchie Martori)

 * Add error logging for missing data (Ritchie Martori)

 * Fix issues when using MongoDB for replication (Ritchie Martori)

 * !fixup Test cleanup (Ritchie Martori)

 * Move replication implementation to DataModel (Ritchie Martori)

 * All tests passing (Ritchie Martori)

 * !fixup use DataModel instead of Model for all data based models (Ritchie Martori)

 * fixup! unskip failing tests (Ritchie Martori)

 * !fixup RemoteConnector tests (Ritchie Martori)

 * Add missing test/model file (Ritchie Martori)

 * Refactor DataModel remoting (Ritchie Martori)

 * !fixup .replicate() argument handling (Ritchie Martori)

 * Fixes for e2e replication / remote connector tests (Ritchie Martori)

 * Add replication e2e tests (Ritchie Martori)

 * fixup! Assert model exists (Ritchie Martori)

 * fixup! rename Change.track => rectifyModelChanges (Ritchie Martori)

 * Add model tests (Ritchie Martori)

 * Add replication example (Ritchie Martori)

 * Add Checkpoint model and Model replication methods (Ritchie Martori)

 * Add Change model (Ritchie Martori)


2014-06-25, Version 1.9.0
=========================

 * Bump version and update deps (Raymond Feng)

 * Update debug setting (Raymond Feng)

 * Mark `app.boot` as deprecated. (Miroslav Bajtoš)

 * Update link to doc (Rand McKinney)

 * Update juggler dep (Raymond Feng)

 * Remove relationNameFor (Raymond Feng)

 * Fix a slowdown caused by mutation of an incoming accessToken option. (Samuel Reed)

 * package: the next version will be a minor version (Miroslav Bajtoš)

 * lib/application: Remove forgotten `loopback` ref (Miroslav Bajtoš)

 * Allow customization of ACL http status (Karl Mikkelsen)

 * Expose loopback as `app.loopback` (Miroslav Bajtoš)

 * registry: export DataSource class (Miroslav Bajtoš)

 * registry: fix non-unique default dataSources (Miroslav Bajtoš)

 * lib/registry fix jsdoc comments (Miroslav Bajtoš)

 * test: add debug logs (Miroslav Bajtoš)

 * refactor: extract runtime and registry (Miroslav Bajtoš)

 * Remove assertIsModel and isDataSource (Miroslav Bajtoš)

 * Add createModelFromConfig and configureModel() (Miroslav Bajtoš)

 * Make app.get/app.set available in browser (Miroslav Bajtoš)

 * package: upgrade Mocha to 1.20 (Miroslav Bajtoš)

 * test: fix ACL integration tests (Miroslav Bajtoš)

 * JSDoc fixes (crandmck)

 * Add a test case (Raymond Feng)

 * Set the role id to be generated (Raymond Feng)

 * Tidy up app.model() to remove duplicate & recusrive call (Raymond Feng)

 * Register existing model to app.models during app.model() (Raymond Feng)

 * JSDoc cleanup (crandmck)

 * Bump version so that we can republish (Raymond Feng)


2014-06-09, Version 1.8.6
=========================

 * Bump version (Raymond Feng)

 * Use constructor to reference the model class (Raymond Feng)

 * Allow the creation of access token to be overriden (Raymond Feng)

 * Fixup JSDocs; note: updateOrCreate function alias pulled out on separate line for docs (crandmck)

 * Added middleware and API doc headings (crandmck)

 * Update JSDoc (crandmck)

 * Update docs.json (Rand McKinney)

 * Removed old .md files from API docs (Rand McKinney)

 * Delete api-model.md (Rand McKinney)

 * Delete api-datasource.md (Rand McKinney)

 * Delete api-geopoint.md (Rand McKinney)

 * Remove duplicate doc content (Rand McKinney)

 * Add note about unavailable args to remote hooks. (Rand McKinney)

 * Undo incorrect changes I made -- per Ritchie (Rand McKinney)

 * Update strong-remoting to 1.5 (Ritchie Martori)

 * Remove "user" as arg to beforeRemote(..) (Rand McKinney)

 * !fixup only set ctx.accessType when sharedMethod is available (Ritchie Martori)

 * Refactor ACL to allow for `methodNames` / aliases (Ritchie Martori)

 * Update README and the module diagram (Raymond Feng)


2014-05-28, Version 2.0.0-beta3
===============================

 * 2.0.0-beta3 (Miroslav Bajtoš)

 * package.json: fix malformed json (Miroslav Bajtoš)

 * app: implement `connector()` and `connectors` (Miroslav Bajtoš)

 * Fix a typo in `app.boot`. (Samuel Reed)

 * 2.0.0-beta2 (Ritchie Martori)

 * 2.0.0-beta1 (Ritchie Martori)

 * Bump version (Raymond Feng)

 * Add postgresql to the keywords (Raymond Feng)

 * updated package.json with SOAP and framework keywords (altsang)

 * updated package.json with keywords and updated description (Raymond Feng)

 * Make app.datasources unique per app instance (Miroslav Bajtoš)

 * Add RC version (Ritchie Martori)

 * Depend on juggler@1.6.0 (Ritchie Martori)

 * !fixup Mark DAO methods as delegate (Ritchie Martori)

 * Ensure changes are created in sync (Ritchie Martori)

 * Remove un-rectify-able changes (Ritchie Martori)

 * Rework change conflict detection (Ritchie Martori)

 * - Use the RemoteObjects class to find remote objects instead of creating a cache  - Use the SharedClass class to build the remote connector  - Change default base model from Model to DataModel  - Fix DataModel errors not logging correct method names  - Use the strong-remoting 1.4 resolver API to resolve dynamic remote methods (relation api)  - Remove use of fn object for storing remoting meta data (Ritchie Martori)

 * In progress: rework remoting meta-data (Ritchie Martori)

 * Add test for conflicts where both deleted (Ritchie Martori)

 * Rework replication test (Ritchie Martori)

 * bump juggler version (Ritchie Martori)

 * Change#getModel(), Doc cleanup, Conflict event (Ritchie Martori)

 * Add error logging for missing data (Ritchie Martori)

 * Fix issues when using MongoDB for replication (Ritchie Martori)

 * !fixup Test cleanup (Ritchie Martori)

 * Move replication implementation to DataModel (Ritchie Martori)

 * All tests passing (Ritchie Martori)

 * !fixup use DataModel instead of Model for all data based models (Ritchie Martori)

 * fixup! unskip failing tests (Ritchie Martori)

 * !fixup RemoteConnector tests (Ritchie Martori)

 * Add missing test/model file (Ritchie Martori)

 * Refactor DataModel remoting (Ritchie Martori)

 * !fixup .replicate() argument handling (Ritchie Martori)

 * Fixes for e2e replication / remote connector tests (Ritchie Martori)

 * Add replication e2e tests (Ritchie Martori)

 * fixup! Assert model exists (Ritchie Martori)

 * fixup! rename Change.track => rectifyModelChanges (Ritchie Martori)

 * Add model tests (Ritchie Martori)

 * Add replication example (Ritchie Martori)

 * Add Checkpoint model and Model replication methods (Ritchie Martori)

 * Add Change model (Ritchie Martori)


2014-05-27, Version 1.8.4
=========================



2014-05-27, Version 1.8.5
=========================

 * Bump version (Raymond Feng)

 * Add postgresql to the keywords (Raymond Feng)

 * updated package.json with SOAP and framework keywords (altsang)

 * updated package.json with keywords and updated description (Raymond Feng)

 * Add more keywords (Raymond Feng)

 * app: flatten model config (Miroslav Bajtoš)

 * Fix the test for mocha 1.19.0 (Raymond Feng)

 * Update dependencies (Raymond Feng)

 * Added more keywords (Rand McKinney)

 * Update README and the module diagram (Raymond Feng)

 * added "REST API" keyword (Rand McKinney)

 * added 'web' and 'framework' keywords (Rand McKinney)

 * Make image URL absolute for npmjs.org. (Rand McKinney)

 * Use common syntax for juggler dep (Ritchie Martori)

 * Modify `loopback.rest` to include `loopback.token` (Miroslav Bajtoš)

 * Relax validation object test (Ritchie Martori)

 * Make juggler version a bit more strict to avoid pulling in breaking changes (Ritchie Martori)

 * Change module diagram to local png (Rand McKinney)

 * Add LoopBack modules diagram (crandmck)

 * Update README.md (sumitha)

 * Update README.md (Al Tsang)

 * added github prefix to path (altsang)

 * removed githalytics, added sl-beacon (altsang)

 * Update README and license link (Raymond Feng)

 * Add CLA (Raymond Feng)


2014-05-16, Version 1.8.2
=========================

 * test/geo-point: relax too precise assertions (Miroslav Bajtoš)

 * Fix typo "Unkown" => "Unknown" (Adam Schwartz)

 * Support all 1.x versions of datasource-juggler (Miroslav Bajtoš)

 * Remove validation methods, now covered in JSDoc. (Rand McKinney)

 * Remove docs/api-geopoint.md from docs (Rand McKinney)

 * Removed docs/api-datasource.md (Rand McKinney)

 * Update README.md (Al Tsang)

 * Update README.md (Rand McKinney)

 * Move content from wiki on LB modules. (Rand McKinney)

 * Add homepage to package.json (Ritchie Martori)

 * Fix bug in User#resetPassword (haio)

 * Fix client-server example (Ritchie Martori)

 * Ensure roleId and principalId to be string in Role#isInRole (haio)

 * typo (haio)

 * Add more check on principalId (haio)

 * Convert principalId to String (haio)


2014-04-24, Version 1.8.1
=========================

 * Bump version (Raymond Feng)

 * Fix constructor JSDoc (crandmck)

 * Remove intermediate section headers from nav (crandmck)

 * Rename the method so that it won't conflict with Model.checkAccess (Raymond Feng)

 * Fix/remove ctx.user documentation (Ritchie Martori)

 * Documentation cleanup (Ritchie Martori)

 * Fix save implementation for remoting connector (Ritchie Martori)

 * Add basic Remote connector e2e test (Ritchie Martori)

 * Bump juggler version (Ritchie Martori)

 * Add test for remoting nested hidden properties (Ritchie Martori)

 * Fix #229 (Whitespaces removed (Alex Pica)

 * Add nodemailer to browser ignores (Ritchie Martori)

 * Add an assertion to the returned store object (Raymond Feng)

 * Add an integration test for belongsTo remoting (Raymond Feng)

 * Depend on strong-remoting 1.3 (Ritchie Martori)

 * Support host / port in Remote connector (Ritchie Martori)

 * Throw useful errors in DataModel stub methods (Ritchie Martori)

 * Move proxy creation from remote connector into base model class (Ritchie Martori)

 * Remove reload method body (Ritchie Martori)

 * Add Remote connector (Ritchie Martori)

 * Initial client-server example (Ritchie Martori)


2014-04-04, Version 1.7.4
=========================

 * Clean up JSDoc comments.  Remove doc for deprecated installMiddleware function (crandmck)

 * Describe the "id" parameter of model's sharedCtor (Miroslav Bajtoš)

 * Update and cleanup JSDoc (crandmck)

 * Cleanup and update of jsdoc (crandmck)

 * Add link to loopback.io (Rand McKinney)

 * Update user.js (Doug Toppin)

 * Add hidden property documentation (Ritchie Martori)

 * test: add hasAndBelongsToMany integration test (Miroslav Bajtoš)

 * fix to enable ACL for confirm link sent by email (Doug Toppin)

 * Add hidden property support to models (Ritchie Martori)

 * Allow app.model() to accept a DataSource instance (Ritchie Martori)

 * Make verifications url safe (Ritchie Martori)

 * Try to fix  org.pegdown.ParsingTimeoutException (Rand McKinney)

 * using base64 caused an occasional token string to contain '+' which resulted in a space being embedded in the token.  'hex' should always produce a url safe string for the token. (Doug Toppin)

 * Sending email was missing the from field (Doug Toppin)


2014-03-19, Version 1.7.2
=========================

 * Bump version (Raymond Feng)

 * Add more comments (Raymond Feng)

 * Improve the ACL matching algorithm (Raymond Feng)


2014-03-18, Version 1.7.1
=========================

 * Add test for request pausing during authentication (Miroslav Bajtoš)

 * Pause the req before checking access (Raymond Feng)

 * Remove the generated flag as the id is set by the before hook (Raymond Feng)

 * Improvements to JSDoc comments (crandmck)

 * Fixes to JSDoc for API docs (crandmck)

 * Remove oauth2 models as they will be packaged in a separate module (Raymond Feng)

 * Update api-model.md (Rand McKinney)

 * Minor doc fix (Ritchie Martori)

 * Set the correct status code for User.login (Raymond Feng)


2014-02-21, Version 1.7.0
=========================

 * Bump version to 1.7.0 (Raymond Feng)

 * Update deps (Raymond Feng)

 * Bump version and update deps (Raymond Feng)

 * Rewrite test for clear handler cache. (Guilherme Cirne)

 * Allows options to be passed to strong-remoting (Raymond Feng)

 * Remove coercion from port check (Ritchie Martori)

 * The simplest possible solution for clearing the handler cache when registering a model. (Guilherme Cirne)

 * Remove outdated test readme (Ritchie Martori)

 * Remove unnecessary lines (Alberto Leal)

 * Update the license text (Raymond Feng)

 * Make sure User/AccessToken relations are set up by default (Raymond Feng)

 * Remove unused karma packages (Ritchie Martori)

 * Add karma for running browser tests (Ritchie Martori)

 * Dual license: MIT + StrongLoop (Raymond Feng)


2014-02-12, Version 1.6.2
=========================

 * Bump version and update deps (Raymond Feng)

 * Documentation (generated) fix (Aurelien Chivot)

 * Use hex encoding for application ids/keys (Raymond Feng)

 * Add app.isAuthEnabled. (Miroslav Bajtoš)

 * Make app.models unique per app instance (Miroslav Bajtoš)

 * Fix incorrect usage of `app` in app.test.js (Miroslav Bajtoš)

 * Make sure the configured ACL submodel is used (Raymond Feng)


2014-01-30, Version 1.6.1
=========================

 * Add `include=user` param to `User.login` (Miroslav Bajtoš)

 * Describe `access_token` param of `User.logout` (Miroslav Bajtoš)

 * Remove the generated flag for access token id (Raymond Feng)

 * Remove message prefix as debug will print it (Raymond Feng)

 * Add debug information for user.login (Raymond Feng)


2014-01-27, Version 1.6.0
=========================

 * Update dependencies (Miroslav Bajtoš)

 * Add loopback.compat to simplify upgrade to 1.6 (Miroslav Bajtoš)

 * Register exported models using singular names (Miroslav Bajtoš)

 * User: use User.http.path (Miroslav Bajtoš)


2014-01-23, Version 1.5.3
=========================

 * Bump version (Raymond Feng)

 * Add a test for autoAttach (Raymond Feng)

 * Fix the Role ref to RoleMapping (Raymond Feng)

 * Fix the Scope reference to models (Raymond Feng)

 * Lookup the email model (Raymond Feng)

 * Add lookback.getModelByType() and use it resolve model deps (Raymond Feng)

 * Fix user test race condition (Ritchie Martori)

 * Fix race condition where MyEmail model was not attached to the correct dataSource in tests (Ritchie Martori)

 * Fix the method args (Raymond Feng)

 * Fix the typo for the method name (Raymond Feng)

 * Small change to text webhook. (Rand McKinney)

 * Minor wording change for testing purposes. (Rand McKinney)

 * Fix capitalization and punctuation. (Rand McKinney)

 * Minor wording cleanup. (Rand McKinney)

 * Prevent autoAttach from overriding existing data source (Raymond Feng)


2014-01-17, Version 1.5.2
=========================

 * Bump version (Raymond Feng)

 * Clean up loopback.js doc and add it to docs.json (Raymond Feng)

 * Fix the jsdoc for loopback.getModel() (Raymond Feng)

 * Make sure defaultPermission is checked (Raymond Feng)

 * Remove the dangling require (Raymond Feng)

 * Make ACL model subclassing friendly (Raymond Feng)

 * Fix heading levels in docs/ markdown files. (Miroslav Bajtoš)

 * Remove docs/rest.md (Miroslav Bajtoš)

 * Improve jsdox documentation of app object (Miroslav Bajtoš)

 * Make sure methods are called in the context of the calling class (Raymond Feng)

 * Start to move md to jsdoc (Ritchie Martori)


2014-01-14, Version 1.5.0
=========================



2014-01-14, Version 1.5.1
=========================

 * Bump version (Raymond Feng)

 * Make sure methods are called in the context of the calling class (Raymond Feng)

 * Start to move md to jsdoc (Ritchie Martori)

 * Replace `on` with `once` in middleware examples (Miroslav Bajtoš)

 * Fix incorrect transports (Ritchie Martori)

 * Speed up tests accessing User.password (Miroslav Bajtoš)

 * Describe loopback.ValidationError in API docs. (Miroslav Bajtoš)

 * Implement app.installMiddleware (Miroslav Bajtoš)

 * Implement `app.listen` (Miroslav Bajtoš)

 * Provide sane default for email connector transports (Ritchie Martori)

 * Add an empty transportsIndex to the mail connector by default (Ritchie Martori)

 * Add missing assert in user model (Ritchie Martori)

 * docs: document remote method `description` (Miroslav Bajtoš)


2014-01-07, Version 1.4.2
=========================

 * Bump version (Raymond Feng)

 * Add app.restApiRoot setting (Miroslav Bajtoš)

 * Fix links so they work on apidocs site. (Rand McKinney)

 * Add ValidationError to loopback exports. (Miroslav Bajtoš)

 * Add API docs to README (Ritchie Martori)

 * Fixed some broken links and added ACL example in createModel() (Rand McKinney)


2013-12-20, Version 1.4.1
=========================

 * Explicitly depend on juggler@1.2.11 (Ritchie Martori)

 * Add e2e tests for relations (Ritchie Martori)

 * Fix destroyAll reference (Ritchie Martori)

 * Add reference documentation using sdocs (Ritchie)

 * Update README for application model (Raymond Feng)


2013-12-18, Version 1.4.0
=========================

 * app.boot() now loads the "boot" directory (Ritchie Martori)

 * Clean up the test case (Raymond Feng)

 * Remove the default values for gateway/port (Raymond Feng)

 * Reformat the code using 2 space identation (Raymond Feng)

 * Allow cert/key data to be shared by push/feedback (Raymond Feng)

 * fixup - Include accessToken in user logout tests (Ritchie Martori)

 * Logout now automatically pulls the accessToken from the request (Ritchie Martori)

 * Fix tests depending on old behavior of default User ACLs (Ritchie Martori)

 * Add default user ACLs (Ritchie Martori)

 * Define schema for GCM push-notification settings (Miroslav Bajtoš)

 * Improve debug statements for access control (Ritchie Martori)


2013-12-13, Version 1.3.4
=========================

 * Dont attempt access checking on models without a check access method (Ritchie Martori)

 * App config settings are now available from app.get() (Ritchie Martori)

 * Fix user not allowed to delete itself if user (Ritchie Martori)

 * Only look at cookies if they are available (Ritchie Martori)

 * Remove the empty comment and set default token (Raymond Feng)

 * Refactor to the code use wrapper classes (Raymond Feng)

 * Enhance getRoles() to support smart roles (Raymond Feng)

 * Fix the algorithm for Role.isInRole and ACL.checkAccess (Raymond Feng)

 * Various ACL fixes (Ritchie Martori)

 * Add user default ACLs (Ritchie Martori)

 * Allow requests without auth tokens (Ritchie Martori)

 * Fix base class not being actual base class (Ritchie Martori)

 * Fix the ACL resolution against rules by matching score (Raymond Feng)

 * Add access type checking (Ritchie Martori)

 * Add Model.requireToken for disabling token requirement (Ritchie Martori)

 * Add Model.requireToken, default swagger to false (Ritchie Martori)

 * Add password reset (Ritchie Martori)


2013-12-06, Version 1.3.3
=========================

 * Bump version (Raymond Feng)


2013-12-06, Version show
========================

 * Bump version (Raymond Feng)

 * Make loopback-datasource-juggler a peer dep (Raymond Feng)

 * Add blank line before list so it lays out properly. (Rand McKinney)

 * Fix list format and minor wording fix. (Rand McKinney)

 * Small fix to link text (Rand McKinney)

 * Minor formatting and wording fixes. (Rand McKinney)

 * docs: describe http mapping of arguments (Miroslav Bajtos)


2013-12-05, Version 1.3.2
=========================

 * Bump version (Ritchie)

 * SLA-725 support PORT and HOST environment for PaaS support (Ritchie)


2013-12-04, Version 1.3.1
=========================

 * Fix the test assertion as the error message is changed. (Raymond Feng)

 * Bump version (Raymond Feng)

 * Remove superfluous head1 (Rand McKinney)

 * Fixed some list formatting issues. (Rand McKinney)

 * Fix list formats to play well with wiki markdown macro. (Rand McKinney)

 * Minor reformatting. (Rand McKinney)

 * Sadly, HTML table format is unusable in documentation wiki.  Revert to lame md format. (Rand McKinney)

 * Reformat table for /find operation arguments (Rand McKinney)

 * Deleted extra space that foiled bold formatting (Rand McKinney)

 * Changed h3's to bold text to avoid generating items in TOC (Rand McKinney)

 * Fixed erroneous heading level (Rand McKinney)

 * Use loopback.AccessToken as default (Ritchie Martori)

 * Fix missing assert (Ritchie Martori)

 * Minor formatting fixes to make it play well in wiki (Rand McKinney)

 * Initial auth implementation (Ritchie Martori)

 * added Google Analytics to README.md to test tracking (altsang)

 * Delete types.md (Rand McKinney)

 * Delete resources.md (Rand McKinney)

 * Delete quickstart.md (Rand McKinney)

 * Delete js.md (Rand McKinney)

 * Delete java.md (Rand McKinney)

 * Delete ios.md (Rand McKinney)

 * Delete gettingstarted.md (Rand McKinney)

 * Delete concepts.md (Rand McKinney)

 * Delete cli.md (Rand McKinney)

 * Delete bundled-models.md (Rand McKinney)

 * Delete apiexplorer.md (Rand McKinney)

 * Delete intro.md (Rand McKinney)

 * Add .jshintignore (Miroslav Bajtos)

 * Add test for findById returning 404 (Miroslav Bajtos)

 * Fix minor autoWiring bugs (Ritchie Martori)

 * Add unauthenticated role (Raymond Feng)

 * Add checkAccess for subject and token (Raymond Feng)

 * Start to support smart roles such as owner (Raymond Feng)

 * Add jshint configuration. (Miroslav Bajtos)

 * Update rest.md (Rand McKinney)

 * Update api.md (Rand McKinney)

 * Add status middleware (Ritchie Martori)

 * Auto attach all models created (Ritchie Martori)

 * Update docs.json (Rand McKinney)

 * Add loopback.urlNotFound() middleware. (Miroslav Bajtos)

 * Remove .attachTo() from tests (Ritchie Martori)

 * Create api-model-remote.md (Rand McKinney)

 * Create api-model.md (Rand McKinney)

 * Create api-geopoint.md (Rand McKinney)

 * Create api-datasource.md (Rand McKinney)

 * Create api-app.md (Rand McKinney)

 * Debugging odd defineFK behavior (Ritchie Martori)

 * Update the doc link (Raymond Feng)

 * Initial auto wiring for model dataSources (Ritchie Martori)

 * Add public flag checking (Ritchie Martori)


2013-11-18, Version 1.3.0
=========================

 * Upgrade nodemailer (Ritchie Martori)

 * Bump minor version (Ritchie Martori)

 * Add LoopBack forum link (Raymond Feng)

 * Remove blanket (Raymond Feng)

 * Switch to modelBuilder (Raymond Feng)

 * Allow ACLs for methods/relations (Raymond Feng)

 * Allows LDL level ACLs (Raymond Feng)

 * Update dependencies (Raymond Feng)

 * Fix the permission resolution (Raymond Feng)

 * Simplify check permission (Raymond Feng)

 * Fix the permission check (Raymond Feng)

 * Add oauth2 related models (Raymond Feng)

 * Add a stub to register role resolvers (Raymond Feng)

 * Add tests for isInRole and getRoles (Raymond Feng)

 * Add constants and more tests (Raymond Feng)

 * Define the models/relations for ACL (Raymond Feng)

 * Start to build the ACL models (Raymond Feng)

 * Update acl/role models (Raymond Feng)

 * Update ACL model (Raymond Feng)

 * Update AccessToken and User relationship (Ritchie Martori)

 * Added AccessToken created property (Ritchie Martori)

 * Update session / token documentation (Ritchie Martori)

 * Add loopback.token() middleware (Ritchie Martori)

 * Rename Session => AccessToken (Ritchie)

 * Bump verison (Ritchie Martori)

 * Fix bundle model name casing (Ritchie Martori)

 * Remove old node versions from travis (Ritchie Martori)

 * Add explicit Strong-remoting dep version (Ritchie Martori)

 * Add travis (Ritchie Martori)

 * Bump version (Ritchie Martori)

 * Update "hasMany" example (Ritchie Martori)

 * Code review fixes based on feedback from https://github.com/strongloop/loopback/pull/57 (Ritchie Martori)

 * Automatically convert strings to connectors if they are LoopBack connectors (Ritchie Martori)

 * Update api.md (Rand McKinney)

 * Update docs.json (Rand McKinney)

 * Create types.md (Rand McKinney)

 * Create bundled-models.md (Rand McKinney)

 * Update java.md (Rand McKinney)

 * Add app.dataSource() method (Ritchie)

 * Add app.boot() (Ritchie Martori)

 * README updates (Ritchie Martori)

 * Remove the proxy as it is now handled by the juggler (Raymond Feng)

 * Add MySQL connector (Raymond Feng)

 * Add belongsTo and hasAndBelongsToMany (Raymond Feng)

 * Clean up the model (Raymond Feng)

 * Added link to Doxygen API docs. (Rand McKinney)

 * Refactor email model into mail connector (Ritchie Martori)

 * Update Application model for the push notification (Raymond Feng)

 * Fix missing assert module (Ritchie Martori)

 * Fix the test as DAO now ignores undefined value for query (Raymond Feng)

 * Simplified LB architecture diagram (crandmck)

 * reorg and rewriting of first part of LoopBack guide, with new diagram (crandmck)

 * Fix the id and property access (Raymond Feng)

 * Update remote method example (Ritchie)

 * Update intro.md (Rand McKinney)

 * Update rest.md (Rand McKinney)

 * more cleanup (altsang)

 * remove >>>>>> from bad merge (altsang)

 * merged in Schoons' changes to mobile clients section (altsang)

 * revised per Ritchie's comments (altsang)

 * Revise Mobile Clients copy. (Michael Schoonmaker)

 * added Matt S' section on Mobile Clients (altsang)

 * filled out Big Picture (altsang)

 * revised shell -> node.js api (altsang)

 * Fix the preposition (Raymond Feng)

 * One more fix based on the comment (Raymond Feng)

 * Drop sure (Raymond Feng)

 * Add the missing article (Raymond Feng)

 * Add section for api explorer to docs (Raymond Feng)

 * added apiexplorer placeholder and big picture (altsang)

 * removed 'the' before StrongLoop Suite (altsang)

 * Remove redundant version in docs and testing docs webhook (Ritchie Martori)

 * removed version text (altsang)

 * Add keywords to package.json (Raymond Feng)

 * Add repo (Raymond Feng)

 * Finalize package.json for sls-1.0.0 (Raymond Feng)

 * Update docs for api->project rename. (Michael Schoonmaker)


2013-09-12, Version strongloopsuite-1.0.0-5
===========================================



2013-09-12, Version strongloopsuite-1.0.0-4
===========================================

 * Update docs for api->project rename. (Michael Schoonmaker)

 * Use a pure JS bcrypt (Ritchie)

 * Added little boxes to Getting Started. (Michael Schoonmaker)


2013-09-11, Version strongloopsuite-1.0.0-3
===========================================

 * Add keywords to package.json (Raymond Feng)


2013-09-10, Version strongloopsuite-1.0.0-2
===========================================

 * Add repo (Raymond Feng)

 * Finalize package.json for sls-1.0.0 (Raymond Feng)

 * Changed tag to strongloopsuite-1.0.0-2 (cgole)


2013-09-09, Version strongloopsuite-1.0.0-1
===========================================

 * Update assets mapping (Raymond Feng)

 * Update concepts doc with a new diagram (Raymond Feng)

 * Simplify readme (Ritchie Martori)

 * Add placeholders for client apis (Ritchie Martori)

 * Add command line docs (Ritchie Martori)


2013-09-05, Version strongloopsuite-1.0.0-0
===========================================

 * Updated to use tagged version strongloopsuite-1.0.0-0 of dependencies (cgole)

 * Add getting started link (Ritchie Martori)

 * Update the Quick Start (Ritchie Martori)

 * Update model docs further. (Michael Schoonmaker)

 * Updated model docs (Ritchie Martori)

 * Concepts overhaul in progress (Ritchie Martori)


2013-09-04, Version 1.2.0
=========================

 * Updated to use tagged version of loopback-datasource-juggler and strong-remoting (cgole)

 * Fix package.json to remove duplicate mocha deps (Raymond Feng)

 * Tidy up package.json for LoopBack 1.0.0 (Raymond Feng)

 * Update license (Raymond Feng)

 * Update the rest doc with more samples, fix the curl encoding (Raymond Feng)

 * Remove the todos example and fix doc example (Ritchie Martori)

 * doc/concepts: fixed link to strong-remoting docs (Miroslav Bajtos)

 * Update the internal prefix (Raymond Feng)

 * Update findOne (Raymond Feng)

 * Update REST doc based on the PR feedback (Raymond Feng)

 * Update REST doc (Raymond Feng)

 * Update the docs to fix into width of 80 (Raymond Feng)

 * intro edits and TOC adjustments (Al Tsang)

 * Fix the test case (Raymond Feng)


2013-08-27, Version 0.2.1
=========================

 * Doc edits (Ritchie Martori)

 * Update concepts (Raymond Feng)

 * Add more description about the filter arg for find() (Raymond Feng)

 * Update the concepts.md and link to related guides (Raymond Feng)

 * Update rest.md (Raymond Feng)

 * Add quickstart (Ritchie Martori)

 * Start to add rest.md (Raymond Feng)

 * adjusting concept headers, cleaning up intro, more instructions on getting started (Al Tsang)

 * Use findById to look up the instance by id (Raymond Feng)

 * Update the list of shared methods (Raymond Feng)

 * Make sure User.setup calls Model.setup to support shared ctor (Raymond Feng)

 * Add LICENSE (Raymond Feng)

 * Added code coverage blanket.js (cgole)

 * took google docs TOC and put into sdocs (Al Tsang)

 * Added placeholder docs (Ritchie Martori)

 * Use strong-task-emitter (Raymond Feng)

 * Rename 'loopback-data' to 'loopback-datasource-juggler' (Raymond Feng)

 * Fix login query (Ritchie Martori)

 * Implement required and update invlaid id schemas (Ritchie Martori)

 * Remove auth middleware and passport until adding in acl and strategies (Ritchie Martori)

 * Clean up log out methods (Ritchie Martori)

 * Swagger integration (Ritchie)

 * Fix hasMany / relational methods. Update docs. (Ritchie)

 * Add root true to remote methods (Ritchie)

 * Fix bad connector path (Ritchie)

 * Fix the test case (Raymond Feng)

 * Rename adapter to connector (Raymond Feng)

 * Add more docs and apis to application model (Raymond Feng)

 * Add a deleteById test (Raymond Feng)

 * Rename sl-remoting to strong-remoting (Ritchie Martori)

 * Add more functions and tests for Application model (Raymond Feng)

 * More readme cleanup (Ritchie)

 * README cleanup (Ritchie)

 * Fix renaming manually (Ritchie)

 * Manually merge application (Ritchie)

 * Manually merge rest adapter (Ritchie)

 * Add fields documentation (Ritchie)

 * More cleanup for test/README.md (Ritchie Martori)

 * Cleanup test markdown (Ritchie Martori)

 * Add memory docs and test (Ritchie Martori)

 * Remove remote option object (Ritchie Martori)

 * Rename jugglingdb to loopback-data (Raymond Feng)

 * Add renamed files (Raymond Feng)

 * rename asteroid to loopback (Raymond Feng)

 * Fix model remoting issue. (Ritchie Martori)

 * Fix inheritance bug (Ritchie Martori)

 * Remove updateAttribute as remote method (Ritchie Martori)

 * Fix login bug. (Ritchie Martori)

 * Added bcrypt for password hashing (Ritchie Martori)

 * Refactor Model into class. Make createModel() just sugar. (Ritchie Martori)

 * Remove data argument name from user tests (Ritchie Martori)

 * Validate uniqueness and format of User email. (Ritchie Martori)

 * Add user.logout() sugar method and update logout docs (Ritchie Martori)

 * Create 64 byte session ids (Ritchie Martori)

 * Tests README (Ritchie Martori)

 * Experiment application model (Raymond Feng)

 * Updated generated test docs (Ritchie Martori)

 * Update docs and add asteroid.memory() sugar api (Ritchie Martori)

 * Add exports to models (Raymond Feng)

 * Updating models (Raymond Feng)

 * Add basic email verification (Ritchie Martori)

 * Initial users (Ritchie Martori)

 * Add default user properties (Ritchie Martori)

 * Add initial User model (Ritchie Martori)

 * Remove app.modelBuilder() (Ritchie Martori)

 * Add more user model docs (Ritchie Martori)

 * Update README.md (cgole)

 * Fix type in docs (Ritchie Martori)

 * Add normalized properties to Models (Ritchie Martori)

 * Add schema skeletons for built-in models (Raymond Feng)

 * Fix service() & services() (Raymond Feng)

 * Add service method (Ritchie Martori)

 * Add more info to the models (Raymond Feng)

 * Add more information to the logical models (Raymond Feng)

 * Only build a sl remoting handler when a model is added to the app. (Ritchie Martori)

 * Add user model docs. (Ritchie Martori)

 * Bump version (Ritchie Martori)

 * Add geo point tests (Ritchie Martori)

 * Rename long to lng (Ritchie Martori)

 * Add geo point (Ritchie Martori)

 * model.find => model.findById, model.all => model.find (Ritchie Martori)


2013-06-24, Version 0.8.0
=========================

 * First release!
