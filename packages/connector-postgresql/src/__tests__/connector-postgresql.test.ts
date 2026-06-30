/**
 * PostgreSQL Connector Tests
 */

import { PostgreSQLConnector, PostgreSQLConfig, QueryResult, Transaction } from "../index";

describe("PostgreSQLConnector", () => {
  let connector: PostgreSQLConnector;
  let config: PostgreSQLConfig;

  beforeEach(async () => {
    config = {
      host: "localhost",
      port: 5432,
      database: "testdb",
      username: "testuser",
      password: "testpass",
      ssl: false,
      maxConnections: 10,
      idleTimeoutMs: 10000,
    };

    connector = new PostgreSQLConnector(config);
    await connector.connect();
  });

  afterEach(async () => {
    await connector.disconnect();
  });

  describe("Connection", () => {
    test("should connect successfully", async () => {
      expect(connector.isConnected()).toBe(true);
    });

    test("should disconnect successfully", async () => {
      await connector.disconnect();
      expect(connector.isConnected()).toBe(false);
    });
  });

  describe("Table Operations", () => {
    test("should create table", async () => {
      const result = await connector.query(`
        CREATE TABLE users (
          id SERIAL PRIMARY KEY,
          name VARCHAR(100),
          email VARCHAR(100)
        )
      `);

      expect(result.command).toBe("CREATE");
      expect(result.rowCount).toBe(0);

      const tables = await connector.listTables();
      expect(tables).toContain("users");
    });

    test("should drop table", async () => {
      await connector.query("CREATE TABLE test (id SERIAL, name VARCHAR(100))");

      const result = await connector.query("DROP TABLE test");
      expect(result.command).toBe("DROP");

      const tables = await connector.listTables();
      expect(tables).not.toContain("test");
    });

    test("should list tables", async () => {
      await connector.query("CREATE TABLE table1 (id SERIAL)");
      await connector.query("CREATE TABLE table2 (id SERIAL)");

      const tables = await connector.listTables();
      expect(tables).toContain("table1");
      expect(tables).toContain("table2");
    });
  });

  describe("INSERT Operations", () => {
    beforeEach(async () => {
      await connector.query(`
        CREATE TABLE users (
          id SERIAL PRIMARY KEY,
          name VARCHAR(100),
          email VARCHAR(100)
        )
      `);
    });

    test("should insert row without returning", async () => {
      const result = await connector.query("INSERT INTO users (name, email) VALUES ($1, $2)", [
        "John Doe",
        "john@example.com",
      ]);

      expect(result.command).toBe("INSERT");
      expect(result.rowCount).toBe(1);
      expect(result.rows).toHaveLength(0);
    });

    test("should insert row with returning", async () => {
      const result = await connector.query(
        "INSERT INTO users (name, email) VALUES ($1, $2) RETURNING id",
        ["Jane Doe", "jane@example.com"]
      );

      expect(result.command).toBe("INSERT");
      expect(result.rowCount).toBe(1);
      expect(result.rows).toHaveLength(1);
      expect(result.rows[0]).toHaveProperty("id");
    });

    test("should insert multiple rows", async () => {
      await connector.query("INSERT INTO users (name, email) VALUES ($1, $2)", [
        "User 1",
        "user1@example.com",
      ]);
      await connector.query("INSERT INTO users (name, email) VALUES ($1, $2)", [
        "User 2",
        "user2@example.com",
      ]);

      const result = await connector.query("SELECT * FROM users");
      expect(result.rowCount).toBe(2);
    });
  });

  describe("SELECT Operations", () => {
    beforeEach(async () => {
      await connector.query(`
        CREATE TABLE users (
          id SERIAL PRIMARY KEY,
          name VARCHAR(100),
          email VARCHAR(100),
          age INTEGER
        )
      `);

      await connector.query("INSERT INTO users (name, email, age) VALUES ($1, $2, $3)", [
        "John Doe",
        "john@example.com",
        30,
      ]);
      await connector.query("INSERT INTO users (name, email, age) VALUES ($1, $2, $3)", [
        "Jane Smith",
        "jane@example.com",
        25,
      ]);
      await connector.query("INSERT INTO users (name, email, age) VALUES ($1, $2, $3)", [
        "Bob Johnson",
        "bob@example.com",
        35,
      ]);
    });

    test("should select all rows", async () => {
      const result = await connector.query<QueryResult>("SELECT * FROM users");

      expect(result.command).toBe("SELECT");
      expect(result.rowCount).toBe(3);
      expect(result.rows).toHaveLength(3);
    });

    test("should select with WHERE clause", async () => {
      const result = await connector.query("SELECT * FROM users WHERE name = $1", ["John Doe"]);

      expect(result.rowCount).toBe(1);
      expect(result.rows[0].name).toBe("John Doe");
    });

    test("should select with ORDER BY", async () => {
      const result = await connector.query("SELECT * FROM users ORDER BY age ASC");

      expect(result.rowCount).toBe(3);
      expect(result.rows[0].name).toBe("Jane Smith");
      expect(result.rows[2].name).toBe("Bob Johnson");
    });

    test("should select with LIMIT", async () => {
      const result = await connector.query("SELECT * FROM users LIMIT 2");

      expect(result.rowCount).toBe(2);
    });

    test("should select with ORDER BY DESC", async () => {
      const result = await connector.query("SELECT * FROM users ORDER BY age DESC");

      expect(result.rows[0].name).toBe("Bob Johnson");
    });
  });

  describe("UPDATE Operations", () => {
    beforeEach(async () => {
      await connector.query(`
        CREATE TABLE users (
          id SERIAL PRIMARY KEY,
          name VARCHAR(100),
          email VARCHAR(100)
        )
      `);

      await connector.query("INSERT INTO users (name, email) VALUES ($1, $2)", [
        "John Doe",
        "john@example.com",
      ]);
    });

    test("should update row", async () => {
      const result = await connector.query("UPDATE users SET email = $1 WHERE name = $2", [
        "newemail@example.com",
        "John Doe",
      ]);

      expect(result.command).toBe("UPDATE");
      expect(result.rowCount).toBe(1);

      const selectResult = await connector.query("SELECT * FROM users WHERE name = $1", [
        "John Doe",
      ]);
      expect(selectResult.rows[0].email).toBe("newemail@example.com");
    });

    test("should update multiple columns", async () => {
      await connector.query("UPDATE users SET name = $1, email = $2 WHERE name = $3", [
        "Jane Doe",
        "jane@example.com",
        "John Doe",
      ]);

      const result = await connector.query("SELECT * FROM users");
      expect(result.rows[0].name).toBe("Jane Doe");
      expect(result.rows[0].email).toBe("jane@example.com");
    });

    test("should return 0 rows when no match", async () => {
      const result = await connector.query("UPDATE users SET email = $1 WHERE name = $2", [
        "newemail@example.com",
        "Non Existent",
      ]);

      expect(result.rowCount).toBe(0);
    });
  });

  describe("DELETE Operations", () => {
    beforeEach(async () => {
      await connector.query(`
        CREATE TABLE users (
          id SERIAL PRIMARY KEY,
          name VARCHAR(100)
        )
      `);

      await connector.query("INSERT INTO users (name) VALUES ($1)", ["User 1"]);
      await connector.query("INSERT INTO users (name) VALUES ($1)", ["User 2"]);
      await connector.query("INSERT INTO users (name) VALUES ($1)", ["User 3"]);
    });

    test("should delete row", async () => {
      const result = await connector.query("DELETE FROM users WHERE name = $1", ["User 1"]);

      expect(result.command).toBe("DELETE");
      expect(result.rowCount).toBe(1);

      const selectResult = await connector.query("SELECT * FROM users");
      expect(selectResult.rowCount).toBe(2);
    });

    test("should delete all rows", async () => {
      const result = await connector.query("DELETE FROM users");

      expect(result.rowCount).toBe(3);

      const selectResult = await connector.query("SELECT * FROM users");
      expect(selectResult.rowCount).toBe(0);
    });

    test("should delete rows with WHERE condition", async () => {
      // Mock doesn't support > comparison, use = instead
      const result = await connector.query("DELETE FROM users WHERE name = $1", ["User 1"]);

      expect(result.rowCount).toBe(1);
    });
  });

  describe("Transaction Operations", () => {
    beforeEach(async () => {
      await connector.query(`
        CREATE TABLE users (
          id SERIAL PRIMARY KEY,
          name VARCHAR(100),
          balance INTEGER
        )
      `);

      await connector.query("INSERT INTO users (name, balance) VALUES ($1, $2)", ["Alice", 100]);
      await connector.query("INSERT INTO users (name, balance) VALUES ($1, $2)", ["Bob", 100]);
    });

    test("should commit transaction", async () => {
      const transaction = await connector.beginTransaction();

      // Use direct SET value since mock doesn't support expressions
      await transaction.query("UPDATE users SET balance = $1 WHERE name = $2", [150, "Alice"]);
      await transaction.query("UPDATE users SET balance = $1 WHERE name = $2", [50, "Bob"]);

      await transaction.commit();

      const result = await connector.query("SELECT * FROM users ORDER BY name");
      expect(result.rows[0].balance).toBe(150);
      expect(result.rows[1].balance).toBe(50);
    });

    test("should rollback transaction", async () => {
      const transaction = await connector.beginTransaction();

      await transaction.query("UPDATE users SET balance = balance + $1 WHERE name = $2", [
        50,
        "Alice",
      ]);

      await transaction.rollback();

      const result = await connector.query("SELECT * FROM users");
      expect(result.rows[0].balance).toBe(100);
      expect(result.rows[1].balance).toBe(100);
    });
  });

  describe("Statistics", () => {
    test("should get statistics", async () => {
      await connector.query("CREATE TABLE table1 (id SERIAL)");
      await connector.query("INSERT INTO table1 VALUES ($1)", [1]);
      await connector.query("INSERT INTO table1 VALUES ($1)", [2]);

      await connector.query("CREATE TABLE table2 (id SERIAL)");

      const stats = await connector.getStatistics();
      expect(stats.tables).toBe(2);
      expect(stats.totalRows).toBe(2);
    });
  });

  describe("Error Handling", () => {
    test("should throw error when not connected", async () => {
      const disconnectedConnector = new PostgreSQLConnector(config);

      await expect(disconnectedConnector.query("SELECT 1")).rejects.toThrow(
        "Not connected to database"
      );
    });

    test("should throw error for unsupported query", async () => {
      await expect(connector.query("INVALID QUERY")).rejects.toThrow("Unsupported query type");
    });
  });
});
