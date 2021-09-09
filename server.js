const express = require("express");
const session = require("express-session");
const app = express();
const server = require("http").Server(app);
const io = require("socket.io")(server);
const { v4: uuidV4 } = require("uuid");
const mongoose = require("mongoose");
require("./auth");

const db_uri =
  "mongodb+srv://harish:No2$gold@participants.x9f8h.mongodb.net/Rooms?retryWrites=true&w=majority";
mongoose
  .connect(db_uri, { useNewUrlParser: true, useUnifiedTopology: true })
  .then((r) => {
    console.log("Connected to DB");
  })
  .catch((err) => {
    console.log("Error Connecting to DB");
    console.log(err);
  });

const Participants = require("./models/Participants.model");

const { ExpressPeerServer } = require("peer");
const passport = require("passport");
const peerServer = ExpressPeerServer(server, {
  debug: true,
});

app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(
  session({
    secret: "Asdaghsdu254SDfhsd@!231nas",
    resave: true,
    saveUninitialized: true,
  })
);
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
  res.render("room", {
    roomId: req.params.room,
    display_name: req.user.displayName,
    profilePicture: req.user.picture,
  });
});

app.get("/meetings/thanks", isLoggedIn, (req, res) => {
  res.render("thanks");
});

app.get("/data/participants/:room", (req, res) => {
  const room = req.params.room;
  Participants.find({ roomId: room }, (err, data) => {
    if (!err) res.send(data);
  });
});

io.on("connection", (socket) => {
  socket.on("join-room", (roomId, userId, user_name, profilePicture) => {
    socket.join(roomId);
    socket.broadcast.to(roomId).emit("user-connected", userId);

    Participants.create(
      {
        roomId: roomId,
        userName: user_name,
        profilePicture: profilePicture,
        userId: userId,
      },
      (err, data) => {}
    );

    io.to(roomId).emit("get-users", roomId);

    socket.on("disconnect", () => {
      Participants.findOneAndDelete(
        {
          userId: userId,
          roomId: roomId,
        },
        (err, data) => {
          if (err) console.log(err);
        }
      );
      socket.broadcast.to(roomId).emit("user-disconnected", userId, roomId);
      io.to(roomId).emit("get-users", roomId);
    });

    socket.on("message", (msg, roomId) => {
      io.to(roomId).emit("createMessage", msg);
    });
  });
});

server.listen(process.env.PORT || 3000);
