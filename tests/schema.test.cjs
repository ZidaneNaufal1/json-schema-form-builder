const test = require('node:test');
const assert = require('node:assert/strict');
const api = require('../schema.js');
const schema = {type:'object',properties:{name:{type:'string'},level:{type:'number'},shift:{type:'string',enum:['Pagi','Sore']}},required:['name','shift']};
test('accepts supported schema and valid values', () => { assert.equal(api.parseSchema(schema), schema); assert.deepEqual(api.validate(schema,{name:'Ada',level:2,shift:'Pagi'}),[]); });
test('reports required, numeric and enum errors', () => { const errors=api.validate(schema,{level:'2',shift:'Malam'}); assert.equal(errors.length,3); });
test('rejects unsupported schema and nested properties', () => { assert.throws(()=>api.parseSchema({type:'object',properties:{x:{type:'object'}}})); assert.throws(()=>api.parseSchema({...schema,$ref:'x'})); });
test('rejects unknown values and non-finite numbers', () => { assert.equal(api.validate(schema,{name:'x',shift:'Pagi',level:Infinity,extra:1}).length,2); });
test('rejects unsafe field names and duplicate enums', () => { assert.throws(()=>api.parseSchema({type:'object',properties:{'bad id':{type:'string'}}})); assert.throws(()=>api.parseSchema({type:'object',properties:{x:{type:'string',enum:['a','a']}}})); });
