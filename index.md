---
layout: page
since: (from 2016-05-06 to 2016-07-01)
---

## Core

### generator-loopback
 * [PR#203](https://github.com/strongloop/generator-loopback/pull/203) Update generator-loopback to yeoman 0.23 ([0candy](https://github.com/0candy))
 * [PR#206](https://github.com/strongloop/generator-loopback/pull/206) test: remove workarounds no longer needed ([bajtos](https://github.com/bajtos))
 * **Released 1.22.0** ([Miroslav Bajtoš](https://github.com/bajtos))
 * [PR#199](https://github.com/strongloop/generator-loopback/pull/199) Support custom connector ([jannyHou](https://github.com/jannyHou))
 * [PR#197](https://github.com/strongloop/generator-loopback/pull/197) Add prompt for lbVersion ([jannyHou](https://github.com/jannyHou))
 * [PR#198](https://github.com/strongloop/generator-loopback/pull/198) Fix "undefined" model name ([rundef](https://github.com/rundef))
 * **Released 1.21.1** ([Raymond Feng](https://github.com/raymondfeng))
 * [PR#195](https://github.com/strongloop/generator-loopback/pull/195) Fix generator prompt validate error ([0candy](https://github.com/0candy))
 * [PR#188](https://github.com/strongloop/generator-loopback/pull/188) remote-method: make prompts more descriptive ([bajtos](https://github.com/bajtos))
 * **Released 1.21.0** ([Raymond Feng](https://github.com/raymondfeng))
 * [PR#192](https://github.com/strongloop/generator-loopback/pull/192) Fix/revert promise ([jannyHou](https://github.com/jannyHou))
 * [PR#173](https://github.com/strongloop/generator-loopback/pull/173) Allow defining remote method without isStatic flag ([0candy](https://github.com/0candy))
 * [PR#190](https://github.com/strongloop/generator-loopback/pull/190) Fix failing relation name test ([eddiemonge](https://github.com/eddiemonge))
 * **Released 1.20.7** ([Miroslav Bajtoš](https://github.com/bajtos))
 * [PR#184](https://github.com/strongloop/generator-loopback/pull/184) remove glob devDep ([eddiemonge](https://github.com/eddiemonge))
 * [PR#187](https://github.com/strongloop/generator-loopback/pull/187) fix/update-to-promise-support ([jannyHou](https://github.com/jannyHou))


### loopback
 * [PR#2437](https://github.com/strongloop/loopback/pull/2437) Remove `rectifyAllChanges` and `rectifyChange` ([0candy](https://github.com/0candy))
 * [PR#2440](https://github.com/strongloop/loopback/pull/2440) Fix verificationToken bug ([loay](https://github.com/loay))
 * [PR#2446](https://github.com/strongloop/loopback/pull/2446) update express version ([loay](https://github.com/loay))
 * [@42c83f6](https://github.com/strongloop/loopback/commit/42c83f69a090664bb025d89f8dd5f5a7a3ffa34e) Cleanup unit-test added in 1fc51d129 ([Miroslav Bajtoš](https://github.com/bajtos))
 * [PR#2411](https://github.com/strongloop/loopback/pull/2411) [SEMVER-MAJOR] Remove `loopback#errorHandler` middleware ([loay](https://github.com/loay))
 * [@a2e199f](https://github.com/strongloop/loopback/commit/a2e199f02554c75845bcbb0cc37843b3816f375b) 3.0.0-alpha.2 ([Miroslav Bajtoš](https://github.com/bajtos))
 * [PR#2227](https://github.com/strongloop/loopback/pull/2227) add missing unit tests for #2108 ([benkroeger](https://github.com/benkroeger))
 * [@83b5d72](https://github.com/strongloop/loopback/commit/83b5d72073397420c252093b9e52f1dc58d823b3) add missing unit tests for #2108 ([Benjamin Kroeger](https://github.com/benkroeger))
 * [PR#2316](https://github.com/strongloop/loopback/pull/2316) Expose `Replace*` methods ([Amir-61](https://github.com/Amir-61))
 * [PR#2375](https://github.com/strongloop/loopback/pull/2375) [SEMVER-MAJOR] Fix remoting strong-error-handler ([davidcheung](https://github.com/davidcheung))
 * [PR#2394](https://github.com/strongloop/loopback/pull/2394) [SEMVER-MAJOR] Remove legacy express 3.x middleware getters ([bajtos](https://github.com/bajtos))
 * [PR#2360](https://github.com/strongloop/loopback/pull/2360) Docuemtation for `replace*` methods ([Amir-61](https://github.com/Amir-61))
 * [PR#2349](https://github.com/strongloop/loopback/pull/2349) Make the doc clear for `findORCreate` cb ([Amir-61](https://github.com/Amir-61))


### loopback-boot
 * **Released 2.19.0** ([Miroslav Bajtoš](https://github.com/bajtos))


### loopback-datasource-juggler
 * [@45e14af](https://github.com/strongloop/loopback-datasource-juggler/commit/45e14af4a981fcf376276babeb344ceac578186c) Update validations.js ([Rand McKinney](https://github.com/crandmck))
 * [PR#976](https://github.com/strongloop/loopback-datasource-juggler/pull/976) [SEMVER-MAJOR] Remove DataSource.registerType() ([gunjpan](https://github.com/gunjpan))
 * [@fbe58f7](https://github.com/strongloop/loopback-datasource-juggler/commit/fbe58f7cf82b0a8e7e04afbaddea319fb7e8e8d1) give options to validators #984 ([RobinBiondi](https://github.com/robinbiondi))
 * [PR#947](https://github.com/strongloop/loopback-datasource-juggler/pull/947) [SEMVER-MAJOR] Throw Error for property names with dots ([gunjpan](https://github.com/gunjpan))
 * [PR#960](https://github.com/strongloop/loopback-datasource-juggler/pull/960) Update datasource.js ([ritch](https://github.com/ritch))
 * [@058d9d4](https://github.com/strongloop/loopback-datasource-juggler/commit/058d9d46c09f249dd7aa14a09e3097aae8a7a21b) 3.0.0-alpha.5 ([Miroslav Bajtoš](https://github.com/bajtos))
 * [PR#952](https://github.com/strongloop/loopback-datasource-juggler/pull/952) Avoid changing PK of instance in operation hook when forceId is set ([Amir-61](https://github.com/Amir-61))
 * [PR#965](https://github.com/strongloop/loopback-datasource-juggler/pull/965) [SEMVER-MAJOR] Remove model events ([0candy](https://github.com/0candy))
 * [@ea2266e](https://github.com/strongloop/loopback-datasource-juggler/commit/ea2266e453220208b204d3817a866ea7f0b42410) Persist changes on parent for embedsOne ([Dimitris Halatsis](https://github.com/mitsos1os))
 * [PR#964](https://github.com/strongloop/loopback-datasource-juggler/pull/964) Fix `disableInclude` for hasAndBelongsToMany relation ([Amir-61](https://github.com/Amir-61))
 * [PR#953](https://github.com/strongloop/loopback-datasource-juggler/pull/953) Fix error message ([Amir-61](https://github.com/Amir-61))
 * [PR#954](https://github.com/strongloop/loopback-datasource-juggler/pull/954) Retun err for UPSERT if the connector returns err ([Amir-61](https://github.com/Amir-61))
 * [PR#955](https://github.com/strongloop/loopback-datasource-juggler/pull/955) ModelBuilder: add new setting strictEmbeddedModels ([bajtos](https://github.com/bajtos))
 * [PR#950](https://github.com/strongloop/loopback-datasource-juggler/pull/950) Add test's description ([Amir-61](https://github.com/Amir-61))
 * [PR#944](https://github.com/strongloop/loopback-datasource-juggler/pull/944) [SEMVER-MAJOR] throw error for undefined mixin ([alexpit](https://github.com/alexpit))
 * [PR#938](https://github.com/strongloop/loopback-datasource-juggler/pull/938) Fix incompatibility between different connectors for replace methods ([Amir-61](https://github.com/Amir-61))
 * [PR#943](https://github.com/strongloop/loopback-datasource-juggler/pull/943) travis: add v4, v6, drop io.js ([bajtos](https://github.com/bajtos))
 * [PR#937](https://github.com/strongloop/loopback-datasource-juggler/pull/937) fix avoid duplicate record on scope with promise ([alexpit](https://github.com/alexpit))


### loopback-swagger
 * [PR#47](https://github.com/strongloop/loopback-swagger/pull/47) Add doc root ([jannyHou](https://github.com/jannyHou))
 * [PR#39](https://github.com/strongloop/loopback-swagger/pull/39) Add custom definition to swagger file ([jannyHou](https://github.com/jannyHou))


### strong-remoting
 * [@f899aa3](https://github.com/strongloop/strong-remoting/commit/f899aa342a4b3b10becb999bcd997e70b5147213) Prioritise auth errors over sharedCtor errors ([Miroslav Bajtoš](https://github.com/bajtos))
 * [@aa0bda6](https://github.com/strongloop/strong-remoting/commit/aa0bda634b1d2883b0549f9cde65baf65d55ea16) Fix style violations introduced by a1b156b9 ([Miroslav Bajtoš](https://github.com/bajtos))
 * [PR#271](https://github.com/strongloop/strong-remoting/pull/271) Allow source to be `formData` (=== `form`) to comply with swagger-definition ([0ff](https://github.com/0ff))
 * [@2e4a500](https://github.com/strongloop/strong-remoting/commit/2e4a50041f3b3e8c336f0d2609d108bc65219f83) Add http source "formData" ([Fabian Off](https://github.com/0ff))
 * [@6cf759a](https://github.com/strongloop/strong-remoting/commit/6cf759ab0ed69d598a252a485ace09e773a4e139) 3.0.0-alpha.3 ([Miroslav Bajtoš](https://github.com/bajtos))
 * [@270d88f](https://github.com/strongloop/strong-remoting/commit/270d88f6062890b60491c4fde4f6ea5c96aeea5e) Fix integration tests for coercion in REST ([Miroslav Bajtoš](https://github.com/bajtos))
 * [PR#304](https://github.com/strongloop/strong-remoting/pull/304) Test rest coercion ([bajtos](https://github.com/bajtos))
 * [PR#302](https://github.com/strongloop/strong-remoting/pull/302) [SEMVER-MAJOR] Implement strong error handler for rest-adapter ([davidcheung](https://github.com/davidcheung))
 * [PR#305](https://github.com/strongloop/strong-remoting/pull/305) Implement getEndpoints ([Amir-61](https://github.com/Amir-61))
 * [PR#303](https://github.com/strongloop/strong-remoting/pull/303) travis: add v4 and v6, drop io.js ([bajtos](https://github.com/bajtos))



## Connectors

### loopback-connector-dashdb
 * **Released 1.0.15** ([Quentin Presley](https://github.com/qpresley))
 * [@66bdf04](https://github.com/strongloop/loopback-connector-dashdb/commit/66bdf042899d5d35e20e7ec2be52b6e8a32297fb) Update loopback-ibmdb version ([Quentin Presley](https://github.com/qpresley))
 * [@23d8ef6](https://github.com/strongloop/loopback-connector-dashdb/commit/23d8ef6b3fa87d1099371219eeb2e6c66a7f6f8e) Update README.md ([Quentin Presley](https://github.com/qpresley))
 * [@11d4ca0](https://github.com/strongloop/loopback-connector-dashdb/commit/11d4ca03170a32af15284af2f025beecd09a1d87) Update to use loopback-ibmdb ([Quentin Presley](https://github.com/qpresley))
 * [@c08aa32](https://github.com/strongloop/loopback-connector-dashdb/commit/c08aa325cd2ed435ca1e73b9ce23b3878ac07b2a) Update to use loopback-ibmdb ([Quentin Presley](https://github.com/qpresley))
 * [@6e60214](https://github.com/strongloop/loopback-connector-dashdb/commit/6e60214133df3c1798a5de800d0c389d93f58fa2) Update to move most functionality to loopback-connector-ibmdb ([Quentin Presley](https://github.com/qpresley))
 * [@1943f99](https://github.com/strongloop/loopback-connector-dashdb/commit/1943f99dee021f562a3f5c5e6afcc18637e05912) Remove DB2 from package.json ([Quentin Presley](https://github.com/qpresley))
 * [@fdfb3b5](https://github.com/strongloop/loopback-connector-dashdb/commit/fdfb3b58e5389fe44a485675240cf6944804107e) Collapsing for simplicity ([Quentin Presley](https://github.com/qpresley))
 * [@8c519c0](https://github.com/strongloop/loopback-connector-dashdb/commit/8c519c01488ad1c69fb1160fa70c4809643100e5) Get tests functioning ([Quentin Presley](https://github.com/qpresley))
 * [@787c77c](https://github.com/strongloop/loopback-connector-dashdb/commit/787c77c730ea575aacc517f4e199c67c480dd9ed) Initial commit ([Quentin Presley](https://github.com/qpresley))
 * [@48336bc](https://github.com/strongloop/loopback-connector-dashdb/commit/48336bc23a133bf05c4fe15c22d9238c8c406e01) Initial commit ([Quentin Presley](https://github.com/qpresley))


### loopback-connector-db2
 * [PR#36](https://github.com/strongloop/loopback-connector-db2/pull/36) Componentization ([qpresley](https://github.com/qpresley))
 * [@72a8f01](https://github.com/strongloop/loopback-connector-db2/commit/72a8f016062588689169a5b18c7131ffdafe9786) Merge v1.0.17 release ([Ryan Graham](https://github.com/rmg))
 * [@2286350](https://github.com/strongloop/loopback-connector-db2/commit/2286350479b8d8bc29aeb30555968ae17350518a) Update README.md ([Quentin Presley](https://github.com/qpresley))


### loopback-connector-db2z
 * **Released 1.0.2** ([Quentin Presley](https://github.com/qpresley))
 * [@bc4c343](https://github.com/strongloop/loopback-connector-db2z/commit/bc4c3435619fe9946ab89aafa654514f7a79adfa) Update README.md ([Quentin Presley](https://github.com/qpresley))
 * [@73c08f8](https://github.com/strongloop/loopback-connector-db2z/commit/73c08f8f665853ea2de59716cf84268ec361354a) Update loopback-ibmdb version ([Quentin Presley](https://github.com/qpresley))
 * [@342a7f0](https://github.com/strongloop/loopback-connector-db2z/commit/342a7f0c0987268a084f93d33dc40213c2bc8c49) Ignore travis ([Quentin Presley](https://github.com/qpresley))
 * **Released 1.0.1** ([Quentin Presley](https://github.com/qpresley))
 * **Released 1.0.0** ([Quentin Presley](https://github.com/qpresley))
 * [@c21f3e2](https://github.com/strongloop/loopback-connector-db2z/commit/c21f3e2b99f48d3c12287308b2e6d219be3b2cf9) Update README.md ([Quentin Presley](https://github.com/qpresley))
 * [@c970f95](https://github.com/strongloop/loopback-connector-db2z/commit/c970f952f2ac85c533587229accd7fbfa794f9e2) Change to use loopback-ibmdb ([Quentin Presley](https://github.com/qpresley))
 * [@8519471](https://github.com/strongloop/loopback-connector-db2z/commit/8519471ab5e2795a9a7b2c1412f558c9aadda17a) Update to use loopback-ibmdb ([Quentin Presley](https://github.com/qpresley))
 * [@d973433](https://github.com/strongloop/loopback-connector-db2z/commit/d97343327bad8089d7cb511e1f9f6ce38da740ba) Add DB2z code ([Quentin Presley](https://github.com/qpresley))
 * [@f72fbe2](https://github.com/strongloop/loopback-connector-db2z/commit/f72fbe2fb7da6b7f5a8e5385ede5fdba929f10d2) Initial code drop ([Quentin Presley](https://github.com/qpresley))
 * [@d444f2f](https://github.com/strongloop/loopback-connector-db2z/commit/d444f2ffa0a11eab2eb359bc98c12a86a4c2d587) Initial commit ([Quentin Presley](https://github.com/qpresley))


### loopback-connector-mqlight
 * **Released 1.0.0** ([Quentin Presley](https://github.com/qpresley))
 * [@82d0d74](https://github.com/strongloop/loopback-connector-mqlight/commit/82d0d74977dc4a1cb5cda8e20e0193bc8bf94d18) Complete readme and touch up minor typos ([Quentin Presley](https://github.com/qpresley))
 * [@3aed1cb](https://github.com/strongloop/loopback-connector-mqlight/commit/3aed1cb878b9bed67279290e7f0471001832986f) Update tests to include CReate Update and Delete tests ([Quentin Presley](https://github.com/qpresley))
 * [@e0d112d](https://github.com/strongloop/loopback-connector-mqlight/commit/e0d112d65605dfbce0533b16da6697d575df6811) Code cleanup ([Quentin Presley](https://github.com/qpresley))
 * [@53f079b](https://github.com/strongloop/loopback-connector-mqlight/commit/53f079b1b2ff2c33c2fac9667fd8fa78e4ad8726) Updated with working tests ([Quentin Presley](https://github.com/qpresley))
 * [@20893c5](https://github.com/strongloop/loopback-connector-mqlight/commit/20893c5009c49de6edd9be1ab17ead18e854671a) Initial code drop ([Quentin Presley](https://github.com/qpresley))
 * [@7a3c77c](https://github.com/strongloop/loopback-connector-mqlight/commit/7a3c77c36ea72bc60e8b74d9323d74bbcd8de580) Initial commit ([Quentin Presley](https://github.com/qpresley))


### loopback-connector-mssql
 * **Released 2.8.0** ([Simon Ho](https://github.com/superkhau))


### loopback-connector-mysql
 * **Released 2.3.0** ([Simon Ho](https://github.com/superkhau))


### loopback-connector-oracle
 * [@6bdc764](https://github.com/strongloop/loopback-connector-oracle/commit/6bdc7642815426de373c02b47ef861c84c8b6397) Fix package.json to use oracle installer ([Raymond Feng](https://github.com/raymondfeng))
 * [@86e0530](https://github.com/strongloop/loopback-connector-oracle/commit/86e0530f007498835f724f2ef73625804e051ec3) Update dependencies ([Raymond Feng](https://github.com/raymondfeng))
 * [PR#63](https://github.com/strongloop/loopback-connector-oracle/pull/63) [SEMVER-MAJOR] Use oracledb module as the underlying Node.js driver for Oracle DBs ([raymondfeng](https://github.com/raymondfeng))


### loopback-connector-postgresql
 * **Released 2.6.3** ([Raymond Feng](https://github.com/raymondfeng))
 * [@ab5a0cb](https://github.com/strongloop/loopback-connector-postgresql/commit/ab5a0cb7dd8f16f8adc53a13f86e244e372709be) Fix the datasource init ([Raymond Feng](https://github.com/raymondfeng))
 * **Released 2.6.2** ([Raymond Feng](https://github.com/raymondfeng))
 * **Released 2.6.1** ([Raymond Feng](https://github.com/raymondfeng))
 * [@315bd2a](https://github.com/strongloop/loopback-connector-postgresql/commit/315bd2a7cfb0c35063fba14fea87767c7ffc8a45) Fix for https://github.com/strongloop/loopback-connector-postgresql/issues/145 ([Raymond Feng](https://github.com/raymondfeng))
 * **Released 2.6.0** ([Raymond Feng](https://github.com/raymondfeng))
 * [PR#143](https://github.com/strongloop/loopback-connector-postgresql/pull/143) Upgrade to pg 6.0.0 ([raymondfeng](https://github.com/raymondfeng))
 * **Released 2.5.0** ([Simon Ho](https://github.com/superkhau))


### loopback-connector-remote
 * [PR#47](https://github.com/strongloop/loopback-connector-remote/pull/47) Do not use native promises in tests ([superkhau](https://github.com/superkhau))


### loopback-connector-soap
 * **Released 2.5.0** ([Raymond Feng](https://github.com/raymondfeng))
 * [@54dd01d](https://github.com/strongloop/loopback-connector-soap/commit/54dd01df67de603e7f763bc8ed399b92e1cff7b6) Upgrade to soap@0.16 ([Raymond Feng](https://github.com/raymondfeng))
 * [@568557d](https://github.com/strongloop/loopback-connector-soap/commit/568557df4abb2c6e2ef092d1b51a4ac3f17e3cc1) Honor security options ([Raymond Feng](https://github.com/raymondfeng))
 * [@5955176](https://github.com/strongloop/loopback-connector-soap/commit/5955176d389514af3f13cbda3f96304cbd73ee2c) Update deps ([Raymond Feng](https://github.com/raymondfeng))
 * [PR#35](https://github.com/strongloop/loopback-connector-soap/pull/35) Update soap-connector.js ([ritch](https://github.com/ritch))


### loopback-connector-swagger
 * **Released 1.0.0** ([Miroslav Bajtoš](https://github.com/bajtos))
 * [PR#4](https://github.com/strongloop/loopback-connector-swagger/pull/4) Update Readme with more info ([gunjpan](https://github.com/gunjpan))
 * [PR#2](https://github.com/strongloop/loopback-connector-swagger/pull/2) Develop basic connector ([gunjpan](https://github.com/gunjpan))



## SDKs

### loopback-sdk-angular
 * [PR#223](https://github.com/strongloop/loopback-sdk-angular/pull/223) Describe model schema in generated $resource ([bajtos](https://github.com/bajtos))


### loopback-sdk-ios
 * [PR#108](https://github.com/strongloop/loopback-sdk-ios/pull/108) WIP: fix on new CI ([rmg](https://github.com/rmg))



## Components

### loopback-component-explorer
 * [PR#168](https://github.com/strongloop/loopback-component-explorer/pull/168) Redirect get http 301 instead of 303 ([jannyHou](https://github.com/jannyHou))


### loopback-component-push
 * [PR#113](https://github.com/strongloop/loopback-component-push/pull/113) [SEMVER-MINOR] Update GCM, APN and node-cache ([seriousben](https://github.com/seriousben))


### loopback-component-storage
 * [PR#129](https://github.com/strongloop/loopback-component-storage/pull/129) Fixes issue #127 (Bad Content-type returned) ([GaryTowers](https://github.com/GaryTowers))


