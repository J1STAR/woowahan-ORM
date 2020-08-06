# Woowahan-ORM

![license](https://img.shields.io/github/license/zoomkoding/woowahan-orm)
![version](https://img.shields.io/github/v/release/zoomkoding/woowahan-orm?include_prereleases&sort=semver&label=version)

WoowahanORM is a very **light promise-based Node.js ORM for MySQL**. It features simple Model Queries(`INSERT`, `UPDATE`, `SELECT`, `DELETE`), Validations for Types and synchronization for Migration. WoowahanORM follows [Semantic Versioning](http://semver.org).

## Installation

```sh
$ npm i woowahan-ORM
# Also need to install mysql2
$ npm i mysql2
```

## API

```js
const woowahanORM = require('woowahan-orm')
```

## Connecting a Database

To connect to the database, you must passdown the connection parameters to the woowahanORM instance. 

You can set `sync` `true` for the tables to be created if they do not exist in the connected Database.

### woowahanORM(connectionParams, { sync : false })

```js
woowahanORM({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    },
    sync: false
)
```

## Defining a Table

After a connection is made, it is available to create Table Models extending `WoowahanORM.Model`

#### options
| Name       | Type    | Default    | Description | 
| -------- | ----------- | -------- | ----------- |
| `attributes` | `object` | `undefined` | A hash of attributes with `dataType(Required)`, `required(Optional)`, `defaultValue(Optional)`
| `defaultWhere` | `object` | `undefined` | A hash of attributes that should be always included in `where`.

**`defaultWhere` is automatically added to `where` when `Model.findAll` or `Model.findOne` is called.**

#### Example

```js
const { Model, DataTypes } = require('woowahan-orm')

class Product extends Model {
  static init() {
    return super.init(
      {
        name: { dataType: DataTypes.STRING, required: true },
        brandName: { dataType: DataTypes.STRING, required: true },
        featured: { dataType: DataTypes.BOOLEAN, defaultValue: '0' },
      },
      {
        defaultWhere: { featured: '1' },
      }
    )
  }
}

module.exports = User
```

> `id`, `createdAt`, `updatedAt`, `isDeleted` are auto-generated for every Model.

```js 
id: { dataType: DataTypes.INTEGER },
isDeleted: { dataType: DataTypes.BOOLEAN },
createdAt: { dataType: DataTypes.TIMESTAMP },
updatedAt: { dataType: DataTypes.TIMESTAMP },
```


## Supported Types 

Currently Woowahan ORM supports and validates those DataTypes.

```json
BOOLEAN: "tinyint(1)",
INTEGER: "int(11)",
DATE: "date",
DATETIME: "datetime",
TIMESTAMP: "timestamp",
STRING: "varchar(255)",
TEXT: "text",
```

## Validation

All of the input object is validated using the internal validation function. 

Validation is done for every Input(`create`, `update`, `findOne`, `fineAll`).

### Filtering not related input
Input not defined in the attributes will be not filtered.

#### Example

For `Product Class` example above, validation will be done like below.

```js
const product = await Product.create({
  brandName: 'Innisfree',
  name: 'Green tea toner',
  wrong: 'this is wrong' // will be ignored
}) // will be successfully created
```

### Type Check

If the input type for the according attribute is incorrect, then it throws `400 Error`


#### Example

```js
const product = await Product.create({
  brandName: 1, // wrong type which will cause 400 Error
  name: 'Green tea toner',
})
```



## Query 

### Model.create

Builds a new model instance and calls save on it.

```js
public static async create(values: object): Promise<Model>
```



#### Example
```js
const jane = await User.create({ name: "Jane" });
```

### Model.update

Update a model instance. **Must pass `id` in the values.(BulkUpdate not supported)**

```js
public static async update(values: object): Promise<void>
```


#### Example
```js
await User.update({ id: req.user.id, nickname: "Jane" });
```


### Model.findAll

Find all model instances match the options.

```js
public static async findAll(options: object): Promise<Array<Model>>
```

#### Params


| Name       | Type    | Default    | Description | 
| -------- | ----------- | -------- | ----------- |
| `options` | `object` | `undefined` | A hash of options to describe the scope of the search
| `options.attributes	` | `string` | `'*'` | A Comma Separated list of the attributes that you want to select
| `options.where` | `object` | `undefined` | A hash of attributes to describe your search (**v 1.0.0 only Exact Match is supported**)
| `options.rawWhere	` | `string` | `''` | A raw subQuery you can put in `where`
| `options.sortBy	` | `object` | `'undefined'` | Specifies an ordering. (object needs to has two keys `attribute`, `order`.

#### Example

```js
const product = await Product.findAll({
  attributes: 'id, name, price'
  where: {
    brandName: 'Innisfree'
  }
  sortBy: {
    attribute: createdAt,
    order: 'DESC'
  }
})

// if need more detailed select query, use rawWhere.
const rawWhere = `year(date)=${where.year} AND month(date)=${where.month}`
cosnt monthlyExpenditure = await Expenditure.findAll({ '*', where: { userId: req.user.id }, rawWhere })

```

### Model.findOne
Find the first model instance that matches the options.

```js
public static async findAll(options: object): Promise<Model>
```

#### Params
Same with `Model.findAll` params.


#### Example

```js
const user = await User.findOne({
  attributes: 'id, name, nickname'
  where: {
    githubId: 'zoomkoding'
  }
})
```

### Model.delete
Delete a model instance with `id`. 

Deleting doesn't delete the instance, it changes `isDeleted` attribute to `true `.

**Find Queries will automatically ignore instances with `isDeleted: true`**


```js
public static async delete(id: number): Promise<void>
```

#### Examples

```js
await History.delete(req.params.id)
```



