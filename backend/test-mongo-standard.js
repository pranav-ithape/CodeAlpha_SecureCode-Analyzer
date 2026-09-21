const { MongoClient } = require('mongodb');
const uri = "mongodb://securecode_admin:rteYthwnRFdyPPt6@ac-zet3dy4-shard-00-00.gwkejsy.mongodb.net:27017,ac-zet3dy4-shard-00-01.gwkejsy.mongodb.net:27017,ac-zet3dy4-shard-00-02.gwkejsy.mongodb.net:27017/securecode_analyzer?ssl=true&replicaSet=atlas-7b35y8-shard-0&authSource=admin&retryWrites=true&w=majority";
const client = new MongoClient(uri);

async function run() {
  try {
    await client.connect();
    console.log("Connected successfully to server with STANDARD URI");
    const db = client.db('test');
    console.log("Collections:", (await db.listCollections().toArray()).map(c => c.name));
  } catch (err) {
    console.error("Connection failed:", err.message);
  } finally {
    await client.close();
  }
}
run();
