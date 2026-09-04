import mongoose from 'mongoose';
import '../app.js'; // side effect: registers every Mongoose schema via route/controller imports

// Deliberately separate from the dev/demo database so running tests never
// touches (or wipes) the data you see in the app while developing.
const TEST_MONGO_URI = 'mongodb://127.0.0.1:27017/rentall_test';

beforeAll(async () => {
  await mongoose.connect(TEST_MONGO_URI);
});

beforeEach(async () => {
  const collections = await mongoose.connection.db.collections();
  await Promise.all(collections.map((c) => c.deleteMany({})));
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});
