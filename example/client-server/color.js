// use it as module 
var Enum = require('enum');
 
// or extend node.js with this new type 
require('enum').register();
 
// define a simple enum (automatically flaggable -> A: 0x01, B: 0x02, C: 0x04) 
//Uses bitwise 'OR' operation in between the values and creates enumerated constants. For example, if 'Read':1, 'Write':2, then ReadWrite= Read | Write = 1 | 2 = 3; 
//var myEnum = new Enum(['A', 'B', 'C']);
 
//define a flagged enum object to create a multicolor option; just pass an array 
var myEnum = new Enum(['Black', 'Red', 'Green', 'Blue']);
//myEnum; //=> Enum {_options: Object, enums: Array[4], Black: EnumItem, Red: EnumItem, Green: EnumItem….....} 
myEnum.isFlaggable; //=> true 
 
for(var i=1; i<8; i++)
    { 
        console.log(myEnum.get(i).value + '=> '+ myEnum.get(i).key);
    }


    // define an enum with own values 
var myEnum = new Enum({'A': 1, 'B': 2, 'C': 4});
 
// if defining a flaggable enum, you can define your own separator (default is ' | ') 
var myEnum = new Enum(['A', 'B', 'C'], { separator: ' | ' });
 
// if you want your enum to have a name define it in the options 
var myEnum = new Enum(['A', 'B', 'C'], { name: 'MyEnum' });
 
// or 
var myEnum = new Enum(['A', 'B', 'C'], 'MyEnum');
 
// if you want your enum to have an explicit "endianness", define it in the options 
// (defaults to `os.endianness()`) 
var myEnum = new Enum(['A', 'B', 'C'], { endianness: 'BE' });
 
// if you want your enum to be not case sensitive 
// (defaults to `false`) 
var myEnum = new Enum(['One', 'tWo', 'ThrEE'], { ignoreCase: true });
myEnum.get('one'); // => myEnum.One 
myEnum.get('TWO'); // => myEnum.tWo 
myEnum.ThrEE.is('three'); // => true 
 
// this option will make instances of Enum non-extensible 
// (defaults to `false`) 
var myEnum = new Enum(['ONE', 'TWO', 'THREE'], { freez: true });
 
//define enum type without flag 
var myEnum = new Enum({'None': 0, 'Black':1, 'Red': 2, 'Red2': 3, 'Green': 4, 'Blue': 5});
myEnum; //=>  Enum {_options: Object, enums: Array[6], None: EnumItem, Black: EnumItem, Red: EnumItem…........} 
myEnum.isFlaggable; //=> false 
 
myEnum.toJSON(); // returns {'None': 0, 'Black':1, 'Red': 2, 'Red2': 3, 'Green': 4, 'Blue': 5} 
JSON.stringify(myEnum); // returns '{"None":0,"Black":1,"Red":2,"Red2":3,"Green":4,"Blue":5}' 
 
for(var i=0; i<=5; i++){ console.log(myEnum.get(i).value + '=> '+ myEnum.get(i).key)}
