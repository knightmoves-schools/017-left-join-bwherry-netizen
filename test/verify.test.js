const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const assert = require('assert');

function runScript(db, script) {
  const sql = fs.readFileSync(script, 'utf8');
  return new Promise((resolve, reject) => {
    db.all(sql, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

const getEmployees = (db) => {
  const sql = `SELECT * FROM Employee`;
  return new Promise((resolve, reject) => {
    db.all(sql, (err, rows) => {
      if(err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

const getRoles = (db) => {
  const sql = `SELECT * FROM Roles`;
  return new Promise((resolve, reject) => {
    db.all(sql, (err, rows) => {
      if(err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

const getColumnFlat = (rows, key) => {
  let column = []
  rows.forEach((row) => {
    column.push(row[key]);
  });
  return column;
}

const buildEmployeeRoles = (employees, roles) => {
  let employeeRoles = []
  let roleName;
  employees.forEach((employee) => {
    roleName = roles.find((role) => role['ID'] === employee['ROLE_ID'])['ROLE_NAME']
    employeeRoles.push({
      "Job Title" : roleName,
      "Employee Name" : employee["NAME"],
    })
  });
  return employeeRoles;
}

const addMissingEmployeeRoles = (employeeRoles, roles) => {
  let missing = [];
  let empRoles = employeeRoles;

  for(let i = 0; i < roles.length; i++) {
    if(!employeeRoles.some((eRole) => eRole["Job Title"] === roles[i])) {
      missing.push(roles[i]);
    }
  }

  missing.forEach((missingRole) => {
    empRoles.push({
      "Job Title": missingRole,
      "Employee Name": null,
    })
  })

  return empRoles;
}

const sortByNameAlphabetically = (a, b) => {
  if(a["Employee Name"] > b["Employee Name"])
    return 1
  else if(a["Employee Name"] < b["Employee Name"])
    return -1
  else
    return 0
}

describe('the SQL in the `exercise.sql` file', () => {
  let db;
  let scriptPath;

  beforeAll(() => {
    const dbPath = path.resolve(__dirname, '..', 'lesson17.db');
    db = new sqlite3.Database(dbPath);

    scriptPath = path.resolve(__dirname, '..', 'exercise.sql');
  });

  afterAll(() => {
    db.close();
  });

 it('returns a table with every employee name in it titled "Employee Name" and all roles titled "Job Title" even if no employee is associated with the role', async () => {
    let results = await runScript(db, scriptPath);
    const employees = await getEmployees(db);
    const roles = await getRoles(db);
    let expected = buildEmployeeRoles(employees, roles);
    expected = addMissingEmployeeRoles(expected, getColumnFlat(roles, "ROLE_NAME"));

    results = results.sort(sortByNameAlphabetically);
    expected = expected.sort(sortByNameAlphabetically);
    expect(results).toEqual(expected);
  });
});
