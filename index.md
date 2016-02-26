---
layout: page
since: (from 2016-01-01 to 2016-02-26)
---

## Core

### generator-loopback
 * [PR#149](https://github.com/strongloop/generator-loopback/pull/149) Add project template prompt, support apic ([bajtos](https://github.com/bajtos))
 * [PR#146](https://github.com/strongloop/generator-loopback/pull/146) Only show editable model names in remote-method generator ([jannyHou](https://github.com/jannyHou))
 * **Released 1.15.2** (Raymond Feng)
 * [@9d0a49a](https://github.com/strongloop/generator-loopback/commit/9d0a49ab2da5d801041ab2ae8a0b0a80cedfadc3) Fix the message for apic (Raymond Feng)
 * **Released 1.15.1** ([Raymond Feng](https://github.com/raymondfeng))
 * [PR#144](https://github.com/strongloop/generator-loopback/pull/144) Helpers to display correct usage message for apic ([davidcheung](https://github.com/davidcheung))
 * **Released 1.15.0** ([Raymond Feng](https://github.com/raymondfeng))
 * [PR#143](https://github.com/strongloop/generator-loopback/pull/143) Make `slc arc` conditional based on the cmd name ([raymondfeng](https://github.com/raymondfeng))
 * [PR#138](https://github.com/strongloop/generator-loopback/pull/138) Import `generator#invoke()` directly ([bajtos](https://github.com/bajtos))
 * [PR#136](https://github.com/strongloop/generator-loopback/pull/136) Prevent constructor to be property name ([jannyHou](https://github.com/jannyHou))
 * **Released 1.14.0** ([Simon Ho](https://github.com/superkhau))


### loopback
 * [PR#2088](https://github.com/strongloop/loopback/pull/2088) application: correct spelling of "cannont" ([sam-github](https://github.com/sam-github))
 * [@804265b](https://github.com/strongloop/loopback/commit/804265b801187b072ae182b1f35b9594b304f25f) Remove sl-blip from dependency ([Candy](https://github.com/0candy))
 * [PR#2039](https://github.com/strongloop/loopback/pull/2039) Use new strong-remoting API ([0candy](https://github.com/0candy))
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


### loopback-boot
 * **Released 2.17.0** ([Miroslav Bajtoš](https://github.com/bajtos))
 * [PR#174](https://github.com/strongloop/loopback-boot/pull/174) executor: move "booted" and cb() to the next tick ([bajtos](https://github.com/bajtos))
 * [PR#168](https://github.com/strongloop/loopback-boot/pull/168) When config is overriden with null don't merge ([alFReD-NSH](https://github.com/alFReD-NSH))
 * [PR#169](https://github.com/strongloop/loopback-boot/pull/169) Fix lodash 4.0.0 breaking changes ([jdrouet](https://github.com/jdrouet))


### loopback-datasource-juggler
 * [@dd4530c](https://github.com/strongloop/loopback-datasource-juggler/commit/dd4530cad62107c8f32fe0e3b8335ee9db930104) 3.0.0-alpha.3 ([Miroslav Bajtoš](https://github.com/bajtos))
 * [PR#852](https://github.com/strongloop/loopback-datasource-juggler/pull/852) Fix missing connector error msg for db2, cloudant ([0candy](https://github.com/0candy))
 * [PR#847](https://github.com/strongloop/loopback-datasource-juggler/pull/847) Update describe-operation-hooks ([bajtos](https://github.com/bajtos))
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


### loopback-phase
 * **Released 1.3.0** ([Miroslav Bajtoš](https://github.com/bajtos))
 * [PR#10](https://github.com/strongloop/loopback-phase/pull/10) Add "phaseList.registerHandler" ([bajtos](https://github.com/bajtos))


### loopback-swagger
 * **Released 2.3.0** ([Miroslav Bajtoš](https://github.com/bajtos))
 * [PR#24](https://github.com/strongloop/loopback-swagger/pull/24) Make type geopoint case insensitive ([0candy](https://github.com/0candy))
 * [PR#23](https://github.com/strongloop/loopback-swagger/pull/23) Treat property as type 'any' if not specified ([0candy](https://github.com/0candy))


### strong-remoting
 * [@9fb9119](https://github.com/strongloop/strong-remoting/commit/9fb9119b156b367276fffc55d02be08d34d5f4df) 3.0.0-alpha.2 ([Miroslav Bajtoš](https://github.com/bajtos))
 * [PR#283](https://github.com/strongloop/strong-remoting/pull/283) Do not call "afterError" on success ([bajtos](https://github.com/bajtos))
 * [PR#275](https://github.com/strongloop/strong-remoting/pull/275) Change method call to find remote method. ([0candy](https://github.com/0candy))
 * [@40c331a](https://github.com/strongloop/strong-remoting/commit/40c331a37c34ac5f7f06095bb014780d8dadda87) 3.0.0-alpha.1 ([Miroslav Bajtoš](https://github.com/bajtos))
 * [PR#279](https://github.com/strongloop/strong-remoting/pull/279) Remote invocation phases ([bajtos](https://github.com/bajtos))
 * [PR#278](https://github.com/strongloop/strong-remoting/pull/278) Extract ContextBase and ctx.getScope() ([bajtos](https://github.com/bajtos))
 * [PR#272](https://github.com/strongloop/strong-remoting/pull/272) To allow user to customize the root element of xml output ([davidcheung](https://github.com/davidcheung))
 * [PR#273](https://github.com/strongloop/strong-remoting/pull/273) Start development of 3.0 ([0candy](https://github.com/0candy))



## Connectors

### loopback-connector-cloudant
 * [@4798b84](https://github.com/strongloop/loopback-connector-cloudant/commit/4798b843ea501a0f0ac5bff7319827766e87c0f4) default to sorting by id, fix custom id naming, implement filter.include ([Anthony Ffrench](https://github.com/tonyffrench))


### loopback-connector-db2
 * [@d2a8789](https://github.com/strongloop/loopback-connector-db2/commit/d2a878963aa7305ef3e2308149803b7ba2efc02c) Fix for hasMany tests ([Quentin Presley](https://github.com/qpresley))
 * [PR#16](https://github.com/strongloop/loopback-connector-db2/pull/16) clean up console.log in db2.js ([qpresley](https://github.com/qpresley))
 * [PR#15](https://github.com/strongloop/loopback-connector-db2/pull/15) Adding migration tests and updates to code to improve on some reported issues ([qpresley](https://github.com/qpresley))
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


### loopback-connector-mongodb
 * [PR#216](https://github.com/strongloop/loopback-connector-mongodb/pull/216) Upgrade should to 8.0.2 ([superkhau](https://github.com/superkhau))
 * [PR#221](https://github.com/strongloop/loopback-connector-mongodb/pull/221) Check dataSource.connecting to prevent race conditions ([fabien](https://github.com/fabien))
 * [PR#210](https://github.com/strongloop/loopback-connector-mongodb/pull/210) Use ObjectId as internal storage for id ([raymondfeng](https://github.com/raymondfeng))


### loopback-connector-mssql
 * **Released 2.4.1** ([Miroslav Bajtoš](https://github.com/bajtos))
 * [@1a00250](https://github.com/strongloop/loopback-connector-mssql/commit/1a00250e375c2c396ebb8b4931083d17cfce6da0) Remove sl-blip from dependencies ([Miroslav Bajtoš](https://github.com/bajtos))
 * **Released 2.4.0** ([Raymond Feng](https://github.com/raymondfeng))
 * [PR#70](https://github.com/strongloop/loopback-connector-mssql/pull/70) #21 Fix for Insert into Table with Active Trigger ([FoysalOsmany](https://github.com/FoysalOsmany))
 * [PR#64](https://github.com/strongloop/loopback-connector-mssql/pull/64) Upgrade should to 8.0.2 ([superkhau](https://github.com/superkhau))
 * [PR#68](https://github.com/strongloop/loopback-connector-mssql/pull/68) Add help for Azure SQL users ([sochka](https://github.com/sochka))


### loopback-connector-mysql
 * **Released 2.2.1** ([Miroslav Bajtoš](https://github.com/bajtos))
 * [@c321556](https://github.com/strongloop/loopback-connector-mysql/commit/c32155611d1bd3e4efbc1c8f1d3e82d2fe14bb17) Remove sl-blip from dependencies ([Miroslav Bajtoš](https://github.com/bajtos))
 * [PR#146](https://github.com/strongloop/loopback-connector-mysql/pull/146) Upgrade `should` module ([Amir-61](https://github.com/Amir-61))


### loopback-connector-oracle
 * **Released 2.3.1** ([Miroslav Bajtoš](https://github.com/bajtos))
 * [@3e08c96](https://github.com/strongloop/loopback-connector-oracle/commit/3e08c96e117aa42662c0ca6a7619c3c29e07dae9) Remove sl-blip from dependencies ([Miroslav Bajtoš](https://github.com/bajtos))
 * [PR#57](https://github.com/strongloop/loopback-connector-oracle/pull/57) Add NOTICE ([raymondfeng](https://github.com/raymondfeng))
 * [PR#56](https://github.com/strongloop/loopback-connector-oracle/pull/56) Upgrade should to 8.0.2 ([superkhau](https://github.com/superkhau))


### loopback-connector-postgresql
 * **Released 2.4.1** ([Miroslav Bajtoš](https://github.com/bajtos))
 * [@e64a894](https://github.com/strongloop/loopback-connector-postgresql/commit/e64a894c80031182a5f86a893b7ff3b990d1e485) Remove sl-blip from dependencies ([Miroslav Bajtoš](https://github.com/bajtos))
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
 * **Released 1.2.0** ([Raymond Feng](https://github.com/raymondfeng))
 * [@b875050](https://github.com/strongloop/loopback-connector-remote/commit/b8750508c2a36d80ba86da129943edb4c3dc6ac3) Remove blip ([Raymond Feng](https://github.com/raymondfeng))
 * [PR#36](https://github.com/strongloop/loopback-connector-remote/pull/36) test: listen on ephemeral ports ([bajtos](https://github.com/bajtos))
 * **Released 1.1.0** ([Miroslav Bajtoš](https://github.com/bajtos))
 * [PR#35](https://github.com/strongloop/loopback-connector-remote/pull/35) Register Models with Dynamic converter ([bajtos](https://github.com/bajtos))
 * [@5b721fe](https://github.com/strongloop/loopback-connector-remote/commit/5b721fe016a158bea4f2e2343a8ae51d2c17671c) Update README.md ([Simon Ho](https://github.com/superkhau))
 * [@14bfe9e](https://github.com/strongloop/loopback-connector-remote/commit/14bfe9eaeaef98b242c7de5d36f2b03be8bd6d07) Update README.md ([Simon Ho](https://github.com/superkhau))


### loopback-connector-rest
 * **Released 1.10.2** ([Miroslav Bajtoš](https://github.com/bajtos))
 * [@4048ed7](https://github.com/strongloop/loopback-connector-rest/commit/4048ed7a53813884910561bc59137688a7abe74d) Remove sl-blip from dependencies ([Miroslav Bajtoš](https://github.com/bajtos))
 * [PR#47](https://github.com/strongloop/loopback-connector-rest/pull/47) Remove example dir ([superkhau](https://github.com/superkhau))


### loopback-connector-soap
 * **Released 2.3.1** ([Miroslav Bajtoš](https://github.com/bajtos))
 * [@bbf366f](https://github.com/strongloop/loopback-connector-soap/commit/bbf366f0457811411e83c70f0918fa7f011b05b3) Remove sl-blip from dependencies ([Miroslav Bajtoš](https://github.com/bajtos))
 * [PR#33](https://github.com/strongloop/loopback-connector-soap/pull/33) Add new example location to README.md ([superkhau](https://github.com/superkhau))
 * [PR#32](https://github.com/strongloop/loopback-connector-soap/pull/32) Remove example dir ([superkhau](https://github.com/superkhau))
 * [PR#30](https://github.com/strongloop/loopback-connector-soap/pull/30) Fix typo in readme.md ([davidcheung](https://github.com/davidcheung))


### loopback-connector-sqlite3
 * **Released 1.1.1** ([Miroslav Bajtoš](https://github.com/bajtos))
 * [@127c8fb](https://github.com/strongloop/loopback-connector-sqlite3/commit/127c8fbe0fc974443be400c00b03657c21230e35) Fix CHANGES.md ([Miroslav Bajtoš](https://github.com/bajtos))
 * [@0fcc27d](https://github.com/strongloop/loopback-connector-sqlite3/commit/0fcc27dfaf94e3638a4ecaea5a8f8655388d9a30) last e3ce30b4d67c211db11b82e3eb524eed3a7154ee head 78006909331d252419ec50b0ecbf2b44d4dcad2c ([Miroslav Bajtoš](https://github.com/bajtos))
 * [@7800690](https://github.com/strongloop/loopback-connector-sqlite3/commit/78006909331d252419ec50b0ecbf2b44d4dcad2c) Remove sl-blip from dependencies ([Miroslav Bajtoš](https://github.com/bajtos))
 * [PR#12](https://github.com/strongloop/loopback-connector-sqlite3/pull/12) Upgrade should to 8.0.2 ([superkhau](https://github.com/superkhau))



## SDKs

### loopback-sdk-angular
 * **Released 1.7.0** ([Miroslav Bajtoš](https://github.com/bajtos))
 * [PR#203](https://github.com/strongloop/loopback-sdk-angular/pull/203) Patch safari-private-mode localStorage unusable ([davidcheung](https://github.com/davidcheung))
 * [PR#207](https://github.com/strongloop/loopback-sdk-angular/pull/207) Remove bower.json and update dependencies ([bajtos](https://github.com/bajtos))
 * [PR#201](https://github.com/strongloop/loopback-sdk-angular/pull/201) CommonJS package manager support ([dfeddad](https://github.com/dfeddad))
 * [@08bdc48](https://github.com/strongloop/loopback-sdk-angular/commit/08bdc48db519ef45f6cf8be886f6337ff016d58e) Add CommonJS package manager support ([Djamel Feddad](https://github.com/dfeddad))
 * [PR#202](https://github.com/strongloop/loopback-sdk-angular/pull/202) Fix npm test on windows ([davidcheung](https://github.com/davidcheung))


### loopback-sdk-ios
 * [PR#101](https://github.com/strongloop/loopback-sdk-ios/pull/101) Cleanup typedefs for success blocks, mark extra typedefs "deprecated" ([hideya](https://github.com/hideya))
 * [PR#100](https://github.com/strongloop/loopback-sdk-ios/pull/100) Fix error in upsert implementation and make SLObject.repository attribute strong ([hideya](https://github.com/hideya))
 * [PR#93](https://github.com/strongloop/loopback-sdk-ios/pull/93) Improve LBRESTAdapter repositoryWithModelName ([hideya](https://github.com/hideya))
 * [PR#83](https://github.com/strongloop/loopback-sdk-ios/pull/83) Add support for Buffer and GeoPoint data types ([hideya](https://github.com/hideya))
 * [PR#92](https://github.com/strongloop/loopback-sdk-ios/pull/92) Add support for plain model creation ([hideya](https://github.com/hideya))
 * [PR#90](https://github.com/strongloop/loopback-sdk-ios/pull/90) Upload now passes HTTP response as LBFile into success callback ([kgoedecke](https://github.com/kgoedecke))
 * **Released 1.3.2** ([Raymond Feng](https://github.com/raymondfeng))
 * **Released 1.3.1** ([Raymond Feng](https://github.com/raymondfeng))
 * [PR#91](https://github.com/strongloop/loopback-sdk-ios/pull/91) Remove docs and docs-1.0 ([crandmck](https://github.com/crandmck))



## Components

### loopback-component-explorer
 * **Released 2.3.0** ([Miroslav Bajtoš](https://github.com/bajtos))
 * **Released 2.2.0** ([Raymond Feng](https://github.com/raymondfeng))
 * [PR#148](https://github.com/strongloop/loopback-component-explorer/pull/148) remove references to ubuntu font ([anthonyettinger](https://github.com/anthonyettinger))


### loopback-component-oauth2
 * **Released 2.3.7** ([Miroslav Bajtoš](https://github.com/bajtos))
 * [@4abd4b0](https://github.com/strongloop/loopback-component-oauth2/commit/4abd4b04e2c3cc5ff4cf983c9efd38f2a1f7b061) Remove sl-blip from dependencies ([Miroslav Bajtoš](https://github.com/bajtos))


### loopback-component-passport
 * [PR#121](https://github.com/strongloop/loopback-component-passport/pull/121) Fix email validation for LDAP ([loay](https://github.com/loay))


### loopback-component-push
 * **Released 1.5.3** ([Miroslav Bajtoš](https://github.com/bajtos))
 * [@b093dea](https://github.com/strongloop/loopback-component-push/commit/b093dea13d995146a8f5d47e3b0af4c8eba4abc6) Remove sl-blip from dependencies ([Miroslav Bajtoš](https://github.com/bajtos))


### loopback-component-storage
 * **Released 1.7.0** ([Miroslav Bajtoš](https://github.com/bajtos))
 * [@69bcf93](https://github.com/strongloop/loopback-component-storage/commit/69bcf93247122ffb4b272fa0e47cbd94fe59671d) Remove sl-blip from dependencies ([Miroslav Bajtoš](https://github.com/bajtos))
 * [PR#109](https://github.com/strongloop/loopback-component-storage/pull/109) Migrate examples ([superkhau](https://github.com/superkhau))
 * [PR#102](https://github.com/strongloop/loopback-component-storage/pull/102) Expose originalFilename when getFilename is called ([sanosom](https://github.com/sanosom))


