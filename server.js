const express = require("express");
const session = require("express-session");
const app = express();
const server = require("http").Server(app);
const io = require("socket.io")(server);
const { v4: uuidV4 } = require("uuid");

require("./auth");

const { ExpressPeerServer } = require("peer");
const passport = require("passport");
const peerServer = ExpressPeerServer(server, {
  debug: true,
});

app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(session({ secret: "Asdaghsdu254SDfhsd@!231nas" }));
app.use(passport.initialize());
app.use(passport.session());
app.use("/peerjs", peerServer);

const isLoggedIn = (req, res, next) => {
  req.user ? next() : res.redirect("/login");
};

app.get("/login", (req, res) => {
  res.send(`<a href='/auth/google/oauth2'>Authenticate with Google</a>`);
});

app.get(
  "/auth/google/oauth2",
  passport.authenticate("google", { scope: ["email", "profile"] })
);

app.get(
  "/auth/google/oauth2/callback",
  passport.authenticate("google", {
    successRedirect: "/",
    failureRedirect: "/auth/faliure",
  })
);

app.get("/auth/faliure", (req, res) => {
  res.send("something went wrong..");
});

app.get("/logout", (req, res) => {
  req.logout();
  res.redirect("/");
});

app.get("/", (req, res) => {
  res.redirect(`/${uuidV4()}`);
});

app.get("/:room", isLoggedIn, (req, res) => {
  console.log(req.user);
  res.render("room", {
    roomId: req.params.room,
    display_name: req.user.displayName,
  });
});

app.get("/meetings/thanks", isLoggedIn, (req, res) => {
  res.render("thanks");
});

io.on("connection", (socket) => {
  socket.on("join-room", (roomId, userId, userName) => {
    socket.join(roomId);
    socket.broadcast.to(roomId).emit("user-connected", userId);

    socket.on("disconnect", () => {
      socket.broadcast.to(roomId).emit("user-disconnected", userId);
    });

    socket.on("message", (msg, roomId) => {
      io.to(roomId).emit("createMessage", msg);
    });
  });
});

server.listen(process.env.PORT || 3000);
