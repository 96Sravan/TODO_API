const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const isValid = require("date-fns/isValid");
const format = require("date-fns/format");

const sqlite3 = require("sqlite3");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "todoApplication.db");

let db = null;

const initializeServerAndDb = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });

    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};
initializeServerAndDb();

const statusCheckScenario = (query) => {
  return query.status !== undefined;
};

const priorityCheckScenario = (query) => {
  return query.priority !== undefined;
};

const priorityAndStatusCheckScenario = (query) => {
  return query.status !== undefined && query.priority !== undefined;
};

const searchCheckScenario = (query) => {
  return query.search_q !== undefined;
};

const categoryAndStatusCheckScenario = (query) => {
  return query.category !== undefined && query.status !== undefined;
};

const categoryCheckScenario = (query) => {
  return query.category !== undefined;
};

const categoryAndPriorityCheckScenario = (query) => {
  return query.category !== undefined && query.priority !== undefined;
};

/// Snake case TO Camel case Conversion
const snakeToCamelConversion = (dbObject) => {
  return {
    id: dbObject.id,
    todo: dbObject.todo,
    priority: dbObject.priority,
    status: dbObject.status,
    category: dbObject.category,
    dueDate: dbObject.due_date,
  };
};

/// Getting details through queries

app.get("/todos/", async (request, response) => {
  const { search_q = "", priority, category, status } = request.query;
  let dbResponse;
  switch (true) {
    /// SCENARIO : 3

    case priorityAndStatusCheckScenario(request.query):
      if (priority === `HIGH` || priority === `MEDIUM` || priority === `LOW`) {
        if (
          status === "TO DO" ||
          status === "IN PROGRESS" ||
          status === "DONE"
        ) {
          const gettingPriorityAndStatusQuery = `
            SELECT
                *
            FROM
                todo
            WHERE
                priority = '${priority}' AND status = '${status}';
            `;
          dbResponse = await db.all(gettingPriorityAndStatusQuery);
          response.send(
            dbResponse.map((eachTodo) => snakeToCamelConversion(eachTodo))
          );
        } else {
          response.status(400);
          response.send("Invalid Todo Status");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;

    /// SCENARIO : 4

    case searchCheckScenario(request.query):
      const gettingSearchQuery = `
            SELECT
                *
            FROM
                todo
            WHERE
                todo LIKE '%${search_q}%';
            `;
      dbResponse = await db.all(gettingSearchQuery);
      response.send(
        dbResponse.map((eachTodo) => snakeToCamelConversion(eachTodo))
      );
      break;

    /// SCENARIO : 5

    case categoryAndStatusCheckScenario(request.query):
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        if (
          status === "TO DO" ||
          status === "IN PROGRESS" ||
          status === "DONE"
        ) {
          const gettingCategoryAndStatusQuery = `
            SELECT
                *
            FROM
                todo
            WHERE
                category = '${category}' AND status = '${status}';
        `;
          dbResponse = await db.all(gettingCategoryAndStatusQuery);
          response.send(
            dbResponse.map((eachTodo) => snakeToCamelConversion(eachTodo))
          );
        } else {
          response.status(400);
          response.send("Invalid Todo Status");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }

      break;

    /// SCENARIO : 7

    case categoryAndPriorityCheckScenario(request.query):
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        if (
          priority === `HIGH` ||
          priority === `MEDIUM` ||
          priority === `LOW`
        ) {
          const gettingCategoryAndPriorityQuery = `
            SELECT
                *
            FROM
                todo
            WHERE
                category = '${category}' AND priority = '${priority}';
        `;
          dbResponse = await db.all(gettingCategoryAndPriorityQuery);
          response.send(
            dbResponse.map((eachTodo) => snakeToCamelConversion(eachTodo))
          );
        } else {
          response.status(400);
          response.send("Invalid Todo Priority");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }

      break;

    /// SCENARIO : 1
    case statusCheckScenario(request.query):
      if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
        const gettingStatusQuery = `
            SELECT
                *
            FROM
                todo
            WHERE
                status = '${status}';
            `;
        dbResponse = await db.all(gettingStatusQuery);
        response.send(
          dbResponse.map((eachTodo) => snakeToCamelConversion(eachTodo))
        );
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }
      break;
    /// SCENARIO : 2

    case priorityCheckScenario(request.query):
      if (priority === `HIGH` || priority === `MEDIUM` || priority === `LOW`) {
        const gettingPriorityQuery = `
            SELECT
                *
            FROM
                todo
            WHERE
                priority = '${priority}';
            `;
        dbResponse = await db.all(gettingPriorityQuery);
        response.send(
          dbResponse.map((eachTodo) => snakeToCamelConversion(eachTodo))
        );
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }
      break;

    /// SCENARIO : 6

    case categoryCheckScenario(request.query):
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        const gettingCategoryQuery = `
                SELECT
                    *
                FROM
                    todo
                WHERE
                    category = '${category}';
            `;
        dbResponse = await db.all(gettingCategoryQuery);
        response.send(
          dbResponse.map((eachTodo) => snakeToCamelConversion(eachTodo))
        );
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;
  }
});

/// API 2
/// Getting data by using ID

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;

  const gettingDataById = `
    SELECT
        *
    FROM
        todo
    WHERE
        id = ${todoId};
  `;
  const dbResponse = await db.get(gettingDataById);
  response.send(snakeToCamelConversion(dbResponse));
});

/// API 3
///A specific due date

app.get("/agenda/", async (request, response) => {
  const { date } = request.query;
  const newDate = format(new Date(date), "yyyy-MM-dd");

  if (isValid(new Date(newDate))) {
    const gettingDataThroughDate = `
        SELECT
            *
        FROM
            todo
        WHERE
            due_date = '${newDate}';
      `;
    const dbResponse = await db.all(gettingDataThroughDate);
    if (dbResponse === {}) {
      response.status(400);
      response.send("Invalid Due Date");
    } else {
      response.send(
        dbResponse.map((eachTodo) => snakeToCamelConversion(eachTodo))
      );
    }
  } else {
    response.status(400);
    response.send("Invalid Due Date");
  }
});
