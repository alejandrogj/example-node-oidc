const { MongoClient } = require('mongodb'); // eslint-disable-line import/no-unresolved
const { snakeCase } = require('lodash');
const { mongoConfig } = require('../settings');

let DB;

class CollectionSet extends Set {
  add(name) {
    const nu = this.has(name);
    super.add(name);
    if (!nu) {
      DB.collection(name).createIndexes([
        { key: { grantId: 1 } },
        { key: { expiresAt: 1 }, expireAfterSeconds: 0 },
      ]).catch(console.error); // eslint-disable-line no-console
    }
  }
}

const collections = new CollectionSet();

class MongoAdapter {
  constructor(name) {
    this.name = snakeCase(name);
    collections.add(this.name);
  }

  coll(name) {
    return this.constructor.coll(name || this.name);
  }

  static coll(name) {
    return DB.collection(name);
  }

  destroy(id) {
    return this.coll().findOneAndDelete({ _id: id })
      .then((found) => {
        if (found.value && found.value.grantId) {
          const promises = [];

          collections.forEach((name) => {
            promises.push(this.coll(name).deleteMany({ grantId: found.value.grantId }));
          });

          return Promise.all(promises);
        }
        return undefined;
      });
  }

  consume(id) {
    return this.coll().findOneAndUpdate({ _id: id }, { $currentDate: { consumed: true } });
  }

  find(id) {
    return this.coll().find({ _id: id }).limit(1).next();
  }

  upsert(_id, payload, expiresIn) {
    let expiresAt;

    if (expiresIn) {
      expiresAt = new Date(Date.now() + (expiresIn * 1000));
    }

    // HEROKU EXAMPLE ONLY, do not use the following block unless you want to drop dynamic
    //   registrations 24 hours after registration
    if (this.name === 'client') {
      expiresAt = new Date(Date.now() + (24 * 60 * 60 * 1000));
    }

    const document = Object.assign(payload, expiresAt && { expiresAt });

    // the above does not work for _id sharded collections, use the one below
    // const document = Object.assign(payload, { _id }, expiresAt && { expiresAt });

    return this.coll().updateOne({ _id }, { $set: document }, { upsert: true });
  }

  static async connect() {
    const connection = await MongoClient.connect(
      `mongodb://${mongoConfig.host}:${mongoConfig.port}/${mongoConfig.db}`,
      { auth: { user: mongoConfig.user, password: mongoConfig.password } },
    );

    DB = connection.db(connection.s.options.dbName);
  }
}

module.exports = MongoAdapter;
