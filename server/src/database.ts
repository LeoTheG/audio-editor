import { Db, MongoError, MongoClient } from "mongodb";

const url =
  process.env.NODE_ENV === "development"
    ? "mongodb://mongo:27017/"
    : "mongodb://localhost:27017";

const dbName = "pizza";

export default class Database {
  private static db: Db;
  static async init() {
    console.log("info", "Connecting to database through url " + url);
    const _db = await new Promise<Db>((res) => {
      MongoClient.connect(url, { useUnifiedTopology: true }, (err, db) => {
        if (err) throw err;
        console.log("info", "Database connected");
        res(db.db(dbName));
      });
    });
    Database.db = _db;
  }

  static addUpload(
    id: string,
    url: string,
    songName: string,
    authorName: string
  ) {
    return Database.db.collection("userUploads").insertOne({
      _id: id,
      url,
      songName,
      authorName,
    });
  }

  static async getUploads(): Promise<{}[]> {
    return new Promise((resolve) => {
      Database.db
        .collection("userUploads")
        .find()
        .toArray()
        .then((result) => resolve(result));
    });
  }
}

Database.init();
