//imports here for express and pg
const pg = require('pg');
const express = require('express');
const path = require('path');

const client = new pg.Client(process.env.DATABASE_URL || 'postgres://localhost/the_acme_flavors_db');
const app = express();

//static routes
app.use(express.json());
app.use(require('morgan')('dev'))

// app routes
app.get('/', (req, res)=> res.sendFile(path.join(__dirname, '../client/dist/index.html')))

//read flavors
app.get('/api/flavors', async (req, res, next) => {
  try {
    const SQL = `SELECT * FROM flavors ORDER BY created_at DESC;`;
    const response = await client.query(SQL);
    res.send(response.rows);
  } catch (err) {
    next(err);
  }
})

// create flavors
app.post('/api/flavors', async (req, res, next) => {
    try {
      const SQL = `
        INSERT INTO notes(name, is_favorite)
        VALUES($1, $2)
        RETURNING *;
      `;
      const response = await client.query(SQL, [req.body.txt, req.body.ranking]);
      res.send(response.rows[0]);
    } catch (err) {
      next(err);
    }
})

// Update flavors
app.put('/api/flavors/:id', async (req, res, next) => {
    try {
      const SQL = `
        UPDATE flavors
        SET name=$1, is_favorite=$2, updated_at= now()
        WHERE id=$3 RETURNING *
      `
      const response = await client.query(SQL, [req.body.name, req.body.is_favorite, req.params.id])
      res.send(response.rows[0])
    } catch (ex) {
      next(ex)
    }
  })

//Delete Flavors
app.delete('/api/flavors/:id', async (req, res, next) => {
    try {
      const SQL = `
        DELETE FROM notes
        WHERE id=$1
      `;
      await client.query(SQL, [req.params.id]);
      res.sendStatus(204);
    } catch (err) {
      next(err);
    }
})
// create init function
const init = async () => {
    await client.connect();
    console.log('connected to database');
    const SQL = `
    DROP TABLE IF EXISTS flavors;
    CREATE TABLE flavors(
        id SERIAL PRIMARY KEY,
        name VARCHAR(255),
        is_favorite BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT now(),
        updated_at TIMESTAMP DEFAULT now()

    );
    INSERT INTO flavors(name, is_favorite) VALUES('vanilla', true);
    INSERT INTO flavors(name) VALUES('chocolate');
    INSERT INTO flavors(name, is_favorite) VALUES('strawberry', true);
    INSERT INTO flavors(name) VALUES('sherbert');
    `;
    await client.query(SQL);
    console.log('tables created')
    /* SQL = ` `;
    await client.query(SQL); */
    console.log('data seeded');
};

//init function invocation
init();