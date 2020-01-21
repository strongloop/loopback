// Copyright IBM Corp. 2013,2019. All Rights Reserved.
// Node module: loopback
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

'use strict';
const g = require('../../lib/globalize');
const loopback = require('../../');
const app = loopback();

app.use(loopback.rest());

const schema = {
  name: String,
};

app.dataSource('db', {connector: 'memory'});
const Color = app.registry.createModel('color', schema);
app.model(Color, {dataSource: 'db'});

Color.create({name: 'red'});
Color.create({name: 'green'});
Color.create({name: 'blue'});

app.listen(3000);

g.log('a list of colors is available at {{http://localhost:3000/colors}}');
