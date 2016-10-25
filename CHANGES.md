2016-10-24, Version 2.36.0
==========================

 * Need index on principalId for performance. (#2883) (#2884) (Simon Ho)

 * Remove redundant items in PR template (#2877) (#2878) (Simon Ho)

 * Refactor PR template based on feedback (#2865) (#2874) (Simon Ho)

 * Add pull request template (#2843) (#2862) (Simon Ho)

 * Fix description of updateAll response (Miroslav Bajtoš)


2016-10-13, Version 2.35.0
==========================

 * Reword ticking checkbox note in issue template (#2855) (Simon Ho)

 * Add how to tick checkbox in issue template (#2851) (#2853) (Simon Ho)

 * Use GitHub issue templates (#2810) (#2852) (Simon Ho)

 * Allow tokens with eternal TTL (value -1) (Miroslav Bajtoš)

 * Update ja and nl translation files (Candy)

 * Fix support for remote hooks returning a Promise (Tim van der Staaij)

 * Validate non-email property partial update (Loay)

 * Update translation files - round#2 (Candy)

 * Update tests to use registry for model creation (gunjpan)

 * Call new disable remote method from model class. (Richard Pringle)

 * Temporarily disable Karma tests on Windows CI (Miroslav Bajtoš)

 * Add translation files for 2.x (Candy)

 * Allow resetPassword if email is verified (Loay)

 * Add docs for KeyValue model (Simon Ho)

 * Invalidate sessions after email change (Loay)

 * Upgrade loopback-testing to the latest ^1.4 (Miroslav Bajtoš)


2016-09-13, Version 2.34.1
==========================

 * Fix double-slash in confirmation URL (Miroslav Bajtoš)


2016-09-12, Version 2.34.0
==========================



2016-09-09, Version 2.33.0
==========================

 * Fix data argument for upsertWithWhere (Amir Jafarian)

 * Expose upsertWithWhere (Sonali Samantaray)

 * Fix remoting metadata for "data" arguments (Miroslav Bajtoš)

 * Rework email validation to use isemail (Miroslav Bajtoš)


2016-09-05, Version 2.32.0
==========================

 * test/user: don't attach User model twice (Miroslav Bajtoš)

 * app.enableAuth: correctly detect attached models (Miroslav Bajtoš)

 * Apply g.f to literal strings (Candy)

 * Make the app instance available to connectors (Subramanian Krishnan)

 * Reorder PATCH Vs PUT endpoints (Amir Jafarian)

 * streamline use if `self` (Benjamin Kroeger)

 * resolve related models from correct registry (Benjamin Kroeger)

 * KeyValueModel: add API for listing keys (Miroslav Bajtoš)


2016-08-17, Version 2.31.0
==========================

 * Fix token middleware crash (Carl Fürstenberg)

 * Support 'alias' in mail transport config. (Samuel Reed)


2016-08-16, Version 2.30.0
==========================

 * Revert globalization of Swagger descriptions (Miroslav Bajtoš)

 * Expose `Replace*` methods (Amir Jafarian)

 * Add bcrypt validation (Loay)

 * Cache remoting descriptions to speed up tests (Miroslav Bajtoš)

 * Revert globalization of assert() messages (Miroslav Bajtoš)

 * Fix token middleware to not trigger CLS init (Miroslav Bajtoš)

 * common: add KeyValueModel (Miroslav Bajtoš)

 * Globalize current-context deprecation messages (Miroslav Bajtoš)

 * Deprecate current-context API (Miroslav Bajtoš)

 * test: increase timeout to prevent CI failures (Miroslav Bajtoš)

 * Backport of #2407 (Candy)

 * test: fix timeout in rest.middleware.test (Miroslav Bajtoš)

 * test: fix "socket hang up" error in app.test (Miroslav Bajtoš)

 * test: increate timeout in Role test (Miroslav Bajtoš)

 * test: make status test more robust (Miroslav Bajtoš)

 * test: fix broken Role tests (Miroslav Bajtoš)

 * Update dependencies to their latest versions (Miroslav Bajtoš)

 * Increase timeout (jannyHou)

 * Backport of #2565 (Miroslav Bajtoš)

 * Avoid calling deprecated methds (Amir Jafarian)

 * test: use local registry in test fixtures (Miroslav Bajtoš)

 * Fix test case error (Loay)

 * Backport/Fix security issue 580 (Loay)


2016-07-12, Version 2.29.1
==========================

 * Fix description for User.prototype.hasPassword (Jue Hou)

 * Fix verificationToken bug #2440 (Loay)

 * add missing unit tests for #2108 (Benjamin Kroeger)


2016-06-07, Version 2.29.0
==========================

 * test: increase timeouts on CI (Miroslav Bajtoš)

 * jscsrc: remove jsDoc rule (Miroslav Bajtoš)

 * Deprecate getters for express 3.x middleware (Miroslav Bajtoš)

 * Remove env.json and strong-pm dir (Ritchie Martori)

 * Fix JSCS unsupported rule error (Jason)

 * Resolver support return promise (juehou)

 * Update user.js (Rik)

 * Backport separate error checking and done logic (Simon Ho)

 * Clean up by removing unnecessary comments (Supasate Choochaisri)

 * Add feature to not allow duplicate role name (Supasate Choochaisri)

 * update/insert copyright notices (Ryan Graham)

 * relicense as MIT only (Ryan Graham)

 * Upgrade phantomjs to 2.x (Miroslav Bajtoš)

 * app: send port:0 instead of port:undefined (Miroslav Bajtoš)

 * travis: drop node@5, add node@6 (Miroslav Bajtoš)

 * Disable DEBUG output for eslint on Jenkins CI (Miroslav Bajtoš)

 * test/rest.middleware: use local registry (Miroslav Bajtoš)

 * Fix role.isOwner to support app-local registry (Miroslav Bajtoš)

 * test/user: use local registry (Miroslav Bajtoš)


2016-05-02, Version 2.28.0
==========================

 * Add new feature to emit a `remoteMethodDisabled` event when disabling a remote method. (Supasate Choochaisri)

 * Fix typo in Model.nestRemoting (Tim Needham)

 * Allow built-in token middleware to run repeatedly (Benjamin Kröger)

 * Improve error message on connector init error (Miroslav Bajtoš)

 * application: correct spelling of "cannont" (Sam Roberts)


2016-02-19, Version 2.27.0
==========================

 * Remove sl-blip from dependency (Candy)

 * Fix race condition in replication tests (Miroslav Bajtoš)

 * test: remove errant console.log from test (Ryan Graham)

 * Promisify Model Change (Jue Hou)

 * Fix race condition in error handler test (Miroslav Bajtoš)

 * Travis: drop iojs, add v4.x and v5.x (Miroslav Bajtoš)

 * Correct JSDoc findOrCreate() callback in PersistedModel (Miroslav Bajtoš)

 * Hide verificationToken (Miroslav Bajtoš)

 * test: use ephemeral port for e2e server (Ryan Graham)

 * test: fail on error instead of crash (Ryan Graham)

 * ensure app is booted before integration tests (Ryan Graham)

 * Checkpoint speedup (Amir Jafarian)

 * Pull in API doc fix from PR into master #1910 (crandmck)


2015-12-22, Version 2.26.2
==========================

 * Fix bulkUpdate to not trigger rectifyAll (Amir Jafarian)


2015-12-17, Version 2.26.1
==========================

 * PersistedModel: log rectify/rectifyAll triggers (Miroslav Bajtoš)


2015-12-09, Version 2.26.0
==========================

 * change: skip cp lookup on no change (Miroslav Bajtoš)

 * Change: correctly rectify no-change (Miroslav Bajtoš)

 * Update model.js (Rand McKinney)

 * Adding properties description for User Model (David Cheung)

 * Add case-sensitve email option for User model. (Richard Pringle)


2015-11-13, Version 2.25.0
==========================

 * Fix typo in description of persistedModel.updateAttributes() (Richard Pringle)


2015-11-09, Version 2.24.0
==========================

 * Fix cookie-parser error (Simon Ho)


2015-11-09, Version 2.23.0
==========================

 * lib/registry: fix findModel for model ctor (Miroslav Bajtoš)

 * Refer to licenses with a link (Sam Roberts)

 * Fix user.resetPassword to fail on email not found (Simo Moujami)

 * Fix typo in doc comment (Rand McKinney)

 * Do not include redundant ports in verify links (Samuel Gaus)

 * Set application's id property only if it's empty. (wusuopu)

 * Check configs for shared method settings (Simon Ho)

 * Add test fixtures for shared methods (Simon Ho)

 * Clean up .jshintrc (Simon Ho)

 * Update comment about user ACL to reflect implementation (Felipe Oliveira Carvalho)


2015-09-23, Version 2.22.2
==========================

 * Use strongloop conventions for licensing (Sam Roberts)

 * Set package license to MIT (Sam Roberts)


2015-09-18, Version 2.22.1
==========================

 * Fix perf of rectification after updateAttributes (Miroslav Bajtoš)

 * Update persisted-model.js (Rand McKinney)

 * Stop NPM license warning (Simon Ho)


2015-09-03, Version 2.22.0
==========================

 * Create stack-removing errorhandler middleware (Richard Walker)

 * Update README.md (Rand McKinney)

 * Allow EJS templates to use includes (Samuel Gaus)

 * Fix options.to assertion message in user.verify (Farid Nouri Neshat)

 * Upgrade Travis to container-based infrastructure (Miroslav Bajtoš)

 * fix typo "PeristedModel" (Christoph)


2015-08-13, Version 2.21.0
==========================

 * Add util methods to ACL and clean up related model resolutions (Raymond Feng)

 * Promisify 'PersistedModel - replication' (Pradnya Baviskar)

 * Promisify 'Application' model (Pradnya Baviskar)


2015-08-06, Version 2.20.0
==========================

 * Allow methods filter for middleware config (Raymond Feng)

 * Don't load Bluebird for createPromiseCallback (Miroslav Bajtoš)

 * fix exit early when password is non-string closes #1437 (Berkeley Martinez)

 * Promisify User model (Pradnya Baviskar)

 * Add missing . to user model property descriptions (Richard Walker)


2015-07-28, Version 2.19.1
==========================

 * Disable application model test for karma (Raymond Feng)

 * Fix jsdocs for methods with where argument (Raymond Feng)

 * Add link to createChangeStream docs (Ritchie Martori)


2015-07-09, Version 2.19.0
==========================

 * Add PersistedModel.createChangeStream() (Ritchie Martori)

 * Remove trailing whitespace from jsdoc (Ritchie Martori)

 * Update model.js (Rand McKinney)

 * Downgrade version of loopback-testing (Ritchie Martori)

 * Auto-configure models required by `app.enableAuth` (Miroslav Bajtoš)

 * Add loadBuiltinModels flag to loopback(options) (Miroslav Bajtoš)

 * Add a unit-test for searchDefaultTokenKeys (Miroslav Bajtoš)

 * access-token: add option "searchDefaultTokenKeys" (Owen Brotherwood)

 * Fix the test case (Raymond Feng)

 * Fix code standards issues (Tom Kirkpatrick)

 * Add test case to highlight fatal error when trying to include a scoped relationship through a polymorphic relationship (Tom Kirkpatrick)

 * add callback args for listByPrincipalType to jsdoc comment, pass explicit arguments to callback (Esco Obong)

 * mark utiltiy function as private (Esco Obong)

 * fix linting errors (Esco Obong)

 * fix lint erros (Esco Obong)

 * consolidate Role methods roles, applications, and users into one, add query param to allow for pagination and restricting fields (Esco Obong)

 * fix implementation of Role methods: users,roles, and applications (Esco Obong)


2015-05-13, Version 2.18.0
==========================

 * Make the test compatible with latest juggler (Raymond Feng)


2015-05-12, Version 2.17.3
==========================

 * Use the new remoting.authorization hook for check access (Ritchie Martori)

 * Define remote methods via model settings/config (Miroslav Bajtoš)

 * Pass the full options object to the email send method in user verification process. (Alexandru Savin)

 * un-document _findLayerByHandler (Rand McKinney)

 * Gruntfile: disable debug & watch for CI builds (Miroslav Bajtoš)

 * Update devDependencies to the latest versions (Miroslav Bajtoš)

 * Remove trailing whitespace added by 242bcec (Miroslav Bajtoš)

 * Update model.js (Rand McKinney)


2015-04-28, Version 2.17.2
==========================

 * Fix regression in Model.getApp() (Miroslav Bajtoš)


2015-04-28, Version 2.17.1
==========================

 * Allow dataSource === false (Raymond Feng)

 * Fix remoting metadata for User.login#include (Miroslav Bajtoš)


2015-04-21, Version 2.17.0
==========================

 * Disable inclusion of User.accessTokens (Raymond Feng)

 * Upgrade test fixtures to use LB 2.x layout (Raymond Feng)


2015-04-17, Version 2.16.3
==========================

 * Rework global registry to be per-module-instance (Miroslav Bajtoš)


2015-04-17, Version 2.16.1
==========================

 * Add back loopback properties like modelBuilder (Miroslav Bajtoš)


2015-04-16, Version 2.16.0
==========================

 * Expose the `filter` argument for findById (Raymond Feng)

 * fixed the missing '.' in various description fields. (Edmond Lau)

 * Conflict resolution and Access control (Miroslav Bajtoš)

 * Fix the typo (Raymond Feng)

 * Fix PersistedModel._defineChangeModel (Miroslav Bajtoš)

 * AccessControl for change replication (Miroslav Bajtoš)

 * test: remove global autoAttach (Miroslav Bajtoš)

 * Add support for app level Model isolation (Ritchie Martori)

 * Implement ModelCtor.afterRemoteError (Miroslav Bajtoš)

 * Code cleanup, add Model._runWhenAttachedToApp (Miroslav Bajtoš)

 * Refactor Model and PersistedModel registration (Miroslav Bajtoš)

 * Fix the style issue (Raymond Feng)

 * Add missing error handlers to checkpoints() (Miroslav Bajtoš)

 * Fix where param format (Rand McKinney)

 * Test embedsOne CRUD methods (Fabien Franzen)


2015-04-01, Version 2.15.0
==========================

 * Improve error handling in replication (Miroslav Bajtoš)

 * Add `loopback.runInContext` (Miroslav Bajtoš)

 * Fix style issues (Raymond Feng)

 * Document the new third callback arg of replicate() (Miroslav Bajtoš)

 * Fix API doc for updateAll/deleteAll (Miroslav Bajtoš)

 * Import subset of underscore.string scripts only (Miroslav Bajtoš)

 * Use `ctx.instance` provided by "after delete" hook (Miroslav Bajtoš)

 * Add conflict resolution API (Miroslav Bajtoš)

 * Detect 3rd-party changes made during replication (Miroslav Bajtoš)

 * Ability to pass in custom verification token generator This commit adds the ability for the developer to use a custom token generator function for the user.verify(...) method. By default, the system will still use the crypto.randomBytes() method if no option is provided. (jakerella)

 * Remove unnecessary delay in tests. (Miroslav Bajtoš)

 * Update README.md (Simon Ho)

 * Remove duplicate cb func from getRoles and other doc cleanup (crandmck)

 * Enhance the token middleware to support current user literal (Raymond Feng)

 * Handling owner being a relation/function (Benjamin Boudreau)

 * Run replication tests in the browser too (Miroslav Bajtoš)

 * Add replication tests for conflict resolution (Miroslav Bajtoš)

 * Fix an assertion broke by recent chai upgrade. (Miroslav Bajtoš)

 * Static ACL support array of properties now (ulion)

 * Add more integration tests for replication (Miroslav Bajtoš)

 * Prevent more kinds of false replication conflicts (Miroslav Bajtoš)

 * Upgrade deps (Raymond Feng)

 * Fix "Issues" link in readme (Simon Ho)

 * Add more debug logs to replication (Miroslav Bajtoš)

 * Fixes #1158. (Jason Sturges)

 * Checkpoint: start with seq=1 instead of seq=0 (Miroslav Bajtoš)

 * Return new checkpoints in callback of replicate() (Miroslav Bajtoš)

 * Create a remote checkpoint during replication too (Miroslav Bajtoš)

 * Replication: fix checkpoint-related race condition (Miroslav Bajtoš)

 * Support different "since" for source and target (Miroslav Bajtoš)


2015-03-03, Version 2.14.0
==========================

 * Replace deprecated hooks with Operation hooks (Miroslav Bajtoš)

 * test: don't warn about running deprecated paths (Miroslav Bajtoš)

 * karma conf: prevent timeouts on Travis CI (Miroslav Bajtoš)

 * Pass options from User.login to createAccessToken (Raymond Feng)

 * Config option to disable legacy explorer routes Setting legacyExplorer to false in the loopback config will disable the routes /routes and /models made available in loopback.rest. The deprecate module has been added to the project with a reference added for the legacyExplorer option as it is no longer required by loopback-explorer. Tests added to validate functionality of disabled and enabled legacy explorer routes. (Ron Edgecomb)

 * test: setup GUID for all models tracking changes (Miroslav Bajtoš)

 * Change tracking requires a string id set to GUID (Miroslav Bajtoš)


2015-02-25, Version 2.13.0
==========================

 * Add a workaround to avoid conflicts with NewRelic (Raymond Feng)

 * Fix "User.confirm" to always call afterRemote hook (Pradnya Baviskar)

 * Skip hashing password if it's already hashed (Raymond Feng)

 * travis.yml: drop 0.11, add 0.12 and iojs (Miroslav Bajtoš)

 * Add docs for settings per #1069 (crandmck)

 * Fix change detection & tracking (Miroslav Bajtoš)

 * Minor doc fix (Ritchie Martori)

 * Upgrade jscs to ~1.11 via grunt-jscs ^1.5 (Miroslav Bajtoš)

 * Remove redundant dev-dep serve-favicon (Miroslav Bajtoš)

 * Fix test broken by recent juggler changes (Miroslav Bajtoš)

 * Fix coding style issue (Raymond Feng)

 * Remove trailing spaces (Raymond Feng)

 * Fix for issue 1099. (zane)

 * Fix API docs per #1041 (crandmck)

 * Fix API docs to add proper callback doc per #1041 (crandmck)

 * Fix #1080 - domain memory leak. (Samuel Reed)

 * Document user settings (Ritchie Martori)

 * Add wiki references to readme (Simon Ho)


2015-02-03, Version 2.12.1
==========================

 * Map not found to 404 for hasOne (Raymond Feng)


2015-02-03, Version 2.12.0
==========================

 * Fix the test case (Raymond Feng)

 * Enable remoting for hasOne relations (Raymond Feng)

 * README: add Gitter badge (Miroslav Bajtoš)


2015-01-27, Version 2.11.0
==========================

 * Document options for persistedmodel.save() (Rand McKinney)

 * Add test case to demonstrate url-encoded http path (Pradnya Baviskar)

 * Fix JSdocs per #888 (crandmck)

 * Add test case for loopback issue #698 (Pradnya Baviskar)

 * Remove usages of deprecated `req.param()` (Miroslav Bajtoš)

 * Add error code property to known error responses. (Ron Edgecomb)

 * test: use 127.0.0.1 instead of localhost (Ryan Graham)

 * Extend AccessToken to parse Basic auth headers (Ryan Graham)

 * tests: fix Bearer token test (Ryan Graham)

 * don't send queries to the DB when no changes are detected (bitmage)


2015-01-16, Version 2.10.2
==========================

 * Make sure EXECUTE access type matches READ or WRITE (Raymond Feng)


2015-01-15, Version 2.10.1
==========================

 * Optimize the creation of handlers for rest (Raymond Feng)

 * Add a link to gitter chat (Raymond Feng)

 * Added context middleware (Rand McKinney)

 * Use User.remoteMethod instead of loopbacks method This is needed for loopback-connector-remote authorization. Addresses https://github.com/strongloop/loopback/issues/622. (Berkeley Martinez)


2015-01-07, Version 2.10.0
==========================

 * Revert the peer dep change to avoid npm complaints (Raymond Feng)

 * Update strong-remoting dep (Raymond Feng)

 * Allow accessType per remote method (Raymond Feng)

 * API and REST tests added to ensure complete and valid credentials are supplied for verified error message to be returned  - tests added as suggested and fail under previous version of User model  - strongloop/loopback#931 (Ron Edgecomb)

 * Require valid login credentials before verified email check.  - strongloop/loopback#931. (Ron Edgecomb)


2015-01-07, Version 2.9.0
=========================

 * Update juggler dep (Raymond Feng)

 * Fix Geo test cases (Raymond Feng)

 * Allow User.hashPassword/validatePassword to be overridden (Raymond Feng)


2015-01-07, Version 2.8.8
=========================

 * Fix context middleware to preserve domains (Pham Anh Tuan)

 * Additional password reset unit tests for API and REST  - strongloop/loopback#944 (Ron Edgecomb)

 * Small formatting update to have consistency with identical logic in other areas.   - strongloop/loopback#944 (Ron Edgecomb)

 * Simplify the API test for invalidCredentials (removed create), move above REST calls for better grouping of tests   - strongloop/loopback#944 (Ron Edgecomb)

 * Force request to send body as string, this ensures headers aren't automatically set to application/json  - strongloop/loopback#944 (Ron Edgecomb)

 * Ensure error checking logic is in place for all REST calls, expand formatting for consistency with existing instances.  - strongloop/loopback#944 (Ron Edgecomb)

 * Correct invalidCredentials so that it differs from validCredentialsEmailVerified, unit test now passes as desired.  - strongloop/loopback#944 (Ron Edgecomb)

 * Update to demonstrate unit test is actually failing due to incorrect values of invalidCredentials  - strongloop/loopback#944 (Ron Edgecomb)

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

 * lib/application: publish Change models to REST API (Miroslav Bajtoš)

 * models/change: fix typo (Miroslav Bajtoš)

 * checkpoint: fix `current()` (Miroslav Bajtoš)


2014-07-03, Version 2.0.0-beta5
===============================

 * app: update `url` on `listening` event (Miroslav Bajtoš)

 * Fix "ReferenceError: loopback is not defined" in registry.memory(). (Guilherme Cirne)

 * Invalid Access Token return 401 (Karl Mikkelsen)

 * Bump version and update deps (Raymond Feng)

 * Update debug setting (Raymond Feng)

 * Mark `app.boot` as deprecated. (Miroslav Bajtoš)

 * Update link to doc (Rand McKinney)


2014-06-26, Version 2.0.0-beta4
===============================

 * package: upgrade juggler to 2.0.0-beta2 (Miroslav Bajtoš)

 * Fix loopback in PhantomJS, fix karma tests (Miroslav Bajtoš)

 * Allow peer to use beta2 of datasource-juggler (and future) (Laurent)

 * Remove `app.boot` (Miroslav Bajtoš)

 * Update juggler dep (Raymond Feng)

 * Remove relationNameFor (Raymond Feng)

 * Fix a slowdown caused by mutation of an incoming accessToken option. (Samuel Reed)

 * Fix remote method definition in client-server example (Ritchie Martori)

 * package: the next version will be a minor version (Miroslav Bajtoš)

 * lib/registry: `getModel` throws, add `findModel` (Miroslav Bajtoš)

 * lib/application: Remove forgotten `loopback` ref (Miroslav Bajtoš)

 * Allow customization of ACL http status (Karl Mikkelsen)

 * Expose loopback as `app.loopback` (Miroslav Bajtoš)

 * Remove loopback-explorer from dev deps (Miroslav Bajtoš)

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

 * Add loopback.version back (Miroslav Bajtoš)

 * Tidy up app.model() to remove duplicate & recusrive call (Raymond Feng)

 * Register existing model to app.models during app.model() (Raymond Feng)

 * JSDoc cleanup (crandmck)

 * Bump version so that we can republish (Raymond Feng)

 * Bump version (Raymond Feng)

 * Use constructor to reference the model class (Raymond Feng)

 * Allow the creation of access token to be overriden (Raymond Feng)

 * Fixup JSDocs; note: updateOrCreate function alias pulled out on separate line for docs (crandmck)

 * lib/loopback: fix jsdoc comments (Miroslav Bajtoš)

 * Rename DataModel to PersistedModel (Miroslav Bajtoš)

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

 * Exclude express-middleware from browser bundle (Miroslav Bajtoš)

 * !fixup only set ctx.accessType when sharedMethod is available (Ritchie Martori)

 * Refactor ACL to allow for `methodNames` / aliases (Ritchie Martori)

 * test: Remove forgotten call of `console.log()` (Miroslav Bajtoš)

 * Update README and the module diagram (Raymond Feng)

 * Clean up express middleware dependencies (Raymond Feng)

 * Update strong-remoting dep (Raymond Feng)

 * Rename express-wrapper to express-middleware (Raymond Feng)

 * Clean up the tests (Raymond Feng)

 * Upgrade to Express 4.x (Raymond Feng)

 * Deprecate app.boot, remove app.installMiddleware (Miroslav Bajtoš)


2014-05-28, Version 2.0.0-beta3
===============================

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

 * app: update `url` on `listening` event (Miroslav Bajtoš)


2014-06-27, Version 1.9.1
=========================

 * Fix "ReferenceError: loopback is not defined" in registry.memory(). (Guilherme Cirne)

 * Invalid Access Token return 401 (Karl Mikkelsen)


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

 * app: implement `connector()` and `connectors` (Miroslav Bajtoš)

 * Fix a typo in `app.boot`. (Samuel Reed)

 * Make app.datasources unique per app instance (Miroslav Bajtoš)


2014-05-27, Version 1.8.5
=========================

 * Bump version (Raymond Feng)

 * Add postgresql to the keywords (Raymond Feng)

 * updated package.json with SOAP and framework keywords (altsang)

 * updated package.json with keywords and updated description (Raymond Feng)


2014-05-27, Version 1.8.4
=========================

 * Add more keywords (Raymond Feng)

 * Bump version (Raymond Feng)

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


2014-01-14, Version 1.5.1
=========================

 * Bump version (Raymond Feng)

 * Make sure methods are called in the context of the calling class (Raymond Feng)

 * Start to move md to jsdoc (Ritchie Martori)


2014-01-14, Version 1.5.0
=========================

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

 * Use a pure JS bcrypt (Ritchie)

 * Added little boxes to Getting Started. (Michael Schoonmaker)

 * Update assets mapping (Raymond Feng)

 * Update concepts doc with a new diagram (Raymond Feng)

 * Simplify readme (Ritchie Martori)

 * Add placeholders for client apis (Ritchie Martori)

 * Add command line docs (Ritchie Martori)

 * Add getting started link (Ritchie Martori)

 * Update the Quick Start (Ritchie Martori)

 * Fix package.json to remove duplicate mocha deps (Raymond Feng)

 * Tidy up package.json for LoopBack 1.0.0 (Raymond Feng)

 * Update model docs further. (Michael Schoonmaker)

 * Update license (Raymond Feng)

 * Updated model docs (Ritchie Martori)

 * Concepts overhaul in progress (Ritchie Martori)

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
