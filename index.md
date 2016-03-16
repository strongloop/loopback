---
layout: page
since: (from 2016-01-20 to 2016-03-16)
---

## Core

### generator-loopback
 * **Released 1.19.0** (Raymond Feng)
 * [PR#160](https://github.com/strongloop/generator-loopback/pull/160) Add the option to install connector modules on demand ([raymondfeng](https://github.com/raymondfeng))
 * **Released 1.18.0** (Raymond Feng)
 * [PR#159](https://github.com/strongloop/generator-loopback/pull/159) Fix data source ordier and default for models ([raymondfeng](https://github.com/raymondfeng))
 * **Released 1.17.2** (Raymond Feng)
 * [@4984d62](https://github.com/strongloop/generator-loopback/commit/4984d62720fa2f30933503401558dfb457aeecde) Allow default value for datasource settings (Raymond Feng)
 * **Released 1.17.1** (Raymond Feng)
 * [@933bfd2](https://github.com/strongloop/generator-loopback/commit/933bfd251fd5b1594f09b609a0054e7822949b28) Update workspace dep (Raymond Feng)
 * **Released 1.17.0** (Raymond Feng)
 * [PR#158](https://github.com/strongloop/generator-loopback/pull/158) Add support for object/array data source settings ([raymondfeng](https://github.com/raymondfeng))
 * **Released 1.16.3** (Raymond Feng)
 * [PR#157](https://github.com/strongloop/generator-loopback/pull/157) Allow connectors without config settings ([raymondfeng](https://github.com/raymondfeng))
 * **Released 1.16.2** (Raymond Feng)
 * [PR#156](https://github.com/strongloop/generator-loopback/pull/156) Only use 'db' as the default datasource for a model if 'db' exists ([raymondfeng](https://github.com/raymondfeng))
 * **Released 1.16.1** ([Ritchie Martori](https://github.com/ritch))
 * [PR#155](https://github.com/strongloop/generator-loopback/pull/155) Remove prompt for datasources when none exist ([ritch](https://github.com/ritch))
 * [PR#154](https://github.com/strongloop/generator-loopback/pull/154) Implement `yo loopback --no-explorer` ([bajtos](https://github.com/bajtos))
 * [PR#152](https://github.com/strongloop/generator-loopback/pull/152) datasource: ask for connector-specific settings ([bajtos](https://github.com/bajtos))
 * **Released 1.16.0** (Raymond Feng)
 * [PR#147](https://github.com/strongloop/generator-loopback/pull/147) Use http and verb ([jannyHou](https://github.com/jannyHou))
 * [PR#150](https://github.com/strongloop/generator-loopback/pull/150) Add `yo loopback --skip-next-steps` option ([bajtos](https://github.com/bajtos))
 * [PR#149](https://github.com/strongloop/generator-loopback/pull/149) Add project template prompt, support apic ([bajtos](https://github.com/bajtos))
 * [PR#146](https://github.com/strongloop/generator-loopback/pull/146) Only show editable model names in remote-method generator ([jannyHou](https://github.com/jannyHou))
 * **Released 1.15.2** (Raymond Feng)
 * [@9d0a49a](https://github.com/strongloop/generator-loopback/commit/9d0a49ab2da5d801041ab2ae8a0b0a80cedfadc3) Fix the message for apic (Raymond Feng)
 * **Released 1.15.1** ([Raymond Feng](https://github.com/raymondfeng))
 * [PR#144](https://github.com/strongloop/generator-loopback/pull/144) Helpers to display correct usage message for apic ([davidcheung](https://github.com/davidcheung))
 * **Released 1.15.0** ([Raymond Feng](https://github.com/raymondfeng))
 * [PR#143](https://github.com/strongloop/generator-loopback/pull/143) Make `slc arc` conditional based on the cmd name ([raymondfeng](https://github.com/raymondfeng))
 * [PR#138](https://github.com/strongloop/generator-loopback/pull/138) Import `generator#invoke()` directly ([bajtos](https://github.com/bajtos))


### loopback
 * [PR#2105](https://github.com/strongloop/loopback/pull/2105) Improve error message on connector init error ([bajtos](https://github.com/bajtos))
 * [PR#2088](https://github.com/strongloop/loopback/pull/2088) application: correct spelling of "cannont" ([sam-github](https://github.com/sam-github))
 * [@804265b](https://github.com/strongloop/loopback/commit/804265b801187b072ae182b1f35b9594b304f25f) Remove sl-blip from dependency ([Candy](https://github.com/0candy))
 * [PR#2039](https://github.com/strongloop/loopback/pull/2039) Use new strong-remoting API ([0candy](https://github.com/0candy))
 * [@782e897](https://github.com/strongloop/loopback/commit/782e89758e8583b862f7428eac3bd5ebcf8e6ec1) test: remove forgotten console.trace logs ([Miroslav Bajtoš](https://github.com/bajtos))
 * [PR#2036](https://github.com/strongloop/loopback/pull/2036) Fix race conditions in unit tests ([bajtos](https://github.com/bajtos))
 * [PR#2035](https://github.com/strongloop/loopback/pull/2035) test: remove errant console.log from test ([rmg](https://github.com/rmg))
 * [PR#1999](https://github.com/strongloop/loopback/pull/1999) Promisify change ([jannyHou](https://github.com/jannyHou))
 * [@524058d](https://github.com/strongloop/loopback/commit/524058d8fce3f6e47ae2eb14213df2913b59a71b) Travis: drop iojs, add v4.x and v5.x ([Miroslav Bajtoš](https://github.com/bajtos))
 * [PR#2030](https://github.com/strongloop/loopback/pull/2030) Safer tests - step 1 ([bajtos](https://github.com/bajtos))


### loopback-boot
 * **Released 2.17.0** ([Miroslav Bajtoš](https://github.com/bajtos))
 * [PR#174](https://github.com/strongloop/loopback-boot/pull/174) executor: move "booted" and cb() to the next tick ([bajtos](https://github.com/bajtos))
 * [PR#168](https://github.com/strongloop/loopback-boot/pull/168) When config is overriden with null don't merge ([alFReD-NSH](https://github.com/alFReD-NSH))


### loopback-datasource-juggler
 * [PR#873](https://github.com/strongloop/loopback-datasource-juggler/pull/873) Update error message for missing connector ([gunjpan](https://github.com/gunjpan))
 * [PR#862](https://github.com/strongloop/loopback-datasource-juggler/pull/862) Add forgotten unit test ([bajtos](https://github.com/bajtos))
 * [PR#859](https://github.com/strongloop/loopback-datasource-juggler/pull/859) Improve error message on connector init error ([bajtos](https://github.com/bajtos))
 * [@dd4530c](https://github.com/strongloop/loopback-datasource-juggler/commit/dd4530cad62107c8f32fe0e3b8335ee9db930104) 3.0.0-alpha.3 ([Miroslav Bajtoš](https://github.com/bajtos))
 * [PR#852](https://github.com/strongloop/loopback-datasource-juggler/pull/852) Fix missing connector error msg for db2, cloudant ([0candy](https://github.com/0candy))
 * [PR#847](https://github.com/strongloop/loopback-datasource-juggler/pull/847) Update describe-operation-hooks ([bajtos](https://github.com/bajtos))
 * [@504675f](https://github.com/strongloop/loopback-datasource-juggler/commit/504675fc78715f7e4bf4bb3a7ccf36125e8a4a7c) 3.0.0-alpha.2 ([Miroslav Bajtoš](https://github.com/bajtos))
 * [PR#788](https://github.com/strongloop/loopback-datasource-juggler/pull/788) Implementation of replaceOrCreate and replace ([Amir-61](https://github.com/Amir-61))
 * [PR#839](https://github.com/strongloop/loopback-datasource-juggler/pull/839) Fix conversion for `updateAttributes` ([Amir-61](https://github.com/Amir-61))
 * [PR#823](https://github.com/strongloop/loopback-datasource-juggler/pull/823) Prevent constructor to be property name ([jannyHou](https://github.com/jannyHou))
 * [@54ca067](https://github.com/strongloop/loopback-datasource-juggler/commit/54ca06761063e6cab6bb3cac9b2b0c1a790e69bf) Revert "Change "npm test" to call mocha directly" ([Miroslav Bajtoš](https://github.com/bajtos))
 * [PR#831](https://github.com/strongloop/loopback-datasource-juggler/pull/831) Change "npm test" to call mocha directly ([bajtos](https://github.com/bajtos))


### loopback-phase
 * **Released 1.3.0** ([Miroslav Bajtoš](https://github.com/bajtos))
 * [PR#10](https://github.com/strongloop/loopback-phase/pull/10) Add "phaseList.registerHandler" ([bajtos](https://github.com/bajtos))


### loopback-swagger
 * **Released 2.3.1** (Raymond Feng)
 * [PR#30](https://github.com/strongloop/loopback-swagger/pull/30) Handle extensions under paths ([raymondfeng](https://github.com/raymondfeng))
 * **Released 2.3.0** ([Miroslav Bajtoš](https://github.com/bajtos))
 * [PR#24](https://github.com/strongloop/loopback-swagger/pull/24) Make type geopoint case insensitive ([0candy](https://github.com/0candy))


### strong-remoting
 * [PR#284](https://github.com/strongloop/strong-remoting/pull/284) Add support for "file" return args ([bajtos](https://github.com/bajtos))
 * [@9fb9119](https://github.com/strongloop/strong-remoting/commit/9fb9119b156b367276fffc55d02be08d34d5f4df) 3.0.0-alpha.2 ([Miroslav Bajtoš](https://github.com/bajtos))
 * [PR#283](https://github.com/strongloop/strong-remoting/pull/283) Do not call "afterError" on success ([bajtos](https://github.com/bajtos))
 * [PR#275](https://github.com/strongloop/strong-remoting/pull/275) Change method call to find remote method. ([0candy](https://github.com/0candy))
 * [@40c331a](https://github.com/strongloop/strong-remoting/commit/40c331a37c34ac5f7f06095bb014780d8dadda87) 3.0.0-alpha.1 ([Miroslav Bajtoš](https://github.com/bajtos))
 * [PR#279](https://github.com/strongloop/strong-remoting/pull/279) Remote invocation phases ([bajtos](https://github.com/bajtos))
 * [PR#278](https://github.com/strongloop/strong-remoting/pull/278) Extract ContextBase and ctx.getScope() ([bajtos](https://github.com/bajtos))
 * [PR#272](https://github.com/strongloop/strong-remoting/pull/272) To allow user to customize the root element of xml output ([davidcheung](https://github.com/davidcheung))



## Connectors

### loopback-connector-cloudant
 * **Released 1.0.7** ([Anthony Ffrench](https://github.com/tonyffrench))
 * [@78bd90d](https://github.com/strongloop/loopback-connector-cloudant/commit/78bd90d934ec2d01ac98e865d52f0c0f8f285cbc) coerce id names before attempting to resolve includes ([Anthony Ffrench](https://github.com/tonyffrench))
 * **Released 1.0.6** ([Anthony Ffrench](https://github.com/tonyffrench))
 * [@60e705e](https://github.com/strongloop/loopback-connector-cloudant/commit/60e705ed4f720ae940952f9418d76f236b67112a) rename CHANGES to work with slt-release ([Anthony Ffrench](https://github.com/tonyffrench))
 * [@33dfc47](https://github.com/strongloop/loopback-connector-cloudant/commit/33dfc47e6254f9b1c7b7736a59e5aef7eb1836c1) Include related docs in chunks to avoid too many boolean clauses, closes #6 ([Anthony Ffrench](https://github.com/tonyffrench))
 * [@cf478fd](https://github.com/strongloop/loopback-connector-cloudant/commit/cf478fda2027308bc3699b080581c9b3c0399d1e) Use the bookmark field to grab beyond 200 documents, closes #3 ([Anthony Ffrench](https://github.com/tonyffrench))
 * [@a67cfcb](https://github.com/strongloop/loopback-connector-cloudant/commit/a67cfcb1c05bc7c1ade96ac107db0d4e1657c387) Throw a better exception when url or username and password are undefined ([Anthony Ffrench](https://github.com/tonyffrench))


### loopback-connector-db2
 * **Released 1.0.10** ([Quentin Presley](https://github.com/qpresley))
 * **Released 1.0.9** ([Quentin Presley](https://github.com/qpresley))
 * [PR#21](https://github.com/strongloop/loopback-connector-db2/pull/21) Add dashDB support ([qpresley](https://github.com/qpresley))
 * **Released 1.0.8** ([Quentin Presley](https://github.com/qpresley))
 * [PR#20](https://github.com/strongloop/loopback-connector-db2/pull/20) Update migration to support connector specific properties stanza ([qpresley](https://github.com/qpresley))
 * **Released 1.0.7** ([Quentin Presley](https://github.com/qpresley))
 * **Released 1.0.6** ([Quentin Presley](https://github.com/qpresley))
 * [@aeca345](https://github.com/strongloop/loopback-connector-db2/commit/aeca3458dac2f2a5fab081cfd1802ab14eb6216d) Remove commented out line in transaction.js ([Quentin Presley](https://github.com/qpresley))
 * [PR#19](https://github.com/strongloop/loopback-connector-db2/pull/19) Add transaction support and tests ([qpresley](https://github.com/qpresley))
 * **Released 1.0.5** ([Quentin Presley](https://github.com/qpresley))
 * [@f207206](https://github.com/strongloop/loopback-connector-db2/commit/f20720628ad36ec74308c079ce4d71f1f3bd98d3) updating settings for user in connection string ([Quentin Presley](https://github.com/qpresley))
 * **Released 1.0.4** ([Quentin Presley](https://github.com/qpresley))
 * [@ca2bea8](https://github.com/strongloop/loopback-connector-db2/commit/ca2bea88ae2f20e197e12b6045eabb52fccdd1a1) fix connection string ([Quentin Presley](https://github.com/qpresley))
 * [@50cd43b](https://github.com/strongloop/loopback-connector-db2/commit/50cd43b6fd9f6b04482dcc6ad90595811e8dc388) update connection string setup ([Quentin Presley](https://github.com/qpresley))
 * [@a17bdd2](https://github.com/strongloop/loopback-connector-db2/commit/a17bdd2eb6387769283f7482c8384d3f2a07f543) Consolidate and update changelog as CHANGES.md ([Ryan Graham](https://github.com/rmg))
 * **Released 1.0.3** ([Quentin Presley](https://github.com/qpresley))
 * [@d2a8789](https://github.com/strongloop/loopback-connector-db2/commit/d2a878963aa7305ef3e2308149803b7ba2efc02c) Fix for hasMany tests ([Quentin Presley](https://github.com/qpresley))
 * [PR#16](https://github.com/strongloop/loopback-connector-db2/pull/16) clean up console.log in db2.js ([qpresley](https://github.com/qpresley))
 * [PR#15](https://github.com/strongloop/loopback-connector-db2/pull/15) Adding migration tests and updates to code to improve on some reported issues ([qpresley](https://github.com/qpresley))
 * [PR#12](https://github.com/strongloop/loopback-connector-db2/pull/12) Dbdiscovery ([qpresley](https://github.com/qpresley))
 * [@c0231de](https://github.com/strongloop/loopback-connector-db2/commit/c0231de905cb7b069d3642ab8f021725d3c6204e) Update IBM DB2 driver. Resolves node v0.10 build issues ([Anthony Ffrench](https://github.com/tonyffrench))
 * [PR#6](https://github.com/strongloop/loopback-connector-db2/pull/6) CI build cleanup ([tonyffrench](https://github.com/tonyffrench))
 * [PR#10](https://github.com/strongloop/loopback-connector-db2/pull/10) update ibm_db level to 0.0.18 - connect to strongloop/loopback-connector-db2#9 ([qpresley](https://github.com/qpresley))
 * [PR#8](https://github.com/strongloop/loopback-connector-db2/pull/8) Add updateOrCreate and ALTER TABLE support ([qpresley](https://github.com/qpresley))


### loopback-connector-mssql
 * [@cad27c5](https://github.com/strongloop/loopback-connector-mssql/commit/cad27c56ef1b1599c646d5d87b4939551035e130) Remove regenerator from babel-runtime and bundle mssql (Raymond Feng)
 * **Released 2.5.1** (Raymond Feng)
 * [@51b4a8e](https://github.com/strongloop/loopback-connector-mssql/commit/51b4a8e052098230029fd7950cb820f0b31a15bf) Remove the license check (Raymond Feng)
 * **Released 2.5.0** (Raymond Feng)
 * **Released 2.4.1** ([Miroslav Bajtoš](https://github.com/bajtos))
 * [@1a00250](https://github.com/strongloop/loopback-connector-mssql/commit/1a00250e375c2c396ebb8b4931083d17cfce6da0) Remove sl-blip from dependencies ([Miroslav Bajtoš](https://github.com/bajtos))
 * **Released 2.4.0** ([Raymond Feng](https://github.com/raymondfeng))
 * [PR#70](https://github.com/strongloop/loopback-connector-mssql/pull/70) #21 Fix for Insert into Table with Active Trigger ([FoysalOsmany](https://github.com/FoysalOsmany))


### loopback-connector-mysql
 * **Released 2.2.1** ([Miroslav Bajtoš](https://github.com/bajtos))
 * [@c321556](https://github.com/strongloop/loopback-connector-mysql/commit/c32155611d1bd3e4efbc1c8f1d3e82d2fe14bb17) Remove sl-blip from dependencies ([Miroslav Bajtoš](https://github.com/bajtos))


### loopback-connector-oracle
 * **Released 2.4.1** (Raymond Feng)
 * [@1f93047](https://github.com/strongloop/loopback-connector-oracle/commit/1f930471cec6a394ed92639f137b4fb2d610a591) Remove license check (Raymond Feng)
 * **Released 2.4.0** (Raymond Feng)
 * **Released 2.3.1** ([Miroslav Bajtoš](https://github.com/bajtos))
 * [@3e08c96](https://github.com/strongloop/loopback-connector-oracle/commit/3e08c96e117aa42662c0ca6a7619c3c29e07dae9) Remove sl-blip from dependencies ([Miroslav Bajtoš](https://github.com/bajtos))
 * [PR#57](https://github.com/strongloop/loopback-connector-oracle/pull/57) Add NOTICE ([raymondfeng](https://github.com/raymondfeng))


### loopback-connector-postgresql
 * **Released 2.4.1** ([Miroslav Bajtoš](https://github.com/bajtos))
 * [@e64a894](https://github.com/strongloop/loopback-connector-postgresql/commit/e64a894c80031182a5f86a893b7ff3b990d1e485) Remove sl-blip from dependencies ([Miroslav Bajtoš](https://github.com/bajtos))


### loopback-connector-redis
 * [PR#15](https://github.com/strongloop/loopback-connector-redis/pull/15) Skip failing tests ([superkhau](https://github.com/superkhau))


### loopback-connector-remote
 * **Released 1.2.0** ([Raymond Feng](https://github.com/raymondfeng))
 * [@b875050](https://github.com/strongloop/loopback-connector-remote/commit/b8750508c2a36d80ba86da129943edb4c3dc6ac3) Remove blip ([Raymond Feng](https://github.com/raymondfeng))
 * [PR#36](https://github.com/strongloop/loopback-connector-remote/pull/36) test: listen on ephemeral ports ([bajtos](https://github.com/bajtos))
 * **Released 1.1.0** ([Miroslav Bajtoš](https://github.com/bajtos))
 * [PR#35](https://github.com/strongloop/loopback-connector-remote/pull/35) Register Models with Dynamic converter ([bajtos](https://github.com/bajtos))


### loopback-connector-rest
 * **Released 1.11.0** (Raymond Feng)
 * [PR#55](https://github.com/strongloop/loopback-connector-rest/pull/55) Feature/switch to jsonpath plus ([raymondfeng](https://github.com/raymondfeng))
 * [PR#49](https://github.com/strongloop/loopback-connector-rest/pull/49) handle http status code >= 4XX as errors ([horiaradu](https://github.com/horiaradu))
 * [PR#53](https://github.com/strongloop/loopback-connector-rest/pull/53) This should fix issue #21 'Delete api not working' ([jouke](https://github.com/jouke))
 * **Released 1.10.2** ([Miroslav Bajtoš](https://github.com/bajtos))
 * [@4048ed7](https://github.com/strongloop/loopback-connector-rest/commit/4048ed7a53813884910561bc59137688a7abe74d) Remove sl-blip from dependencies ([Miroslav Bajtoš](https://github.com/bajtos))


### loopback-connector-soap
 * **Released 2.4.0** (Raymond Feng)
 * [@dfae045](https://github.com/strongloop/loopback-connector-soap/commit/dfae045320100c60689f9137a750ce655825222a) Upgrade deps and remove license check (Raymond Feng)
 * **Released 2.3.1** ([Miroslav Bajtoš](https://github.com/bajtos))
 * [@bbf366f](https://github.com/strongloop/loopback-connector-soap/commit/bbf366f0457811411e83c70f0918fa7f011b05b3) Remove sl-blip from dependencies ([Miroslav Bajtoš](https://github.com/bajtos))
 * [PR#33](https://github.com/strongloop/loopback-connector-soap/pull/33) Add new example location to README.md ([superkhau](https://github.com/superkhau))


### loopback-connector-sqlite3
 * **Released 1.1.1** ([Miroslav Bajtoš](https://github.com/bajtos))
 * [@127c8fb](https://github.com/strongloop/loopback-connector-sqlite3/commit/127c8fbe0fc974443be400c00b03657c21230e35) Fix CHANGES.md ([Miroslav Bajtoš](https://github.com/bajtos))
 * [@0fcc27d](https://github.com/strongloop/loopback-connector-sqlite3/commit/0fcc27dfaf94e3638a4ecaea5a8f8655388d9a30) last e3ce30b4d67c211db11b82e3eb524eed3a7154ee head 78006909331d252419ec50b0ecbf2b44d4dcad2c ([Miroslav Bajtoš](https://github.com/bajtos))
 * [@7800690](https://github.com/strongloop/loopback-connector-sqlite3/commit/78006909331d252419ec50b0ecbf2b44d4dcad2c) Remove sl-blip from dependencies ([Miroslav Bajtoš](https://github.com/bajtos))



## SDKs

### loopback-sdk-angular
 * **Released 1.7.0** ([Miroslav Bajtoš](https://github.com/bajtos))
 * [PR#203](https://github.com/strongloop/loopback-sdk-angular/pull/203) Patch safari-private-mode localStorage unusable ([davidcheung](https://github.com/davidcheung))


### loopback-sdk-ios
 * [PR#101](https://github.com/strongloop/loopback-sdk-ios/pull/101) Cleanup typedefs for success blocks, mark extra typedefs "deprecated" ([hideya](https://github.com/hideya))
 * [PR#100](https://github.com/strongloop/loopback-sdk-ios/pull/100) Fix error in upsert implementation and make SLObject.repository attribute strong ([hideya](https://github.com/hideya))
 * [PR#93](https://github.com/strongloop/loopback-sdk-ios/pull/93) Improve LBRESTAdapter repositoryWithModelName ([hideya](https://github.com/hideya))
 * [PR#83](https://github.com/strongloop/loopback-sdk-ios/pull/83) Add support for Buffer and GeoPoint data types ([hideya](https://github.com/hideya))
 * [PR#92](https://github.com/strongloop/loopback-sdk-ios/pull/92) Add support for plain model creation ([hideya](https://github.com/hideya))



## Components

### loopback-component-explorer
 * **Released 2.4.0** (Raymond Feng)
 * [PR#154](https://github.com/strongloop/loopback-component-explorer/pull/154) Add `swaggerUI` option to enable/disable UI serving ([raymondfeng](https://github.com/raymondfeng))
 * **Released 2.3.0** ([Miroslav Bajtoš](https://github.com/bajtos))


### loopback-component-oauth2
 * **Released 2.4.0** (Raymond Feng)
 * [@cfd2fb4](https://github.com/strongloop/loopback-component-oauth2/commit/cfd2fb4b9c0891dca0973c4ad9e2efc987b1b6ed) Remove license check (Raymond Feng)
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


