---
layout: page
since: (from 2015-11-25 to 2016-01-20)
---

## Core

### generator-loopback
 * **Released 1.14.0** (Simon Ho)
 * [PR#133](https://github.com/strongloop/generator-loopback/pull/133) Prevent readonly models in relation generator ([jannyHou](https://github.com/jannyHou))
 * [PR#134](https://github.com/strongloop/generator-loopback/pull/134) Fix ci timeout error. ([0candy](https://github.com/0candy))
 * [PR#121](https://github.com/strongloop/generator-loopback/pull/121) Add command line printing swagger definition to loopback ([0candy](https://github.com/0candy))
 * [PR#132](https://github.com/strongloop/generator-loopback/pull/132) Use shared function ([jannyHou](https://github.com/jannyHou))
 * [PR#130](https://github.com/strongloop/generator-loopback/pull/130) Remove slc:loopback-example ([0candy](https://github.com/0candy))
 * [PR#124](https://github.com/strongloop/generator-loopback/pull/124) Remote method generator ([jannyHou](https://github.com/jannyHou))
 * [PR#127](https://github.com/strongloop/generator-loopback/pull/127) fix assumptions about dependency locations ([rmg](https://github.com/rmg))


### loopback
 * [PR#1908](https://github.com/strongloop/loopback/pull/1908) Checkpoint speedup ([Amir-61](https://github.com/Amir-61))
 * [@e06bd1a](https://github.com/strongloop/loopback/commit/e06bd1a8b0fe8e911eb656791ff1e9c9e672ecfc) Fix typo in package.json (publishConfig) ([Miroslav Bajtoš](https://github.com/bajtos))
 * [PR#1953](https://github.com/strongloop/loopback/pull/1953) Fix description for User.prototype.hasPassword ([jannyHou](https://github.com/jannyHou))
 * [PR#1944](https://github.com/strongloop/loopback/pull/1944) Remove unused code from loopback-testing-helper ([superkhau](https://github.com/superkhau))
 * [PR#1896](https://github.com/strongloop/loopback/pull/1896) [SEMVER-MAJOR] Always use bluebird as promise library ([jannyHou](https://github.com/jannyHou))
 * [PR#1943](https://github.com/strongloop/loopback/pull/1943) [SEMVER-MAJOR] Make juggler a regular dependency ([bajtos](https://github.com/bajtos))
 * [PR#1935](https://github.com/strongloop/loopback/pull/1935) Remove dependency on loopback-testing ([superkhau](https://github.com/superkhau))
 * [PR#1934](https://github.com/strongloop/loopback/pull/1934) Fix failing tests ([superkhau](https://github.com/superkhau))
 * [PR#1910](https://github.com/strongloop/loopback/pull/1910) Update persisted-model.js ([crandmck](https://github.com/crandmck))
 * [@b0a6242](https://github.com/strongloop/loopback/commit/b0a62422c1d83c9b748bb97b7100e8dd8d2220e0) 3.0.0-alpha.1 ([Miroslav Bajtoš](https://github.com/bajtos))
 * [PR#1909](https://github.com/strongloop/loopback/pull/1909) Start development of 3.0 ([bajtos](https://github.com/bajtos))
 * **Released 2.26.2** ([Miroslav Bajtoš](https://github.com/bajtos))
 * [PR#1899](https://github.com/strongloop/loopback/pull/1899) Fix bulkUpdate to not trigger rectifyAll  ([Amir-61](https://github.com/Amir-61))
 * **Released 2.26.1** ([Miroslav Bajtoš](https://github.com/bajtos))
 * [PR#1894](https://github.com/strongloop/loopback/pull/1894) PersistedModel: log rectify/rectifyAll triggers ([bajtos](https://github.com/bajtos))
 * **Released 2.26.0** ([Miroslav Bajtoš](https://github.com/bajtos))
 * [PR#1860](https://github.com/strongloop/loopback/pull/1860) Fix replication performance ([bajtos](https://github.com/bajtos))
 * [PR#1804](https://github.com/strongloop/loopback/pull/1804) Add case-sensitive email option for User model ([richardpringle](https://github.com/richardpringle))
 * [PR#1855](https://github.com/strongloop/loopback/pull/1855) Adding properties description for User Model ([davidcheung](https://github.com/davidcheung))
 * [PR#1847](https://github.com/strongloop/loopback/pull/1847) Update model.js ([crandmck](https://github.com/crandmck))


### loopback-boot
 * [PR#169](https://github.com/strongloop/loopback-boot/pull/169) Fix lodash 4.0.0 breaking changes ([jdrouet](https://github.com/jdrouet))
 * **Released 2.16.0** ([Miroslav Bajtoš](https://github.com/bajtos))
 * [PR#165](https://github.com/strongloop/loopback-boot/pull/165) executor: allow loopback versions >= 3.0.0-alpha ([bajtos](https://github.com/bajtos))
 * **Released 2.15.0** ([Miroslav Bajtoš](https://github.com/bajtos))
 * [PR#158](https://github.com/strongloop/loopback-boot/pull/158) Bluemix favors PORT over VCAP_APP_PORT ([svennam92](https://github.com/svennam92))
 * [PR#164](https://github.com/strongloop/loopback-boot/pull/164) Set app env if it is supplied in options object ([Amir-61](https://github.com/Amir-61))


### loopback-datasource-juggler
 * [PR#815](https://github.com/strongloop/loopback-datasource-juggler/pull/815) Implement `findOrCreate` for memory connector ([Amir-61](https://github.com/Amir-61))
 * [PR#790](https://github.com/strongloop/loopback-datasource-juggler/pull/790) [SEMVER-MAJOR] Always use bluebird as the Promise implementation ([jannyHou](https://github.com/jannyHou))
 * [PR#796](https://github.com/strongloop/loopback-datasource-juggler/pull/796) Various fixes in operation hooks ([bajtos](https://github.com/bajtos))
 * [PR#809](https://github.com/strongloop/loopback-datasource-juggler/pull/809) Fix broken code fencings in the docs ([alFReD-NSH](https://github.com/alFReD-NSH))
 * [PR#806](https://github.com/strongloop/loopback-datasource-juggler/pull/806) Revert "Correct syntax for should and more" ([superkhau](https://github.com/superkhau))
 * [PR#804](https://github.com/strongloop/loopback-datasource-juggler/pull/804) Upgrade shouldjs to 8.0.2 ([superkhau](https://github.com/superkhau))
 * [@990307f](https://github.com/strongloop/loopback-datasource-juggler/commit/990307f3d5a5b08a49ae88b505205384312daec0) 3.0.0-alpha.1 ([Miroslav Bajtoš](https://github.com/bajtos))
 * [PR#801](https://github.com/strongloop/loopback-datasource-juggler/pull/801) Start development of 3.0 ([bajtos](https://github.com/bajtos))
 * [PR#792](https://github.com/strongloop/loopback-datasource-juggler/pull/792) Redis test failiures ([Amir-61](https://github.com/Amir-61))
 * **Released 2.44.0** ([Raymond Feng](https://github.com/raymondfeng))
 * [PR#789](https://github.com/strongloop/loopback-datasource-juggler/pull/789) Fix failing test for MongoDB connector ([superkhau](https://github.com/superkhau))
 * [PR#752](https://github.com/strongloop/loopback-datasource-juggler/pull/752) make automatic validation optional ([ernie58](https://github.com/ernie58))


### loopback-swagger
 * [PR#22](https://github.com/strongloop/loopback-swagger/pull/22) Exclude definitions that are not referenced ([0candy](https://github.com/0candy))
 * [PR#19](https://github.com/strongloop/loopback-swagger/pull/19) Fix handling of allOf when generating models ([mastersingh24](https://github.com/mastersingh24))
 * **Released 2.2.3** ([Miroslav Bajtoš](https://github.com/bajtos))
 * [PR#21](https://github.com/strongloop/loopback-swagger/pull/21) Fix unused models + GeoPoint definition ([bajtos](https://github.com/bajtos))


### strong-remoting
 * **Released 2.24.0** ([Ritchie Martori](https://github.com/ritch))
 * [@eb90d1c](https://github.com/strongloop/strong-remoting/commit/eb90d1c544144d8a5cffb8cfce1d3deca0a6125b) Remove old rest-models example ([Ritchie Martori](https://github.com/ritch))
 * **Released 2.23.2** ([Miroslav Bajtoš](https://github.com/bajtos))
 * [PR#270](https://github.com/strongloop/strong-remoting/pull/270) Retain accepted content-type with no-content ([davidcheung](https://github.com/davidcheung))
 * [PR#261](https://github.com/strongloop/strong-remoting/pull/261) Fix incorrect boolean logic on shared-method's `documented` flag. ([STRML](https://github.com/STRML))
 * **Released 2.23.1** ([Miroslav Bajtoš](https://github.com/bajtos))
 * [PR#269](https://github.com/strongloop/strong-remoting/pull/269) Revert "Refactor and rework http coercion." ([bajtos](https://github.com/bajtos))
 * **Released 2.23.0** ([Miroslav Bajtoš](https://github.com/bajtos))
 * [PR#265](https://github.com/strongloop/strong-remoting/pull/265) Refactor and rework http coercion. ([bajtos](https://github.com/bajtos))



## Connectors

### loopback-connector-mongodb
 * [PR#210](https://github.com/strongloop/loopback-connector-mongodb/pull/210) Use ObjectId as internal storage for id ([raymondfeng](https://github.com/raymondfeng))
 * [PR#215](https://github.com/strongloop/loopback-connector-mongodb/pull/215) Remove email from AUTHORS ([superkhau](https://github.com/superkhau))
 * [PR#214](https://github.com/strongloop/loopback-connector-mongodb/pull/214) Update description in README.md ([superkhau](https://github.com/superkhau))
 * [PR#211](https://github.com/strongloop/loopback-connector-mongodb/pull/211) Clean up package.json ([superkhau](https://github.com/superkhau))
 * [PR#213](https://github.com/strongloop/loopback-connector-mongodb/pull/213) Update AUTHORS ([superkhau](https://github.com/superkhau))
 * [PR#212](https://github.com/strongloop/loopback-connector-mongodb/pull/212) Add AUTHORS file ([superkhau](https://github.com/superkhau))
 * [PR#209](https://github.com/strongloop/loopback-connector-mongodb/pull/209) test: fix order of semver arguments ([rmg](https://github.com/rmg))
 * [@42f951c](https://github.com/strongloop/loopback-connector-mongodb/commit/42f951cdfd258c35b9488fe8bf232042b7d1150a) Add more tests for id coercion ([Raymond Feng](https://github.com/raymondfeng))
 * **Released 1.13.2** ([Raymond Feng](https://github.com/raymondfeng))
 * [@cf53567](https://github.com/strongloop/loopback-connector-mongodb/commit/cf53567142f9500f250aeefc1c61ad4271c8ba20) Make sure null/undefined id is not coerced ([Raymond Feng](https://github.com/raymondfeng))
 * [PR#203](https://github.com/strongloop/loopback-connector-mongodb/pull/203) Allow runtime configurable test environment ([superkhau](https://github.com/superkhau))
 * [@de7258a](https://github.com/strongloop/loopback-connector-mongodb/commit/de7258a44dd66d40418e51dae86be1d419d3c206) changed env variable fortest servers ([cgole](https://github.com/cgole))


### loopback-connector-oracle
 * **Released 2.3.0** ([Raymond Feng](https://github.com/raymondfeng))
 * [@e7b5a69](https://github.com/strongloop/loopback-connector-oracle/commit/e7b5a6992afd87a12e0e903c7ecac868100fe958) Upgrade oracle driver version ([Raymond Feng](https://github.com/raymondfeng))


### loopback-connector-redis
 * [PR#13](https://github.com/strongloop/loopback-connector-redis/pull/13) Use NPM run scripts instead of Make ([superkhau](https://github.com/superkhau))
 * [@5236baa](https://github.com/strongloop/loopback-connector-redis/commit/5236baac6f75ecd4826f0a3bc4983cda1f9b074f) Update README.md ([Simon Ho](https://github.com/superkhau))
 * [@f9e76c7](https://github.com/strongloop/loopback-connector-redis/commit/f9e76c7e8428a6fe1f4ca3ff2ba2896ca9259978) Update README.md ([Simon Ho](https://github.com/superkhau))
 * [@94a73a8](https://github.com/strongloop/loopback-connector-redis/commit/94a73a8385711b881256251b670910b6253c74f8) Update README.md ([Simon Ho](https://github.com/superkhau))
 * [PR#11](https://github.com/strongloop/loopback-connector-redis/pull/11) Refactor ([superkhau](https://github.com/superkhau))


### loopback-connector-remote
 * [PR#31](https://github.com/strongloop/loopback-connector-remote/pull/31) Test fixes ([superkhau](https://github.com/superkhau))
 * [PR#29](https://github.com/strongloop/loopback-connector-remote/pull/29) Cleaning up obsolete or unused files & dependencies ([glesage](https://github.com/glesage))
 * [PR#28](https://github.com/strongloop/loopback-connector-remote/pull/28) Add test for custom http.path configuration. ([richardpringle](https://github.com/richardpringle))


### loopback-connector-soap
 * [PR#32](https://github.com/strongloop/loopback-connector-soap/pull/32) Remove example dir ([superkhau](https://github.com/superkhau))
 * [PR#30](https://github.com/strongloop/loopback-connector-soap/pull/30) Fix typo in readme.md ([davidcheung](https://github.com/davidcheung))
 * [PR#29](https://github.com/strongloop/loopback-connector-soap/pull/29) Changing soap invocation test to weather services ([davidcheung](https://github.com/davidcheung))



## SDKs

### loopback-sdk-angular
 * [PR#202](https://github.com/strongloop/loopback-sdk-angular/pull/202) Fix npm test on windows ([davidcheung](https://github.com/davidcheung))
 * **Released 1.6.0** ([Miroslav Bajtoš](https://github.com/bajtos))
 * [PR#184](https://github.com/strongloop/loopback-sdk-angular/pull/184) Fix request interceptor to process all requests on same host as urlBase ([partap](https://github.com/partap))
 * [@6a24f4d](https://github.com/strongloop/loopback-sdk-angular/commit/6a24f4d9892d44335cbea8ec7a10055fc9b78168) Send auth header to all URLs on the same host ([Partap Davis](https://github.com/partap))
 * [PR#193](https://github.com/strongloop/loopback-sdk-angular/pull/193) Persisting rememberMe in localStorage ([davidcheung](https://github.com/davidcheung))


### loopback-sdk-angular-cli
 * **Released 2.0.1** ([Ryan Graham](https://github.com/rmg))
 * [@8e1fde3](https://github.com/strongloop/loopback-sdk-angular-cli/commit/8e1fde3b0254f93ad30cc3cf724b82c983d3edd9) remove ref to removed lb-ng-doc bin ([Ryan Graham](https://github.com/rmg))
 * **Released 2.0.0** ([Miroslav Bajtoš](https://github.com/bajtos))
 * [PR#36](https://github.com/strongloop/loopback-sdk-angular-cli/pull/36) [SEMVER-MAJOR] Remove lb-ng-doc and docular dependency ([bajtos](https://github.com/bajtos))


### loopback-sdk-ios
 * **Released 1.3.2** ([Raymond Feng](https://github.com/raymondfeng))
 * **Released 1.3.1** ([Raymond Feng](https://github.com/raymondfeng))
 * [PR#91](https://github.com/strongloop/loopback-sdk-ios/pull/91) Remove docs and docs-1.0 ([crandmck](https://github.com/crandmck))
 * [PR#85](https://github.com/strongloop/loopback-sdk-ios/pull/85) Added resetPasswordWithEmail to trigger reset of the users password ([kgoedecke](https://github.com/kgoedecke))
 * [PR#87](https://github.com/strongloop/loopback-sdk-ios/pull/87) Fix swift compatibility issue when init'ing a repo ([hideya](https://github.com/hideya))
 * [PR#79](https://github.com/strongloop/loopback-sdk-ios/pull/79) Enable unit test execution from `npm test` ([hideya](https://github.com/hideya))
 * [PR#80](https://github.com/strongloop/loopback-sdk-ios/pull/80) Update Subclassing.md ([kexoth](https://github.com/kexoth))
 * [PR#70](https://github.com/strongloop/loopback-sdk-ios/pull/70) Remove redundant declarations of `+ (instancetype)repository` ([hideya](https://github.com/hideya))



## Components

### loopback-component-explorer
 * **Released 2.2.0** ([Raymond Feng](https://github.com/raymondfeng))
 * [PR#148](https://github.com/strongloop/loopback-component-explorer/pull/148) remove references to ubuntu font ([anthonyettinger](https://github.com/anthonyettinger))
 * [PR#141](https://github.com/strongloop/loopback-component-explorer/pull/141) Returning updated swaggerObject ([pktippa](https://github.com/pktippa))
 * [@2186b69](https://github.com/strongloop/loopback-component-explorer/commit/2186b69885f5b505ec59c0e2595a3c43e0759d9a) Update swaggerObject when a new model was added ([Pradeep Kumar Tippa](https://github.com/pktippa))


### loopback-component-passport
 * **Released 2.0.0** ([Ryan Graham](https://github.com/rmg))
 * [PR#115](https://github.com/strongloop/loopback-component-passport/pull/115) Fix version Number ([loay](https://github.com/loay))
 * [PR#113](https://github.com/strongloop/loopback-component-passport/pull/113) Use Auto-generated email ([loay](https://github.com/loay))
 * [PR#110](https://github.com/strongloop/loopback-component-passport/pull/110) Enforce email verification for local accounts ([loay](https://github.com/loay))


### loopback-component-push
 * [PR#109](https://github.com/strongloop/loopback-component-push/pull/109) Remove dependency on loopback-testing ([superkhau](https://github.com/superkhau))
 * **Released 1.5.2** (Simon Ho)
 * [PR#108](https://github.com/strongloop/loopback-component-push/pull/108) Remove example dir ([superkhau](https://github.com/superkhau))


### loopback-component-storage
 * [@24cd1a6](https://github.com/strongloop/loopback-component-storage/commit/24cd1a619e33ed1882f6ea818e3e2bd450d51d62) Remove test file ([Raymond Feng](https://github.com/raymondfeng))
 * [@685db48](https://github.com/strongloop/loopback-component-storage/commit/685db4819d972c07c45d58a1774f76dbdf95554d) Replace image ([Raymond Feng](https://github.com/raymondfeng))


