# SQL parser

This application will parse basic sql queries with nested conditionals

# Prerequisites

- Must have node installed

# Running the app

To get started run the following commands

1. Install dependencies

   ```bash
   npm intall
   ```

1. Build the repo

   ```bash
   npm run build
   ```

1. cd into build

```bash
cd build
```

1. Start the SQL parser

   ```bash
   node index.js
   ```

1. Enter a query that applies to the data.json file (currently the only supported table is `user`)

   ```sql
    SELECT  "firstName","lastName", "age", "eyeColor"  FROM  user  WHERE  ("eyeColor" = "blue" AND gender != "female") OR ("eyeColor" = "blue" AND gender != "male");
   ```

1. If you want to get an error then type something in that is wrong

   ```sql
    SELECT  "first Name","lastName", "age", "eyeColor"  FROM  user  WHERE  ("eyeColor" = "blue" AND gender != "female") OR ("eyeColor" = "blue" AND gender != "male");
   ```

## Examples
