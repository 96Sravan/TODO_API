const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const isValid = require("date-fns/isValid");
const format = require("date-fns/format");

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

/// Values

const priorityValues = [`HIGH`, `MEDIUM`, `LOW`];
const statusValues = [`TO DO`, `IN PROGRESS`, `DONE`];
const categoryValues = [`WORK`, `HOME`, `LEARNING`];

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
        response.send("Invalid Todo Priority");
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

  if (isValid(new Date(date))) {
    const newDate = format(new Date(date), "yyyy-MM-dd");
    const gettingDataThroughDate = `
        SELECT
            *
        FROM
            todo
        WHERE
            due_date = '${newDate}';
      `;
    const dbResponse = await db.all(gettingDataThroughDate);
    response.send(
      dbResponse.map((eachTodo) => snakeToCamelConversion(eachTodo))
    );
  } else {
    response.status(400);
    response.send("Invalid Due Date");
  }
});

///API 4
/// Posting to database

app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status, category, dueDate } = request.body;

  if (priorityValues.includes(priority)) {
    if (statusValues.includes(status)) {
      if (categoryValues.includes(category)) {
        if (isValid(new Date(dueDate))) {
          const enterNewDataToDbQuery = `
                INSERT INTO
                     todo(id, todo, priority, status, category, due_date)
                VALUES
                    (
                        ${id},
                        '${todo}',
                        '${priority}',
                        '${status}',
                        '${category}',
                        '${dueDate}'
                    );
                `;
          const dbResponse = await db.run(enterNewDataToDbQuery);
          response.send("Todo Successfully Added");
        } else {
          response.status(400);
          response.send("Invalid Due Date");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
    } else {
      response.status(400);
      response.send("Invalid Todo Status");
    }
  } else {
    response.status(400);
    response.send("Invalid Todo Priority");
  }
});

///API 5
/// Updating todo details

app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const { todo, priority, status, category, dueDate } = request.body;
  let dbResponse;

  switch (true) {
    /// SCENARIO : 1

    case todo !== undefined:
      const updateTodoQuery = `
            UPDATE
                todo
            SET
                todo = '${todo}'
            WHERE
                id = ${todoId};
          `;
      dbResponse = await db.run(updateTodoQuery);
      response.send("Todo Updated");
      break;

    /// SCENARIO : 2

    case priority !== undefined:
      if (priorityValues.includes(priority)) {
        const updatePriorityQuery = `
            UPDATE
                todo
            SET
                priority = '${priority}'
            WHERE
                id = ${todoId};
            `;
        dbResponse = await db.run(updatePriorityQuery);
        response.send("Priority Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }

      break;

    /// SCENARIO : 3
    case status !== undefined:
      if (statusValues.includes(status)) {
        const updateStatusQuery = `
            UPDATE
                todo
            SET
                status = '${status}'
            WHERE
                id = ${todoId};
          `;
        dbResponse = await db.run(updateStatusQuery);
        response.send("Status Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }

      break;

    /// SCENARIO : 4

    case category !== undefined:
      if (categoryValues.includes(category)) {
        const updateCategoryQuery = `
            UPDATE
                todo
            SET
                category = '${category}'
            WHERE
                id = ${todoId};
          `;
        dbResponse = await db.run(updateCategoryQuery);
        response.send("Category Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }

      break;

    /// SCENARIO : 5

    case dueDate !== undefined:
      if (isValid(new Date(dueDate))) {
        const updateDueDateQuery = `
            UPDATE
                todo
            SET
                due_date = '${dueDate}'
            WHERE
                id = ${todoId};
          `;
        dbResponse = await db.run(updateDueDateQuery);
        response.send("Due Date Updated");
      } else {
        response.status(400);
        response.send("Invalid Due Date");
      }
      break;
  }
});

///API 6
/// Removing Todo from DB

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deletingTodoFromDbQuery = `
    DELETE FROM
        todo
    WHERE
        id = ${todoId};
    `;
  const dbResponse = await db.run(deletingTodoFromDbQuery);
  response.send("Todo Deleted");
});

module.exports = app;
