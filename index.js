import express from "express";
import bodyParser from "body-parser";
import pg from "pg";

const app = express();
const port = 3000;

const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "FamilyTravelProject",
  password: "jagritpass",
  port: 5432,
});
db.connect();


app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

let currentUserId = 1;


async function checkVisisted() {
  const result = await db.query("SELECT country_code FROM visited_countries WHERE user_id=($1)",[currentUserId]);
  let countries = [];
  result.rows.forEach((country) => {
    countries.push(country.country_code);
  });
  return countries;
}


async function getColorForUser(user_id){
  let color = await db.query("select color from user_table where id = ($1)",[user_id]);
  return color.rows[0];
}

// let names = await db.query("select * from user_table");
// let result = names.rows;
// console.log(result)

async function getCurrentUser(){
  let names = await db.query("select * from user_table");
  return names.rows;
}

app.get("/", async (req, res) => {
  const countries = await checkVisisted();
  let color_d = await getColorForUser(currentUserId);
  console.log(color_d.color);
  let COLOR = color_d.color
  
  let result = await getCurrentUser();

  res.render("index.ejs", {
    countries: countries,
    total: countries.length,
    users: result,
    color: COLOR,
  });
});

app.post("/add", async (req, res) => {
  const input = req.body.country;

  try {
    const result = await db.query(
      "SELECT country_code FROM countries WHERE LOWER(country_name) LIKE '%' || $1 || '%';",
      [input.toLowerCase()]
    );

    const data = result.rows[0];
    console.log(data);
    const countryCode = data.country_code;
   
    try {
      await db.query(
        "INSERT INTO visited_countries (country_code, user_id) VALUES ($1, $2)",
        [countryCode, currentUserId]
      );
      res.redirect("/");
    } catch (err) {
      console.log(err);
    }
  } catch (err) {
    console.log(err);
  }
});

app.post("/user", async (req, res) => {
  if (req.body.add === "new") {
  res.render("new.ejs");
} else {
  currentUserId = req.body.user;
  res.redirect("/");
}
});

app.post("/new", async (req, res) => {
  
  let new_name = req.body.name;
  let new_color = req.body.color;

  await db.query("insert into user_table (name,color) values($1,$2)",[new_name,new_color]);
  let curr_user = await db.query("select id from user_table where name = $1",[new_name]);

  currentUserId= curr_user.rows[0].id;
  res.redirect("/");
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});

