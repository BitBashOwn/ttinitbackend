const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const cors = require('cors'); 
const bcrypt = require('bcrypt');

const app = express();
const uri = "mongodb+srv://bitbash9:wtipzaJo2ZbqhwpS@blogdb.0jloxnk.mongodb.net/?retryWrites=true&w=majority&appName=blogdb"
const client = new MongoClient(uri);
app.use(express.json());
app.use(cors()); // Retained the CORS middleware

async function connectToDatabase() {
  try {
    await client.connect();
    console.log("Connected to MongoDB Atlas");
  } catch (error) {
    console.log("Error connecting to MongoDB Atlas", error);
    throw error;
  }
}

(async () => {
  try {
    await connectToDatabase();
    const db = client.db('blogdatabase');
    const blogsCollection = db.collection('blogs');
    const loginCollection = db.collection('login'); // Add login collection
    
    
    // Define your routes and other middleware here


    app.get('/', async (req, res) => {
      try {
        // Check if the collection exists
        const collectionExists = await blogsCollection.findOne();
        if (collectionExists) {
          res.send('Database connection and collection are successfully connected!');
        } else {
          res.send('Database connection is successful, but the collection does not exist or is empty.');
        }
      } catch (error) {
        console.error("Error testing database connection:", error);
        res.status(500).send("Error testing database connection: " + error.message);
      }
    });
  
    app.post('/save-blog', async (req, res) => {
      try {
          console.log("Request body:", req.body); // Log the request body
          let blogData = req.body;
  
          // Remove _id property if present
          delete blogData._id;
  
          const result = await blogsCollection.insertOne(blogData);
          res.send('Blog saved successfully with ID: ' + result);
      } catch (error) {
        console.log("Request body:", req.body); // Log the request body
          console.error("Error saving blog:", error);
          res.status(500).send("Error saving blog: " + error.message);
      }
  });
  
  
  
  
    app.delete('/delete-blog/:id', async (req, res) => {
      try {
        const blogId = req.params.id;
        console.log("Received blog ID:", blogId);
        const objectId = new ObjectId(blogId);
        const result = await blogsCollection.deleteOne({ _id: objectId });
        if (result.deletedCount === 1) {
          res.send('Blog deleted successfully.');
        } else {
          res.status(404).send('Blog not found');
        }
      } catch (error) {
        console.error("Error deleting blog:", error);
        res.status(500).send("Error deleting blog: " + error.message);
      }
    });
  
    app.get('/get-blog/:id', async (req, res) => {
      try {
        const blogId = req.params.id;
        const blog = await blogsCollection.findOne({ _id:new ObjectId(blogId) });
        if (blog) {
          res.json(blog);
        } else {
          res.status(404).send('Blog not found');
        }
      } catch (error) {
        console.error("Error fetching blog:", error);
        res.status(500).send("Error fetching blog: " + error.message);
      }
    });
  
    app.put('/update-blog/:id', async (req, res) => {
      try {
          const blogId = req.params.id;
          const updates = req.body;
  
          // Remove _id property if present in updates
          delete updates._id;
  
          const result = await blogsCollection.updateOne({ _id: new ObjectId(blogId) }, { $set: updates });
          if (result.modifiedCount === 1) {
              res.send('Blog updated successfully.');
          } else {
              res.status(404).send('Blog not found');
          }
      } catch (error) {
          console.error("Error updating blog:", error);
          res.status(500).send("Error updating blog: " + error.message);
      }
  });
  
  
  
  
    app.get('/get-all-blogs', async (req, res) => {
      try {
        const blogs = await blogsCollection.find().toArray();
        console.log("Fetched blogs:", blogs); // Log the fetched blogs
        res.json(blogs);
      } catch (error) {
        console.error("Error fetching blogs:", error);
        res.status(500).send("Error fetching blog: " + error.message);
      }
    });

    app.get('/users', async (req, res) => {
      try {
        const usersCollection = client.db("blogdatabase").collection("login");
        const users = await usersCollection.find().toArray();
        res.status(200).json(users);
      } catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    });
    
     // Login route
     app.post('/login', async (req, res) => {
      try {
        const { username, password } = req.body;
        const user = await loginCollection.findOne({ username });
        if (user) {
          // Compare hashed password
          const match = await bcrypt.compare(password, user.password);
          if (match) {
            res.json({ success: true, message: 'Authentication successful' });
          } else {
            res.status(401).json({ success: false, message: 'Authentication failed' });
          }
        } else {
          res.status(401).json({ success: false, message: 'Authentication failed' });
        }
      } catch (error) {
        console.error("Error authenticating user:", error);
        res.status(500).json({ success: false, message: 'Internal server error' });
      }
    });
    
    // Route to add a user to the database
    app.post('/add-user', async (req, res) => {
      try {
        const { username, password } = req.body;
        const existingUser = await loginCollection.findOne({ username });
        if (existingUser) {
          res.status(400).json({ message: 'User already exists' });
        } else {
          // Hash the password
          const hashedPassword = await bcrypt.hash(password, 10);
          await loginCollection.insertOne({ username, password: hashedPassword });
          res.status(201).json({ message: 'User added successfully' });
        }
      } catch (error) {
        console.error("Error adding user:", error);
        res.status(500).json({ message: 'Internal server error' });
      }
    });


  const port = process.env.PORT || 8080;
  app.listen(port, () => console.log(`Server running on port ${port}`));
} catch (error) {
  console.error("Error starting server:", error);
  process.exit(1);
}
})();














