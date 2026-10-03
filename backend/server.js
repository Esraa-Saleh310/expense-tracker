require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const pool = new Pool({ 
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

const ALLOWED_CATEGORIES = ["Food", "Transport", "Bills", "Entertainment", "Other"];


function formatExpense(row) {
  const d = new Date(row.date);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();

  return {
    id: row.id,
    title: row.title,
    amount: Number(row.amount),
    category: row.category,
    date: `${day}-${month}-${year}`
  };
}


function validateExpenseBody(body) {
  const errors = [];
  const { title, amount, category, date } = body;

  if (!title || typeof title !== "string" || !title.trim()) {
    errors.push("title is required and must be a non-empty string");
  }

  if (amount === undefined || isNaN(Number(amount)) || Number(amount) <= 0) {
    errors.push("amount is required and must be a number greater than 0");
  }

  if (!ALLOWED_CATEGORIES.includes(category)) {
    errors.push(`category must be one of: ${ALLOWED_CATEGORIES.join(", ")}`);
  }

  if (!date || isNaN(Date.parse(date))) {
    errors.push("date is required and must be a valid date (YYYY-MM-DD)");
  }

  return errors;
}


app.get("/api/expenses", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM expenses ORDER BY id");
    res.status(200).json(result.rows.map(formatExpense));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Something went wrong" });
  }
});


app.get("/api/expenses/:id", async (req, res) => {
  const { id } = req.params;

  if (!Number.isInteger(Number(id))) {
    return res.status(404).json({ message: "Expense not found" });
  }

  try {
    const result = await pool.query("SELECT * FROM expenses WHERE id = $1", [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Expense not found" });
    }

    res.status(200).json(formatExpense(result.rows[0]));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Something went wrong" });
  }
});


app.post("/api/expenses", async (req, res) => {
  const errors = validateExpenseBody(req.body);

  if (errors.length > 0) {
    return res.status(400).json({ message: errors.join(", ") });
  }

  const { title, amount, category, date } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO expenses (title, amount, category, date)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [title.trim(), amount, category, date]
    );

    res.status(201).json(formatExpense(result.rows[0]));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Something went wrong" });
  }
});


app.put("/api/expenses/:id", async (req, res) => {
  const { id } = req.params;

  if (!Number.isInteger(Number(id))) {
    return res.status(404).json({ message: "Expense not found" });
  }

  const errors = validateExpenseBody(req.body);
  if (errors.length > 0) {
    return res.status(400).json({ message: errors.join(", ") });
  }

  const { title, amount, category, date } = req.body;

  try {
    const result = await pool.query(
      `UPDATE expenses
       SET title = $1, amount = $2, category = $3, date = $4
       WHERE id = $5
       RETURNING *`,
      [title.trim(), amount, category, date, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Expense not found" });
    }

    res.status(200).json(formatExpense(result.rows[0]));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Something went wrong" });
  }
});


app.delete("/api/expenses/:id", async (req, res) => {
  const { id } = req.params;

  if (!Number.isInteger(Number(id))) {
    return res.status(404).json({ message: "Expense not found" });
  }

  try {
    const result = await pool.query(
      "DELETE FROM expenses WHERE id = $1 RETURNING *",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Expense not found" });
    }

    res.status(200).json({
      message: "Expense deleted",
      expense: formatExpense(result.rows[0])
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Something went wrong" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
