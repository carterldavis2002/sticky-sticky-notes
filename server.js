const express = require("express");
const app = express();

const path = require("path");

app.use("/public", express.static(path.resolve("dist"))); 

app.get("/", (_, res) => res.sendFile(path.resolve(__dirname, "dist", "index.html")));

app.listen(process.env.PORT || 3000);