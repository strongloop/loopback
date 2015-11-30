---
layout: page
---
## Sprint 84 (2015-11-17 to 2015-11-30)

### Components
 * loopback-component-storage
   * **Released 1.6.0** ([Raymond Feng](https://github.com/raymondfeng))
   * [@fdb4c04](https://github.com/strongloop/loopback-component-storage/commit/fdb4c0464e774e512acfa39ff3847df456378e91) Add range support ([Raymond Feng](https://github.com/raymondfeng))


### Core
 * loopback-datasource-juggler
   * [PR#776](https://github.com/strongloop/loopback-datasource-juggler/pull/776) Update helper scripts ([superkhau](https://github.com/superkhau))
   * **Released 2.43.0** ([Raymond Feng](https://github.com/raymondfeng))
   * [PR#755](https://github.com/strongloop/loopback-datasource-juggler/pull/755) fixes #753 ([zmijevik](https://github.com/zmijevik))
   * [PR#775](https://github.com/strongloop/loopback-datasource-juggler/pull/775) Fix for issue #774 ([pktippa](https://github.com/pktippa))
   * [PR#764](https://github.com/strongloop/loopback-datasource-juggler/pull/764) Capture includeHasMany() as a find()'s caller by findCaller option ([eugene-frb](https://github.com/eugene-frb))
   * [PR#772](https://github.com/strongloop/loopback-datasource-juggler/pull/772) Ignored Error ([Abebw](https://github.com/Abebw))
   * [PR#715](https://github.com/strongloop/loopback-datasource-juggler/pull/715) foreignKey dataLength fix ([nennad](https://github.com/nennad))
   * [PR#773](https://github.com/strongloop/loopback-datasource-juggler/pull/773) silence a warning that introduced in bluebird 3.0.x ([clarkorz](https://github.com/clarkorz))
   * **Released 2.42.0** ([Raymond Feng](https://github.com/raymondfeng))
   * [PR#770](https://github.com/strongloop/loopback-datasource-juggler/pull/770) Correction of a regression introduced by commit 632898b ([MichaelDiguet](https://github.com/MichaelDiguet))
   * **Released 2.41.2** ([Raymond Feng](https://github.com/raymondfeng))
   * [@d7bbd7e](https://github.com/strongloop/loopback-datasource-juggler/commit/d7bbd7e215073f6d484ebe06c132d19ba2aa4d72) Fix the typo ([Raymond Feng](https://github.com/raymondfeng))
   * [@c26b857](https://github.com/strongloop/loopback-datasource-juggler/commit/c26b857a87b3431e5e9fe43a697ee67bb2566fb4) UpdateAttributes: Raises an error if database fails ([Wilson Júnior](https://github.com/wpjunior))
 * generator-loopback
   * [PR#120](https://github.com/strongloop/generator-loopback/pull/120) Make sure relation name different from property name ([jannyHou](https://github.com/jannyHou))
 * loopback-boot
   * **Released 2.14.2** ([Miroslav Bajtoš](https://github.com/bajtos))
   * [PR#159](https://github.com/strongloop/loopback-boot/pull/159) executor: preserve RegExps in middleware paths ([bajtos](https://github.com/bajtos))
   * **Released 2.14.1** ([Miroslav Bajtoš](https://github.com/bajtos))
   * [PR#162](https://github.com/strongloop/loopback-boot/pull/162) Warn about missing main json config file ([Amir-61](https://github.com/Amir-61))
 * loopback-swagger
   * [PR#20](https://github.com/strongloop/loopback-swagger/pull/20) Add GeoPoint support to explorer. ([0candy](https://github.com/0candy))
   * **Released 2.2.2** ([Miroslav Bajtoš](https://github.com/bajtos))
   * [PR#17](https://github.com/strongloop/loopback-swagger/pull/17) specgen: ensure operation ids are unique ([bajtos](https://github.com/bajtos))


### Connectors
 * loopback-connector-mongodb
   * **Released 1.13.1** ([Raymond Feng](https://github.com/raymondfeng))
   * [@15b360c](https://github.com/strongloop/loopback-connector-mongodb/commit/15b360ca304fed503cb3a7e77918e50ca99ac1d4) Fix the test set up ([Raymond Feng](https://github.com/raymondfeng))
 * loopback-connector-mysql
   * [PR#134](https://github.com/strongloop/loopback-connector-mysql/pull/134) Add mysql CI host ([cgole](https://github.com/cgole))
 * loopback-connector-postgresql
   * [PR#119](https://github.com/strongloop/loopback-connector-postgresql/pull/119) add CI DB server ([cgole](https://github.com/cgole))
 * loopback-connector-mssql
   * **Released 2.3.3** ([Raymond Feng](https://github.com/raymondfeng))
   * [PR#62](https://github.com/strongloop/loopback-connector-mssql/pull/62) Fixed buildPartitionByFirst's 'where' argument. ([eugene-frb](https://github.com/eugene-frb))
   * **Released 2.3.2** ([Raymond Feng](https://github.com/raymondfeng))
   * [PR#61](https://github.com/strongloop/loopback-connector-mssql/pull/61) Add PARTITION BY to T-SQL query for include filter(to replace pull request #60) ([eugene-frb](https://github.com/eugene-frb))
 * loopback-connector-remote
   * [PR#27](https://github.com/strongloop/loopback-connector-remote/pull/27) test: load the correct Remote instance ([bajtos](https://github.com/bajtos))


### SDKs
 * loopback-sdk-ios
   * [PR#76](https://github.com/strongloop/loopback-sdk-ios/pull/76) Define module for the framework (Fix Issue #72) ([hideya](https://github.com/hideya))
   * [PR#77](https://github.com/strongloop/loopback-sdk-ios/pull/77) test-server: fix Container's base class to Model ([bajtos](https://github.com/bajtos))
   * [PR#75](https://github.com/strongloop/loopback-sdk-ios/pull/75) Fix framework's exposure of non-public headers and clean-up headers for unit tests ([hideya](https://github.com/hideya))
 * loopback-sdk-angular
   * [PR#191](https://github.com/strongloop/loopback-sdk-angular/pull/191) WIP : Add description from model meta to docs template ([davidcheung](https://github.com/davidcheung))

----

## Sprint 83 (2015-11-03 to 2015-11-16)

### Components
 * loopback-component-oauth2
   * [@e71892d](https://github.com/strongloop/loopback-component-oauth2/commit/e71892d3fa165165c5736332099d76adcaa784b2) Refer to licenses with a link ([Sam Roberts](https://github.com/sam-github))
 * loopback-component-push
   * [@a0fd92c](https://github.com/strongloop/loopback-component-push/commit/a0fd92c26eb5d89ca5ec1772ef835e51a7f8715c) Refer to licenses with a link ([Sam Roberts](https://github.com/sam-github))
 * loopback-component-storage
   * [@a204980](https://github.com/strongloop/loopback-component-storage/commit/a204980c824b288347eca13295cfaf58bdd3e5d5) Refer to licenses with a link ([Sam Roberts](https://github.com/sam-github))
 * loopback-component-explorer
   * [@b8033fc](https://github.com/strongloop/loopback-component-explorer/commit/b8033fc1a1195e9b6d9611e07a280d7e74acd654) Refer to licenses with a link ([Sam Roberts](https://github.com/sam-github))
 * loopback-component-passport
   * **Released 1.6.0** ([Raymond Feng](https://github.com/raymondfeng))
   * [@7f15212](https://github.com/strongloop/loopback-component-passport/commit/7f15212884e0da5dad7644bacd8664041952ac62) Refer to licenses with a link ([Sam Roberts](https://github.com/sam-github))


### Core
 * loopback
   * **Released 2.25.0** ([Raymond Feng](https://github.com/raymondfeng))
   * [PR#1811](https://github.com/strongloop/loopback/pull/1811) Fix typo in description of persistedModel.updateAttributes() ([richardpringle](https://github.com/richardpringle))
   * **Released 2.24.0** (Simon Ho)
   * [PR#1805](https://github.com/strongloop/loopback/pull/1805) Fix cookie-parser error ([superkhau](https://github.com/superkhau))
   * **Released 2.23.0** ([Miroslav Bajtoš](https://github.com/bajtos))
   * [PR#1802](https://github.com/strongloop/loopback/pull/1802) lib/registry: fix findModel for model ctor ([bajtos](https://github.com/bajtos))
   * [@e633617](https://github.com/strongloop/loopback/commit/e633617b8fb2c47f340b8337dd40a78f98704277) Refer to licenses with a link ([Sam Roberts](https://github.com/sam-github))
 * loopback-datasource-juggler
   * [PR#751](https://github.com/strongloop/loopback-datasource-juggler/pull/751) fix a global leak and two typo ([clarkorz](https://github.com/clarkorz))
   * [@a27047a](https://github.com/strongloop/loopback-datasource-juggler/commit/a27047a9669935f607f0485241bdda64f064a2dc) Refer to licenses with a link ([Sam Roberts](https://github.com/sam-github))
 * generator-loopback
   * **Released 1.13.0** ([Simon Ho](https://github.com/superkhau))
   * [PR#119](https://github.com/strongloop/generator-loopback/pull/119) Fix spawn-sync warning ([superkhau](https://github.com/superkhau))
   * [@4ab9bcf](https://github.com/strongloop/generator-loopback/commit/4ab9bcfd57f5d68da1746d1ebcd69f14cbc0f6d0) Refer to licenses with a link ([Sam Roberts](https://github.com/sam-github))
 * loopback-boot
   * [@24fbfbe](https://github.com/strongloop/loopback-boot/commit/24fbfbebf13ec83da2a5cb964658ff904215cee9) Refer to licenses with a link ([Sam Roberts](https://github.com/sam-github))
 * loopback-swagger
   * [@8279872](https://github.com/strongloop/loopback-swagger/commit/8279872afa79b141b08217bb24583b2f889d7651) Fix typo ([Candy](https://github.com/0candy))
   * [@b6e3925](https://github.com/strongloop/loopback-swagger/commit/b6e39252640732e31c26d6831bf86c5b6593aff7) Refer to licenses with a link ([Sam Roberts](https://github.com/sam-github))
   * **Released 2.2.1** ([Miroslav Bajtoš](https://github.com/bajtos))
   * [@cbde5cb](https://github.com/strongloop/loopback-swagger/commit/cbde5cb107e1af8bb45929e4f438c3ed38ec1d50) type-registry: code cleanup ([Miroslav Bajtoš](https://github.com/bajtos))
   * [PR#12](https://github.com/strongloop/loopback-swagger/pull/12) map ObjectID to string type ([clarkorz](https://github.com/clarkorz))
 * loopback-phase
   * [@43e0244](https://github.com/strongloop/loopback-phase/commit/43e02445bee5d977e335671304129976984033ed) Refer to licenses with a link ([Sam Roberts](https://github.com/sam-github))
 * loopback-filters
   * [@9dfa836](https://github.com/strongloop/loopback-filters/commit/9dfa836608396ecc0aece429d09d93eb322a1144) Refer to licenses with a link ([Sam Roberts](https://github.com/sam-github))


### Connectors
 * loopback-connector-oracle
   * [@a4b4856](https://github.com/strongloop/loopback-connector-oracle/commit/a4b4856300d7f372a99a44d642f257bad209b8a4) Refer to licenses with a link ([Sam Roberts](https://github.com/sam-github))
 * loopback-connector-soap
   * [@056ff7c](https://github.com/strongloop/loopback-connector-soap/commit/056ff7c38559fbd8a19c2e270166e5bf915cd6cd) Refer to licenses with a link ([Sam Roberts](https://github.com/sam-github))
 * loopback-connector-rest
   * [@c443ec3](https://github.com/strongloop/loopback-connector-rest/commit/c443ec38e3d5d4c20a8bb884ab8f11ec2a36721b) Refer to licenses with a link ([Sam Roberts](https://github.com/sam-github))
 * loopback-connector-mongodb
   * [PR#190](https://github.com/strongloop/loopback-connector-mongodb/pull/190) Add env variable for mongodb server ([cgole](https://github.com/cgole))
   * [@c060f21](https://github.com/strongloop/loopback-connector-mongodb/commit/c060f21ab69ddde7efd1fe61f6ff94d27beb7d69) Refer to licenses with a link ([Sam Roberts](https://github.com/sam-github))
 * loopback-connector-mysql
   * [@90ca8a5](https://github.com/strongloop/loopback-connector-mysql/commit/90ca8a5879fe3956bedb8b4ad6c8c6f212858208) Refer to licenses with a link ([Sam Roberts](https://github.com/sam-github))
 * loopback-connector-jsonrpc
   * [@86025ae](https://github.com/strongloop/loopback-connector-jsonrpc/commit/86025aef7fe7b5c24591b77649b29d2264ad207d) Refer to licenses with a link ([Sam Roberts](https://github.com/sam-github))
 * loopback-connector-redis
   * [@73056c6](https://github.com/strongloop/loopback-connector-redis/commit/73056c61a742b7827b73cdb2fb951c238a3c2e1d) Refer to licenses with a link ([Sam Roberts](https://github.com/sam-github))
 * loopback-connector-postgresql
   * **Released 2.4.0** ([Raymond Feng](https://github.com/raymondfeng))
   * [@b1a6bab](https://github.com/strongloop/loopback-connector-postgresql/commit/b1a6bab03d9655aee7bb8027655d609ee3e36013) Refer to licenses with a link ([Sam Roberts](https://github.com/sam-github))
 * loopback-connector-mssql
   * [@65561e5](https://github.com/strongloop/loopback-connector-mssql/commit/65561e527423fa14e9160fb88c2b46e7c2252743) Refer to licenses with a link ([Sam Roberts](https://github.com/sam-github))
 * loopback-connector-remote
   * [@9fce179](https://github.com/strongloop/loopback-connector-remote/commit/9fce179932ebc47a5cf53f314b08407763f33747) Refer to licenses with a link ([Sam Roberts](https://github.com/sam-github))
 * loopback-connector-sqlite3
   * [@b40c348](https://github.com/strongloop/loopback-connector-sqlite3/commit/b40c3485dc20bc837feba78f4d2b9333f5acc43b) Refer to licenses with a link ([Sam Roberts](https://github.com/sam-github))


### SDKs
 * loopback-sdk-ios
   * [PR#73](https://github.com/strongloop/loopback-sdk-ios/pull/73) Add missing MobileCoreServices and SystemConfiguration to Podspec ([hideya](https://github.com/hideya))
   * [PR#68](https://github.com/strongloop/loopback-sdk-ios/pull/68) Necessary changes to support PersistedModel.updateAll ([hideya](https://github.com/hideya))
 * loopback-sdk-angular
   * [@d170fd9](https://github.com/strongloop/loopback-sdk-angular/commit/d170fd94e4a4fd3a36ec03e653c35ded5270a9f1) Refer to licenses with a link ([Sam Roberts](https://github.com/sam-github))

----

## Sprint 82 (2015-10-20 to 2015-11-02)

### Components


### Core
 * loopback
   * [@3208547](https://github.com/strongloop/loopback/commit/32085475ed027f5a225e8023a69c98f1950cb7b9) Fix typo in doc comment ([Rand McKinney](https://github.com/crandmck))
 * loopback-datasource-juggler
   * [@d9918d5](https://github.com/strongloop/loopback-datasource-juggler/commit/d9918d526a7a59dbc610295b5727311be4ef0359) dropped unused functions and tests fixed ([Wert_Lex](https://github.com/wertlex))
   * [@2f31701](https://github.com/strongloop/loopback-datasource-juggler/commit/2f31701655840acb86b6e2d62aa2ab81e60f8b2d) One more comment ([Wert_Lex](https://github.com/wertlex))
   * [@638002b](https://github.com/strongloop/loopback-datasource-juggler/commit/638002bc59b148896f7ee38b08ee89b874d842e1) Looks better now ([Wert_Lex](https://github.com/wertlex))
   * **Released 2.41.1** ([Raymond Feng](https://github.com/raymondfeng))
   * [PR#739](https://github.com/strongloop/loopback-datasource-juggler/pull/739) Fix filtering relations of a model with an order specified ([mdartic](https://github.com/mdartic))
   * [PR#746](https://github.com/strongloop/loopback-datasource-juggler/pull/746) Added missing callback when results are filtered ([framp](https://github.com/framp))
 * generator-loopback
   * [PR#117](https://github.com/strongloop/generator-loopback/pull/117) Add Feature: Select Model Location ([JonathanPrince](https://github.com/JonathanPrince))
 * loopback-swagger
   * [PR#13](https://github.com/strongloop/loopback-swagger/pull/13) Register ObjectID for MongoDB, fix cause warning: Swagger: skipping unknown type "ObjectID" ([duyetdev](https://github.com/duyetdev))


### Connectors
 * loopback-connector-soap
   * **Released 2.3.0** ([Raymond Feng](https://github.com/raymondfeng))
   * [@0c4c5c8](https://github.com/strongloop/loopback-connector-soap/commit/0c4c5c8fed76dd286bb6da830b0ef10c31c2da2e) Update soap dep ([Raymond Feng](https://github.com/raymondfeng))


### SDKs
 * loopback-sdk-ios
   * [PR#67](https://github.com/strongloop/loopback-sdk-ios/pull/67) Clean-up [<model-repository> repository] implementations and other minor improvements ([hideya](https://github.com/hideya))

----

## Sprint 81 (2015-10-06 to 2015-10-19)

### Components
 * loopback-component-push
   * [PR#101](https://github.com/strongloop/loopback-component-push/pull/101) Upgrade LB Explorer and related changes ([crandmck](https://github.com/crandmck))
 * loopback-component-storage
   * [PR#92](https://github.com/strongloop/loopback-component-storage/pull/92) Upgrade LB Explorer and related changes ([crandmck](https://github.com/crandmck))


### Core
 * loopback
   * [PR#1684](https://github.com/strongloop/loopback/pull/1684) Do not include redundant ports in verify links ([gausie](https://github.com/gausie))
   * [@351b802](https://github.com/strongloop/loopback/commit/351b8026a0f01f6bf59c944f8244ec6f4f12963d) Do not include redundant ports in verify links ([Samuel Gaus](https://github.com/gausie))
   * [PR#1716](https://github.com/strongloop/loopback/pull/1716) Set application's id property only if it's empty. ([wusuopu](https://github.com/wusuopu))
   * [@ce48521](https://github.com/strongloop/loopback/commit/ce48521efbc17255905cb8d1b6d1464782070711) Set application's id property only if it's empty. ([wusuopu](https://github.com/wusuopu))
   * [PR#1668](https://github.com/strongloop/loopback/pull/1668) Update comment about user ACL to reflect implementation ([philix](https://github.com/philix))
 * loopback-datasource-juggler
   * [@1cab016](https://github.com/strongloop/loopback-datasource-juggler/commit/1cab0164c24bf767a6373d7bff8d099c80819f3e) home-written map extended with proper .set() method ([Wert_Lex](https://github.com/wertlex))
   * [@a5dd9c1](https://github.com/strongloop/loopback-datasource-juggler/commit/a5dd9c181a538454e5b768fb5d191806cf0720a1) on the halfway to keeping original keys ([Wert_Lex](https://github.com/wertlex))
   * [@0864bf7](https://github.com/strongloop/loopback-datasource-juggler/commit/0864bf7154aa42298400de9b26bdfb294a162403) with updated map which stores original key and tests for them ([Wert_Lex](https://github.com/wertlex))
   * **Released 2.41.0** ([Miroslav Bajtoš](https://github.com/bajtos))
   * [PR#725](https://github.com/strongloop/loopback-datasource-juggler/pull/725) Ability to define normalization of undefined query ([jrschumacher](https://github.com/jrschumacher))
   * [@94c3f9a](https://github.com/strongloop/loopback-datasource-juggler/commit/94c3f9a4320fd3654c369f22bfeb0d3c3d6c707e) Ability to define normalization of undefined query ([Ryan Schumacher](https://github.com/jrschumacher))
 * generator-loopback
   * **Released 1.12.1** ([Raymond Feng](https://github.com/raymondfeng))
   * [@52e4111](https://github.com/strongloop/generator-loopback/commit/52e4111b9b83fe8c6eb388d14e5e8bba8e4a9304) Skip non-object model types ([Raymond Feng](https://github.com/raymondfeng))
 * loopback-boot
   * **Released 2.14.0** ([Miroslav Bajtoš](https://github.com/bajtos))
   * [PR#156](https://github.com/strongloop/loopback-boot/pull/156) Support bluemix environment variables for host and port ([bajtos](https://github.com/bajtos))
 * loopback-swagger
   * **Released 2.2.0** ([Raymond Feng](https://github.com/raymondfeng))
   * [PR#11](https://github.com/strongloop/loopback-swagger/pull/11) Feature/add ref support ([raymondfeng](https://github.com/raymondfeng))


### Connectors
 * loopback-connector-soap
   * **Released 2.2.0** ([Raymond Feng](https://github.com/raymondfeng))
   * [PR#26](https://github.com/strongloop/loopback-connector-soap/pull/26) Add support for request options ([raymondfeng](https://github.com/raymondfeng))
 * loopback-connector-mysql
   * [PR#128](https://github.com/strongloop/loopback-connector-mysql/pull/128) Fix database transactions not working with upsert() ([devuo](https://github.com/devuo))


### SDKs

----

