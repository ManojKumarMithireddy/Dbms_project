const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const port = 5500;

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'inventory',
  password: 'Manu5757',
  port: 5432,
});

app.use(cors());
app.use(express.json());

var userID = 0;

const setUserID = (id) => {
  userID = id;
};

const getUserID = () => {
  return userID;
};

// Add a new endpoint to fetch the total price
app.get('/totalPriceInCart', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT SUM(price) as total_price FROM product WHERE productid IN (SELECT product_id FROM cart where user_id=$1)',
      [getUserID()]
    );

    // Extract the total price from the result
    const totalPrice = result.rows[0].total_price;

    res.json({ success: true, total_price: totalPrice });
  } catch (error) {
    console.error('Error executing database query:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Endpoint to set the user ID based on email and password
app.post('/setUserID', async (req, res) => {
  const { email, password } = req.body;
  try {
    // Query to fetch the user ID based on provided email and password
    const result = await pool.query(
      'SELECT distinct userid FROM user1 WHERE email = $1 AND password = $2',
      [email, password]
    );
    
    // Set the user ID using the setUserID function
    setUserID(result.rows[0].userid);
    
    // Respond with the fetched user ID
    res.json(result.rows);
  } catch (error) {
    console.error('Error executing database query:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

app.get('/fetchSuppliers', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM supplier');
    res.json(result.rows);
  } catch (error) {
    console.error('Error executing database query:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

app.post('/users', async (req, res) => {
  const { email, password } = req.body;

  try {
    const client = await pool.connect();
    const result = await client.query(
      'SELECT role FROM user1 WHERE email = $1 AND password = $2',
      [email, password]
    );

    client.release();

    if (result.rows.length > 0) {
      res.json({
        success: true,
        message: 'Login successful',
        role: result.rows[0].role,
      });
    } else {
      res.json({ success: false, message: 'Invalid credentials' });
    }
  } catch (error) {
    console.error('Error executing database query:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

//for home
// ... (previous server code)

app.post('/search', async (req, res) => {
  const { searchValue } = req.body;
  try {
    const result = await pool.query(
      'SELECT * FROM product WHERE (name ILIKE $1 )',
      [`%${searchValue}%`]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error executing database query:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

app.get('/allProducts', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM product');
    res.json(result.rows);
  } catch (error) {
    console.error('Error executing database query:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
});

app.get('/userDetails', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT username,email FROM user1 WHERE userid=$1',
      [getUserID()]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error executing database query:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
});

app.post('/filterByCategory', async (req, res) => {
  const { selectedCategory } = req.body;
  const { searchValue } = req.body;
  try {
    const result = await pool.query(
      'SELECT * FROM product WHERE categoryid=(SELECT categoryid FROM category WHERE categoryname ilike $1) and name ilike $2',
      [selectedCategory, `${searchValue}%`]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error executing database query:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
});

app.post('/signup', async (req, res) => {
  const { username, password, password1, email, role } = req.body;
  if (password != password1) {
    res.json({ success: false, message: 'Passwords do not match' });
  }
  try {
    const result = await pool.query(
      'INSERT INTO user1 ( username, password, email , role) VALUES ($1, $2, $3, $4) returning *',
      [username, password, email, role]
    );
    res.json({ success: true, message: 'Signup successful' });
  } catch (error) {
    console.error('Error executing database query:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
});

app.post('/addToCart', async (req, res) => {
  const { productIds } = req.body;

  try {
    // Assuming there is a user ID (replace 1 with the actual user ID)
    const userId1 = getUserID();

    // Iterate over the received product IDs and insert them into the cart table
    for (const productId of productIds) {
      const result = await pool.query(
        'INSERT INTO cart (user_id, product_id) VALUES ($1, $2) returning *',
        [userId1, productId]
      );
      // Handle the result as needed
    }

    res.json({ success: true, message: 'Added selected items to the cart' });
  } catch (error) {
    console.error('Error executing database query:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
});

app.get('/productsInCart', async (req, res) => {
  try {
    const UIDs = await pool.query(
      'SELECT product_id FROM cart where user_id=$1',
      [getUserID()]
    );
    if (UIDs.rows.length > 0) {
      const productIDs = UIDs.rows.map((row) => row.product_id);
      const result = await pool.query(
        'SELECT * FROM product WHERE productid = ANY($1)',
        [productIDs]
      );
      res.json(result.rows);
    } else {
      res.json({ success: false, message: 'No items in cart' });
    }
  } catch (error) {
    console.error('Error executing database query:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

app.post('/checkout', async (req, res) => {
  const {
    cname,
    email,
    address,
    city,
    state,
    zip,
    cname1,
    ccnum,
    expmonth,
    expyear,
    cvv,
    amount,
  } = req.body;
  const userid1 = getUserID();
  try {
    const result = await pool.query(
      'INSERT INTO transaction (cname1, ccnum, expmonth, expyear, cvv, date, userid, amount) VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, $6, $7) RETURNING transactionID',
      [
        cname1,
        ccnum,
        expmonth,
        expyear,
        cvv,
        userid1, // Assuming getUserID() returns the user ID
        amount,
      ]
    );
    const tid = result.rows[0].transactionid;
    const result1 = await pool.query(
      'INSERT INTO customer(cname, email, address, city, state, zip, tid) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [cname, email, address, city, state, zip, tid]
    );
    const result2 = await pool.query('delete from cart where user_id=$1', [
      userid1,
    ]);
    res.json({
      success: true,
      message: 'Transaction successful',
    });
  } catch (error) {
    console.error('Error executing database query:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
});

app.get('/transactHistory', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT t.cname1,t.date,t.amount,c.address, c.city, c.state, c.zip FROM customer c,transaction t WHERE t.userid=$1 AND t.transactionid=c.tid',
      [getUserID()]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error executing database query:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
});

app.get('/supplierDetails', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM supplier');
    res.json(result.rows);
  } catch (error) {
    console.error('Error executing database query:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      _error: error.message,
      get error() {
        return this._error;
      },
      set error(value) {
        this._error = value;
      },
    });
  }
});

app.post('/addToOrder', async (req, res) => {
  const { selectedSupplier, totalPrice } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO order1 (date, supplierid, totalamount, userid) VALUES (CURRENT_TIMESTAMP, $1, $2, $3) returning *',
      [selectedSupplier, totalPrice, getUserID()]
    );
    res.json({ success: true, message: 'Order placed successfully' });
  } catch (error) {
    console.error('Error executing database query:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
});

app.get('/ordersHistory', async (req, res) => {
  // Corrected the typo here
  try {
    const result = await pool.query(
      'select s.name, o.date, o.totalamount from supplier s, order1 o where o.supplierid=s.supplierid and o.userid=$1',
      [getUserID()]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error executing database query:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
