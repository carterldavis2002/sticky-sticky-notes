const express = require("express");
const app = express();

app.use("/public", express.static(__dirname + "/public"));

app.get("/", (_, res) => res.sendFile(__dirname + "/views/index.html"));

app.listen(process.env.PORT || 5000);