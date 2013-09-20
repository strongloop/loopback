var loopback = require('../../');
var app = loopback();
var MemoryConnector = loopback.Memory;

/**
 * Define a Color model
 */

var Color = loopback.Model.extend('color');

/**
 * Attach the Color model to a memory DataSource
 */

var MemoryDataSource = loopback.createDataSource({connector: MemoryConnector});
Color.attachTo(MemoryDataSource);

/**
 * Insert some Color model instances into the memory database
 */

Color.create({
  name: 'red'
});

Color.create({
  name: 'blue'
});

Color.create({
  name: 'green'
});

/**
 * Query the colors using the REST API
 */

console.log('find the colors using REST:');
console.log('\tcurl http://localhost:3000/colors');

/*
 * Expose models over REST 
 */

app.use(loopback.rest());
app.model(Color);

/**
 * Start the server
 */

app.listen(3000);
