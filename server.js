const express = require('express');
const app = express();
const port = 3000;
const mariadb = require('mariadb');
const bodyParser = require('body-parser');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const cors = require('cors')

app.use(cors({
        origin: 'http://64.176.214.135:3000'  

const pool = mariadb.createPool({
  host: 'localhost',
  user: 'root',
  password: 'root',
  database: 'sample',
  port: 3306,
  connectionLimit: 5,
});

app.use(bodyParser.json());

const options = {
    swaggerDefinition: {
        info: {
            title: 'Agents API',
            version: '1.0.0',
            description: 'API for Agents',
        },
        host: `64.176.214.135:${port}`,
        basePath: '/',
    },
    apis: ['./server.js'],  // Assuming this code is in server.js
};

const specs = swaggerJsdoc(options);

app.use('/docs', swaggerUi.serve, swaggerUi.setup(specs));

app.get('/agents', async (req, res) => {
  try {
    // Connect to the database using the pool
    const conn = await pool.getConnection();

    // Perform the agents query
    const query = 'SELECT * FROM agents'; // Replace with your SQL query
    const result = await conn.query(query);

    // Release the connection back to the pool
    conn.release();

    // Convert BigInt values to regular numbers
    const agents = result.map((agent) => ({
      ...agent,
      COMMISSION: Number(agent.COMMISSION), // Convert BigInt to number
    }));

    // Define the response header
    res.setHeader('Content-Type', 'application/json');

    // Send the output as JSON
    res.json(agents);
  } catch (err) {
    // Handle errors
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/total-agents', async (req, res) => {
  try {
    // Connect to the database using the pool
    const conn = await pool.getConnection();

    // Perform the total agents query
    const query = 'SELECT COUNT(*) as total_agents FROM agents'; // Query to count total agents
    const result = await conn.query(query);

    // Release the connection back to the pool
    conn.release();

    // Define the response header
    res.setHeader('Content-Type', 'application/json');

    // Send the output as JSON
    res.json({ total_agents: Number(result[0].total_agents) }); // Convert BigInt to number
  } catch (err) {
    // Handle errors
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/avg-commission', async (req, res) => {
  try {
    // Connect to the database using the pool
    const conn = await pool.getConnection();

    // Perform the average commission query
    const query = 'SELECT AVG(COMMISSION) as avg_commission FROM agents'; // Query to calculate average commission
    const result = await conn.query(query);

    // Release the connection back to the pool
    conn.release();

    // Define the response header
    res.setHeader('Content-Type', 'application/json');

    // Send the output as JSON
    res.json({ avg_commission: Number(result[0].avg_commission) }); // Convert BigInt to number
  } catch (err) {
    // Handle errors
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

/**
 * @swagger
 * /agents:
 *   post:
 *     description: Add a new agent
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: agent
 *         description: Agent object
 *         in: body
 *         required: true
 *         type: object
 *         properties:
 *           AGENT_CODE:
 *             type: string
 *           AGENT_NAME:
 *             type: string
 *           WORKING_AREA:
 *             type: string
 *           COMMISSION:
 *             type: number
 *           PHONE_NO:
 *             type: string
 *           COUNTRY:
 *             type: string
 *     responses:
 *       200:
 *         description: Successfully added agent
 *       500:
 *         description: Internal Server Error
 */
app.post('/agents', async (req, res) => {
  try {
      const { AGENT_CODE, AGENT_NAME, WORKING_AREA, COMMISSION, PHONE_NO, COUNTRY } = req.body;

      if (!AGENT_CODE || !AGENT_NAME || !WORKING_AREA || !COMMISSION || !PHONE_NO || !COUNTRY) {
          return res.status(400).json({ error: 'All fields are required' });
      }

      const query = 'INSERT INTO agents (AGENT_CODE, AGENT_NAME, WORKING_AREA, COMMISSION, PHONE_NO, COUNTRY) VALUES (?, ?, ?, ?, ?, ?)';
      await pool.query(query, [AGENT_CODE, AGENT_NAME, WORKING_AREA, COMMISSION, PHONE_NO, COUNTRY]);

      res.json({ message: 'Agent added successfully!' });
  } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Internal Server Error' });
  }
});

/**
 * @swagger
 * /agents/{AGENT_CODE}/commission:
 *   patch:
 *     description: Update commission for an agent by ID
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: AGENT_CODE
 *         description: Agent's ID
 *         in: path
 *         required: true
 *         type: string
 *       - name: commission
 *         description: New commission value
 *         in: body
 *         required: true
 *         type: number
 *     responses:
 *       200:
 *         description: Successfully updated commission
 *       500:
 *         description: Internal Server Error
 */
app.patch('/agents/:AGENT_CODE/commission', async (req, res) => {
  try {
    const { AGENT_CODE } = req.params;
    const { commission } = req.body;

    // Validation & Sanitization
    if (commission === undefined || isNaN(Number(commission))) {
      return res.status(400).json({ error: 'Invalid data' });
    }

    const sanitizedData = {
      commission: Number(commission)
    };

    const query = 'UPDATE agents SET COMMISSION = ? WHERE AGENT_CODE = ?';
    const result = await pool.query(query, [sanitizedData.commission, AGENT_CODE]);

    // Check if any rows were updated
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    res.json({ message: 'Commission updated successfully!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

 /**
 * @swagger
 * /agents/{AGENT_CODE}:
 *   put:
 *     description: Replace an agent's data by ID
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: AGENT_CODE
 *         description: Agent's ID
 *         in: path
 *         required: true
 *         type: string
 *       - name: AGENT_NAME
 *         description: New agent data
 *         in: body
 *         required: true
 *         type: object
 *         properties:
 *           AGENT_NAME:
 *             type: string
 *           commission:
 *             type: number
 *     responses:
 *       200:
 *         description: Successfully replaced agent data
 *       500:
 *         description: Internal Server Error
 */
 app.put('/agents/:AGENT_CODE', async (req, res) => {
  try {
    const { AGENT_CODE } = req.params;
    const { AGENT_NAME, commission } = req.body;

    // Validation & Sanitization
    if (!AGENT_NAME || !commission || isNaN(Number(commission))) {
      return res.status(400).json({ error: 'Invalid data' });
    }

    const sanitizedData = {
      AGENT_NAME: pool.escape(AGENT_NAME), // Use AGENT_NAME instead of name
      commission: Number(commission)
    };

    const query = 'UPDATE agents SET AGENT_NAME = ?, COMMISSION = ? WHERE AGENT_CODE = ?';
    await pool.query(query, [sanitizedData.AGENT_NAME, sanitizedData.commission, AGENT_CODE]);

    res.json({ message: 'Agent data replaced successfully!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

/**
 * @swagger
 * /agents/{AGENT_CODE}:
 *   delete:
 *     description: Delete an agent by ID
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: AGENT_CODE
 *         description: Agent's ID
 *         in: path
 *         required: true
 *         type: string
 *     responses:
 *       200:
 *         description: Successfully deleted agent
 *       404:
 *         description: Agent not found
 *       500:
 *         description: Internal Server Error
 */
app.delete('/agents/:AGENT_CODE', async (req, res) => {
  try {
    const { AGENT_CODE } = req.params;

    // Check if the agent exists before attempting to delete
    const checkQuery = 'SELECT AGENT_CODE FROM agents WHERE AGENT_CODE = ?';
    const checkResult = await pool.query(checkQuery, [AGENT_CODE]);

    if (checkResult.length === 0) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    // Agent exists, proceed with deletion
    const deleteQuery = 'DELETE FROM agents WHERE AGENT_CODE = ?';
    await pool.query(deleteQuery, [AGENT_CODE]);

    res.json({ message: 'Agent deleted successfully!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
