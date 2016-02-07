---
layout: page
since: (from 2015-12-13 to 2016-02-07)
---

## Core

### generator-loopback
 * [PR#138](https://github.com/strongloop/generator-loopback/pull/138) Import `generator#invoke()` directly ([bajtos](https://github.com/bajtos))
 * [PR#136](https://github.com/strongloop/generator-loopback/pull/136) Prevent constructor to be property name ([jannyHou](https://github.com/jannyHou))
 * **Released 1.14.0** ([Simon Ho](https://github.com/superkhau))
 * [PR#133](https://github.com/strongloop/generator-loopback/pull/133) Prevent readonly models in relation generator ([jannyHou](https://github.com/jannyHou))
 * [PR#134](https://github.com/strongloop/generator-loopback/pull/134) Fix ci timeout error. ([0candy](https://github.com/0candy))
 * [PR#121](https://github.com/strongloop/generator-loopback/pull/121) Add command line printing swagger definition to loopback ([0candy](https://github.com/0candy))
 * [PR#132](https://github.com/strongloop/generator-loopback/pull/132) Use shared function ([jannyHou](https://github.com/jannyHou))
 * [PR#130](https://github.com/strongloop/generator-loopback/pull/130) Remove slc:loopback-example ([0candy](https://github.com/0candy))


### loopback
 * [@782e897](https://github.com/strongloop/loopback/commit/782e89758e8583b862f7428eac3bd5ebcf8e6ec1) test: remove forgotten console.trace logs ([Miroslav Bajtoš](https://github.com/bajtos))
 * [PR#2036](https://github.com/strongloop/loopback/pull/2036) Fix race conditions in unit tests ([bajtos](https://github.com/bajtos))
 * [PR#2035](https://github.com/strongloop/loopback/pull/2035) test: remove errant console.log from test ([rmg](https://github.com/rmg))
 * [PR#1999](https://github.com/strongloop/loopback/pull/1999) Promisify change ([jannyHou](https://github.com/jannyHou))
 * [@524058d](https://github.com/strongloop/loopback/commit/524058d8fce3f6e47ae2eb14213df2913b59a71b) Travis: drop iojs, add v4.x and v5.x ([Miroslav Bajtoš](https://github.com/bajtos))
 * [PR#2030](https://github.com/strongloop/loopback/pull/2030) Safer tests - step 1 ([bajtos](https://github.com/bajtos))
 * [PR#1851](https://github.com/strongloop/loopback/pull/1851) Hide verificationToken ([gausie](https://github.com/gausie))
 * [PR#1988](https://github.com/strongloop/loopback/pull/1988) [SEMVER-MAJOR] Remove "loopback.DataModel" ([bajtos](https://github.com/bajtos))
 * [PR#1983](https://github.com/strongloop/loopback/pull/1983) Correct JSDoc findOrCreate() callback in PersistedModel ([noderat](https://github.com/noderat))
 * [PR#1957](https://github.com/strongloop/loopback/pull/1957) Start development of 3.0 ([0candy](https://github.com/0candy))
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


### loopback-boot
 * [PR#168](https://github.com/strongloop/loopback-boot/pull/168) When config is overriden with null don't merge ([alFReD-NSH](https://github.com/alFReD-NSH))
 * [PR#169](https://github.com/strongloop/loopback-boot/pull/169) Fix lodash 4.0.0 breaking changes ([jdrouet](https://github.com/jdrouet))
 * **Released 2.16.0** ([Miroslav Bajtoš](https://github.com/bajtos))
 * [PR#165](https://github.com/strongloop/loopback-boot/pull/165) executor: allow loopback versions >= 3.0.0-alpha ([bajtos](https://github.com/bajtos))


### loopback-datasource-juggler
 * [@504675f](https://github.com/strongloop/loopback-datasource-juggler/commit/504675fc78715f7e4bf4bb3a7ccf36125e8a4a7c) 3.0.0-alpha.2 ([Miroslav Bajtoš](https://github.com/bajtos))
 * [PR#788](https://github.com/strongloop/loopback-datasource-juggler/pull/788) Implementation of replaceOrCreate and replace ([Amir-61](https://github.com/Amir-61))
 * [PR#839](https://github.com/strongloop/loopback-datasource-juggler/pull/839) Fix conversion for `updateAttributes` ([Amir-61](https://github.com/Amir-61))
 * [PR#823](https://github.com/strongloop/loopback-datasource-juggler/pull/823) Prevent constructor to be property name ([jannyHou](https://github.com/jannyHou))
 * [@54ca067](https://github.com/strongloop/loopback-datasource-juggler/commit/54ca06761063e6cab6bb3cac9b2b0c1a790e69bf) Revert "Change "npm test" to call mocha directly" ([Miroslav Bajtoš](https://github.com/bajtos))
 * [PR#831](https://github.com/strongloop/loopback-datasource-juggler/pull/831) Change "npm test" to call mocha directly ([bajtos](https://github.com/bajtos))
 * [PR#826](https://github.com/strongloop/loopback-datasource-juggler/pull/826) Refactor `updateAttributes` ([Amir-61](https://github.com/Amir-61))
 * [@d49dfa0](https://github.com/strongloop/loopback-datasource-juggler/commit/d49dfa0293fe3c649298a283a82e7768104ee754) Update README.md ([Simon Ho](https://github.com/superkhau))
 * [@4ebbd0e](https://github.com/strongloop/loopback-datasource-juggler/commit/4ebbd0e5c2ebf5481c5cf1606fa078abeb4bd2d2) Update README.md ([Simon Ho](https://github.com/superkhau))
 * [@c5f0be8](https://github.com/strongloop/loopback-datasource-juggler/commit/c5f0be83a84baf7df19cdfedc6951b6f3d3be7ee) Update README.md ([Simon Ho](https://github.com/superkhau))
 * [PR#828](https://github.com/strongloop/loopback-datasource-juggler/pull/828) Add unit test to verify fix for #754 ([superkhau](https://github.com/superkhau))
 * [@2cdc4dd](https://github.com/strongloop/loopback-datasource-juggler/commit/2cdc4ddcbf59d5036b230db8742ec636d3b136d0) Update package.json ([Janny](https://github.com/jannyHou))
 * [@ccf52f0](https://github.com/strongloop/loopback-datasource-juggler/commit/ccf52f0822ee7d590cf979cc75d337f0b77724c7) Try mocha test ([Janny](https://github.com/jannyHou))
 * [PR#815](https://github.com/strongloop/loopback-datasource-juggler/pull/815) Implement `findOrCreate` for memory connector ([Amir-61](https://github.com/Amir-61))
 * [PR#790](https://github.com/strongloop/loopback-datasource-juggler/pull/790) [SEMVER-MAJOR] Always use bluebird as the Promise implementation ([jannyHou](https://github.com/jannyHou))
 * [PR#796](https://github.com/strongloop/loopback-datasource-juggler/pull/796) Various fixes in operation hooks ([bajtos](https://github.com/bajtos))
 * [PR#809](https://github.com/strongloop/loopback-datasource-juggler/pull/809) Fix broken code fencings in the docs ([alFReD-NSH](https://github.com/alFReD-NSH))
 * [PR#806](https://github.com/strongloop/loopback-datasource-juggler/pull/806) Revert "Correct syntax for should and more" ([superkhau](https://github.com/superkhau))
 * [PR#804](https://github.com/strongloop/loopback-datasource-juggler/pull/804) Upgrade shouldjs to 8.0.2 ([superkhau](https://github.com/superkhau))
 * [@990307f](https://github.com/strongloop/loopback-datasource-juggler/commit/990307f3d5a5b08a49ae88b505205384312daec0) 3.0.0-alpha.1 ([Miroslav Bajtoš](https://github.com/bajtos))
 * [PR#801](https://github.com/strongloop/loopback-datasource-juggler/pull/801) Start development of 3.0 ([bajtos](https://github.com/bajtos))
 * [PR#792](https://github.com/strongloop/loopback-datasource-juggler/pull/792) Redis test failiures ([Amir-61](https://github.com/Amir-61))


### loopback-phase
 * **Released 1.3.0** ([Miroslav Bajtoš](https://github.com/bajtos))
 * [PR#10](https://github.com/strongloop/loopback-phase/pull/10) Add "phaseList.registerHandler" ([bajtos](https://github.com/bajtos))


### loopback-swagger
 * [PR#24](https://github.com/strongloop/loopback-swagger/pull/24) Make type geopoint case insensitive ([0candy](https://github.com/0candy))
 * [PR#23](https://github.com/strongloop/loopback-swagger/pull/23) Treat property as type 'any' if not specified ([0candy](https://github.com/0candy))
 * [PR#22](https://github.com/strongloop/loopback-swagger/pull/22) Exclude definitions that are not referenced ([0candy](https://github.com/0candy))
 * [PR#19](https://github.com/strongloop/loopback-swagger/pull/19) Fix handling of allOf when generating models ([mastersingh24](https://github.com/mastersingh24))


### strong-remoting
 * [PR#283](https://github.com/strongloop/strong-remoting/pull/283) Do not call "afterError" on success ([bajtos](https://github.com/bajtos))
 * [PR#275](https://github.com/strongloop/strong-remoting/pull/275) Change method call to find remote method. ([0candy](https://github.com/0candy))
 * [@40c331a](https://github.com/strongloop/strong-remoting/commit/40c331a37c34ac5f7f06095bb014780d8dadda87) 3.0.0-alpha.1 ([Miroslav Bajtoš](https://github.com/bajtos))
 * [PR#279](https://github.com/strongloop/strong-remoting/pull/279) Remote invocation phases ([bajtos](https://github.com/bajtos))
 * [PR#278](https://github.com/strongloop/strong-remoting/pull/278) Extract ContextBase and ctx.getScope() ([bajtos](https://github.com/bajtos))
 * [PR#272](https://github.com/strongloop/strong-remoting/pull/272) To allow user to customize the root element of xml output ([davidcheung](https://github.com/davidcheung))
 * [PR#273](https://github.com/strongloop/strong-remoting/pull/273) Start development of 3.0 ([0candy](https://github.com/0candy))
 * **Released 2.24.0** ([Ritchie Martori](https://github.com/ritch))
 * [@eb90d1c](https://github.com/strongloop/strong-remoting/commit/eb90d1c544144d8a5cffb8cfce1d3deca0a6125b) Remove old rest-models example ([Ritchie Martori](https://github.com/ritch))
 * **Released 2.23.2** ([Miroslav Bajtoš](https://github.com/bajtos))
 * [PR#270](https://github.com/strongloop/strong-remoting/pull/270) Retain accepted content-type with no-content ([davidcheung](https://github.com/davidcheung))
 * [PR#261](https://github.com/strongloop/strong-remoting/pull/261) Fix incorrect boolean logic on shared-method's `documented` flag. ([STRML](https://github.com/STRML))
 * **Released 2.23.1** ([Miroslav Bajtoš](https://github.com/bajtos))
 * [PR#269](https://github.com/strongloop/strong-remoting/pull/269) Revert "Refactor and rework http coercion." ([bajtos](https://github.com/bajtos))



## Connectors

### loopback-connector-cloudant
 * [@4798b84](https://github.com/strongloop/loopback-connector-cloudant/commit/4798b843ea501a0f0ac5bff7319827766e87c0f4) default to sorting by id, fix custom id naming, implement filter.include ([Anthony Ffrench](https://github.com/tonyffrench))
 * [@aef5672](https://github.com/strongloop/loopback-connector-cloudant/commit/aef5672d16d5d250c9ebadd9c7fa67fafad3fa14) Updates to conform with StrongLoop eslint config ([Anthony Ffrench](https://github.com/tonyffrench))
 * [@8c5e025](https://github.com/strongloop/loopback-connector-cloudant/commit/8c5e02511c22717cb098cc2108049c647df71ed7) Synchronize the configuration settings with the documentation. remove any hardcoded modelIndex (loopback__model__name) cases ([Anthony Ffrench](https://github.com/tonyffrench))
 * [@05df20f](https://github.com/strongloop/loopback-connector-cloudant/commit/05df20f5d2547f312ea1f9ce9a1040b6acc35686) Add example usage (example/example.js) ... minor fixes ([Anthony Ffrench](https://github.com/tonyffrench))


### loopback-connector-db2
 * [PR#12](https://github.com/strongloop/loopback-connector-db2/pull/12) Dbdiscovery ([qpresley](https://github.com/qpresley))
 * [@c0231de](https://github.com/strongloop/loopback-connector-db2/commit/c0231de905cb7b069d3642ab8f021725d3c6204e) Update IBM DB2 driver. Resolves node v0.10 build issues ([Anthony Ffrench](https://github.com/tonyffrench))
 * [PR#6](https://github.com/strongloop/loopback-connector-db2/pull/6) CI build cleanup ([tonyffrench](https://github.com/tonyffrench))
 * [PR#10](https://github.com/strongloop/loopback-connector-db2/pull/10) update ibm_db level to 0.0.18 - connect to strongloop/loopback-connector-db2#9 ([qpresley](https://github.com/qpresley))
 * [PR#8](https://github.com/strongloop/loopback-connector-db2/pull/8) Add updateOrCreate and ALTER TABLE support ([qpresley](https://github.com/qpresley))
 * [PR#4](https://github.com/strongloop/loopback-connector-db2/pull/4) Readme cleanup ([crandmck](https://github.com/crandmck))
 * [@887da69](https://github.com/strongloop/loopback-connector-db2/commit/887da695c7c85e70d3cf173de1a6c1c92ccf2593) Update package.json an init.js ([Quentin Presley](https://github.com/qpresley))
 * [@ab69ca4](https://github.com/strongloop/loopback-connector-db2/commit/ab69ca40ec7059c4455ec947dad9833281c798b0) Fix up some lint/test issues ([Quentin Presley](https://github.com/qpresley))
 * [@a2c436c](https://github.com/strongloop/loopback-connector-db2/commit/a2c436c9d2f6d0da5c4fee670ddfdb699a72a188) Add settings.schema to the default schema name that is used to qualify unqualified database objects. closes #2 ([Anthony Ffrench](https://github.com/tonyffrench))
 * [@76a8dc1](https://github.com/strongloop/loopback-connector-db2/commit/76a8dc19b40f249749a8a00720336888b5dd90ee) fix another hardcoded id case vs model.idName ([Anthony Ffrench](https://github.com/tonyffrench))
 * [@a190cc5](https://github.com/strongloop/loopback-connector-db2/commit/a190cc5766c35ac1a0920392e597cfe50cfdc4f1) update <dot>gitignore add <dot>npmignore ([Anthony Ffrench](https://github.com/tonyffrench))
 * [@c79a328](https://github.com/strongloop/loopback-connector-db2/commit/c79a328ce7335d7ed71059a72bab9dfdd7852623) add support for limit and offset ([Anthony Ffrench](https://github.com/tonyffrench))
 * [@c4448e3](https://github.com/strongloop/loopback-connector-db2/commit/c4448e34fbb6a04c8247df3a03479caa25daf943) update README, fix timestap issue, start to work on limit and offset ([Anthony Ffrench](https://github.com/tonyffrench))
 * [@b03d365](https://github.com/strongloop/loopback-connector-db2/commit/b03d3657b6b995b25f2f6cd07cb49dee9b65e25a) use version 0.17 of ibm_db driver ([Anthony Ffrench](https://github.com/tonyffrench))
 * [@b780bbb](https://github.com/strongloop/loopback-connector-db2/commit/b780bbbba1bc69558fbab323a5539ebc032c43d1) Retrieve the correct effected row counts for UPDATE and DELETE ([Anthony Ffrench](https://github.com/tonyffrench))
 * [@cf80635](https://github.com/strongloop/loopback-connector-db2/commit/cf806350af12ebc2cd75ac38972c474c6ac5af02) DB2 loopback connector initial commit ([Anthony Ffrench](https://github.com/tonyffrench))
 * [@6dd0688](https://github.com/strongloop/loopback-connector-db2/commit/6dd0688c9dfa0320ecb00484a6faa465c25b59bb) first commit ([Anthony Ffrench](https://github.com/tonyffrench))


### loopback-connector-mongodb
 * [PR#216](https://github.com/strongloop/loopback-connector-mongodb/pull/216) Upgrade should to 8.0.2 ([superkhau](https://github.com/superkhau))
 * [PR#221](https://github.com/strongloop/loopback-connector-mongodb/pull/221) Check dataSource.connecting to prevent race conditions ([fabien](https://github.com/fabien))
 * [PR#210](https://github.com/strongloop/loopback-connector-mongodb/pull/210) Use ObjectId as internal storage for id ([raymondfeng](https://github.com/raymondfeng))
 * [PR#215](https://github.com/strongloop/loopback-connector-mongodb/pull/215) Remove email from AUTHORS ([superkhau](https://github.com/superkhau))
 * [PR#214](https://github.com/strongloop/loopback-connector-mongodb/pull/214) Update description in README.md ([superkhau](https://github.com/superkhau))
 * [PR#211](https://github.com/strongloop/loopback-connector-mongodb/pull/211) Clean up package.json ([superkhau](https://github.com/superkhau))
 * [PR#213](https://github.com/strongloop/loopback-connector-mongodb/pull/213) Update AUTHORS ([superkhau](https://github.com/superkhau))
 * [PR#212](https://github.com/strongloop/loopback-connector-mongodb/pull/212) Add AUTHORS file ([superkhau](https://github.com/superkhau))
 * [PR#209](https://github.com/strongloop/loopback-connector-mongodb/pull/209) test: fix order of semver arguments ([rmg](https://github.com/rmg))
 * [@42f951c](https://github.com/strongloop/loopback-connector-mongodb/commit/42f951cdfd258c35b9488fe8bf232042b7d1150a) Add more tests for id coercion ([Raymond Feng](https://github.com/raymondfeng))


### loopback-connector-mssql
 * [PR#64](https://github.com/strongloop/loopback-connector-mssql/pull/64) Upgrade should to 8.0.2 ([superkhau](https://github.com/superkhau))
 * [PR#68](https://github.com/strongloop/loopback-connector-mssql/pull/68) Add help for Azure SQL users ([sochka](https://github.com/sochka))


### loopback-connector-mysql
 * [PR#146](https://github.com/strongloop/loopback-connector-mysql/pull/146) Upgrade `should` module ([Amir-61](https://github.com/Amir-61))


### loopback-connector-oracle
 * [PR#57](https://github.com/strongloop/loopback-connector-oracle/pull/57) Add NOTICE ([raymondfeng](https://github.com/raymondfeng))
 * [PR#56](https://github.com/strongloop/loopback-connector-oracle/pull/56) Upgrade should to 8.0.2 ([superkhau](https://github.com/superkhau))


### loopback-connector-postgresql
 * [PR#120](https://github.com/strongloop/loopback-connector-postgresql/pull/120) Upgrade should to 8.0.2 ([superkhau](https://github.com/superkhau))


### loopback-connector-redis
 * [PR#15](https://github.com/strongloop/loopback-connector-redis/pull/15) Skip failing tests ([superkhau](https://github.com/superkhau))
 * [PR#14](https://github.com/strongloop/loopback-connector-redis/pull/14) Upgrade should to 8.0.2 ([superkhau](https://github.com/superkhau))
 * [PR#13](https://github.com/strongloop/loopback-connector-redis/pull/13) Use NPM run scripts instead of Make ([superkhau](https://github.com/superkhau))
 * [@5236baa](https://github.com/strongloop/loopback-connector-redis/commit/5236baac6f75ecd4826f0a3bc4983cda1f9b074f) Update README.md ([Simon Ho](https://github.com/superkhau))
 * [@f9e76c7](https://github.com/strongloop/loopback-connector-redis/commit/f9e76c7e8428a6fe1f4ca3ff2ba2896ca9259978) Update README.md ([Simon Ho](https://github.com/superkhau))
 * [@94a73a8](https://github.com/strongloop/loopback-connector-redis/commit/94a73a8385711b881256251b670910b6253c74f8) Update README.md ([Simon Ho](https://github.com/superkhau))
 * [PR#11](https://github.com/strongloop/loopback-connector-redis/pull/11) Refactor ([superkhau](https://github.com/superkhau))


### loopback-connector-remote
 * [PR#36](https://github.com/strongloop/loopback-connector-remote/pull/36) test: listen on ephemeral ports ([bajtos](https://github.com/bajtos))
 * **Released 1.1.0** ([Miroslav Bajtoš](https://github.com/bajtos))
 * [PR#35](https://github.com/strongloop/loopback-connector-remote/pull/35) Register Models with Dynamic converter ([bajtos](https://github.com/bajtos))
 * [@5b721fe](https://github.com/strongloop/loopback-connector-remote/commit/5b721fe016a158bea4f2e2343a8ae51d2c17671c) Update README.md ([Simon Ho](https://github.com/superkhau))
 * [@14bfe9e](https://github.com/strongloop/loopback-connector-remote/commit/14bfe9eaeaef98b242c7de5d36f2b03be8bd6d07) Update README.md ([Simon Ho](https://github.com/superkhau))
 * [PR#31](https://github.com/strongloop/loopback-connector-remote/pull/31) Test fixes ([superkhau](https://github.com/superkhau))
 * [PR#29](https://github.com/strongloop/loopback-connector-remote/pull/29) Cleaning up obsolete or unused files & dependencies ([glesage](https://github.com/glesage))


### loopback-connector-rest
 * [PR#47](https://github.com/strongloop/loopback-connector-rest/pull/47) Remove example dir ([superkhau](https://github.com/superkhau))


### loopback-connector-soap
 * [PR#33](https://github.com/strongloop/loopback-connector-soap/pull/33) Add new example location to README.md ([superkhau](https://github.com/superkhau))
 * [PR#32](https://github.com/strongloop/loopback-connector-soap/pull/32) Remove example dir ([superkhau](https://github.com/superkhau))
 * [PR#30](https://github.com/strongloop/loopback-connector-soap/pull/30) Fix typo in readme.md ([davidcheung](https://github.com/davidcheung))
 * [PR#29](https://github.com/strongloop/loopback-connector-soap/pull/29) Changing soap invocation test to weather services ([davidcheung](https://github.com/davidcheung))


### loopback-connector-sqlite3
 * [PR#12](https://github.com/strongloop/loopback-connector-sqlite3/pull/12) Upgrade should to 8.0.2 ([superkhau](https://github.com/superkhau))



## SDKs

### loopback-sdk-angular
 * [PR#203](https://github.com/strongloop/loopback-sdk-angular/pull/203) Patch safari-private-mode localStorage unusable ([davidcheung](https://github.com/davidcheung))
 * [PR#207](https://github.com/strongloop/loopback-sdk-angular/pull/207) Remove bower.json and update dependencies ([bajtos](https://github.com/bajtos))
 * [PR#201](https://github.com/strongloop/loopback-sdk-angular/pull/201) CommonJS package manager support ([dfeddad](https://github.com/dfeddad))
 * [@08bdc48](https://github.com/strongloop/loopback-sdk-angular/commit/08bdc48db519ef45f6cf8be886f6337ff016d58e) Add CommonJS package manager support ([Djamel Feddad](https://github.com/dfeddad))
 * [PR#202](https://github.com/strongloop/loopback-sdk-angular/pull/202) Fix npm test on windows ([davidcheung](https://github.com/davidcheung))


### loopback-sdk-angular-cli
 * **Released 2.0.1** ([Ryan Graham](https://github.com/rmg))
 * [@8e1fde3](https://github.com/strongloop/loopback-sdk-angular-cli/commit/8e1fde3b0254f93ad30cc3cf724b82c983d3edd9) remove ref to removed lb-ng-doc bin ([Ryan Graham](https://github.com/rmg))
 * **Released 2.0.0** ([Miroslav Bajtoš](https://github.com/bajtos))
 * [PR#36](https://github.com/strongloop/loopback-sdk-angular-cli/pull/36) [SEMVER-MAJOR] Remove lb-ng-doc and docular dependency ([bajtos](https://github.com/bajtos))


### loopback-sdk-ios
 * [PR#93](https://github.com/strongloop/loopback-sdk-ios/pull/93) Improve LBRESTAdapter repositoryWithModelName ([hideya](https://github.com/hideya))
 * [PR#83](https://github.com/strongloop/loopback-sdk-ios/pull/83) Add support for Buffer and GeoPoint data types ([hideya](https://github.com/hideya))
 * [PR#92](https://github.com/strongloop/loopback-sdk-ios/pull/92) Add support for plain model creation ([hideya](https://github.com/hideya))
 * [PR#90](https://github.com/strongloop/loopback-sdk-ios/pull/90) Upload now passes HTTP response as LBFile into success callback ([kgoedecke](https://github.com/kgoedecke))
 * **Released 1.3.2** ([Raymond Feng](https://github.com/raymondfeng))
 * **Released 1.3.1** ([Raymond Feng](https://github.com/raymondfeng))
 * [PR#91](https://github.com/strongloop/loopback-sdk-ios/pull/91) Remove docs and docs-1.0 ([crandmck](https://github.com/crandmck))
 * [PR#85](https://github.com/strongloop/loopback-sdk-ios/pull/85) Added resetPasswordWithEmail to trigger reset of the users password ([kgoedecke](https://github.com/kgoedecke))
 * [PR#87](https://github.com/strongloop/loopback-sdk-ios/pull/87) Fix swift compatibility issue when init'ing a repo ([hideya](https://github.com/hideya))



## Components

### loopback-component-explorer
 * **Released 2.3.0** ([Miroslav Bajtoš](https://github.com/bajtos))
 * **Released 2.2.0** ([Raymond Feng](https://github.com/raymondfeng))
 * [PR#148](https://github.com/strongloop/loopback-component-explorer/pull/148) remove references to ubuntu font ([anthonyettinger](https://github.com/anthonyettinger))
 * [PR#141](https://github.com/strongloop/loopback-component-explorer/pull/141) Returning updated swaggerObject ([pktippa](https://github.com/pktippa))
 * [@2186b69](https://github.com/strongloop/loopback-component-explorer/commit/2186b69885f5b505ec59c0e2595a3c43e0759d9a) Update swaggerObject when a new model was added ([Pradeep Kumar Tippa](https://github.com/pktippa))


### loopback-component-passport
 * [PR#121](https://github.com/strongloop/loopback-component-passport/pull/121) Fix email validation for LDAP ([loay](https://github.com/loay))
 * **Released 2.0.0** ([Ryan Graham](https://github.com/rmg))
 * [PR#115](https://github.com/strongloop/loopback-component-passport/pull/115) Fix version Number ([loay](https://github.com/loay))
 * [PR#113](https://github.com/strongloop/loopback-component-passport/pull/113) Use Auto-generated email ([loay](https://github.com/loay))


### loopback-component-push
 * [PR#109](https://github.com/strongloop/loopback-component-push/pull/109) Remove dependency on loopback-testing ([superkhau](https://github.com/superkhau))
 * **Released 1.5.2** (Simon Ho)
 * [PR#108](https://github.com/strongloop/loopback-component-push/pull/108) Remove example dir ([superkhau](https://github.com/superkhau))


### loopback-component-storage
 * [PR#109](https://github.com/strongloop/loopback-component-storage/pull/109) Migrate examples ([superkhau](https://github.com/superkhau))
 * [PR#102](https://github.com/strongloop/loopback-component-storage/pull/102) Expose originalFilename when getFilename is called ([sanosom](https://github.com/sanosom))
 * [@24cd1a6](https://github.com/strongloop/loopback-component-storage/commit/24cd1a619e33ed1882f6ea818e3e2bd450d51d62) Remove test file ([Raymond Feng](https://github.com/raymondfeng))
 * [@685db48](https://github.com/strongloop/loopback-component-storage/commit/685db4819d972c07c45d58a1774f76dbdf95554d) Replace image ([Raymond Feng](https://github.com/raymondfeng))


